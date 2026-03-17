import type { IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';
import type { IProvider } from '../../types';
import { buildMeta, buildResultItems } from '../../shared/utils';
import { queryWithFallback, DEFAULT_TIMEOUT_MS } from '../../shared/fallback';
import { normalizeStates, normalizeCities } from './ibge.normalize';

const VALID_UFS = new Set([
	'AC', 'AL', 'AM', 'AP', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MG', 'MS',
	'MT', 'PA', 'PB', 'PE', 'PI', 'PR', 'RJ', 'RN', 'RO', 'RR', 'RS', 'SC',
	'SE', 'SP', 'TO',
]);

const STATES_PROVIDERS: IProvider[] = [
	{ name: 'brasilapi', url: 'https://brasilapi.com.br/api/ibge/uf/v1' },
	{ name: 'ibge', url: 'https://servicodados.ibge.gov.br/api/v1/localidades/estados' },
];

/**
 * Builds provider list for a cities query.
 *
 * @param uf - Validated state abbreviation (uppercase).
 * @returns Ordered list of providers.
 */
function buildCitiesProviders(uf: string): IProvider[] {
	return [
		{ name: 'brasilapi', url: `https://brasilapi.com.br/api/ibge/municipios/v1/${encodeURIComponent(uf)}?providers=dados-abertos-br,gov,wikipedia` },
		{ name: 'ibge', url: `https://servicodados.ibge.gov.br/api/v1/localidades/estados/${encodeURIComponent(uf)}/municipios` },
	];
}

/**
 * Lists all Brazilian states (UFs) with multi-provider fallback.
 *
 * @param context - n8n execution context.
 * @param itemIndex - Current item index.
 * @returns One n8n item per state (27 total).
 * @throws {NodeOperationError} If all providers fail.
 */
export async function ibgeStates(
	context: IExecuteFunctions,
	itemIndex: number,
): Promise<INodeExecutionData[]> {
	const includeRaw = context.getNodeParameter('includeRaw', itemIndex, false) as boolean;
	const timeoutMs = context.getNodeParameter('timeout', itemIndex, DEFAULT_TIMEOUT_MS) as number;

	const result = await queryWithFallback(context, STATES_PROVIDERS, timeoutMs);
	const states = normalizeStates(result.data, result.provider);
	const rawItems = Array.isArray(result.data) ? result.data as Array<Record<string, unknown>> : [];
	const meta = buildMeta(result.provider, 'all', result.errors, result.rateLimited, result.retryAfterMs);

	return buildResultItems(states as unknown as Array<Record<string, unknown>>, meta, rawItems, includeRaw, itemIndex) as INodeExecutionData[];
}

/**
 * Lists all municipalities for a given state with multi-provider fallback.
 *
 * @param context - n8n execution context.
 * @param itemIndex - Current item index.
 * @returns One n8n item per municipality.
 * @throws {NodeOperationError} If the UF is invalid or all providers fail.
 */
export async function ibgeCities(
	context: IExecuteFunctions,
	itemIndex: number,
): Promise<INodeExecutionData[]> {
	const ufInput = (context.getNodeParameter('uf', itemIndex) as string).toUpperCase().trim();
	const includeRaw = context.getNodeParameter('includeRaw', itemIndex, false) as boolean;
	const timeoutMs = context.getNodeParameter('timeout', itemIndex, DEFAULT_TIMEOUT_MS) as number;

	if (!VALID_UFS.has(ufInput)) {
		throw new NodeOperationError(
			context.getNode(),
			`Invalid state: "${ufInput}". Must be a valid 2-letter Brazilian state abbreviation`,
			{ itemIndex },
		);
	}

	const providers = buildCitiesProviders(ufInput);
	const result = await queryWithFallback(context, providers, timeoutMs);
	const cities = normalizeCities(result.data, result.provider);
	const rawItems = Array.isArray(result.data) ? result.data as Array<Record<string, unknown>> : [];
	const meta = buildMeta(result.provider, ufInput, result.errors, result.rateLimited, result.retryAfterMs);

	return buildResultItems(cities as unknown as Array<Record<string, unknown>>, meta, rawItems, includeRaw, itemIndex) as INodeExecutionData[];
}

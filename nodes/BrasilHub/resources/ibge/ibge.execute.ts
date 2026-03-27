import type { IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';
import type { IProvider } from '../../types';
import { executeStandardList } from '../../shared/execute-helpers';
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
 * Delegates to {@link executeStandardList} facade.
 *
 * @param context - n8n execution context.
 * @param itemIndex - Current item index.
 * @returns One n8n item per state (27 total).
 * @throws If all providers fail.
 */
export async function ibgeStates(
	context: IExecuteFunctions,
	itemIndex: number,
): Promise<INodeExecutionData[]> {
	return executeStandardList(context, itemIndex, {
		buildProviders: () => STATES_PROVIDERS,
		normalize: normalizeStates,
		queryKey: 'all',
	});
}

/**
 * Lists all municipalities for a given state with multi-provider fallback.
 *
 * Validates UF, then delegates to {@link executeStandardList} facade.
 *
 * @param context - n8n execution context.
 * @param itemIndex - Current item index.
 * @returns One n8n item per municipality.
 * @throws If the UF is invalid or all providers fail.
 */
export async function ibgeCities(
	context: IExecuteFunctions,
	itemIndex: number,
): Promise<INodeExecutionData[]> {
	const ufInput = (context.getNodeParameter('uf', itemIndex) as string).toUpperCase().trim();

	if (!VALID_UFS.has(ufInput)) {
		throw new NodeOperationError(
			context.getNode(),
			`Invalid state: "${ufInput}". Must be a valid 2-letter Brazilian state abbreviation`,
			{ itemIndex },
		);
	}

	return executeStandardList(context, itemIndex, {
		buildProviders: () => buildCitiesProviders(ufInput),
		normalize: normalizeCities,
		queryKey: ufInput,
	});
}

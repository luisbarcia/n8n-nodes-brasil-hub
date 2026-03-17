import type { IExecuteFunctions, INodeExecutionData, IDataObject } from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';
import type { IProvider } from '../../types';
import { buildMeta, buildResultItem } from '../../shared/utils';
import { validateCnpj, sanitizeCnpj } from '../../shared/validators';
import { queryWithFallback, DEFAULT_TIMEOUT_MS } from '../../shared/fallback';
import { normalizeCnpj } from './cnpj.normalize';

const CNPJ_PROVIDERS: IProvider[] = [
	{ name: 'brasilapi', url: 'https://brasilapi.com.br/api/cnpj/v1/' },
	{ name: 'cnpjws', url: 'https://publica.cnpj.ws/cnpj/' },
	{ name: 'receitaws', url: 'https://receitaws.com.br/v1/cnpj/' },
	{ name: 'minhareceita', url: 'https://minhareceita.org/' },
	{ name: 'opencnpjorg', url: 'https://api.opencnpj.org/' },
	{ name: 'opencnpjcom', url: 'https://kitana.opencnpj.com/cnpj/' },
	{ name: 'cnpja', url: 'https://open.cnpja.com/office/' },
];

/** Appends the sanitized CNPJ to each provider base URL. */
function buildProviders(cnpj: string): IProvider[] {
	return CNPJ_PROVIDERS.map((p) => ({ name: p.name, url: `${p.url}${cnpj}` }));
}

/**
 * Executes a CNPJ query against public APIs with multi-provider fallback.
 *
 * Sanitizes input, validates length and checksum, queries providers in order
 * (BrasilAPI → CNPJ.ws → ReceitaWS), normalizes the response, and attaches metadata.
 * Optionally includes the raw provider response.
 *
 * @param context - n8n execution context.
 * @param itemIndex - Current item index for parameter retrieval and item pairing.
 * @returns Array of n8n execution data with normalized CNPJ result as JSON.
 * @throws {NodeOperationError} If the CNPJ is invalid (wrong length or checksum) or all providers fail.
 */
export async function cnpjQuery(
	context: IExecuteFunctions,
	itemIndex: number,
): Promise<INodeExecutionData[]> {
	const cnpjInput = context.getNodeParameter('cnpj', itemIndex) as string;
	const simplify = context.getNodeParameter('simplify', itemIndex, true) as boolean;
	const includeRaw = context.getNodeParameter('includeRaw', itemIndex, false) as boolean;
	const timeoutMs = context.getNodeParameter('timeout', itemIndex, DEFAULT_TIMEOUT_MS) as number;
	const cnpj = sanitizeCnpj(cnpjInput);

	if (cnpj.length !== 14) {
		throw new NodeOperationError(context.getNode(), 'CNPJ must have 14 digits', { itemIndex });
	}

	if (!validateCnpj(cnpj).valid) {
		throw new NodeOperationError(context.getNode(), 'Invalid CNPJ checksum', { itemIndex });
	}

	const providers = buildProviders(cnpj);
	const result = await queryWithFallback(context, providers, timeoutMs);

	const full = normalizeCnpj(result.data, result.provider);
	const meta = buildMeta(result.provider, cnpj, result.errors);

	const normalized = simplify
		? { cnpj: full.cnpj, razao_social: full.razao_social, nome_fantasia: full.nome_fantasia, situacao: full.situacao, data_abertura: full.data_abertura, porte: full.porte }
		: full;

	return buildResultItem(normalized as unknown as Record<string, unknown>, meta, result.data, includeRaw, itemIndex) as INodeExecutionData[];
}

/**
 * Validates a CNPJ number locally using the Receita Federal checksum algorithm.
 *
 * No API call is made. Returns `{valid, formatted, input}` as n8n execution data.
 *
 * @param context - n8n execution context.
 * @param itemIndex - Current item index for parameter retrieval and item pairing.
 * @returns Array of n8n execution data with validation result as JSON.
 */
export async function cnpjValidate(
	context: IExecuteFunctions,
	itemIndex: number,
): Promise<INodeExecutionData[]> {
	const cnpjInput = context.getNodeParameter('cnpj', itemIndex) as string;
	const result = validateCnpj(cnpjInput);

	return [{
		json: result as unknown as IDataObject,
		pairedItem: { item: itemIndex },
	}];
}

import type { IExecuteFunctions, INodeExecutionData, IDataObject } from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';
import type { IProvider, IMeta } from '../../types';
import { validateCep, sanitizeCep } from '../../shared/validators';
import { queryWithFallback } from '../../shared/fallback';
import { normalizeCep } from './cep.normalize';

const CEP_PROVIDERS: IProvider[] = [
	{ name: 'brasilapi', url: 'https://brasilapi.com.br/api/cep/v2/' },
	{ name: 'viacep', url: 'https://viacep.com.br/ws/' },
	{ name: 'opencep', url: 'https://opencep.com/v1/' },
];

/** Appends the sanitized CEP to each provider base URL (ViaCEP needs `/json` suffix). */
function buildProviders(cep: string): IProvider[] {
	return CEP_PROVIDERS.map((p) => {
		const suffix = p.name === 'viacep' ? `${cep}/json` : cep;
		return { name: p.name, url: `${p.url}${suffix}` };
	});
}

/**
 * Executes a CEP query against public APIs with multi-provider fallback.
 *
 * Sanitizes input, validates length and format, queries providers in order
 * (BrasilAPI → ViaCEP → OpenCEP), normalizes the response, and attaches metadata.
 * Optionally includes the raw provider response.
 *
 * @param context - n8n execution context.
 * @param itemIndex - Current item index for parameter retrieval and item pairing.
 * @returns Array of n8n execution data with normalized CEP result as JSON.
 * @throws {NodeOperationError} If the CEP is invalid (wrong length or all zeros) or all providers fail.
 */
export async function cepQuery(
	context: IExecuteFunctions,
	itemIndex: number,
): Promise<INodeExecutionData[]> {
	const cepInput = context.getNodeParameter('cep', itemIndex) as string;
	const includeRaw = context.getNodeParameter('includeRaw', itemIndex, false) as boolean;
	const cep = sanitizeCep(cepInput);

	if (cep.length !== 8) {
		throw new NodeOperationError(context.getNode(), 'CEP must have 8 digits', { itemIndex });
	}

	if (!validateCep(cep).valid) {
		throw new NodeOperationError(context.getNode(), 'Invalid CEP', { itemIndex });
	}

	const providers = buildProviders(cep);
	const result = await queryWithFallback(context, providers);

	const normalized = normalizeCep(result.data, result.provider);

	const meta: IMeta = {
		provider: result.provider,
		query: cep,
		queried_at: new Date().toISOString(),
		strategy: result.errors.length > 0 ? 'fallback' : 'direct',
		...(result.errors.length > 0 && { errors: result.errors }),
	};

	return [{
		json: {
			...normalized,
			_meta: meta,
			...(includeRaw && { _raw: result.data as IDataObject }),
		} as IDataObject,
		pairedItem: { item: itemIndex },
	}];
}

/**
 * Validates a CEP number locally by checking format and rejecting all-zero values.
 *
 * No API call is made. Returns `{valid, formatted, input}` as n8n execution data.
 *
 * @param context - n8n execution context.
 * @param itemIndex - Current item index for parameter retrieval and item pairing.
 * @returns Array of n8n execution data with validation result as JSON.
 */
export async function cepValidate(
	context: IExecuteFunctions,
	itemIndex: number,
): Promise<INodeExecutionData[]> {
	const cepInput = context.getNodeParameter('cep', itemIndex) as string;
	const result = validateCep(cepInput);

	return [{
		json: result as unknown as IDataObject,
		pairedItem: { item: itemIndex },
	}];
}

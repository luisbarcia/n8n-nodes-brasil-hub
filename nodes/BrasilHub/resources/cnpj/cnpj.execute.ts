import type { IExecuteFunctions, INodeExecutionData, IDataObject } from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';
import type { IProvider, ICnpjResult } from '../../types';
import { executeStandardQuery } from '../../shared/execute-helpers';
import { validateCnpj, sanitizeCnpj } from '../../shared/validators';
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
	return CNPJ_PROVIDERS.map((p) => ({ name: p.name, url: `${p.url}${encodeURIComponent(cnpj)}` }));
}

/** Formats a full CNPJ result into simplified output (6 key fields). */
function formatSimplified(full: ICnpjResult): Record<string, unknown> {
	return {
		cnpj: full.cnpj,
		razao_social: full.razao_social,
		nome_fantasia: full.nome_fantasia,
		situacao: full.situacao,
		data_abertura: full.data_abertura,
		porte: full.porte,
	};
}

/** Formats a full CNPJ result into AI-friendly flat English output (8 key fields). */
function formatAiSummary(full: ICnpjResult): Record<string, unknown> {
	return {
		cnpj: full.cnpj,
		company: full.razao_social,
		trade_name: full.nome_fantasia,
		status: full.situacao,
		since: full.data_abertura,
		size: full.porte,
		activity: full.atividade_principal ? `${full.atividade_principal.descricao} (${full.atividade_principal.codigo})` : '',
		city: full.endereco ? `${full.endereco.municipio}/${full.endereco.uf}` : '',
	};
}

/**
 * Executes a CNPJ query against public APIs with multi-provider fallback.
 *
 * Sanitizes input, validates length and checksum, then delegates to
 * {@link executeStandardQuery} facade with output mode post-processing
 * (BrasilAPI → CNPJ.ws → ReceitaWS → MinhaReceita → OpenCNPJ.org → OpenCNPJ.com → CNPJA).
 *
 * @param context - n8n execution context.
 * @param itemIndex - Current item index for parameter retrieval and item pairing.
 * @returns Array of n8n execution data with normalized CNPJ result as JSON.
 * @throws If the CNPJ is invalid (wrong length or checksum) or all providers fail.
 */
export async function cnpjQuery(
	context: IExecuteFunctions,
	itemIndex: number,
): Promise<INodeExecutionData[]> {
	const cnpjInput = context.getNodeParameter('cnpj', itemIndex) as string;
	const simplify = context.getNodeParameter('simplify', itemIndex, true) as boolean;
	const cnpj = sanitizeCnpj(cnpjInput);

	if (cnpj.length !== 14) {
		throw new NodeOperationError(context.getNode(), 'CNPJ must have 14 digits', { itemIndex });
	}

	if (!validateCnpj(cnpj).valid) {
		throw new NodeOperationError(context.getNode(), 'Invalid CNPJ checksum', { itemIndex });
	}

	const outputMode = simplify ? 'simplified' : (context.getNodeParameter('outputMode', itemIndex, 'full') as string);

	return executeStandardQuery(context, itemIndex, {
		buildProviders: () => buildProviders(cnpj),
		normalize: normalizeCnpj,
		queryKey: cnpj,
		postProcess: (full) => {
			if (outputMode === 'simplified') return formatSimplified(full);
			if (outputMode === 'aiSummary') return formatAiSummary(full);
			return { ...full };
		},
		fallbackOptions: {
			validateResponse: (data) => {
				if (data == null || typeof data !== 'object') {
					throw new Error('Provider returned empty or non-object response');
				}
				const d = data as Record<string, unknown>;
				if (d.message || d.type === 'NOT_FOUND' || d.status === 'ERROR') {
					throw new Error(`Provider returned error: ${String(d.message ?? d.type ?? 'unknown')}`);
				}
			},
			isRetryable: (error) => {
				const code = Number((error as Record<string, unknown>)?.httpCode);
				return code !== 404;
			},
		},
	});
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

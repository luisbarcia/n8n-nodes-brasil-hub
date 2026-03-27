import type { IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';
import type { IProvider } from '../../types';
import { executeStandardQuery, executeStandardList } from '../../shared/execute-helpers';
import { normalizeTaxa, normalizeTaxas } from './taxas.normalize';

/** Pattern for validating rate codes (1-50 alphanumeric characters, hyphens, underscores). */
const RATE_CODE_PATTERN = /^[A-Za-z0-9_-]{1,50}$/;

/** Single-provider list for BrasilAPI taxas endpoint. */
const LIST_PROVIDERS: IProvider[] = [
	{ name: 'brasilapi', url: 'https://brasilapi.com.br/api/taxas/v1' },
];

/**
 * Lists all available Brazilian interest rates from BrasilAPI.
 *
 * Returns one n8n item per rate (Selic, CDI, IPCA, etc.).
 * Delegates to {@link executeStandardList} facade for consistent handling.
 *
 * @param context - n8n execution context.
 * @param itemIndex - Current item index for parameter retrieval and item pairing.
 * @returns Array of n8n execution data (one per rate).
 */
export async function taxasList(
	context: IExecuteFunctions,
	itemIndex: number,
): Promise<INodeExecutionData[]> {
	return executeStandardList(context, itemIndex, {
		buildProviders: () => LIST_PROVIDERS,
		normalize: normalizeTaxas,
		queryKey: 'taxas',
	});
}

/**
 * Queries a specific Brazilian interest rate by code from BrasilAPI.
 *
 * Validates that the rate code matches the expected format before delegating
 * to {@link executeStandardQuery} facade.
 *
 * @param context - n8n execution context.
 * @param itemIndex - Current item index for parameter retrieval and item pairing.
 * @returns Single n8n item with the normalized rate data.
 * @throws If the rate code is empty or invalid.
 */
export async function taxasQuery(
	context: IExecuteFunctions,
	itemIndex: number,
): Promise<INodeExecutionData[]> {
	const rawRateCode = context.getNodeParameter('rateCode', itemIndex);
	const rateCode = (rawRateCode != null ? String(rawRateCode) : '').trim();

	if (!rateCode || !RATE_CODE_PATTERN.test(rateCode)) {
		throw new NodeOperationError(
			context.getNode(),
			'Invalid rate code: must be 1-50 alphanumeric characters (e.g. Selic, CDI, IPCA)',
			{ itemIndex },
		);
	}

	return executeStandardQuery(context, itemIndex, {
		buildProviders: () => [
			{ name: 'brasilapi', url: `https://brasilapi.com.br/api/taxas/v1/${encodeURIComponent(rateCode)}` },
		],
		normalize: normalizeTaxa,
		queryKey: rateCode,
	});
}

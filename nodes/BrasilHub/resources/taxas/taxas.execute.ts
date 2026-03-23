import type { IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';
import { buildMeta, buildResultItems, buildResultItem, readCommonParams } from '../../shared/utils';
import { queryWithFallback } from '../../shared/fallback';
import type { IProvider } from '../../types';
import { normalizeTaxa, normalizeTaxas } from './taxas.normalize';

/** Pattern for validating rate codes (1-50 alphanumeric characters, hyphens, underscores). */
const RATE_CODE_PATTERN = /^[A-Za-z0-9_-]{1,50}$/;

/**
 * Lists all available Brazilian interest rates from BrasilAPI.
 *
 * Returns one n8n item per rate (Selic, CDI, IPCA, etc.).
 * Uses queryWithFallback with a single provider for consistent
 * rate-limit awareness and error handling.
 *
 * @param context - n8n execution context.
 * @param itemIndex - Current item index for parameter retrieval and item pairing.
 * @returns Array of n8n execution data (one per rate).
 */
export async function taxasList(
	context: IExecuteFunctions,
	itemIndex: number,
): Promise<INodeExecutionData[]> {
	const { includeRaw, timeoutMs } = readCommonParams(context, itemIndex);

	const providers: IProvider[] = [
		{ name: 'brasilapi', url: 'https://brasilapi.com.br/api/taxas/v1' },
	];
	const result = await queryWithFallback(context, providers, timeoutMs);

	const taxas = normalizeTaxas(result.data);
	const rawItems = Array.isArray(result.data) ? result.data as Array<Record<string, unknown>> : [];
	const meta = buildMeta(result.provider, 'taxas', result.errors, result.rateLimited, result.retryAfterMs);

	return buildResultItems(taxas, meta, rawItems, includeRaw, itemIndex);
}

/**
 * Queries a specific Brazilian interest rate by code from BrasilAPI.
 *
 * Validates that the rate code matches the expected format before making
 * the API call. Uses queryWithFallback with a single provider.
 *
 * @param context - n8n execution context.
 * @param itemIndex - Current item index for parameter retrieval and item pairing.
 * @returns Single n8n item with the normalized rate data.
 * @throws {NodeOperationError} If the rate code is empty or invalid.
 */
export async function taxasQuery(
	context: IExecuteFunctions,
	itemIndex: number,
): Promise<INodeExecutionData[]> {
	const rateCode = String(context.getNodeParameter('rateCode', itemIndex) ?? '').trim();
	const { includeRaw, timeoutMs } = readCommonParams(context, itemIndex);

	if (!rateCode || !RATE_CODE_PATTERN.test(rateCode)) {
		throw new NodeOperationError(
			context.getNode(),
			'Invalid rate code: must be 1-50 alphanumeric characters (e.g. Selic, CDI, IPCA)',
			{ itemIndex },
		);
	}

	const providers: IProvider[] = [
		{ name: 'brasilapi', url: `https://brasilapi.com.br/api/taxas/v1/${encodeURIComponent(rateCode)}` },
	];
	const result = await queryWithFallback(context, providers, timeoutMs);

	const taxa = normalizeTaxa(result.data);
	const meta = buildMeta(result.provider, rateCode, result.errors, result.rateLimited, result.retryAfterMs);

	return buildResultItem(taxa, meta, result.data, includeRaw, itemIndex);
}

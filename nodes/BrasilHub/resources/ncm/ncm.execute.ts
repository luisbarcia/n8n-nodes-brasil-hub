import type { IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';
import { buildMeta, buildResultItem, buildResultItems, readCommonParams } from '../../shared/utils';
import { queryWithFallback } from '../../shared/fallback';
import { normalizeNcm, normalizeNcmList } from './ncm.normalize';

/**
 * Queries a single NCM code from BrasilAPI.
 *
 * @param context - n8n execution context.
 * @param itemIndex - Current item index.
 * @returns Single n8n item with normalized NCM data.
 * @throws {NodeOperationError} If NCM code is empty or the API fails.
 */
export async function ncmQuery(
	context: IExecuteFunctions,
	itemIndex: number,
): Promise<INodeExecutionData[]> {
	const ncmCode = (context.getNodeParameter('ncmCode', itemIndex) as string).trim();
	const { includeRaw, timeoutMs } = readCommonParams(context, itemIndex);

	if (!ncmCode) {
		throw new NodeOperationError(context.getNode(), 'NCM code is required', { itemIndex });
	}

	const providers = [
		{ name: 'brasilapi', url: `https://brasilapi.com.br/api/ncm/v1/${encodeURIComponent(ncmCode)}` },
	];
	const result = await queryWithFallback(context, providers, timeoutMs);
	const normalized = normalizeNcm(result.data);
	const meta = buildMeta(result.provider, ncmCode, result.errors, result.rateLimited, result.retryAfterMs);

	return buildResultItem(normalized, meta, result.data, includeRaw, itemIndex);
}

/**
 * Searches NCM codes by description keyword from BrasilAPI.
 *
 * @param context - n8n execution context.
 * @param itemIndex - Current item index.
 * @returns One n8n item per matching NCM code.
 * @throws {NodeOperationError} If search term is too short or the API fails.
 */
export async function ncmSearch(
	context: IExecuteFunctions,
	itemIndex: number,
): Promise<INodeExecutionData[]> {
	const searchTerm = (context.getNodeParameter('searchTerm', itemIndex) as string).trim();
	const { includeRaw, timeoutMs } = readCommonParams(context, itemIndex);

	if (searchTerm.length < 3) {
		throw new NodeOperationError(
			context.getNode(),
			'Search term must be at least 3 characters',
			{ itemIndex },
		);
	}

	const providers = [
		{ name: 'brasilapi', url: `https://brasilapi.com.br/api/ncm/v1?search=${encodeURIComponent(searchTerm)}` },
	];
	const result = await queryWithFallback(context, providers, timeoutMs);
	const items = normalizeNcmList(result.data);
	const rawItems = Array.isArray(result.data) ? result.data as Array<Record<string, unknown>> : [];
	const meta = buildMeta(result.provider, searchTerm, result.errors, result.rateLimited, result.retryAfterMs);

	return buildResultItems(items, meta, rawItems, includeRaw, itemIndex);
}

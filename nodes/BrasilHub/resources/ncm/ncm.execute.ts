import type { IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';
import { executeStandardQuery, executeStandardList } from '../../shared/execute-helpers';
import { normalizeNcm, normalizeNcmList } from './ncm.normalize';

/**
 * Queries a single NCM code from BrasilAPI.
 *
 * Validates the code is not empty, then delegates to {@link executeStandardQuery} facade.
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

	if (!ncmCode) {
		throw new NodeOperationError(context.getNode(), 'NCM code is required', { itemIndex });
	}

	return executeStandardQuery(context, itemIndex, {
		buildProviders: () => [
			{ name: 'brasilapi', url: `https://brasilapi.com.br/api/ncm/v1/${encodeURIComponent(ncmCode)}` },
		],
		normalize: normalizeNcm,
		queryKey: ncmCode,
	});
}

/**
 * Searches NCM codes by description keyword from BrasilAPI.
 *
 * Validates minimum term length, then delegates to {@link executeStandardList} facade.
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

	if (searchTerm.length < 3) {
		throw new NodeOperationError(
			context.getNode(),
			'Search term must be at least 3 characters',
			{ itemIndex },
		);
	}

	return executeStandardList(context, itemIndex, {
		buildProviders: () => [
			{ name: 'brasilapi', url: `https://brasilapi.com.br/api/ncm/v1?search=${encodeURIComponent(searchTerm)}` },
		],
		normalize: normalizeNcmList,
		queryKey: searchTerm,
	});
}

import type { IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';
import type { IProvider } from '../../types';
import { buildMeta, buildResultItem, reorderProviders } from '../../shared/utils';
import { queryWithFallback, DEFAULT_TIMEOUT_MS } from '../../shared/fallback';
import { normalizeDdd } from './ddd.normalize';

/**
 * Queries DDD (area code) data with multi-provider fallback.
 *
 * Validates DDD is a 2-digit number in range 11–99, then fetches
 * state and cities for that area code (BrasilAPI → municipios-brasileiros).
 *
 * @param context - n8n execution context.
 * @param itemIndex - Current item index for parameter retrieval and item pairing.
 * @returns Array of n8n execution data with normalized DDD result.
 * @throws {NodeOperationError} If the DDD is invalid or the provider fails.
 */
export async function dddQuery(
	context: IExecuteFunctions,
	itemIndex: number,
): Promise<INodeExecutionData[]> {
	const dddInput = context.getNodeParameter('ddd', itemIndex) as string;
	const includeRaw = context.getNodeParameter('includeRaw', itemIndex, false) as boolean;
	const timeoutMs = context.getNodeParameter('timeout', itemIndex, DEFAULT_TIMEOUT_MS) as number;
	const ddd = Number.parseInt(dddInput, 10);

	if (!Number.isInteger(ddd) || ddd < 11 || ddd > 99) {
		throw new NodeOperationError(
			context.getNode(),
			'Invalid DDD: must be a 2-digit area code between 11 and 99',
			{ itemIndex },
		);
	}

	const primaryProvider = context.getNodeParameter('primaryProvider', itemIndex, 'auto') as string;
	const providers: IProvider[] = [
		{ name: 'brasilapi', url: `https://brasilapi.com.br/api/ddd/v1/${ddd}` },
		{ name: 'municipios', url: 'https://raw.githubusercontent.com/kelvins/municipios-brasileiros/main/json/municipios.json' },
	];

	const result = await queryWithFallback(context, reorderProviders(providers, primaryProvider), timeoutMs);
	const normalized = normalizeDdd(result.data, result.provider, ddd);

	const meta = buildMeta(result.provider, String(ddd), result.errors, result.rateLimited, result.retryAfterMs);

	return buildResultItem(normalized as unknown as Record<string, unknown>, meta, result.data, includeRaw, itemIndex) as INodeExecutionData[];
}

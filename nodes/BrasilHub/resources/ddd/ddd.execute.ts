import type { IExecuteFunctions, INodeExecutionData, IDataObject } from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';
import type { IProvider } from '../../types';
import { buildMeta } from '../../shared/utils';
import { queryWithFallback } from '../../shared/fallback';
import { normalizeDdd } from './ddd.normalize';

/**
 * Queries DDD (area code) data from BrasilAPI.
 *
 * Validates DDD is a 2-digit number in range 11–99, then fetches
 * state and cities for that area code. Single provider (no fallback).
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
	const ddd = Number.parseInt(dddInput, 10);

	if (!Number.isInteger(ddd) || ddd < 11 || ddd > 99) {
		throw new NodeOperationError(
			context.getNode(),
			'Invalid DDD: must be a 2-digit area code between 11 and 99',
			{ itemIndex },
		);
	}

	const providers: IProvider[] = [
		{ name: 'brasilapi', url: `https://brasilapi.com.br/api/ddd/v1/${ddd}` },
	];

	const result = await queryWithFallback(context, providers);
	const normalized = normalizeDdd(result.data, result.provider);

	const meta = buildMeta(result.provider, String(ddd), result.errors);

	return [{
		json: {
			...normalized,
			_meta: meta,
			...(includeRaw && { _raw: result.data as IDataObject }),
		} as IDataObject,
		pairedItem: { item: itemIndex },
	}];
}

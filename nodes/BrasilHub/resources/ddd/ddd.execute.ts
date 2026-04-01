import type { IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';
import { executeStandardQuery } from '../../shared/execute-helpers';
import { normalizeDdd } from './ddd.normalize';

/**
 * Queries DDD (area code) data with multi-provider fallback.
 *
 * Validates DDD is a 2-digit number in range 11–99, then delegates to
 * {@link executeStandardQuery} facade (BrasilAPI → municipios-brasileiros).
 *
 * @param context - n8n execution context.
 * @param itemIndex - Current item index for parameter retrieval and item pairing.
 * @returns Array of n8n execution data with normalized DDD result.
 * @throws If the DDD is invalid or the provider fails.
 */
export async function dddQuery(
	context: IExecuteFunctions,
	itemIndex: number,
): Promise<INodeExecutionData[]> {
	const dddInput = context.getNodeParameter('ddd', itemIndex) as string;
	const ddd = Number.parseInt(dddInput, 10);

	if (!Number.isInteger(ddd) || ddd < 11 || ddd > 99) {
		throw new NodeOperationError(
			context.getNode(),
			'Invalid DDD: must be a 2-digit area code between 11 and 99',
			{ itemIndex },
		);
	}

	return executeStandardQuery(context, itemIndex, {
		buildProviders: () => [
			{ name: 'brasilapi', url: `https://brasilapi.com.br/api/ddd/v1/${encodeURIComponent(ddd)}` },
			{ name: 'municipios', url: 'https://raw.githubusercontent.com/kelvins/municipios-brasileiros/main/json/municipios.json' },
		],
		normalize: (data, provider) => normalizeDdd(data, provider, ddd),
		queryKey: String(ddd),
	});
}

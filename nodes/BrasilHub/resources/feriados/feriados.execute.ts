import type { IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';
import type { IProvider } from '../../types';
import { executeStandardList } from '../../shared/execute-helpers';
import { normalizeFeriados } from './feriados.normalize';

/**
 * Builds the provider list for a feriados query.
 *
 * @param year - The year to query (already validated).
 * @returns Ordered list of providers (BrasilAPI → Nager.Date).
 */
function buildProviders(year: number): IProvider[] {
	const safeYear = encodeURIComponent(String(year));
	return [
		{ name: 'brasilapi', url: `https://brasilapi.com.br/api/feriados/v1/${safeYear}` },
		{ name: 'nagerdate', url: `https://date.nager.at/api/v3/PublicHolidays/${safeYear}/BR` },
	];
}

/**
 * Queries Brazilian public holidays for a given year with multi-provider fallback.
 *
 * Validates year range (1900–2199), then delegates to {@link executeStandardList} facade.
 * Providers: BrasilAPI → Nager.Date.
 *
 * @param context - n8n execution context.
 * @param itemIndex - Current item index for parameter retrieval and item pairing.
 * @returns Array of n8n execution data (one per holiday).
 * @throws {NodeOperationError} If the year is invalid or all providers fail.
 */
export async function feriadosQuery(
	context: IExecuteFunctions,
	itemIndex: number,
): Promise<INodeExecutionData[]> {
	const year = context.getNodeParameter('year', itemIndex) as number;

	if (!Number.isInteger(year) || year < 1900 || year > 2199) {
		throw new NodeOperationError(
			context.getNode(),
			'Invalid year: must be an integer between 1900 and 2199',
			{ itemIndex },
		);
	}

	return executeStandardList(context, itemIndex, {
		buildProviders: () => buildProviders(year),
		normalize: normalizeFeriados,
		queryKey: String(year),
	});
}

import type { IExecuteFunctions, INodeExecutionData, IDataObject } from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';
import type { IProvider } from '../../types';
import { buildMeta } from '../../shared/utils';
import { queryWithFallback } from '../../shared/fallback';
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
 * Returns one n8n item per holiday. Validates year range (1900–2199) before
 * making API calls. Providers: BrasilAPI → Nager.Date.
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
	const includeRaw = context.getNodeParameter('includeRaw', itemIndex, false) as boolean;

	if (!Number.isInteger(year) || year < 1900 || year > 2199) {
		throw new NodeOperationError(
			context.getNode(),
			'Invalid year: must be an integer between 1900 and 2199',
			{ itemIndex },
		);
	}

	const providers = buildProviders(year);
	const result = await queryWithFallback(context, providers);

	const feriados = normalizeFeriados(result.data, result.provider);
	const rawItems = Array.isArray(result.data) ? result.data as Array<Record<string, unknown>> : [];
	const meta = buildMeta(result.provider, String(year), result.errors);

	return feriados.map((feriado, index) => ({
		json: {
			...feriado,
			_meta: meta,
			...(includeRaw && { _raw: rawItems[index] as unknown as IDataObject }),
		} as IDataObject,
		pairedItem: { item: itemIndex },
	}));
}

import type { IExecuteFunctions, INodeExecutionData, JsonObject } from 'n8n-workflow';
import { NodeApiError, NodeOperationError } from 'n8n-workflow';
import { buildMeta, buildResultItems, buildResultItem, readCommonParams } from '../../shared/utils';
import { clampTimeout, DEFAULT_TIMEOUT_MS } from '../../shared/fallback';
import { normalizeTaxa, normalizeTaxas } from './taxas.normalize';

const BASE_URL = 'https://brasilapi.com.br/api/taxas/v1';

/**
 * Performs a single HTTP GET to BrasilAPI taxas endpoint.
 *
 * @param context - n8n execution context.
 * @param url - Full URL to fetch.
 * @param timeoutMs - HTTP timeout in milliseconds.
 * @returns Raw JSON response from the API.
 */
async function fetchTaxas(context: IExecuteFunctions, url: string, timeoutMs: number = DEFAULT_TIMEOUT_MS): Promise<unknown> {
	return context.helpers.httpRequest({
		method: 'GET',
		url,
		headers: {
			Accept: 'application/json',
			'User-Agent': 'n8n-brasil-hub-node/1.0',
		},
		timeout: clampTimeout(timeoutMs),
		json: true,
	});
}

/**
 * Lists all available Brazilian interest rates from BrasilAPI.
 *
 * Returns one n8n item per rate (Selic, CDI, IPCA, etc.).
 * Single provider (BrasilAPI), no fallback.
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

	let data: unknown;
	try {
		data = await fetchTaxas(context, BASE_URL, timeoutMs);
	} catch (error) {
		throw new NodeApiError(context.getNode(), error as JsonObject, {
			message: 'Failed to fetch interest rates from BrasilAPI',
			itemIndex,
		});
	}

	const taxas = normalizeTaxas(data);
	const rawItems = Array.isArray(data) ? data as Array<Record<string, unknown>> : [];
	const meta = buildMeta('brasilapi', 'taxas', [], false);

	return buildResultItems(taxas, meta, rawItems, includeRaw, itemIndex);
}

/**
 * Queries a specific Brazilian interest rate by code from BrasilAPI.
 *
 * Validates that the rate code is non-empty before making the API call.
 * Single provider (BrasilAPI), no fallback.
 *
 * @param context - n8n execution context.
 * @param itemIndex - Current item index for parameter retrieval and item pairing.
 * @returns Single n8n item with the normalized rate data.
 * @throws {NodeOperationError} If the rate code is empty.
 * @throws {NodeApiError} If the API request fails.
 */
export async function taxasQuery(
	context: IExecuteFunctions,
	itemIndex: number,
): Promise<INodeExecutionData[]> {
	const rateCode = String(context.getNodeParameter('rateCode', itemIndex) ?? '').trim();
	const { includeRaw, timeoutMs } = readCommonParams(context, itemIndex);

	if (!rateCode) {
		throw new NodeOperationError(
			context.getNode(),
			'Rate code is required',
			{ itemIndex },
		);
	}

	const url = `${BASE_URL}/${encodeURIComponent(rateCode)}`;

	let data: unknown;
	try {
		data = await fetchTaxas(context, url, timeoutMs);
	} catch (error) {
		throw new NodeApiError(context.getNode(), error as JsonObject, {
			message: `Failed to fetch rate "${rateCode}" from BrasilAPI`,
			itemIndex,
		});
	}

	const taxa = normalizeTaxa(data);
	const meta = buildMeta('brasilapi', rateCode, [], false);

	return buildResultItem(taxa, meta, data, includeRaw, itemIndex);
}

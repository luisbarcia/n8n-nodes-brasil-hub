import type { IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';
import { buildMeta, buildResultItems, readCommonParams } from '../../shared/utils';
import { clampTimeout, DEFAULT_TIMEOUT_MS } from '../../shared/fallback';
import { normalizeCurrencies, normalizeCotacoes } from './cambio.normalize';

const BASE_URL = 'https://brasilapi.com.br/api/cambio/v1';

/** Pattern for validating ISO currency codes (3 uppercase letters). */
const CURRENCY_CODE_PATTERN = /^[A-Z]{3}$/;

/** Pattern for validating ISO dates (YYYY-MM-DD). */
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Performs a single HTTP GET to the BrasilAPI câmbio endpoint.
 *
 * @param context - n8n execution context, used for `httpRequest`.
 * @param url - Full URL to request.
 * @param timeoutMs - HTTP timeout in milliseconds.
 * @returns Raw response data from the API.
 */
async function fetchCambio(
	context: IExecuteFunctions,
	url: string,
	timeoutMs: number = DEFAULT_TIMEOUT_MS,
): Promise<unknown> {
	return context.helpers.httpRequest({
		method: 'GET',
		url,
		headers: {
			Accept: 'application/json',
			'User-Agent': 'n8n-brasil-hub-node/1.0',
		},
		timeout: clampTimeout(timeoutMs),
	});
}

/**
 * Lists all available currencies from the Central Bank via BrasilAPI.
 *
 * Returns one n8n item per currency. No input parameters required beyond
 * the common ones (timeout, includeRaw).
 *
 * @param context - n8n execution context.
 * @param itemIndex - Current item index for parameter retrieval and item pairing.
 * @returns Array of n8n execution data (one per currency).
 */
export async function cambioCurrencies(
	context: IExecuteFunctions,
	itemIndex: number,
): Promise<INodeExecutionData[]> {
	const { includeRaw, timeoutMs } = readCommonParams(context, itemIndex);

	const url = `${BASE_URL}/moedas`;
	const data = await fetchCambio(context, url, timeoutMs);

	const currencies = normalizeCurrencies(data);
	const rawItems = Array.isArray(data) ? data as Array<Record<string, unknown>> : [];
	const meta = buildMeta('brasilapi', 'moedas', [], false);

	return buildResultItems(currencies, meta, rawItems, includeRaw, itemIndex);
}

/**
 * Queries exchange rate quotations for a specific currency and date via BrasilAPI.
 *
 * Validates the currency code (3 uppercase letters) and date (YYYY-MM-DD format)
 * before making the API call. Returns one n8n item per quotation (the API may
 * return multiple quotations for the same day, e.g. opening and closing).
 *
 * @param context - n8n execution context.
 * @param itemIndex - Current item index for parameter retrieval and item pairing.
 * @returns Array of n8n execution data (one per quotation).
 * @throws {NodeOperationError} If the currency code or date is invalid.
 */
export async function cambioRate(
	context: IExecuteFunctions,
	itemIndex: number,
): Promise<INodeExecutionData[]> {
	const { includeRaw, timeoutMs } = readCommonParams(context, itemIndex);
	const currencyCode = (context.getNodeParameter('currencyCode', itemIndex) as string).trim().toUpperCase();
	const date = (context.getNodeParameter('date', itemIndex) as string).trim();

	if (!currencyCode || !CURRENCY_CODE_PATTERN.test(currencyCode)) {
		throw new NodeOperationError(
			context.getNode(),
			'Invalid currency code: must be exactly 3 uppercase letters (e.g. USD, EUR)',
			{ itemIndex },
		);
	}

	if (!date || !DATE_PATTERN.test(date)) {
		throw new NodeOperationError(
			context.getNode(),
			'Invalid date: must be in ISO format YYYY-MM-DD (e.g. 2024-01-15)',
			{ itemIndex },
		);
	}

	const url = `${BASE_URL}/cotacao/${encodeURIComponent(currencyCode)}/${encodeURIComponent(date)}`;
	const data = await fetchCambio(context, url, timeoutMs);

	const rates = normalizeCotacoes(data);
	const obj = (data ?? {}) as Record<string, unknown>;
	const rawItems = Array.isArray(obj.cotacoes)
		? (obj.cotacoes as Array<Record<string, unknown>>)
		: [];
	const meta = buildMeta('brasilapi', `${currencyCode}/${date}`, [], false);

	return buildResultItems(rates, meta, rawItems, includeRaw, itemIndex);
}

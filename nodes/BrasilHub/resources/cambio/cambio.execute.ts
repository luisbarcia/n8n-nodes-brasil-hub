import type { IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';
import { buildMeta, buildResultItems, readCommonParams } from '../../shared/utils';
import { queryWithFallback } from '../../shared/fallback';
import type { IProvider } from '../../types';
import { normalizeCurrencies, normalizeCotacoes } from './cambio.normalize';

/** Pattern for validating ISO currency codes (3 uppercase letters). */
const CURRENCY_CODE_PATTERN = /^[A-Z]{3}$/;

/** Pattern for validating ISO dates (YYYY-MM-DD). */
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Lists all available currencies from the Central Bank via BrasilAPI.
 *
 * Returns one n8n item per currency. Uses queryWithFallback with a
 * single provider for consistent rate-limit awareness and error handling.
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

	const providers: IProvider[] = [
		{ name: 'brasilapi', url: 'https://brasilapi.com.br/api/cambio/v1/moedas' },
	];
	const result = await queryWithFallback(context, providers, timeoutMs);

	const currencies = normalizeCurrencies(result.data);
	const rawItems = Array.isArray(result.data) ? result.data as Array<Record<string, unknown>> : [];
	const meta = buildMeta(result.provider, 'moedas', result.errors, result.rateLimited, result.retryAfterMs);

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

	const safeCurrency = encodeURIComponent(currencyCode);
	const safeDate = encodeURIComponent(date);
	const providers: IProvider[] = [
		{ name: 'brasilapi', url: `https://brasilapi.com.br/api/cambio/v1/cotacao/${safeCurrency}/${safeDate}` },
	];
	const result = await queryWithFallback(context, providers, timeoutMs);

	const rates = normalizeCotacoes(result.data);
	const obj = (result.data ?? {}) as Record<string, unknown>;
	const rawItems = Array.isArray(obj.cotacoes)
		? (obj.cotacoes as Array<Record<string, unknown>>)
		: [];
	const meta = buildMeta(result.provider, `${currencyCode}/${date}`, result.errors, result.rateLimited, result.retryAfterMs);

	return buildResultItems(rates, meta, rawItems, includeRaw, itemIndex);
}

import type { ICurrency, ICambioRate } from '../../types';
import { safeStr } from '../../shared/utils';

/**
 * Normalizes a single BrasilAPI currency entry into the standard ICurrency format.
 *
 * @param item - Raw currency object with `simbolo`, `nome`, `tipo_moeda` fields.
 * @returns Normalized currency object.
 */
function normalizeCurrency(item: Record<string, unknown>): ICurrency {
	return {
		symbol: safeStr(item.simbolo),
		name: safeStr(item.nome),
		currencyType: safeStr(item.tipo_moeda),
	};
}

/**
 * Normalizes a list of currencies from the BrasilAPI response.
 *
 * Filters out null/non-object entries and maps each to the ICurrency interface.
 *
 * @param data - Raw provider response (array of currency objects).
 * @returns Array of normalized currency results.
 */
export function normalizeCurrencies(data: unknown): ICurrency[] {
	if (!Array.isArray(data)) return [];
	return (data as unknown[])
		.filter((item) => item != null && typeof item === 'object')
		.map((item) => normalizeCurrency(item as Record<string, unknown>));
}

/**
 * Normalizes a single BrasilAPI cotação entry into the standard ICambioRate format.
 *
 * @param item - Raw cotação object from the `cotacoes` array.
 * @param currency - Currency code from the wrapper object (e.g. "USD").
 * @param date - Date string from the wrapper object (e.g. "2024-01-15").
 * @returns Normalized exchange rate object.
 */
function normalizeCotacao(
	item: Record<string, unknown>,
	currency: string,
	date: string,
): ICambioRate {
	return {
		currency,
		date,
		buyRate: Number.isFinite(item.cotacao_compra) ? (item.cotacao_compra as number) : 0,
		sellRate: Number.isFinite(item.cotacao_venda) ? (item.cotacao_venda as number) : 0,
		buyParity: Number.isFinite(item.paridade_compra) ? (item.paridade_compra as number) : 0,
		sellParity: Number.isFinite(item.paridade_venda) ? (item.paridade_venda as number) : 0,
		quotedAt: safeStr(item.data_hora_cotacao),
		bulletinType: safeStr(item.tipo_boletim),
	};
}

/**
 * Normalizes a cotação response from BrasilAPI into an array of exchange rates.
 *
 * The API returns `{ cotacoes: [...], moeda, data }`. This function extracts the
 * `cotacoes` array and normalizes each entry, attaching the top-level `moeda` and
 * `data` fields to every rate record.
 *
 * @param data - Raw provider response (object with `cotacoes`, `moeda`, `data`).
 * @returns Array of normalized exchange rate results.
 */
export function normalizeCotacoes(data: unknown): ICambioRate[] {
	const obj = (data ?? {}) as Record<string, unknown>;
	const cotacoes = Array.isArray(obj.cotacoes)
		? (obj.cotacoes as Array<Record<string, unknown>>)
		: [];
	const currency = safeStr(obj.moeda);
	const date = safeStr(obj.data);

	return cotacoes
		.filter((item) => item != null && typeof item === 'object')
		.map((item) => normalizeCotacao(item, currency, date));
}

import type { IFeriado } from '../../types';
import { safeStr } from '../../shared/utils';
import { createListNormalizerDispatch } from '../../shared/execute-helpers';

/** Normalizes a single BrasilAPI feriado entry. */
function normalizeBrasilApi(item: Record<string, unknown>): IFeriado {
	return {
		date: safeStr(item.date),
		name: safeStr(item.name),
		type: safeStr(item.type),
	};
}

/** Normalizes a single Nager.Date feriado entry, preferring localName over name. */
function normalizeNager(item: Record<string, unknown>): IFeriado {
	const types = Array.isArray(item.types)
		? (item.types as unknown[]).map(safeStr).filter(Boolean).join(', ')
		: '';
	return {
		date: safeStr(item.date),
		name: safeStr(item.localName) || safeStr(item.name),
		type: types,
	};
}

/**
 * Normalizes a list of holidays from a provider response.
 *
 * Uses Strategy pattern list dispatch to provider-specific normalizers
 * (BrasilAPI, Nager.Date) with automatic Array.isArray guard and null filtering.
 *
 * @param data - Raw provider response (array of holidays).
 * @param provider - Provider name ("brasilapi" or "nagerdate").
 * @returns Array of normalized holiday results.
 * @throws {Error} If provider is unknown.
 */
export const normalizeFeriados = createListNormalizerDispatch<IFeriado>({
	brasilapi: normalizeBrasilApi,
	nagerdate: normalizeNager,
}, 'feriados');

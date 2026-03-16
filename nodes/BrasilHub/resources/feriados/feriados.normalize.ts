import type { IFeriado } from '../../types';
import { safeStr } from '../../shared/utils';

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

const normalizers: Record<string, (item: Record<string, unknown>) => IFeriado> = {
	brasilapi: normalizeBrasilApi,
	nagerdate: normalizeNager,
};

/**
 * Normalizes a list of holidays from a provider response.
 *
 * @param data - Raw provider response (array of holidays).
 * @param provider - Provider name ("brasilapi" or "nagerdate").
 * @returns Array of normalized holiday results.
 * @throws {Error} If provider is unknown.
 */
export function normalizeFeriados(data: unknown, provider: string): IFeriado[] {
	const normalizer = normalizers[provider];
	if (!normalizer) {
		throw new Error(`Unknown feriados provider: ${provider}`);
	}
	if (!Array.isArray(data)) return [];
	return (data as unknown[])
		.filter((item) => item != null && typeof item === 'object')
		.map((item) => normalizer(item as Record<string, unknown>));
}

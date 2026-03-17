import type { IState, ICity } from '../../types';
import { safeStr } from '../../shared/utils';

/**
 * Normalizes a single state entry (same format for BrasilAPI and IBGE API).
 *
 * Both APIs return `{ id, sigla, nome, regiao: { nome } }`.
 */
function normalizeState(item: Record<string, unknown>): IState {
	const regiao = (item.regiao ?? {}) as Record<string, unknown>;
	return {
		code: Number.isFinite(item.id) ? item.id as number : 0,
		abbreviation: safeStr(item.sigla),
		name: safeStr(item.nome),
		region: safeStr(regiao.nome),
	};
}

/** Normalizes a BrasilAPI city entry: `{ nome, codigo_ibge }`. */
function normalizeBrasilApiCity(item: Record<string, unknown>): ICity {
	return {
		code: Number.parseInt(safeStr(item.codigo_ibge), 10) || 0,
		name: safeStr(item.nome),
	};
}

/** Normalizes an IBGE API city entry: `{ id, nome }`. */
function normalizeIbgeCity(item: Record<string, unknown>): ICity {
	return {
		code: Number.isFinite(item.id) ? item.id as number : 0,
		name: safeStr(item.nome),
	};
}

const stateNormalizers: Record<string, (item: Record<string, unknown>) => IState> = {
	brasilapi: normalizeState,
	ibge: normalizeState,
};

const cityNormalizers: Record<string, (item: Record<string, unknown>) => ICity> = {
	brasilapi: normalizeBrasilApiCity,
	ibge: normalizeIbgeCity,
};

/**
 * Normalizes a list of states from a provider response.
 *
 * @param data - Raw provider response (array of states).
 * @param provider - Provider name ("brasilapi" or "ibge").
 * @returns Array of normalized state results.
 * @throws {Error} If provider is unknown.
 */
export function normalizeStates(data: unknown, provider: string): IState[] {
	const normalizer = stateNormalizers[provider];
	if (!normalizer) {
		throw new Error(`Unknown IBGE states provider: ${provider}`);
	}
	if (!Array.isArray(data)) return [];
	return (data as unknown[])
		.filter((item) => item != null && typeof item === 'object')
		.map((item) => normalizer(item as Record<string, unknown>));
}

/**
 * Normalizes a list of cities from a provider response.
 *
 * @param data - Raw provider response (array of cities).
 * @param provider - Provider name ("brasilapi" or "ibge").
 * @returns Array of normalized city results.
 * @throws {Error} If provider is unknown.
 */
export function normalizeCities(data: unknown, provider: string): ICity[] {
	const normalizer = cityNormalizers[provider];
	if (!normalizer) {
		throw new Error(`Unknown IBGE cities provider: ${provider}`);
	}
	if (!Array.isArray(data)) return [];
	return (data as unknown[])
		.filter((item) => item != null && typeof item === 'object')
		.map((item) => normalizer(item as Record<string, unknown>));
}

import type { IState, ICity } from '../../types';
import { safeStr } from '../../shared/utils';
import { createListNormalizerDispatch } from '../../shared/execute-helpers';

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

/**
 * Normalizes a list of states from a provider response.
 *
 * Uses Strategy pattern list dispatch to provider-specific normalizers
 * (BrasilAPI and IBGE share the same format).
 *
 * @param data - Raw provider response (array of states).
 * @param provider - Provider name ("brasilapi" or "ibge").
 * @returns Array of normalized state results.
 * @throws If provider is unknown.
 */
export const normalizeStates = createListNormalizerDispatch<IState>({
	brasilapi: normalizeState,
	ibge: normalizeState,
}, 'IBGE states');

/**
 * Normalizes a list of cities from a provider response.
 *
 * Uses Strategy pattern list dispatch with different normalizers per provider
 * (BrasilAPI uses `codigo_ibge`, IBGE API uses `id`).
 *
 * @param data - Raw provider response (array of cities).
 * @param provider - Provider name ("brasilapi" or "ibge").
 * @returns Array of normalized city results.
 * @throws If provider is unknown.
 */
export const normalizeCities = createListNormalizerDispatch<ICity>({
	brasilapi: normalizeBrasilApiCity,
	ibge: normalizeIbgeCity,
}, 'IBGE cities');

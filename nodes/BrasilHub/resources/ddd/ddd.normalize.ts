import type { IDdd } from '../../types';
import { safeStr } from '../../shared/utils';

/** IBGE state codes to two-letter abbreviations. */
const UF_CODES: Record<number, string> = {
	11: 'RO', 12: 'AC', 13: 'AM', 14: 'RR', 15: 'PA', 16: 'AP', 17: 'TO',
	21: 'MA', 22: 'PI', 23: 'CE', 24: 'RN', 25: 'PB', 26: 'PE', 27: 'AL', 28: 'SE', 29: 'BA',
	31: 'MG', 32: 'ES', 33: 'RJ', 35: 'SP',
	41: 'PR', 42: 'SC', 43: 'RS',
	50: 'MS', 51: 'MT', 52: 'GO', 53: 'DF',
};

/** Normalizes a BrasilAPI DDD response. */
function normalizeBrasilApiDdd(data: Record<string, unknown>): IDdd {
	const cities = Array.isArray(data.cities)
		? (data.cities as unknown[]).map((c) => safeStr(c))
		: [];
	return {
		state: safeStr(data.state),
		cities,
	};
}

/**
 * Normalizes a municipios-brasileiros JSON array, filtering by DDD code.
 *
 * Filters municipalities by DDD, extracts city names, and picks the most
 * frequent UF (state) code among matches.
 */
function normalizeMunicipiosDdd(data: Array<Record<string, unknown>>, dddCode: number): IDdd {
	const matches = data.filter((m) => Number(m.ddd) === dddCode);
	if (matches.length === 0) {
		throw new Error(`DDD ${dddCode} not found`);
	}

	const cities = matches.map((m) => safeStr(m.nome));

	// Pick the most frequent UF code
	const ufCounts = new Map<number, number>();
	for (const m of matches) {
		const uf = m.codigo_uf as number;
		ufCounts.set(uf, (ufCounts.get(uf) ?? 0) + 1);
	}
	let bestUf = 0;
	let bestCount = 0;
	for (const [uf, count] of ufCounts) {
		if (count > bestCount) {
			bestUf = uf;
			bestCount = count;
		}
	}

	return {
		state: UF_CODES[bestUf] ?? '',
		cities,
	};
}

/**
 * Normalizes a DDD query response from the given provider.
 *
 * For BrasilAPI, `data` is a single `{state, cities}` object.
 * For municipios, `data` is the full municipalities array — filtered by `dddCode`.
 *
 * @param data - Raw provider response.
 * @param provider - Provider name.
 * @param dddCode - DDD code to filter (required for municipios provider).
 * @returns Normalized DDD result.
 * @throws {Error} If provider is unknown or DDD code is not found in municipios data.
 */
export function normalizeDdd(data: unknown, provider: string, dddCode?: number): IDdd {
	if (provider === 'brasilapi') {
		return normalizeBrasilApiDdd((data ?? {}) as Record<string, unknown>);
	}
	if (provider === 'municipios') {
		const items = Array.isArray(data) ? data as Array<Record<string, unknown>> : [];
		return normalizeMunicipiosDdd(items, dddCode!);
	}
	throw new Error(`Unknown DDD provider: ${provider}`);
}

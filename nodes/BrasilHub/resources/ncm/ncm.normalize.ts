import type { INcm } from '../../types';
import { safeStr } from '../../shared/utils';

/** Normalizes a single NCM entry from BrasilAPI. */
function normalizeNcmItem(item: Record<string, unknown>): INcm {
	return {
		code: safeStr(item.codigo),
		description: safeStr(item.descricao),
		startDate: safeStr(item.data_inicio),
		endDate: safeStr(item.data_fim),
		actType: safeStr(item.tipo_ato),
		actNumber: safeStr(item.numero_ato),
		actYear: safeStr(item.ano_ato),
	};
}

/**
 * Normalizes a single NCM query response.
 *
 * @param data - Raw response from `/api/ncm/v1/{code}`.
 * @returns Normalized NCM result.
 */
export function normalizeNcm(data: unknown): INcm {
	return normalizeNcmItem((data ?? {}) as Record<string, unknown>);
}

/**
 * Normalizes an NCM search response (array of results).
 *
 * @param data - Raw response from `/api/ncm/v1?search={term}`.
 * @returns Array of normalized NCM results.
 */
export function normalizeNcmList(data: unknown): INcm[] {
	if (!Array.isArray(data)) return [];
	return (data as unknown[])
		.filter((item) => item != null && typeof item === 'object')
		.map((item) => normalizeNcmItem(item as Record<string, unknown>));
}

import type { ITaxa } from '../../types';
import { safeStr } from '../../shared/utils';

/**
 * Normalizes a single BrasilAPI taxa object.
 *
 * Maps the Portuguese-named fields (`nome`, `valor`) to English equivalents.
 *
 * @param data - Raw taxa object from BrasilAPI (`{ nome, valor }`).
 * @returns Normalized taxa with `name` and `value` fields.
 */
export function normalizeTaxa(data: unknown): ITaxa {
	const obj = (data != null && typeof data === 'object' ? data : {}) as Record<string, unknown>;
	return {
		name: safeStr(obj.nome),
		value: typeof obj.valor === 'number' ? obj.valor : 0,
	};
}

/**
 * Normalizes an array of BrasilAPI taxa objects.
 *
 * Filters out null/non-object entries before mapping, following the same
 * defensive pattern used by other normalizers in this project.
 *
 * @param data - Raw array from `/api/taxas/v1`.
 * @returns Array of normalized taxa objects.
 */
export function normalizeTaxas(data: unknown): ITaxa[] {
	if (!Array.isArray(data)) return [];
	return (data as unknown[])
		.filter((item) => item != null && typeof item === 'object')
		.map((item) => normalizeTaxa(item));
}

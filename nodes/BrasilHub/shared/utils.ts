/**
 * Coerces an unknown value to a string, returning `''` for null, undefined, or objects.
 *
 * Prevents `[object Object]` stringification when external API responses contain
 * unexpected nested objects where a primitive string was expected.
 *
 * @param value - Any value from an untyped API response.
 * @returns The value as a string, or `''` if null/undefined/object.
 */
export function safeStr(value: unknown): string {
	if (typeof value === 'string') return value;
	if (typeof value === 'number' || typeof value === 'boolean') return value.toString();
	return '';
}

/**
 * Builds the standard `_meta` object attached to every API query response.
 *
 * Centralizes the fallback/direct strategy logic and error collection
 * so that each resource handler doesn't repeat the same 6-line block.
 *
 * @param provider - Name of the provider that returned the data.
 * @param query - Sanitized input used for the query.
 * @param errors - Error messages from providers that failed before the successful one.
 * @returns IMeta object ready to attach to the response.
 */
export function buildMeta(provider: string, query: string, errors: string[]): {
	provider: string;
	query: string;
	queried_at: string;
	strategy: 'fallback' | 'direct';
	errors?: string[];
} {
	return {
		provider,
		query,
		queried_at: new Date().toISOString(),
		strategy: errors.length > 0 ? 'fallback' : 'direct',
		...(errors.length > 0 && { errors }),
	};
}

/**
 * Builds an array of n8n execution data items from normalized results.
 *
 * Centralizes the repeated `.map()` pattern used by multi-item handlers
 * (banksList, fipeBrands, fipeModels, fipeYears, feriadosQuery).
 *
 * @param items - Array of normalized result objects.
 * @param meta - Meta object from buildMeta().
 * @param rawItems - Raw API response items (aligned by index).
 * @param includeRaw - Whether to include _raw in each item.
 * @param itemIndex - n8n input item index for pairedItem.
 * @returns Array of n8n execution data items.
 */
export function buildResultItems(
	items: Array<Record<string, unknown>>,
	meta: Record<string, unknown>,
	rawItems: Array<Record<string, unknown>>,
	includeRaw: boolean,
	itemIndex: number,
): Array<{ json: Record<string, unknown>; pairedItem: { item: number } }> {
	return items.map((item, index) => ({
		json: {
			...item,
			_meta: meta,
			...(includeRaw && { _raw: rawItems[index] }),
		},
		pairedItem: { item: itemIndex },
	}));
}

/**
 * Builds a single n8n execution data item from a normalized result.
 *
 * Centralizes the repeated single-item return pattern used by
 * cnpjQuery, cepQuery, dddQuery, banksQuery, fipePrice.
 *
 * @param normalized - Normalized result object.
 * @param meta - Meta object from buildMeta().
 * @param rawData - Raw API response data.
 * @param includeRaw - Whether to include _raw.
 * @param itemIndex - n8n input item index for pairedItem.
 * @returns Single-element array of n8n execution data.
 */
export function buildResultItem(
	normalized: Record<string, unknown>,
	meta: Record<string, unknown>,
	rawData: unknown,
	includeRaw: boolean,
	itemIndex: number,
): Array<{ json: Record<string, unknown>; pairedItem: { item: number } }> {
	return [{
		json: {
			...normalized,
			_meta: meta,
			...(includeRaw && { _raw: rawData as Record<string, unknown> }),
		},
		pairedItem: { item: itemIndex },
	}];
}

/**
 * Removes all non-digit characters from a string.
 *
 * @param value - Raw input (e.g. `"11.222.333/0001-81"`).
 * @returns Digits-only string (e.g. `"11222333000181"`).
 */
export function stripNonDigits(value: string): string {
	if (typeof value !== 'string') return String(value ?? '').replaceAll(/\D/g, '');
	return value.replaceAll(/\D/g, '');
}

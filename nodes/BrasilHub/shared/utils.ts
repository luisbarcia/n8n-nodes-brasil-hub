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
 * Removes all non-digit characters from a string.
 *
 * @param value - Raw input (e.g. `"11.222.333/0001-81"`).
 * @returns Digits-only string (e.g. `"11222333000181"`).
 */
export function stripNonDigits(value: string): string {
	return value.replace(/\D/g, ''); // NOSONAR: replaceAll requires es2021 lib, project targets es2019
}

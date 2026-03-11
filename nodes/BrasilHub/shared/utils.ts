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
	if (value == null || typeof value === 'object') return '';
	return String(value);
}

/**
 * Removes all non-digit characters from a string.
 *
 * @param value - Raw input (e.g. `"11.222.333/0001-81"`).
 * @returns Digits-only string (e.g. `"11222333000181"`).
 */
export function stripNonDigits(value: string): string {
	return value.replace(/\D/g, ''); // regex with /g flag = replaceAll
}

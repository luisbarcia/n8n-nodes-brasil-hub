/**
 * Removes all non-digit characters from a string.
 *
 * @param value - Raw input (e.g. `"11.222.333/0001-81"`).
 * @returns Digits-only string (e.g. `"11222333000181"`).
 */
export function stripNonDigits(value: string): string {
	return value.replace(/\D/g, '');
}

/** Removes all non-digit characters from a string. */
export function stripNonDigits(value: string): string {
	return value.replace(/\D/g, '');
}

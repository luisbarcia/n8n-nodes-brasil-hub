import type { IDdd } from '../../types';
import { safeStr } from '../../shared/utils';

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
 * Normalizes a DDD query response from the given provider.
 *
 * @param data - Raw provider response.
 * @param provider - Provider name.
 * @returns Normalized DDD result.
 */
export function normalizeDdd(data: unknown, provider: string): IDdd {
	if (provider === 'brasilapi') {
		return normalizeBrasilApiDdd(data as Record<string, unknown>);
	}
	throw new Error(`Unknown DDD provider: ${provider}`);
}

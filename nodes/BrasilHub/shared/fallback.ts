import type { IExecuteFunctions } from 'n8n-workflow';
import type { IProvider, IFallbackResult } from '../types';

/** Default HTTP request timeout in milliseconds per provider attempt. */
export const DEFAULT_TIMEOUT_MS = 10000;

/** Minimum allowed timeout in milliseconds. */
export const MIN_TIMEOUT_MS = 1000;

/** Maximum allowed timeout in milliseconds. */
export const MAX_TIMEOUT_MS = 60000;

/** Clamps a timeout value to the allowed range [MIN_TIMEOUT_MS, MAX_TIMEOUT_MS]. */
export function clampTimeout(value: number): number {
	const n = Number.isFinite(value) ? value : DEFAULT_TIMEOUT_MS;
	return Math.max(MIN_TIMEOUT_MS, Math.min(MAX_TIMEOUT_MS, n));
}

/**
 * Queries multiple providers in sequence until one succeeds (fallback strategy).
 *
 * Tries each provider in order. Uses n8n's `httpRequest` helper with a
 * configurable timeout. Collects error messages from failed providers for
 * diagnostic metadata.
 *
 * @param context - n8n execution context, used for `httpRequest`.
 * @param providers - Ordered list of provider endpoints to try.
 * @param timeoutMs - HTTP timeout in milliseconds (default: {@link DEFAULT_TIMEOUT_MS}).
 * @returns Raw response data from the first successful provider.
 * @throws {Error} When all providers fail, with concatenated error messages.
 */
export async function queryWithFallback(
	context: IExecuteFunctions,
	providers: IProvider[],
	timeoutMs: number = DEFAULT_TIMEOUT_MS,
): Promise<IFallbackResult> {
	const safeTimeout = clampTimeout(timeoutMs);
	const errors: string[] = [];
	let rateLimited = false;
	let retryAfterMs: number | undefined;

	for (const provider of providers) {
		try {
			const data = await context.helpers.httpRequest({
				method: 'GET',
				url: provider.url,
				headers: {
					Accept: 'application/json',
					'User-Agent': 'n8n-brasil-hub-node/1.0',
				},
				timeout: safeTimeout,
			});

			return { data, provider: provider.name, errors, rateLimited, retryAfterMs };
		} catch (error) {
			const message = error instanceof Error ? error.message : String(error);
			const httpCode = (error as Record<string, unknown>)?.httpCode;
			const detail = httpCode ? `[${httpCode}] ${message}` : message;
			errors.push(`${provider.name}: ${detail}`);

			if (httpCode === 429 || httpCode === '429') {
				rateLimited = true;
				const retryHeader = (error as Record<string, Record<string, unknown>>)?.headers?.['retry-after'];
				if (retryHeader != null) {
					const seconds = Number(retryHeader);
					if (Number.isFinite(seconds) && seconds > 0) {
						retryAfterMs = Math.round(seconds * 1000);
					}
				}
			}
		}
	}

	const prefix = rateLimited
		? 'All providers rate-limited or failed'
		: 'No provider could fulfill the request';
	throw new Error(`${prefix}: ${errors.join('; ')}`);
}

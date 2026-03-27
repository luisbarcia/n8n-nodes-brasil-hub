import type { IExecuteFunctions } from 'n8n-workflow';
import type { IProvider, IFallbackResult } from '../types';

/** Default HTTP request timeout in milliseconds per provider attempt. */
export const DEFAULT_TIMEOUT_MS = 10000;

/** Minimum allowed timeout in milliseconds. */
export const MIN_TIMEOUT_MS = 1000;

/** Maximum allowed timeout in milliseconds. */
export const MAX_TIMEOUT_MS = 60000;

/**
 * Clamps a timeout value to the allowed range [MIN_TIMEOUT_MS, MAX_TIMEOUT_MS].
 *
 * @param value - Raw timeout value in milliseconds (non-finite values fall back to default).
 * @returns Clamped timeout value within [1000, 60000] ms.
 */
export function clampTimeout(value: number): number {
	const n = Number.isFinite(value) ? value : DEFAULT_TIMEOUT_MS;
	return Math.max(MIN_TIMEOUT_MS, Math.min(MAX_TIMEOUT_MS, n));
}

/**
 * Extracts rate-limit info from an HTTP error when the status is 429.
 *
 * @param error - The caught error object from httpRequest.
 * @returns Object with `rateLimited` flag and optional `retryAfterMs`.
 */
function extractRateLimitInfo(error: unknown): { rateLimited: boolean; retryAfterMs?: number } {
	const httpCode = String((error as Record<string, unknown>)?.httpCode ?? '');
	if (httpCode !== '429') {
		return { rateLimited: false };
	}

	const retryHeader = (error as Record<string, Record<string, unknown>>)?.headers?.['retry-after'];
	if (retryHeader == null) {
		return { rateLimited: true };
	}

	const seconds = Number(retryHeader);
	const retryAfterMs = Number.isFinite(seconds) && seconds > 0
		? Math.round(seconds * 1000)
		: undefined;
	return { rateLimited: true, retryAfterMs };
}

/** Formats an error message with optional HTTP status code prefix. */
function formatProviderError(providerName: string, error: unknown): string {
	const message = error instanceof Error ? error.message : String(error);
	const httpCode = String((error as Record<string, unknown>)?.httpCode ?? '');
	const detail = httpCode ? `[${httpCode}] ${message}` : message;
	return `${providerName}: ${detail}`;
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
 * @throws When all providers fail, with concatenated error messages. Wrapped by the router as NodeOperationError with itemIndex.
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
			errors.push(formatProviderError(provider.name, error));

			const rateInfo = extractRateLimitInfo(error);
			if (rateInfo.rateLimited) {
				rateLimited = true;
				if (rateInfo.retryAfterMs !== undefined) {
					retryAfterMs = rateInfo.retryAfterMs;
				}
			}
		}
	}

	const prefix = rateLimited
		? 'All providers rate-limited or failed'
		: 'No provider could fulfill the request';
	throw new Error(`${prefix}: ${errors.join('; ')}`);
}

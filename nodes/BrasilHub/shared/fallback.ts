import type { IExecuteFunctions } from 'n8n-workflow';
import type { IProvider, IFallbackResult } from '../types';

/** Default HTTP request timeout in milliseconds per provider attempt. */
const DEFAULT_TIMEOUT_MS = 10000;

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
	const errors: string[] = [];

	for (const provider of providers) {
		try {
			const data = await context.helpers.httpRequest({
				method: 'GET',
				url: provider.url,
				headers: {
					Accept: 'application/json',
					'User-Agent': 'n8n-brasil-hub-node/1.0',
				},
				timeout: timeoutMs,
			});

			return { data, provider: provider.name, errors };
		} catch (error) {
			const message = error instanceof Error ? error.message : String(error);
			const httpCode = (error as Record<string, unknown>)?.httpCode;
			const detail = httpCode ? `[${httpCode}] ${message}` : message;
			errors.push(`${provider.name}: ${detail}`);
		}
	}

	throw new Error(`No provider could fulfill the request: ${errors.join('; ')}`);
}

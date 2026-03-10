import type { IExecuteFunctions } from 'n8n-workflow';
import type { IProvider, IFallbackResult } from '../types';

/** Delay in milliseconds between provider retry attempts. */
const DELAY_BETWEEN_RETRIES_MS = 1000;

/** HTTP request timeout in milliseconds per provider attempt. */
const REQUEST_TIMEOUT_MS = 10000;

/** Returns a promise that resolves after {@link ms} milliseconds. */
function delay(ms: number): Promise<void> {
	return new Promise((resolve) => {
		// eslint-disable-next-line @n8n/community-nodes/no-restricted-globals
		setTimeout(resolve, ms);
	});
}

/**
 * Queries multiple providers in sequence until one succeeds (fallback strategy).
 *
 * Tries each provider in order, waiting {@link DELAY_BETWEEN_RETRIES_MS} between
 * attempts. Uses n8n's `httpRequest` helper with a {@link REQUEST_TIMEOUT_MS} timeout.
 * Collects error messages from failed providers for diagnostic metadata.
 *
 * @param context - n8n execution context, used for `httpRequest`.
 * @param providers - Ordered list of provider endpoints to try.
 * @param itemIndex - Current item index (for n8n item pairing).
 * @returns Raw response data from the first successful provider.
 * @throws {Error} When all providers fail, with concatenated error messages.
 */
export async function queryWithFallback(
	context: IExecuteFunctions,
	providers: IProvider[],
	itemIndex: number,
): Promise<IFallbackResult> {
	void itemIndex;
	const errors: string[] = [];

	for (let i = 0; i < providers.length; i++) {
		const provider = providers[i];

		if (i > 0) {
			await delay(DELAY_BETWEEN_RETRIES_MS);
		}

		try {
			const data = await context.helpers.httpRequest({
				method: 'GET',
				url: provider.url,
				headers: {
					Accept: 'application/json',
					'User-Agent': 'n8n-brasil-hub-node/1.0',
				},
				timeout: REQUEST_TIMEOUT_MS,
			});

			return { data, provider: provider.name, errors };
		} catch (error) {
			const message = error instanceof Error ? error.message : String(error);
			errors.push(`${provider.name}: ${message}`);
		}
	}

	throw new Error(`All providers failed: ${errors.join('; ')}`);
}

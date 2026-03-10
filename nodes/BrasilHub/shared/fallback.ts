import type { IExecuteFunctions } from 'n8n-workflow';
import type { IProvider, IFallbackResult } from '../types';

const DELAY_BETWEEN_RETRIES_MS = 1000;
const REQUEST_TIMEOUT_MS = 10000;

function delay(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function queryWithFallback(
	context: IExecuteFunctions,
	providers: IProvider[],
	_itemIndex: number,
): Promise<IFallbackResult> {
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

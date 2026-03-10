import { queryWithFallback } from '../nodes/BrasilHub/shared/fallback';
import type { IProvider } from '../nodes/BrasilHub/types';

jest.useFakeTimers();

function createMockContext(responses: Array<{ success: boolean; data?: unknown; error?: string }>) {
	let callIndex = 0;
	return {
		helpers: {
			httpRequest: jest.fn().mockImplementation(async () => {
				const response = responses[callIndex++];
				if (!response || !response.success) {
					throw new Error(response?.error ?? 'Request failed');
				}
				return response.data;
			}),
		},
	} as unknown as Parameters<typeof queryWithFallback>[0];
}

const providers: IProvider[] = [
	{ name: 'provider1', url: 'https://api1.example.com/123' },
	{ name: 'provider2', url: 'https://api2.example.com/123' },
	{ name: 'provider3', url: 'https://api3.example.com/123' },
];

async function runWithTimers<T>(promise: Promise<T>): Promise<T> {
	const result = promise;
	for (let i = 0; i < 5; i++) {
		jest.advanceTimersByTime(1100);
		await Promise.resolve();
	}
	return result;
}

afterAll(() => {
	jest.useRealTimers();
});

describe('queryWithFallback', () => {
	it('should return data from the first provider on success', async () => {
		const ctx = createMockContext([{ success: true, data: { name: 'Test' } }]);
		const result = await runWithTimers(queryWithFallback(ctx, providers, 0));

		expect(result.data).toEqual({ name: 'Test' });
		expect(result.provider).toBe('provider1');
		expect(result.errors).toHaveLength(0);
		expect(ctx.helpers.httpRequest).toHaveBeenCalledTimes(1);
	});

	it('should fallback to second provider when first fails', async () => {
		const ctx = createMockContext([
			{ success: false, error: 'Timeout' },
			{ success: true, data: { name: 'Fallback' } },
		]);
		const result = await runWithTimers(queryWithFallback(ctx, providers, 0));

		expect(result.data).toEqual({ name: 'Fallback' });
		expect(result.provider).toBe('provider2');
		expect(result.errors).toEqual(['provider1: Timeout']);
		expect(ctx.helpers.httpRequest).toHaveBeenCalledTimes(2);
	});

	it('should fallback to third provider when first two fail', async () => {
		const ctx = createMockContext([
			{ success: false, error: 'Error 1' },
			{ success: false, error: 'Error 2' },
			{ success: true, data: { name: 'Third' } },
		]);
		const result = await runWithTimers(queryWithFallback(ctx, providers, 0));

		expect(result.data).toEqual({ name: 'Third' });
		expect(result.provider).toBe('provider3');
		expect(result.errors).toHaveLength(2);
	});

	it('should throw when all providers fail', async () => {
		const ctx = createMockContext([
			{ success: false, error: 'E1' },
			{ success: false, error: 'E2' },
			{ success: false, error: 'E3' },
		]);

		await expect(runWithTimers(queryWithFallback(ctx, providers, 0))).rejects.toThrow(
			'All providers failed',
		);
	});

	it('should collect all error messages from failed providers', async () => {
		const ctx = createMockContext([
			{ success: false, error: 'Timeout' },
			{ success: false, error: '404 Not Found' },
			{ success: true, data: {} },
		]);
		const result = await runWithTimers(queryWithFallback(ctx, providers, 0));

		expect(result.errors).toEqual([
			'provider1: Timeout',
			'provider2: 404 Not Found',
		]);
	});
});

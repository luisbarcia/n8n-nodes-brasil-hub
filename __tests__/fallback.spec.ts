import { queryWithFallback } from '../nodes/BrasilHub/shared/fallback';
import { buildMeta } from '../nodes/BrasilHub/shared/utils';
import type { IProvider } from '../nodes/BrasilHub/types';

function createMockContext(responses: Array<{ success: boolean; data?: unknown; error?: string }>) {
	let callIndex = 0;
	return {
		helpers: {
			httpRequest: jest.fn().mockImplementation(async () => {
				const response = responses[callIndex++];
				if (!response?.success) {
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

describe('queryWithFallback', () => {
	it('should return data from the first provider on success', async () => {
		const ctx = createMockContext([{ success: true, data: { name: 'Test' } }]);
		const result = await queryWithFallback(ctx, providers);

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
		const result = await queryWithFallback(ctx, providers);

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
		const result = await queryWithFallback(ctx, providers);

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

		await expect(queryWithFallback(ctx, providers)).rejects.toThrow(
			'No provider could fulfill the request',
		);
	});

	it('should handle non-Error thrown values', async () => {
		let callIndex = 0;
		const ctx = {
			helpers: {
				httpRequest: jest.fn().mockImplementation(async () => {
					callIndex++;
					if (callIndex === 1) throw 'string error'; // NOSONAR: intentionally testing non-Error thrown values
					return { ok: true };
				}),
			},
		} as unknown as Parameters<typeof queryWithFallback>[0];
		const result = await queryWithFallback(ctx, providers);
		expect(result.errors).toEqual(['provider1: string error']);
		expect(result.provider).toBe('provider2');
	});

	it('should collect all error messages from failed providers', async () => {
		const ctx = createMockContext([
			{ success: false, error: 'Timeout' },
			{ success: false, error: '404 Not Found' },
			{ success: true, data: {} },
		]);
		const result = await queryWithFallback(ctx, providers);

		expect(result.errors).toEqual([
			'provider1: Timeout',
			'provider2: 404 Not Found',
		]);
	});
});

describe('buildMeta', () => {
	it('should return direct strategy when no errors', () => {
		const meta = buildMeta('brasilapi', '11222333000181', []);
		expect(meta.provider).toBe('brasilapi');
		expect(meta.query).toBe('11222333000181');
		expect(meta.strategy).toBe('direct');
		expect(meta.errors).toBeUndefined();
	});

	it('should return fallback strategy when errors present', () => {
		const meta = buildMeta('cnpjws', '11222333000181', ['brasilapi: Timeout']);
		expect(meta.strategy).toBe('fallback');
		expect(meta.errors).toEqual(['brasilapi: Timeout']);
	});

	it('should produce valid ISO 8601 queried_at timestamp', () => {
		const meta = buildMeta('brasilapi', 'test', []);
		const parsed = new Date(meta.queried_at);
		expect(parsed.toISOString()).toBe(meta.queried_at);
		expect(Number.isNaN(parsed.getTime())).toBe(false);
	});

	it('should not include errors key when errors array is empty', () => {
		const meta = buildMeta('brasilapi', 'test', []);
		expect(Object.keys(meta)).not.toContain('errors');
	});
});

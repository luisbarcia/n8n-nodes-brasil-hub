import { queryWithFallback, clampTimeout, DEFAULT_TIMEOUT_MS, MIN_TIMEOUT_MS, MAX_TIMEOUT_MS } from '../nodes/BrasilHub/shared/fallback';
import { buildMeta, reorderProviders } from '../nodes/BrasilHub/shared/utils';
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

	it('should use custom timeout when provided', async () => {
		const ctx = createMockContext([{ success: true, data: { ok: true } }]);
		await queryWithFallback(ctx, providers, 5000);

		expect(ctx.helpers.httpRequest).toHaveBeenCalledWith(
			expect.objectContaining({ timeout: 5000 }),
		);
	});

	it('should use default timeout (10000) when not provided', async () => {
		const ctx = createMockContext([{ success: true, data: { ok: true } }]);
		await queryWithFallback(ctx, providers);

		expect(ctx.helpers.httpRequest).toHaveBeenCalledWith(
			expect.objectContaining({ timeout: 10000 }),
		);
	});

	it('should clamp timeout=0 to MIN_TIMEOUT_MS', async () => {
		const ctx = createMockContext([{ success: true, data: { ok: true } }]);
		await queryWithFallback(ctx, providers, 0);
		expect(ctx.helpers.httpRequest).toHaveBeenCalledWith(
			expect.objectContaining({ timeout: MIN_TIMEOUT_MS }),
		);
	});

	it('should clamp negative timeout to MIN_TIMEOUT_MS', async () => {
		const ctx = createMockContext([{ success: true, data: { ok: true } }]);
		await queryWithFallback(ctx, providers, -1);
		expect(ctx.helpers.httpRequest).toHaveBeenCalledWith(
			expect.objectContaining({ timeout: MIN_TIMEOUT_MS }),
		);
	});

	it('should clamp timeout exceeding MAX to MAX_TIMEOUT_MS', async () => {
		const ctx = createMockContext([{ success: true, data: { ok: true } }]);
		await queryWithFallback(ctx, providers, 999999);
		expect(ctx.helpers.httpRequest).toHaveBeenCalledWith(
			expect.objectContaining({ timeout: MAX_TIMEOUT_MS }),
		);
	});

	it('should clamp NaN timeout to DEFAULT_TIMEOUT_MS', async () => {
		const ctx = createMockContext([{ success: true, data: { ok: true } }]);
		await queryWithFallback(ctx, providers, NaN);
		expect(ctx.helpers.httpRequest).toHaveBeenCalledWith(
			expect.objectContaining({ timeout: DEFAULT_TIMEOUT_MS }),
		);
	});

	it('should clamp Infinity timeout to DEFAULT_TIMEOUT_MS', async () => {
		const ctx = createMockContext([{ success: true, data: { ok: true } }]);
		await queryWithFallback(ctx, providers, Infinity);
		expect(ctx.helpers.httpRequest).toHaveBeenCalledWith(
			expect.objectContaining({ timeout: DEFAULT_TIMEOUT_MS }),
		);
	});

	it('should accept MIN_TIMEOUT_MS boundary value', async () => {
		const ctx = createMockContext([{ success: true, data: { ok: true } }]);
		await queryWithFallback(ctx, providers, MIN_TIMEOUT_MS);
		expect(ctx.helpers.httpRequest).toHaveBeenCalledWith(
			expect.objectContaining({ timeout: MIN_TIMEOUT_MS }),
		);
	});

	it('should accept MAX_TIMEOUT_MS boundary value', async () => {
		const ctx = createMockContext([{ success: true, data: { ok: true } }]);
		await queryWithFallback(ctx, providers, MAX_TIMEOUT_MS);
		expect(ctx.helpers.httpRequest).toHaveBeenCalledWith(
			expect.objectContaining({ timeout: MAX_TIMEOUT_MS }),
		);
	});

	it('should set rateLimited=true when a provider returns 429', async () => {
		const err429 = Object.assign(new Error('Too Many Requests'), { httpCode: 429 });
		let callIndex = 0;
		const ctx = {
			helpers: {
				httpRequest: jest.fn().mockImplementation(async () => {
					callIndex++;
					if (callIndex === 1) throw err429;
					return { ok: true };
				}),
			},
		} as unknown as Parameters<typeof queryWithFallback>[0];
		const result = await queryWithFallback(ctx, providers);
		expect(result.rateLimited).toBe(true);
		expect(result.provider).toBe('provider2');
		expect(result.errors).toEqual(['provider1: [429] Too Many Requests']);
	});

	it('should extract Retry-After header from 429 response', async () => {
		const err429 = Object.assign(new Error('Too Many Requests'), {
			httpCode: 429,
			headers: { 'retry-after': '3' },
		});
		let callIndex = 0;
		const ctx = {
			helpers: {
				httpRequest: jest.fn().mockImplementation(async () => {
					callIndex++;
					if (callIndex === 1) throw err429;
					return { ok: true };
				}),
			},
		} as unknown as Parameters<typeof queryWithFallback>[0];
		const result = await queryWithFallback(ctx, providers);
		expect(result.rateLimited).toBe(true);
		expect(result.retryAfterMs).toBe(3000);
	});

	it('should throw rate-limit-specific error when all providers 429', async () => {
		const make429 = () => Object.assign(new Error('Too Many Requests'), { httpCode: 429 });
		const ctx = {
			helpers: {
				httpRequest: jest.fn().mockRejectedValue(make429()),
			},
		} as unknown as Parameters<typeof queryWithFallback>[0];
		await expect(queryWithFallback(ctx, providers)).rejects.toThrow(
			'All providers rate-limited or failed',
		);
	});

	it('should set rateLimited=false when no 429 occurs', async () => {
		const ctx = createMockContext([{ success: true, data: { ok: true } }]);
		const result = await queryWithFallback(ctx, providers);
		expect(result.rateLimited).toBe(false);
		expect(result.retryAfterMs).toBeUndefined();
	});

	it('should handle 429 as string httpCode', async () => {
		const err429 = Object.assign(new Error('Rate limited'), { httpCode: '429' });
		let callIndex = 0;
		const ctx = {
			helpers: {
				httpRequest: jest.fn().mockImplementation(async () => {
					callIndex++;
					if (callIndex === 1) throw err429;
					return { ok: true };
				}),
			},
		} as unknown as Parameters<typeof queryWithFallback>[0];
		const result = await queryWithFallback(ctx, providers);
		expect(result.rateLimited).toBe(true);
	});

	it('should ignore invalid Retry-After values', async () => {
		const err429 = Object.assign(new Error('Rate limited'), {
			httpCode: 429,
			headers: { 'retry-after': 'invalid' },
		});
		let callIndex = 0;
		const ctx = {
			helpers: {
				httpRequest: jest.fn().mockImplementation(async () => {
					callIndex++;
					if (callIndex === 1) throw err429;
					return { ok: true };
				}),
			},
		} as unknown as Parameters<typeof queryWithFallback>[0];
		const result = await queryWithFallback(ctx, providers);
		expect(result.rateLimited).toBe(true);
		expect(result.retryAfterMs).toBeUndefined();
	});

	it('should ignore Retry-After: 0', async () => {
		const err429 = Object.assign(new Error('Rate limited'), {
			httpCode: 429, headers: { 'retry-after': '0' },
		});
		let callIndex = 0;
		const ctx = {
			helpers: {
				httpRequest: jest.fn().mockImplementation(async () => {
					callIndex++;
					if (callIndex === 1) throw err429;
					return { ok: true };
				}),
			},
		} as unknown as Parameters<typeof queryWithFallback>[0];
		const result = await queryWithFallback(ctx, providers);
		expect(result.rateLimited).toBe(true);
		expect(result.retryAfterMs).toBeUndefined();
	});

	it('should ignore negative Retry-After', async () => {
		const err429 = Object.assign(new Error('Rate limited'), {
			httpCode: 429, headers: { 'retry-after': '-5' },
		});
		let callIndex = 0;
		const ctx = {
			helpers: {
				httpRequest: jest.fn().mockImplementation(async () => {
					callIndex++;
					if (callIndex === 1) throw err429;
					return { ok: true };
				}),
			},
		} as unknown as Parameters<typeof queryWithFallback>[0];
		const result = await queryWithFallback(ctx, providers);
		expect(result.rateLimited).toBe(true);
		expect(result.retryAfterMs).toBeUndefined();
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

describe('clampTimeout', () => {
	it('should return value within valid range unchanged', () => {
		expect(clampTimeout(5000)).toBe(5000);
	});

	it('should clamp below minimum to MIN_TIMEOUT_MS', () => {
		expect(clampTimeout(500)).toBe(MIN_TIMEOUT_MS);
		expect(clampTimeout(0)).toBe(MIN_TIMEOUT_MS);
		expect(clampTimeout(-100)).toBe(MIN_TIMEOUT_MS);
	});

	it('should clamp above maximum to MAX_TIMEOUT_MS', () => {
		expect(clampTimeout(100000)).toBe(MAX_TIMEOUT_MS);
		expect(clampTimeout(60001)).toBe(MAX_TIMEOUT_MS);
	});

	it('should return DEFAULT for NaN', () => {
		expect(clampTimeout(NaN)).toBe(DEFAULT_TIMEOUT_MS);
	});

	it('should return DEFAULT for Infinity', () => {
		expect(clampTimeout(Infinity)).toBe(DEFAULT_TIMEOUT_MS);
		expect(clampTimeout(-Infinity)).toBe(DEFAULT_TIMEOUT_MS);
	});

	it('should accept exact boundary values', () => {
		expect(clampTimeout(MIN_TIMEOUT_MS)).toBe(MIN_TIMEOUT_MS);
		expect(clampTimeout(MAX_TIMEOUT_MS)).toBe(MAX_TIMEOUT_MS);
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

	it('should include rate_limited when rateLimited=true', () => {
		const meta = buildMeta('cnpjws', '11222333000181', ['brasilapi: [429] Too Many Requests'], true, 3000);
		expect(meta.rate_limited).toBe(true);
		expect(meta.retry_after_ms).toBe(3000);
	});

	it('should not include rate_limited when rateLimited=false', () => {
		const meta = buildMeta('brasilapi', 'test', []);
		expect(Object.keys(meta)).not.toContain('rate_limited');
		expect(Object.keys(meta)).not.toContain('retry_after_ms');
	});

	it('should include rate_limited without retry_after_ms when no Retry-After', () => {
		const meta = buildMeta('cnpjws', 'test', ['brasilapi: [429]'], true);
		expect(meta.rate_limited).toBe(true);
		expect(Object.keys(meta)).not.toContain('retry_after_ms');
	});
});

describe('reorderProviders', () => {
	const providers = [
		{ name: 'brasilapi', url: 'https://a' },
		{ name: 'cnpjws', url: 'https://b' },
		{ name: 'receitaws', url: 'https://c' },
	];

	it('should move chosen provider to first position', () => {
		const result = reorderProviders(providers, 'cnpjws');
		expect(result.map((p) => p.name)).toEqual(['cnpjws', 'brasilapi', 'receitaws']);
	});

	it('should keep order when primary is "auto"', () => {
		const result = reorderProviders(providers, 'auto');
		expect(result).toBe(providers);
	});

	it('should keep order when primary is empty string', () => {
		const result = reorderProviders(providers, '');
		expect(result).toBe(providers);
	});

	it('should keep order when primary not found', () => {
		const result = reorderProviders(providers, 'unknown');
		expect(result).toBe(providers);
	});

	it('should keep order when primary is already first', () => {
		const result = reorderProviders(providers, 'brasilapi');
		expect(result).toBe(providers);
	});

	it('should move last provider to first', () => {
		const result = reorderProviders(providers, 'receitaws');
		expect(result.map((p) => p.name)).toEqual(['receitaws', 'brasilapi', 'cnpjws']);
	});

	it('should not mutate the original array', () => {
		const original = [...providers];
		reorderProviders(providers, 'cnpjws');
		expect(providers).toEqual(original);
	});
});

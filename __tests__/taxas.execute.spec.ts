import { taxasList, taxasQuery } from '../nodes/BrasilHub/resources/taxas/taxas.execute';

const listResponse = [
	{ nome: 'Selic', valor: 14.75 },
	{ nome: 'CDI', valor: 14.65 },
	{ nome: 'IPCA', valor: 4.23 },
];

const queryResponse = {
	nome: 'Selic',
	valor: 14.75,
};

function createMockContext(
	overrides: Record<string, unknown> = {},
	httpResponse: unknown = listResponse,
) {
	const params: Record<string, unknown> = {
		rateCode: 'Selic',
		includeRaw: false,
		...overrides,
	};
	return {
		getNodeParameter: jest.fn((name: string, _index: number, fallback?: unknown) =>
			params[name] ?? fallback,
		),
		getNode: jest.fn(() => ({ name: 'Brasil Hub' })),
		helpers: {
			httpRequest: jest.fn().mockResolvedValue(httpResponse),
		},
	} as unknown as Parameters<typeof taxasList>[0];
}

describe('taxasList', () => {
	it('should return multiple items (one per taxa)', async () => {
		const ctx = createMockContext({}, listResponse);
		const results = await taxasList(ctx, 0);
		expect(results).toHaveLength(3);
		expect(results[0].json).toHaveProperty('name', 'Selic');
		expect(results[0].json).toHaveProperty('value', 14.75);
		expect(results[1].json).toHaveProperty('name', 'CDI');
		expect(results[2].json).toHaveProperty('name', 'IPCA');
	});

	it('should include _meta on each item', async () => {
		const ctx = createMockContext({}, listResponse);
		const results = await taxasList(ctx, 0);
		for (const r of results) {
			expect(r.json._meta).toHaveProperty('provider', 'brasilapi');
			expect(r.json._meta).toHaveProperty('query', 'taxas');
			expect(r.json._meta).toHaveProperty('strategy', 'direct');
			expect(r.pairedItem).toEqual({ item: 0 });
		}
	});

	it('should include _raw when includeRaw is true', async () => {
		const ctx = createMockContext({ includeRaw: true }, listResponse);
		const results = await taxasList(ctx, 0);
		expect(results[0].json._raw).toEqual(listResponse[0]);
		expect(results[1].json._raw).toEqual(listResponse[1]);
		expect(results[2].json._raw).toEqual(listResponse[2]);
	});

	it('should not include _raw when includeRaw is false', async () => {
		const ctx = createMockContext({ includeRaw: false }, listResponse);
		const results = await taxasList(ctx, 0);
		expect(results[0].json).not.toHaveProperty('_raw');
	});

	it('should handle empty response', async () => {
		const ctx = createMockContext({}, []);
		const results = await taxasList(ctx, 0);
		expect(results).toEqual([]);
	});

	it('should handle non-array response gracefully', async () => {
		const ctx = createMockContext({}, { unexpected: 'response' });
		const results = await taxasList(ctx, 0);
		expect(results).toEqual([]);
	});

	it('should handle null response gracefully', async () => {
		const ctx = createMockContext({}, null);
		const results = await taxasList(ctx, 0);
		expect(results).toEqual([]);
	});

	it('should call correct URL', async () => {
		const ctx = createMockContext({}, listResponse);
		await taxasList(ctx, 0);
		const callUrl = (ctx.helpers.httpRequest as jest.Mock).mock.calls[0][0].url;
		expect(callUrl).toBe('https://brasilapi.com.br/api/taxas/v1');
	});

	it('should throw on HTTP failure via queryWithFallback', async () => {
		const ctx = createMockContext({}, listResponse);
		(ctx.helpers.httpRequest as jest.Mock).mockRejectedValue(new Error('Network error'));
		await expect(taxasList(ctx, 0)).rejects.toThrow('No provider could fulfill the request');
	});

	it('should pass correct headers', async () => {
		const ctx = createMockContext({}, listResponse);
		await taxasList(ctx, 0);
		const requestConfig = (ctx.helpers.httpRequest as jest.Mock).mock.calls[0][0];
		expect(requestConfig.headers).toHaveProperty('User-Agent', 'n8n-brasil-hub-node/1.0');
		expect(requestConfig.headers).toHaveProperty('Accept', 'application/json');
	});
});

describe('taxasQuery', () => {
	it('should return single item with normalized taxa data', async () => {
		const ctx = createMockContext({ rateCode: 'Selic' }, queryResponse);
		const results = await taxasQuery(ctx, 0);
		expect(results).toHaveLength(1);
		expect(results[0].json).toHaveProperty('name', 'Selic');
		expect(results[0].json).toHaveProperty('value', 14.75);
		expect(results[0].pairedItem).toEqual({ item: 0 });
	});

	it('should include _meta with rateCode as query', async () => {
		const ctx = createMockContext({ rateCode: 'Selic' }, queryResponse);
		const results = await taxasQuery(ctx, 0);
		expect(results[0].json._meta).toHaveProperty('provider', 'brasilapi');
		expect(results[0].json._meta).toHaveProperty('query', 'Selic');
		expect(results[0].json._meta).toHaveProperty('strategy', 'direct');
	});

	it('should include _raw when includeRaw is true', async () => {
		const ctx = createMockContext({ rateCode: 'Selic', includeRaw: true }, queryResponse);
		const results = await taxasQuery(ctx, 0);
		expect(results[0].json).toHaveProperty('_raw');
		expect(results[0].json._raw).toEqual(queryResponse);
	});

	it('should not include _raw when includeRaw is false', async () => {
		const ctx = createMockContext({ rateCode: 'Selic', includeRaw: false }, queryResponse);
		const results = await taxasQuery(ctx, 0);
		expect(results[0].json).not.toHaveProperty('_raw');
	});

	it('should call correct URL with encoded rate code', async () => {
		const ctx = createMockContext({ rateCode: 'Selic' }, queryResponse);
		await taxasQuery(ctx, 0);
		const callUrl = (ctx.helpers.httpRequest as jest.Mock).mock.calls[0][0].url;
		expect(callUrl).toBe('https://brasilapi.com.br/api/taxas/v1/Selic');
	});

	it('should throw on empty rateCode', async () => {
		const ctx = createMockContext({ rateCode: '' });
		await expect(taxasQuery(ctx, 0)).rejects.toThrow('Invalid rate code');
		expect(ctx.helpers.httpRequest).not.toHaveBeenCalled();
	});

	it('should throw on whitespace-only rateCode', async () => {
		const ctx = createMockContext({ rateCode: '   ' });
		await expect(taxasQuery(ctx, 0)).rejects.toThrow('Invalid rate code');
		expect(ctx.helpers.httpRequest).not.toHaveBeenCalled();
	});

	it('should throw on rateCode with special characters', async () => {
		const ctx = createMockContext({ rateCode: 'Selic@#$' });
		await expect(taxasQuery(ctx, 0)).rejects.toThrow('Invalid rate code');
		expect(ctx.helpers.httpRequest).not.toHaveBeenCalled();
	});

	it('should throw on rateCode with spaces', async () => {
		const ctx = createMockContext({ rateCode: 'rate code' });
		await expect(taxasQuery(ctx, 0)).rejects.toThrow('Invalid rate code');
	});

	it('should throw on rateCode longer than 50 chars', async () => {
		const ctx = createMockContext({ rateCode: 'a'.repeat(51) });
		await expect(taxasQuery(ctx, 0)).rejects.toThrow('Invalid rate code');
	});

	it('should accept rateCode with allowed characters', async () => {
		const ctx = createMockContext({ rateCode: 'IPCA-15' }, queryResponse);
		const results = await taxasQuery(ctx, 0);
		expect(results).toHaveLength(1);
	});

	it('should accept rateCode with underscores', async () => {
		const ctx = createMockContext({ rateCode: 'taxa_selic' }, queryResponse);
		const results = await taxasQuery(ctx, 0);
		expect(results).toHaveLength(1);
	});

	it('should accept rateCode at max length (50 chars)', async () => {
		const code = 'a'.repeat(50);
		const ctx = createMockContext({ rateCode: code }, queryResponse);
		const results = await taxasQuery(ctx, 0);
		expect(results).toHaveLength(1);
	});

	it('should trim rateCode', async () => {
		const ctx = createMockContext({ rateCode: '  Selic  ' }, queryResponse);
		const results = await taxasQuery(ctx, 0);
		expect(results).toHaveLength(1);
		expect(results[0].json._meta).toHaveProperty('query', 'Selic');
	});

	it('should throw on HTTP failure via queryWithFallback', async () => {
		const ctx = createMockContext({ rateCode: 'Selic' }, queryResponse);
		(ctx.helpers.httpRequest as jest.Mock).mockRejectedValue(new Error('Timeout'));
		await expect(taxasQuery(ctx, 0)).rejects.toThrow('No provider could fulfill the request');
	});

	it('should handle null rateCode parameter', async () => {
		const ctx = createMockContext({ rateCode: null });
		await expect(taxasQuery(ctx, 0)).rejects.toThrow('Invalid rate code');
	});

	it('should handle undefined rateCode parameter', async () => {
		// When rateCode is undefined, getNodeParameter returns fallback which is undefined for rateCode
		const params: Record<string, unknown> = { includeRaw: false };
		const ctx = {
			getNodeParameter: jest.fn((name: string, _index: number, fallback?: unknown) =>
				params[name] ?? fallback,
			),
			getNode: jest.fn(() => ({ name: 'Brasil Hub' })),
			helpers: {
				httpRequest: jest.fn().mockResolvedValue(queryResponse),
			},
		} as unknown as Parameters<typeof taxasQuery>[0];
		await expect(taxasQuery(ctx, 0)).rejects.toThrow('Invalid rate code');
	});

	it('should encode rateCode in URL (defense-in-depth)', async () => {
		const ctx = createMockContext({ rateCode: 'CDI' }, queryResponse);
		await taxasQuery(ctx, 0);
		const callUrl = (ctx.helpers.httpRequest as jest.Mock).mock.calls[0][0].url;
		expect(callUrl).toContain('/taxas/v1/CDI');
	});

	it('should include _meta.queried_at as ISO string', async () => {
		const ctx = createMockContext({ rateCode: 'Selic' }, queryResponse);
		const results = await taxasQuery(ctx, 0);
		expect(results[0].json._meta).toHaveProperty('queried_at');
		expect(typeof (results[0].json._meta as Record<string, unknown>).queried_at).toBe('string');
	});
});

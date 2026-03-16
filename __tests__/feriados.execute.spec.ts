import { feriadosQuery } from '../nodes/BrasilHub/resources/feriados/feriados.execute';

const brasilApiResponse = [
	{ date: '2026-01-01', name: 'Confraternização mundial', type: 'national' },
	{ date: '2026-02-17', name: 'Carnaval', type: 'national' },
];

function createMockContext(overrides: Record<string, unknown> = {}, httpResponse: unknown = brasilApiResponse) {
	const params: Record<string, unknown> = {
		year: 2026,
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
	} as unknown as Parameters<typeof feriadosQuery>[0];
}

describe('feriadosQuery', () => {
	it('should return multiple items (one per holiday)', async () => {
		const ctx = createMockContext();
		const results = await feriadosQuery(ctx, 0);
		expect(results).toHaveLength(2);
		expect(results[0].json).toHaveProperty('date', '2026-01-01');
		expect(results[0].json).toHaveProperty('name', 'Confraternização mundial');
		expect(results[1].json).toHaveProperty('name', 'Carnaval');
	});

	it('should include _meta on each item', async () => {
		const ctx = createMockContext();
		const results = await feriadosQuery(ctx, 0);
		for (const r of results) {
			expect(r.json).toHaveProperty('_meta');
			expect(r.json._meta).toHaveProperty('provider', 'brasilapi');
			expect(r.json._meta).toHaveProperty('query', '2026');
			expect(r.pairedItem).toEqual({ item: 0 });
		}
	});

	it('should include _raw per item when includeRaw is true', async () => {
		const ctx = createMockContext({ includeRaw: true });
		const results = await feriadosQuery(ctx, 0);
		expect(results[0].json).toHaveProperty('_raw');
	});

	it('should throw on year below 1900', async () => {
		const ctx = createMockContext({ year: 1899 });
		await expect(feriadosQuery(ctx, 0)).rejects.toThrow('Invalid year');
	});

	it('should throw on year above 2199', async () => {
		const ctx = createMockContext({ year: 2200 });
		await expect(feriadosQuery(ctx, 0)).rejects.toThrow('Invalid year');
	});

	it('should throw on non-integer year', async () => {
		const ctx = createMockContext({ year: 2026.5 });
		await expect(feriadosQuery(ctx, 0)).rejects.toThrow('Invalid year');
	});

	it('should accept boundary years 1900 and 2199', async () => {
		const ctx1900 = createMockContext({ year: 1900 });
		const results = await feriadosQuery(ctx1900, 0);
		expect(results).toHaveLength(2);

		const ctx2199 = createMockContext({ year: 2199 });
		const results2 = await feriadosQuery(ctx2199, 0);
		expect(results2).toHaveLength(2);
	});

	it('should set strategy to fallback when first provider fails', async () => {
		let callCount = 0;
		const ctx = {
			...createMockContext(),
			helpers: {
				httpRequest: jest.fn().mockImplementation(async () => {
					callCount++;
					if (callCount === 1) throw new Error('Timeout');
					return [
						{
							date: '2026-01-01',
							localName: 'Confraternização Universal',
							name: 'New Year',
							types: ['Public'],
						},
					];
				}),
			},
		} as unknown as Parameters<typeof feriadosQuery>[0];
		const results = await feriadosQuery(ctx, 0);
		expect(results[0].json._meta).toHaveProperty('strategy', 'fallback');
		expect(results[0].json._meta).toHaveProperty('provider', 'nagerdate');
	});
});

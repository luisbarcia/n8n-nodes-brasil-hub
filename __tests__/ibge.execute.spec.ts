import { ibgeStates, ibgeCities } from '../nodes/BrasilHub/resources/ibge/ibge.execute';

const statesResponse = [
	{ id: 11, sigla: 'RO', nome: 'Rondônia', regiao: { id: 1, sigla: 'N', nome: 'Norte' } },
	{ id: 35, sigla: 'SP', nome: 'São Paulo', regiao: { id: 3, sigla: 'SE', nome: 'Sudeste' } },
];

const citiesResponse = [
	{ nome: 'ADAMANTINA', codigo_ibge: '3500105' },
	{ nome: 'ADOLFO', codigo_ibge: '3500204' },
];

function createMockContext(overrides: Record<string, unknown> = {}, httpResponse: unknown = statesResponse) {
	const params: Record<string, unknown> = {
		uf: 'SP',
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
	} as unknown as Parameters<typeof ibgeStates>[0];
}

describe('ibgeStates', () => {
	it('should return multiple items (one per state)', async () => {
		const ctx = createMockContext({}, statesResponse);
		const results = await ibgeStates(ctx, 0);
		expect(results).toHaveLength(2);
		expect(results[0].json).toHaveProperty('abbreviation', 'RO');
		expect(results[1].json).toHaveProperty('abbreviation', 'SP');
	});

	it('should include _meta on each item', async () => {
		const ctx = createMockContext({}, statesResponse);
		const results = await ibgeStates(ctx, 0);
		for (const r of results) {
			expect(r.json).toHaveProperty('_meta');
			expect(r.json._meta).toHaveProperty('provider', 'brasilapi');
			expect(r.pairedItem).toEqual({ item: 0 });
		}
	});

	it('should include _raw when includeRaw is true', async () => {
		const ctx = createMockContext({ includeRaw: true }, statesResponse);
		const results = await ibgeStates(ctx, 0);
		expect(results[0].json).toHaveProperty('_raw');
	});
});

describe('ibgeCities', () => {
	it('should return multiple items (one per city)', async () => {
		const ctx = createMockContext({}, citiesResponse);
		const results = await ibgeCities(ctx, 0);
		expect(results).toHaveLength(2);
		expect(results[0].json).toHaveProperty('name', 'ADAMANTINA');
		expect(results[0].json).toHaveProperty('code', 3500105);
	});

	it('should throw on invalid UF', async () => {
		const ctx = createMockContext({ uf: 'XX' });
		await expect(ibgeCities(ctx, 0)).rejects.toThrow('Invalid state');
	});

	it('should throw on empty UF', async () => {
		const ctx = createMockContext({ uf: '' });
		await expect(ibgeCities(ctx, 0)).rejects.toThrow('Invalid state');
	});

	it('should accept lowercase UF', async () => {
		const ctx = createMockContext({ uf: 'sp' }, citiesResponse);
		const results = await ibgeCities(ctx, 0);
		expect(results).toHaveLength(2);
	});

	it('should include _meta with query showing UF', async () => {
		const ctx = createMockContext({}, citiesResponse);
		const results = await ibgeCities(ctx, 0);
		expect(results[0].json._meta).toHaveProperty('query', 'SP');
	});

	it('should set strategy to fallback when first provider fails', async () => {
		let callCount = 0;
		const ctx = {
			...createMockContext(),
			helpers: {
				httpRequest: jest.fn().mockImplementation(async () => {
					callCount++;
					if (callCount === 1) throw new Error('Timeout');
					return [{ id: 3500105, nome: 'Adamantina' }];
				}),
			},
		} as unknown as Parameters<typeof ibgeCities>[0];
		const results = await ibgeCities(ctx, 0);
		expect(results[0].json._meta).toHaveProperty('strategy', 'fallback');
		expect(results[0].json._meta).toHaveProperty('provider', 'ibge');
	});
});

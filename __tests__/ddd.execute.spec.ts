import { dddQuery } from '../nodes/BrasilHub/resources/ddd/ddd.execute';

function createMockContext(overrides: Record<string, unknown> = {}) {
	const params: Record<string, unknown> = {
		ddd: '11',
		includeRaw: false,
		...overrides,
	};
	return {
		getNodeParameter: jest.fn((name: string, _index: number, fallback?: unknown) =>
			params[name] ?? fallback,
		),
		getNode: jest.fn(() => ({ name: 'Brasil Hub' })),
		helpers: {
			httpRequest: jest.fn().mockResolvedValue({
				state: 'SP',
				cities: ['SÃO PAULO', 'GUARULHOS'],
			}),
		},
	} as unknown as Parameters<typeof dddQuery>[0];
}

describe('dddQuery', () => {
	it('should return normalized DDD data with _meta', async () => {
		const ctx = createMockContext();
		const [result] = await dddQuery(ctx, 0);
		expect(result.json).toHaveProperty('state', 'SP');
		expect(result.json).toHaveProperty('cities');
		expect(result.json).toHaveProperty('_meta');
		expect(result.json._meta).toHaveProperty('provider', 'brasilapi');
		expect(result.pairedItem).toEqual({ item: 0 });
	});

	it('should throw on DDD less than 11', async () => {
		const ctx = createMockContext({ ddd: '10' });
		await expect(dddQuery(ctx, 0)).rejects.toThrow('Invalid DDD: must be a 2-digit area code between 11 and 99');
	});

	it('should throw on DDD greater than 99', async () => {
		const ctx = createMockContext({ ddd: '100' });
		await expect(dddQuery(ctx, 0)).rejects.toThrow('Invalid DDD: must be a 2-digit area code between 11 and 99');
	});

	it('should throw on non-numeric DDD', async () => {
		const ctx = createMockContext({ ddd: 'SP' });
		await expect(dddQuery(ctx, 0)).rejects.toThrow('Invalid DDD: must be a 2-digit area code between 11 and 99');
	});

	it('should include raw response when includeRaw is true', async () => {
		const ctx = createMockContext({ includeRaw: true });
		const [result] = await dddQuery(ctx, 0);
		expect(result.json).toHaveProperty('_raw');
	});
});

describe('dddQuery with fallback', () => {
	it('should fall back to municipios-brasileiros and return state + cities', async () => {
		let callCount = 0;
		const ctx = {
			...createMockContext(),
			helpers: {
				httpRequest: jest.fn().mockImplementation(async () => {
					callCount++;
					if (callCount === 1) throw new Error('BrasilAPI down');
					return [
						{ codigo_ibge: 3550308, nome: 'São Paulo', codigo_uf: 35, ddd: 11 },
						{ codigo_ibge: 3518800, nome: 'Guarulhos', codigo_uf: 35, ddd: 11 },
						{ codigo_ibge: 9999999, nome: 'Other', codigo_uf: 35, ddd: 21 },
					];
				}),
			},
		} as unknown as Parameters<typeof dddQuery>[0];
		const [result] = await dddQuery(ctx, 0);
		expect(result.json._meta).toHaveProperty('strategy', 'fallback');
		expect(result.json).toHaveProperty('state', 'SP');
		expect(result.json.cities).toEqual(['São Paulo', 'Guarulhos']);
	});
});

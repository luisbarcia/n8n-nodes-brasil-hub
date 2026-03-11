import { cepQuery, cepValidate } from '../nodes/BrasilHub/resources/cep/cep.execute';

function createMockContext(overrides: Record<string, unknown> = {}) {
	const params: Record<string, unknown> = {
		cep: '01001000',
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
				cep: '01001000',
				state: 'SP',
				city: 'São Paulo',
				neighborhood: 'Sé',
				street: 'Praça da Sé',
				service: 'open-cep',
			}),
		},
	} as unknown as Parameters<typeof cepQuery>[0];
}

describe('cepQuery', () => {
	it('should return normalized data with _meta', async () => {
		const ctx = createMockContext();
		const result = await cepQuery(ctx, 0);
		expect(result.json).toHaveProperty('cep', '01001000');
		expect(result.json).toHaveProperty('_meta');
		expect(result.json._meta).toHaveProperty('provider', 'brasilapi');
		expect(result.json._meta).toHaveProperty('strategy', 'direct');
		expect(result.pairedItem).toEqual({ item: 0 });
	});

	it('should throw on invalid CEP length', async () => {
		const ctx = createMockContext({ cep: '123' });
		await expect(cepQuery(ctx, 0)).rejects.toThrow('CEP must have 8 digits');
	});

	it('should throw on all-zeros CEP before making HTTP calls', async () => {
		const ctx = createMockContext({ cep: '00000000' });
		await expect(cepQuery(ctx, 0)).rejects.toThrow('Invalid CEP');
		expect(ctx.helpers.httpRequest).not.toHaveBeenCalled();
	});
});

describe('cepQuery with fallback', () => {
	it('should set strategy to fallback when first provider fails', async () => {
		let callCount = 0;
		const ctx = {
			...createMockContext(),
			helpers: {
				httpRequest: jest.fn().mockImplementation(async () => {
					callCount++;
					if (callCount === 1) throw new Error('Timeout');
					return {
						cep: '01001000', state: 'SP', city: 'São Paulo',
						neighborhood: 'Sé', street: 'Praça da Sé',
					};
				}),
			},
		} as unknown as Parameters<typeof cepQuery>[0];
		const result = await cepQuery(ctx, 0);
		expect(result.json._meta).toHaveProperty('strategy', 'fallback');
		expect(result.json._meta).toHaveProperty('errors');
	});
});

describe('cepQuery with includeRaw', () => {
	it('should include raw response when includeRaw is true', async () => {
		const ctx = createMockContext({ includeRaw: true });
		const result = await cepQuery(ctx, 0);
		expect(result.json).toHaveProperty('_raw');
	});
});

describe('cepValidate', () => {
	it('should return validation result', async () => {
		const ctx = createMockContext({ cep: '01001-000' });
		const result = await cepValidate(ctx, 0);
		expect(result.json).toEqual({
			valid: true,
			formatted: '01001-000',
			input: '01001-000',
		});
		expect(result.pairedItem).toEqual({ item: 0 });
	});
});

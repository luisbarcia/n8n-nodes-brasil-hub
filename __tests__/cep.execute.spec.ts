import { cepQuery, cepValidate } from '../nodes/BrasilHub/resources/cep/cep.execute';

jest.useFakeTimers();

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

async function runWithTimers<T>(promise: Promise<T>): Promise<T> {
	const result = promise;
	for (let i = 0; i < 5; i++) {
		jest.advanceTimersByTime(1100);
		await Promise.resolve();
	}
	return result;
}

afterAll(() => jest.useRealTimers());

describe('cepQuery', () => {
	it('should return normalized data with _meta', async () => {
		const ctx = createMockContext();
		const result = await runWithTimers(cepQuery(ctx, 0));
		expect(result.json).toHaveProperty('cep', '01001000');
		expect(result.json).toHaveProperty('_meta');
		expect(result.json._meta).toHaveProperty('provider', 'brasilapi');
		expect(result.pairedItem).toEqual({ item: 0 });
	});

	it('should throw on invalid CEP length', async () => {
		const ctx = createMockContext({ cep: '123' });
		await expect(cepQuery(ctx, 0)).rejects.toThrow('CEP must have 8 digits');
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

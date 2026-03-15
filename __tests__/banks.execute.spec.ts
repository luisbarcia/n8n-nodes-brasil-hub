import { banksQuery, banksList } from '../nodes/BrasilHub/resources/banks/banks.execute';

const brasilApiBankResponse = {
	ispb: '00000000',
	name: 'BCO DO BRASIL S.A.',
	code: 1,
	fullName: 'Banco do Brasil S.A.',
};

const brasilApiListResponse = [
	{ ispb: '00000000', name: 'BCO DO BRASIL S.A.', code: 1, fullName: 'Banco do Brasil S.A.' },
	{ ispb: '00000208', name: 'BRB - BCO DE BRASILIA S.A.', code: 70, fullName: 'BRB - BANCO DE BRASILIA S.A.' },
];

function createMockContext(overrides: Record<string, unknown> = {}) {
	const params: Record<string, unknown> = {
		bankCode: '1',
		includeRaw: false,
		...overrides,
	};
	return {
		getNodeParameter: jest.fn((name: string, _index: number, fallback?: unknown) =>
			params[name] ?? fallback,
		),
		getNode: jest.fn(() => ({ name: 'Brasil Hub' })),
		helpers: {
			httpRequest: jest.fn().mockResolvedValue(brasilApiBankResponse),
		},
	} as unknown as Parameters<typeof banksQuery>[0];
}

describe('banksQuery', () => {
	it('should return normalized bank data with _meta', async () => {
		const ctx = createMockContext();
		const [result] = await banksQuery(ctx, 0);
		expect(result.json).toHaveProperty('code', 1);
		expect(result.json).toHaveProperty('name', 'BCO DO BRASIL S.A.');
		expect(result.json).toHaveProperty('fullName', 'Banco do Brasil S.A.');
		expect(result.json).toHaveProperty('ispb', '00000000');
		expect(result.json).toHaveProperty('_meta');
		expect(result.json._meta).toHaveProperty('provider', 'brasilapi');
		expect(result.pairedItem).toEqual({ item: 0 });
	});

	it('should throw on invalid bank code (zero)', async () => {
		const ctx = createMockContext({ bankCode: '0' });
		await expect(banksQuery(ctx, 0)).rejects.toThrow('Invalid bank code: must be a positive number');
	});

	it('should throw on invalid bank code (negative)', async () => {
		const ctx = createMockContext({ bankCode: '-5' });
		await expect(banksQuery(ctx, 0)).rejects.toThrow('Invalid bank code: must be a positive number');
	});

	it('should throw on non-numeric bank code', async () => {
		const ctx = createMockContext({ bankCode: 'abc' });
		await expect(banksQuery(ctx, 0)).rejects.toThrow('Invalid bank code: must be a positive number');
	});

	it('should handle formatted bank code with leading zeros', async () => {
		const ctx = createMockContext({ bankCode: '001' });
		const [result] = await banksQuery(ctx, 0);
		expect(result.json).toHaveProperty('code', 1);
	});
});

describe('banksList', () => {
	it('should return multiple items (one per bank)', async () => {
		const ctx = createMockContext();
		(ctx.helpers.httpRequest as jest.Mock).mockResolvedValue(brasilApiListResponse);
		const results = await banksList(ctx, 0);
		expect(results).toHaveLength(2);
		expect(results[0].json).toHaveProperty('code', 1);
		expect(results[1].json).toHaveProperty('code', 70);
	});

	it('should include _meta on each item', async () => {
		const ctx = createMockContext();
		(ctx.helpers.httpRequest as jest.Mock).mockResolvedValue(brasilApiListResponse);
		const results = await banksList(ctx, 0);
		for (const result of results) {
			expect(result.json).toHaveProperty('_meta');
			expect(result.json._meta).toHaveProperty('provider', 'brasilapi');
			expect(result.pairedItem).toEqual({ item: 0 });
		}
	});

	it('should include _raw per bank when includeRaw is true', async () => {
		const ctx = createMockContext({ includeRaw: true });
		(ctx.helpers.httpRequest as jest.Mock).mockResolvedValue(brasilApiListResponse);
		const results = await banksList(ctx, 0);
		expect(results[0].json).toHaveProperty('_raw');
	});
});

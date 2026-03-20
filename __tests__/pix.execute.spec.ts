import { pixList, pixQuery } from '../nodes/BrasilHub/resources/pix/pix.execute';

const participantsResponse = [
	{
		ispb: '00000000',
		cnpj: '00000000000191',
		nome: 'BANCO DO BRASIL S.A.',
		nome_reduzido: 'BCO DO BRASIL S.A.',
		modalidade_participacao: 'PDCT',
		tipo_participacao: 'DRCT',
		inicio_operacao: '2020-11-03T09:30:00.000Z',
	},
	{
		ispb: '00360305',
		cnpj: '60746948000112',
		nome: 'CAIXA ECONOMICA FEDERAL',
		nome_reduzido: 'CAIXA ECONOMICA FEDERAL',
		modalidade_participacao: 'PDCT',
		tipo_participacao: 'DRCT',
		inicio_operacao: '2020-11-03T09:30:00.000Z',
	},
];

function createMockContext(overrides: Record<string, unknown> = {}, httpResponse: unknown = participantsResponse) {
	const params: Record<string, unknown> = {
		ispb: '00000000',
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
	} as unknown as Parameters<typeof pixList>[0];
}

describe('pixList', () => {
	it('should return multiple items (one per participant)', async () => {
		const ctx = createMockContext({}, participantsResponse);
		const results = await pixList(ctx, 0);
		expect(results).toHaveLength(2);
		expect(results[0].json).toHaveProperty('ispb', '00000000');
		expect(results[0].json).toHaveProperty('name', 'BANCO DO BRASIL S.A.');
		expect(results[1].json).toHaveProperty('ispb', '00360305');
	});

	it('should include _meta on each item', async () => {
		const ctx = createMockContext({}, participantsResponse);
		const results = await pixList(ctx, 0);
		for (const r of results) {
			expect(r.json._meta).toHaveProperty('provider', 'brasilapi');
			expect(r.json._meta).toHaveProperty('query', 'pix/participants');
			expect(r.pairedItem).toEqual({ item: 0 });
		}
	});

	it('should include _raw when includeRaw is true', async () => {
		const ctx = createMockContext({ includeRaw: true }, participantsResponse);
		const results = await pixList(ctx, 0);
		expect(results[0].json).toHaveProperty('_raw');
	});

	it('should handle empty response', async () => {
		const ctx = createMockContext({}, []);
		const results = await pixList(ctx, 0);
		expect(results).toEqual([]);
	});

	it('should call correct URL', async () => {
		const ctx = createMockContext({}, participantsResponse);
		await pixList(ctx, 0);
		const callUrl = (ctx.helpers.httpRequest as jest.Mock).mock.calls[0][0].url;
		expect(callUrl).toContain('/pix/v1/participants');
	});
});

describe('pixQuery', () => {
	it('should return single item matching ISPB', async () => {
		const ctx = createMockContext({ ispb: '00000000' }, participantsResponse);
		const results = await pixQuery(ctx, 0);
		expect(results).toHaveLength(1);
		expect(results[0].json).toHaveProperty('ispb', '00000000');
		expect(results[0].json).toHaveProperty('name', 'BANCO DO BRASIL S.A.');
	});

	it('should include _meta with ISPB as query', async () => {
		const ctx = createMockContext({ ispb: '00000000' }, participantsResponse);
		const results = await pixQuery(ctx, 0);
		expect(results[0].json._meta).toHaveProperty('query', '00000000');
	});

	it('should throw on invalid ISPB (not 8 digits)', async () => {
		const ctx = createMockContext({ ispb: '123' }, participantsResponse);
		await expect(pixQuery(ctx, 0)).rejects.toThrow('Invalid ISPB code');
	});

	it('should throw on non-numeric ISPB', async () => {
		const ctx = createMockContext({ ispb: 'ABCDEFGH' }, participantsResponse);
		await expect(pixQuery(ctx, 0)).rejects.toThrow('Invalid ISPB code');
	});

	it('should throw when ISPB not found', async () => {
		const ctx = createMockContext({ ispb: '99999999' }, participantsResponse);
		await expect(pixQuery(ctx, 0)).rejects.toThrow('PIX participant not found');
	});

	it('should strip non-digit characters from ISPB', async () => {
		const ctx = createMockContext({ ispb: '00.000.000' }, participantsResponse);
		const results = await pixQuery(ctx, 0);
		expect(results[0].json).toHaveProperty('ispb', '00000000');
	});

	it('should include _raw when includeRaw is true', async () => {
		const ctx = createMockContext({ ispb: '00000000', includeRaw: true }, participantsResponse);
		const results = await pixQuery(ctx, 0);
		expect(results[0].json).toHaveProperty('_raw');
	});

	it('should match second participant by ISPB', async () => {
		const ctx = createMockContext({ ispb: '00360305' }, participantsResponse);
		const results = await pixQuery(ctx, 0);
		expect(results[0].json).toHaveProperty('name', 'CAIXA ECONOMICA FEDERAL');
	});
});

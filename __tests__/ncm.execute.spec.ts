import { ncmQuery, ncmSearch } from '../nodes/BrasilHub/resources/ncm/ncm.execute';

const queryResponse = {
	codigo: '8504.40.10',
	descricao: 'Carregadores de acumuladores',
	data_inicio: '2022-04-01',
	data_fim: '9999-12-31',
	tipo_ato: 'Res Camex',
	numero_ato: '272',
	ano_ato: '2021',
};

const searchResponse = [
	{ codigo: '8537.10.1', descricao: 'CNC', data_inicio: '2022-04-01', data_fim: '9999-12-31', tipo_ato: 'Res Camex', numero_ato: '272', ano_ato: '2021' },
	{ codigo: '9018.49.91', descricao: 'Peças cerâmicas', data_inicio: '2022-04-01', data_fim: '9999-12-31', tipo_ato: 'Res Camex', numero_ato: '272', ano_ato: '2021' },
];

function createMockContext(overrides: Record<string, unknown> = {}, httpResponse: unknown = queryResponse) {
	const params: Record<string, unknown> = {
		ncmCode: '8504.40.10',
		searchTerm: 'computador',
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
	} as unknown as Parameters<typeof ncmQuery>[0];
}

describe('ncmQuery', () => {
	it('should return single item with normalized NCM data', async () => {
		const ctx = createMockContext();
		const results = await ncmQuery(ctx, 0);
		expect(results).toHaveLength(1);
		expect(results[0].json).toHaveProperty('code', '8504.40.10');
		expect(results[0].json).toHaveProperty('description', 'Carregadores de acumuladores');
		expect(results[0].json).toHaveProperty('_meta');
		expect(results[0].pairedItem).toEqual({ item: 0 });
	});

	it('should throw when ncmCode is empty', async () => {
		const ctx = createMockContext({ ncmCode: '' });
		await expect(ncmQuery(ctx, 0)).rejects.toThrow('NCM code is required');
	});

	it('should throw when ncmCode is whitespace', async () => {
		const ctx = createMockContext({ ncmCode: '   ' });
		await expect(ncmQuery(ctx, 0)).rejects.toThrow('NCM code is required');
	});

	it('should include _raw when includeRaw is true', async () => {
		const ctx = createMockContext({ includeRaw: true });
		const results = await ncmQuery(ctx, 0);
		expect(results[0].json).toHaveProperty('_raw');
	});

	it('should encode NCM code in URL', async () => {
		const ctx = createMockContext({ ncmCode: '8504.40.10' });
		await ncmQuery(ctx, 0);
		const url = (ctx.helpers.httpRequest as jest.Mock).mock.calls[0][0].url;
		expect(url).toContain('8504.40.10');
	});
});

describe('ncmSearch', () => {
	it('should return multiple items', async () => {
		const ctx = createMockContext({}, searchResponse);
		const results = await ncmSearch(ctx, 0);
		expect(results).toHaveLength(2);
		expect(results[0].json).toHaveProperty('code', '8537.10.1');
		expect(results[1].json).toHaveProperty('code', '9018.49.91');
	});

	it('should throw when searchTerm is less than 3 chars', async () => {
		const ctx = createMockContext({ searchTerm: 'ab' });
		await expect(ncmSearch(ctx, 0)).rejects.toThrow('Search term must be at least 3 characters');
	});

	it('should throw when searchTerm is empty', async () => {
		const ctx = createMockContext({ searchTerm: '' });
		await expect(ncmSearch(ctx, 0)).rejects.toThrow('Search term must be at least 3 characters');
	});

	it('should accept 3-char search term', async () => {
		const ctx = createMockContext({ searchTerm: 'abc' }, searchResponse);
		const results = await ncmSearch(ctx, 0);
		expect(results).toHaveLength(2);
	});

	it('should include _meta with search term as query', async () => {
		const ctx = createMockContext({}, searchResponse);
		const results = await ncmSearch(ctx, 0);
		expect(results[0].json._meta).toHaveProperty('query', 'computador');
	});

	it('should encode search term in URL', async () => {
		const ctx = createMockContext({ searchTerm: 'peças cerâmicas' }, searchResponse);
		await ncmSearch(ctx, 0);
		const url = (ctx.helpers.httpRequest as jest.Mock).mock.calls[0][0].url;
		expect(url).toContain('pe%C3%A7as');
	});
});

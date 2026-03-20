import { fipeReferenceTables, fipeBrands, fipeModels, fipeYears, fipePrice } from '../nodes/BrasilHub/resources/fipe/fipe.execute';

const brandsResponse = [
	{ codigo: '1', nome: 'Acura' },
	{ codigo: '59', nome: 'Honda' },
];

const modelsResponse = {
	modelos: [
		{ codigo: 1, nome: 'Integra GS 1.8' },
		{ codigo: 4828, nome: 'Civic Sedan EXL 2.0' },
	],
	anos: [{ codigo: '2024-1', nome: '2024 Gasolina' }],
};

const yearsResponse = [
	{ codigo: '2024-1', nome: '2024 Gasolina' },
	{ codigo: '2023-1', nome: '2023 Gasolina' },
];

const referenceTablesResponse = [
	{ Codigo: 331, Mes: 'março/2026' },
	{ Codigo: 330, Mes: 'fevereiro/2026' },
	{ Codigo: 329, Mes: 'janeiro/2026' },
	{ Codigo: 328, Mes: 'dezembro/2025' },
];

const priceResponse = {
	TipoVeiculo: 1,
	Valor: 'R$ 148.363,00',
	Marca: 'Honda',
	Modelo: 'Civic Sedan EXL 2.0',
	AnoModelo: 2024,
	Combustivel: 'Gasolina',
	CodigoFipe: '014275-3',
	MesReferencia: 'março de 2026',
	SiglaCombustivel: 'G',
};

function createMockContext(overrides: Record<string, unknown> = {}, httpResponse: unknown = brandsResponse) {
	const params: Record<string, unknown> = {
		vehicleType: 'carros',
		brandCode: '59',
		modelCode: '4828',
		yearCode: '2024-1',
		referenceTable: 0,
		filterYear: 0,
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
	} as unknown as Parameters<typeof fipeBrands>[0];
}

describe('fipeReferenceTables', () => {
	it('should return multiple items (one per reference table)', async () => {
		const ctx = createMockContext({}, referenceTablesResponse);
		const results = await fipeReferenceTables(ctx, 0);
		expect(results).toHaveLength(4);
		expect(results[0].json).toHaveProperty('code', 331);
		expect(results[0].json).toHaveProperty('month', 'março/2026');
	});

	it('should include _meta on each item', async () => {
		const ctx = createMockContext({}, referenceTablesResponse);
		const results = await fipeReferenceTables(ctx, 0);
		for (const r of results) {
			expect(r.json._meta).toHaveProperty('provider', 'parallelum');
			expect(r.json._meta).toHaveProperty('query', 'referencias');
			expect(r.pairedItem).toEqual({ item: 0 });
		}
	});

	it('should filter by year when filterYear > 0', async () => {
		const ctx = createMockContext({ filterYear: 2026 }, referenceTablesResponse);
		const results = await fipeReferenceTables(ctx, 0);
		expect(results).toHaveLength(3);
		expect(results.every((r) => (r.json.month as string).endsWith('/2026'))).toBe(true);
	});

	it('should return all tables when filterYear is 0', async () => {
		const ctx = createMockContext({ filterYear: 0 }, referenceTablesResponse);
		const results = await fipeReferenceTables(ctx, 0);
		expect(results).toHaveLength(4);
	});

	it('should call correct URL (/referencias)', async () => {
		const ctx = createMockContext({}, referenceTablesResponse);
		await fipeReferenceTables(ctx, 0);
		const callUrl = (ctx.helpers.httpRequest as jest.Mock).mock.calls[0][0].url;
		expect(callUrl).toContain('/referencias');
		expect(callUrl).not.toContain('tabela_referencia');
	});

	it('should include correct _raw aligned with each item', async () => {
		const ctx = createMockContext({ includeRaw: true }, referenceTablesResponse);
		const results = await fipeReferenceTables(ctx, 0);
		expect(results[0].json._raw).toEqual(referenceTablesResponse[0]);
		expect(results[1].json._raw).toEqual(referenceTablesResponse[1]);
	});

	it('should align _raw with filtered items when filterYear is active', async () => {
		const unorderedData = [
			{ Codigo: 328, Mes: 'dezembro/2025' },
			{ Codigo: 331, Mes: 'março/2026' },
			{ Codigo: 330, Mes: 'fevereiro/2026' },
		];
		const ctx = createMockContext({ filterYear: 2026, includeRaw: true }, unorderedData);
		const results = await fipeReferenceTables(ctx, 0);
		expect(results).toHaveLength(2);
		expect(results[0].json._raw).toEqual({ Codigo: 331, Mes: 'março/2026' });
		expect(results[1].json._raw).toEqual({ Codigo: 330, Mes: 'fevereiro/2026' });
	});

	it('should include _meta.strategy as direct', async () => {
		const ctx = createMockContext({}, referenceTablesResponse);
		const results = await fipeReferenceTables(ctx, 0);
		expect(results[0].json._meta).toHaveProperty('strategy', 'direct');
	});

	it('should ignore 2-digit filterYear (requires 4 digits)', async () => {
		const ctx = createMockContext({ filterYear: 26 }, referenceTablesResponse);
		const results = await fipeReferenceTables(ctx, 0);
		expect(results).toHaveLength(4); // returns all — 26 is not a valid 4-digit year
	});

	it('should handle NaN/Infinity filterYear gracefully', async () => {
		const ctxNaN = createMockContext({ filterYear: NaN }, referenceTablesResponse);
		const resultsNaN = await fipeReferenceTables(ctxNaN, 0);
		expect(resultsNaN).toHaveLength(4); // returns all

		const ctxInf = createMockContext({ filterYear: Infinity }, referenceTablesResponse);
		const resultsInf = await fipeReferenceTables(ctxInf, 0);
		expect(resultsInf).toHaveLength(4); // returns all
	});

	it('should handle empty response', async () => {
		const ctx = createMockContext({}, []);
		const results = await fipeReferenceTables(ctx, 0);
		expect(results).toEqual([]);
	});
});

describe('fipeBrands', () => {
	it('should return multiple items (one per brand)', async () => {
		const ctx = createMockContext({}, brandsResponse);
		const results = await fipeBrands(ctx, 0);
		expect(results).toHaveLength(2);
		expect(results[0].json).toHaveProperty('code', '1');
		expect(results[0].json).toHaveProperty('name', 'Acura');
		expect(results[1].json).toHaveProperty('code', '59');
	});

	it('should include _meta on each item', async () => {
		const ctx = createMockContext({}, brandsResponse);
		const results = await fipeBrands(ctx, 0);
		for (const r of results) {
			expect(r.json).toHaveProperty('_meta');
			expect(r.json._meta).toHaveProperty('provider', 'parallelum');
			expect(r.pairedItem).toEqual({ item: 0 });
		}
	});

	it('should include _raw per item when includeRaw is true', async () => {
		const ctx = createMockContext({ includeRaw: true }, brandsResponse);
		const results = await fipeBrands(ctx, 0);
		expect(results[0].json).toHaveProperty('_raw');
	});

	it('should append referenceTable when > 0', async () => {
		const ctx = createMockContext({ referenceTable: 301 }, brandsResponse);
		await fipeBrands(ctx, 0);
		const callUrl = (ctx.helpers.httpRequest as jest.Mock).mock.calls[0][0].url;
		expect(callUrl).toContain('tabela_referencia=301');
	});

	it('should NOT append referenceTable when 0', async () => {
		const ctx = createMockContext({ referenceTable: 0 }, brandsResponse);
		await fipeBrands(ctx, 0);
		const callUrl = (ctx.helpers.httpRequest as jest.Mock).mock.calls[0][0].url;
		expect(callUrl).not.toContain('tabela_referencia');
	});

	it('should handle non-array response gracefully', async () => {
		const ctx = createMockContext({ includeRaw: true }, { unexpected: true });
		const results = await fipeBrands(ctx, 0);
		expect(results).toEqual([]);
	});
});

describe('fipeModels', () => {
	it('should return normalized models (excluding anos)', async () => {
		const ctx = createMockContext({}, modelsResponse);
		const results = await fipeModels(ctx, 0);
		expect(results).toHaveLength(2);
		expect(results[0].json).toHaveProperty('code', 1);
		expect(results[0].json).toHaveProperty('name', 'Integra GS 1.8');
	});

	it('should throw when brandCode is empty', async () => {
		const ctx = createMockContext({ brandCode: '' }, modelsResponse);
		await expect(fipeModels(ctx, 0)).rejects.toThrow('Brand code is required');
	});

	it('should include _meta with query showing brand code', async () => {
		const ctx = createMockContext({}, modelsResponse);
		const results = await fipeModels(ctx, 0);
		expect(results[0].json._meta).toHaveProperty('query', 'carros/59');
	});

	it('should include _raw per model when includeRaw is true', async () => {
		const ctx = createMockContext({ includeRaw: true }, modelsResponse);
		const results = await fipeModels(ctx, 0);
		expect(results[0].json).toHaveProperty('_raw');
	});

	it('should handle response with missing modelos key', async () => {
		const ctx = createMockContext({ includeRaw: true }, { anos: [] });
		const results = await fipeModels(ctx, 0);
		expect(results).toEqual([]);
	});

	it('should append referenceTable when > 0', async () => {
		const ctx = createMockContext({ referenceTable: 301 }, modelsResponse);
		await fipeModels(ctx, 0);
		const callUrl = (ctx.helpers.httpRequest as jest.Mock).mock.calls[0][0].url;
		expect(callUrl).toContain('tabela_referencia=301');
	});
});

describe('fipeYears', () => {
	it('should return normalized years', async () => {
		const ctx = createMockContext({}, yearsResponse);
		const results = await fipeYears(ctx, 0);
		expect(results).toHaveLength(2);
		expect(results[0].json).toHaveProperty('code', '2024-1');
		expect(results[0].json).toHaveProperty('name', '2024 Gasolina');
	});

	it('should throw when brandCode is empty', async () => {
		const ctx = createMockContext({ brandCode: '' }, yearsResponse);
		await expect(fipeYears(ctx, 0)).rejects.toThrow('Brand code is required');
	});

	it('should throw when modelCode is empty', async () => {
		const ctx = createMockContext({ modelCode: '' }, yearsResponse);
		await expect(fipeYears(ctx, 0)).rejects.toThrow('Model code is required');
	});

	it('should include _meta with query showing hierarchy', async () => {
		const ctx = createMockContext({}, yearsResponse);
		const results = await fipeYears(ctx, 0);
		expect(results[0].json._meta).toHaveProperty('query', 'carros/59/4828');
	});

	it('should include _raw per year when includeRaw is true', async () => {
		const ctx = createMockContext({ includeRaw: true }, yearsResponse);
		const results = await fipeYears(ctx, 0);
		expect(results[0].json).toHaveProperty('_raw');
	});

	it('should handle non-array response gracefully', async () => {
		const ctx = createMockContext({ includeRaw: true }, { unexpected: true });
		const results = await fipeYears(ctx, 0);
		expect(results).toEqual([]);
	});

	it('should append referenceTable when > 0', async () => {
		const ctx = createMockContext({ referenceTable: 301 }, yearsResponse);
		await fipeYears(ctx, 0);
		const callUrl = (ctx.helpers.httpRequest as jest.Mock).mock.calls[0][0].url;
		expect(callUrl).toContain('tabela_referencia=301');
	});
});

describe('fipePrice', () => {
	it('should return single item with normalized price', async () => {
		const ctx = createMockContext({}, priceResponse);
		const results = await fipePrice(ctx, 0);
		expect(results).toHaveLength(1);
		expect(results[0].json).toHaveProperty('price', 'R$ 148.363,00');
		expect(results[0].json).toHaveProperty('brand', 'Honda');
		expect(results[0].json).toHaveProperty('fipeCode', '014275-3');
	});

	it('should throw when brandCode is empty', async () => {
		const ctx = createMockContext({ brandCode: '' }, priceResponse);
		await expect(fipePrice(ctx, 0)).rejects.toThrow('Brand code is required');
	});

	it('should throw when modelCode is empty', async () => {
		const ctx = createMockContext({ modelCode: '' }, priceResponse);
		await expect(fipePrice(ctx, 0)).rejects.toThrow('Model code is required');
	});

	it('should throw when yearCode is empty', async () => {
		const ctx = createMockContext({ yearCode: '' }, priceResponse);
		await expect(fipePrice(ctx, 0)).rejects.toThrow('Year code is required');
	});

	it('should include _meta with full hierarchy query', async () => {
		const ctx = createMockContext({}, priceResponse);
		const results = await fipePrice(ctx, 0);
		expect(results[0].json._meta).toHaveProperty('query', 'carros/59/4828/2024-1');
	});

	it('should include _raw when includeRaw is true', async () => {
		const ctx = createMockContext({ includeRaw: true }, priceResponse);
		const results = await fipePrice(ctx, 0);
		expect(results[0].json).toHaveProperty('_raw');
	});

	it('should use correct URL with all hierarchy params', async () => {
		const ctx = createMockContext({}, priceResponse);
		await fipePrice(ctx, 0);
		const callUrl = (ctx.helpers.httpRequest as jest.Mock).mock.calls[0][0].url;
		expect(callUrl).toContain('/carros/marcas/59/modelos/4828/anos/2024-1');
	});

	it('should append referenceTable when > 0', async () => {
		const ctx = createMockContext({ referenceTable: 301 }, priceResponse);
		await fipePrice(ctx, 0);
		const callUrl = (ctx.helpers.httpRequest as jest.Mock).mock.calls[0][0].url;
		expect(callUrl).toContain('tabela_referencia=301');
	});
});

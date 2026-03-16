import {
	normalizeBrands,
	normalizeModels,
	normalizeYears,
	normalizePrice,
} from '../nodes/BrasilHub/resources/fipe/fipe.normalize';

// Real fixture from parallelum /fipe/api/v1/carros/marcas
const brandsFixture = [
	{ codigo: '1', nome: 'Acura' },
	{ codigo: '2', nome: 'Agrale' },
	{ codigo: '59', nome: 'Honda' },
];

// Real fixture from parallelum /fipe/api/v1/carros/marcas/59/modelos
const modelsResponseFixture = {
	modelos: [
		{ codigo: 1, nome: 'Integra GS 1.8' },
		{ codigo: 4828, nome: 'Civic Sedan EXL 2.0 Flex 16V Aut.4p' },
	],
	anos: [
		{ codigo: '2024-1', nome: '2024 Gasolina' },
	],
};

// Real fixture from parallelum /fipe/api/v1/carros/marcas/59/modelos/4828/anos
const yearsFixture = [
	{ codigo: '2024-1', nome: '2024 Gasolina' },
	{ codigo: '2023-1', nome: '2023 Gasolina' },
	{ codigo: '32000-1', nome: 'Zero KM Gasolina' },
];

// Real fixture from parallelum /fipe/api/v1/carros/marcas/59/modelos/4828/anos/2024-1
const priceFixture = {
	TipoVeiculo: 1,
	Valor: 'R$ 148.363,00',
	Marca: 'Honda',
	Modelo: 'Civic Sedan EXL 2.0 Flex 16V Aut.4p',
	AnoModelo: 2024,
	Combustivel: 'Gasolina',
	CodigoFipe: '014275-3',
	MesReferencia: 'março de 2026',
	SiglaCombustivel: 'G',
};

describe('normalizeBrands', () => {
	it('should normalize parallelum brands array', () => {
		const result = normalizeBrands(brandsFixture);
		expect(result).toHaveLength(3);
		expect(result[0]).toEqual({ code: '1', name: 'Acura' });
		expect(result[2]).toEqual({ code: '59', name: 'Honda' });
	});

	it('should handle empty array', () => {
		expect(normalizeBrands([])).toEqual([]);
	});

	it('should handle non-array input', () => {
		expect(normalizeBrands(null)).toEqual([]);
		expect(normalizeBrands(undefined)).toEqual([]);
		expect(normalizeBrands('string')).toEqual([]);
	});

	it('should handle entries with missing fields', () => {
		const result = normalizeBrands([{ codigo: '1' }, { nome: 'Test' }]);
		expect(result[0]).toEqual({ code: '1', name: '' });
		expect(result[1]).toEqual({ code: '', name: 'Test' });
	});
});

describe('normalizeModels', () => {
	it('should extract modelos from parallelum response and ignore anos', () => {
		const result = normalizeModels(modelsResponseFixture);
		expect(result).toHaveLength(2);
		expect(result[0]).toEqual({ code: 1, name: 'Integra GS 1.8' });
		expect(result[1]).toEqual({ code: 4828, name: 'Civic Sedan EXL 2.0 Flex 16V Aut.4p' });
	});

	it('should handle response without modelos key', () => {
		expect(normalizeModels({})).toEqual([]);
		expect(normalizeModels({ anos: [] })).toEqual([]);
	});

	it('should handle null/undefined input', () => {
		expect(normalizeModels(null)).toEqual([]);
		expect(normalizeModels(undefined)).toEqual([]);
	});

	it('should handle entries with missing fields', () => {
		const result = normalizeModels({ modelos: [{ codigo: 5 }] });
		expect(result[0]).toEqual({ code: 5, name: '' });
	});

	it('should coerce non-numeric codigo to 0', () => {
		const result = normalizeModels({ modelos: [{ codigo: null, nome: 'Test' }] });
		expect(result[0].code).toBe(0);
	});
});

describe('normalizeYears', () => {
	it('should normalize parallelum years array', () => {
		const result = normalizeYears(yearsFixture);
		expect(result).toHaveLength(3);
		expect(result[0]).toEqual({ code: '2024-1', name: '2024 Gasolina' });
		expect(result[2]).toEqual({ code: '32000-1', name: 'Zero KM Gasolina' });
	});

	it('should handle empty/null/undefined input', () => {
		expect(normalizeYears([])).toEqual([]);
		expect(normalizeYears(null)).toEqual([]);
		expect(normalizeYears(undefined)).toEqual([]);
	});
});

describe('normalizePrice', () => {
	it('should normalize parallelum price response', () => {
		const result = normalizePrice(priceFixture);
		expect(result).toEqual({
			vehicleType: 1,
			brand: 'Honda',
			model: 'Civic Sedan EXL 2.0 Flex 16V Aut.4p',
			modelYear: 2024,
			fuel: 'Gasolina',
			fipeCode: '014275-3',
			referenceMonth: 'março de 2026',
			price: 'R$ 148.363,00',
			fuelAbbreviation: 'G',
		});
	});

	it('should handle null/undefined input with safe defaults', () => {
		const result = normalizePrice(null);
		expect(result.vehicleType).toBe(0);
		expect(result.brand).toBe('');
		expect(result.price).toBe('');
		expect(result.modelYear).toBe(0);
	});

	it('should handle missing fields', () => {
		const result = normalizePrice({ TipoVeiculo: 2, Marca: 'Yamaha' });
		expect(result.vehicleType).toBe(2);
		expect(result.brand).toBe('Yamaha');
		expect(result.model).toBe('');
		expect(result.fipeCode).toBe('');
	});
});

import { normalizeDdd } from '../nodes/BrasilHub/resources/ddd/ddd.normalize';

const brasilApiFixture = {
	state: 'SP',
	cities: ['SÃO PAULO', 'GUARULHOS', 'OSASCO'],
};

describe('normalizeDdd', () => {
	it('should normalize BrasilAPI response', () => {
		const result = normalizeDdd(brasilApiFixture, 'brasilapi');
		expect(result).toEqual({
			state: 'SP',
			cities: ['SÃO PAULO', 'GUARULHOS', 'OSASCO'],
		});
	});

	it('should handle empty cities array', () => {
		const result = normalizeDdd({ state: 'AC', cities: [] }, 'brasilapi');
		expect(result.state).toBe('AC');
		expect(result.cities).toEqual([]);
	});

	it('should handle missing cities field (not an array)', () => {
		const result = normalizeDdd({ state: 'AC' }, 'brasilapi');
		expect(result.cities).toEqual([]);
	});

	it('should throw for unknown provider', () => {
		expect(() => normalizeDdd({}, 'unknown')).toThrow('Unknown DDD provider: unknown');
	});
});

// Fixture from kelvins/municipios-brasileiros — entries with ddd=11
const municipiosFixture = [
	{ codigo_ibge: 3550308, nome: 'São Paulo', codigo_uf: 35, ddd: 11 },
	{ codigo_ibge: 3518800, nome: 'Guarulhos', codigo_uf: 35, ddd: 11 },
	{ codigo_ibge: 3534401, nome: 'Osasco', codigo_uf: 35, ddd: 11 },
	{ codigo_ibge: 9999999, nome: 'Outro Municipio', codigo_uf: 35, ddd: 21 }, // different DDD
];

describe('normalizeDdd (municipios fallback)', () => {
	it('should filter by DDD and return state + cities', () => {
		const result = normalizeDdd(municipiosFixture, 'municipios', 11);
		expect(result.state).toBe('SP');
		expect(result.cities).toEqual(['São Paulo', 'Guarulhos', 'Osasco']);
	});

	it('should pick the most frequent state when DDD spans multiple UFs', () => {
		const multiState = [
			{ codigo_ibge: 1, nome: 'City A', codigo_uf: 53, ddd: 61 }, // DF
			{ codigo_ibge: 2, nome: 'City B', codigo_uf: 52, ddd: 61 }, // GO
			{ codigo_ibge: 3, nome: 'City C', codigo_uf: 52, ddd: 61 }, // GO
		];
		const result = normalizeDdd(multiState, 'municipios', 61);
		expect(result.state).toBe('GO'); // most frequent
		expect(result.cities).toHaveLength(3);
	});

	it('should throw when DDD not found in municipios data', () => {
		expect(() => normalizeDdd(municipiosFixture, 'municipios', 99))
			.toThrow('DDD 99 not found');
	});
});

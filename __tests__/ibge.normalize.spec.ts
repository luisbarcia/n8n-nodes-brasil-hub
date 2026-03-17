import { normalizeStates, normalizeCities } from '../nodes/BrasilHub/resources/ibge/ibge.normalize';

const brasilApiStatesFixture = [
	{ id: 11, sigla: 'RO', nome: 'Rondônia', regiao: { id: 1, sigla: 'N', nome: 'Norte' } },
	{ id: 35, sigla: 'SP', nome: 'São Paulo', regiao: { id: 3, sigla: 'SE', nome: 'Sudeste' } },
];

const ibgeStatesFixture = [
	{ id: 11, sigla: 'RO', nome: 'Rondônia', regiao: { id: 1, sigla: 'N', nome: 'Norte' } },
	{ id: 35, sigla: 'SP', nome: 'São Paulo', regiao: { id: 3, sigla: 'SE', nome: 'Sudeste' } },
];

const brasilApiCitiesFixture = [
	{ nome: 'ADAMANTINA', codigo_ibge: '3500105' },
	{ nome: 'ADOLFO', codigo_ibge: '3500204' },
];

const ibgeCitiesFixture = [
	{ id: 3500105, nome: 'Adamantina', microrregiao: { id: 35035, nome: 'Adamantina' } },
	{ id: 3500204, nome: 'Adolfo', microrregiao: { id: 35004, nome: 'São José do Rio Preto' } },
];

describe('normalizeStates', () => {
	it('should normalize BrasilAPI states', () => {
		const result = normalizeStates(brasilApiStatesFixture, 'brasilapi');
		expect(result).toHaveLength(2);
		expect(result[0]).toEqual({ code: 11, abbreviation: 'RO', name: 'Rondônia', region: 'Norte' });
		expect(result[1]).toEqual({ code: 35, abbreviation: 'SP', name: 'São Paulo', region: 'Sudeste' });
	});

	it('should normalize IBGE API states (same format as BrasilAPI)', () => {
		const result = normalizeStates(ibgeStatesFixture, 'ibge');
		expect(result).toHaveLength(2);
		expect(result[0]).toEqual({ code: 11, abbreviation: 'RO', name: 'Rondônia', region: 'Norte' });
	});

	it('should handle null/undefined input', () => {
		expect(normalizeStates(null, 'brasilapi')).toEqual([]);
		expect(normalizeStates(undefined, 'ibge')).toEqual([]);
	});

	it('should handle non-array input', () => {
		expect(normalizeStates({}, 'brasilapi')).toEqual([]);
	});

	it('should filter null/undefined items', () => {
		const result = normalizeStates([null, brasilApiStatesFixture[0], undefined], 'brasilapi');
		expect(result).toHaveLength(1);
	});

	it('should handle missing regiao', () => {
		const result = normalizeStates([{ id: 11, sigla: 'RO', nome: 'Rondônia' }], 'brasilapi');
		expect(result[0].region).toBe('');
	});

	it('should throw for unknown provider', () => {
		expect(() => normalizeStates([], 'unknown')).toThrow('Unknown IBGE states provider');
	});
});

describe('normalizeCities', () => {
	it('should normalize BrasilAPI cities', () => {
		const result = normalizeCities(brasilApiCitiesFixture, 'brasilapi');
		expect(result).toHaveLength(2);
		expect(result[0]).toEqual({ code: 3500105, name: 'ADAMANTINA' });
		expect(result[1]).toEqual({ code: 3500204, name: 'ADOLFO' });
	});

	it('should normalize IBGE API cities', () => {
		const result = normalizeCities(ibgeCitiesFixture, 'ibge');
		expect(result).toHaveLength(2);
		expect(result[0]).toEqual({ code: 3500105, name: 'Adamantina' });
	});

	it('should handle null/undefined input', () => {
		expect(normalizeCities(null, 'brasilapi')).toEqual([]);
		expect(normalizeCities(undefined, 'ibge')).toEqual([]);
	});

	it('should filter null/undefined items', () => {
		const result = normalizeCities([null, brasilApiCitiesFixture[0]], 'brasilapi');
		expect(result).toHaveLength(1);
	});

	it('should handle BrasilAPI city with non-numeric codigo_ibge', () => {
		const result = normalizeCities([{ nome: 'Test', codigo_ibge: 'abc' }], 'brasilapi');
		expect(result[0].code).toBe(0);
	});

	it('should throw for unknown provider', () => {
		expect(() => normalizeCities([], 'unknown')).toThrow('Unknown IBGE cities provider');
	});
});

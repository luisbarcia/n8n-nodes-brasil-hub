import { normalizeTaxa, normalizeTaxas } from '../nodes/BrasilHub/resources/taxas/taxas.normalize';

const taxaFixture = {
	nome: 'Selic',
	valor: 14.75,
};

const taxasFixture = [
	{ nome: 'Selic', valor: 14.75 },
	{ nome: 'CDI', valor: 14.65 },
	{ nome: 'IPCA', valor: 4.23 },
];

describe('normalizeTaxa', () => {
	it('should normalize a single BrasilAPI taxa object', () => {
		const result = normalizeTaxa(taxaFixture);
		expect(result).toEqual({
			name: 'Selic',
			value: 14.75,
		});
	});

	it('should handle null input', () => {
		const result = normalizeTaxa(null);
		expect(result).toEqual({ name: '', value: 0 });
	});

	it('should handle undefined input', () => {
		const result = normalizeTaxa(undefined);
		expect(result).toEqual({ name: '', value: 0 });
	});

	it('should handle empty object', () => {
		const result = normalizeTaxa({});
		expect(result).toEqual({ name: '', value: 0 });
	});

	it('should handle non-object input (string)', () => {
		const result = normalizeTaxa('string');
		expect(result).toEqual({ name: '', value: 0 });
	});

	it('should handle non-object input (number)', () => {
		const result = normalizeTaxa(42);
		expect(result).toEqual({ name: '', value: 0 });
	});

	it('should handle non-object input (boolean)', () => {
		const result = normalizeTaxa(true);
		expect(result).toEqual({ name: '', value: 0 });
	});

	it('should handle missing nome field', () => {
		const result = normalizeTaxa({ valor: 10.5 });
		expect(result).toEqual({ name: '', value: 10.5 });
	});

	it('should handle missing valor field', () => {
		const result = normalizeTaxa({ nome: 'CDI' });
		expect(result).toEqual({ name: 'CDI', value: 0 });
	});

	it('should use 0 for non-number valor', () => {
		const result = normalizeTaxa({ nome: 'Selic', valor: 'not_a_number' });
		expect(result).toEqual({ name: 'Selic', value: 0 });
	});

	it('should coerce NaN valor to 0 (Number.isFinite rejects NaN)', () => {
		const result = normalizeTaxa({ nome: 'Selic', valor: NaN });
		expect(result.name).toBe('Selic');
		expect(result.value).toBe(0);
	});

	it('should coerce Infinity valor to 0', () => {
		const result = normalizeTaxa({ nome: 'Selic', valor: Infinity });
		expect(result).toEqual({ name: 'Selic', value: 0 });
	});

	it('should accept zero as valid valor', () => {
		const result = normalizeTaxa({ nome: 'TR', valor: 0 });
		expect(result).toEqual({ name: 'TR', value: 0 });
	});

	it('should accept negative valor', () => {
		const result = normalizeTaxa({ nome: 'IPCA', valor: -0.5 });
		expect(result).toEqual({ name: 'IPCA', value: -0.5 });
	});

	it('should coerce non-string nome via safeStr', () => {
		const result = normalizeTaxa({ nome: 123, valor: 1 });
		expect(result.name).toBe('123');
	});

	it('should handle object with extra fields (ignores them)', () => {
		const result = normalizeTaxa({ nome: 'Selic', valor: 14.75, extra: 'field', count: 42 });
		expect(result).toEqual({ name: 'Selic', value: 14.75 });
	});
});

describe('normalizeTaxas', () => {
	it('should normalize BrasilAPI taxas array', () => {
		const result = normalizeTaxas(taxasFixture);
		expect(result).toHaveLength(3);
		expect(result[0]).toEqual({ name: 'Selic', value: 14.75 });
		expect(result[1]).toEqual({ name: 'CDI', value: 14.65 });
		expect(result[2]).toEqual({ name: 'IPCA', value: 4.23 });
	});

	it('should handle empty array', () => {
		expect(normalizeTaxas([])).toEqual([]);
	});

	it('should handle null input', () => {
		expect(normalizeTaxas(null)).toEqual([]);
	});

	it('should handle undefined input', () => {
		expect(normalizeTaxas(undefined)).toEqual([]);
	});

	it('should handle non-array input (string)', () => {
		expect(normalizeTaxas('string')).toEqual([]);
	});

	it('should handle non-array input (object)', () => {
		expect(normalizeTaxas({})).toEqual([]);
	});

	it('should handle non-array input (number)', () => {
		expect(normalizeTaxas(42)).toEqual([]);
	});

	it('should filter out null items in array', () => {
		const result = normalizeTaxas([null, taxasFixture[0], undefined]);
		expect(result).toHaveLength(1);
		expect(result[0].name).toBe('Selic');
	});

	it('should filter out non-object items in array', () => {
		const result = normalizeTaxas([42, 'string', true, taxasFixture[0]]);
		expect(result).toHaveLength(1);
		expect(result[0].name).toBe('Selic');
	});

	it('should handle single-element array', () => {
		const result = normalizeTaxas([taxasFixture[0]]);
		expect(result).toHaveLength(1);
		expect(result[0]).toEqual({ name: 'Selic', value: 14.75 });
	});

	it('should handle entries with missing fields', () => {
		const result = normalizeTaxas([{}]);
		expect(result[0]).toEqual({ name: '', value: 0 });
	});
});

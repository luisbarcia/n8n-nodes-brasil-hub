import { normalizeNcm, normalizeNcmList } from '../nodes/BrasilHub/resources/ncm/ncm.normalize';

const ncmFixture = {
	codigo: '8504.40.10',
	descricao: 'Carregadores de acumuladores',
	data_inicio: '2022-04-01',
	data_fim: '9999-12-31',
	tipo_ato: 'Res Camex',
	numero_ato: '272',
	ano_ato: '2021',
};

const searchFixture = [
	{ codigo: '8537.10.1', descricao: 'Comando numérico computadorizado', data_inicio: '2022-04-01', data_fim: '9999-12-31', tipo_ato: 'Res Camex', numero_ato: '272', ano_ato: '2021' },
	{ codigo: '9018.49.91', descricao: 'Para peças cerâmicas computadorizados', data_inicio: '2022-04-01', data_fim: '9999-12-31', tipo_ato: 'Res Camex', numero_ato: '272', ano_ato: '2021' },
];

describe('normalizeNcm', () => {
	it('should normalize BrasilAPI NCM response', () => {
		const result = normalizeNcm(ncmFixture);
		expect(result).toEqual({
			code: '8504.40.10',
			description: 'Carregadores de acumuladores',
			startDate: '2022-04-01',
			endDate: '9999-12-31',
			actType: 'Res Camex',
			actNumber: '272',
			actYear: '2021',
		});
	});

	it('should handle null/undefined input', () => {
		const result = normalizeNcm(null);
		expect(result.code).toBe('');
		expect(result.description).toBe('');
	});

	it('should handle empty object', () => {
		const result = normalizeNcm({});
		expect(result.code).toBe('');
		expect(result.actYear).toBe('');
	});
});

describe('normalizeNcmList', () => {
	it('should normalize search results array', () => {
		const result = normalizeNcmList(searchFixture);
		expect(result).toHaveLength(2);
		expect(result[0].code).toBe('8537.10.1');
		expect(result[1].code).toBe('9018.49.91');
	});

	it('should handle null/undefined input', () => {
		expect(normalizeNcmList(null)).toEqual([]);
		expect(normalizeNcmList(undefined)).toEqual([]);
	});

	it('should handle non-array input', () => {
		expect(normalizeNcmList({})).toEqual([]);
	});

	it('should filter null items', () => {
		const result = normalizeNcmList([null, ncmFixture, undefined]);
		expect(result).toHaveLength(1);
		expect(result[0].code).toBe('8504.40.10');
	});

	it('should handle empty array', () => {
		expect(normalizeNcmList([])).toEqual([]);
	});
});

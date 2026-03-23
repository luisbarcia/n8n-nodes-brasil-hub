import { normalizeCurrencies, normalizeCotacoes } from '../nodes/BrasilHub/resources/cambio/cambio.normalize';

const currenciesFixture = [
	{
		simbolo: 'USD',
		nome: 'Dolar dos Estados Unidos',
		tipo_moeda: 'A',
	},
	{
		simbolo: 'EUR',
		nome: 'Euro',
		tipo_moeda: 'B',
	},
];

const cotacoesFixture = {
	moeda: 'USD',
	data: '2024-01-15',
	cotacoes: [
		{
			cotacao_compra: 4.8765,
			cotacao_venda: 4.8775,
			paridade_compra: 1,
			paridade_venda: 1,
			data_hora_cotacao: '2024-01-15 10:00:00.000',
			tipo_boletim: 'ABERTURA',
		},
		{
			cotacao_compra: 4.89,
			cotacao_venda: 4.891,
			paridade_compra: 1,
			paridade_venda: 1,
			data_hora_cotacao: '2024-01-15 13:00:00.000',
			tipo_boletim: 'INTERMEDIARIO',
		},
	],
};

describe('normalizeCurrencies', () => {
	it('should normalize BrasilAPI currencies array', () => {
		const result = normalizeCurrencies(currenciesFixture);
		expect(result).toHaveLength(2);
		expect(result[0]).toEqual({
			symbol: 'USD',
			name: 'Dolar dos Estados Unidos',
			currencyType: 'A',
		});
		expect(result[1]).toEqual({
			symbol: 'EUR',
			name: 'Euro',
			currencyType: 'B',
		});
	});

	it('should handle empty array', () => {
		expect(normalizeCurrencies([])).toEqual([]);
	});

	it('should handle null/undefined input', () => {
		expect(normalizeCurrencies(null)).toEqual([]);
		expect(normalizeCurrencies(undefined)).toEqual([]);
	});

	it('should handle non-array input', () => {
		expect(normalizeCurrencies('string')).toEqual([]);
		expect(normalizeCurrencies({})).toEqual([]);
		expect(normalizeCurrencies(42)).toEqual([]);
	});

	it('should handle entries with missing fields', () => {
		const result = normalizeCurrencies([{ simbolo: 'BTC' }]);
		expect(result[0]).toEqual({
			symbol: 'BTC',
			name: '',
			currencyType: '',
		});
	});

	it('should handle entries with all fields missing', () => {
		const result = normalizeCurrencies([{}]);
		expect(result[0]).toEqual({
			symbol: '',
			name: '',
			currencyType: '',
		});
	});

	it('should filter out null/undefined items in array', () => {
		const result = normalizeCurrencies([null, currenciesFixture[0], undefined]);
		expect(result).toHaveLength(1);
		expect(result[0].symbol).toBe('USD');
	});

	it('should filter out non-object items in array', () => {
		const result = normalizeCurrencies([42, 'string', true, currenciesFixture[0]]);
		expect(result).toHaveLength(1);
		expect(result[0].symbol).toBe('USD');
	});

	it('should coerce non-string fields via safeStr', () => {
		const result = normalizeCurrencies([{ simbolo: 123, nome: true, tipo_moeda: null }]);
		expect(result[0]).toEqual({
			symbol: '123',
			name: 'true',
			currencyType: '',
		});
	});
});

describe('normalizeCotacoes', () => {
	it('should normalize BrasilAPI cotacoes response', () => {
		const result = normalizeCotacoes(cotacoesFixture);
		expect(result).toHaveLength(2);
		expect(result[0]).toEqual({
			currency: 'USD',
			date: '2024-01-15',
			buyRate: 4.8765,
			sellRate: 4.8775,
			buyParity: 1,
			sellParity: 1,
			quotedAt: '2024-01-15 10:00:00.000',
			bulletinType: 'ABERTURA',
		});
		expect(result[1]).toEqual({
			currency: 'USD',
			date: '2024-01-15',
			buyRate: 4.89,
			sellRate: 4.891,
			buyParity: 1,
			sellParity: 1,
			quotedAt: '2024-01-15 13:00:00.000',
			bulletinType: 'INTERMEDIARIO',
		});
	});

	it('should handle null/undefined input', () => {
		expect(normalizeCotacoes(null)).toEqual([]);
		expect(normalizeCotacoes(undefined)).toEqual([]);
	});

	it('should handle empty object', () => {
		expect(normalizeCotacoes({})).toEqual([]);
	});

	it('should handle object with empty cotacoes array', () => {
		expect(normalizeCotacoes({ moeda: 'USD', data: '2024-01-15', cotacoes: [] })).toEqual([]);
	});

	it('should handle object without cotacoes property', () => {
		expect(normalizeCotacoes({ moeda: 'USD', data: '2024-01-15' })).toEqual([]);
	});

	it('should handle non-array cotacoes property', () => {
		expect(normalizeCotacoes({ moeda: 'USD', data: '2024-01-15', cotacoes: 'invalid' })).toEqual([]);
	});

	it('should filter out null/undefined entries in cotacoes array', () => {
		const data = {
			moeda: 'EUR',
			data: '2024-02-01',
			cotacoes: [null, cotacoesFixture.cotacoes[0], undefined],
		};
		const result = normalizeCotacoes(data);
		expect(result).toHaveLength(1);
		expect(result[0].currency).toBe('EUR');
	});

	it('should use 0 for non-finite numeric fields', () => {
		const data = {
			moeda: 'USD',
			data: '2024-01-15',
			cotacoes: [
				{
					cotacao_compra: 'not_a_number',
					cotacao_venda: NaN,
					paridade_compra: Infinity,
					paridade_venda: undefined,
					data_hora_cotacao: '2024-01-15 10:00:00.000',
					tipo_boletim: 'ABERTURA',
				},
			],
		};
		const result = normalizeCotacoes(data);
		expect(result[0].buyRate).toBe(0);
		expect(result[0].sellRate).toBe(0);
		expect(result[0].buyParity).toBe(0);
		expect(result[0].sellParity).toBe(0);
	});

	it('should handle missing moeda and data fields', () => {
		const data = {
			cotacoes: [
				{
					cotacao_compra: 5.0,
					cotacao_venda: 5.01,
					paridade_compra: 1,
					paridade_venda: 1,
					data_hora_cotacao: '2024-01-15 10:00:00.000',
					tipo_boletim: 'FECHAMENTO PTAX',
				},
			],
		};
		const result = normalizeCotacoes(data);
		expect(result[0].currency).toBe('');
		expect(result[0].date).toBe('');
		expect(result[0].buyRate).toBe(5.0);
		expect(result[0].bulletinType).toBe('FECHAMENTO PTAX');
	});

	it('should handle cotacao entries with missing string fields', () => {
		const data = {
			moeda: 'JPY',
			data: '2024-03-01',
			cotacoes: [
				{
					cotacao_compra: 0.032,
					cotacao_venda: 0.033,
					paridade_compra: 150,
					paridade_venda: 151,
				},
			],
		};
		const result = normalizeCotacoes(data);
		expect(result[0].quotedAt).toBe('');
		expect(result[0].bulletinType).toBe('');
		expect(result[0].buyRate).toBe(0.032);
	});

	it('should handle negative numeric values as valid', () => {
		const data = {
			moeda: 'USD',
			data: '2024-01-15',
			cotacoes: [
				{
					cotacao_compra: -1.5,
					cotacao_venda: -0.5,
					paridade_compra: -1,
					paridade_venda: -2,
					data_hora_cotacao: 'test',
					tipo_boletim: 'test',
				},
			],
		};
		const result = normalizeCotacoes(data);
		expect(result[0].buyRate).toBe(-1.5);
		expect(result[0].sellRate).toBe(-0.5);
	});

	it('should handle single cotacao entry', () => {
		const data = {
			moeda: 'GBP',
			data: '2024-06-10',
			cotacoes: [cotacoesFixture.cotacoes[0]],
		};
		const result = normalizeCotacoes(data);
		expect(result).toHaveLength(1);
		expect(result[0].currency).toBe('GBP');
		expect(result[0].date).toBe('2024-06-10');
	});
});

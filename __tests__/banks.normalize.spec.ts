import { normalizeBank, normalizeBanks } from '../nodes/BrasilHub/resources/banks/banks.normalize';

// Real fixture from BrasilAPI /api/banks/v1/1
const brasilApiFixture = {
	ispb: '00000000',
	name: 'BCO DO BRASIL S.A.',
	code: 1,
	fullName: 'Banco do Brasil S.A.',
};

// Real fixture from BrasilAPI /api/banks/v1 (array) — first 3
const brasilApiListFixture = [
	{ ispb: '00000000', name: 'BCO DO BRASIL S.A.', code: 1, fullName: 'Banco do Brasil S.A.' },
	{ ispb: '00000208', name: 'BRB - BCO DE BRASILIA S.A.', code: 70, fullName: 'BRB - BANCO DE BRASILIA S.A.' },
	{ ispb: '00038121', name: 'Selic', code: null, fullName: 'Banco Central do Brasil - Selic' },
];

// Real fixture from BancosBrasileiros bancos.json — first 2
const bancosBrasileirosFixture = [
	{
		COMPE: '001',
		ISPB: '00000000',
		Document: '00.000.000/0001-91',
		LongName: 'Banco do Brasil S.A.',
		ShortName: 'BCO DO BRASIL S.A.',
		Network: 'RSFN',
		Type: 'Banco Múltiplo',
		PixType: 'DRCT',
		Charge: true,
		CreditDocument: true,
		Url: 'https://www.bb.com.br',
	},
	{
		COMPE: '003',
		ISPB: '04902979',
		Document: '04.902.979/0001-44',
		LongName: 'Banco da Amazônia S.A.',
		ShortName: 'BCO DA AMAZONIA S.A.',
		Network: 'RSFN',
		Type: 'Banco Comercial',
	},
];

describe('normalizeBank (single query)', () => {
	it('should normalize BrasilAPI response', () => {
		const result = normalizeBank(brasilApiFixture, 'brasilapi');
		expect(result).toEqual({
			code: 1,
			name: 'BCO DO BRASIL S.A.',
			fullName: 'Banco do Brasil S.A.',
			ispb: '00000000',
		});
	});

	it('should normalize BancosBrasileiros response filtering by code', () => {
		const result = normalizeBank(bancosBrasileirosFixture, 'bancosbrasileiros', 1);
		expect(result).toEqual({
			code: 1,
			name: 'BCO DO BRASIL S.A.',
			fullName: 'Banco do Brasil S.A.',
			ispb: '00000000',
		});
	});

	it('should handle BrasilAPI bank with null code', () => {
		const nullCodeBank = { ispb: '00038121', name: 'Selic', code: null, fullName: 'Banco Central do Brasil - Selic' };
		const result = normalizeBank(nullCodeBank, 'brasilapi');
		expect(result.code).toBe(0);
		expect(result.name).toBe('Selic');
	});

	it('should throw for BancosBrasileiros when bank code not found', () => {
		expect(() => normalizeBank(bancosBrasileirosFixture, 'bancosbrasileiros', 9999))
			.toThrow('Bank code 9999 not found');
	});

	it('should throw for unknown provider', () => {
		expect(() => normalizeBank({}, 'unknown')).toThrow('Unknown bank provider: unknown');
	});
});

describe('normalizeBanks (list)', () => {
	it('should normalize BrasilAPI list', () => {
		const result = normalizeBanks(brasilApiListFixture, 'brasilapi');
		expect(result).toHaveLength(3);
		expect(result[0]).toEqual({
			code: 1,
			name: 'BCO DO BRASIL S.A.',
			fullName: 'Banco do Brasil S.A.',
			ispb: '00000000',
		});
		expect(result[2].code).toBe(0); // null code → 0
	});

	it('should normalize BancosBrasileiros list', () => {
		const result = normalizeBanks(bancosBrasileirosFixture, 'bancosbrasileiros');
		expect(result).toHaveLength(2);
		expect(result[0].code).toBe(1);
		expect(result[0].ispb).toBe('00000000');
		expect(result[1].code).toBe(3);
		expect(result[1].fullName).toBe('Banco da Amazônia S.A.');
	});

	it('should throw for unknown provider', () => {
		expect(() => normalizeBanks([], 'unknown')).toThrow('Unknown bank provider: unknown');
	});
});

import { normalizeCep } from '../nodes/BrasilHub/resources/cep/cep.normalize';

const brasilApiResponse = {
	cep: '01001000',
	state: 'SP',
	city: 'São Paulo',
	neighborhood: 'Sé',
	street: 'Praça da Sé',
	service: 'open-cep',
	location: {
		type: 'Point',
		coordinates: { longitude: '-46.6339', latitude: '-23.5504' },
	},
};

const viaCepResponse = {
	cep: '01001-000',
	logradouro: 'Praça da Sé',
	complemento: 'lado ímpar',
	unidade: '',
	bairro: 'Sé',
	localidade: 'São Paulo',
	uf: 'SP',
	ibge: '3550308',
	gia: '1004',
	ddd: '11',
	siafi: '7107',
};

const openCepResponse = {
	cep: '01001-000',
	logradouro: 'Praça da Sé',
	complemento: 'lado ímpar',
	bairro: 'Sé',
	localidade: 'São Paulo',
	uf: 'SP',
	ibge: '3550308',
	ddd: '11',
};

const apiCepResponse = {
	status: 200,
	ok: true,
	code: '06233-030',
	state: 'SP',
	city: 'Osasco',
	district: 'Piratininga',
	address: 'Rua Paula Rodrigues',
	statusText: 'ok',
};

describe('normalizeCep', () => {
	it('should normalize BrasilAPI response', () => {
		const result = normalizeCep(brasilApiResponse, 'brasilapi');
		expect(result.cep).toBe('01001000');
		expect(result.logradouro).toBe('Praça da Sé');
		expect(result.bairro).toBe('Sé');
		expect(result.cidade).toBe('São Paulo');
		expect(result.uf).toBe('SP');
	});

	it('should normalize ViaCEP response', () => {
		const result = normalizeCep(viaCepResponse, 'viacep');
		expect(result.cep).toBe('01001000');
		expect(result.logradouro).toBe('Praça da Sé');
		expect(result.cidade).toBe('São Paulo');
		expect(result.ibge).toBe('3550308');
		expect(result.ddd).toBe('11');
	});

	it('should normalize OpenCEP response', () => {
		const result = normalizeCep(openCepResponse, 'opencep');
		expect(result.cep).toBe('01001000');
		expect(result.cidade).toBe('São Paulo');
		expect(result.ddd).toBe('11');
	});

	it('should handle missing fields gracefully', () => {
		const result = normalizeCep({ cep: '01001000' }, 'brasilapi');
		expect(result.logradouro).toBe('');
		expect(result.bairro).toBe('');
		expect(result.cidade).toBe('');
	});

	it('should throw for unknown provider', () => {
		expect(() => normalizeCep({}, 'unknown')).toThrow('Unknown CEP provider: unknown');
	});

	it('should detect ViaCEP error response', () => {
		expect(() => normalizeCep({ erro: true }, 'viacep')).toThrow();
	});

	it('should normalize ApiCEP response', () => {
		const result = normalizeCep(apiCepResponse, 'apicep');
		expect(result.cep).toBe('06233030');
		expect(result.logradouro).toBe('Rua Paula Rodrigues');
		expect(result.complemento).toBe('');
		expect(result.bairro).toBe('Piratininga');
		expect(result.cidade).toBe('Osasco');
		expect(result.uf).toBe('SP');
		expect(result.ibge).toBe('');
		expect(result.ddd).toBe('');
	});

	it('should handle empty ApiCEP object with safe defaults', () => {
		const result = normalizeCep({ ok: true }, 'apicep');
		expect(result.cep).toBe('');
		expect(result.logradouro).toBe('');
		expect(result.bairro).toBe('');
		expect(result.cidade).toBe('');
		expect(result.uf).toBe('');
	});

	it('should throw for ApiCEP error response (ok: false)', () => {
		expect(() => normalizeCep({ ok: false }, 'apicep')).toThrow('CEP not found');
	});

	it('should strip hyphen from ApiCEP code field', () => {
		const result = normalizeCep({ ok: true, code: '01001-000' }, 'apicep');
		expect(result.cep).toBe('01001000');
	});
});

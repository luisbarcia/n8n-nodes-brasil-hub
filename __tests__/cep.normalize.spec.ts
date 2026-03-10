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
});

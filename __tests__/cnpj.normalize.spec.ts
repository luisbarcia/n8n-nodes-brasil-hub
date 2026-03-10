import { normalizeCnpj } from '../nodes/BrasilHub/resources/cnpj/cnpj.normalize';

const brasilApiResponse = {
	cnpj: '00000000000191',
	razao_social: 'BANCO DO BRASIL SA',
	nome_fantasia: 'DIRECAO GERAL',
	situacao_cadastral: 2,
	descricao_situacao_cadastral: 'ATIVA',
	data_inicio_atividade: '1966-08-01',
	porte: 5,
	descricao_porte: 'DEMAIS',
	natureza_juridica: 'Sociedade de Economia Mista',
	capital_social: 120000000000,
	cnae_fiscal: 6422100,
	cnae_fiscal_descricao: 'Bancos múltiplos, com carteira comercial',
	descricao_tipo_de_logradouro: 'SAUN',
	logradouro: 'QUADRA 5 LOTE B',
	numero: 'S/N',
	complemento: 'ANDAR 1 A 16 SALA 101 A 1601 ANDAR 1 A 16 SALA 101 A 1601 ED BANCO DO BRASIL',
	bairro: 'ASA NORTE',
	cep: '70040912',
	uf: 'DF',
	municipio: 'BRASILIA',
	ddd_telefone_1: '6134934000',
	ddd_telefone_2: '',
	ddd_fax: '',
	email: '',
	qsa: [
		{
			nome_socio: 'TARCIANA PAULA GOMES MEDEIROS',
			cnpj_cpf_do_socio: '***456789**',
			qualificacao_socio: 'Presidente',
			data_entrada_sociedade: '2023-01-16',
		},
	],
	cnaes_secundarios: [{ codigo: 6423900, descricao: 'Caixas econômicas' }],
	opcao_pelo_simples: false,
	data_opcao_pelo_simples: null,
	data_exclusao_do_simples: null,
};

const cnpjWsResponse = {
	razao_social: 'BANCO DO BRASIL SA',
	estabelecimento: {
		cnpj: '00000000000191',
		nome_fantasia: 'DIRECAO GERAL',
		situacao_cadastral: 'Ativa',
		data_inicio_atividade: '1966-08-01',
		atividade_principal: { id: '64.22-1-00', descricao: 'Bancos múltiplos, com carteira comercial' },
		tipo_logradouro: 'SAUN',
		logradouro: 'QUADRA 5 LOTE B',
		numero: 'S/N',
		complemento: 'ED BANCO DO BRASIL',
		bairro: 'ASA NORTE',
		cep: '70040912',
		cidade: { nome: 'BRASILIA' },
		estado: { sigla: 'DF' },
		ddd1: '61',
		telefone1: '34934000',
		ddd2: null,
		telefone2: null,
		email: null,
		atividades_secundarias: [],
	},
	porte: { descricao: 'DEMAIS' },
	natureza_juridica: { descricao: 'Sociedade de Economia Mista' },
	capital_social: 120000000000,
	socios: [
		{
			nome: 'TARCIANA PAULA GOMES MEDEIROS',
			cpf_cnpj_socio: '***456789**',
			qualificacao_socio: { descricao: 'Presidente' },
			data_entrada: '2023-01-16',
		},
	],
	simples: { optante: false, data_opcao: null, data_exclusao: null },
};

const receitaWsResponse = {
	cnpj: '00.000.000/0001-91',
	nome: 'BANCO DO BRASIL SA',
	fantasia: 'DIRECAO GERAL',
	situacao: 'ATIVA',
	abertura: '01/08/1966',
	porte: 'DEMAIS',
	natureza_juridica: '2038 - Sociedade de Economia Mista',
	capital_social: '120000000000.00',
	atividade_principal: [{ code: '64.22-1-00', text: 'Bancos múltiplos, com carteira comercial' }],
	logradouro: 'SAUN QUADRA 5 LOTE B',
	numero: 'S/N',
	complemento: 'ED BANCO DO BRASIL',
	bairro: 'ASA NORTE',
	cep: '70.040-912',
	municipio: 'BRASILIA',
	uf: 'DF',
	telefone: '(61) 3493-4000',
	email: '',
	qsa: [
		{
			nome: 'TARCIANA PAULA GOMES MEDEIROS',
			qual: 'Presidente',
		},
	],
	atividades_secundarias: [{ code: '64.23-9-00', text: 'Caixas econômicas' }],
	status: 'OK',
};

describe('normalizeCnpj', () => {
	it('should normalize BrasilAPI response', () => {
		const result = normalizeCnpj(brasilApiResponse, 'brasilapi');
		expect(result.cnpj).toBe('00000000000191');
		expect(result.razao_social).toBe('BANCO DO BRASIL SA');
		expect(result.nome_fantasia).toBe('DIRECAO GERAL');
		expect(result.situacao).toBe('ATIVA');
		expect(result.capital_social).toBe(120000000000);
		expect(result.atividade_principal.codigo).toBe('6422100');
		expect(result.endereco.uf).toBe('DF');
		expect(result.socios).toHaveLength(1);
		expect(result.socios[0].nome).toBe('TARCIANA PAULA GOMES MEDEIROS');
	});

	it('should normalize CNPJ.ws response', () => {
		const result = normalizeCnpj(cnpjWsResponse, 'cnpjws');
		expect(result.cnpj).toBe('00000000000191');
		expect(result.razao_social).toBe('BANCO DO BRASIL SA');
		expect(result.contato.telefone).toBe('6134934000');
		expect(result.contato.telefone).not.toContain('undefined');
		expect(result.endereco.municipio).toBe('BRASILIA');
	});

	it('should normalize ReceitaWS response', () => {
		const result = normalizeCnpj(receitaWsResponse, 'receitaws');
		expect(result.cnpj).toBe('00000000000191');
		expect(result.razao_social).toBe('BANCO DO BRASIL SA');
		expect(result.atividade_principal.codigo).toBe('64.22-1-00');
		expect(result.contato.telefone).toBe('(61) 3493-4000');
	});

	it('should handle missing optional fields gracefully', () => {
		const minimal = { cnpj: '00000000000191' };
		const result = normalizeCnpj(minimal, 'brasilapi');
		expect(result.cnpj).toBe('00000000000191');
		expect(result.razao_social).toBe('');
		expect(result.socios).toEqual([]);
		expect(result.contato.telefone).toBe('');
	});

	it('should never produce "undefined" strings in phone field', () => {
		const withPartialPhone = {
			...cnpjWsResponse,
			estabelecimento: {
				...cnpjWsResponse.estabelecimento,
				ddd1: '11',
				telefone1: undefined,
				ddd2: undefined,
				telefone2: '99998888',
			},
		};
		const result = normalizeCnpj(withPartialPhone, 'cnpjws');
		expect(result.contato.telefone).not.toContain('undefined');
	});
});

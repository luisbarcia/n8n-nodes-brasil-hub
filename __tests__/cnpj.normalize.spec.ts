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

const minhaReceitaResponse = {
	cnpj: '00000000000191',
	razao_social: 'BANCO DO BRASIL SA',
	nome_fantasia: 'DIRECAO GERAL',
	descricao_situacao_cadastral: 'ATIVA',
	data_inicio_atividade: '1966-08-01',
	porte: 'DEMAIS',
	natureza_juridica: 'Sociedade de Economia Mista',
	capital_social: 120000000000,
	cnae_fiscal: 6422100,
	cnae_fiscal_descricao: 'Bancos múltiplos, com carteira comercial',
	logradouro: 'SAUN QUADRA 5 LOTE B',
	numero: 'S/N',
	complemento: 'ED BANCO DO BRASIL',
	bairro: 'ASA NORTE',
	cep: '70040912',
	municipio: 'BRASILIA',
	uf: 'DF',
	ddd_telefone_1: '6134934000',
	ddd_telefone_2: '6132181144',
	email: 'atendimento@bb.com.br',
	qsa: [
		{
			nome_socio: 'TARCIANA PAULA GOMES MEDEIROS',
			cnpj_cpf_do_socio: '***456789**',
			qualificacao_socio: 'Presidente',
			data_entrada_sociedade: '2023-01-16',
		},
	],
};

const openCnpjOrgResponse = {
	cnpj: '00000000000191',
	razao_social: 'BANCO DO BRASIL SA',
	nome_fantasia: 'DIRECAO GERAL',
	situacao_cadastral: 'ATIVA',
	data_inicio_atividade: '1966-08-01',
	porte_empresa: 'DEMAIS',
	natureza_juridica: 'Sociedade de Economia Mista',
	capital_social: '120000000000,00',
	cnae_principal: '6422100',
	logradouro: 'SAUN QUADRA 5 LOTE B',
	numero: 'S/N',
	complemento: 'ED BANCO DO BRASIL',
	bairro: 'ASA NORTE',
	cep: '70040912',
	municipio: 'BRASILIA',
	uf: 'DF',
	email: 'atendimento@bb.com.br',
	telefones: [
		{ ddd: '61', numero: '34934000', tipo: 'telefone' },
	],
	QSA: [
		{
			nome_socio: 'TARCIANA PAULA GOMES MEDEIROS',
			cnpj_cpf_do_socio: '***456789**',
			qualificacao_socio: 'Presidente',
			data_entrada_sociedade: '2023-01-16',
		},
	],
};

const openCnpjComResponse = {
	success: true,
	data: {
		cnpj: '00000000000191',
		razaoSocial: 'BANCO DO BRASIL SA',
		nomeFantasia: 'DIRECAO GERAL',
		situacaoCadastral: 'ATIVA',
		capitalSocial: 120000000000,
		naturezaJuridica: 'Sociedade de Economia Mista',
		cnaePrincipal: '6422100',
		cnaePrincipalDescricao: 'Bancos múltiplos, com carteira comercial',
		logradouro: 'SAUN QUADRA 5 LOTE B',
		numero: 'S/N',
		complemento: 'ED BANCO DO BRASIL',
		bairro: 'ASA NORTE',
		cep: '70040912',
		municipio: 'BRASILIA',
		uf: 'DF',
		telefone: '6134934000',
		email: 'atendimento@bb.com.br',
		socios: [
			{
				nome: 'TARCIANA PAULA GOMES MEDEIROS',
				cpf_cnpj: '***456789**',
				qualificacao: 'Presidente',
				data_entrada_sociedade: '2023-01-16',
			},
		],
	},
};

const cnpjaResponse = {
	taxId: '00000000000191',
	alias: 'DIRECAO GERAL',
	founded: '1966-08-01',
	company: {
		name: 'BANCO DO BRASIL SA',
		size: { text: 'DEMAIS' },
		nature: { text: 'Sociedade de Economia Mista' },
		equity: 120000000000,
		members: [
			{
				person: { name: 'TARCIANA PAULA GOMES MEDEIROS', taxId: '***456789**' },
				role: { text: 'Presidente' },
				since: '2023-01-16',
			},
		],
	},
	status: { text: 'ATIVA' },
	mainActivity: { id: 6422100, text: 'Bancos múltiplos, com carteira comercial' },
	address: {
		street: 'SAUN QUADRA 5 LOTE B',
		number: 'S/N',
		details: 'ED BANCO DO BRASIL',
		district: 'ASA NORTE',
		zip: '70040912',
		city: 'BRASILIA',
		state: 'DF',
	},
	phones: [{ area: '61', number: '34934000' }],
	emails: [{ address: 'atendimento@bb.com.br' }],
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

	it('should throw for unknown provider', () => {
		expect(() => normalizeCnpj({}, 'unknown')).toThrow('Unknown CNPJ provider: unknown');
	});

	it('should handle CNPJ.ws response with all nested fields null', () => {
		const minimal = { razao_social: 'TESTE' };
		const result = normalizeCnpj(minimal, 'cnpjws');
		expect(result.razao_social).toBe('TESTE');
		expect(result.cnpj).toBe('');
		expect(result.porte).toBe('');
		expect(result.natureza_juridica).toBe('');
		expect(result.capital_social).toBe(0);
		expect(result.atividade_principal.codigo).toBe('');
		expect(result.endereco.municipio).toBe('');
		expect(result.contato.telefone).toBe('');
		expect(result.socios).toEqual([]);
	});

	it('should handle ReceitaWS response with atividade_principal not an array', () => {
		const data = { cnpj: '00000000000191', atividade_principal: 'invalid' };
		const result = normalizeCnpj(data, 'receitaws');
		expect(result.atividade_principal.codigo).toBe('');
		expect(result.atividade_principal.descricao).toBe('');
	});

	it('should handle ReceitaWS response with empty atividade_principal array', () => {
		const data = { cnpj: '00000000000191', atividade_principal: [] };
		const result = normalizeCnpj(data, 'receitaws');
		expect(result.atividade_principal.codigo).toBe('');
	});

	it('should handle CNPJ.ws socio with null qualificacao_socio', () => {
		const data = {
			...cnpjWsResponse,
			socios: [{ nome: 'TESTE', cpf_cnpj_socio: '***', qualificacao_socio: null, data_entrada: '2020-01-01' }],
		};
		const result = normalizeCnpj(data, 'cnpjws');
		expect(result.socios[0].qualificacao).toBe('');
		expect(result.socios[0].nome).toBe('TESTE');
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

	// --- MinhaReceita tests ---

	it('should normalize MinhaReceita response', () => {
		const result = normalizeCnpj(minhaReceitaResponse, 'minhareceita');
		expect(result.cnpj).toBe('00000000000191');
		expect(result.razao_social).toBe('BANCO DO BRASIL SA');
		expect(result.nome_fantasia).toBe('DIRECAO GERAL');
		expect(result.situacao).toBe('ATIVA');
		expect(result.data_abertura).toBe('1966-08-01');
		expect(result.porte).toBe('DEMAIS');
		expect(result.natureza_juridica).toBe('Sociedade de Economia Mista');
		expect(result.capital_social).toBe(120000000000);
		expect(result.atividade_principal.codigo).toBe('6422100');
		expect(result.atividade_principal.descricao).toBe('Bancos múltiplos, com carteira comercial');
		expect(result.endereco.logradouro).toBe('SAUN QUADRA 5 LOTE B');
		expect(result.endereco.uf).toBe('DF');
		expect(result.contato.telefone).toBe('6134934000 / 6132181144');
		expect(result.contato.email).toBe('atendimento@bb.com.br');
		expect(result.socios).toHaveLength(1);
		expect(result.socios[0].nome).toBe('TARCIANA PAULA GOMES MEDEIROS');
		expect(result.socios[0].cpf_cnpj).toBe('***456789**');
		expect(result.socios[0].qualificacao).toBe('Presidente');
		expect(result.socios[0].data_entrada).toBe('2023-01-16');
	});

	it('should handle MinhaReceita empty object gracefully', () => {
		const result = normalizeCnpj({}, 'minhareceita');
		expect(result.cnpj).toBe('');
		expect(result.razao_social).toBe('');
		expect(result.capital_social).toBe(0);
		expect(result.atividade_principal.codigo).toBe('');
		expect(result.socios).toEqual([]);
		expect(result.contato.telefone).toBe('');
		expect(result.contato.email).toBe('');
	});

	it('should convert MinhaReceita cnae_fiscal number to string', () => {
		const data = { cnae_fiscal: 6422100 };
		const result = normalizeCnpj(data, 'minhareceita');
		expect(result.atividade_principal.codigo).toBe('6422100');
		expect(typeof result.atividade_principal.codigo).toBe('string');
	});

	// --- OpenCNPJ.org tests ---

	it('should normalize OpenCNPJ.org response', () => {
		const result = normalizeCnpj(openCnpjOrgResponse, 'opencnpjorg');
		expect(result.cnpj).toBe('00000000000191');
		expect(result.razao_social).toBe('BANCO DO BRASIL SA');
		expect(result.situacao).toBe('ATIVA');
		expect(result.porte).toBe('DEMAIS');
		expect(result.capital_social).toBe(120000000000);
		expect(result.atividade_principal.codigo).toBe('6422100');
		expect(result.atividade_principal.descricao).toBe('');
		expect(result.contato.telefone).toBe('6134934000');
		expect(result.contato.email).toBe('atendimento@bb.com.br');
		expect(result.socios).toHaveLength(1);
		expect(result.socios[0].nome).toBe('TARCIANA PAULA GOMES MEDEIROS');
	});

	it('should handle OpenCNPJ.org empty object gracefully', () => {
		const result = normalizeCnpj({}, 'opencnpjorg');
		expect(result.cnpj).toBe('');
		expect(result.capital_social).toBe(0);
		expect(result.socios).toEqual([]);
		expect(result.contato.telefone).toBe('');
	});

	it('should parse OpenCNPJ.org capital_social string with comma', () => {
		const data = { capital_social: '120000000000,00' };
		const result = normalizeCnpj(data, 'opencnpjorg');
		expect(result.capital_social).toBe(120000000000);
	});

	it('should parse OpenCNPJ.org capital_social "0,00" to zero', () => {
		const data = { capital_social: '0,00' };
		const result = normalizeCnpj(data, 'opencnpjorg');
		expect(result.capital_social).toBe(0);
	});

	it('should handle OpenCNPJ.org with no telefones array', () => {
		const data = { cnpj: '00000000000191' };
		const result = normalizeCnpj(data, 'opencnpjorg');
		expect(result.contato.telefone).toBe('');
	});

	it('should use QSA (uppercase) from OpenCNPJ.org', () => {
		const data = {
			QSA: [
				{ nome_socio: 'FULANO', cnpj_cpf_do_socio: '***123***', qualificacao_socio: 'Diretor', data_entrada_sociedade: '2020-01-01' },
			],
		};
		const result = normalizeCnpj(data, 'opencnpjorg');
		expect(result.socios).toHaveLength(1);
		expect(result.socios[0].nome).toBe('FULANO');
	});

	// --- OpenCNPJ.com tests ---

	it('should normalize OpenCNPJ.com wrapped response', () => {
		const result = normalizeCnpj(openCnpjComResponse, 'opencnpjcom');
		expect(result.cnpj).toBe('00000000000191');
		expect(result.razao_social).toBe('BANCO DO BRASIL SA');
		expect(result.nome_fantasia).toBe('DIRECAO GERAL');
		expect(result.situacao).toBe('ATIVA');
		expect(result.data_abertura).toBe('');
		expect(result.porte).toBe('');
		expect(result.natureza_juridica).toBe('Sociedade de Economia Mista');
		expect(result.capital_social).toBe(120000000000);
		expect(result.atividade_principal.codigo).toBe('6422100');
		expect(result.atividade_principal.descricao).toBe('Bancos múltiplos, com carteira comercial');
		expect(result.contato.telefone).toBe('6134934000');
		expect(result.contato.email).toBe('atendimento@bb.com.br');
		expect(result.socios).toHaveLength(1);
		expect(result.socios[0].nome).toBe('TARCIANA PAULA GOMES MEDEIROS');
		expect(result.socios[0].data_entrada).toBe('2023-01-16');
	});

	it('should handle OpenCNPJ.com empty object gracefully', () => {
		const result = normalizeCnpj({}, 'opencnpjcom');
		expect(result.cnpj).toBe('');
		expect(result.razao_social).toBe('');
		expect(result.capital_social).toBe(0);
		expect(result.socios).toEqual([]);
		expect(result.data_abertura).toBe('');
		expect(result.porte).toBe('');
	});

	it('should handle OpenCNPJ.com non-wrapped response (no data key)', () => {
		const flat = {
			cnpj: '11222333000181',
			razaoSocial: 'EMPRESA TESTE',
			nomeFantasia: '',
			situacaoCadastral: 'ATIVA',
			capitalSocial: 50000,
			naturezaJuridica: 'Empresário Individual',
			socios: [],
		};
		const result = normalizeCnpj(flat, 'opencnpjcom');
		expect(result.cnpj).toBe('11222333000181');
		expect(result.razao_social).toBe('EMPRESA TESTE');
		expect(result.capital_social).toBe(50000);
	});

	// --- CNPJA tests ---

	it('should normalize CNPJA deeply nested response', () => {
		const result = normalizeCnpj(cnpjaResponse, 'cnpja');
		expect(result.cnpj).toBe('00000000000191');
		expect(result.razao_social).toBe('BANCO DO BRASIL SA');
		expect(result.nome_fantasia).toBe('DIRECAO GERAL');
		expect(result.situacao).toBe('ATIVA');
		expect(result.data_abertura).toBe('1966-08-01');
		expect(result.porte).toBe('DEMAIS');
		expect(result.natureza_juridica).toBe('Sociedade de Economia Mista');
		expect(result.capital_social).toBe(120000000000);
		expect(result.atividade_principal.codigo).toBe('6422100');
		expect(result.atividade_principal.descricao).toBe('Bancos múltiplos, com carteira comercial');
		expect(result.endereco.logradouro).toBe('SAUN QUADRA 5 LOTE B');
		expect(result.endereco.numero).toBe('S/N');
		expect(result.endereco.complemento).toBe('ED BANCO DO BRASIL');
		expect(result.endereco.bairro).toBe('ASA NORTE');
		expect(result.endereco.cep).toBe('70040912');
		expect(result.endereco.municipio).toBe('BRASILIA');
		expect(result.endereco.uf).toBe('DF');
		expect(result.contato.telefone).toBe('6134934000');
		expect(result.contato.email).toBe('atendimento@bb.com.br');
		expect(result.socios).toHaveLength(1);
		expect(result.socios[0].nome).toBe('TARCIANA PAULA GOMES MEDEIROS');
		expect(result.socios[0].cpf_cnpj).toBe('***456789**');
		expect(result.socios[0].qualificacao).toBe('Presidente');
		expect(result.socios[0].data_entrada).toBe('2023-01-16');
	});

	it('should handle CNPJA empty object gracefully', () => {
		const result = normalizeCnpj({}, 'cnpja');
		expect(result.cnpj).toBe('');
		expect(result.razao_social).toBe('');
		expect(result.nome_fantasia).toBe('');
		expect(result.situacao).toBe('');
		expect(result.capital_social).toBe(0);
		expect(result.atividade_principal.codigo).toBe('');
		expect(result.atividade_principal.descricao).toBe('');
		expect(result.socios).toEqual([]);
		expect(result.contato.telefone).toBe('');
		expect(result.contato.email).toBe('');
	});

	it('should handle CNPJA with null nested fields (size, nature, equity)', () => {
		const data = {
			taxId: '11222333000181',
			company: { name: 'TESTE', size: null, nature: null, equity: null, members: [] },
			status: { text: 'ATIVA' },
			mainActivity: { id: 1234, text: 'Teste' },
			address: {},
			phones: [],
			emails: [],
		};
		const result = normalizeCnpj(data, 'cnpja');
		expect(result.cnpj).toBe('11222333000181');
		expect(result.porte).toBe('');
		expect(result.natureza_juridica).toBe('');
		expect(result.capital_social).toBe(0);
	});

	it('should convert CNPJA mainActivity.id number to string', () => {
		const data = {
			mainActivity: { id: 6422100, text: 'Bancos' },
			company: {},
		};
		const result = normalizeCnpj(data, 'cnpja');
		expect(result.atividade_principal.codigo).toBe('6422100');
		expect(typeof result.atividade_principal.codigo).toBe('string');
	});

	it('should handle CNPJA with no phones or emails', () => {
		const data = {
			taxId: '11222333000181',
			company: { name: 'TESTE' },
		};
		const result = normalizeCnpj(data, 'cnpja');
		expect(result.contato.telefone).toBe('');
		expect(result.contato.email).toBe('');
	});
});

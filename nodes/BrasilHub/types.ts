export interface ICnpjResult {
	cnpj: string;
	razao_social: string;
	nome_fantasia: string;
	situacao: string;
	data_abertura: string;
	porte: string;
	natureza_juridica: string;
	capital_social: number;
	atividade_principal: {
		codigo: string;
		descricao: string;
	};
	endereco: {
		logradouro: string;
		numero: string;
		complemento: string;
		bairro: string;
		cep: string;
		municipio: string;
		uf: string;
	};
	contato: {
		telefone: string;
		email: string;
	};
	socios: Array<{
		nome: string;
		cpf_cnpj: string;
		qualificacao: string;
		data_entrada: string;
	}>;
	_meta?: IMeta;
	_raw?: unknown;
}

export interface ICepResult {
	cep: string;
	logradouro: string;
	complemento: string;
	bairro: string;
	cidade: string;
	uf: string;
	ibge: string;
	ddd: string;
	_meta?: IMeta;
	_raw?: unknown;
}

export interface IValidationResult {
	valid: boolean;
	formatted: string;
	input: string;
}

export interface IMeta {
	provider: string;
	query: string;
	queried_at: string;
	strategy: 'fallback' | 'direct';
	errors?: string[];
}

export interface IProvider {
	name: string;
	url: string;
}

export interface IFallbackResult {
	data: unknown;
	provider: string;
	errors: string[];
}

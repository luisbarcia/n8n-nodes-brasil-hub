/** Normalized CNPJ query result, unified across all providers (BrasilAPI, CNPJ.ws, ReceitaWS). */
export interface ICnpjResult {
	/** Raw 14-digit CNPJ number (no formatting). */
	cnpj: string;
	/** Official company name (razão social). */
	razao_social: string;
	/** Trade name (nome fantasia). */
	nome_fantasia: string;
	/** Registration status (e.g. "ATIVA", "BAIXADA"). */
	situacao: string;
	/** Company opening date (format varies by provider). */
	data_abertura: string;
	/** Company size classification (e.g. "ME", "EPP", "DEMAIS"). */
	porte: string;
	/** Legal nature description. */
	natureza_juridica: string;
	/** Registered share capital in BRL. */
	capital_social: number;
	/** Primary economic activity (CNAE). */
	atividade_principal: {
		/** CNAE code (numeric from BrasilAPI, formatted from ReceitaWS). */
		codigo: string;
		/** CNAE description. */
		descricao: string;
	};
	/** Company registered address. */
	endereco: {
		logradouro: string;
		numero: string;
		complemento: string;
		bairro: string;
		cep: string;
		municipio: string;
		/** Two-letter state code (e.g. "SP", "RJ"). */
		uf: string;
	};
	/** Contact information. */
	contato: {
		/** Phone number(s), concatenated with " / " when multiple. */
		telefone: string;
		email: string;
	};
	/** Company partners (QSA - Quadro Societário e Administrativo). */
	socios: Array<{
		nome: string;
		/** Masked CPF/CNPJ (may be partially redacted by provider). */
		cpf_cnpj: string;
		/** Role description (e.g. "Presidente", "Sócio-Administrador"). */
		qualificacao: string;
		/** Date the partner joined the company. */
		data_entrada: string;
	}>;
	/** Query metadata (provider used, timestamp, fallback errors). Present when queried via API. */
	_meta?: IMeta;
	/** Raw provider response. Present only when "Include Raw Response" is enabled. */
	_raw?: unknown;
}

/** Normalized CEP query result, unified across all providers (BrasilAPI, ViaCEP, OpenCEP). */
export interface ICepResult {
	/** Raw 8-digit CEP number (no formatting). */
	cep: string;
	/** Street name. */
	logradouro: string;
	/** Address complement (e.g. "lado ímpar"). */
	complemento: string;
	/** Neighborhood name. */
	bairro: string;
	/** City name. */
	cidade: string;
	/** Two-letter state code (e.g. "SP", "RJ"). */
	uf: string;
	/** IBGE city code (empty when not available from provider). */
	ibge: string;
	/** Area code / DDD (empty when not available from provider). */
	ddd: string;
	/** Query metadata. Present when queried via API. */
	_meta?: IMeta;
	/** Raw provider response. Present only when "Include Raw Response" is enabled. */
	_raw?: unknown;
}

/** Result of a local CNPJ/CEP validation (no API call). */
export interface IValidationResult {
	/** Whether the input passes validation (checksum for CNPJ, format for CEP). */
	valid: boolean;
	/** Formatted value (e.g. "11.222.333/0001-81" or "01001-000"). Empty when invalid. */
	formatted: string;
	/** Original input as provided by the user. */
	input: string;
}

/** Metadata attached to every API query response under the `_meta` field. */
export interface IMeta {
	/** Name of the provider that returned the data (e.g. "brasilapi", "viacep"). */
	provider: string;
	/** Sanitized input used for the query (digits only). */
	query: string;
	/** ISO 8601 timestamp of when the query was executed. */
	queried_at: string;
	/** Resolution strategy used ("fallback" when multiple providers attempted). */
	strategy: 'fallback' | 'direct';
	/** Error messages from providers that failed before the successful one. */
	errors?: string[];
}

/** Normalized bank query result, unified across providers (BrasilAPI, BancosBrasileiros). */
export interface IBank {
	/** COMPE bank code (e.g. 1, 237, 341). Zero when not assigned. */
	code: number;
	/** Short bank name (e.g. "BCO DO BRASIL S.A."). */
	name: string;
	/** Full official bank name (e.g. "Banco do Brasil S.A."). */
	fullName: string;
	/** ISPB identifier (8-digit string, e.g. "00000000"). */
	ispb: string;
	/** Query metadata. Present when queried via API. */
	_meta?: IMeta;
	/** Raw provider response. Present only when "Include Raw Response" is enabled. */
	_raw?: unknown;
}

/** Normalized DDD query result from BrasilAPI. */
export interface IDdd {
	/** Two-letter state code (e.g. "SP", "RJ"). */
	state: string;
	/** List of cities that use this area code. */
	cities: string[];
	/** Query metadata. Present when queried via API. */
	_meta?: IMeta;
	/** Raw provider response. Present only when "Include Raw Response" is enabled. */
	_raw?: unknown;
}

/** Normalized Brazilian public holiday result, unified across providers (BrasilAPI, Nager.Date). */
export interface IFeriado {
	/** ISO 8601 date string (e.g. "2026-01-01"). */
	date: string;
	/** Holiday name in Portuguese (e.g. "Confraternização mundial"). */
	name: string;
	/** Holiday type (e.g. "national", "Public"). */
	type: string;
	/** Query metadata. Present when queried via API. */
	_meta?: IMeta;
	/** Raw provider response. Present only when "Include Raw Response" is enabled. */
	_raw?: unknown;
}

/** Normalized FIPE brand (marca) result from parallelum. */
export interface IFipeBrand {
	/** Brand code as returned by the API (e.g. "1", "59"). */
	code: string;
	/** Brand name (e.g. "Acura", "Honda"). */
	name: string;
	/** Query metadata. Present when queried via API. */
	_meta?: IMeta;
	/** Raw provider response. Present only when "Include Raw Response" is enabled. */
	_raw?: unknown;
}

/** Normalized FIPE model (modelo) result from parallelum. */
export interface IFipeModel {
	/** Model numeric code (e.g. 1, 4828). */
	code: number;
	/** Model name (e.g. "Integra GS 1.8", "Civic Sedan EXL 2.0"). */
	name: string;
	/** Query metadata. Present when queried via API. */
	_meta?: IMeta;
	/** Raw provider response. Present only when "Include Raw Response" is enabled. */
	_raw?: unknown;
}

/** Normalized FIPE year (ano) result from parallelum. */
export interface IFipeYear {
	/** Year-fuel code (e.g. "2024-1", "32000-1"). */
	code: string;
	/** Human-readable year and fuel (e.g. "2024 Gasolina", "Zero KM Gasolina"). */
	name: string;
	/** Query metadata. Present when queried via API. */
	_meta?: IMeta;
	/** Raw provider response. Present only when "Include Raw Response" is enabled. */
	_raw?: unknown;
}

/** Normalized FIPE price (preço) result from parallelum. */
export interface IFipePrice {
	/** Vehicle type code (1=Car, 2=Motorcycle, 3=Truck). */
	vehicleType: number;
	/** Brand name. */
	brand: string;
	/** Model name. */
	model: string;
	/** Model year. */
	modelYear: number;
	/** Fuel type description. */
	fuel: string;
	/** FIPE table code (e.g. "014275-3"). */
	fipeCode: string;
	/** Reference month (e.g. "março de 2026"). */
	referenceMonth: string;
	/** Price string (e.g. "R$ 120.000,00"). */
	price: string;
	/** Fuel type abbreviation (e.g. "G", "D", "E"). */
	fuelAbbreviation: string;
	/** Query metadata. Present when queried via API. */
	_meta?: IMeta;
	/** Raw provider response. Present only when "Include Raw Response" is enabled. */
	_raw?: unknown;
}

/** A data provider endpoint used by the fallback engine. */
export interface IProvider {
	/** Provider identifier (e.g. "brasilapi", "cnpjws", "receitaws"). */
	name: string;
	/** Full URL to query, including the search parameter. */
	url: string;
}

/** Internal result from {@link queryWithFallback}, before normalization. */
export interface IFallbackResult {
	/** Raw response data from the successful provider. */
	data: unknown;
	/** Name of the provider that succeeded. */
	provider: string;
	/** Error messages from providers that failed before the successful one. */
	errors: string[];
}

import type { ICepResult } from '../../types';

function stripNonDigits(value: string): string {
	return value.replace(/\D/g, '');
}

function normalizeBrasilApi(data: Record<string, unknown>): ICepResult {
	return {
		cep: stripNonDigits(String(data.cep ?? '')),
		logradouro: String(data.street ?? ''),
		complemento: '',
		bairro: String(data.neighborhood ?? ''),
		cidade: String(data.city ?? ''),
		uf: String(data.state ?? ''),
		ibge: '',
		ddd: '',
	};
}

function normalizeViaCep(data: Record<string, unknown>): ICepResult {
	if (data.erro) {
		throw new Error('CEP not found');
	}
	return {
		cep: stripNonDigits(String(data.cep ?? '')),
		logradouro: String(data.logradouro ?? ''),
		complemento: String(data.complemento ?? ''),
		bairro: String(data.bairro ?? ''),
		cidade: String(data.localidade ?? ''),
		uf: String(data.uf ?? ''),
		ibge: String(data.ibge ?? ''),
		ddd: String(data.ddd ?? ''),
	};
}

function normalizeOpenCep(data: Record<string, unknown>): ICepResult {
	return {
		cep: stripNonDigits(String(data.cep ?? '')),
		logradouro: String(data.logradouro ?? ''),
		complemento: String(data.complemento ?? ''),
		bairro: String(data.bairro ?? ''),
		cidade: String(data.localidade ?? ''),
		uf: String(data.uf ?? ''),
		ibge: String(data.ibge ?? ''),
		ddd: String(data.ddd ?? ''),
	};
}

const normalizers: Record<string, (data: Record<string, unknown>) => ICepResult> = {
	brasilapi: normalizeBrasilApi,
	viacep: normalizeViaCep,
	opencep: normalizeOpenCep,
};

export function normalizeCep(data: unknown, provider: string): ICepResult {
	const normalizer = normalizers[provider];
	if (!normalizer) {
		throw new Error(`Unknown CEP provider: ${provider}`);
	}
	return normalizer(data as Record<string, unknown>);
}

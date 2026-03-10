import type { ICnpjResult } from '../../types';

/** Concatenates DDD area code and phone number, returning empty string if either is missing. */
function buildPhone(ddd?: string | null, phone?: string | null): string {
	if (ddd && phone) return `${ddd}${phone}`;
	return '';
}

function stripNonDigits(value: string): string {
	return value.replace(/\D/g, '');
}

function normalizeBrasilApi(data: Record<string, unknown>): ICnpjResult {
	const qsa = Array.isArray(data.qsa) ? data.qsa : [];
	return {
		cnpj: String(data.cnpj ?? ''),
		razao_social: String(data.razao_social ?? ''),
		nome_fantasia: String(data.nome_fantasia ?? ''),
		situacao: String(data.descricao_situacao_cadastral ?? ''),
		data_abertura: String(data.data_inicio_atividade ?? ''),
		porte: String(data.descricao_porte ?? ''),
		natureza_juridica: String(data.natureza_juridica ?? ''),
		capital_social: Number(data.capital_social ?? 0),
		atividade_principal: {
			codigo: String(data.cnae_fiscal ?? ''),
			descricao: String(data.cnae_fiscal_descricao ?? ''),
		},
		endereco: {
			logradouro: `${data.descricao_tipo_de_logradouro ?? ''} ${data.logradouro ?? ''}`.trim(),
			numero: String(data.numero ?? ''),
			complemento: String(data.complemento ?? ''),
			bairro: String(data.bairro ?? ''),
			cep: String(data.cep ?? ''),
			municipio: String(data.municipio ?? ''),
			uf: String(data.uf ?? ''),
		},
		contato: {
			telefone: [
				String(data.ddd_telefone_1 ?? ''),
				String(data.ddd_telefone_2 ?? ''),
			].filter(Boolean).join(' / '),
			email: String(data.email ?? ''),
		},
		socios: qsa.map((s: Record<string, unknown>) => ({
			nome: String(s.nome_socio ?? ''),
			cpf_cnpj: String(s.cnpj_cpf_do_socio ?? ''),
			qualificacao: String(s.qualificacao_socio ?? ''),
			data_entrada: String(s.data_entrada_sociedade ?? ''),
		})),
	};
}

function normalizeCnpjWs(data: Record<string, unknown>): ICnpjResult {
	const est = (data.estabelecimento ?? {}) as Record<string, unknown>;
	const ativPrincipal = (est.atividade_principal ?? {}) as Record<string, unknown>;
	const cidade = (est.cidade ?? {}) as Record<string, unknown>;
	const estado = (est.estado ?? {}) as Record<string, unknown>;
	const porte = (data.porte ?? {}) as Record<string, unknown>;
	const natJuridica = (data.natureza_juridica ?? {}) as Record<string, unknown>;
	const socios = Array.isArray(data.socios) ? data.socios : [];

	const phones = [
		buildPhone(est.ddd1 as string | undefined, est.telefone1 as string | undefined),
		buildPhone(est.ddd2 as string | undefined, est.telefone2 as string | undefined),
	].filter(Boolean);

	return {
		cnpj: String(est.cnpj ?? ''),
		razao_social: String(data.razao_social ?? ''),
		nome_fantasia: String(est.nome_fantasia ?? ''),
		situacao: String(est.situacao_cadastral ?? ''),
		data_abertura: String(est.data_inicio_atividade ?? ''),
		porte: String(porte.descricao ?? ''),
		natureza_juridica: String(natJuridica.descricao ?? ''),
		capital_social: Number(data.capital_social ?? 0),
		atividade_principal: {
			codigo: String(ativPrincipal.id ?? ''),
			descricao: String(ativPrincipal.descricao ?? ''),
		},
		endereco: {
			logradouro: `${est.tipo_logradouro ?? ''} ${est.logradouro ?? ''}`.trim(),
			numero: String(est.numero ?? ''),
			complemento: String(est.complemento ?? ''),
			bairro: String(est.bairro ?? ''),
			cep: String(est.cep ?? ''),
			municipio: String(cidade.nome ?? ''),
			uf: String(estado.sigla ?? ''),
		},
		contato: {
			telefone: phones.join(' / '),
			email: String(est.email ?? ''),
		},
		socios: socios.map((s: Record<string, unknown>) => {
			const qual = (s.qualificacao_socio ?? {}) as Record<string, unknown>;
			return {
				nome: String(s.nome ?? ''),
				cpf_cnpj: String(s.cpf_cnpj_socio ?? ''),
				qualificacao: String(qual.descricao ?? ''),
				data_entrada: String(s.data_entrada ?? ''),
			};
		}),
	};
}

function normalizeReceitaWs(data: Record<string, unknown>): ICnpjResult {
	const ativPrincipal = Array.isArray(data.atividade_principal) ? data.atividade_principal[0] ?? {} : {};
	const qsa = Array.isArray(data.qsa) ? data.qsa : [];

	return {
		cnpj: stripNonDigits(String(data.cnpj ?? '')),
		razao_social: String(data.nome ?? ''),
		nome_fantasia: String(data.fantasia ?? ''),
		situacao: String(data.situacao ?? ''),
		data_abertura: String(data.abertura ?? ''),
		porte: String(data.porte ?? ''),
		natureza_juridica: String(data.natureza_juridica ?? ''),
		capital_social: parseFloat(String(data.capital_social ?? '0')),
		atividade_principal: {
			codigo: String((ativPrincipal as Record<string, unknown>).code ?? ''),
			descricao: String((ativPrincipal as Record<string, unknown>).text ?? ''),
		},
		endereco: {
			logradouro: String(data.logradouro ?? ''),
			numero: String(data.numero ?? ''),
			complemento: String(data.complemento ?? ''),
			bairro: String(data.bairro ?? ''),
			cep: stripNonDigits(String(data.cep ?? '')),
			municipio: String(data.municipio ?? ''),
			uf: String(data.uf ?? ''),
		},
		contato: {
			telefone: String(data.telefone ?? ''),
			email: String(data.email ?? ''),
		},
		socios: qsa.map((s: Record<string, unknown>) => ({
			nome: String(s.nome ?? ''),
			cpf_cnpj: '',
			qualificacao: String(s.qual ?? ''),
			data_entrada: '',
		})),
	};
}

const normalizers: Record<string, (data: Record<string, unknown>) => ICnpjResult> = {
	brasilapi: normalizeBrasilApi,
	cnpjws: normalizeCnpjWs,
	receitaws: normalizeReceitaWs,
};

/**
 * Normalizes raw CNPJ API response into the unified {@link ICnpjResult} schema.
 *
 * Dispatches to provider-specific normalizers (BrasilAPI, CNPJ.ws, ReceitaWS)
 * that handle field name mapping and data type coercion.
 *
 * @param data - Raw JSON response from the provider.
 * @param provider - Provider identifier (e.g. `"brasilapi"`, `"cnpjws"`, `"receitaws"`).
 * @returns Normalized CNPJ result.
 * @throws {Error} If the provider name is not recognized.
 */
export function normalizeCnpj(data: unknown, provider: string): ICnpjResult {
	const normalizer = normalizers[provider];
	if (!normalizer) {
		throw new Error(`Unknown CNPJ provider: ${provider}`);
	}
	return normalizer(data as Record<string, unknown>);
}

import type { ICnpjResult } from '../../types';
import { safeStr, stripNonDigits } from '../../shared/utils';

/** Concatenates DDD area code and phone number, returning empty string if either is missing. */
function buildPhone(ddd?: string | null, phone?: string | null): string {
	if (ddd && phone) return `${ddd}${phone}`;
	return '';
}

/** Maps BrasilAPI flat response fields to the unified {@link ICnpjResult} schema. */
function normalizeBrasilApi(data: Record<string, unknown>): ICnpjResult {
	const qsa = Array.isArray(data.qsa) ? data.qsa : [];
	return {
		cnpj: safeStr(data.cnpj),
		razao_social: safeStr(data.razao_social),
		nome_fantasia: safeStr(data.nome_fantasia),
		situacao: safeStr(data.descricao_situacao_cadastral),
		data_abertura: safeStr(data.data_inicio_atividade),
		porte: safeStr(data.descricao_porte),
		natureza_juridica: safeStr(data.natureza_juridica),
		capital_social: Number(data.capital_social ?? 0),
		atividade_principal: {
			codigo: safeStr(data.cnae_fiscal),
			descricao: safeStr(data.cnae_fiscal_descricao),
		},
		endereco: {
			logradouro: `${safeStr(data.descricao_tipo_de_logradouro)} ${safeStr(data.logradouro)}`.trim(),
			numero: safeStr(data.numero),
			complemento: safeStr(data.complemento),
			bairro: safeStr(data.bairro),
			cep: safeStr(data.cep),
			municipio: safeStr(data.municipio),
			uf: safeStr(data.uf),
		},
		contato: {
			telefone: [
				safeStr(data.ddd_telefone_1),
				safeStr(data.ddd_telefone_2),
			].filter(Boolean).join(' / '),
			email: safeStr(data.email),
		},
		socios: qsa.map((s: Record<string, unknown>) => ({
			nome: safeStr(s.nome_socio),
			cpf_cnpj: safeStr(s.cnpj_cpf_do_socio),
			qualificacao: safeStr(s.qualificacao_socio),
			data_entrada: safeStr(s.data_entrada_sociedade),
		})),
	};
}

/** Maps CNPJ.ws nested response (estabelecimento, socios) to {@link ICnpjResult}. */
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
		cnpj: safeStr(est.cnpj),
		razao_social: safeStr(data.razao_social),
		nome_fantasia: safeStr(est.nome_fantasia),
		situacao: safeStr(est.situacao_cadastral),
		data_abertura: safeStr(est.data_inicio_atividade),
		porte: safeStr(porte.descricao),
		natureza_juridica: safeStr(natJuridica.descricao),
		capital_social: Number(data.capital_social ?? 0),
		atividade_principal: {
			codigo: safeStr(ativPrincipal.id),
			descricao: safeStr(ativPrincipal.descricao),
		},
		endereco: {
			logradouro: `${safeStr(est.tipo_logradouro)} ${safeStr(est.logradouro)}`.trim(),
			numero: safeStr(est.numero),
			complemento: safeStr(est.complemento),
			bairro: safeStr(est.bairro),
			cep: safeStr(est.cep),
			municipio: safeStr(cidade.nome),
			uf: safeStr(estado.sigla),
		},
		contato: {
			telefone: phones.join(' / '),
			email: safeStr(est.email),
		},
		socios: socios.map((s: Record<string, unknown>) => {
			const qual = (s.qualificacao_socio ?? {}) as Record<string, unknown>;
			return {
				nome: safeStr(s.nome),
				cpf_cnpj: safeStr(s.cpf_cnpj_socio),
				qualificacao: safeStr(qual.descricao),
				data_entrada: safeStr(s.data_entrada),
			};
		}),
	};
}

/** Maps ReceitaWS response to {@link ICnpjResult}. QSA entries lack cpf_cnpj and data_entrada. */
function normalizeReceitaWs(data: Record<string, unknown>): ICnpjResult {
	const ativPrincipal = Array.isArray(data.atividade_principal) ? data.atividade_principal[0] ?? {} : {};
	const qsa = Array.isArray(data.qsa) ? data.qsa : [];

	return {
		cnpj: stripNonDigits(safeStr(data.cnpj)),
		razao_social: safeStr(data.nome),
		nome_fantasia: safeStr(data.fantasia),
		situacao: safeStr(data.situacao),
		data_abertura: safeStr(data.abertura),
		porte: safeStr(data.porte),
		natureza_juridica: safeStr(data.natureza_juridica),
		capital_social: Number.parseFloat(safeStr(data.capital_social) || '0'),
		atividade_principal: {
			codigo: safeStr((ativPrincipal as Record<string, unknown>).code),
			descricao: safeStr((ativPrincipal as Record<string, unknown>).text),
		},
		endereco: {
			logradouro: safeStr(data.logradouro),
			numero: safeStr(data.numero),
			complemento: safeStr(data.complemento),
			bairro: safeStr(data.bairro),
			cep: stripNonDigits(safeStr(data.cep)),
			municipio: safeStr(data.municipio),
			uf: safeStr(data.uf),
		},
		contato: {
			telefone: safeStr(data.telefone),
			email: safeStr(data.email),
		},
		socios: qsa.map((s: Record<string, unknown>) => ({
			nome: safeStr(s.nome),
			cpf_cnpj: '',
			qualificacao: safeStr(s.qual),
			data_entrada: '',
		})),
	};
}

/** Provider name → normalizer function dispatch table. */
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

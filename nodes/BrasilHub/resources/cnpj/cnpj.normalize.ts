import type { ICnpjResult } from '../../types';
import { safeStr, stripNonDigits } from '../../shared/utils';
import { createNormalizerDispatch } from '../../shared/execute-helpers';

/**
 * Safely coerces a value to a number, returning 0 for NaN/null/undefined.
 *
 * Handles cases where API responses contain non-numeric strings (e.g. `"abc"`)
 * that `Number()` would convert to NaN.
 *
 * @param value - Any value from an untyped API response.
 * @returns The value as a number, or `0` if NaN/null/undefined.
 */
function safeCapital(value: unknown): number {
	const n = Number(value ?? 0);
	return Number.isNaN(n) ? 0 : n;
}

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
		capital_social: safeCapital(data.capital_social),
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
		capital_social: safeCapital(data.capital_social),
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
		capital_social: safeCapital(data.capital_social),
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

/** Maps MinhaReceita flat, snake_case response to {@link ICnpjResult}. Similar to BrasilAPI. */
function normalizeMinhaReceita(data: Record<string, unknown>): ICnpjResult {
	const qsa = Array.isArray(data.qsa) ? data.qsa : [];
	return {
		cnpj: safeStr(data.cnpj),
		razao_social: safeStr(data.razao_social),
		nome_fantasia: safeStr(data.nome_fantasia),
		situacao: safeStr(data.descricao_situacao_cadastral),
		data_abertura: safeStr(data.data_inicio_atividade),
		porte: safeStr(data.porte),
		natureza_juridica: safeStr(data.natureza_juridica),
		capital_social: safeCapital(data.capital_social),
		atividade_principal: {
			codigo: data.cnae_fiscal == null ? '' : String(data.cnae_fiscal),
			descricao: safeStr(data.cnae_fiscal_descricao),
		},
		endereco: {
			logradouro: safeStr(data.logradouro),
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

/** Maps OpenCNPJ.org flat, snake_case response to {@link ICnpjResult}. */
function normalizeOpenCnpjOrg(data: Record<string, unknown>): ICnpjResult {
	const qsa = Array.isArray(data.QSA) ? data.QSA : [];
	const telefones = Array.isArray(data.telefones) ? data.telefones : [];
	const phone = telefones.length > 0
		? `${safeStr((telefones[0] as Record<string, unknown>).ddd)}${safeStr((telefones[0] as Record<string, unknown>).numero)}`
		: '';

	const rawCapital = data.capital_social;
	const capitalSocial = typeof rawCapital === 'string'
		? Number.parseFloat(rawCapital.replaceAll('.', '').replaceAll(',', '.')) || 0
		: safeCapital(rawCapital);

	return {
		cnpj: safeStr(data.cnpj),
		razao_social: safeStr(data.razao_social),
		nome_fantasia: safeStr(data.nome_fantasia),
		situacao: safeStr(data.situacao_cadastral),
		data_abertura: safeStr(data.data_inicio_atividade),
		porte: safeStr(data.porte_empresa),
		natureza_juridica: safeStr(data.natureza_juridica),
		capital_social: capitalSocial,
		atividade_principal: {
			codigo: safeStr(data.cnae_principal),
			descricao: '',
		},
		endereco: {
			logradouro: safeStr(data.logradouro),
			numero: safeStr(data.numero),
			complemento: safeStr(data.complemento),
			bairro: safeStr(data.bairro),
			cep: safeStr(data.cep),
			municipio: safeStr(data.municipio),
			uf: safeStr(data.uf),
		},
		contato: {
			telefone: phone,
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

/** Maps OpenCNPJ.com wrapped camelCase response to {@link ICnpjResult}. */
function normalizeOpenCnpjCom(raw: Record<string, unknown>): ICnpjResult {
	const data = ((raw.data ?? raw) as Record<string, unknown>);
	const socios = Array.isArray(data.socios) ? data.socios : [];
	return {
		cnpj: safeStr(data.cnpj),
		razao_social: safeStr(data.razaoSocial),
		nome_fantasia: safeStr(data.nomeFantasia),
		situacao: safeStr(data.situacaoCadastral),
		data_abertura: '',
		porte: '',
		natureza_juridica: safeStr(data.naturezaJuridica),
		capital_social: safeCapital(data.capitalSocial),
		atividade_principal: {
			codigo: safeStr(data.cnaePrincipal),
			descricao: safeStr(data.cnaePrincipalDescricao),
		},
		endereco: {
			logradouro: safeStr(data.logradouro),
			numero: safeStr(data.numero),
			complemento: safeStr(data.complemento),
			bairro: safeStr(data.bairro),
			cep: safeStr(data.cep),
			municipio: safeStr(data.municipio),
			uf: safeStr(data.uf),
		},
		contato: {
			telefone: safeStr(data.telefone),
			email: safeStr(data.email),
		},
		socios: socios.map((s: Record<string, unknown>) => ({
			nome: safeStr(s.nome),
			cpf_cnpj: safeStr(s.cpf_cnpj),
			qualificacao: safeStr(s.qualificacao),
			data_entrada: safeStr(s.data_entrada_sociedade),
		})),
	};
}

/** Maps CNPJA deeply nested camelCase response to {@link ICnpjResult}. */
function normalizeCnpja(data: Record<string, unknown>): ICnpjResult {
	const company = (data.company ?? {}) as Record<string, unknown>;
	const address = (data.address ?? {}) as Record<string, unknown>;
	const status = (data.status ?? {}) as Record<string, unknown>;
	const mainActivity = (data.mainActivity ?? {}) as Record<string, unknown>;
	const size = (company.size ?? {}) as Record<string, unknown>;
	const nature = (company.nature ?? {}) as Record<string, unknown>;
	const phones = Array.isArray(data.phones) ? data.phones : [];
	const emails = Array.isArray(data.emails) ? data.emails : [];
	const members = Array.isArray(company.members) ? company.members : [];

	const firstPhone = phones.length > 0 ? phones[0] as Record<string, unknown> : null;
	const phoneStr = firstPhone
		? `${safeStr(firstPhone.area)}${safeStr(firstPhone.number)}`
		: '';

	const firstEmail = emails.length > 0 ? emails[0] as Record<string, unknown> : null;

	return {
		cnpj: safeStr(data.taxId),
		razao_social: safeStr(company.name),
		nome_fantasia: safeStr(data.alias),
		situacao: safeStr(status.text),
		data_abertura: safeStr(data.founded),
		porte: safeStr(size.text),
		natureza_juridica: safeStr(nature.text),
		capital_social: safeCapital(company.equity),
		atividade_principal: {
			codigo: mainActivity.id == null ? '' : String(mainActivity.id),
			descricao: safeStr(mainActivity.text),
		},
		endereco: {
			logradouro: safeStr(address.street),
			numero: safeStr(address.number),
			complemento: safeStr(address.details),
			bairro: safeStr(address.district),
			cep: safeStr(address.zip),
			municipio: safeStr(address.city),
			uf: safeStr(address.state),
		},
		contato: {
			telefone: phoneStr,
			email: firstEmail ? safeStr(firstEmail.address) : '',
		},
		socios: members.map((m: Record<string, unknown>) => {
			const person = (m.person ?? {}) as Record<string, unknown>;
			const role = (m.role ?? {}) as Record<string, unknown>;
			return {
				nome: safeStr(person.name),
				cpf_cnpj: safeStr(person.taxId),
				qualificacao: safeStr(role.text),
				data_entrada: safeStr(m.since),
			};
		}),
	};
}

/**
 * Normalizes raw CNPJ API response into the unified {@link ICnpjResult} schema.
 *
 * Uses Strategy pattern dispatch to provider-specific normalizers (BrasilAPI, CNPJ.ws,
 * ReceitaWS, MinhaReceita, OpenCNPJ.org, OpenCNPJ.com, CNPJA) that handle field name
 * mapping and data type coercion.
 *
 * @param data - Raw JSON response from the provider.
 * @param provider - Provider identifier (e.g. `"brasilapi"`, `"cnpjws"`, `"minhareceita"`).
 * @returns Normalized CNPJ result.
 * @throws {Error} If the provider name is not recognized.
 */
export const normalizeCnpj = createNormalizerDispatch<ICnpjResult>({
	brasilapi: normalizeBrasilApi,
	cnpjws: normalizeCnpjWs,
	receitaws: normalizeReceitaWs,
	minhareceita: normalizeMinhaReceita,
	opencnpjorg: normalizeOpenCnpjOrg,
	opencnpjcom: normalizeOpenCnpjCom,
	cnpja: normalizeCnpja,
}, 'CNPJ');

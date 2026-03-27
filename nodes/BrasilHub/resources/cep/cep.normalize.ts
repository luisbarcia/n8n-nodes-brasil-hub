import type { ICepResult } from '../../types';
import { safeStr, stripNonDigits } from '../../shared/utils';
import { createNormalizerDispatch } from '../../shared/execute-helpers';

/** Maps BrasilAPI response (street/neighborhood/city/state) to {@link ICepResult}. */
function normalizeBrasilApi(data: Record<string, unknown>): ICepResult {
	return {
		cep: stripNonDigits(safeStr(data.cep)),
		logradouro: safeStr(data.street),
		complemento: '',
		bairro: safeStr(data.neighborhood),
		cidade: safeStr(data.city),
		uf: safeStr(data.state),
		ibge: '',
		ddd: '',
	};
}

/** Shared normalizer for ViaCEP and OpenCEP (identical field mapping). */
function normalizeViaCepFormat(data: Record<string, unknown>): ICepResult {
	return {
		cep: stripNonDigits(safeStr(data.cep)),
		logradouro: safeStr(data.logradouro),
		complemento: safeStr(data.complemento),
		bairro: safeStr(data.bairro),
		cidade: safeStr(data.localidade),
		uf: safeStr(data.uf),
		ibge: safeStr(data.ibge),
		ddd: safeStr(data.ddd),
	};
}

/** Maps ViaCEP response to {@link ICepResult}, detecting `{erro: true}` as not-found. */
function normalizeViaCep(data: Record<string, unknown>): ICepResult {
	if (data.erro) {
		throw new Error('CEP not found');
	}
	return normalizeViaCepFormat(data);
}

/** Maps ApiCEP response (address/district/city/state) to {@link ICepResult}, detecting `ok: false` as not-found. */
function normalizeApiCep(data: Record<string, unknown>): ICepResult {
	if (!data.ok) {
		throw new Error('CEP not found');
	}
	return {
		cep: stripNonDigits(safeStr(data.code)),
		logradouro: safeStr(data.address),
		complemento: '',
		bairro: safeStr(data.district),
		cidade: safeStr(data.city),
		uf: safeStr(data.state),
		ibge: '',
		ddd: '',
	};
}

/**
 * Normalizes raw CEP API response into the unified {@link ICepResult} schema.
 *
 * Uses Strategy pattern dispatch to provider-specific normalizers (BrasilAPI, ViaCEP,
 * OpenCEP, ApiCEP) that handle field name mapping. ViaCEP's `{erro: true}` and
 * ApiCEP's `{ok: false}` responses are detected and thrown as errors.
 *
 * @param data - Raw JSON response from the provider.
 * @param provider - Provider identifier (e.g. `"brasilapi"`, `"viacep"`, `"opencep"`, `"apicep"`).
 * @returns Normalized CEP result.
 * @throws If the provider name is not recognized.
 */
export const normalizeCep = createNormalizerDispatch<ICepResult>({
	brasilapi: normalizeBrasilApi,
	viacep: normalizeViaCep,
	opencep: normalizeViaCepFormat,
	apicep: normalizeApiCep,
}, 'CEP');

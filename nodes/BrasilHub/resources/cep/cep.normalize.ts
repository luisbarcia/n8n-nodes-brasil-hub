import type { ICepResult } from '../../types';
import { safeStr, stripNonDigits } from '../../shared/utils';

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

/** Provider name → normalizer function dispatch table. */
const normalizers: Record<string, (data: Record<string, unknown>) => ICepResult> = {
	brasilapi: normalizeBrasilApi,
	viacep: normalizeViaCep,
	opencep: normalizeViaCepFormat,
};

/**
 * Normalizes raw CEP API response into the unified {@link ICepResult} schema.
 *
 * Dispatches to provider-specific normalizers (BrasilAPI, ViaCEP, OpenCEP)
 * that handle field name mapping. ViaCEP's `{erro: true}` response is detected
 * and thrown as an error during normalization.
 *
 * @param data - Raw JSON response from the provider.
 * @param provider - Provider identifier (e.g. `"brasilapi"`, `"viacep"`, `"opencep"`).
 * @returns Normalized CEP result.
 * @throws {Error} If the provider name is not recognized.
 */
export function normalizeCep(data: unknown, provider: string): ICepResult {
	const normalizer = normalizers[provider];
	if (!normalizer) {
		throw new Error(`Unknown CEP provider: ${provider}`);
	}
	return normalizer(data as Record<string, unknown>);
}

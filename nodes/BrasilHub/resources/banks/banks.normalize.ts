import type { IBank } from '../../types';
import { safeStr } from '../../shared/utils';

/** Normalizes a single BrasilAPI bank response. */
function normalizeBrasilApiBank(data: Record<string, unknown>): IBank {
	return {
		code: typeof data.code === 'number' ? data.code : 0,
		name: safeStr(data.name),
		fullName: safeStr(data.fullName),
		ispb: safeStr(data.ispb),
	};
}

/** Normalizes a single BancosBrasileiros bank entry. */
function normalizeBancosBrasileirosBank(data: Record<string, unknown>): IBank {
	return {
		code: Number.parseInt(safeStr(data.COMPE), 10) || 0,
		name: safeStr(data.ShortName),
		fullName: safeStr(data.LongName),
		ispb: safeStr(data.ISPB),
	};
}

const normalizers: Record<string, (data: Record<string, unknown>) => IBank> = {
	brasilapi: normalizeBrasilApiBank,
	bancosbrasileiros: normalizeBancosBrasileirosBank,
};

/**
 * Normalizes a single bank from a provider response.
 *
 * For BrasilAPI, `data` is a single bank object.
 * For BancosBrasileiros, `data` is the full array — filtered by `bankCode`.
 *
 * @param data - Raw provider response (object or array).
 * @param provider - Provider name.
 * @param bankCode - Bank code to filter (required for BancosBrasileiros).
 * @returns Normalized bank result.
 */
export function normalizeBank(data: unknown, provider: string, bankCode?: number): IBank {
	if (provider === 'bancosbrasileiros') {
		const banks = Array.isArray(data) ? data as Array<Record<string, unknown>> : [];
		const bank = banks.find((b) => Number.parseInt(safeStr(b.COMPE), 10) === bankCode);
		if (!bank) {
			throw new Error(`Bank code ${bankCode} not found`);
		}
		return normalizeBancosBrasileirosBank(bank);
	}

	const normalizer = normalizers[provider];
	if (!normalizer) {
		throw new Error(`Unknown bank provider: ${provider}`);
	}
	return normalizer((data ?? {}) as Record<string, unknown>);
}

/**
 * Normalizes a list of banks from a provider response.
 *
 * @param data - Raw provider response (array of banks).
 * @param provider - Provider name.
 * @returns Array of normalized bank results.
 */
export function normalizeBanks(data: unknown, provider: string): IBank[] {
	const normalizer = normalizers[provider];
	if (!normalizer) {
		throw new Error(`Unknown bank provider: ${provider}`);
	}
	const items = Array.isArray(data) ? data as Array<Record<string, unknown>> : [];
	return items.map(normalizer);
}

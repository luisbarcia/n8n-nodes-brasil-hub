import type { IFipeBrand, IFipeModel, IFipeYear, IFipePrice, IFipeReferenceTable } from '../../types';
import { safeStr } from '../../shared/utils';

/** Normalizes an array of {codigo, nome} items into {code, name} objects (shared by brands and years). */
function normalizeCodeNameList(data: unknown): Array<{ code: string; name: string }> {
	if (!Array.isArray(data)) return [];
	return (data as unknown[]).filter((item) => item != null && typeof item === 'object').map((item) => ({
		code: safeStr((item as Record<string, unknown>).codigo),
		name: safeStr((item as Record<string, unknown>).nome),
	}));
}

/**
 * Normalizes a parallelum brands array.
 *
 * @param data - Raw array from `/fipe/api/v1/{vehicleType}/marcas`.
 * @returns Array of normalized brand objects.
 */
export function normalizeBrands(data: unknown): IFipeBrand[] {
	return normalizeCodeNameList(data);
}

/**
 * Normalizes a parallelum models response, extracting only the `modelos` array.
 *
 * The API returns `{ modelos: [...], anos: [...] }` — we ignore `anos` since
 * there is a dedicated Years operation for that.
 *
 * @param data - Raw response from `/fipe/api/v1/{vehicleType}/marcas/{brandCode}/modelos`.
 * @returns Array of normalized model objects.
 */
export function normalizeModels(data: unknown): IFipeModel[] {
	const obj = (data ?? {}) as Record<string, unknown>;
	const modelos = Array.isArray(obj.modelos)
		? (obj.modelos as Array<Record<string, unknown>>)
		: [];
	return modelos.filter((item) => item != null && typeof item === 'object').map((item) => ({
		code: Number.isFinite(item.codigo) ? (item.codigo as number) : 0,
		name: safeStr(item.nome),
	}));
}

/**
 * Normalizes a parallelum years array.
 *
 * @param data - Raw array from `/fipe/api/v1/{vehicleType}/marcas/{brandCode}/modelos/{modelCode}/anos`.
 * @returns Array of normalized year objects.
 */
export function normalizeYears(data: unknown): IFipeYear[] {
	return normalizeCodeNameList(data);
}

/**
 * Normalizes a parallelum reference tables array.
 *
 * @param data - Raw array from `/fipe/api/v1/referencias`.
 * @param filterYear - When > 0, only returns tables matching this year.
 * @returns Array of normalized reference table objects.
 */
export function normalizeReferenceTables(data: unknown, filterYear = 0): IFipeReferenceTable[] {
	if (!Array.isArray(data)) return [];
	const tables = (data as unknown[])
		.filter((item) => item != null && typeof item === 'object')
		.map((item) => {
			const obj = item as Record<string, unknown>;
			return {
				code: Number.isFinite(obj.Codigo) ? (obj.Codigo as number) : 0,
				month: safeStr(obj.Mes),
			};
		});
	if (filterYear > 0) {
		const yearStr = `/${String(filterYear)}`;
		return tables.filter((t) => t.month.endsWith(yearStr));
	}
	return tables;
}

/**
 * Normalizes a parallelum price response (single item).
 *
 * @param data - Raw response from `/fipe/api/v1/{vehicleType}/marcas/{brandCode}/modelos/{modelCode}/anos/{yearCode}`.
 * @returns Normalized price object.
 */
export function normalizePrice(data: unknown): IFipePrice {
	const obj = (data ?? {}) as Record<string, unknown>;
	return {
		vehicleType: Number.isFinite(obj.TipoVeiculo) ? (obj.TipoVeiculo as number) : 0,
		brand: safeStr(obj.Marca),
		model: safeStr(obj.Modelo),
		modelYear: Number.isFinite(obj.AnoModelo) ? (obj.AnoModelo as number) : 0,
		fuel: safeStr(obj.Combustivel),
		fipeCode: safeStr(obj.CodigoFipe),
		referenceMonth: safeStr(obj.MesReferencia),
		price: safeStr(obj.Valor),
		fuelAbbreviation: safeStr(obj.SiglaCombustivel),
	};
}

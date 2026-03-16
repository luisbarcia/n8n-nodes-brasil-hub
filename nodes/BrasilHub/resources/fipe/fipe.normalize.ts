import type { IFipeBrand, IFipeModel, IFipeYear, IFipePrice } from '../../types';
import { safeStr } from '../../shared/utils';

/**
 * Normalizes a parallelum brands array.
 *
 * @param data - Raw array from `/fipe/api/v1/{vehicleType}/marcas`.
 * @returns Array of normalized brand objects.
 */
export function normalizeBrands(data: unknown): IFipeBrand[] {
	if (!Array.isArray(data)) return [];
	return (data as Array<Record<string, unknown>>).map((item) => ({
		code: safeStr(item.codigo),
		name: safeStr(item.nome),
	}));
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
	return modelos.map((item) => ({
		code: typeof item.codigo === 'number' ? item.codigo : 0,
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
	if (!Array.isArray(data)) return [];
	return (data as Array<Record<string, unknown>>).map((item) => ({
		code: safeStr(item.codigo),
		name: safeStr(item.nome),
	}));
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
		vehicleType: typeof obj.TipoVeiculo === 'number' ? obj.TipoVeiculo : 0,
		brand: safeStr(obj.Marca),
		model: safeStr(obj.Modelo),
		modelYear: typeof obj.AnoModelo === 'number' ? obj.AnoModelo : 0,
		fuel: safeStr(obj.Combustivel),
		fipeCode: safeStr(obj.CodigoFipe),
		referenceMonth: safeStr(obj.MesReferencia),
		price: safeStr(obj.Valor),
		fuelAbbreviation: safeStr(obj.SiglaCombustivel),
	};
}

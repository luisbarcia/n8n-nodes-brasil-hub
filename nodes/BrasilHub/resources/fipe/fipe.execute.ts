import type { IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';
import { buildMeta, buildResultItem, buildResultItems } from '../../shared/utils';
import { normalizeBrands, normalizeModels, normalizeYears, normalizePrice } from './fipe.normalize';

const BASE_URL = 'https://parallelum.com.br/fipe/api/v1';

const ALLOWED_VEHICLE_TYPES = new Set(['carros', 'motos', 'caminhoes']);
const BRAND_MODEL_PATTERN = /^\d{1,6}$/;
const YEAR_CODE_PATTERN = /^\d{1,5}-\d{1,2}$/;

/** Appends `?tabela_referencia=X` when refTable > 0. */
function appendRefTable(url: string, refTable: number): string {
	const safeRef = Math.floor(refTable);
	return safeRef > 0 ? `${url}?tabela_referencia=${safeRef}` : url;
}

/** Validates vehicleType against the allowlist. */
function validateVehicleType(context: IExecuteFunctions, vehicleType: string, itemIndex: number): void {
	if (!ALLOWED_VEHICLE_TYPES.has(vehicleType)) {
		throw new NodeOperationError(
			context.getNode(),
			`Invalid vehicle type: "${vehicleType}". Must be one of: carros, motos, caminhoes`,
			{ itemIndex },
		);
	}
}

/** Validates a FIPE code parameter against a regex pattern. */
function validateCode(context: IExecuteFunctions, value: string, name: string, pattern: RegExp, itemIndex: number): void {
	if (!value) {
		throw new NodeOperationError(context.getNode(), `${name} is required`, { itemIndex });
	}
	if (!pattern.test(value)) {
		throw new NodeOperationError(
			context.getNode(),
			`Invalid ${name}: "${value}". Expected format: ${pattern.source}`,
			{ itemIndex },
		);
	}
}

/** Reads common FIPE params from the execution context with validation. */
function getCommonParams(context: IExecuteFunctions, itemIndex: number) {
	const vehicleType = context.getNodeParameter('vehicleType', itemIndex) as string;
	const referenceTable = context.getNodeParameter('referenceTable', itemIndex, 0) as number;
	const includeRaw = context.getNodeParameter('includeRaw', itemIndex, false) as boolean;
	validateVehicleType(context, vehicleType, itemIndex);
	return { vehicleType, referenceTable, includeRaw };
}

/** Performs a single HTTP GET to parallelum. */
async function fetchFipe(context: IExecuteFunctions, url: string): Promise<unknown> {
	return context.helpers.httpRequest({
		method: 'GET',
		url,
		headers: {
			Accept: 'application/json',
			'User-Agent': 'n8n-brasil-hub-node/1.0',
		},
		timeout: 10000,
	});
}

/**
 * Lists all vehicle brands for a given type from the FIPE table.
 *
 * @param context - n8n execution context.
 * @param itemIndex - Current item index.
 * @returns One n8n item per brand.
 */
export async function fipeBrands(
	context: IExecuteFunctions,
	itemIndex: number,
): Promise<INodeExecutionData[]> {
	const { vehicleType, referenceTable, includeRaw } = getCommonParams(context, itemIndex);

	const url = appendRefTable(`${BASE_URL}/${encodeURIComponent(vehicleType)}/marcas`, referenceTable);
	const data = await fetchFipe(context, url);

	const brands = normalizeBrands(data);
	const rawItems = Array.isArray(data) ? data as Array<Record<string, unknown>> : [];
	const meta = buildMeta('parallelum', vehicleType, []);

	return buildResultItems(brands as unknown as Array<Record<string, unknown>>, meta, rawItems, includeRaw, itemIndex) as INodeExecutionData[];
}

/**
 * Lists all models for a given brand from the FIPE table.
 *
 * @param context - n8n execution context.
 * @param itemIndex - Current item index.
 * @returns One n8n item per model.
 * @throws {NodeOperationError} If brandCode is empty.
 */
export async function fipeModels(
	context: IExecuteFunctions,
	itemIndex: number,
): Promise<INodeExecutionData[]> {
	const { vehicleType, referenceTable, includeRaw } = getCommonParams(context, itemIndex);
	const brandCode = context.getNodeParameter('brandCode', itemIndex) as string;
	validateCode(context, brandCode, 'Brand code', BRAND_MODEL_PATTERN, itemIndex);

	const url = appendRefTable(
		`${BASE_URL}/${encodeURIComponent(vehicleType)}/marcas/${encodeURIComponent(brandCode)}/modelos`,
		referenceTable,
	);
	const data = await fetchFipe(context, url);

	const models = normalizeModels(data);
	const rawModelos = ((data as Record<string, unknown>)?.modelos ?? []) as Array<Record<string, unknown>>;
	const meta = buildMeta('parallelum', `${vehicleType}/${brandCode}`, []);

	return buildResultItems(models as unknown as Array<Record<string, unknown>>, meta, rawModelos, includeRaw, itemIndex) as INodeExecutionData[];
}

/**
 * Lists available years for a given model from the FIPE table.
 *
 * @param context - n8n execution context.
 * @param itemIndex - Current item index.
 * @returns One n8n item per year.
 * @throws {NodeOperationError} If brandCode or modelCode is empty.
 */
export async function fipeYears(
	context: IExecuteFunctions,
	itemIndex: number,
): Promise<INodeExecutionData[]> {
	const { vehicleType, referenceTable, includeRaw } = getCommonParams(context, itemIndex);
	const brandCode = context.getNodeParameter('brandCode', itemIndex) as string;
	const modelCode = context.getNodeParameter('modelCode', itemIndex) as string;
	validateCode(context, brandCode, 'Brand code', BRAND_MODEL_PATTERN, itemIndex);
	validateCode(context, modelCode, 'Model code', BRAND_MODEL_PATTERN, itemIndex);

	const url = appendRefTable(
		`${BASE_URL}/${encodeURIComponent(vehicleType)}/marcas/${encodeURIComponent(brandCode)}/modelos/${encodeURIComponent(modelCode)}/anos`,
		referenceTable,
	);
	const data = await fetchFipe(context, url);

	const years = normalizeYears(data);
	const rawItems = Array.isArray(data) ? data as Array<Record<string, unknown>> : [];
	const meta = buildMeta('parallelum', `${vehicleType}/${brandCode}/${modelCode}`, []);

	return buildResultItems(years as unknown as Array<Record<string, unknown>>, meta, rawItems, includeRaw, itemIndex) as INodeExecutionData[];
}

/**
 * Gets the FIPE table price for a specific vehicle (brand/model/year).
 *
 * @param context - n8n execution context.
 * @param itemIndex - Current item index.
 * @returns Single n8n item with normalized price data.
 * @throws {NodeOperationError} If brandCode, modelCode, or yearCode is empty.
 */
export async function fipePrice(
	context: IExecuteFunctions,
	itemIndex: number,
): Promise<INodeExecutionData[]> {
	const { vehicleType, referenceTable, includeRaw } = getCommonParams(context, itemIndex);
	const brandCode = context.getNodeParameter('brandCode', itemIndex) as string;
	const modelCode = context.getNodeParameter('modelCode', itemIndex) as string;
	const yearCode = context.getNodeParameter('yearCode', itemIndex) as string;
	validateCode(context, brandCode, 'Brand code', BRAND_MODEL_PATTERN, itemIndex);
	validateCode(context, modelCode, 'Model code', BRAND_MODEL_PATTERN, itemIndex);
	validateCode(context, yearCode, 'Year code', YEAR_CODE_PATTERN, itemIndex);

	const url = appendRefTable(
		`${BASE_URL}/${encodeURIComponent(vehicleType)}/marcas/${encodeURIComponent(brandCode)}/modelos/${encodeURIComponent(modelCode)}/anos/${encodeURIComponent(yearCode)}`,
		referenceTable,
	);
	const data = await fetchFipe(context, url);

	const price = normalizePrice(data);
	const meta = buildMeta('parallelum', `${vehicleType}/${brandCode}/${modelCode}/${yearCode}`, []);

	return buildResultItem(price as unknown as Record<string, unknown>, meta, data, includeRaw, itemIndex) as INodeExecutionData[];
}

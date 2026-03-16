import type { IExecuteFunctions, INodeExecutionData, IDataObject } from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';
import { buildMeta } from '../../shared/utils';
import { normalizeBrands, normalizeModels, normalizeYears, normalizePrice } from './fipe.normalize';

const BASE_URL = 'https://parallelum.com.br/fipe/api/v1';

/** Appends `?tabela_referencia=X` when refTable > 0. */
function appendRefTable(url: string, refTable: number): string {
	return refTable > 0 ? `${url}?tabela_referencia=${refTable}` : url;
}

/** Reads common FIPE params from the execution context. */
function getCommonParams(context: IExecuteFunctions, itemIndex: number) {
	const vehicleType = context.getNodeParameter('vehicleType', itemIndex) as string;
	const referenceTable = context.getNodeParameter('referenceTable', itemIndex, 0) as number;
	const includeRaw = context.getNodeParameter('includeRaw', itemIndex, false) as boolean;
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

	const url = appendRefTable(`${BASE_URL}/${vehicleType}/marcas`, referenceTable);
	const data = await fetchFipe(context, url);

	const brands = normalizeBrands(data);
	const rawItems = Array.isArray(data) ? data as Array<Record<string, unknown>> : [];
	const meta = buildMeta('parallelum', vehicleType, []);

	return brands.map((brand, index) => ({
		json: {
			...brand,
			_meta: meta,
			...(includeRaw && { _raw: rawItems[index] as unknown as IDataObject }),
		} as IDataObject,
		pairedItem: { item: itemIndex },
	}));
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

	if (!brandCode) {
		throw new NodeOperationError(context.getNode(), 'Brand code is required', { itemIndex });
	}

	const url = appendRefTable(
		`${BASE_URL}/${vehicleType}/marcas/${brandCode}/modelos`,
		referenceTable,
	);
	const data = await fetchFipe(context, url);

	const models = normalizeModels(data);
	const rawModelos = ((data as Record<string, unknown>)?.modelos ?? []) as Array<Record<string, unknown>>;
	const meta = buildMeta('parallelum', `${vehicleType}/${brandCode}`, []);

	return models.map((model, index) => ({
		json: {
			...model,
			_meta: meta,
			...(includeRaw && { _raw: rawModelos[index] as unknown as IDataObject }),
		} as IDataObject,
		pairedItem: { item: itemIndex },
	}));
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

	if (!brandCode) {
		throw new NodeOperationError(context.getNode(), 'Brand code is required', { itemIndex });
	}
	if (!modelCode) {
		throw new NodeOperationError(context.getNode(), 'Model code is required', { itemIndex });
	}

	const url = appendRefTable(
		`${BASE_URL}/${vehicleType}/marcas/${brandCode}/modelos/${modelCode}/anos`,
		referenceTable,
	);
	const data = await fetchFipe(context, url);

	const years = normalizeYears(data);
	const rawItems = Array.isArray(data) ? data as Array<Record<string, unknown>> : [];
	const meta = buildMeta('parallelum', `${vehicleType}/${brandCode}/${modelCode}`, []);

	return years.map((year, index) => ({
		json: {
			...year,
			_meta: meta,
			...(includeRaw && { _raw: rawItems[index] as unknown as IDataObject }),
		} as IDataObject,
		pairedItem: { item: itemIndex },
	}));
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

	if (!brandCode) {
		throw new NodeOperationError(context.getNode(), 'Brand code is required', { itemIndex });
	}
	if (!modelCode) {
		throw new NodeOperationError(context.getNode(), 'Model code is required', { itemIndex });
	}
	if (!yearCode) {
		throw new NodeOperationError(context.getNode(), 'Year code is required', { itemIndex });
	}

	const url = appendRefTable(
		`${BASE_URL}/${vehicleType}/marcas/${brandCode}/modelos/${modelCode}/anos/${yearCode}`,
		referenceTable,
	);
	const data = await fetchFipe(context, url);

	const price = normalizePrice(data);
	const meta = buildMeta('parallelum', `${vehicleType}/${brandCode}/${modelCode}/${yearCode}`, []);

	return [{
		json: {
			...price,
			_meta: meta,
			...(includeRaw && { _raw: data as IDataObject }),
		} as IDataObject,
		pairedItem: { item: itemIndex },
	}];
}

import type { IExecuteFunctions, INodeExecutionData, IDataObject } from 'n8n-workflow';
import { generateCpf, generateCnpj, generatePerson, generateCompany } from './fake.generators';

const MIN_QUANTITY = 1;
const MAX_QUANTITY = 100;

/** Clamps quantity to [1, 100]. */
function clampQuantity(value: number): number {
	const n = Number.isFinite(value) ? Math.floor(value) : 1;
	return Math.max(MIN_QUANTITY, Math.min(MAX_QUANTITY, n));
}

/**
 * Generates fake CPF numbers.
 *
 * @param context - n8n execution context.
 * @param itemIndex - Current item index.
 * @returns One n8n item per generated CPF.
 */
export async function fakeCpf(
	context: IExecuteFunctions,
	itemIndex: number,
): Promise<INodeExecutionData[]> {
	const rawQty = context.getNodeParameter('quantity', itemIndex, 1) as number;
	const formatted = context.getNodeParameter('formatted', itemIndex, true) as boolean;
	const quantity = clampQuantity(rawQty);

	const results: INodeExecutionData[] = [];
	for (let i = 0; i < quantity; i++) {
		results.push({
			json: { cpf: generateCpf(formatted) } as IDataObject,
			pairedItem: { item: itemIndex },
		});
	}
	return results;
}

/**
 * Generates fake CNPJ numbers.
 *
 * @param context - n8n execution context.
 * @param itemIndex - Current item index.
 * @returns One n8n item per generated CNPJ.
 */
export async function fakeCnpj(
	context: IExecuteFunctions,
	itemIndex: number,
): Promise<INodeExecutionData[]> {
	const rawQty = context.getNodeParameter('quantity', itemIndex, 1) as number;
	const formatted = context.getNodeParameter('formatted', itemIndex, true) as boolean;
	const quantity = clampQuantity(rawQty);

	const results: INodeExecutionData[] = [];
	for (let i = 0; i < quantity; i++) {
		results.push({
			json: { cnpj: generateCnpj(formatted) } as IDataObject,
			pairedItem: { item: itemIndex },
		});
	}
	return results;
}

/**
 * Generates fake person profiles.
 *
 * @param context - n8n execution context.
 * @param itemIndex - Current item index.
 * @returns One n8n item per generated person.
 */
export async function fakePerson(
	context: IExecuteFunctions,
	itemIndex: number,
): Promise<INodeExecutionData[]> {
	const rawQty = context.getNodeParameter('quantity', itemIndex, 1) as number;
	const genderParam = context.getNodeParameter('gender', itemIndex, 'any') as string;
	const quantity = clampQuantity(rawQty);
	const gender = genderParam === 'M' || genderParam === 'F' ? genderParam : undefined;

	const results: INodeExecutionData[] = [];
	for (let i = 0; i < quantity; i++) {
		const person = generatePerson(gender);
		results.push({
			json: { ...person } as unknown as IDataObject,
			pairedItem: { item: itemIndex },
		});
	}
	return results;
}

/**
 * Generates fake company profiles.
 *
 * @param context - n8n execution context.
 * @param itemIndex - Current item index.
 * @returns One n8n item per generated company.
 */
export async function fakeCompany(
	context: IExecuteFunctions,
	itemIndex: number,
): Promise<INodeExecutionData[]> {
	const rawQty = context.getNodeParameter('quantity', itemIndex, 1) as number;
	const quantity = clampQuantity(rawQty);

	const results: INodeExecutionData[] = [];
	for (let i = 0; i < quantity; i++) {
		const company = generateCompany();
		results.push({
			json: { ...company } as unknown as IDataObject,
			pairedItem: { item: itemIndex },
		});
	}
	return results;
}

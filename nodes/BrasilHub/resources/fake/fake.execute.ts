import type { IExecuteFunctions, INodeExecutionData, IDataObject } from 'n8n-workflow';
import { generateCpf, generateCnpj, generatePerson, generateCompany } from './fake.generators';

const MIN_QUANTITY = 1;
const MAX_QUANTITY = 100;

/** Clamps quantity to [1, 100]. */
function clampQuantity(value: number): number {
	const n = Number.isFinite(value) ? Math.floor(value) : 1;
	return Math.max(MIN_QUANTITY, Math.min(MAX_QUANTITY, n));
}

/** Generates N items from a generator function, with pairedItem tracking. */
function generateItems(
	context: IExecuteFunctions,
	itemIndex: number,
	generator: () => IDataObject,
): INodeExecutionData[] {
	const rawQty = context.getNodeParameter('quantity', itemIndex, 1) as number;
	const quantity = clampQuantity(rawQty);

	const results: INodeExecutionData[] = [];
	for (let i = 0; i < quantity; i++) {
		results.push({ json: generator(), pairedItem: { item: itemIndex } });
	}
	return results;
}

/** Generates fake CPF numbers. */
export async function fakeCpf(
	context: IExecuteFunctions,
	itemIndex: number,
): Promise<INodeExecutionData[]> {
	const formatted = context.getNodeParameter('formatted', itemIndex, true) as boolean;
	return generateItems(context, itemIndex, () => ({ cpf: generateCpf(formatted) }) as IDataObject);
}

/** Generates fake CNPJ numbers. */
export async function fakeCnpj(
	context: IExecuteFunctions,
	itemIndex: number,
): Promise<INodeExecutionData[]> {
	const formatted = context.getNodeParameter('formatted', itemIndex, true) as boolean;
	return generateItems(context, itemIndex, () => ({ cnpj: generateCnpj(formatted) }) as IDataObject);
}

/** Generates fake person profiles. */
export async function fakePerson(
	context: IExecuteFunctions,
	itemIndex: number,
): Promise<INodeExecutionData[]> {
	const genderParam = context.getNodeParameter('gender', itemIndex, 'any') as string;
	const gender = genderParam === 'M' || genderParam === 'F' ? genderParam : undefined;
	return generateItems(context, itemIndex, () => ({ ...generatePerson(gender) }) as unknown as IDataObject);
}

/** Generates fake company profiles. */
export async function fakeCompany(
	context: IExecuteFunctions,
	itemIndex: number,
): Promise<INodeExecutionData[]> {
	return generateItems(context, itemIndex, () => ({ ...generateCompany() }) as unknown as IDataObject);
}

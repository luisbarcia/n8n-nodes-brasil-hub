import type {
	IExecuteFunctions,
	INode,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';
import { NodeConnectionTypes, NodeOperationError } from 'n8n-workflow';
import { cnpjDescription } from './resources/cnpj/cnpj.description';
import { cnpjQuery, cnpjValidate } from './resources/cnpj/cnpj.execute';
import { cepDescription } from './resources/cep/cep.description';
import { cepQuery, cepValidate } from './resources/cep/cep.execute';
import { cpfDescription } from './resources/cpf/cpf.description';
import { cpfValidate } from './resources/cpf/cpf.execute';
import { banksDescription } from './resources/banks/banks.description';
import { banksQuery, banksList } from './resources/banks/banks.execute';
import { dddDescription } from './resources/ddd/ddd.description';
import { dddQuery } from './resources/ddd/ddd.execute';
import { feriadosDescription } from './resources/feriados/feriados.description';
import { feriadosQuery } from './resources/feriados/feriados.execute';
import { ibgeDescription } from './resources/ibge/ibge.description';
import { ibgeStates, ibgeCities } from './resources/ibge/ibge.execute';
import { ncmDescription } from './resources/ncm/ncm.description';
import { ncmQuery, ncmSearch } from './resources/ncm/ncm.execute';
import { fipeDescription } from './resources/fipe/fipe.description';
import { fipeBrands, fipeModels, fipeYears, fipePrice } from './resources/fipe/fipe.execute';

/** Signature for resource/operation execute handlers (returns array to support multi-item resources). */
type ExecuteFunction = (
	context: IExecuteFunctions,
	itemIndex: number,
) => Promise<INodeExecutionData[]>;

/**
 * Dictionary map routing resource+operation pairs to their execute handlers.
 * Adding a new resource or operation only requires a new entry here.
 */
/** Builds an error output item for continueOnFail mode. */
function buildFailItem(node: INode, error: unknown, itemIndex: number): INodeExecutionData {
	const nodeError = error instanceof NodeOperationError
		? error
		: new NodeOperationError(node, error as Error, { itemIndex });
	return {
		json: { error: error instanceof Error ? error.message : String(error) },
		error: nodeError,
		pairedItem: { item: itemIndex },
	};
}

/** Re-throws an error with itemIndex attached to its context. */
function rethrowWithContext(node: INode, error: unknown, itemIndex: number): never {
	if ((error as Record<string, unknown>).context) {
		(error as Record<string, unknown> & { context: Record<string, unknown> }).context.itemIndex = itemIndex;
		throw error;
	}
	throw new NodeOperationError(node, error as Error, { itemIndex });
}

const resourceOperations: Record<string, Record<string, ExecuteFunction>> = {
	cnpj: { query: cnpjQuery, validate: cnpjValidate },
	cep: { query: cepQuery, validate: cepValidate },
	cpf: { validate: cpfValidate },
	banks: { query: banksQuery, list: banksList },
	ddd: { query: dddQuery },
	feriados: { query: feriadosQuery },
	ibge: { states: ibgeStates, cities: ibgeCities },
	ncm: { query: ncmQuery, search: ncmSearch },
	fipe: { brands: fipeBrands, models: fipeModels, years: fipeYears, price: fipePrice },
};

/**
 * Brasil Hub n8n community node.
 *
 * Queries Brazilian public data (CNPJ, CEP) with automatic multi-provider
 * fallback. Uses a dictionary map router to dispatch resource/operation
 * combinations to their respective handlers. Supports `continueOnFail` and
 * is AI Agent-compatible (`usableAsTool: true`).
 */
export class BrasilHub implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Brasil Hub',
		name: 'brasilHub',
		icon: 'file:brasilHub.svg',
		group: [],
		version: 1,
		subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
		description: 'Query Brazilian public data (CNPJ, CEP, CPF, Banks, DDD, Feriados, FIPE, IBGE, NCM) with multi-provider fallback',
		defaults: {
			name: 'Brasil Hub',
		},
		usableAsTool: true,
		inputs: [NodeConnectionTypes.Main],
		outputs: [NodeConnectionTypes.Main],
		properties: [
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				options: [
					{ name: 'Bank', value: 'banks', description: 'Query or list Brazilian banks and financial institutions' },
					{ name: 'CEP', value: 'cep', description: 'Query or validate Brazilian postal codes' },
					{ name: 'CNPJ', value: 'cnpj', description: 'Query or validate Brazilian company tax IDs' },
					{ name: 'CPF', value: 'cpf', description: 'Validate Brazilian individual tax IDs' },
					{ name: 'DDD', value: 'ddd', description: 'Query Brazilian area codes and their cities' },
					{ name: 'Feriado', value: 'feriados', description: 'Query Brazilian public holidays by year' },
					{ name: 'FIPE', value: 'fipe', description: 'Query vehicle prices from the FIPE table' },
					{ name: 'IBGE', value: 'ibge', description: 'Query Brazilian states and municipalities' },
					{ name: 'NCM', value: 'ncm', description: 'Query tax classification codes by code or description' },
				],
				default: 'cnpj',
			},
			...cnpjDescription,
			...cepDescription,
			...cpfDescription,
			...banksDescription,
			...dddDescription,
			...feriadosDescription,
			...fipeDescription,
			...ibgeDescription,
			...ncmDescription,
			{
				displayName: 'Timeout (ms)',
				name: 'timeout',
				type: 'number',
				default: 10000,
				typeOptions: {
					minValue: 1000,
					maxValue: 60000,
				},
				description: 'HTTP request timeout in milliseconds for each provider attempt',
			},
		],
	};

	/**
	 * Dispatches each input item to the handler matching its resource + operation pair.
	 *
	 * Supports `continueOnFail` — failed items return `{ error }` with `pairedItem` intact.
	 *
	 * @throws {NodeOperationError} If resource/operation pair is unknown or handler fails.
	 */
	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		for (let i = 0; i < items.length; i++) {
			try {
				const resource = this.getNodeParameter('resource', i);
				const operation = this.getNodeParameter('operation', i);

				const handler = resourceOperations[resource]?.[operation];
				if (!handler) {
					throw new NodeOperationError(
						this.getNode(),
						`Unknown resource/operation: ${resource}/${operation}`,
						{ itemIndex: i },
					);
				}

				const results = await handler(this, i);
				returnData.push(...results);
			} catch (error) {
				if (this.continueOnFail()) {
					returnData.push(buildFailItem(this.getNode(), error, i));
					continue;
				}
				rethrowWithContext(this.getNode(), error, i);
			}
		}

		return [returnData];
	}
}

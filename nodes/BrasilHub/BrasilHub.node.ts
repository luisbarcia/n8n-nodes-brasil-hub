import type {
	IExecuteFunctions,
	INode,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';
import { NodeConnectionTypes, NodeOperationError } from 'n8n-workflow';
import { DEFAULT_TIMEOUT_MS, MIN_TIMEOUT_MS, MAX_TIMEOUT_MS } from './shared/fallback';
import type { IResourceDefinition, ExecuteFunction } from './types';
import { banksResource } from './resources/banks';
import { cambioResource } from './resources/cambio';
import { cepResource } from './resources/cep';
import { cnpjResource } from './resources/cnpj';
import { cpfResource } from './resources/cpf';
import { dddResource } from './resources/ddd';
import { fakeResource } from './resources/fake';
import { feriadosResource } from './resources/feriados';
import { fipeResource } from './resources/fipe';
import { ibgeResource } from './resources/ibge';
import { ncmResource } from './resources/ncm';
import { pixResource } from './resources/pix';
import { taxasResource } from './resources/taxas';

/** All registered resource modules, in alphabetical order. */
const allResources: IResourceDefinition[] = [
	banksResource,
	cambioResource,
	cepResource,
	cnpjResource,
	cpfResource,
	dddResource,
	fakeResource,
	feriadosResource,
	fipeResource,
	ibgeResource,
	ncmResource,
	pixResource,
	taxasResource,
];

/** Builds an error output item for continueOnFail mode. */
function buildFailItem(node: INode, error: unknown, itemIndex: number): INodeExecutionData {
	const message = error instanceof Error ? error.message : String(error);
	const nodeError = error instanceof NodeOperationError
		? error
		: new NodeOperationError(node, message, { itemIndex });
	return {
		json: { error: message },
		error: nodeError,
		pairedItem: { item: itemIndex },
	};
}

/** Re-throws an error with itemIndex attached to its context. */
function rethrowWithContext(node: INode, error: unknown, itemIndex: number): never {
	if (error != null && typeof error === 'object' && 'context' in error) {
		(error as { context: Record<string, unknown> }).context.itemIndex = itemIndex;
		throw error;
	}
	const message = error instanceof Error ? error.message : String(error);
	throw new NodeOperationError(node, message, { itemIndex });
}

/**
 * Dictionary map routing resource+operation pairs to their execute handlers.
 * Built automatically from the barrel-exported resource modules.
 * Adding a new resource only requires a new barrel file + entry in allResources.
 */
const resourceOperations: Record<string, Record<string, ExecuteFunction>> =
	Object.fromEntries(allResources.map(r => [r.resource, r.operations]));

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
		description: 'Query Brazilian public data (CNPJ, CEP, CPF, Banks, Câmbio, DDD, Holidays, FIPE, IBGE, NCM, PIX, Taxas) with multi-provider fallback',
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
					{ name: 'Câmbio', value: 'cambio', description: 'Query exchange rates and currencies from the Central Bank' },
					{ name: 'CEP', value: 'cep', description: 'Query or validate Brazilian postal codes' },
					{ name: 'CNPJ', value: 'cnpj', description: 'Query or validate Brazilian company tax IDs' },
					{ name: 'CPF', value: 'cpf', description: 'Validate Brazilian individual tax IDs' },
					{ name: 'DDD', value: 'ddd', description: 'Query Brazilian area codes and their cities' },
					{ name: 'Fake', value: 'fake', description: 'Generate fake Brazilian data for testing (Person, Company, CPF, CNPJ)' },
					{ name: 'FIPE', value: 'fipe', description: 'Query vehicle prices from the FIPE table' },
					{ name: 'Holiday', value: 'feriados', description: 'Query Brazilian public holidays by year' },
					{ name: 'IBGE', value: 'ibge', description: 'Query Brazilian states and municipalities' },
					{ name: 'NCM', value: 'ncm', description: 'Query tax classification codes by code or description' },
					{ name: 'PIX', value: 'pix', description: 'Query PIX participants from the Central Bank directory' },
					{ name: 'Taxa', value: 'taxas', description: 'Query Brazilian interest rates and indices (Selic, CDI, IPCA)' },
				],
				default: 'cnpj',
			},
			...allResources.flatMap(r => r.description),
			{
				displayName: 'Timeout (Ms)',
				name: 'timeout',
				type: 'number',
				noDataExpression: true,
				default: DEFAULT_TIMEOUT_MS,
				typeOptions: {
					minValue: MIN_TIMEOUT_MS,
					maxValue: MAX_TIMEOUT_MS,
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

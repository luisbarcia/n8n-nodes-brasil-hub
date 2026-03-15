import type {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';
import { NodeConnectionTypes, NodeOperationError } from 'n8n-workflow';
import { cnpjDescription } from './resources/cnpj/cnpj.description';
import { cnpjQuery, cnpjValidate } from './resources/cnpj/cnpj.execute';
import { cepDescription } from './resources/cep/cep.description';
import { cepQuery, cepValidate } from './resources/cep/cep.execute';

/** Signature for resource/operation execute handlers (returns array to support multi-item resources). */
type ExecuteFunction = (
	context: IExecuteFunctions,
	itemIndex: number,
) => Promise<INodeExecutionData[]>;

/**
 * Dictionary map routing resource+operation pairs to their execute handlers.
 * Adding a new resource or operation only requires a new entry here.
 */
const resourceOperations: Record<string, Record<string, ExecuteFunction>> = {
	cnpj: { query: cnpjQuery, validate: cnpjValidate },
	cep: { query: cepQuery, validate: cepValidate },
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
		description: 'Query Brazilian public data (CNPJ, CEP) with multi-provider fallback',
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
					{ name: 'CNPJ', value: 'cnpj', description: 'Query or validate Brazilian company tax IDs' },
					{ name: 'CEP', value: 'cep', description: 'Query or validate Brazilian postal codes' },
				],
				default: 'cnpj',
			},
			...cnpjDescription,
			...cepDescription,
		],
	};

	/**
	 * Dispatches each input item to the handler matching its resource + operation pair.
	 *
	 * Supports `continueOnFail` — failed items return `{ error }` with `pairedItem` intact.
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
					const nodeError = error instanceof NodeOperationError
						? error
						: new NodeOperationError(this.getNode(), error as Error, { itemIndex: i });
					returnData.push({
						json: { error: (error as Error).message },
						error: nodeError,
						pairedItem: { item: i },
					});
					continue;
				}
				if ((error as Record<string, unknown>).context) {
					(error as Record<string, unknown> & { context: Record<string, unknown> }).context.itemIndex = i;
					throw error;
				}
				throw new NodeOperationError(this.getNode(), error as Error, { itemIndex: i });
			}
		}

		return [returnData];
	}
}

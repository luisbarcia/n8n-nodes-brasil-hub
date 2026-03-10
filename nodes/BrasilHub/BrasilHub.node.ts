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

type ExecuteFunction = (
	context: IExecuteFunctions,
	itemIndex: number,
) => Promise<INodeExecutionData>;

const resourceOperations: Record<string, Record<string, ExecuteFunction>> = {
	cnpj: { query: cnpjQuery, validate: cnpjValidate },
	cep: { query: cepQuery, validate: cepValidate },
};

export class BrasilHub implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Brasil Hub',
		name: 'brasilHub',
		icon: 'file:brasilHub.svg',
		group: ['transform'],
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
					{ name: 'CNPJ', value: 'cnpj' },
					{ name: 'CEP', value: 'cep' },
				],
				default: 'cnpj',
			},
			...cnpjDescription,
			...cepDescription,
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		for (let i = 0; i < items.length; i++) {
			try {
				const resource = this.getNodeParameter('resource', i) as string;
				const operation = this.getNodeParameter('operation', i) as string;

				const handler = resourceOperations[resource]?.[operation];
				if (!handler) {
					throw new NodeOperationError(
						this.getNode(),
						`Unknown resource/operation: ${resource}/${operation}`,
						{ itemIndex: i },
					);
				}

				const result = await handler(this, i);
				returnData.push(result);
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

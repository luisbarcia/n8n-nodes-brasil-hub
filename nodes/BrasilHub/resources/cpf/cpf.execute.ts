import type { IExecuteFunctions, INodeExecutionData, IDataObject } from 'n8n-workflow';
import { validateCpf } from '../../shared/validators';

/**
 * Validates a CPF number locally using the Receita Federal checksum algorithm.
 *
 * No API call is made. Returns `{valid, formatted, input}` as n8n execution data.
 *
 * @param context - n8n execution context.
 * @param itemIndex - Current item index for parameter retrieval and item pairing.
 * @returns Array of n8n execution data with validation result as JSON.
 */
export async function cpfValidate(
	context: IExecuteFunctions,
	itemIndex: number,
): Promise<INodeExecutionData[]> {
	const cpfInput = context.getNodeParameter('cpf', itemIndex) as string;
	const result = validateCpf(cpfInput);

	return [{
		json: result as unknown as IDataObject,
		pairedItem: { item: itemIndex },
	}];
}

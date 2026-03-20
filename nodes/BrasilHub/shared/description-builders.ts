import type { INodeProperties } from 'n8n-workflow';

/**
 * Builds the standard "Include Raw Response" toggle for a resource.
 *
 * @param resource - Resource key (e.g., 'cnpj', 'cep').
 * @param operations - Optional operation filter. If omitted, shows for all operations.
 * @returns INodeProperties for the includeRaw boolean field.
 */
export function includeRawField(resource: string, operations?: string[]): INodeProperties {
	const show: Record<string, string[]> = operations
		? { resource: [resource], operation: operations }
		: { resource: [resource] };
	return {
		displayName: 'Include Raw Response',
		name: 'includeRaw',
		type: 'boolean',
		displayOptions: { show },
		default: false,
		description: 'Whether to include the raw API response alongside the normalized data',
	};
}

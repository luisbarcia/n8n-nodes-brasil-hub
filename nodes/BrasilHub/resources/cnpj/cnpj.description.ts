import type { INodeProperties } from 'n8n-workflow';

const showForCnpj = { resource: ['cnpj'] };
const showForCnpjQuery = { resource: ['cnpj'], operation: ['query'] };

/**
 * n8n node property definitions for the CNPJ resource.
 *
 * Defines the Operation selector (Query / Validate), the CNPJ input field,
 * and the "Include Raw Response" toggle for the query operation.
 */
export const cnpjDescription: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: showForCnpj },
		options: [
			{
				name: 'Query',
				value: 'query',
				action: 'Query company data by CNPJ',
				description: 'Fetch company data from public APIs by CNPJ number',
			},
			{
				name: 'Validate',
				value: 'validate',
				action: 'Validate a CNPJ number',
				description: 'Check if a CNPJ number is valid using checksum verification',
			},
		],
		default: 'query',
	},
	{
		displayName: 'CNPJ',
		name: 'cnpj',
		type: 'string',
		required: true,
		displayOptions: { show: showForCnpj },
		default: '',
		placeholder: 'e.g. 11.222.333/0001-81',
		description: 'The CNPJ number to query or validate (with or without formatting)',
	},
	{
		displayName: 'Simplify',
		name: 'simplify',
		type: 'boolean',
		displayOptions: { show: showForCnpjQuery },
		default: true,
		description: 'Whether to return a simplified response with only the most important fields',
	},
	{
		displayName: 'Include Raw Response',
		name: 'includeRaw',
		type: 'boolean',
		displayOptions: { show: showForCnpjQuery },
		default: false,
		description: 'Whether to include the raw API response alongside the normalized data',
	},
];

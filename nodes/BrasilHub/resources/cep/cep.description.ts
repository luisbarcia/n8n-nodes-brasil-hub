import type { INodeProperties } from 'n8n-workflow';

const showForCep = { resource: ['cep'] };
const showForCepQuery = { resource: ['cep'], operation: ['query'] };

/**
 * n8n node property definitions for the CEP resource.
 *
 * Defines the Operation selector (Query / Validate), the CEP input field,
 * and the "Include Raw Response" toggle for the query operation.
 */
export const cepDescription: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: showForCep },
		options: [
			{
				name: 'Query',
				value: 'query',
				action: 'Query address by CEP',
				description: 'Fetch address data from public APIs by CEP number',
			},
			{
				name: 'Validate',
				value: 'validate',
				action: 'Validate a CEP number',
				description: 'Check if a CEP number has valid format',
			},
		],
		default: 'query',
	},
	{
		displayName: 'CEP',
		name: 'cep',
		type: 'string',
		required: true,
		displayOptions: { show: showForCep },
		default: '',
		placeholder: 'e.g. 01001-000',
		description: 'The CEP number to query or validate (with or without formatting)',
	},
	{
		displayName: 'Include Raw Response',
		name: 'includeRaw',
		type: 'boolean',
		displayOptions: { show: showForCepQuery },
		default: false,
		description: 'Whether to include the raw API response alongside the normalized data',
	},
];

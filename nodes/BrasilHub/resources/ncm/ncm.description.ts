import type { INodeProperties } from 'n8n-workflow';

const showForNcm = { resource: ['ncm'] };
const showForNcmQuery = { resource: ['ncm'], operation: ['query'] };
const showForNcmSearch = { resource: ['ncm'], operation: ['search'] };

/**
 * n8n node property definitions for the NCM resource.
 *
 * Defines the Operation selector (Query / Search), the NCM code and
 * search term input fields, and the "Include Raw Response" toggle.
 */
export const ncmDescription: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: showForNcm },
		options: [
			{
				name: 'Query',
				value: 'query',
				action: 'Query NCM by code',
				description: 'Fetch tax classification details by NCM code',
			},
			{
				name: 'Search',
				value: 'search',
				action: 'Search NCM by description',
				description: 'Search tax classification codes by description keyword',
			},
		],
		default: 'query',
	},
	{
		displayName: 'NCM Code',
		name: 'ncmCode',
		type: 'string',
		required: true,
		displayOptions: { show: showForNcmQuery },
		default: '',
		placeholder: 'e.g. 8504.40.10',
		description: 'The NCM code to query (with or without dots)',
	},
	{
		displayName: 'Search Term',
		name: 'searchTerm',
		type: 'string',
		required: true,
		displayOptions: { show: showForNcmSearch },
		default: '',
		placeholder: 'e.g. computador',
		description: 'The keyword to search for in NCM descriptions (minimum 3 characters)',
	},
	{
		displayName: 'Include Raw Response',
		name: 'includeRaw',
		type: 'boolean',
		displayOptions: { show: showForNcm },
		default: false,
		description: 'Whether to include the raw API response alongside the normalized data',
	},
];

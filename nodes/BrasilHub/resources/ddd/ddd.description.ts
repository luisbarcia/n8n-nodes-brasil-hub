import type { INodeProperties } from 'n8n-workflow';

const showForDdd = { resource: ['ddd'] };

/**
 * n8n node property definitions for the DDD resource.
 *
 * Defines the Operation selector (Query only) and the DDD input field.
 * Single provider (BrasilAPI), no fallback.
 */
export const dddDescription: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: showForDdd },
		options: [
			{
				name: 'Query',
				value: 'query',
				action: 'Query cities by area code',
				description: 'Fetch state and cities for a Brazilian area code (DDD)',
			},
		],
		default: 'query',
	},
	{
		displayName: 'DDD',
		name: 'ddd',
		type: 'string',
		required: true,
		displayOptions: { show: showForDdd },
		default: '',
		placeholder: 'e.g. 11, 21, 51',
		description: 'The 2-digit area code (DDD) to query (range 11–99)',
	},
	{
		displayName: 'Primary Provider',
		name: 'primaryProvider',
		type: 'options',
		displayOptions: { show: showForDdd },
		options: [
			{ name: 'Auto (BrasilAPI First)', value: 'auto' },
			{ name: 'BrasilAPI', value: 'brasilapi' },
			{ name: 'Municipios-BR', value: 'municipios' },
		],
		default: 'auto',
		description: 'Choose which provider to try first for DDD queries',
	},
	{
		displayName: 'Include Raw Response',
		name: 'includeRaw',
		type: 'boolean',
		displayOptions: { show: showForDdd },
		default: false,
		description: 'Whether to include the raw API response alongside the normalized data',
	},
];

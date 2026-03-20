import type { INodeProperties } from 'n8n-workflow';

const showForPix = { resource: ['pix'] };
const showForPixQuery = { resource: ['pix'], operation: ['query'] };

/**
 * n8n node property definitions for the PIX resource.
 *
 * Defines 2 operations (List, Query) for querying PIX participants
 * from the Brazilian Central Bank directory.
 */
export const pixDescription: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: showForPix },
		options: [
			{
				name: 'List',
				value: 'list',
				action: 'List all PIX participants',
				description: 'List all institutions participating in PIX',
			},
			{
				name: 'Query',
				value: 'query',
				action: 'Query PIX participant by ISPB',
				description: 'Look up a specific PIX participant by ISPB code',
			},
		],
		default: 'list',
	},
	{
		displayName: 'ISPB Code',
		name: 'ispb',
		type: 'string',
		required: true,
		displayOptions: { show: showForPixQuery },
		default: '',
		placeholder: 'e.g. 00000000',
		description: 'The 8-digit ISPB code of the institution',
	},
	{
		displayName: 'Include Raw Response',
		name: 'includeRaw',
		type: 'boolean',
		displayOptions: { show: showForPix },
		default: false,
		description: 'Whether to include the raw API response alongside the normalized data',
	},
];

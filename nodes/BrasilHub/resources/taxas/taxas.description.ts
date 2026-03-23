import type { INodeProperties } from 'n8n-workflow';
import { includeRawField } from '../../shared/description-builders';

const showForTaxas = { resource: ['taxas'] };
const showForTaxasQuery = { resource: ['taxas'], operation: ['query'] };

/**
 * n8n node property definitions for the Taxas (interest rates) resource.
 *
 * Defines 2 operations (List, Query) for querying Brazilian interest rates
 * (Selic, CDI, IPCA, etc.) from BrasilAPI. Single provider, no fallback.
 */
export const taxasDescription: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: showForTaxas },
		options: [
			{
				name: 'List',
				value: 'list',
				action: 'List all available rates',
				description: 'List all available Brazilian interest rates',
			},
			{
				name: 'Query',
				value: 'query',
				action: 'Query rate by code',
				description: 'Query a specific interest rate by its code',
			},
		],
		default: 'list',
	},
	{
		displayName: 'Rate Code',
		name: 'rateCode',
		type: 'string',
		required: true,
		displayOptions: { show: showForTaxasQuery },
		default: '',
		placeholder: 'e.g. Selic',
		description: 'The rate code to query (e.g. Selic, CDI, IPCA)',
	},
	includeRawField('taxas'),
];

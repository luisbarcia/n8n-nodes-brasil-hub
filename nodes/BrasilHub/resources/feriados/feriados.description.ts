import type { INodeProperties } from 'n8n-workflow';

const showForFeriados = { resource: ['feriados'] };

/**
 * n8n node property definitions for the Feriados resource.
 *
 * Defines the Operation selector (Query only) and the year input field.
 * Providers: BrasilAPI → Nager.Date fallback.
 */
export const feriadosDescription: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: showForFeriados },
		options: [
			{
				name: 'Query',
				value: 'query',
				action: 'Query holidays by year',
				description: 'Fetch all Brazilian public holidays for a given year',
			},
		],
		default: 'query',
	},
	{
		displayName: 'Year',
		name: 'year',
		type: 'number',
		required: true,
		displayOptions: { show: showForFeriados },
		default: 2026,
		placeholder: 'e.g. 2026',
		description: 'The year to query holidays for (range 1900–2199)',
		typeOptions: {
			minValue: 1900,
			maxValue: 2199,
		},
	},
	{
		displayName: 'Include Raw Response',
		name: 'includeRaw',
		type: 'boolean',
		displayOptions: { show: showForFeriados },
		default: false,
		description: 'Whether to include the raw API response alongside the normalized data',
	},
];

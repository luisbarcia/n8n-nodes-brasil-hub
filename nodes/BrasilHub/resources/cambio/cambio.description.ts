import type { INodeProperties } from 'n8n-workflow';
import { includeRawField } from '../../shared/description-builders';

const showForCambio = { resource: ['cambio'] };

/**
 * n8n node property definitions for the Câmbio (exchange rates) resource.
 *
 * Defines the Operation selector (List Currencies, Query Rate) and input fields
 * for currency code and date. Single provider: BrasilAPI (BCB data).
 */
export const cambioDescription: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: showForCambio },
		options: [
			{
				name: 'List Currencies',
				value: 'currencies',
				action: 'List available currencies',
				description: 'Fetch all available currencies from the Central Bank',
			},
			{
				name: 'Query Rate',
				value: 'rate',
				action: 'Query exchange rate by currency and date',
				description: 'Fetch exchange rate quotations for a specific currency and date',
			},
		],
		default: 'currencies',
	},
	{
		displayName: 'Currency Code',
		name: 'currencyCode',
		type: 'string',
		required: true,
		displayOptions: {
			show: {
				...showForCambio,
				operation: ['rate'],
			},
		},
		default: '',
		placeholder: 'e.g. USD',
		description: 'ISO currency code to query (3 letters, e.g. USD, EUR, GBP)',
	},
	{
		displayName: 'Date',
		name: 'date',
		type: 'string',
		required: true,
		displayOptions: {
			show: {
				...showForCambio,
				operation: ['rate'],
			},
		},
		default: '',
		placeholder: 'e.g. 2024-01-15',
		description: 'Date to query the exchange rate for (ISO format YYYY-MM-DD)',
	},
	includeRawField('cambio'),
];

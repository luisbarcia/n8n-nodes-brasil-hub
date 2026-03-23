import type { INodeProperties } from 'n8n-workflow';
import { includeRawField } from '../../shared/description-builders';

const showForIbge = { resource: ['ibge'] };
const showForIbgeCities = { resource: ['ibge'], operation: ['cities'] };

/**
 * n8n node property definitions for the IBGE resource.
 *
 * Defines the Operation selector (States / Cities), the UF input field
 * (for cities), and the "Include Raw Response" toggle.
 */
export const ibgeDescription: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: showForIbge },
		options: [
			{
				name: 'States',
				value: 'states',
				action: 'List all Brazilian states',
				description: 'Fetch all 27 Brazilian states (UFs) with region info',
			},
			{
				name: 'Cities',
				value: 'cities',
				action: 'List cities by state',
				description: 'Fetch all municipalities for a given state',
			},
		],
		default: 'states',
	},
	{
		displayName: 'State (UF)',
		name: 'uf',
		type: 'string',
		required: true,
		displayOptions: { show: showForIbgeCities },
		default: '',
		placeholder: 'e.g. SP, RJ, MG',
		description: 'The two-letter state abbreviation to query cities for',
	},
	{
		displayName: 'Primary Provider',
		name: 'primaryProvider',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: showForIbge },
		options: [
			{ name: 'Auto (BrasilAPI First)', value: 'auto' },
			{ name: 'BrasilAPI', value: 'brasilapi' },
			{ name: 'IBGE API', value: 'ibge' },
		],
		default: 'auto',
		description: 'Choose which provider to try first for IBGE queries',
	},
	includeRawField('ibge'),
];

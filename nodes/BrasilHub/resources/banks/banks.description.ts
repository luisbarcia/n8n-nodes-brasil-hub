import type { INodeProperties } from 'n8n-workflow';
import { includeRawField } from '../../shared/description-builders';

const showForBanks = { resource: ['banks'] };
const showForBanksQuery = { resource: ['banks'], operation: ['query'] };

/**
 * n8n node property definitions for the Banks resource.
 *
 * Defines the Operation selector (Query / List), the bank code input field,
 * and the "Include Raw Response" toggle.
 */
export const banksDescription: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: showForBanks },
		options: [
			{
				name: 'Query',
				value: 'query',
				action: 'Query bank data by code',
				description: 'Fetch bank information by COMPE code',
			},
			{
				name: 'List',
				value: 'list',
				action: 'List all banks',
				description: 'Fetch all Brazilian banks and financial institutions',
			},
		],
		default: 'query',
	},
	{
		displayName: 'Bank Code',
		name: 'bankCode',
		type: 'string',
		required: true,
		displayOptions: { show: showForBanksQuery },
		default: '',
		placeholder: 'e.g. 1, 237, 341',
		description: 'The COMPE bank code (e.g. 1 for Banco do Brasil, 237 for Bradesco)',
	},
	{
		displayName: 'Primary Provider',
		name: 'primaryProvider',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: showForBanks },
		options: [
			{ name: 'Auto (BrasilAPI First)', value: 'auto' },
			{ name: 'BrasilAPI', value: 'brasilapi' },
			{ name: 'BancosBrasileiros', value: 'bancosbrasileiros' },
		],
		default: 'auto',
		description: 'Choose which provider to try first for bank queries',
	},
	includeRawField('banks'),
];

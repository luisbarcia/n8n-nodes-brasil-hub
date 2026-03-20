import type { INodeProperties } from 'n8n-workflow';
import { includeRawField } from '../../shared/description-builders';

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
		displayName: 'Primary Provider',
		name: 'primaryProvider',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: showForCnpjQuery },
		options: [
			{ name: 'Auto (BrasilAPI First)', value: 'auto' },
			{ name: 'BrasilAPI', value: 'brasilapi' },
			{ name: 'CNPJ.ws', value: 'cnpjws' },
			{ name: 'CNPJA', value: 'cnpja' },
			{ name: 'MinhaReceita', value: 'minhareceita' },
			{ name: 'OpenCNPJ.com', value: 'opencnpjcom' },
			{ name: 'OpenCNPJ.org', value: 'opencnpjorg' },
			{ name: 'ReceitaWS', value: 'receitaws' },
		],
		default: 'auto',
		description: 'Choose which provider to try first for CNPJ queries',
	},
	{
		displayName: 'Simplify',
		name: 'simplify',
		type: 'boolean',
		noDataExpression: true,
		displayOptions: { show: showForCnpjQuery },
		default: true,
		description: 'Whether to return a simplified response with only the most important fields',
	},
	{
		displayName: 'Output Mode',
		name: 'outputMode',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['cnpj'], operation: ['query'], simplify: [false] } },
		options: [
			{
				name: 'Full',
				value: 'full',
				description: 'All normalized fields including address, contacts, and partners',
			},
			{
				name: 'AI Summary',
				value: 'aiSummary',
				description: 'Flat key-value object optimized for AI Agent tool usage',
			},
		],
		default: 'full',
		description: 'Output format when Simplify is disabled',
	},
	includeRawField('cnpj', ['query']),
];

import type { INodeProperties } from 'n8n-workflow';

const showForFake = { resource: ['fake'] };
const showForFakePerson = { resource: ['fake'], operation: ['person'] };
const showForFakeDoc = { resource: ['fake'], operation: ['cpf', 'cnpj'] };

/**
 * n8n node property definitions for the Fake resource.
 *
 * Defines 4 operations (Company, CNPJ, CPF, Person) for generating
 * realistic Brazilian test data locally — no API calls.
 */
export const fakeDescription: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: showForFake },
		options: [
			{
				name: 'CNPJ',
				value: 'cnpj',
				action: 'Generate a valid CNPJ',
				description: 'Generate a valid CNPJ number (checksum-correct)',
			},
			{
				name: 'Company',
				value: 'company',
				action: 'Generate a fake company profile',
				description: 'Generate a complete fake Brazilian company profile',
			},
			{
				name: 'CPF',
				value: 'cpf',
				action: 'Generate a valid CPF',
				description: 'Generate a valid CPF number (checksum-correct)',
			},
			{
				name: 'Person',
				value: 'person',
				action: 'Generate a fake person profile',
				description: 'Generate a complete fake Brazilian person profile',
			},
		],
		default: 'person',
	},
	{
		displayName: 'Gender',
		name: 'gender',
		type: 'options',
		displayOptions: { show: showForFakePerson },
		options: [
			{ name: 'Any', value: 'any' },
			{ name: 'Female', value: 'F' },
			{ name: 'Male', value: 'M' },
		],
		default: 'any',
		description: 'Gender for name generation',
	},
	{
		displayName: 'Quantity',
		name: 'quantity',
		type: 'number',
		displayOptions: { show: showForFake },
		default: 1,
		typeOptions: {
			minValue: 1,
			maxValue: 100,
		},
		description: 'Number of items to generate (1-100)',
	},
	{
		displayName: 'Formatted',
		name: 'formatted',
		type: 'boolean',
		displayOptions: { show: showForFakeDoc },
		default: true,
		description: 'Whether to format with dots, dashes, and slashes (e.g. 123.456.789-09)',
	},
];

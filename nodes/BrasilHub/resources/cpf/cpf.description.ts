import type { INodeProperties } from 'n8n-workflow';

const showForCpf = { resource: ['cpf'] };

/**
 * n8n node property definitions for the CPF resource.
 *
 * Defines the Operation selector (Validate only) and the CPF input field.
 * CPF validation is 100% local (checksum) — no API call is made.
 */
export const cpfDescription: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: showForCpf },
		options: [
			{
				name: 'Validate',
				value: 'validate',
				action: 'Validate a CPF number',
				description: 'Check if a CPF number is valid using checksum verification',
			},
		],
		default: 'validate',
	},
	{
		displayName: 'CPF',
		name: 'cpf',
		type: 'string',
		required: true,
		displayOptions: { show: showForCpf },
		default: '',
		placeholder: 'e.g. 529.982.247-25',
		description: 'The CPF number to validate (with or without formatting)',
	},
];

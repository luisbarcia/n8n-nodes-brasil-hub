import type { INodeProperties } from 'n8n-workflow';

const showForFipe = { resource: ['fipe'] };
const showForFipeWithBrand = { resource: ['fipe'], operation: ['models', 'years', 'price'] };
const showForFipeWithModel = { resource: ['fipe'], operation: ['years', 'price'] };
const showForFipeWithYear = { resource: ['fipe'], operation: ['price'] };

/**
 * n8n node property definitions for the FIPE resource.
 *
 * Defines 4 operations (Brands, Models, Years, Price) with hierarchical
 * conditional parameters — each level adds a param that depends on the previous.
 */
export const fipeDescription: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: showForFipe },
		options: [
			{
				name: 'Brands',
				value: 'brands',
				action: 'List vehicle brands',
				description: 'List all vehicle brands for a given type',
			},
			{
				name: 'Models',
				value: 'models',
				action: 'List models for a brand',
				description: 'List all models for a given brand',
			},
			{
				name: 'Years',
				value: 'years',
				action: 'List years for a model',
				description: 'List available years for a given model',
			},
			{
				name: 'Price',
				value: 'price',
				action: 'Get vehicle price',
				description: 'Get the FIPE table price for a specific vehicle',
			},
		],
		default: 'brands',
	},
	{
		displayName: 'Vehicle Type',
		name: 'vehicleType',
		type: 'options',
		required: true,
		displayOptions: { show: showForFipe },
		options: [
			{ name: 'Cars', value: 'carros' },
			{ name: 'Motorcycles', value: 'motos' },
			{ name: 'Trucks', value: 'caminhoes' },
		],
		default: 'carros',
		description: 'The type of vehicle to query',
	},
	{
		displayName: 'Brand Code',
		name: 'brandCode',
		type: 'string',
		required: true,
		displayOptions: { show: showForFipeWithBrand },
		default: '',
		placeholder: 'e.g. 59',
		description: 'The brand code from the Brands operation',
	},
	{
		displayName: 'Model Code',
		name: 'modelCode',
		type: 'string',
		required: true,
		displayOptions: { show: showForFipeWithModel },
		default: '',
		placeholder: 'e.g. 4828',
		description: 'The model code from the Models operation',
	},
	{
		displayName: 'Year Code',
		name: 'yearCode',
		type: 'string',
		required: true,
		displayOptions: { show: showForFipeWithYear },
		default: '',
		placeholder: 'e.g. 2024-1',
		description: 'The year-fuel code from the Years operation',
	},
	{
		displayName: 'Reference Table',
		name: 'referenceTable',
		type: 'number',
		displayOptions: { show: showForFipe },
		default: 0,
		description: 'The FIPE reference table number (0 = latest)',
	},
	{
		displayName: 'Include Raw Response',
		name: 'includeRaw',
		type: 'boolean',
		displayOptions: { show: showForFipe },
		default: false,
		description: 'Whether to include the raw API response alongside the normalized data',
	},
];

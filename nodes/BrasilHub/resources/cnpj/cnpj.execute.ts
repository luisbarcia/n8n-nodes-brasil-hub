import type { IExecuteFunctions, INodeExecutionData, IDataObject } from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';
import type { IProvider, IMeta } from '../../types';
import { validateCnpj, sanitizeCnpj } from '../../shared/validators';
import { queryWithFallback } from '../../shared/fallback';
import { normalizeCnpj } from './cnpj.normalize';

const CNPJ_PROVIDERS: IProvider[] = [
	{ name: 'brasilapi', url: 'https://brasilapi.com.br/api/cnpj/v1/' },
	{ name: 'cnpjws', url: 'https://publica.cnpj.ws/cnpj/' },
	{ name: 'receitaws', url: 'https://receitaws.com.br/v1/cnpj/' },
];

function buildProviders(cnpj: string): IProvider[] {
	return CNPJ_PROVIDERS.map((p) => ({ name: p.name, url: `${p.url}${cnpj}` }));
}

export async function cnpjQuery(
	context: IExecuteFunctions,
	itemIndex: number,
): Promise<INodeExecutionData> {
	const cnpjInput = context.getNodeParameter('cnpj', itemIndex) as string;
	const includeRaw = context.getNodeParameter('includeRaw', itemIndex, false) as boolean;
	const cnpj = sanitizeCnpj(cnpjInput);

	if (cnpj.length !== 14) {
		throw new NodeOperationError(context.getNode(), 'CNPJ must have 14 digits', { itemIndex });
	}

	const providers = buildProviders(cnpj);
	const result = await queryWithFallback(context, providers, itemIndex);

	const normalized = normalizeCnpj(result.data, result.provider);

	const meta: IMeta = {
		provider: result.provider,
		query: cnpj,
		queried_at: new Date().toISOString(),
		strategy: 'fallback',
		...(result.errors.length > 0 && { errors: result.errors }),
	};

	return {
		json: {
			...normalized,
			_meta: meta,
			...(includeRaw && { _raw: result.data as IDataObject }),
		} as IDataObject,
		pairedItem: { item: itemIndex },
	};
}

export async function cnpjValidate(
	context: IExecuteFunctions,
	itemIndex: number,
): Promise<INodeExecutionData> {
	const cnpjInput = context.getNodeParameter('cnpj', itemIndex) as string;
	const result = validateCnpj(cnpjInput);

	return {
		json: result as unknown as IDataObject,
		pairedItem: { item: itemIndex },
	};
}

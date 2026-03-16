import type { IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';
import type { IProvider } from '../../types';
import { buildMeta, buildResultItem, buildResultItems } from '../../shared/utils';
import { queryWithFallback } from '../../shared/fallback';
import { normalizeBank, normalizeBanks } from './banks.normalize';

const BANKS_LIST_PROVIDERS: IProvider[] = [
	{ name: 'brasilapi', url: 'https://brasilapi.com.br/api/banks/v1' },
	{ name: 'bancosbrasileiros', url: 'https://raw.githubusercontent.com/guibranco/BancosBrasileiros/main/data/bancos.json' },
];

/**
 * Builds provider list for a single bank query.
 *
 * BrasilAPI queries by code directly. BancosBrasileiros returns all banks
 * (the normalizer filters by code).
 */
function buildQueryProviders(bankCode: number): IProvider[] {
	return [
		{ name: 'brasilapi', url: `https://brasilapi.com.br/api/banks/v1/${bankCode}` },
		{ name: 'bancosbrasileiros', url: 'https://raw.githubusercontent.com/guibranco/BancosBrasileiros/main/data/bancos.json' },
	];
}

/**
 * Queries a single bank by COMPE code with multi-provider fallback.
 *
 * @param context - n8n execution context.
 * @param itemIndex - Current item index for parameter retrieval and item pairing.
 * @returns Array of n8n execution data with normalized bank result.
 * @throws {NodeOperationError} If the bank code is invalid or all providers fail.
 */
export async function banksQuery(
	context: IExecuteFunctions,
	itemIndex: number,
): Promise<INodeExecutionData[]> {
	const bankCodeInput = context.getNodeParameter('bankCode', itemIndex) as string;
	const includeRaw = context.getNodeParameter('includeRaw', itemIndex, false) as boolean;
	const bankCode = Number.parseInt(bankCodeInput, 10);

	if (!Number.isInteger(bankCode) || bankCode <= 0) {
		throw new NodeOperationError(
			context.getNode(),
			'Invalid bank code: must be a positive number',
			{ itemIndex },
		);
	}

	const providers = buildQueryProviders(bankCode);
	const result = await queryWithFallback(context, providers);

	const normalized = normalizeBank(result.data, result.provider, bankCode);

	const meta = buildMeta(result.provider, String(bankCode), result.errors);

	return buildResultItem(normalized as unknown as Record<string, unknown>, meta, result.data, includeRaw, itemIndex) as INodeExecutionData[];
}

/**
 * Lists all Brazilian banks with multi-provider fallback.
 *
 * Returns one n8n item per bank. Each item includes normalized data and metadata.
 *
 * @param context - n8n execution context.
 * @param itemIndex - Current item index for parameter retrieval and item pairing.
 * @returns Array of n8n execution data (one per bank).
 * @throws {NodeOperationError} If all providers fail.
 */
export async function banksList(
	context: IExecuteFunctions,
	itemIndex: number,
): Promise<INodeExecutionData[]> {
	const includeRaw = context.getNodeParameter('includeRaw', itemIndex, false) as boolean;

	const result = await queryWithFallback(context, BANKS_LIST_PROVIDERS);

	const rawItems = result.data as Array<Record<string, unknown>>;
	const banks = normalizeBanks(result.data, result.provider);

	const meta = buildMeta(result.provider, 'all', result.errors);

	return buildResultItems(banks as unknown as Array<Record<string, unknown>>, meta, rawItems, includeRaw, itemIndex) as INodeExecutionData[];
}

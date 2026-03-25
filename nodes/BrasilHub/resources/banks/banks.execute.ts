import type { IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';
import type { IProvider } from '../../types';
import { executeStandardQuery, executeStandardList } from '../../shared/execute-helpers';
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
 * Validates code, then delegates to {@link executeStandardQuery} facade.
 *
 * @param context - n8n execution context.
 * @param itemIndex - Current item index for parameter retrieval and item pairing.
 * @returns Array of n8n execution data with normalized bank result.
 * @throws If the bank code is invalid or all providers fail.
 */
export async function banksQuery(
	context: IExecuteFunctions,
	itemIndex: number,
): Promise<INodeExecutionData[]> {
	const bankCodeInput = context.getNodeParameter('bankCode', itemIndex) as string;
	const bankCode = Number.parseInt(bankCodeInput, 10);

	if (!Number.isInteger(bankCode) || bankCode <= 0) {
		throw new NodeOperationError(
			context.getNode(),
			'Invalid bank code: must be a positive number',
			{ itemIndex },
		);
	}

	return executeStandardQuery(context, itemIndex, {
		buildProviders: () => buildQueryProviders(bankCode),
		normalize: (data, provider) => normalizeBank(data, provider, bankCode),
		queryKey: String(bankCode),
	});
}

/**
 * Lists all Brazilian banks with multi-provider fallback.
 *
 * Delegates to {@link executeStandardList} facade. Returns one n8n item per bank.
 *
 * @param context - n8n execution context.
 * @param itemIndex - Current item index for parameter retrieval and item pairing.
 * @returns Array of n8n execution data (one per bank).
 * @throws If all providers fail.
 */
export async function banksList(
	context: IExecuteFunctions,
	itemIndex: number,
): Promise<INodeExecutionData[]> {
	return executeStandardList(context, itemIndex, {
		buildProviders: () => BANKS_LIST_PROVIDERS,
		normalize: normalizeBanks,
		queryKey: 'all',
	});
}

import type { IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';
import { buildMeta, buildResultItem, buildResultItems } from '../../shared/utils';
import { queryWithFallback, DEFAULT_TIMEOUT_MS } from '../../shared/fallback';
import type { IProvider } from '../../types';
import { normalizePixParticipants } from './pix.normalize';

const ISPB_PATTERN = /^\d{8}$/;

function buildProviders(): IProvider[] {
	return [
		{ name: 'brasilapi', url: 'https://brasilapi.com.br/api/pix/v1/participants' },
	];
}

/**
 * Lists all PIX participants.
 *
 * @param context - n8n execution context.
 * @param itemIndex - Current item index.
 * @returns One n8n item per PIX participant.
 */
export async function pixList(
	context: IExecuteFunctions,
	itemIndex: number,
): Promise<INodeExecutionData[]> {
	const includeRaw = context.getNodeParameter('includeRaw', itemIndex, false) as boolean;
	const timeoutMs = context.getNodeParameter('timeout', itemIndex, DEFAULT_TIMEOUT_MS) as number;

	const providers = buildProviders();
	const result = await queryWithFallback(context, providers, timeoutMs);

	const participants = normalizePixParticipants(result.data);
	const rawItems = Array.isArray(result.data) ? result.data as Array<Record<string, unknown>> : [];
	const meta = buildMeta(result.provider, 'pix/participants', result.errors, result.rateLimited, result.retryAfterMs);

	return buildResultItems(participants, meta, rawItems, includeRaw, itemIndex);
}

/**
 * Queries a single PIX participant by ISPB code.
 *
 * Fetches the full list and filters client-side since BrasilAPI
 * does not offer a single-participant endpoint.
 *
 * @param context - n8n execution context.
 * @param itemIndex - Current item index.
 * @returns Single n8n item with the matching participant.
 * @throws {NodeOperationError} If ISPB is invalid or not found.
 */
export async function pixQuery(
	context: IExecuteFunctions,
	itemIndex: number,
): Promise<INodeExecutionData[]> {
	const ispb = (context.getNodeParameter('ispb', itemIndex) as string).replace(/\D/g, '');
	const includeRaw = context.getNodeParameter('includeRaw', itemIndex, false) as boolean;
	const timeoutMs = context.getNodeParameter('timeout', itemIndex, DEFAULT_TIMEOUT_MS) as number;

	if (!ISPB_PATTERN.test(ispb)) {
		throw new NodeOperationError(
			context.getNode(),
			`Invalid ISPB code: "${ispb}". Must be exactly 8 digits`,
			{ itemIndex },
		);
	}

	const providers = buildProviders();
	const result = await queryWithFallback(context, providers, timeoutMs);

	const all = normalizePixParticipants(result.data);
	const match = all.find((p) => p.ispb === ispb);

	if (!match) {
		throw new NodeOperationError(
			context.getNode(),
			`PIX participant not found for ISPB: ${ispb}`,
			{ itemIndex },
		);
	}

	const rawAll = Array.isArray(result.data) ? result.data as Array<Record<string, unknown>> : [];
	const rawMatch = rawAll.find((r) => String(r.ispb) === ispb);
	const meta = buildMeta(result.provider, ispb, result.errors, result.rateLimited, result.retryAfterMs);

	return buildResultItem(match, meta, rawMatch, includeRaw, itemIndex);
}

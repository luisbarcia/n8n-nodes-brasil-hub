import type { IDataObject, IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';
import { DEFAULT_TIMEOUT_MS } from './fallback';

/**
 * Coerces an unknown value to a string, returning `''` for null, undefined, or objects.
 *
 * Prevents `[object Object]` stringification when external API responses contain
 * unexpected nested objects where a primitive string was expected.
 *
 * @param value - Any value from an untyped API response.
 * @returns The value as a string, or `''` if null/undefined/object.
 */
export function safeStr(value: unknown): string {
	if (typeof value === 'string') return value;
	if (typeof value === 'number' || typeof value === 'boolean') return value.toString();
	return '';
}

/**
 * Builds the standard `_meta` object attached to every API query response.
 *
 * Centralizes the fallback/direct strategy logic and error collection
 * so that each resource handler doesn't repeat the same 6-line block.
 *
 * @param provider - Name of the provider that returned the data.
 * @param query - Sanitized input used for the query.
 * @param errors - Error messages from providers that failed before the successful one.
 * @returns IMeta object ready to attach to the response.
 */
export function buildMeta(
	provider: string,
	query: string,
	errors: string[],
	rateLimited = false,
	retryAfterMs?: number,
): {
	provider: string;
	query: string;
	queried_at: string;
	strategy: 'fallback' | 'direct';
	errors?: string[];
	rate_limited?: boolean;
	retry_after_ms?: number;
} {
	return {
		provider,
		query,
		queried_at: new Date().toISOString(),
		strategy: errors.length > 0 ? 'fallback' : 'direct',
		...(errors.length > 0 && { errors }),
		...(rateLimited && { rate_limited: true }),
		...(retryAfterMs != null && { retry_after_ms: retryAfterMs }),
	};
}

/**
 * Builds an array of n8n execution data items from normalized results.
 *
 * Centralizes the repeated `.map()` pattern used by multi-item handlers
 * (banksList, fipeBrands, fipeModels, fipeYears, feriadosQuery).
 *
 * @param items - Array of normalized result objects.
 * @param meta - Meta object from buildMeta().
 * @param rawItems - Raw API response items (aligned by index).
 * @param includeRaw - Whether to include _raw in each item.
 * @param itemIndex - n8n input item index for pairedItem.
 * @returns Array of n8n execution data items.
 */
export function buildResultItems<T extends object>(
	items: T[],
	meta: Record<string, unknown>,
	rawItems: Array<Record<string, unknown>>,
	includeRaw: boolean,
	itemIndex: number,
): INodeExecutionData[] {
	return items.map((item, index) => ({
		json: {
			...item,
			_meta: meta,
			...(includeRaw && { _raw: rawItems[index] }),
		} as IDataObject,
		pairedItem: { item: itemIndex },
	}));
}

/**
 * Builds a single n8n execution data item from a normalized result.
 *
 * Centralizes the repeated single-item return pattern used by
 * cnpjQuery, cepQuery, dddQuery, banksQuery, fipePrice.
 *
 * @param normalized - Normalized result object.
 * @param meta - Meta object from buildMeta().
 * @param rawData - Raw API response data.
 * @param includeRaw - Whether to include _raw.
 * @param itemIndex - n8n input item index for pairedItem.
 * @returns Single-element array of n8n execution data.
 */
export function buildResultItem<T extends object>(
	normalized: T,
	meta: Record<string, unknown>,
	rawData: unknown,
	includeRaw: boolean,
	itemIndex: number,
): INodeExecutionData[] {
	return [{
		json: {
			...normalized,
			_meta: meta,
			...(includeRaw && { _raw: rawData }),
		} as IDataObject,
		pairedItem: { item: itemIndex },
	}];
}

/**
 * Removes all non-digit characters from a string.
 *
 * @param value - Raw input (e.g. `"11.222.333/0001-81"`).
 * @returns Digits-only string (e.g. `"11222333000181"`).
 */
export function stripNonDigits(value: string): string {
	if (typeof value !== 'string') return String(value ?? '').replaceAll(/\D/g, '');
	return value.replaceAll(/\D/g, '');
}

/**
 * Reorders a provider array so that the chosen primary provider is first.
 *
 * If `primary` is `'auto'` or not found in the list, returns the original order.
 *
 * @param providers - Original ordered provider list.
 * @param primary - Name of the provider to move to position 0.
 * @returns New array with the primary provider first, rest in original order.
 */
export function reorderProviders<T extends { name: string }>(providers: T[], primary: string): T[] {
	if (!primary || primary === 'auto') return providers;
	const idx = providers.findIndex((p) => p.name === primary);
	if (idx <= 0) return providers;
	return [providers[idx], ...providers.slice(0, idx), ...providers.slice(idx + 1)];
}

/** Common parameters shared by all API-calling handlers. */
export interface ICommonParams {
	includeRaw: boolean;
	timeoutMs: number;
	primaryProvider: string;
}

/**
 * Reads the 3 common node parameters shared by all API-calling handlers.
 * Resources without primaryProvider get 'auto' (no-op in reorderProviders).
 *
 * @param context - n8n execution context.
 * @param itemIndex - Current item index.
 * @returns Common parameters object.
 */
export function readCommonParams(
	context: IExecuteFunctions,
	itemIndex: number,
): ICommonParams {
	return {
		includeRaw: context.getNodeParameter('includeRaw', itemIndex, false) as boolean,
		timeoutMs: context.getNodeParameter('timeout', itemIndex, DEFAULT_TIMEOUT_MS) as number,
		primaryProvider: context.getNodeParameter('primaryProvider', itemIndex, 'auto') as string,
	};
}

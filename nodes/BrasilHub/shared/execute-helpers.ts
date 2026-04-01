import type { IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';
import type { IProvider } from '../types';
import { buildMeta, buildResultItem, buildResultItems, readCommonParams, reorderProviders } from './utils';
import { queryWithFallback } from './fallback';
import type { IFallbackOptions } from './fallback';

/**
 * Facade for single-item API query handlers (Facade + Strategy pattern).
 *
 * Encapsulates the standard 6-step flow shared by most query handlers:
 * readCommonParams → reorderProviders → queryWithFallback → normalize → buildMeta → buildResultItem.
 *
 * @param context - n8n execution context.
 * @param itemIndex - Current item index for parameter retrieval and item pairing.
 * @param config - Handler-specific configuration.
 * @param config.buildProviders - Factory that returns the ordered provider list for this query.
 * @param config.normalize - Strategy that converts raw API data into the normalized type.
 * @param config.queryKey - Sanitized input used for the `_meta.query` field.
 * @param config.postProcess - Optional transform applied after normalization (e.g. CNPJ output modes).
 * @returns Array of n8n execution data with normalized result as JSON.
 */
export async function executeStandardQuery<T extends object>(
	context: IExecuteFunctions,
	itemIndex: number,
	config: {
		buildProviders: () => IProvider[];
		normalize: (data: unknown, provider: string) => T;
		queryKey: string;
		postProcess?: (normalized: T) => Record<string, unknown>;
		fallbackOptions?: IFallbackOptions;
	},
): Promise<INodeExecutionData[]> {
	const { includeRaw, timeoutMs, primaryProvider } = readCommonParams(context, itemIndex);
	const providers = reorderProviders(config.buildProviders(), primaryProvider);
	const result = await queryWithFallback(context, providers, timeoutMs, config.fallbackOptions);
	const normalized = config.normalize(result.data, result.provider);
	const meta = buildMeta(result.provider, config.queryKey, result.errors, result.rateLimited, result.retryAfterMs);
	const output = config.postProcess ? config.postProcess(normalized) : { ...normalized };
	return buildResultItem(output, meta, result.data, includeRaw, itemIndex);
}

/**
 * Facade for multi-item API query handlers (Facade + Strategy pattern).
 *
 * Same flow as {@link executeStandardQuery} but returns multiple items
 * using {@link buildResultItems}.
 *
 * @param context - n8n execution context.
 * @param itemIndex - Current item index for parameter retrieval and item pairing.
 * @param config - Handler-specific configuration.
 * @param config.buildProviders - Factory that returns the ordered provider list for this query.
 * @param config.normalize - Strategy that converts raw API data into an array of normalized items.
 * @param config.queryKey - Sanitized input used for the `_meta.query` field.
 * @returns Array of n8n execution data with one item per normalized result.
 */
export async function executeStandardList<T extends object>(
	context: IExecuteFunctions,
	itemIndex: number,
	config: {
		buildProviders: () => IProvider[];
		normalize: (data: unknown, provider: string) => T[];
		queryKey: string;
		fallbackOptions?: IFallbackOptions;
	},
): Promise<INodeExecutionData[]> {
	const { includeRaw, timeoutMs, primaryProvider } = readCommonParams(context, itemIndex);
	const providers = reorderProviders(config.buildProviders(), primaryProvider);
	const result = await queryWithFallback(context, providers, timeoutMs, config.fallbackOptions);
	const normalized = config.normalize(result.data, result.provider);
	const meta = buildMeta(result.provider, config.queryKey, result.errors, result.rateLimited, result.retryAfterMs);
	const rawItems = Array.isArray(result.data) ? result.data as Array<Record<string, unknown>> : [];
	return buildResultItems(normalized, meta, rawItems, includeRaw, itemIndex);
}

/**
 * Creates a provider-dispatch normalizer function (Strategy pattern).
 *
 * Eliminates the repeated dispatch table + null guard + error handling
 * found in each `*.normalize.ts` file.
 *
 * @param strategies - Map of provider name to normalizer function.
 * @param resourceName - Human-readable resource name for error messages.
 * @returns A normalizer function that dispatches to the correct strategy by provider name.
 */
export function createNormalizerDispatch<T>(
	strategies: Record<string, (data: Record<string, unknown>) => T>,
	resourceName: string,
): (data: unknown, provider: string) => T {
	return (data: unknown, provider: string): T => {
		const strategy = strategies[provider];
		if (!strategy) {
			throw new Error(`Unknown ${resourceName} provider: ${provider}`);
		}
		return strategy((data ?? {}) as Record<string, unknown>);
	};
}

/**
 * Creates a list-dispatch normalizer function (Strategy pattern).
 *
 * Like {@link createNormalizerDispatch} but for list responses. Handles the
 * repeated `Array.isArray` guard and null/object filtering found in list normalizers.
 *
 * @param strategies - Map of provider name to single-item normalizer function.
 * @param resourceName - Human-readable resource name for error messages.
 * @returns A normalizer function that dispatches and maps an array of items.
 */
export function createListNormalizerDispatch<T>(
	strategies: Record<string, (item: Record<string, unknown>) => T>,
	resourceName: string,
): (data: unknown, provider: string) => T[] {
	return (data: unknown, provider: string): T[] => {
		const strategy = strategies[provider];
		if (!strategy) {
			throw new Error(`Unknown ${resourceName} provider: ${provider}`);
		}
		if (!Array.isArray(data)) return [];
		return (data as unknown[])
			.filter((item): item is Record<string, unknown> => item != null && typeof item === 'object')
			.map((item) => strategy(item));
	};
}

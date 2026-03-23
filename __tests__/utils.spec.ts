import { readCommonParams, buildResultItems, buildResultItem } from '../nodes/BrasilHub/shared/utils';
import { includeRawField } from '../nodes/BrasilHub/shared/description-builders';

function createMockContext(overrides: Record<string, unknown> = {}) {
	const params: Record<string, unknown> = {
		includeRaw: false,
		timeout: 10000,
		primaryProvider: 'auto',
		...overrides,
	};
	return {
		getNodeParameter: jest.fn((name: string, _index: number, fallback?: unknown) =>
			params[name] ?? fallback,
		),
	} as unknown as Parameters<typeof readCommonParams>[0];
}

describe('readCommonParams', () => {
	it('should read all 3 common params with defaults', () => {
		const ctx = createMockContext();
		const params = readCommonParams(ctx, 0);
		expect(params.includeRaw).toBe(false);
		expect(params.timeoutMs).toBe(10000);
		expect(params.primaryProvider).toBe('auto');
	});

	it('should read custom values', () => {
		const ctx = createMockContext({
			includeRaw: true,
			timeout: 30000,
			primaryProvider: 'brasilapi',
		});
		const params = readCommonParams(ctx, 0);
		expect(params.includeRaw).toBe(true);
		expect(params.timeoutMs).toBe(30000);
		expect(params.primaryProvider).toBe('brasilapi');
	});

	it('should pass itemIndex to getNodeParameter', () => {
		const ctx = createMockContext();
		readCommonParams(ctx, 5);
		expect(ctx.getNodeParameter).toHaveBeenCalledWith('includeRaw', 5, false);
		expect(ctx.getNodeParameter).toHaveBeenCalledWith('timeout', 5, 10000);
		expect(ctx.getNodeParameter).toHaveBeenCalledWith('primaryProvider', 5, 'auto');
	});
});

describe('buildResultItems', () => {
	const meta = { provider: 'test', query: 'q', queried_at: '2024-01-01', strategy: 'direct' as const };

	it('should build items with correct _meta and pairedItem', () => {
		const items = [{ name: 'A' }, { name: 'B' }];
		const raw = [{ n: 'A' }, { n: 'B' }] as Array<Record<string, unknown>>;
		const result = buildResultItems(items, meta, raw, false, 0);

		expect(result).toHaveLength(2);
		expect(result[0].json.name).toBe('A');
		expect(result[0].json._meta).toEqual(meta);
		expect(result[0].json._raw).toBeUndefined();
		expect(result[0].pairedItem).toEqual({ item: 0 });
	});

	it('should include _raw when includeRaw is true', () => {
		const items = [{ name: 'A' }];
		const raw = [{ n: 'A' }] as Array<Record<string, unknown>>;
		const result = buildResultItems(items, meta, raw, true, 0);

		expect(result[0].json._raw).toEqual({ n: 'A' });
	});

	it('should align _raw correctly when rawItems contains null entries (bug #131)', () => {
		// Normalizer filters nulls: [valid, null, valid] → [norm0, norm1]
		// rawItems still has null: [raw0, null, raw2]
		// Without fix: norm1._raw = rawItems[1] = null ← BUG
		// With fix:    norm1._raw = filtered[1] = raw2 ← CORRECT
		const items = [{ name: 'First' }, { name: 'Third' }];
		const raw = [
			{ original: 'first' },
			null as unknown as Record<string, unknown>,
			{ original: 'third' },
		];
		const result = buildResultItems(items, meta, raw, true, 0);

		expect(result).toHaveLength(2);
		expect(result[0].json._raw).toEqual({ original: 'first' });
		expect(result[1].json._raw).toEqual({ original: 'third' }); // ← THIS FAILS WITHOUT FIX
	});

	it('should align _raw when multiple nulls are interspersed', () => {
		const items = [{ v: 1 }, { v: 2 }];
		const raw = [
			null as unknown as Record<string, unknown>,
			{ r: 1 },
			null as unknown as Record<string, unknown>,
			undefined as unknown as Record<string, unknown>,
			{ r: 2 },
		];
		const result = buildResultItems(items, meta, raw, true, 0);

		expect(result).toHaveLength(2);
		expect(result[0].json._raw).toEqual({ r: 1 });
		expect(result[1].json._raw).toEqual({ r: 2 });
	});

	it('should handle empty arrays', () => {
		const result = buildResultItems([], meta, [], true, 0);
		expect(result).toHaveLength(0);
	});

	it('should handle rawItems with non-object primitives', () => {
		// Some APIs might return [valid, "string", valid, 42]
		const items = [{ v: 'A' }, { v: 'B' }];
		const raw = [
			{ r: 'A' },
			'not-an-object' as unknown as Record<string, unknown>,
			{ r: 'B' },
			42 as unknown as Record<string, unknown>,
		];
		const result = buildResultItems(items, meta, raw, true, 0);

		expect(result).toHaveLength(2);
		expect(result[0].json._raw).toEqual({ r: 'A' });
		expect(result[1].json._raw).toEqual({ r: 'B' });
	});
});

describe('buildResultItem', () => {
	const meta = { provider: 'test', query: 'q' };

	it('should build single-element array with _meta', () => {
		const result = buildResultItem({ name: 'X' }, meta, { raw: true }, false, 3);
		expect(result).toHaveLength(1);
		expect(result[0].json.name).toBe('X');
		expect(result[0].json._meta).toEqual(meta);
		expect(result[0].json._raw).toBeUndefined();
		expect(result[0].pairedItem).toEqual({ item: 3 });
	});

	it('should include _raw when includeRaw is true', () => {
		const result = buildResultItem({ name: 'X' }, meta, { raw: true }, true, 0);
		expect(result[0].json._raw).toEqual({ raw: true });
	});
});

describe('includeRawField', () => {
	it('should generate field for all operations when no filter', () => {
		const field = includeRawField('banks');
		expect(field.displayName).toBe('Include Raw Response');
		expect(field.name).toBe('includeRaw');
		expect(field.type).toBe('boolean');
		expect(field.default).toBe(false);
		expect(field.displayOptions?.show).toEqual({ resource: ['banks'] });
	});

	it('should generate field with operation filter', () => {
		const field = includeRawField('cnpj', ['query']);
		expect(field.displayOptions?.show).toEqual({ resource: ['cnpj'], operation: ['query'] });
	});

	it('should generate field with multiple operation filter', () => {
		const field = includeRawField('cep', ['query', 'validate']);
		expect(field.displayOptions?.show).toEqual({ resource: ['cep'], operation: ['query', 'validate'] });
	});

	it('should have "Whether" prefix in description', () => {
		const field = includeRawField('ddd');
		expect(field.description).toMatch(/^Whether/);
	});
});

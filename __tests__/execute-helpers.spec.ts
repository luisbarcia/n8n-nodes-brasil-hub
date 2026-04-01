import {
	createNormalizerDispatch,
	createListNormalizerDispatch,
	executeStandardQuery,
	executeStandardList,
} from '../nodes/BrasilHub/shared/execute-helpers';

// ---------------------------------------------------------------------------
// createNormalizerDispatch
// ---------------------------------------------------------------------------

describe('createNormalizerDispatch', () => {
	const strategies = {
		provA: (d: Record<string, unknown>) => ({ name: String(d.name ?? '') }),
		provB: (d: Record<string, unknown>) => ({ name: String(d.label ?? '') }),
	};

	it('should dispatch to the correct strategy by provider name', () => {
		const dispatch = createNormalizerDispatch(strategies, 'test');
		expect(dispatch({ name: 'hello' }, 'provA')).toEqual({ name: 'hello' });
		expect(dispatch({ label: 'world' }, 'provB')).toEqual({ name: 'world' });
	});

	it('should throw for unknown provider', () => {
		const dispatch = createNormalizerDispatch(strategies, 'test');
		expect(() => dispatch({}, 'unknown')).toThrow('Unknown test provider: unknown');
	});

	it('should include resource name in error message', () => {
		const dispatch = createNormalizerDispatch(strategies, 'CNPJ');
		expect(() => dispatch({}, 'badProv')).toThrow('Unknown CNPJ provider: badProv');
	});

	it('should handle null data gracefully (coerced to empty object)', () => {
		const dispatch = createNormalizerDispatch(strategies, 'test');
		const result = dispatch(null, 'provA');
		expect(result).toEqual({ name: '' });
	});

	it('should handle undefined data gracefully (coerced to empty object)', () => {
		const dispatch = createNormalizerDispatch(strategies, 'test');
		const result = dispatch(undefined, 'provA');
		expect(result).toEqual({ name: '' });
	});

	it('should pass raw data object through to strategy', () => {
		const spy = jest.fn(() => ({ val: 'ok' }));
		const dispatch = createNormalizerDispatch({ prov: spy }, 'test');
		dispatch({ foo: 'bar', num: 42 }, 'prov');
		expect(spy).toHaveBeenCalledWith({ foo: 'bar', num: 42 });
	});
});

// ---------------------------------------------------------------------------
// createListNormalizerDispatch
// ---------------------------------------------------------------------------

describe('createListNormalizerDispatch', () => {
	const itemStrategy = (d: Record<string, unknown>) => ({ id: String(d.id ?? '') });

	it('should dispatch and map array items through strategy', () => {
		const dispatch = createListNormalizerDispatch({ provA: itemStrategy }, 'test');
		const result = dispatch([{ id: '1' }, { id: '2' }], 'provA');
		expect(result).toEqual([{ id: '1' }, { id: '2' }]);
	});

	it('should throw for unknown provider', () => {
		const dispatch = createListNormalizerDispatch({ provA: itemStrategy }, 'test');
		expect(() => dispatch([], 'unknown')).toThrow('Unknown test provider: unknown');
	});

	it('should return empty array for non-array data (string)', () => {
		const dispatch = createListNormalizerDispatch({ provA: itemStrategy }, 'test');
		expect(dispatch('not-array', 'provA')).toEqual([]);
	});

	it('should return empty array for non-array data (null)', () => {
		const dispatch = createListNormalizerDispatch({ provA: itemStrategy }, 'test');
		expect(dispatch(null, 'provA')).toEqual([]);
	});

	it('should return empty array for non-array data (number)', () => {
		const dispatch = createListNormalizerDispatch({ provA: itemStrategy }, 'test');
		expect(dispatch(42, 'provA')).toEqual([]);
	});

	it('should return empty array for non-array data (object)', () => {
		const dispatch = createListNormalizerDispatch({ provA: itemStrategy }, 'test');
		expect(dispatch({ key: 'val' }, 'provA')).toEqual([]);
	});

	it('should filter null items from array', () => {
		const dispatch = createListNormalizerDispatch({ provA: itemStrategy }, 'test');
		const result = dispatch([{ id: 'a' }, null, { id: 'b' }], 'provA');
		expect(result).toEqual([{ id: 'a' }, { id: 'b' }]);
	});

	it('should filter undefined items from array', () => {
		const dispatch = createListNormalizerDispatch({ provA: itemStrategy }, 'test');
		const result = dispatch([{ id: 'x' }, undefined, { id: 'y' }], 'provA');
		expect(result).toEqual([{ id: 'x' }, { id: 'y' }]);
	});

	it('should filter non-object primitives from array', () => {
		const dispatch = createListNormalizerDispatch({ provA: itemStrategy }, 'test');
		const result = dispatch([{ id: '1' }, 'string', 42, true, { id: '2' }], 'provA');
		expect(result).toEqual([{ id: '1' }, { id: '2' }]);
	});

	it('should return empty array for empty input array', () => {
		const dispatch = createListNormalizerDispatch({ provA: itemStrategy }, 'test');
		expect(dispatch([], 'provA')).toEqual([]);
	});
});

// ---------------------------------------------------------------------------
// executeStandardQuery (integration with mocked dependencies)
// ---------------------------------------------------------------------------

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
		getNode: jest.fn(() => ({ name: 'Brasil Hub' })),
		helpers: {
			httpRequest: jest.fn().mockResolvedValue({ field: 'value' }),
		},
	} as unknown as Parameters<typeof executeStandardQuery>[0];
}

describe('executeStandardQuery', () => {
	it('should execute the full flow: params → providers → fallback → normalize → result', async () => {
		const ctx = createMockContext();
		const normalize = jest.fn((data: unknown) => ({ out: String((data as Record<string, unknown>).field) }));
		const result = await executeStandardQuery(ctx, 0, {
			buildProviders: () => [{ name: 'prov1', url: 'https://api.test/v1/' }],
			normalize,
			queryKey: 'test-123',
		});

		expect(result).toHaveLength(1);
		expect(result[0].json).toHaveProperty('out', 'value');
		expect(result[0].json).toHaveProperty('_meta');
		expect((result[0].json._meta as Record<string, unknown>).provider).toBe('prov1');
		expect((result[0].json._meta as Record<string, unknown>).query).toBe('test-123');
		expect(result[0].pairedItem).toEqual({ item: 0 });
		expect(normalize).toHaveBeenCalledWith({ field: 'value' }, 'prov1');
	});

	it('should apply postProcess when provided', async () => {
		const ctx = createMockContext();
		const normalize = jest.fn(() => ({ a: 1, b: 2 }));
		const postProcess = jest.fn((norm: { a: number; b: number }) => ({ sum: norm.a + norm.b }));

		const result = await executeStandardQuery(ctx, 0, {
			buildProviders: () => [{ name: 'prov1', url: 'https://api.test/v1/' }],
			normalize,
			queryKey: 'q',
			postProcess,
		});

		expect(result[0].json).toHaveProperty('sum', 3);
		expect(result[0].json).not.toHaveProperty('a');
		expect(result[0].json).not.toHaveProperty('b');
		expect(postProcess).toHaveBeenCalledWith({ a: 1, b: 2 });
	});

	it('should spread normalized object when postProcess is absent', async () => {
		const ctx = createMockContext();
		const result = await executeStandardQuery(ctx, 0, {
			buildProviders: () => [{ name: 'prov1', url: 'https://api.test/v1/' }],
			normalize: () => ({ x: 10, y: 20 }),
			queryKey: 'q',
		});

		expect(result[0].json).toHaveProperty('x', 10);
		expect(result[0].json).toHaveProperty('y', 20);
	});

	it('should include _raw when includeRaw is true', async () => {
		const ctx = createMockContext({ includeRaw: true });
		const result = await executeStandardQuery(ctx, 0, {
			buildProviders: () => [{ name: 'prov1', url: 'https://api.test/v1/' }],
			normalize: () => ({ data: 'norm' }),
			queryKey: 'q',
		});

		expect(result[0].json).toHaveProperty('_raw');
		expect(result[0].json._raw).toEqual({ field: 'value' });
	});

	it('should not include _raw when includeRaw is false', async () => {
		const ctx = createMockContext({ includeRaw: false });
		const result = await executeStandardQuery(ctx, 0, {
			buildProviders: () => [{ name: 'prov1', url: 'https://api.test/v1/' }],
			normalize: () => ({ data: 'norm' }),
			queryKey: 'q',
		});

		expect(result[0].json).not.toHaveProperty('_raw');
	});

	it('should propagate errors when normalize throws', async () => {
		const ctx = createMockContext();
		await expect(
			executeStandardQuery(ctx, 0, {
				buildProviders: () => [{ name: 'prov1', url: 'https://api.test/v1/' }],
				normalize: () => { throw new Error('Normalize failed'); },
				queryKey: 'q',
			}),
		).rejects.toThrow('Normalize failed');
	});

	it('should propagate errors when all providers fail (empty response)', async () => {
		const ctx = createMockContext();
		(ctx.helpers.httpRequest as jest.Mock).mockRejectedValue(new Error('Network error'));
		await expect(
			executeStandardQuery(ctx, 0, {
				buildProviders: () => [{ name: 'prov1', url: 'https://api.test/v1/' }],
				normalize: () => ({ ok: true }),
				queryKey: 'q',
			}),
		).rejects.toThrow();
	});
});

// ---------------------------------------------------------------------------
// executeStandardList (integration with mocked dependencies)
// ---------------------------------------------------------------------------

describe('executeStandardList', () => {
	it('should execute the full list flow and return multiple items', async () => {
		const listData = [{ id: '1', name: 'A' }, { id: '2', name: 'B' }];
		const ctx = createMockContext();
		(ctx.helpers.httpRequest as jest.Mock).mockResolvedValue(listData);

		const normalize = jest.fn((_data: unknown) => [{ id: '1' }, { id: '2' }]);
		const result = await executeStandardList(ctx, 0, {
			buildProviders: () => [{ name: 'prov1', url: 'https://api.test/v1/' }],
			normalize,
			queryKey: 'list',
		});

		expect(result).toHaveLength(2);
		expect(result[0].json).toHaveProperty('id', '1');
		expect(result[0].json).toHaveProperty('_meta');
		expect(result[1].json).toHaveProperty('id', '2');
		expect(result[0].pairedItem).toEqual({ item: 0 });
		expect(result[1].pairedItem).toEqual({ item: 0 });
	});

	it('should pass rawItems as array when API returns array', async () => {
		const listData = [{ raw: 'a' }, { raw: 'b' }];
		const ctx = createMockContext({ includeRaw: true });
		(ctx.helpers.httpRequest as jest.Mock).mockResolvedValue(listData);

		const result = await executeStandardList(ctx, 0, {
			buildProviders: () => [{ name: 'prov1', url: 'https://api.test/v1/' }],
			normalize: () => [{ norm: '1' }, { norm: '2' }],
			queryKey: 'q',
		});

		expect(result[0].json).toHaveProperty('_raw', { raw: 'a' });
		expect(result[1].json).toHaveProperty('_raw', { raw: 'b' });
	});

	it('should use empty rawItems when API returns non-array', async () => {
		const ctx = createMockContext({ includeRaw: true });
		(ctx.helpers.httpRequest as jest.Mock).mockResolvedValue({ single: 'object' });

		const result = await executeStandardList(ctx, 0, {
			buildProviders: () => [{ name: 'prov1', url: 'https://api.test/v1/' }],
			normalize: () => [{ item: '1' }],
			queryKey: 'q',
		});

		expect(result).toHaveLength(1);
		expect(result[0].json).toHaveProperty('item', '1');
		// _raw should be undefined because rawItems is empty array (non-array API response)
		expect(result[0].json._raw).toBeUndefined();
	});

	it('should propagate errors when normalize throws', async () => {
		const ctx = createMockContext();
		(ctx.helpers.httpRequest as jest.Mock).mockResolvedValue([]);
		await expect(
			executeStandardList(ctx, 0, {
				buildProviders: () => [{ name: 'prov1', url: 'https://api.test/v1/' }],
				normalize: () => { throw new Error('List normalize failed'); },
				queryKey: 'q',
			}),
		).rejects.toThrow('List normalize failed');
	});

	it('should return empty array when normalize returns empty', async () => {
		const ctx = createMockContext();
		(ctx.helpers.httpRequest as jest.Mock).mockResolvedValue([]);
		const result = await executeStandardList(ctx, 0, {
			buildProviders: () => [{ name: 'prov1', url: 'https://api.test/v1/' }],
			normalize: () => [],
			queryKey: 'q',
		});

		expect(result).toEqual([]);
	});
});

import { readCommonParams } from '../nodes/BrasilHub/shared/utils';

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

import { readCommonParams } from '../nodes/BrasilHub/shared/utils';
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

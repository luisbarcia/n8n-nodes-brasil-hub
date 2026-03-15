import { cpfValidate } from '../nodes/BrasilHub/resources/cpf/cpf.execute';

function createMockContext(overrides: Record<string, unknown> = {}) {
	const params: Record<string, unknown> = {
		cpf: '52998224725',
		...overrides,
	};
	return {
		getNodeParameter: jest.fn((name: string, _index: number, fallback?: unknown) =>
			params[name] ?? fallback,
		),
		getNode: jest.fn(() => ({ name: 'Brasil Hub' })),
	} as unknown as Parameters<typeof cpfValidate>[0];
}

describe('cpfValidate', () => {
	it('should return validation result for valid CPF', async () => {
		const ctx = createMockContext({ cpf: '52998224725' });
		const [result] = await cpfValidate(ctx, 0);
		expect(result.json).toEqual({
			valid: true,
			formatted: '529.982.247-25',
			input: '52998224725',
		});
		expect(result.pairedItem).toEqual({ item: 0 });
	});

	it('should return invalid for wrong checksum', async () => {
		const ctx = createMockContext({ cpf: '52998224799' });
		const [result] = await cpfValidate(ctx, 0);
		expect(result.json).toHaveProperty('valid', false);
	});

	it('should handle formatted input', async () => {
		const ctx = createMockContext({ cpf: '529.982.247-25' });
		const [result] = await cpfValidate(ctx, 0);
		expect(result.json).toHaveProperty('valid', true);
		expect(result.json).toHaveProperty('formatted', '529.982.247-25');
	});

	it('should return invalid for all-same-digit CPF', async () => {
		const ctx = createMockContext({ cpf: '11111111111' });
		const [result] = await cpfValidate(ctx, 0);
		expect(result.json).toHaveProperty('valid', false);
	});
});

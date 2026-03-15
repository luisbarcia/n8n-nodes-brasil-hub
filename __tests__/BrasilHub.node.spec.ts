import { BrasilHub } from '../nodes/BrasilHub/BrasilHub.node';

describe('BrasilHub node', () => {
	it('should have correct description metadata', () => {
		const node = new BrasilHub();
		expect(node.description.name).toBe('brasilHub');
		expect(node.description.displayName).toBe('Brasil Hub');
		expect(node.description.usableAsTool).toBe(true);
		expect(node.description.version).toBe(1);
	});

	it('should have resource property with Banks, CEP, CNPJ, and CPF options', () => {
		const node = new BrasilHub();
		const resourceProp = node.description.properties.find((p) => p.name === 'resource');
		expect(resourceProp).toBeDefined();
		expect(resourceProp!.noDataExpression).toBe(true);
		const values = (resourceProp!.options as Array<{ value: string }>).map((o) => o.value);
		expect(values).toContain('banks');
		expect(values).toContain('cnpj');
		expect(values).toContain('cep');
		expect(values).toContain('cpf');
	});

	it('should have operation properties for all resources', () => {
		const node = new BrasilHub();
		const ops = node.description.properties.filter((p) => p.name === 'operation');
		expect(ops.length).toBe(4);
		for (const op of ops) {
			expect(op.noDataExpression).toBe(true);
			const values = op.options as Array<{ value: string; action: string }>;
			for (const v of values) {
				expect(v.action).toBeDefined();
			}
		}
	});
});

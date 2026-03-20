import { fakeCpf, fakeCnpj, fakePerson, fakeCompany } from '../nodes/BrasilHub/resources/fake/fake.execute';

function createMockContext(overrides: Record<string, unknown> = {}) {
	const params: Record<string, unknown> = {
		quantity: 1,
		formatted: true,
		gender: 'any',
		...overrides,
	};
	return {
		getNodeParameter: jest.fn((name: string, _index: number, fallback?: unknown) =>
			params[name] ?? fallback,
		),
		getNode: jest.fn(() => ({ name: 'Brasil Hub' })),
	} as unknown as Parameters<typeof fakeCpf>[0];
}

describe('fakeCpf', () => {
	it('should return 1 item by default', async () => {
		const ctx = createMockContext();
		const results = await fakeCpf(ctx, 0);
		expect(results).toHaveLength(1);
		expect(results[0].json).toHaveProperty('cpf');
		expect(results[0].pairedItem).toEqual({ item: 0 });
	});

	it('should return N items when quantity > 1', async () => {
		const ctx = createMockContext({ quantity: 5 });
		const results = await fakeCpf(ctx, 0);
		expect(results).toHaveLength(5);
	});

	it('should clamp quantity to 100', async () => {
		const ctx = createMockContext({ quantity: 200 });
		const results = await fakeCpf(ctx, 0);
		expect(results).toHaveLength(100);
	});

	it('should clamp quantity to 1 for negative', async () => {
		const ctx = createMockContext({ quantity: -5 });
		const results = await fakeCpf(ctx, 0);
		expect(results).toHaveLength(1);
	});

	it('should handle NaN quantity', async () => {
		const ctx = createMockContext({ quantity: NaN });
		const results = await fakeCpf(ctx, 0);
		expect(results).toHaveLength(1);
	});

	it('should return formatted CPF when formatted=true', async () => {
		const ctx = createMockContext({ formatted: true });
		const [result] = await fakeCpf(ctx, 0);
		expect(result.json.cpf).toMatch(/^\d{3}\.\d{3}\.\d{3}-\d{2}$/);
	});

	it('should return unformatted CPF when formatted=false', async () => {
		const ctx = createMockContext({ formatted: false });
		const [result] = await fakeCpf(ctx, 0);
		expect(result.json.cpf).toMatch(/^\d{11}$/);
	});
});

describe('fakeCnpj', () => {
	it('should return 1 item by default', async () => {
		const ctx = createMockContext();
		const results = await fakeCnpj(ctx, 0);
		expect(results).toHaveLength(1);
		expect(results[0].json).toHaveProperty('cnpj');
	});

	it('should return formatted CNPJ', async () => {
		const ctx = createMockContext({ formatted: true });
		const [result] = await fakeCnpj(ctx, 0);
		expect(result.json.cnpj).toMatch(/^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/);
	});

	it('should return N items', async () => {
		const ctx = createMockContext({ quantity: 10 });
		const results = await fakeCnpj(ctx, 0);
		expect(results).toHaveLength(10);
	});
});

describe('fakePerson', () => {
	it('should return person with all fields', async () => {
		const ctx = createMockContext();
		const [result] = await fakePerson(ctx, 0);
		expect(result.json).toHaveProperty('name');
		expect(result.json).toHaveProperty('cpf');
		expect(result.json).toHaveProperty('rg');
		expect(result.json).toHaveProperty('birthDate');
		expect(result.json).toHaveProperty('age');
		expect(result.json).toHaveProperty('gender');
		expect(result.json).toHaveProperty('motherName');
		expect(result.json).toHaveProperty('email');
		expect(result.json).toHaveProperty('phone');
		expect(result.json).toHaveProperty('address');
	});

	it('should respect gender=M', async () => {
		const ctx = createMockContext({ gender: 'M' });
		const results = await fakePerson(ctx, 0);
		expect(results[0].json.gender).toBe('M');
	});

	it('should respect gender=F', async () => {
		const ctx = createMockContext({ gender: 'F' });
		const results = await fakePerson(ctx, 0);
		expect(results[0].json.gender).toBe('F');
	});

	it('should generate multiple persons', async () => {
		const ctx = createMockContext({ quantity: 10 });
		const results = await fakePerson(ctx, 0);
		expect(results).toHaveLength(10);
		// All should have names
		results.forEach((r) => expect(r.json.name).toBeTruthy());
	});

	it('should have pairedItem on all items', async () => {
		const ctx = createMockContext({ quantity: 3 });
		const results = await fakePerson(ctx, 2);
		results.forEach((r) => expect(r.pairedItem).toEqual({ item: 2 }));
	});
});

describe('fakeCompany', () => {
	it('should return company with all fields', async () => {
		const ctx = createMockContext();
		const [result] = await fakeCompany(ctx, 0);
		expect(result.json).toHaveProperty('razaoSocial');
		expect(result.json).toHaveProperty('nomeFantasia');
		expect(result.json).toHaveProperty('cnpj');
		expect(result.json).toHaveProperty('inscricaoEstadual');
		expect(result.json).toHaveProperty('openDate');
		expect(result.json).toHaveProperty('email');
		expect(result.json).toHaveProperty('phone');
		expect(result.json).toHaveProperty('activity');
		expect(result.json).toHaveProperty('address');
	});

	it('should generate multiple companies', async () => {
		const ctx = createMockContext({ quantity: 5 });
		const results = await fakeCompany(ctx, 0);
		expect(results).toHaveLength(5);
	});
});

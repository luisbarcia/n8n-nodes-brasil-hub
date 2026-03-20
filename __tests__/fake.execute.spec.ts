import { fakeCpf, fakeCnpj, fakePerson, fakeCompany } from '../nodes/BrasilHub/resources/fake/fake.execute';
import { validateCpf, validateCnpj } from '../nodes/BrasilHub/shared/validators';

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

	it('should return valid CPFs (checksum-correct)', async () => {
		const ctx = createMockContext({ quantity: 20, formatted: false });
		const results = await fakeCpf(ctx, 0);
		for (const r of results) {
			expect(validateCpf(r.json.cpf as string).valid).toBe(true);
		}
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
	it('should return 1 item with pairedItem', async () => {
		const ctx = createMockContext();
		const results = await fakeCnpj(ctx, 0);
		expect(results).toHaveLength(1);
		expect(results[0].json).toHaveProperty('cnpj');
		expect(results[0].pairedItem).toEqual({ item: 0 });
	});

	it('should return formatted CNPJ', async () => {
		const ctx = createMockContext({ formatted: true });
		const [result] = await fakeCnpj(ctx, 0);
		expect(result.json.cnpj).toMatch(/^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/);
	});

	it('should return valid CNPJs (checksum-correct)', async () => {
		const ctx = createMockContext({ quantity: 20, formatted: false });
		const results = await fakeCnpj(ctx, 0);
		for (const r of results) {
			expect(validateCnpj(r.json.cnpj as string).valid).toBe(true);
		}
	});

	it('should return N items', async () => {
		const ctx = createMockContext({ quantity: 10 });
		const results = await fakeCnpj(ctx, 0);
		expect(results).toHaveLength(10);
	});

	it('should have pairedItem on all items', async () => {
		const ctx = createMockContext({ quantity: 3 });
		const results = await fakeCnpj(ctx, 5);
		results.forEach((r) => expect(r.pairedItem).toEqual({ item: 5 }));
	});
});

describe('fakePerson', () => {
	it('should return person with correct types and formats', async () => {
		const ctx = createMockContext();
		const [result] = await fakePerson(ctx, 0);
		const p = result.json;
		expect(typeof p.name).toBe('string');
		expect((p.name as string).length).toBeGreaterThan(0);
		expect(p.cpf).toMatch(/^\d{3}\.\d{3}\.\d{3}-\d{2}$/);
		expect(p.rg).toMatch(/^\d{2}\.\d{3}\.\d{3}-\d{1}$/);
		expect(p.birthDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
		expect(typeof p.age).toBe('number');
		expect(p.age).toBeGreaterThanOrEqual(17);
		expect(p.age).toBeLessThanOrEqual(80);
		expect(['M', 'F']).toContain(p.gender);
		expect(typeof p.motherName).toBe('string');
		expect((p.motherName as string).length).toBeGreaterThan(0);
		expect(p.email).toMatch(/@.+\..+/);
		expect(p.phone).toMatch(/^\(\d{2}\) 9\d{4}-\d{4}$/);
		expect(typeof p.address).toBe('object');
		expect(p.address).not.toBeNull();
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

	it('should treat invalid gender as random', async () => {
		for (const g of ['X', '', null, 42]) {
			const ctx = createMockContext({ gender: g });
			const results = await fakePerson(ctx, 0);
			expect(['M', 'F']).toContain(results[0].json.gender);
		}
	});

	it('should generate multiple persons with unique CPFs', async () => {
		const ctx = createMockContext({ quantity: 50 });
		const results = await fakePerson(ctx, 0);
		expect(results).toHaveLength(50);
		const cpfs = new Set(results.map((r) => r.json.cpf));
		expect(cpfs.size).toBeGreaterThan(45);
	});

	it('should have pairedItem on all items', async () => {
		const ctx = createMockContext({ quantity: 3 });
		const results = await fakePerson(ctx, 2);
		results.forEach((r) => expect(r.pairedItem).toEqual({ item: 2 }));
	});

	it('should clamp quantity to 100', async () => {
		const ctx = createMockContext({ quantity: 200 });
		const results = await fakePerson(ctx, 0);
		expect(results).toHaveLength(100);
	});

	it('should clamp quantity to 1 for zero/negative', async () => {
		const ctx = createMockContext({ quantity: 0 });
		const results = await fakePerson(ctx, 0);
		expect(results).toHaveLength(1);
	});
});

describe('fakeCompany', () => {
	it('should return company with correct types and formats', async () => {
		const ctx = createMockContext();
		const [result] = await fakeCompany(ctx, 0);
		const c = result.json;
		expect(typeof c.razaoSocial).toBe('string');
		expect((c.razaoSocial as string).length).toBeGreaterThan(0);
		expect(typeof c.nomeFantasia).toBe('string');
		expect(c.cnpj).toMatch(/^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/);
		expect(c.inscricaoEstadual).toMatch(/^\d{3}\.\d{3}\.\d{3}\.\d{3}$/);
		expect(c.openDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
		expect(c.email).toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
		expect(typeof c.phone).toBe('string');
		expect(typeof c.activity).toBe('string');
		expect(typeof c.address).toBe('object');
		expect(c.address).not.toBeNull();
	});

	it('should generate multiple companies with unique CNPJs', async () => {
		const ctx = createMockContext({ quantity: 50 });
		const results = await fakeCompany(ctx, 0);
		expect(results).toHaveLength(50);
		const cnpjs = new Set(results.map((r) => r.json.cnpj));
		expect(cnpjs.size).toBeGreaterThan(45);
	});

	it('should have pairedItem on all items', async () => {
		const ctx = createMockContext({ quantity: 3 });
		const results = await fakeCompany(ctx, 7);
		results.forEach((r) => expect(r.pairedItem).toEqual({ item: 7 }));
	});

	it('should clamp quantity to 100', async () => {
		const ctx = createMockContext({ quantity: 500 });
		const results = await fakeCompany(ctx, 0);
		expect(results).toHaveLength(100);
	});

	it('should clamp quantity to 1 for negative', async () => {
		const ctx = createMockContext({ quantity: -10 });
		const results = await fakeCompany(ctx, 0);
		expect(results).toHaveLength(1);
	});
});

describe('clampQuantity edge cases', () => {
	it('should clamp quantity=0 to 1', async () => {
		const ctx = createMockContext({ quantity: 0 });
		const results = await fakeCpf(ctx, 0);
		expect(results).toHaveLength(1);
	});

	it('should clamp Infinity to 1', async () => {
		const ctx = createMockContext({ quantity: Infinity });
		const results = await fakeCpf(ctx, 0);
		expect(results).toHaveLength(1);
	});

	it('should clamp -Infinity to 1', async () => {
		const ctx = createMockContext({ quantity: -Infinity });
		const results = await fakeCpf(ctx, 0);
		expect(results).toHaveLength(1);
	});

	it('should floor float quantities (3.7 → 3)', async () => {
		const ctx = createMockContext({ quantity: 3.7 });
		const results = await fakeCpf(ctx, 0);
		expect(results).toHaveLength(3);
	});

	it('should handle quantity=101 (boundary)', async () => {
		const ctx = createMockContext({ quantity: 101 });
		const results = await fakeCnpj(ctx, 0);
		expect(results).toHaveLength(100);
	});
});

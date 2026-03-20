import {
	generateCpf, generateCnpj, generateRg, generateAddress,
	generatePerson, generateCompany,
} from '../nodes/BrasilHub/resources/fake/fake.generators';
import { validateCpf, validateCnpj } from '../nodes/BrasilHub/shared/validators';
import { STATES } from '../nodes/BrasilHub/resources/fake/fake.data';

describe('generateCpf', () => {
	it('should generate an 11-digit string', () => {
		const cpf = generateCpf();
		expect(cpf).toMatch(/^\d{11}$/);
	});

	it('should generate a valid CPF (passes checksum)', () => {
		for (let i = 0; i < 50; i++) {
			const cpf = generateCpf();
			expect(validateCpf(cpf).valid).toBe(true);
		}
	});

	it('should format when formatted=true', () => {
		const cpf = generateCpf(true);
		expect(cpf).toMatch(/^\d{3}\.\d{3}\.\d{3}-\d{2}$/);
	});

	it('should generate unique CPFs', () => {
		const cpfs = new Set(Array.from({ length: 100 }, () => generateCpf()));
		expect(cpfs.size).toBeGreaterThan(90);
	});
});

describe('generateCnpj', () => {
	it('should generate a 14-digit string', () => {
		const cnpj = generateCnpj();
		expect(cnpj).toMatch(/^\d{14}$/);
	});

	it('should generate a valid CNPJ (passes checksum)', () => {
		for (let i = 0; i < 50; i++) {
			const cnpj = generateCnpj();
			expect(validateCnpj(cnpj).valid).toBe(true);
		}
	});

	it('should format when formatted=true', () => {
		const cnpj = generateCnpj(true);
		expect(cnpj).toMatch(/^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/);
	});

	it('should always have branch 0001', () => {
		for (let i = 0; i < 20; i++) {
			const cnpj = generateCnpj();
			expect(cnpj.slice(8, 12)).toBe('0001');
		}
	});

	it('should generate unique CNPJs', () => {
		const cnpjs = new Set(Array.from({ length: 100 }, () => generateCnpj()));
		expect(cnpjs.size).toBeGreaterThan(90);
	});
});

describe('generateRg', () => {
	it('should match XX.XXX.XXX-X format (20 iterations)', () => {
		for (let i = 0; i < 20; i++) {
			expect(generateRg()).toMatch(/^\d{2}\.\d{3}\.\d{3}-\d{1}$/);
		}
	});

	it('should generate unique RGs', () => {
		const rgs = new Set(Array.from({ length: 100 }, () => generateRg()));
		expect(rgs.size).toBeGreaterThan(80);
	});
});

describe('generateAddress', () => {
	it('should return all required fields', () => {
		const addr = generateAddress();
		expect(addr).toHaveProperty('street');
		expect(addr).toHaveProperty('number');
		expect(addr).toHaveProperty('complement');
		expect(addr).toHaveProperty('neighborhood');
		expect(addr).toHaveProperty('city');
		expect(addr).toHaveProperty('state');
		expect(addr).toHaveProperty('cep');
	});

	it('should have valid state abbreviation (2 chars)', () => {
		const addr = generateAddress();
		expect(addr.state).toMatch(/^[A-Z]{2}$/);
	});

	it('should have 8-digit CEP', () => {
		const addr = generateAddress();
		expect(addr.cep).toMatch(/^\d{8}$/);
	});

	it('should have numeric street number', () => {
		const addr = generateAddress();
		expect(Number(addr.number)).toBeGreaterThan(0);
	});

	it('should have street with prefix', () => {
		const addr = generateAddress();
		expect(addr.street).toMatch(/^(Rua|Avenida|Travessa|Alameda|Praça) /);
	});
});

describe('generatePerson', () => {
	it('should return all required fields', () => {
		const person = generatePerson();
		expect(person).toHaveProperty('name');
		expect(person).toHaveProperty('cpf');
		expect(person).toHaveProperty('rg');
		expect(person).toHaveProperty('birthDate');
		expect(person).toHaveProperty('age');
		expect(person).toHaveProperty('gender');
		expect(person).toHaveProperty('motherName');
		expect(person).toHaveProperty('email');
		expect(person).toHaveProperty('phone');
		expect(person).toHaveProperty('address');
	});

	it('should have valid CPF', () => {
		const person = generatePerson();
		const digits = person.cpf.replace(/\D/g, '');
		expect(validateCpf(digits).valid).toBe(true);
	});

	it('should respect gender=M', () => {
		for (let i = 0; i < 20; i++) {
			const person = generatePerson('M');
			expect(person.gender).toBe('M');
		}
	});

	it('should respect gender=F', () => {
		for (let i = 0; i < 20; i++) {
			const person = generatePerson('F');
			expect(person.gender).toBe('F');
		}
	});

	it('should have valid birth date (ISO format)', () => {
		const person = generatePerson();
		expect(person.birthDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
	});

	it('should have age between 17 and 80 (accounts for birthday not yet passed)', () => {
		for (let i = 0; i < 50; i++) {
			const person = generatePerson();
			expect(person.age).toBeGreaterThanOrEqual(17);
			expect(person.age).toBeLessThanOrEqual(80);
		}
	});

	it('should have valid email format', () => {
		const person = generatePerson();
		expect(person.email).toMatch(/@.+\..+/);
	});

	it('should have valid phone format', () => {
		const person = generatePerson();
		expect(person.phone).toMatch(/^\(\d{2}\) 9\d{4}-\d{4}$/);
	});

	it('should have valid address', () => {
		const person = generatePerson();
		expect(person.address.state).toMatch(/^[A-Z]{2}$/);
		expect(person.address.cep).toMatch(/^\d{8}$/);
	});
});

describe('generateCompany', () => {
	it('should return all required fields', () => {
		const co = generateCompany();
		expect(co).toHaveProperty('razaoSocial');
		expect(co).toHaveProperty('nomeFantasia');
		expect(co).toHaveProperty('cnpj');
		expect(co).toHaveProperty('inscricaoEstadual');
		expect(co).toHaveProperty('openDate');
		expect(co).toHaveProperty('email');
		expect(co).toHaveProperty('phone');
		expect(co).toHaveProperty('activity');
		expect(co).toHaveProperty('address');
	});

	it('should have valid CNPJ', () => {
		const co = generateCompany();
		const digits = co.cnpj.replace(/\D/g, '');
		expect(validateCnpj(digits).valid).toBe(true);
	});

	it('should have valid open date (ISO format)', () => {
		const co = generateCompany();
		expect(co.openDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
	});

	it('should have valid inscricao estadual format', () => {
		const co = generateCompany();
		expect(co.inscricaoEstadual).toMatch(/^\d{3}\.\d{3}\.\d{3}\.\d{3}$/);
	});

	it('should have valid company email format', () => {
		for (let i = 0; i < 30; i++) {
			const co = generateCompany();
			expect(co.email).toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
		}
	});

	it('should have valid address', () => {
		const co = generateCompany();
		expect(co.address.state).toMatch(/^[A-Z]{2}$/);
	});

	it('should have company phone in landline format', () => {
		for (let i = 0; i < 30; i++) {
			const co = generateCompany();
			expect(co.phone).toMatch(/^\(\d{2}\) \d{4}-\d{4}$/);
		}
	});

	it('should have phone DDD matching address state', () => {
		for (let i = 0; i < 30; i++) {
			const co = generateCompany();
			const phoneDdd = co.phone.match(/^\((\d{2})\)/)?.[1];
			const stateData = STATES.find((s) => s.uf === co.address.state);
			expect(phoneDdd).toBe(stateData?.ddd);
		}
	});
});

// ─── High-volume cross-validation ────────────────────────────────

describe('generateCpf — high-volume validation', () => {
	it('should generate 200 valid CPFs that all pass validator', () => {
		for (let i = 0; i < 200; i++) {
			expect(validateCpf(generateCpf()).valid).toBe(true);
		}
	});

	it('formatted CPFs should also pass validation', () => {
		for (let i = 0; i < 100; i++) {
			const cpf = generateCpf(true);
			expect(validateCpf(cpf.replace(/\D/g, '')).valid).toBe(true);
		}
	});
});

describe('generateCnpj — high-volume validation', () => {
	it('should generate 200 valid CNPJs that all pass validator', () => {
		for (let i = 0; i < 200; i++) {
			expect(validateCnpj(generateCnpj()).valid).toBe(true);
		}
	});
});

describe('generatePerson — data quality', () => {
	it('phone DDD should match address state', () => {
		for (let i = 0; i < 50; i++) {
			const person = generatePerson();
			const phoneDdd = person.phone.match(/^\((\d{2})\)/)?.[1];
			const stateData = STATES.find((s) => s.uf === person.address.state);
			expect(phoneDdd).toBe(stateData?.ddd);
		}
	});

	it('name should have 3+ words (first + 2 last names)', () => {
		for (let i = 0; i < 50; i++) {
			expect(generatePerson().name.split(' ').length).toBeGreaterThanOrEqual(3);
		}
	});

	it('email should not contain accented characters', () => {
		for (let i = 0; i < 100; i++) {
			expect(generatePerson().email).not.toMatch(/[àáâãäèéêëìíîïòóôõöùúûüñç]/i);
		}
	});

	it('address city should match state capital', () => {
		for (let i = 0; i < 50; i++) {
			const person = generatePerson();
			const stateData = STATES.find((s) => s.uf === person.address.state);
			expect(person.address.city).toBe(stateData?.capital);
		}
	});

	it('address CEP prefix should match state', () => {
		for (let i = 0; i < 50; i++) {
			const person = generatePerson();
			const stateData = STATES.find((s) => s.uf === person.address.state);
			expect(person.address.cep.startsWith(stateData!.cepPrefix)).toBe(true);
		}
	});
});

import { validateCnpj, validateCep, validateCpf, sanitizeCpf } from '../nodes/BrasilHub/shared/validators';

describe('validateCnpj', () => {
	it('should validate a correct CNPJ', () => {
		expect(validateCnpj('11222333000181')).toEqual({
			valid: true,
			formatted: '11.222.333/0001-81',
			input: '11222333000181',
		});
	});

	it('should validate a formatted CNPJ', () => {
		expect(validateCnpj('11.222.333/0001-81')).toEqual({
			valid: true,
			formatted: '11.222.333/0001-81',
			input: '11.222.333/0001-81',
		});
	});

	it('should reject a CNPJ with wrong check digits', () => {
		const result = validateCnpj('11222333000199');
		expect(result.valid).toBe(false);
	});

	it('should reject all-same-digit CNPJs', () => {
		for (let d = 0; d <= 9; d++) {
			const cnpj = String(d).repeat(14);
			expect(validateCnpj(cnpj).valid).toBe(false);
		}
	});

	it('should reject CNPJ with wrong length', () => {
		expect(validateCnpj('1234567890').valid).toBe(false);
		expect(validateCnpj('123456789012345').valid).toBe(false);
	});

	it('should reject empty string', () => {
		expect(validateCnpj('').valid).toBe(false);
	});

	it('should reject CNPJ with valid first check digit but invalid second', () => {
		// 11222333000181 is valid; change last digit to break only check2
		expect(validateCnpj('11222333000182').valid).toBe(false);
	});

	it('should validate known real CNPJs', () => {
		// Banco do Brasil
		expect(validateCnpj('00000000000191').valid).toBe(true);
		// Petrobras
		expect(validateCnpj('33000167000101').valid).toBe(true);
	});

	it('should validate CNPJ where second check digit remainder < 2', () => {
		// 80000000000040 — sum2 % 11 = 1 (< 2), so check2 = 0
		expect(validateCnpj('80000000000040').valid).toBe(true);
	});
});

describe('validateCpf', () => {
	it('should validate a correct CPF', () => {
		expect(validateCpf('52998224725')).toEqual({
			valid: true,
			formatted: '529.982.247-25',
			input: '52998224725',
		});
	});

	it('should validate a formatted CPF', () => {
		expect(validateCpf('529.982.247-25')).toEqual({
			valid: true,
			formatted: '529.982.247-25',
			input: '529.982.247-25',
		});
	});

	it('should reject a CPF with wrong check digits', () => {
		expect(validateCpf('52998224799').valid).toBe(false);
	});

	it('should reject all-same-digit CPFs', () => {
		for (let d = 0; d <= 9; d++) {
			const cpf = String(d).repeat(11);
			expect(validateCpf(cpf).valid).toBe(false);
		}
	});

	it('should reject CPF with wrong length', () => {
		expect(validateCpf('1234567890').valid).toBe(false);
		expect(validateCpf('123456789012').valid).toBe(false);
	});

	it('should reject empty string', () => {
		expect(validateCpf('').valid).toBe(false);
	});

	it('should reject CPF with valid first check digit but invalid second', () => {
		// 529.982.247-25 is valid; change last digit to break only check2
		expect(validateCpf('52998224726').valid).toBe(false);
	});

	it('should validate known valid CPFs', () => {
		// Generated from the algorithm
		expect(validateCpf('45317828791').valid).toBe(true);
		expect(validateCpf('11144477735').valid).toBe(true);
	});

	it('should validate CPF where check digit remainders are less than 2', () => {
		// 12345678909 — sum1 % 11 = 1 (< 2), so check1 = 0
		expect(validateCpf('12345678909').valid).toBe(true);
		// 74650688000 — both sum1 % 11 = 0 and sum2 % 11 = 0 (< 2), so check1 = check2 = 0
		expect(validateCpf('74650688000').valid).toBe(true);
	});
});

describe('sanitizeCpf', () => {
	it('should strip non-digit characters', () => {
		expect(sanitizeCpf('529.982.247-25')).toBe('52998224725');
	});

	it('should return digits-only input unchanged', () => {
		expect(sanitizeCpf('52998224725')).toBe('52998224725');
	});
});

describe('validateCep', () => {
	it('should validate a correct CEP', () => {
		expect(validateCep('01001000')).toEqual({
			valid: true,
			formatted: '01001-000',
			input: '01001000',
		});
	});

	it('should validate a formatted CEP', () => {
		expect(validateCep('01001-000')).toEqual({
			valid: true,
			formatted: '01001-000',
			input: '01001-000',
		});
	});

	it('should reject all-zeros CEP', () => {
		expect(validateCep('00000000').valid).toBe(false);
	});

	it('should reject CEP below minimum range (00xxx-xxx)', () => {
		expect(validateCep('00010000').valid).toBe(false);
		expect(validateCep('00010-000').valid).toBe(false);
		expect(validateCep('00999999').valid).toBe(false);
	});

	it('should accept CEP at minimum valid range (01000-000)', () => {
		expect(validateCep('01000000').valid).toBe(true);
		expect(validateCep('01000-000').valid).toBe(true);
	});

	it('should reject CEP with wrong length', () => {
		expect(validateCep('1234567').valid).toBe(false);
		expect(validateCep('123456789').valid).toBe(false);
	});

	it('should reject empty string', () => {
		expect(validateCep('').valid).toBe(false);
	});
});

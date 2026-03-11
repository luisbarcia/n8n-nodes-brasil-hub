import { validateCnpj, validateCep } from '../nodes/BrasilHub/shared/validators';

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

	it('should reject CEP with wrong length', () => {
		expect(validateCep('1234567').valid).toBe(false);
		expect(validateCep('123456789').valid).toBe(false);
	});

	it('should reject empty string', () => {
		expect(validateCep('').valid).toBe(false);
	});
});

import { validateCnpj, validateCep, validateCpf, sanitizeCpf } from '../nodes/BrasilHub/shared/validators';

// =============================================================================
// CNPJ Validation
// =============================================================================

describe('validateCnpj', () => {
	describe('valid CNPJs', () => {
		it('should validate unformatted CNPJ', () => {
			expect(validateCnpj('11222333000181')).toEqual({
				valid: true,
				formatted: '11.222.333/0001-81',
				input: '11222333000181',
			});
		});

		it('should validate formatted CNPJ', () => {
			expect(validateCnpj('11.222.333/0001-81')).toEqual({
				valid: true,
				formatted: '11.222.333/0001-81',
				input: '11.222.333/0001-81',
			});
		});

		it('should validate real company CNPJs', () => {
			// Banco do Brasil — leading zeros edge case
			expect(validateCnpj('00000000000191').valid).toBe(true);
			// Petrobras
			expect(validateCnpj('33000167000101').valid).toBe(true);
			// Itau Unibanco
			expect(validateCnpj('60701190000104').valid).toBe(true);
			// Vale SA
			expect(validateCnpj('33592510000154').valid).toBe(true);
			// Caixa Economica Federal — leading zeros
			expect(validateCnpj('00360305000104').valid).toBe(true);
			// Bradesco
			expect(validateCnpj('60746948000112').valid).toBe(true);
			// Correios
			expect(validateCnpj('34028316000103').valid).toBe(true);
		});

		it('should validate CNPJ with both check digits = 0 (Ambev)', () => {
			expect(validateCnpj('07526557000100').valid).toBe(true);
		});

		it('should validate generated CNPJs with various patterns', () => {
			expect(validateCnpj('12345678000195').valid).toBe(true); // sequential base
			expect(validateCnpj('98765432000198').valid).toBe(true); // reverse sequential
			expect(validateCnpj('10020030000113').valid).toBe(true); // sparse digits
		});

		it('should validate CNPJ where second check digit remainder < 2', () => {
			expect(validateCnpj('80000000000040').valid).toBe(true);
		});
	});

	describe('invalid CNPJs', () => {
		it('should reject all 10 same-digit CNPJs', () => {
			for (let d = 0; d <= 9; d++) {
				const cnpj = String(d).repeat(14);
				expect(validateCnpj(cnpj).valid).toBe(false);
			}
		});

		it('should reject CNPJ with wrong check digits', () => {
			expect(validateCnpj('11222333000199').valid).toBe(false);
			expect(validateCnpj('12345678000100').valid).toBe(false); // correct: -95
		});

		it('should reject CNPJ with valid d1 but invalid d2', () => {
			expect(validateCnpj('11222333000182').valid).toBe(false);
		});

		it('should reject CNPJ with wrong length', () => {
			expect(validateCnpj('1234567890').valid).toBe(false);     // too short
			expect(validateCnpj('1234567800019').valid).toBe(false);  // 13 digits
			expect(validateCnpj('123456780001950').valid).toBe(false); // 15 digits
		});

		it('should reject empty string', () => {
			expect(validateCnpj('').valid).toBe(false);
		});

		it('should reject non-numeric input', () => {
			expect(validateCnpj('ab.cde.fgh/ijkl-mn').valid).toBe(false);
		});
	});
});

// =============================================================================
// CPF Validation
// =============================================================================

describe('validateCpf', () => {
	describe('valid CPFs', () => {
		it('should validate unformatted CPF', () => {
			expect(validateCpf('52998224725')).toEqual({
				valid: true,
				formatted: '529.982.247-25',
				input: '52998224725',
			});
		});

		it('should validate formatted CPF', () => {
			expect(validateCpf('529.982.247-25')).toEqual({
				valid: true,
				formatted: '529.982.247-25',
				input: '529.982.247-25',
			});
		});

		it('should validate algorithmically generated CPFs', () => {
			expect(validateCpf('34708508018').valid).toBe(true); // region 0 (RS)
			expect(validateCpf('12345678909').valid).toBe(true); // sequential pattern
			expect(validateCpf('98765432100').valid).toBe(true); // reverse, d2=0
			expect(validateCpf('11144477735').valid).toBe(true);
			expect(validateCpf('45317828791').valid).toBe(true);
			expect(validateCpf('31340280930').valid).toBe(true); // classic algorithm example
		});

		it('should validate CPF with leading zeros', () => {
			expect(validateCpf('00000000191').valid).toBe(true);
		});

		it('should validate CPF near maximum', () => {
			expect(validateCpf('99999999808').valid).toBe(true);
		});

		it('should validate CPF with both check digits = 0', () => {
			expect(validateCpf('00000003700').valid).toBe(true);
			expect(validateCpf('98765432100').valid).toBe(true);
		});

		it('should validate CPF where remainders are less than 2', () => {
			expect(validateCpf('12345678909').valid).toBe(true); // d1 remainder=1
			expect(validateCpf('74650688000').valid).toBe(true); // both remainders=0
		});
	});

	describe('invalid CPFs', () => {
		it('should reject all 10 same-digit CPFs (all pass checksum!)', () => {
			for (let d = 0; d <= 9; d++) {
				const cpf = String(d).repeat(11);
				expect(validateCpf(cpf).valid).toBe(false);
			}
		});

		it('should reject CPF with wrong check digits', () => {
			expect(validateCpf('52998224799').valid).toBe(false);
			expect(validateCpf('12345678900').valid).toBe(false); // correct: -09
		});

		it('should reject CPF with valid d1 but invalid d2', () => {
			expect(validateCpf('52998224726').valid).toBe(false);
		});

		it('should reject CPF with wrong length', () => {
			expect(validateCpf('1234567890').valid).toBe(false);   // 10 digits
			expect(validateCpf('123456789012').valid).toBe(false); // 12 digits
			expect(validateCpf('12345678').valid).toBe(false);     // 8 digits
		});

		it('should reject empty string', () => {
			expect(validateCpf('').valid).toBe(false);
		});

		it('should reject non-numeric input', () => {
			expect(validateCpf('abc.def.ghi-jk').valid).toBe(false);
		});
	});
});

describe('sanitizeCpf', () => {
	it('should strip formatting characters', () => {
		expect(sanitizeCpf('529.982.247-25')).toBe('52998224725');
	});

	it('should return digits-only input unchanged', () => {
		expect(sanitizeCpf('52998224725')).toBe('52998224725');
	});
});

// =============================================================================
// CEP Validation
// =============================================================================

describe('validateCep', () => {
	describe('valid CEPs', () => {
		it('should validate unformatted CEP', () => {
			expect(validateCep('01001000')).toEqual({
				valid: true,
				formatted: '01001-000',
				input: '01001000',
			});
		});

		it('should validate formatted CEP', () => {
			expect(validateCep('01001-000')).toEqual({
				valid: true,
				formatted: '01001-000',
				input: '01001-000',
			});
		});

		it('should validate famous CEPs across Brazil', () => {
			expect(validateCep('01001000').valid).toBe(true); // Praca da Se, SP
			expect(validateCep('01310100').valid).toBe(true); // Av. Paulista, SP
			expect(validateCep('20040020').valid).toBe(true); // Centro, RJ
			expect(validateCep('30130000').valid).toBe(true); // Belo Horizonte, MG
			expect(validateCep('40020000').valid).toBe(true); // Salvador, BA
			expect(validateCep('70040020').valid).toBe(true); // Brasilia, DF
			expect(validateCep('80010000').valid).toBe(true); // Curitiba, PR
			expect(validateCep('90010000').valid).toBe(true); // Porto Alegre, RS
		});

		it('should validate minimum valid CEP (01000-000)', () => {
			expect(validateCep('01000000').valid).toBe(true);
			expect(validateCep('01000-000').valid).toBe(true);
		});

		it('should validate maximum valid CEP (99999-999)', () => {
			expect(validateCep('99999999').valid).toBe(true);
		});
	});

	describe('invalid CEPs', () => {
		it('should reject all-zeros CEP', () => {
			expect(validateCep('00000000').valid).toBe(false);
		});

		it('should reject CEPs below minimum range (00xxx-xxx)', () => {
			expect(validateCep('00010000').valid).toBe(false); // the bug the user found
			expect(validateCep('00010-000').valid).toBe(false);
			expect(validateCep('00100000').valid).toBe(false);
			expect(validateCep('00999999').valid).toBe(false);
			expect(validateCep('00000001').valid).toBe(false);
			expect(validateCep('00500000').valid).toBe(false);
		});

		it('should reject CEP with wrong length', () => {
			expect(validateCep('1234567').valid).toBe(false);   // 7 digits
			expect(validateCep('123456789').valid).toBe(false); // 9 digits
		});

		it('should reject empty string', () => {
			expect(validateCep('').valid).toBe(false);
		});

		it('should reject non-numeric input', () => {
			expect(validateCep('ABCDE-FGH').valid).toBe(false);
		});
	});
});

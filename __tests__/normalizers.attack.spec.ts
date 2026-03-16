/**
 * ATTACK TESTS for all normalizers.
 *
 * Each test is classified:
 *   FIXED  = previously crashed/produced wrong output, now handled gracefully
 *   PASS   = the normalizer handles the edge case correctly
 *   NOTED  = behavior is documented (e.g. XSS/SQLi passthrough — expected for backend)
 *
 * Vectors: malformed API responses, unexpected types, missing fields,
 * XSS/SQLi passthrough, ViaCEP error variants, large payloads.
 */
import { normalizeCnpj } from '../nodes/BrasilHub/resources/cnpj/cnpj.normalize';
import { normalizeCep } from '../nodes/BrasilHub/resources/cep/cep.normalize';
import { normalizeBank, normalizeBanks } from '../nodes/BrasilHub/resources/banks/banks.normalize';
import { normalizeDdd } from '../nodes/BrasilHub/resources/ddd/ddd.normalize';
import { safeStr } from '../nodes/BrasilHub/shared/utils';

// ─────────────────────────────────────────────────────────────
// VECTOR 1: Malformed API responses (null, undefined, "", 42, true)
// ─────────────────────────────────────────────────────────────
describe('VECTOR 1: Malformed API responses', () => {
	// ── FIXED: null/undefined no longer crash — coerced to {} producing empty defaults ──

	describe('normalizeCnpj — FIXED: null/undefined produce empty defaults', () => {
		for (const value of [null, undefined] as const) {
			for (const provider of ['brasilapi', 'cnpjws', 'receitaws'] as const) {
				it(`${String(value)} (${provider}) → empty defaults`, () => {
					const result = normalizeCnpj(value, provider);
					expect(result.cnpj).toBe('');
					expect(result.razao_social).toBe('');
					expect(result.capital_social).toBe(0);
					expect(result.socios).toEqual([]);
				});
			}
		}
	});

	describe('normalizeCnpj — PASS: handles "", 42, true gracefully', () => {
		for (const value of ['', 42, true] as const) {
			for (const provider of ['brasilapi', 'cnpjws', 'receitaws'] as const) {
				it(`${JSON.stringify(value)} (${provider})`, () => {
					expect(() => normalizeCnpj(value, provider)).not.toThrow();
				});
			}
		}
	});

	describe('normalizeCep — FIXED: null/undefined produce empty defaults', () => {
		for (const value of [null, undefined] as const) {
			for (const provider of ['brasilapi', 'opencep'] as const) {
				it(`${String(value)} (${provider}) → empty defaults`, () => {
					const result = normalizeCep(value, provider);
					expect(result.cep).toBe('');
					expect(result.logradouro).toBe('');
				});
			}
		}
	});

	describe('normalizeCep — FIXED: null/undefined with viacep produce empty defaults', () => {
		// viacep: (null ?? {}).erro is undefined → falsy → no throw → produces empty defaults
		for (const value of [null, undefined] as const) {
			it(`${String(value)} (viacep) → empty defaults`, () => {
				const result = normalizeCep(value, 'viacep');
				expect(result.cep).toBe('');
			});
		}
	});

	describe('normalizeCep — PASS: handles "", 42, true gracefully', () => {
		for (const value of ['', 42, true] as const) {
			for (const provider of ['brasilapi', 'opencep'] as const) {
				it(`${JSON.stringify(value)} (${provider})`, () => {
					expect(() => normalizeCep(value, provider)).not.toThrow();
				});
			}
		}
		it('true (viacep) does not throw', () => {
			expect(() => normalizeCep(true, 'viacep')).not.toThrow();
		});
		it('"" (viacep) does not throw', () => {
			expect(() => normalizeCep('', 'viacep')).not.toThrow();
		});
		it('42 (viacep) does not throw', () => {
			expect(() => normalizeCep(42, 'viacep')).not.toThrow();
		});
	});

	describe('normalizeBank — FIXED: null/undefined produce empty defaults', () => {
		for (const value of [null, undefined] as const) {
			it(`${String(value)} (brasilapi) → empty defaults`, () => {
				const result = normalizeBank(value, 'brasilapi');
				expect(result.code).toBe(0);
				expect(result.name).toBe('');
			});
		}
	});

	describe('normalizeBank — PASS: handles "", 42, true', () => {
		it('"" (brasilapi)', () => {
			expect(() => normalizeBank('', 'brasilapi')).not.toThrow();
		});
		it('42 (brasilapi)', () => {
			expect(() => normalizeBank(42, 'brasilapi')).not.toThrow();
		});
		it('true (brasilapi)', () => {
			expect(() => normalizeBank(true, 'brasilapi')).not.toThrow();
		});
	});

	describe('normalizeBanks — FIXED: non-array data returns empty array', () => {
		// normalizeBanks now has Array.isArray guard — non-array → []
		it.each([
			['null', null],
			['undefined', undefined],
			['{}', {}],
			['42', 42],
			['true', true],
			['""', ''],
		])('%s → empty array', (_label, value) => {
			const result = normalizeBanks(value, 'brasilapi');
			expect(result).toEqual([]);
		});
	});

	describe('normalizeDdd — FIXED: null/undefined produce empty defaults', () => {
		for (const value of [null, undefined] as const) {
			it(`${String(value)} (brasilapi) → empty defaults`, () => {
				const result = normalizeDdd(value, 'brasilapi');
				expect(result.state).toBe('');
				expect(result.cities).toEqual([]);
			});
		}
	});

	describe('normalizeDdd — PASS: handles "", 42, true', () => {
		it('"" (brasilapi)', () => {
			expect(() => normalizeDdd('', 'brasilapi')).not.toThrow();
		});
		it('42 (brasilapi)', () => {
			expect(() => normalizeDdd(42, 'brasilapi')).not.toThrow();
		});
		it('true (brasilapi)', () => {
			expect(() => normalizeDdd(true, 'brasilapi')).not.toThrow();
		});
	});
});

// ─────────────────────────────────────────────────────────────
// VECTOR 2: Unexpected nested types — all PASS
// ─────────────────────────────────────────────────────────────
describe('VECTOR 2: Unexpected nested types', () => {
	it('PASS — CNPJ: qsa as string instead of array (brasilapi)', () => {
		const data = { qsa: 'not an array', cnpj: '12345678000100' };
		const result = normalizeCnpj(data, 'brasilapi');
		expect(result.socios).toEqual([]);
	});

	it('PASS — CNPJ: qsa as number (brasilapi)', () => {
		const data = { qsa: 999 };
		const result = normalizeCnpj(data, 'brasilapi');
		expect(result.socios).toEqual([]);
	});

	it('PASS — CNPJ: qsa as null (brasilapi)', () => {
		const data = { qsa: null };
		const result = normalizeCnpj(data, 'brasilapi');
		expect(result.socios).toEqual([]);
	});

	it('PASS — CNPJ: socios as string instead of array (cnpjws)', () => {
		const data = { socios: 'not an array', estabelecimento: {} };
		const result = normalizeCnpj(data, 'cnpjws');
		expect(result.socios).toEqual([]);
	});

	it('PASS — CNPJ: atividade_principal as string instead of array (receitaws)', () => {
		const data = { atividade_principal: 'not an array' };
		const result = normalizeCnpj(data, 'receitaws');
		expect(result.atividade_principal.codigo).toBe('');
		expect(result.atividade_principal.descricao).toBe('');
	});

	it('PASS — DDD: cities as number instead of array (brasilapi)', () => {
		const data = { cities: 42, state: 'SP' };
		const result = normalizeDdd(data, 'brasilapi');
		expect(result.cities).toEqual([]);
	});

	it('PASS — DDD: cities as string instead of array (brasilapi)', () => {
		const data = { cities: 'Sao Paulo', state: 'SP' };
		const result = normalizeDdd(data, 'brasilapi');
		expect(result.cities).toEqual([]);
	});

	it('PASS — DDD: cities as null (brasilapi)', () => {
		const data = { cities: null, state: 'SP' };
		const result = normalizeDdd(data, 'brasilapi');
		expect(result.cities).toEqual([]);
	});

	it('PASS — Banks: code as object {} (brasilapi) → falls back to 0', () => {
		const data = { code: {}, name: 'Test', fullName: 'Test Bank', ispb: '00000000' };
		const result = normalizeBank(data, 'brasilapi');
		expect(result.code).toBe(0);
	});

	it('PASS — Banks: code as string "237" (brasilapi) → falls back to 0', () => {
		const data = { code: '237', name: 'Bradesco', fullName: 'Banco Bradesco', ispb: '60746948' };
		const result = normalizeBank(data, 'brasilapi');
		expect(result.code).toBe(0);
	});

	it('PASS — Banks: code as null (brasilapi) → falls back to 0', () => {
		const data = { code: null, name: 'Test', fullName: 'Test', ispb: '00000000' };
		const result = normalizeBank(data, 'brasilapi');
		expect(result.code).toBe(0);
	});

	it('PASS — CNPJ: estabelecimento as string instead of object (cnpjws)', () => {
		const data = { estabelecimento: 'not an object' };
		expect(() => normalizeCnpj(data, 'cnpjws')).not.toThrow();
	});

	describe('CNPJ capital_social type coercion', () => {
		it('FIXED — brasilapi: "abc" → 0 (safeCapital guards NaN)', () => {
			const result = normalizeCnpj({ capital_social: 'abc' }, 'brasilapi');
			expect(result.capital_social).toBe(0);
		});

		it('PASS — brasilapi: capital_social null → 0', () => {
			const result = normalizeCnpj({ capital_social: null }, 'brasilapi');
			expect(result.capital_social).toBe(0);
		});

		it('PASS — brasilapi: capital_social undefined → 0', () => {
			const result = normalizeCnpj({}, 'brasilapi');
			expect(result.capital_social).toBe(0);
		});
	});
});

// ─────────────────────────────────────────────────────────────
// VECTOR 3: Extremely large responses — all PASS
// ─────────────────────────────────────────────────────────────
describe('VECTOR 3: Extremely large responses', () => {
	it('PASS — normalizeBanks handles 100,000 entries', () => {
		const largeBanks = Array.from({ length: 100_000 }, (_, i) => ({
			code: i,
			name: `Bank ${i}`,
			fullName: `Full Bank Name ${i}`,
			ispb: String(i).padStart(8, '0'),
		}));
		const result = normalizeBanks(largeBanks, 'brasilapi');
		expect(result).toHaveLength(100_000);
		expect(result[0].code).toBe(0);
		expect(result[99_999].code).toBe(99_999);
	});

	it('PASS — normalizeCnpj handles QSA with 10,000 socios', () => {
		const data = {
			cnpj: '12345678000100',
			qsa: Array.from({ length: 10_000 }, (_, i) => ({
				nome_socio: `Socio ${i}`,
				cnpj_cpf_do_socio: `000.000.000-${String(i).padStart(2, '0')}`,
				qualificacao_socio: 'Socio',
				data_entrada_sociedade: '2020-01-01',
			})),
		};
		const result = normalizeCnpj(data, 'brasilapi');
		expect(result.socios).toHaveLength(10_000);
	});

	it('PASS — DDD with 50,000 cities', () => {
		const data = {
			state: 'SP',
			cities: Array.from({ length: 50_000 }, (_, i) => `City ${i}`),
		};
		const result = normalizeDdd(data, 'brasilapi');
		expect(result.cities).toHaveLength(50_000);
	});
});

// ─────────────────────────────────────────────────────────────
// VECTOR 4: Missing required fields (empty objects) — all PASS
// ─────────────────────────────────────────────────────────────
describe('VECTOR 4: Missing required fields (empty objects)', () => {
	it('PASS — normalizeCnpj with {} (brasilapi)', () => {
		const result = normalizeCnpj({}, 'brasilapi');
		expect(result.cnpj).toBe('');
		expect(result.razao_social).toBe('');
		expect(result.socios).toEqual([]);
		expect(result.atividade_principal.codigo).toBe('');
		expect(result.endereco.logradouro).toBe('');
		expect(result.contato.telefone).toBe('');
		expect(result.contato.email).toBe('');
	});

	it('PASS — normalizeCnpj with {} (cnpjws)', () => {
		const result = normalizeCnpj({}, 'cnpjws');
		expect(result.cnpj).toBe('');
		expect(result.endereco.municipio).toBe('');
		expect(result.endereco.uf).toBe('');
		expect(result.atividade_principal.codigo).toBe('');
		expect(result.socios).toEqual([]);
	});

	it('PASS — normalizeCnpj with {} (receitaws)', () => {
		const result = normalizeCnpj({}, 'receitaws');
		expect(result.cnpj).toBe('');
		expect(result.atividade_principal.codigo).toBe('');
		expect(result.atividade_principal.descricao).toBe('');
		expect(result.socios).toEqual([]);
	});

	it('PASS — normalizeCep with {} (brasilapi)', () => {
		const result = normalizeCep({}, 'brasilapi');
		expect(result.cep).toBe('');
		expect(result.logradouro).toBe('');
		expect(result.cidade).toBe('');
	});

	it('PASS — normalizeCep with {} (viacep)', () => {
		// {}.erro is undefined → falsy → no throw
		const result = normalizeCep({}, 'viacep');
		expect(result.cep).toBe('');
	});

	it('PASS — normalizeCep with {} (opencep)', () => {
		const result = normalizeCep({}, 'opencep');
		expect(result.cep).toBe('');
	});

	it('PASS — normalizeBank with {} (brasilapi)', () => {
		const result = normalizeBank({}, 'brasilapi');
		expect(result.code).toBe(0);
		expect(result.name).toBe('');
		expect(result.fullName).toBe('');
		expect(result.ispb).toBe('');
	});

	it('PASS — normalizeDdd with {} (brasilapi)', () => {
		const result = normalizeDdd({}, 'brasilapi');
		expect(result.state).toBe('');
		expect(result.cities).toEqual([]);
	});
});

// ─────────────────────────────────────────────────────────────
// VECTOR 5: XSS in API data — all NOTED (expected backend behavior)
// ─────────────────────────────────────────────────────────────
describe('VECTOR 5: XSS in API data (NOTED — passthrough expected for backend)', () => {
	const xssPayload = '<script>alert("xss")</script>';

	it('NOTED — safeStr passes XSS through unchanged', () => {
		expect(safeStr(xssPayload)).toBe(xssPayload);
	});

	it('NOTED — CNPJ company name with XSS passes through', () => {
		const data = { razao_social: xssPayload, nome_fantasia: xssPayload };
		const result = normalizeCnpj(data, 'brasilapi');
		expect(result.razao_social).toBe(xssPayload);
		expect(result.nome_fantasia).toBe(xssPayload);
	});

	it('NOTED — CEP city with XSS passes through', () => {
		const data = { city: xssPayload, cep: '01001000' };
		const result = normalizeCep(data, 'brasilapi');
		expect(result.cidade).toBe(xssPayload);
	});

	it('NOTED — Banks name with XSS passes through', () => {
		const data = { code: 1, name: xssPayload, fullName: xssPayload, ispb: '00000000' };
		const result = normalizeBank(data, 'brasilapi');
		expect(result.name).toBe(xssPayload);
	});

	it('NOTED — DDD cities with XSS passes through', () => {
		const data = { state: 'SP', cities: [xssPayload] };
		const result = normalizeDdd(data, 'brasilapi');
		expect(result.cities[0]).toBe(xssPayload);
	});
});

// ─────────────────────────────────────────────────────────────
// VECTOR 6: SQL injection in API data — all NOTED (expected backend behavior)
// ─────────────────────────────────────────────────────────────
describe('VECTOR 6: SQL injection in API data (NOTED — passthrough expected for backend)', () => {
	const sqli = "'; DROP TABLE cities--";

	it('NOTED — safeStr passes SQL injection through unchanged', () => {
		expect(safeStr(sqli)).toBe(sqli);
	});

	it('NOTED — CNPJ with SQL injection in razao_social passes through', () => {
		const result = normalizeCnpj({ razao_social: sqli }, 'brasilapi');
		expect(result.razao_social).toBe(sqli);
	});

	it('NOTED — CEP with SQL injection in city passes through', () => {
		const result = normalizeCep({ city: sqli }, 'brasilapi');
		expect(result.cidade).toBe(sqli);
	});

	it('NOTED — DDD with SQL injection in city name passes through', () => {
		const result = normalizeDdd({ state: 'SP', cities: [sqli] }, 'brasilapi');
		expect(result.cities[0]).toBe(sqli);
	});
});

// ─────────────────────────────────────────────────────────────
// VECTOR 7: ViaCEP error detection variants — all PASS
// ─────────────────────────────────────────────────────────────
describe('VECTOR 7: ViaCEP error detection variants', () => {
	it('PASS — {erro: true} throws "CEP not found"', () => {
		expect(() => normalizeCep({ erro: true }, 'viacep')).toThrow('CEP not found');
	});

	it('PASS — {erro: 1} (truthy number) throws "CEP not found"', () => {
		expect(() => normalizeCep({ erro: 1 }, 'viacep')).toThrow('CEP not found');
	});

	it('PASS — {erro: "true"} (truthy string) throws "CEP not found"', () => {
		expect(() => normalizeCep({ erro: 'true' }, 'viacep')).toThrow('CEP not found');
	});

	it('PASS — {erro: false} does NOT throw', () => {
		expect(() => normalizeCep({ erro: false }, 'viacep')).not.toThrow();
	});

	it('PASS — {erro: 0} (falsy number) does NOT throw', () => {
		expect(() => normalizeCep({ erro: 0 }, 'viacep')).not.toThrow();
	});

	it('PASS — {erro: ""} (empty string) does NOT throw', () => {
		expect(() => normalizeCep({ erro: '' }, 'viacep')).not.toThrow();
	});

	it('PASS — {erro: null} does NOT throw', () => {
		expect(() => normalizeCep({ erro: null }, 'viacep')).not.toThrow();
	});

	it('PASS — {erro: undefined} does NOT throw', () => {
		expect(() => normalizeCep({ erro: undefined }, 'viacep')).not.toThrow();
	});

	it('PASS — OpenCEP ignores erro field entirely', () => {
		const result = normalizeCep({ erro: true, cep: '01001000' }, 'opencep');
		expect(result.cep).toBe('01001000');
	});
});

// ─────────────────────────────────────────────────────────────
// EDGE: normalizeBanks with non-array data — FIXED (Array.isArray guard)
// ─────────────────────────────────────────────────────────────
describe('EDGE: normalizeBanks non-array — FIXED (Array.isArray guard)', () => {
	it.each([
		['null', null],
		['{}', {}],
		['"string"', 'not an array'],
		['42', 42],
	])('FIXED — normalizeBanks(%s) → empty array', (_label, value) => {
		const result = normalizeBanks(value, 'brasilapi');
		expect(result).toEqual([]);
	});
});

// ─────────────────────────────────────────────────────────────
// EDGE: normalizeBank bancosbrasileiros with non-array data — FIXED
// ─────────────────────────────────────────────────────────────
describe('EDGE: normalizeBank bancosbrasileiros non-array — FIXED', () => {
	// Non-array data → Array.isArray returns false → [] → find returns undefined → "Bank code X not found"
	it('FIXED — normalizeBank(null, "bancosbrasileiros", 1) → "Bank code 1 not found"', () => {
		expect(() => normalizeBank(null, 'bancosbrasileiros', 1)).toThrow('Bank code 1 not found');
	});

	it('FIXED — normalizeBank({}, "bancosbrasileiros", 1) → "Bank code 1 not found"', () => {
		expect(() => normalizeBank({}, 'bancosbrasileiros', 1)).toThrow('Bank code 1 not found');
	});

	it('FIXED — normalizeBank("string", "bancosbrasileiros", 1) → "Bank code 1 not found"', () => {
		expect(() => normalizeBank('not an array', 'bancosbrasileiros', 1)).toThrow('Bank code 1 not found');
	});
});

// ─────────────────────────────────────────────────────────────
// EDGE: normalizeDdd municipios with non-array data — FIXED
// ─────────────────────────────────────────────────────────────
describe('EDGE: normalizeDdd municipios non-array — FIXED', () => {
	// Non-array data → Array.isArray returns false → [] → no matches → "DDD X not found"
	it('FIXED — normalizeDdd(null, "municipios", 11) → "DDD 11 not found"', () => {
		expect(() => normalizeDdd(null, 'municipios', 11)).toThrow('DDD 11 not found');
	});

	it('FIXED — normalizeDdd({}, "municipios", 11) → "DDD 11 not found"', () => {
		expect(() => normalizeDdd({}, 'municipios', 11)).toThrow('DDD 11 not found');
	});

	it('FIXED — normalizeDdd("string", "municipios", 11) → "DDD 11 not found"', () => {
		expect(() => normalizeDdd('hello', 'municipios', 11)).toThrow('DDD 11 not found');
	});
});

// ─────────────────────────────────────────────────────────────
// EDGE: safeStr edge cases — all PASS
// ─────────────────────────────────────────────────────────────
describe('EDGE: safeStr edge cases', () => {
	it('PASS — returns "" for null', () => expect(safeStr(null)).toBe(''));
	it('PASS — returns "" for undefined', () => expect(safeStr(undefined)).toBe(''));
	it('PASS — returns "" for object {}', () => expect(safeStr({})).toBe(''));
	it('PASS — returns "" for array []', () => expect(safeStr([])).toBe(''));
	it('PASS — returns "" for nested object', () => expect(safeStr({ a: 1 })).toBe(''));
	it('PASS — returns "42" for number 42', () => expect(safeStr(42)).toBe('42'));
	it('PASS — returns "0" for number 0', () => expect(safeStr(0)).toBe('0'));
	it('PASS — returns "true" for boolean true', () => expect(safeStr(true)).toBe('true'));
	it('PASS — returns "false" for boolean false', () => expect(safeStr(false)).toBe('false'));
	it('PASS — returns "NaN" for NaN', () => expect(safeStr(NaN)).toBe('NaN'));
	it('PASS — returns "Infinity" for Infinity', () => expect(safeStr(Infinity)).toBe('Infinity'));
	it('PASS — returns "" for Symbol', () => expect(safeStr(Symbol('test'))).toBe(''));
	it('PASS — returns "" for function', () => expect(safeStr(() => {})).toBe(''));
	it('PASS — preserves empty string ""', () => expect(safeStr('')).toBe(''));
	it('PASS — preserves whitespace " "', () => expect(safeStr(' ')).toBe(' '));
});

// ─────────────────────────────────────────────────────────────
// EDGE: Unknown provider — all PASS
// ─────────────────────────────────────────────────────────────
describe('EDGE: Unknown provider throws', () => {
	it('PASS — normalizeCnpj', () => {
		expect(() => normalizeCnpj({}, 'unknown')).toThrow('Unknown CNPJ provider: unknown');
	});
	it('PASS — normalizeCep', () => {
		expect(() => normalizeCep({}, 'unknown')).toThrow('Unknown CEP provider: unknown');
	});
	it('PASS — normalizeBank', () => {
		expect(() => normalizeBank({}, 'unknown')).toThrow('Unknown bank provider: unknown');
	});
	it('PASS — normalizeBanks', () => {
		expect(() => normalizeBanks([], 'unknown')).toThrow('Unknown bank provider: unknown');
	});
	it('PASS — normalizeDdd', () => {
		expect(() => normalizeDdd({}, 'unknown')).toThrow('Unknown DDD provider: unknown');
	});
});

// ─────────────────────────────────────────────────────────────
// EDGE: capital_social coercion across providers — FIXED
// ─────────────────────────────────────────────────────────────
describe('EDGE: capital_social coercion', () => {
	it('FIXED — brasilapi: "abc" → 0 (safeCapital guards NaN)', () => {
		const result = normalizeCnpj({ capital_social: 'abc' }, 'brasilapi');
		expect(result.capital_social).toBe(0);
	});

	it('PASS — brasilapi: undefined capital_social → 0', () => {
		const result = normalizeCnpj({}, 'brasilapi');
		expect(result.capital_social).toBe(0);
	});

	it('PASS — brasilapi: null capital_social → 0', () => {
		const result = normalizeCnpj({ capital_social: null }, 'brasilapi');
		expect(result.capital_social).toBe(0);
	});

	it('PASS — brasilapi: Number("1000.50") works', () => {
		const result = normalizeCnpj({ capital_social: '1000.50' }, 'brasilapi');
		expect(result.capital_social).toBe(1000.5);
	});

	it('FIXED — receitaws: "abc" → 0 (safeCapital guards NaN)', () => {
		const result = normalizeCnpj({ capital_social: 'abc' }, 'receitaws');
		expect(result.capital_social).toBe(0);
	});

	it('PASS — receitaws: parseFloat("1000.50") works', () => {
		const result = normalizeCnpj({ capital_social: '1000.50' }, 'receitaws');
		expect(result.capital_social).toBe(1000.5);
	});

	it('FIXED — cnpjws: "abc" → 0 (safeCapital guards NaN)', () => {
		const result = normalizeCnpj({ capital_social: 'abc' }, 'cnpjws');
		expect(result.capital_social).toBe(0);
	});
});

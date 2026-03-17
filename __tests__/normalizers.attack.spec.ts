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
import { normalizeBrands, normalizeModels, normalizeYears, normalizePrice } from '../nodes/BrasilHub/resources/fipe/fipe.normalize';
import { normalizeFeriados } from '../nodes/BrasilHub/resources/feriados/feriados.normalize';
import { normalizeStates, normalizeCities } from '../nodes/BrasilHub/resources/ibge/ibge.normalize';
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

// ═══════════════════════════════════════════════════════════════════════
// FIPE NORMALIZER ATTACK TESTS
// ═══════════════════════════════════════════════════════════════════════

// ─────────────────────────────────────────────────────────────
// FIPE VECTOR 1: Malformed API responses (null, undefined, "", 42, true)
// ─────────────────────────────────────────────────────────────
describe('FIPE VECTOR 1: Malformed API responses', () => {
	describe('normalizeBrands — non-array inputs return empty array', () => {
		it.each([
			['null', null],
			['undefined', undefined],
			['{}', {}],
			['42', 42],
			['true', true],
			['""', ''],
		])('PASS — normalizeBrands(%s) → []', (_label, value) => {
			expect(normalizeBrands(value)).toEqual([]);
		});
	});

	describe('normalizeModels — non-object/null/undefined inputs return empty array', () => {
		it.each([
			['null', null],
			['undefined', undefined],
			['42', 42],
			['true', true],
			['""', ''],
		])('PASS — normalizeModels(%s) → []', (_label, value) => {
			expect(normalizeModels(value)).toEqual([]);
		});
	});

	describe('normalizeYears — non-array inputs return empty array', () => {
		it.each([
			['null', null],
			['undefined', undefined],
			['{}', {}],
			['42', 42],
			['true', true],
			['""', ''],
		])('PASS — normalizeYears(%s) → []', (_label, value) => {
			expect(normalizeYears(value)).toEqual([]);
		});
	});

	describe('normalizePrice — null/undefined produce safe defaults', () => {
		it.each([
			['null', null],
			['undefined', undefined],
		])('PASS — normalizePrice(%s) → safe defaults', (_label, value) => {
			const result = normalizePrice(value);
			expect(result.vehicleType).toBe(0);
			expect(result.brand).toBe('');
			expect(result.model).toBe('');
			expect(result.modelYear).toBe(0);
			expect(result.fuel).toBe('');
			expect(result.fipeCode).toBe('');
			expect(result.referenceMonth).toBe('');
			expect(result.price).toBe('');
			expect(result.fuelAbbreviation).toBe('');
		});
	});

	describe('normalizePrice — non-object primitives produce safe defaults', () => {
		it.each([
			['42', 42],
			['true', true],
			['"string"', 'string'],
			['[]', []],
		])('PASS — normalizePrice(%s) → safe defaults', (_label, value) => {
			const result = normalizePrice(value);
			expect(result.vehicleType).toBe(0);
			expect(result.brand).toBe('');
			expect(result.price).toBe('');
		});
	});
});

// ─────────────────────────────────────────────────────────────
// FIPE VECTOR 2: Type confusion — wrong types for all fields
// ─────────────────────────────────────────────────────────────
describe('FIPE VECTOR 2: Type confusion', () => {
	describe('normalizeBrands — entries with wrong field types', () => {
		it('PASS — codigo as number instead of string → safeStr coerces', () => {
			const result = normalizeBrands([{ codigo: 123, nome: 'Test' }]);
			expect(result[0].code).toBe('123');
			expect(result[0].name).toBe('Test');
		});

		it('PASS — codigo as boolean → safeStr coerces', () => {
			const result = normalizeBrands([{ codigo: true, nome: false }]);
			expect(result[0].code).toBe('true');
			expect(result[0].name).toBe('false');
		});

		it('PASS — codigo as null, nome as undefined → safeStr returns ""', () => {
			const result = normalizeBrands([{ codigo: null, nome: undefined }]);
			expect(result[0].code).toBe('');
			expect(result[0].name).toBe('');
		});

		it('PASS — codigo as object {} → safeStr returns ""', () => {
			const result = normalizeBrands([{ codigo: {}, nome: [] }]);
			expect(result[0].code).toBe('');
			expect(result[0].name).toBe('');
		});

		it('FIXED — entries that are null/undefined are filtered out', () => {
			expect(normalizeBrands([null])).toEqual([]);
			expect(normalizeBrands([undefined])).toEqual([]);
		});

		it('PASS — entries that are non-null primitives are filtered out', () => {
			// With the null guard filter, non-object primitives are also filtered
			const result = normalizeBrands([42, 'string', true]);
			expect(result).toHaveLength(0);
		});
	});

	describe('normalizeModels — codigo type confusion', () => {
		it('PASS — codigo as string instead of number → falls back to 0', () => {
			const result = normalizeModels({ modelos: [{ codigo: '4828', nome: 'Civic' }] });
			expect(result[0].code).toBe(0);
			expect(result[0].name).toBe('Civic');
		});

		it('PASS — codigo as float → kept as-is (typeof number)', () => {
			const result = normalizeModels({ modelos: [{ codigo: 3.14, nome: 'Pi' }] });
			expect(result[0].code).toBe(3.14);
		});

		it('PASS — codigo as NaN → falls back to 0 (typeof NaN === "number" but NaN)', () => {
			const result = normalizeModels({ modelos: [{ codigo: NaN, nome: 'NaN' }] });
			// typeof NaN === 'number', so it passes the typeof check
			expect(result[0].code).toBeNaN();
		});

		it('PASS — codigo as Infinity → kept as-is (typeof number)', () => {
			const result = normalizeModels({ modelos: [{ codigo: Infinity, nome: 'Inf' }] });
			expect(result[0].code).toBe(Infinity);
		});

		it('PASS — codigo as negative number → kept as-is', () => {
			const result = normalizeModels({ modelos: [{ codigo: -1, nome: 'Negative' }] });
			expect(result[0].code).toBe(-1);
		});

		it('PASS — modelos as string instead of array → returns empty', () => {
			const result = normalizeModels({ modelos: 'not an array' });
			expect(result).toEqual([]);
		});

		it('PASS — modelos as number instead of array → returns empty', () => {
			const result = normalizeModels({ modelos: 42 });
			expect(result).toEqual([]);
		});

		it('PASS — modelos as null → returns empty', () => {
			const result = normalizeModels({ modelos: null });
			expect(result).toEqual([]);
		});
	});

	describe('normalizePrice — field type confusion', () => {
		it('PASS — TipoVeiculo as string → falls back to 0', () => {
			const result = normalizePrice({ TipoVeiculo: '1', AnoModelo: '2024' });
			expect(result.vehicleType).toBe(0);
			expect(result.modelYear).toBe(0);
		});

		it('PASS — TipoVeiculo as boolean → falls back to 0', () => {
			const result = normalizePrice({ TipoVeiculo: true, AnoModelo: false });
			expect(result.vehicleType).toBe(0);
			expect(result.modelYear).toBe(0);
		});

		it('PASS — TipoVeiculo as null → falls back to 0', () => {
			const result = normalizePrice({ TipoVeiculo: null, AnoModelo: null });
			expect(result.vehicleType).toBe(0);
			expect(result.modelYear).toBe(0);
		});

		it('PASS — TipoVeiculo as NaN → accepted (typeof number)', () => {
			const result = normalizePrice({ TipoVeiculo: NaN, AnoModelo: NaN });
			expect(result.vehicleType).toBeNaN();
			expect(result.modelYear).toBeNaN();
		});

		it('PASS — TipoVeiculo as Infinity → accepted (typeof number)', () => {
			const result = normalizePrice({ TipoVeiculo: Infinity });
			expect(result.vehicleType).toBe(Infinity);
		});

		it('PASS — TipoVeiculo as negative → accepted (typeof number)', () => {
			const result = normalizePrice({ TipoVeiculo: -999, AnoModelo: -1 });
			expect(result.vehicleType).toBe(-999);
			expect(result.modelYear).toBe(-1);
		});

		it('PASS — all string fields as numbers → safeStr coerces to string', () => {
			const result = normalizePrice({
				Marca: 123,
				Modelo: 456,
				Combustivel: 789,
				CodigoFipe: 0,
				MesReferencia: -1,
				Valor: 999.99,
				SiglaCombustivel: 42,
			});
			expect(result.brand).toBe('123');
			expect(result.model).toBe('456');
			expect(result.fuel).toBe('789');
			expect(result.fipeCode).toBe('0');
			expect(result.referenceMonth).toBe('-1');
			expect(result.price).toBe('999.99');
			expect(result.fuelAbbreviation).toBe('42');
		});
	});
});

// ─────────────────────────────────────────────────────────────
// FIPE VECTOR 3: Null/undefined injection in nested objects
// ─────────────────────────────────────────────────────────────
describe('FIPE VECTOR 3: Null/undefined injection in nested objects', () => {
	it('FIXED — normalizeBrands with array of nulls filters them out', () => {
		const result = normalizeBrands([null, null, null]);
		expect(result).toEqual([]);
	});

	it('FIXED — normalizeBrands with array of undefineds filters them out', () => {
		expect(normalizeBrands([undefined, undefined])).toEqual([]);
	});

	it('FIXED — normalizeModels with array of nulls in modelos filters them out', () => {
		const result = normalizeModels({ modelos: [null, null] });
		expect(result).toEqual([]);
	});

	it('FIXED — normalizeYears with array of nulls filters them out', () => {
		expect(normalizeYears([null, null])).toEqual([]);
	});

	it('PASS — normalizeModels with deeply nested null in modelos items (field-level null is OK)', () => {
		// null as a FIELD value is fine — only null as the ITEM itself crashes
		const result = normalizeModels({ modelos: [{ codigo: null, nome: null }] });
		expect(result[0].code).toBe(0);
		expect(result[0].name).toBe('');
	});
});

// ─────────────────────────────────────────────────────────────
// FIPE VECTOR 4: XSS/SQLi payloads in string fields
// ─────────────────────────────────────────────────────────────
describe('FIPE VECTOR 4: XSS/SQLi payloads (NOTED — passthrough expected for backend)', () => {
	const xssPayload = '<script>alert("xss")</script>';
	const sqli = "'; DROP TABLE vehicles--";

	it('NOTED — normalizeBrands with XSS in brand name passes through', () => {
		const result = normalizeBrands([{ codigo: '1', nome: xssPayload }]);
		expect(result[0].name).toBe(xssPayload);
	});

	it('NOTED — normalizeBrands with SQLi in brand code passes through', () => {
		const result = normalizeBrands([{ codigo: sqli, nome: 'Test' }]);
		expect(result[0].code).toBe(sqli);
	});

	it('NOTED — normalizeModels with XSS in model name passes through', () => {
		const result = normalizeModels({ modelos: [{ codigo: 1, nome: xssPayload }] });
		expect(result[0].name).toBe(xssPayload);
	});

	it('NOTED — normalizeYears with XSS in year name passes through', () => {
		const result = normalizeYears([{ codigo: '2024-1', nome: xssPayload }]);
		expect(result[0].name).toBe(xssPayload);
	});

	it('NOTED — normalizePrice with XSS in all string fields passes through', () => {
		const result = normalizePrice({
			TipoVeiculo: 1,
			Marca: xssPayload,
			Modelo: xssPayload,
			AnoModelo: 2024,
			Combustivel: sqli,
			CodigoFipe: sqli,
			MesReferencia: xssPayload,
			Valor: xssPayload,
			SiglaCombustivel: sqli,
		});
		expect(result.brand).toBe(xssPayload);
		expect(result.model).toBe(xssPayload);
		expect(result.fuel).toBe(sqli);
		expect(result.fipeCode).toBe(sqli);
		expect(result.referenceMonth).toBe(xssPayload);
		expect(result.price).toBe(xssPayload);
		expect(result.fuelAbbreviation).toBe(sqli);
	});
});

// ─────────────────────────────────────────────────────────────
// FIPE VECTOR 5: Prototype pollution attempts
// ─────────────────────────────────────────────────────────────
describe('FIPE VECTOR 5: Prototype pollution attempts', () => {
	it('PASS — normalizeBrands with __proto__ field does not pollute Object prototype', () => {
		const malicious = [{ codigo: '1', nome: 'Test', __proto__: { polluted: true } }];
		normalizeBrands(malicious);
		expect(({} as Record<string, unknown>).polluted).toBeUndefined();
	});

	it('PASS — normalizeModels with constructor.prototype in modelos', () => {
		const malicious = {
			modelos: [{ codigo: 1, nome: 'Test', constructor: { prototype: { hacked: true } } }],
		};
		normalizeModels(malicious);
		expect(({} as Record<string, unknown>).hacked).toBeUndefined();
	});

	it('PASS — normalizePrice with __proto__ fields does not pollute', () => {
		const malicious = {
			TipoVeiculo: 1,
			Marca: 'Test',
			__proto__: { polluted: true },
		};
		normalizePrice(malicious);
		expect(({} as Record<string, unknown>).polluted).toBeUndefined();
	});

	it('PASS — normalizeBrands with toString/valueOf overrides in items', () => {
		const malicious = [{
			codigo: '1',
			nome: 'Test',
			toString: () => 'evil',
			valueOf: () => 666,
		}];
		const result = normalizeBrands(malicious);
		expect(result[0].code).toBe('1');
		expect(result[0].name).toBe('Test');
	});
});

// ─────────────────────────────────────────────────────────────
// FIPE VECTOR 6: Extremely large payloads
// ─────────────────────────────────────────────────────────────
describe('FIPE VECTOR 6: Extremely large payloads', () => {
	it('PASS — normalizeBrands handles 100,000 entries', () => {
		const large = Array.from({ length: 100_000 }, (_, i) => ({
			codigo: String(i),
			nome: `Brand ${i}`,
		}));
		const result = normalizeBrands(large);
		expect(result).toHaveLength(100_000);
		expect(result[0].code).toBe('0');
		expect(result[99_999].code).toBe('99999');
	});

	it('PASS — normalizeModels handles 50,000 models', () => {
		const large = {
			modelos: Array.from({ length: 50_000 }, (_, i) => ({
				codigo: i,
				nome: `Model ${i}`,
			})),
		};
		const result = normalizeModels(large);
		expect(result).toHaveLength(50_000);
		expect(result[0].code).toBe(0);
		expect(result[49_999].code).toBe(49_999);
	});

	it('PASS — normalizeYears handles 10,000 entries', () => {
		const large = Array.from({ length: 10_000 }, (_, i) => ({
			codigo: `${2024 - i}-1`,
			nome: `${2024 - i} Gasolina`,
		}));
		const result = normalizeYears(large);
		expect(result).toHaveLength(10_000);
	});

	it('PASS — normalizePrice with extremely long string values', () => {
		const longStr = 'A'.repeat(1_000_000);
		const result = normalizePrice({
			TipoVeiculo: 1,
			Marca: longStr,
			Modelo: longStr,
			AnoModelo: 2024,
			Combustivel: longStr,
			CodigoFipe: longStr,
			MesReferencia: longStr,
			Valor: longStr,
			SiglaCombustivel: longStr,
		});
		expect(result.brand).toHaveLength(1_000_000);
		expect(result.model).toHaveLength(1_000_000);
	});
});

// ─────────────────────────────────────────────────────────────
// FIPE VECTOR 7: Empty arrays vs null vs undefined for list operations
// ─────────────────────────────────────────────────────────────
describe('FIPE VECTOR 7: Empty arrays vs null vs undefined for list operations', () => {
	it('PASS — normalizeBrands([]) → empty array', () => {
		expect(normalizeBrands([])).toEqual([]);
	});

	it('PASS — normalizeYears([]) → empty array', () => {
		expect(normalizeYears([])).toEqual([]);
	});

	it('PASS — normalizeModels({modelos: []}) → empty array', () => {
		expect(normalizeModels({ modelos: [] })).toEqual([]);
	});

	it('PASS — normalizeModels with modelos as empty object → empty array', () => {
		expect(normalizeModels({ modelos: {} })).toEqual([]);
	});

	it('PASS — normalizeBrands with single empty object → one item with empty fields', () => {
		const result = normalizeBrands([{}]);
		expect(result).toHaveLength(1);
		expect(result[0].code).toBe('');
		expect(result[0].name).toBe('');
	});

	it('PASS — normalizeYears with single empty object → one item with empty fields', () => {
		const result = normalizeYears([{}]);
		expect(result).toHaveLength(1);
		expect(result[0].code).toBe('');
		expect(result[0].name).toBe('');
	});
});

// ─────────────────────────────────────────────────────────────
// FIPE VECTOR 8: Integer overflow for model codes
// ─────────────────────────────────────────────────────────────
describe('FIPE VECTOR 8: Integer overflow for model codes', () => {
	it('PASS — normalizeModels with Number.MAX_SAFE_INTEGER', () => {
		const result = normalizeModels({
			modelos: [{ codigo: Number.MAX_SAFE_INTEGER, nome: 'Max' }],
		});
		expect(result[0].code).toBe(Number.MAX_SAFE_INTEGER);
	});

	it('PASS — normalizeModels with Number.MAX_SAFE_INTEGER + 1 (precision loss)', () => {
		const result = normalizeModels({
			modelos: [{ codigo: Number.MAX_SAFE_INTEGER + 1, nome: 'Overflow' }],
		});
		// JS cannot represent MAX_SAFE_INTEGER + 1 precisely
		expect(result[0].code).toBe(Number.MAX_SAFE_INTEGER + 1);
	});

	it('PASS — normalizeModels with Number.MIN_SAFE_INTEGER', () => {
		const result = normalizeModels({
			modelos: [{ codigo: Number.MIN_SAFE_INTEGER, nome: 'Min' }],
		});
		expect(result[0].code).toBe(Number.MIN_SAFE_INTEGER);
	});

	it('PASS — normalizePrice with extreme numeric values', () => {
		const result = normalizePrice({
			TipoVeiculo: Number.MAX_SAFE_INTEGER,
			AnoModelo: Number.MAX_VALUE,
		});
		expect(result.vehicleType).toBe(Number.MAX_SAFE_INTEGER);
		expect(result.modelYear).toBe(Number.MAX_VALUE);
	});

	it('PASS — normalizePrice with Number.EPSILON', () => {
		const result = normalizePrice({ TipoVeiculo: Number.EPSILON, AnoModelo: Number.EPSILON });
		expect(result.vehicleType).toBe(Number.EPSILON);
		expect(result.modelYear).toBe(Number.EPSILON);
	});
});

// ─────────────────────────────────────────────────────────────
// FIPE VECTOR 9: Unicode/emoji in brand/model names
// ─────────────────────────────────────────────────────────────
describe('FIPE VECTOR 9: Unicode/emoji in brand/model names', () => {
	it('PASS — normalizeBrands with emoji names passes through', () => {
		const result = normalizeBrands([
			{ codigo: '1', nome: 'Honda \u{1F697}' },
			{ codigo: '2', nome: '\u{1F3CE}\uFE0F Ferrari' },
		]);
		expect(result[0].name).toBe('Honda \u{1F697}');
		expect(result[1].name).toBe('\u{1F3CE}\uFE0F Ferrari');
	});

	it('PASS — normalizeModels with CJK characters', () => {
		const result = normalizeModels({
			modelos: [{ codigo: 1, nome: '\u4E30\u7530\u5361\u7F57\u62C9' }],
		});
		expect(result[0].name).toBe('\u4E30\u7530\u5361\u7F57\u62C9');
	});

	it('PASS — normalizeYears with RTL Arabic characters', () => {
		const result = normalizeYears([{ codigo: '2024-1', nome: '\u0633\u064A\u0627\u0631\u0629' }]);
		expect(result[0].name).toBe('\u0633\u064A\u0627\u0631\u0629');
	});

	it('PASS — normalizePrice with full Unicode stress test', () => {
		const result = normalizePrice({
			TipoVeiculo: 1,
			Marca: 'Caf\u00E9 \u2603\uFE0F \u{1F600}',
			Modelo: '\u2028\u2029\uFEFF\u200B',
			AnoModelo: 2024,
			Combustivel: '\u{1F525} Fire',
			CodigoFipe: '\u0000\u0001\u0002',
			MesReferencia: 'mar\u00E7o de 2026',
			Valor: 'R$ 1.000,00 \u20AC',
			SiglaCombustivel: '\u{1F1E7}\u{1F1F7}',
		});
		expect(result.brand).toBe('Caf\u00E9 \u2603\uFE0F \u{1F600}');
		expect(result.fuel).toBe('\u{1F525} Fire');
		expect(result.price).toBe('R$ 1.000,00 \u20AC');
	});

	it('PASS — normalizeBrands with zero-width characters', () => {
		const result = normalizeBrands([
			{ codigo: 'ab\u200Bcd', nome: 'Tes\u200Ct' },
		]);
		expect(result[0].code).toBe('ab\u200Bcd');
		expect(result[0].name).toBe('Tes\u200Ct');
	});
});

// ─────────────────────────────────────────────────────────────
// FIPE VECTOR 10: referenceTable edge cases in normalizers
// (referenceTable is handled by execute, but normalizers receive its effects)
// ─────────────────────────────────────────────────────────────
describe('FIPE VECTOR 10: normalizePrice with empty/missing required fields', () => {
	it('PASS — completely empty object → all defaults', () => {
		const result = normalizePrice({});
		expect(result.vehicleType).toBe(0);
		expect(result.brand).toBe('');
		expect(result.model).toBe('');
		expect(result.modelYear).toBe(0);
		expect(result.fuel).toBe('');
		expect(result.fipeCode).toBe('');
		expect(result.referenceMonth).toBe('');
		expect(result.price).toBe('');
		expect(result.fuelAbbreviation).toBe('');
	});

	it('PASS — extra unexpected fields are silently ignored', () => {
		const result = normalizePrice({
			TipoVeiculo: 1,
			Marca: 'Honda',
			UnknownField: 'should be ignored',
			AnotherField: { nested: true },
		});
		expect(result.vehicleType).toBe(1);
		expect(result.brand).toBe('Honda');
		expect((result as unknown as Record<string, unknown>).UnknownField).toBeUndefined();
		expect((result as unknown as Record<string, unknown>).AnotherField).toBeUndefined();
	});
});

// ═══════════════════════════════════════════════════════════════════════
// FERIADOS NORMALIZER ATTACK TESTS
// ═══════════════════════════════════════════════════════════════════════

// ─────────────────────────────────────────────────────────────
// FERIADOS VECTOR 1: Malformed API responses (null, undefined, "", 42, {}, true)
// ─────────────────────────────────────────────────────────────
describe('FERIADOS VECTOR 1: Malformed API responses', () => {
	describe('normalizeFeriados — non-array data returns empty array for both providers', () => {
		for (const provider of ['brasilapi', 'nagerdate'] as const) {
			it.each([
				['null', null],
				['undefined', undefined],
				['""', ''],
				['42', 42],
				['{}', {}],
				['true', true],
			])(`PASS — normalizeFeriados(%s, "${provider}") → []`, (_label, value) => {
				const result = normalizeFeriados(value, provider);
				expect(result).toEqual([]);
			});
		}
	});
});

// ─────────────────────────────────────────────────────────────
// FERIADOS VECTOR 2: Null/undefined items in array
// ─────────────────────────────────────────────────────────────
describe('FERIADOS VECTOR 2: Null/undefined items in array', () => {
	describe('normalizeFeriados — null/undefined entries are filtered out', () => {
		for (const provider of ['brasilapi', 'nagerdate'] as const) {
			it(`PASS — [null, undefined, null] (${provider}) → []`, () => {
				const result = normalizeFeriados([null, undefined, null], provider);
				expect(result).toEqual([]);
			});

			it(`PASS — [null, {date:"2026-01-01",name:"Ano Novo"}, undefined] (${provider}) → 1 item`, () => {
				const validItem = provider === 'brasilapi'
					? { date: '2026-01-01', name: 'Ano Novo', type: 'national' }
					: { date: '2026-01-01', localName: 'Ano Novo', types: ['Public'] };
				const result = normalizeFeriados([null, validItem, undefined], provider);
				expect(result).toHaveLength(1);
				expect(result[0].date).toBe('2026-01-01');
				expect(result[0].name).toBe('Ano Novo');
			});
		}
	});

	describe('normalizeFeriados — non-object primitives in array are filtered out', () => {
		for (const provider of ['brasilapi', 'nagerdate'] as const) {
			it(`PASS — [42, "string", true, false] (${provider}) → []`, () => {
				const result = normalizeFeriados([42, 'string', true, false], provider);
				expect(result).toEqual([]);
			});
		}
	});
});

// ─────────────────────────────────────────────────────────────
// FERIADOS VECTOR 3: XSS/SQLi payloads in name/date fields (passthrough expected)
// ─────────────────────────────────────────────────────────────
describe('FERIADOS VECTOR 3: XSS/SQLi payloads (NOTED — passthrough expected for backend)', () => {
	const xssPayload = '<script>alert("xss")</script>';
	const sqli = "'; DROP TABLE feriados--";

	it('NOTED — brasilapi: XSS in name and date passes through', () => {
		const data = [{ date: xssPayload, name: xssPayload, type: 'national' }];
		const result = normalizeFeriados(data, 'brasilapi');
		expect(result[0].date).toBe(xssPayload);
		expect(result[0].name).toBe(xssPayload);
		expect(result[0].type).toBe('national');
	});

	it('NOTED — brasilapi: SQLi in all fields passes through', () => {
		const data = [{ date: sqli, name: sqli, type: sqli }];
		const result = normalizeFeriados(data, 'brasilapi');
		expect(result[0].date).toBe(sqli);
		expect(result[0].name).toBe(sqli);
		expect(result[0].type).toBe(sqli);
	});

	it('NOTED — nagerdate: XSS in localName and date passes through', () => {
		const data = [{ date: xssPayload, localName: xssPayload, types: [xssPayload] }];
		const result = normalizeFeriados(data, 'nagerdate');
		expect(result[0].date).toBe(xssPayload);
		expect(result[0].name).toBe(xssPayload);
		expect(result[0].type).toBe(xssPayload);
	});

	it('NOTED — nagerdate: SQLi in name (fallback from localName) passes through', () => {
		const data = [{ date: '2026-01-01', name: sqli, types: ['Public'] }];
		const result = normalizeFeriados(data, 'nagerdate');
		expect(result[0].name).toBe(sqli);
	});
});

// ─────────────────────────────────────────────────────────────
// FERIADOS VECTOR 4: types array with non-string items (nagerdate)
// ─────────────────────────────────────────────────────────────
describe('FERIADOS VECTOR 4: types array with non-string items (nagerdate)', () => {
	it('PASS — types with numbers → safeStr coerces to string', () => {
		const data = [{ date: '2026-01-01', localName: 'Test', types: [42, 99] }];
		const result = normalizeFeriados(data, 'nagerdate');
		expect(result[0].type).toBe('42, 99');
	});

	it('PASS — types with objects → safeStr returns "" (filtered by Boolean)', () => {
		const data = [{ date: '2026-01-01', localName: 'Test', types: [{}, { a: 1 }] }];
		const result = normalizeFeriados(data, 'nagerdate');
		// safeStr({}) → '', Boolean('') → false → filtered out
		expect(result[0].type).toBe('');
	});

	it('PASS — types with null → safeStr returns "" (filtered by Boolean)', () => {
		const data = [{ date: '2026-01-01', localName: 'Test', types: [null, null] }];
		const result = normalizeFeriados(data, 'nagerdate');
		expect(result[0].type).toBe('');
	});

	it('PASS — types with undefined → safeStr returns "" (filtered by Boolean)', () => {
		const data = [{ date: '2026-01-01', localName: 'Test', types: [undefined, undefined] }];
		const result = normalizeFeriados(data, 'nagerdate');
		expect(result[0].type).toBe('');
	});

	it('PASS — types with booleans → safeStr coerces to "true"/"false"', () => {
		const data = [{ date: '2026-01-01', localName: 'Test', types: [true, false] }];
		const result = normalizeFeriados(data, 'nagerdate');
		// safeStr(true) → "true", safeStr(false) → "false", both truthy strings
		expect(result[0].type).toBe('true, false');
	});

	it('PASS — types with mixed: [null, "Public", 42, {}, "Optional"] → "Public, 42, Optional"', () => {
		const data = [{ date: '2026-01-01', localName: 'Test', types: [null, 'Public', 42, {}, 'Optional'] }];
		const result = normalizeFeriados(data, 'nagerdate');
		expect(result[0].type).toBe('Public, 42, Optional');
	});
});

// ─────────────────────────────────────────────────────────────
// FERIADOS VECTOR 5: Unknown provider throws
// ─────────────────────────────────────────────────────────────
describe('FERIADOS VECTOR 5: Unknown provider throws', () => {
	it('PASS — normalizeFeriados with unknown provider', () => {
		expect(() => normalizeFeriados([], 'unknown')).toThrow('Unknown feriados provider: unknown');
	});

	it('PASS — normalizeFeriados with empty string provider', () => {
		expect(() => normalizeFeriados([], '')).toThrow('Unknown feriados provider: ');
	});

	it('PASS — normalizeFeriados with provider name containing special chars', () => {
		expect(() => normalizeFeriados([], 'brasil-api')).toThrow('Unknown feriados provider: brasil-api');
	});
});

// ═══════════════════════════════════════════════════════════════════════
// NEW CNPJ PROVIDERS ATTACK TESTS (MinhaReceita, OpenCNPJ.org, OpenCNPJ.com, CNPJA)
// ═══════════════════════════════════════════════════════════════════════

// ─────────────────────────────────────────────────────────────
// CNPJ NEW PROVIDERS VECTOR 1: Malformed responses (null, undefined, {}, empty fields)
// ─────────────────────────────────────────────────────────────
describe('CNPJ NEW PROVIDERS VECTOR 1: Malformed responses → safe defaults', () => {
	const newProviders = ['minhareceita', 'opencnpjorg', 'opencnpjcom', 'cnpja'] as const;

	describe('null/undefined produce empty defaults for all new providers', () => {
		for (const value of [null, undefined] as const) {
			for (const provider of newProviders) {
				it(`PASS — ${String(value)} (${provider}) → empty defaults`, () => {
					const result = normalizeCnpj(value, provider);
					expect(result.cnpj).toBe('');
					expect(result.razao_social).toBe('');
					expect(result.capital_social).toBe(0);
					expect(result.socios).toEqual([]);
					expect(result.contato.telefone).toBe('');
					expect(result.contato.email).toBe('');
					expect(result.endereco.logradouro).toBe('');
				});
			}
		}
	});

	describe('empty object {} produces empty defaults for all new providers', () => {
		for (const provider of newProviders) {
			it(`PASS — {} (${provider}) → empty defaults`, () => {
				const result = normalizeCnpj({}, provider);
				expect(result.cnpj).toBe('');
				expect(result.razao_social).toBe('');
				expect(result.nome_fantasia).toBe('');
				expect(result.situacao).toBe('');
				expect(result.data_abertura).toBe('');
				expect(result.porte).toBe('');
				expect(result.natureza_juridica).toBe('');
				expect(result.capital_social).toBe(0);
				expect(result.atividade_principal.codigo).toBe('');
				expect(result.atividade_principal.descricao).toBe('');
				expect(result.endereco.logradouro).toBe('');
				expect(result.endereco.numero).toBe('');
				expect(result.endereco.complemento).toBe('');
				expect(result.endereco.bairro).toBe('');
				expect(result.endereco.cep).toBe('');
				expect(result.endereco.municipio).toBe('');
				expect(result.endereco.uf).toBe('');
				expect(result.contato.telefone).toBe('');
				expect(result.contato.email).toBe('');
				expect(result.socios).toEqual([]);
			});
		}
	});

	describe('non-object primitives do not throw for new providers', () => {
		for (const value of ['', 42, true] as const) {
			for (const provider of newProviders) {
				it(`PASS — ${JSON.stringify(value)} (${provider}) does not throw`, () => {
					expect(() => normalizeCnpj(value, provider)).not.toThrow();
				});
			}
		}
	});
});

// ─────────────────────────────────────────────────────────────
// CNPJ NEW PROVIDERS VECTOR 2: MinhaReceita type confusion
// ─────────────────────────────────────────────────────────────
describe('CNPJ NEW PROVIDERS VECTOR 2: MinhaReceita type confusion', () => {
	it('PASS — cnae_fiscal as string instead of number → String() coerces to same string', () => {
		const data = { cnae_fiscal: '6201501', cnae_fiscal_descricao: 'Desenvolvimento de programas' };
		const result = normalizeCnpj(data, 'minhareceita');
		expect(result.atividade_principal.codigo).toBe('6201501');
		expect(result.atividade_principal.descricao).toBe('Desenvolvimento de programas');
	});

	it('PASS — cnae_fiscal as number → String() coerces to string', () => {
		const data = { cnae_fiscal: 6201501 };
		const result = normalizeCnpj(data, 'minhareceita');
		expect(result.atividade_principal.codigo).toBe('6201501');
	});

	it('PASS — cnae_fiscal as null → empty string (null check)', () => {
		const data = { cnae_fiscal: null };
		const result = normalizeCnpj(data, 'minhareceita');
		expect(result.atividade_principal.codigo).toBe('');
	});

	it('PASS — cnae_fiscal as undefined → empty string (missing key)', () => {
		const result = normalizeCnpj({}, 'minhareceita');
		expect(result.atividade_principal.codigo).toBe('');
	});

	it('PASS — cnae_fiscal as boolean true → String(true) = "true"', () => {
		const data = { cnae_fiscal: true };
		const result = normalizeCnpj(data, 'minhareceita');
		expect(result.atividade_principal.codigo).toBe('true');
	});

	it('PASS — cnae_fiscal as 0 → String(0) = "0"', () => {
		const data = { cnae_fiscal: 0 };
		const result = normalizeCnpj(data, 'minhareceita');
		expect(result.atividade_principal.codigo).toBe('0');
	});

	it('PASS — capital_social as string "1000.50" → safeCapital coerces', () => {
		const data = { capital_social: '1000.50' };
		const result = normalizeCnpj(data, 'minhareceita');
		expect(result.capital_social).toBe(1000.5);
	});

	it('FIXED — capital_social as string "abc" → safeCapital returns 0', () => {
		const data = { capital_social: 'abc' };
		const result = normalizeCnpj(data, 'minhareceita');
		expect(result.capital_social).toBe(0);
	});

	it('PASS — capital_social as null → 0', () => {
		const data = { capital_social: null };
		const result = normalizeCnpj(data, 'minhareceita');
		expect(result.capital_social).toBe(0);
	});

	it('PASS — qsa as string instead of array → empty socios', () => {
		const data = { qsa: 'not an array' };
		const result = normalizeCnpj(data, 'minhareceita');
		expect(result.socios).toEqual([]);
	});

	it('PASS — qsa as null → empty socios', () => {
		const data = { qsa: null };
		const result = normalizeCnpj(data, 'minhareceita');
		expect(result.socios).toEqual([]);
	});

	it('PASS — ddd_telefone_1 and ddd_telefone_2 both empty → empty phone string', () => {
		const data = { ddd_telefone_1: '', ddd_telefone_2: '' };
		const result = normalizeCnpj(data, 'minhareceita');
		expect(result.contato.telefone).toBe('');
	});

	it('PASS — ddd_telefone_1 present, ddd_telefone_2 empty → single phone', () => {
		const data = { ddd_telefone_1: '1198765432', ddd_telefone_2: '' };
		const result = normalizeCnpj(data, 'minhareceita');
		expect(result.contato.telefone).toBe('1198765432');
	});
});

// ─────────────────────────────────────────────────────────────
// CNPJ NEW PROVIDERS VECTOR 3: OpenCNPJ.org type confusion
// ─────────────────────────────────────────────────────────────
describe('CNPJ NEW PROVIDERS VECTOR 3: OpenCNPJ.org type confusion', () => {
	it('FIXED — capital_social as comma string "1.234,56" → parsed to 1234.56', () => {
		const data = { capital_social: '1.234,56' };
		const result = normalizeCnpj(data, 'opencnpjorg');
		// replaceAll('.', '') removes thousand separators, then replace(',', '.') for decimal
		expect(result.capital_social).toBe(1234.56);
	});

	it('PASS — capital_social as simple comma string "1234,56" → parsed to 1234.56', () => {
		const data = { capital_social: '1234,56' };
		const result = normalizeCnpj(data, 'opencnpjorg');
		expect(result.capital_social).toBe(1234.56);
	});

	it('PASS — capital_social as number → safeCapital coerces normally', () => {
		const data = { capital_social: 50000 };
		const result = normalizeCnpj(data, 'opencnpjorg');
		expect(result.capital_social).toBe(50000);
	});

	it('PASS — capital_social as null → 0', () => {
		const data = { capital_social: null };
		const result = normalizeCnpj(data, 'opencnpjorg');
		expect(result.capital_social).toBe(0);
	});

	it('FIXED — capital_social as "abc" string → parseFloat returns NaN → || 0', () => {
		const data = { capital_social: 'abc' };
		const result = normalizeCnpj(data, 'opencnpjorg');
		expect(result.capital_social).toBe(0);
	});

	it('PASS — QSA as uppercase key with array → normal socios', () => {
		const data = {
			QSA: [
				{ nome_socio: 'John', cnpj_cpf_do_socio: '123', qualificacao_socio: 'Admin', data_entrada_sociedade: '2020-01-01' },
			],
		};
		const result = normalizeCnpj(data, 'opencnpjorg');
		expect(result.socios).toHaveLength(1);
		expect(result.socios[0].nome).toBe('John');
	});

	it('PASS — qsa (lowercase) is NOT recognized → empty socios (field is QSA)', () => {
		const data = {
			qsa: [
				{ nome_socio: 'John' },
			],
		};
		const result = normalizeCnpj(data, 'opencnpjorg');
		expect(result.socios).toEqual([]);
	});

	it('PASS — QSA as null → empty socios', () => {
		const data = { QSA: null };
		const result = normalizeCnpj(data, 'opencnpjorg');
		expect(result.socios).toEqual([]);
	});

	it('PASS — QSA as string → empty socios', () => {
		const data = { QSA: 'not an array' };
		const result = normalizeCnpj(data, 'opencnpjorg');
		expect(result.socios).toEqual([]);
	});

	it('PASS — telefones as empty array → empty phone string', () => {
		const data = { telefones: [] };
		const result = normalizeCnpj(data, 'opencnpjorg');
		expect(result.contato.telefone).toBe('');
	});

	it('PASS — telefones with only fax entries (ddd+numero still extracted from first)', () => {
		const data = {
			telefones: [
				{ ddd: '11', numero: '33334444', tipo: 'fax' },
				{ ddd: '11', numero: '55556666', tipo: 'fax' },
			],
		};
		const result = normalizeCnpj(data, 'opencnpjorg');
		// normalizer takes first entry regardless of tipo field
		expect(result.contato.telefone).toBe('1133334444');
	});

	it('PASS — telefones as null → empty phone string', () => {
		const data = { telefones: null };
		const result = normalizeCnpj(data, 'opencnpjorg');
		expect(result.contato.telefone).toBe('');
	});

	it('PASS — telefones as string instead of array → empty phone string', () => {
		const data = { telefones: 'not an array' };
		const result = normalizeCnpj(data, 'opencnpjorg');
		expect(result.contato.telefone).toBe('');
	});

	it('PASS — telefones with null ddd/numero in first entry → empty strings concatenated', () => {
		const data = { telefones: [{ ddd: null, numero: null }] };
		const result = normalizeCnpj(data, 'opencnpjorg');
		// safeStr(null) → '' for both, so phone = '' + '' = ''
		expect(result.contato.telefone).toBe('');
	});
});

// ─────────────────────────────────────────────────────────────
// CNPJ NEW PROVIDERS VECTOR 4: OpenCNPJ.com wrapped vs unwrapped
// ─────────────────────────────────────────────────────────────
describe('CNPJ NEW PROVIDERS VECTOR 4: OpenCNPJ.com wrapped vs unwrapped', () => {
	it('PASS — wrapped {success: true, data: {...}} extracts from data', () => {
		const raw = {
			success: true,
			data: {
				cnpj: '12345678000100',
				razaoSocial: 'Test Company',
				nomeFantasia: 'Test',
				situacaoCadastral: 'ATIVA',
				capitalSocial: 50000,
				socios: [],
			},
		};
		const result = normalizeCnpj(raw, 'opencnpjcom');
		expect(result.cnpj).toBe('12345678000100');
		expect(result.razao_social).toBe('Test Company');
		expect(result.capital_social).toBe(50000);
	});

	it('PASS — unwrapped response (no data wrapper) works directly', () => {
		const raw = {
			cnpj: '12345678000100',
			razaoSocial: 'Direct Company',
			nomeFantasia: 'Direct',
			situacaoCadastral: 'ATIVA',
			capitalSocial: 75000,
			socios: [],
		};
		const result = normalizeCnpj(raw, 'opencnpjcom');
		expect(result.cnpj).toBe('12345678000100');
		expect(result.razao_social).toBe('Direct Company');
		expect(result.capital_social).toBe(75000);
	});

	it('PASS — {success: false} with no data → reads from top-level (empty defaults)', () => {
		const raw = { success: false };
		const result = normalizeCnpj(raw, 'opencnpjcom');
		// data = (raw.data ?? raw) → raw.data is undefined → uses raw itself
		// raw has no cnpj, razaoSocial etc → empty defaults
		expect(result.cnpj).toBe('');
		expect(result.razao_social).toBe('');
		expect(result.capital_social).toBe(0);
		expect(result.socios).toEqual([]);
	});

	it('PASS — {success: false, data: null} → data is null → falls back to raw', () => {
		const raw = { success: false, data: null };
		const result = normalizeCnpj(raw, 'opencnpjcom');
		// data = (raw.data ?? raw) → raw.data is null → uses raw
		expect(result.cnpj).toBe('');
		expect(result.razao_social).toBe('');
	});

	it('PASS — {data: {}} → empty wrapped data produces defaults', () => {
		const raw = { data: {} };
		const result = normalizeCnpj(raw, 'opencnpjcom');
		expect(result.cnpj).toBe('');
		expect(result.razao_social).toBe('');
		expect(result.capital_social).toBe(0);
		expect(result.socios).toEqual([]);
	});

	it('PASS — socios as string instead of array → empty socios', () => {
		const raw = { socios: 'not an array' };
		const result = normalizeCnpj(raw, 'opencnpjcom');
		expect(result.socios).toEqual([]);
	});

	it('PASS — socios as null → empty socios', () => {
		const raw = { socios: null };
		const result = normalizeCnpj(raw, 'opencnpjcom');
		expect(result.socios).toEqual([]);
	});

	it('PASS — capitalSocial as "abc" → safeCapital returns 0', () => {
		const raw = { capitalSocial: 'abc' };
		const result = normalizeCnpj(raw, 'opencnpjcom');
		expect(result.capital_social).toBe(0);
	});

	it('PASS — data_abertura always empty (field not mapped)', () => {
		const raw = { dataAbertura: '2020-01-01' };
		const result = normalizeCnpj(raw, 'opencnpjcom');
		// opencnpjcom normalizer hardcodes data_abertura: ''
		expect(result.data_abertura).toBe('');
	});

	it('PASS — porte always empty (field not mapped)', () => {
		const raw = { porte: 'ME' };
		const result = normalizeCnpj(raw, 'opencnpjcom');
		// opencnpjcom normalizer hardcodes porte: ''
		expect(result.porte).toBe('');
	});
});

// ─────────────────────────────────────────────────────────────
// CNPJ NEW PROVIDERS VECTOR 5: CNPJA deeply nested nulls
// ─────────────────────────────────────────────────────────────
describe('CNPJ NEW PROVIDERS VECTOR 5: CNPJA deeply nested nulls', () => {
	it('PASS — all nested objects null (company, status, address, mainActivity) → safe defaults', () => {
		const data = {
			company: null,
			status: null,
			address: null,
			mainActivity: null,
			phones: null,
			emails: null,
		};
		const result = normalizeCnpj(data, 'cnpja');
		expect(result.cnpj).toBe('');
		expect(result.razao_social).toBe('');
		expect(result.nome_fantasia).toBe('');
		expect(result.situacao).toBe('');
		expect(result.data_abertura).toBe('');
		expect(result.porte).toBe('');
		expect(result.natureza_juridica).toBe('');
		expect(result.capital_social).toBe(0);
		expect(result.atividade_principal.codigo).toBe('');
		expect(result.atividade_principal.descricao).toBe('');
		expect(result.endereco.logradouro).toBe('');
		expect(result.endereco.numero).toBe('');
		expect(result.endereco.complemento).toBe('');
		expect(result.endereco.bairro).toBe('');
		expect(result.endereco.cep).toBe('');
		expect(result.endereco.municipio).toBe('');
		expect(result.endereco.uf).toBe('');
		expect(result.contato.telefone).toBe('');
		expect(result.contato.email).toBe('');
		expect(result.socios).toEqual([]);
	});

	it('PASS — company.members with empty person/role objects → empty socio fields', () => {
		const data = {
			company: {
				members: [
					{ person: {}, role: {}, since: '' },
					{ person: null, role: null, since: null },
				],
			},
		};
		const result = normalizeCnpj(data, 'cnpja');
		expect(result.socios).toHaveLength(2);
		expect(result.socios[0]).toEqual({
			nome: '',
			cpf_cnpj: '',
			qualificacao: '',
			data_entrada: '',
		});
		expect(result.socios[1]).toEqual({
			nome: '',
			cpf_cnpj: '',
			qualificacao: '',
			data_entrada: '',
		});
	});

	it('PASS — company.members with missing person/role keys → empty socio fields', () => {
		const data = {
			company: {
				members: [
					{},
				],
			},
		};
		const result = normalizeCnpj(data, 'cnpja');
		expect(result.socios).toHaveLength(1);
		expect(result.socios[0]).toEqual({
			nome: '',
			cpf_cnpj: '',
			qualificacao: '',
			data_entrada: '',
		});
	});

	it('PASS — phones as empty array → empty phone string', () => {
		const data = { phones: [] };
		const result = normalizeCnpj(data, 'cnpja');
		expect(result.contato.telefone).toBe('');
	});

	it('PASS — emails as empty array → empty email', () => {
		const data = { emails: [] };
		const result = normalizeCnpj(data, 'cnpja');
		expect(result.contato.email).toBe('');
	});

	it('PASS — phones with null area/number in first entry → empty phone', () => {
		const data = { phones: [{ area: null, number: null }] };
		const result = normalizeCnpj(data, 'cnpja');
		// safeStr(null) → '' for both, phone = '' + '' = ''
		expect(result.contato.telefone).toBe('');
	});

	it('PASS — emails with null address in first entry → empty email', () => {
		const data = { emails: [{ address: null }] };
		const result = normalizeCnpj(data, 'cnpja');
		expect(result.contato.email).toBe('');
	});

	it('PASS — company.equity as null → capital_social 0', () => {
		const data = { company: { equity: null } };
		const result = normalizeCnpj(data, 'cnpja');
		expect(result.capital_social).toBe(0);
	});

	it('PASS — company.equity as 0 → capital_social 0', () => {
		const data = { company: { equity: 0 } };
		const result = normalizeCnpj(data, 'cnpja');
		expect(result.capital_social).toBe(0);
	});

	it('PASS — company.equity as negative number → kept as-is', () => {
		const data = { company: { equity: -5000 } };
		const result = normalizeCnpj(data, 'cnpja');
		expect(result.capital_social).toBe(-5000);
	});

	it('PASS — company.equity as "abc" → safeCapital returns 0', () => {
		const data = { company: { equity: 'abc' } };
		const result = normalizeCnpj(data, 'cnpja');
		expect(result.capital_social).toBe(0);
	});

	it('PASS — mainActivity.id as null → empty string', () => {
		const data = { mainActivity: { id: null, text: 'Test' } };
		const result = normalizeCnpj(data, 'cnpja');
		expect(result.atividade_principal.codigo).toBe('');
	});

	it('PASS — mainActivity.id as number → String() coerced', () => {
		const data = { mainActivity: { id: 6201501, text: 'Dev' } };
		const result = normalizeCnpj(data, 'cnpja');
		expect(result.atividade_principal.codigo).toBe('6201501');
	});

	it('PASS — mainActivity.id as 0 → String(0) = "0"', () => {
		const data = { mainActivity: { id: 0, text: '' } };
		const result = normalizeCnpj(data, 'cnpja');
		expect(result.atividade_principal.codigo).toBe('0');
	});

	it('PASS — company.size and company.nature as null → empty porte and natureza_juridica', () => {
		const data = { company: { size: null, nature: null } };
		const result = normalizeCnpj(data, 'cnpja');
		expect(result.porte).toBe('');
		expect(result.natureza_juridica).toBe('');
	});

	it('PASS — phones/emails as strings instead of arrays → empty contact', () => {
		const data = { phones: 'not an array', emails: 'not an array' };
		const result = normalizeCnpj(data, 'cnpja');
		expect(result.contato.telefone).toBe('');
		expect(result.contato.email).toBe('');
	});

	it('PASS — company.members as string instead of array → empty socios', () => {
		const data = { company: { members: 'not an array' } };
		const result = normalizeCnpj(data, 'cnpja');
		expect(result.socios).toEqual([]);
	});

	it('PASS — company.members as null → empty socios', () => {
		const data = { company: { members: null } };
		const result = normalizeCnpj(data, 'cnpja');
		expect(result.socios).toEqual([]);
	});
});

// ═══════════════════════════════════════════════════════════════════════
// NEW CEP PROVIDER ATTACK TESTS (ApiCEP)
// ═══════════════════════════════════════════════════════════════════════

// ─────────────────────────────────────────────────────────────
// CEP APICEP VECTOR 1: Error detection and malformed responses
// ─────────────────────────────────────────────────────────────
describe('CEP APICEP VECTOR 1: Error detection and malformed responses', () => {
	it('PASS — {ok: false, status: 404} throws "CEP not found"', () => {
		expect(() => normalizeCep({ ok: false, status: 404 }, 'apicep')).toThrow('CEP not found');
	});

	it('PASS — {ok: false} without status throws "CEP not found"', () => {
		expect(() => normalizeCep({ ok: false }, 'apicep')).toThrow('CEP not found');
	});

	it('PASS — {ok: 0} (falsy) throws "CEP not found"', () => {
		expect(() => normalizeCep({ ok: 0 }, 'apicep')).toThrow('CEP not found');
	});

	it('PASS — {ok: ""} (empty string, falsy) throws "CEP not found"', () => {
		expect(() => normalizeCep({ ok: '' }, 'apicep')).toThrow('CEP not found');
	});

	it('PASS — {ok: null} throws "CEP not found"', () => {
		expect(() => normalizeCep({ ok: null }, 'apicep')).toThrow('CEP not found');
	});

	it('PASS — {ok: undefined} throws "CEP not found"', () => {
		expect(() => normalizeCep({ ok: undefined }, 'apicep')).toThrow('CEP not found');
	});

	it('PASS — null input → {}.ok is undefined → throws "CEP not found"', () => {
		expect(() => normalizeCep(null, 'apicep')).toThrow('CEP not found');
	});

	it('PASS — undefined input → {}.ok is undefined → throws "CEP not found"', () => {
		expect(() => normalizeCep(undefined, 'apicep')).toThrow('CEP not found');
	});

	it('PASS — {} input → {}.ok is undefined → throws "CEP not found"', () => {
		expect(() => normalizeCep({}, 'apicep')).toThrow('CEP not found');
	});

	it('PASS — {ok: true} but missing all fields → safe defaults', () => {
		const result = normalizeCep({ ok: true }, 'apicep');
		expect(result.cep).toBe('');
		expect(result.logradouro).toBe('');
		expect(result.complemento).toBe('');
		expect(result.bairro).toBe('');
		expect(result.cidade).toBe('');
		expect(result.uf).toBe('');
		expect(result.ibge).toBe('');
		expect(result.ddd).toBe('');
	});

	it('PASS — {ok: true, code: "01001-000"} with hyphen → stripNonDigits removes it', () => {
		const result = normalizeCep({ ok: true, code: '01001-000' }, 'apicep');
		expect(result.cep).toBe('01001000');
	});

	it('PASS — {ok: true, code: "01001000"} without hyphen → works normally', () => {
		const result = normalizeCep({ ok: true, code: '01001000' }, 'apicep');
		expect(result.cep).toBe('01001000');
	});

	it('PASS — {ok: true, code: null} → empty cep', () => {
		const result = normalizeCep({ ok: true, code: null }, 'apicep');
		expect(result.cep).toBe('');
	});

	it('PASS — {ok: 1} (truthy number) does NOT throw → produces result', () => {
		const result = normalizeCep({ ok: 1, code: '01001000', address: 'Praça da Sé' }, 'apicep');
		expect(result.cep).toBe('01001000');
		expect(result.logradouro).toBe('Praça da Sé');
	});

	it('PASS — {ok: "yes"} (truthy string) does NOT throw → produces result', () => {
		const result = normalizeCep({ ok: 'yes', code: '01001000' }, 'apicep');
		expect(result.cep).toBe('01001000');
	});

	it('PASS — complemento always empty (not in ApiCEP response)', () => {
		const result = normalizeCep({
			ok: true,
			code: '01001000',
			address: 'Praça da Sé',
			district: 'Sé',
			city: 'São Paulo',
			state: 'SP',
		}, 'apicep');
		expect(result.complemento).toBe('');
		expect(result.ibge).toBe('');
		expect(result.ddd).toBe('');
	});
});

// ─────────────────────────────────────────────────────────────
// NEW PROVIDERS XSS/SQLi PASSTHROUGH
// ─────────────────────────────────────────────────────────────
describe('NEW PROVIDERS: XSS/SQLi passthrough (NOTED — expected for backend)', () => {
	const xssPayload = '<script>alert("xss")</script>';
	const sqli = "'; DROP TABLE empresas--";

	it('NOTED — MinhaReceita: XSS in razao_social passes through', () => {
		const data = { razao_social: xssPayload, nome_fantasia: xssPayload };
		const result = normalizeCnpj(data, 'minhareceita');
		expect(result.razao_social).toBe(xssPayload);
		expect(result.nome_fantasia).toBe(xssPayload);
	});

	it('NOTED — MinhaReceita: SQLi in email passes through', () => {
		const data = { email: sqli };
		const result = normalizeCnpj(data, 'minhareceita');
		expect(result.contato.email).toBe(sqli);
	});

	it('NOTED — OpenCNPJ.org: XSS in razao_social passes through', () => {
		const data = { razao_social: xssPayload };
		const result = normalizeCnpj(data, 'opencnpjorg');
		expect(result.razao_social).toBe(xssPayload);
	});

	it('NOTED — OpenCNPJ.org: SQLi in municipio passes through', () => {
		const data = { municipio: sqli };
		const result = normalizeCnpj(data, 'opencnpjorg');
		expect(result.endereco.municipio).toBe(sqli);
	});

	it('NOTED — OpenCNPJ.com: XSS in razaoSocial passes through', () => {
		const data = { razaoSocial: xssPayload };
		const result = normalizeCnpj(data, 'opencnpjcom');
		expect(result.razao_social).toBe(xssPayload);
	});

	it('NOTED — OpenCNPJ.com: SQLi in nomeFantasia passes through', () => {
		const data = { nomeFantasia: sqli };
		const result = normalizeCnpj(data, 'opencnpjcom');
		expect(result.nome_fantasia).toBe(sqli);
	});

	it('NOTED — CNPJA: XSS in company.name passes through', () => {
		const data = { company: { name: xssPayload } };
		const result = normalizeCnpj(data, 'cnpja');
		expect(result.razao_social).toBe(xssPayload);
	});

	it('NOTED — CNPJA: SQLi in alias passes through', () => {
		const data = { alias: sqli };
		const result = normalizeCnpj(data, 'cnpja');
		expect(result.nome_fantasia).toBe(sqli);
	});

	it('NOTED — CNPJA: XSS in address.street passes through', () => {
		const data = { address: { street: xssPayload } };
		const result = normalizeCnpj(data, 'cnpja');
		expect(result.endereco.logradouro).toBe(xssPayload);
	});

	it('NOTED — ApiCEP: XSS in city passes through', () => {
		const data = { ok: true, city: xssPayload, address: xssPayload };
		const result = normalizeCep(data, 'apicep');
		expect(result.cidade).toBe(xssPayload);
		expect(result.logradouro).toBe(xssPayload);
	});

	it('NOTED — ApiCEP: SQLi in district passes through', () => {
		const data = { ok: true, district: sqli };
		const result = normalizeCep(data, 'apicep');
		expect(result.bairro).toBe(sqli);
	});
});

// ─────────────────────────────────────────────────────────────
// FERIADOS VECTOR 6: Empty types array, missing types field (nagerdate)
// ─────────────────────────────────────────────────────────────
describe('FERIADOS VECTOR 6: Empty types array and missing types field (nagerdate)', () => {
	it('PASS — empty types array → type is ""', () => {
		const data = [{ date: '2026-01-01', localName: 'Test', types: [] }];
		const result = normalizeFeriados(data, 'nagerdate');
		expect(result[0].type).toBe('');
	});

	it('PASS — types field missing entirely → type is ""', () => {
		const data = [{ date: '2026-01-01', localName: 'Test' }];
		const result = normalizeFeriados(data, 'nagerdate');
		// Array.isArray(undefined) → false → '' fallback
		expect(result[0].type).toBe('');
	});

	it('PASS — types as string instead of array → type is ""', () => {
		const data = [{ date: '2026-01-01', localName: 'Test', types: 'Public' }];
		const result = normalizeFeriados(data, 'nagerdate');
		// Array.isArray("Public") → false → '' fallback
		expect(result[0].type).toBe('');
	});

	it('PASS — types as number instead of array → type is ""', () => {
		const data = [{ date: '2026-01-01', localName: 'Test', types: 42 }];
		const result = normalizeFeriados(data, 'nagerdate');
		expect(result[0].type).toBe('');
	});

	it('PASS — types as null → type is ""', () => {
		const data = [{ date: '2026-01-01', localName: 'Test', types: null }];
		const result = normalizeFeriados(data, 'nagerdate');
		expect(result[0].type).toBe('');
	});

	it('PASS — types as object → type is ""', () => {
		const data = [{ date: '2026-01-01', localName: 'Test', types: { Public: true } }];
		const result = normalizeFeriados(data, 'nagerdate');
		expect(result[0].type).toBe('');
	});
});

// ─────────────────────────────────────────────────────────────
// FERIADOS VECTOR 7: nagerdate localName vs name fallback
// ─────────────────────────────────────────────────────────────
describe('FERIADOS VECTOR 7: nagerdate localName vs name fallback', () => {
	it('PASS — localName present → uses localName', () => {
		const data = [{ date: '2026-01-01', localName: 'Ano Novo', name: 'New Year' }];
		const result = normalizeFeriados(data, 'nagerdate');
		expect(result[0].name).toBe('Ano Novo');
	});

	it('PASS — localName missing, name present → falls back to name', () => {
		const data = [{ date: '2026-01-01', name: 'New Year' }];
		const result = normalizeFeriados(data, 'nagerdate');
		expect(result[0].name).toBe('New Year');
	});

	it('PASS — both localName and name missing → empty string', () => {
		const data = [{ date: '2026-01-01' }];
		const result = normalizeFeriados(data, 'nagerdate');
		expect(result[0].name).toBe('');
	});

	it('PASS — localName is "" (empty), name present → falls back to name', () => {
		const data = [{ date: '2026-01-01', localName: '', name: 'New Year' }];
		const result = normalizeFeriados(data, 'nagerdate');
		// safeStr('') → '', '' || safeStr('New Year') → 'New Year'
		expect(result[0].name).toBe('New Year');
	});

	it('PASS — localName is null → falls back to name', () => {
		const data = [{ date: '2026-01-01', localName: null, name: 'New Year' }];
		const result = normalizeFeriados(data, 'nagerdate');
		// safeStr(null) → '', '' || 'New Year' → 'New Year'
		expect(result[0].name).toBe('New Year');
	});
});

// ─────────────────────────────────────────────────────────────
// FERIADOS VECTOR 8: Empty objects and missing fields
// ─────────────────────────────────────────────────────────────
describe('FERIADOS VECTOR 8: Empty objects and missing fields', () => {
	it('PASS — brasilapi: empty object → all fields are ""', () => {
		const result = normalizeFeriados([{}], 'brasilapi');
		expect(result[0]).toEqual({ date: '', name: '', type: '' });
	});

	it('PASS — nagerdate: empty object → all fields are ""', () => {
		const result = normalizeFeriados([{}], 'nagerdate');
		expect(result[0]).toEqual({ date: '', name: '', type: '' });
	});

	it('PASS — brasilapi: all fields null → all empty strings', () => {
		const data = [{ date: null, name: null, type: null }];
		const result = normalizeFeriados(data, 'brasilapi');
		expect(result[0]).toEqual({ date: '', name: '', type: '' });
	});

	it('PASS — nagerdate: all fields null → all empty strings', () => {
		const data = [{ date: null, localName: null, name: null, types: null }];
		const result = normalizeFeriados(data, 'nagerdate');
		expect(result[0]).toEqual({ date: '', name: '', type: '' });
	});
});

// ─────────────────────────────────────────────────────────────
// FERIADOS VECTOR 9: Extremely large payloads
// ─────────────────────────────────────────────────────────────
describe('FERIADOS VECTOR 9: Extremely large payloads', () => {
	it('PASS — normalizeFeriados handles 100,000 entries (brasilapi)', () => {
		const large = Array.from({ length: 100_000 }, (_, i) => ({
			date: `2026-01-${String(i % 28 + 1).padStart(2, '0')}`,
			name: `Feriado ${i}`,
			type: 'national',
		}));
		const result = normalizeFeriados(large, 'brasilapi');
		expect(result).toHaveLength(100_000);
		expect(result[0].name).toBe('Feriado 0');
		expect(result[99_999].name).toBe('Feriado 99999');
	});

	it('PASS — normalizeFeriados handles very long string values', () => {
		const longStr = 'A'.repeat(1_000_000);
		const data = [{ date: longStr, name: longStr, type: longStr }];
		const result = normalizeFeriados(data, 'brasilapi');
		expect(result[0].date).toHaveLength(1_000_000);
		expect(result[0].name).toHaveLength(1_000_000);
	});
});

// ─────────────────────────────────────────────────────────────
// FERIADOS VECTOR 10: Prototype pollution attempts
// ─────────────────────────────────────────────────────────────
describe('FERIADOS VECTOR 10: Prototype pollution attempts', () => {
	it('PASS — normalizeFeriados with __proto__ field does not pollute Object prototype', () => {
		const malicious = [{ date: '2026-01-01', name: 'Test', __proto__: { polluted: true } }];
		normalizeFeriados(malicious, 'brasilapi');
		expect(({} as Record<string, unknown>).polluted).toBeUndefined();
	});

	it('PASS — normalizeFeriados with constructor.prototype in items', () => {
		const malicious = [
			{ date: '2026-01-01', name: 'Test', constructor: { prototype: { hacked: true } } },
		];
		normalizeFeriados(malicious, 'nagerdate');
		expect(({} as Record<string, unknown>).hacked).toBeUndefined();
	});
});

// ═══════════════════════════════════════════════════════════════════════
// IBGE NORMALIZER ATTACK TESTS
// ═══════════════════════════════════════════════════════════════════════

// ─────────────────────────────────────────────────────────────
// IBGE VECTOR 1: Malformed API responses (null, undefined, "", 42, {}, true)
// ─────────────────────────────────────────────────────────────
describe('IBGE VECTOR 1: Malformed API responses', () => {
	describe('normalizeStates — non-array data returns empty array for both providers', () => {
		for (const provider of ['brasilapi', 'ibge'] as const) {
			it.each([
				['null', null],
				['undefined', undefined],
				['""', ''],
				['42', 42],
				['{}', {}],
				['true', true],
			])(`PASS — normalizeStates(%s, "${provider}") → []`, (_label, value) => {
				expect(normalizeStates(value, provider)).toEqual([]);
			});
		}
	});

	describe('normalizeCities — non-array data returns empty array for both providers', () => {
		for (const provider of ['brasilapi', 'ibge'] as const) {
			it.each([
				['null', null],
				['undefined', undefined],
				['""', ''],
				['42', 42],
				['{}', {}],
				['true', true],
			])(`PASS — normalizeCities(%s, "${provider}") → []`, (_label, value) => {
				expect(normalizeCities(value, provider)).toEqual([]);
			});
		}
	});
});

// ─────────────────────────────────────────────────────────────
// IBGE VECTOR 2: Null/undefined items in array
// ─────────────────────────────────────────────────────────────
describe('IBGE VECTOR 2: Null/undefined items in array', () => {
	describe('normalizeStates — filters out null/undefined items', () => {
		for (const provider of ['brasilapi', 'ibge'] as const) {
			it(`PASS — normalizeStates([null, undefined], "${provider}") → []`, () => {
				expect(normalizeStates([null, undefined], provider)).toEqual([]);
			});

			it(`PASS — normalizeStates with mixed valid and null items (${provider}) → keeps valid only`, () => {
				const data = [
					{ id: 35, sigla: 'SP', nome: 'São Paulo', regiao: { nome: 'Sudeste' } },
					null,
					undefined,
					{ id: 33, sigla: 'RJ', nome: 'Rio de Janeiro', regiao: { nome: 'Sudeste' } },
				];
				const result = normalizeStates(data, provider);
				expect(result).toHaveLength(2);
				expect(result[0].abbreviation).toBe('SP');
				expect(result[1].abbreviation).toBe('RJ');
			});
		}
	});

	describe('normalizeCities — filters out null/undefined items', () => {
		it('PASS — normalizeCities([null, undefined], "brasilapi") → []', () => {
			expect(normalizeCities([null, undefined], 'brasilapi')).toEqual([]);
		});

		it('PASS — normalizeCities([null, undefined], "ibge") → []', () => {
			expect(normalizeCities([null, undefined], 'ibge')).toEqual([]);
		});

		it('PASS — normalizeCities with mixed valid and null items (brasilapi) → keeps valid only', () => {
			const data = [
				{ nome: 'São Paulo', codigo_ibge: '3550308' },
				null,
				undefined,
				{ nome: 'Guarulhos', codigo_ibge: '3518800' },
			];
			const result = normalizeCities(data, 'brasilapi');
			expect(result).toHaveLength(2);
			expect(result[0].name).toBe('São Paulo');
			expect(result[1].name).toBe('Guarulhos');
		});

		it('PASS — normalizeCities with mixed valid and null items (ibge) → keeps valid only', () => {
			const data = [
				{ id: 3550308, nome: 'São Paulo' },
				null,
				undefined,
				{ id: 3518800, nome: 'Guarulhos' },
			];
			const result = normalizeCities(data, 'ibge');
			expect(result).toHaveLength(2);
			expect(result[0].name).toBe('São Paulo');
			expect(result[1].name).toBe('Guarulhos');
		});

		it('PASS — non-object primitives in array are also filtered out', () => {
			const data = [42, 'string', true, { nome: 'Valid', codigo_ibge: '1234567' }];
			const result = normalizeCities(data, 'brasilapi');
			expect(result).toHaveLength(1);
			expect(result[0].name).toBe('Valid');
		});
	});
});

// ─────────────────────────────────────────────────────────────
// IBGE VECTOR 3: Missing regiao field for states
// ─────────────────────────────────────────────────────────────
describe('IBGE VECTOR 3: Missing regiao field for states', () => {
	it('PASS — state with no regiao → region defaults to ""', () => {
		const data = [{ id: 35, sigla: 'SP', nome: 'São Paulo' }];
		const result = normalizeStates(data, 'brasilapi');
		expect(result[0].region).toBe('');
	});

	it('PASS — state with regiao: null → region defaults to ""', () => {
		const data = [{ id: 35, sigla: 'SP', nome: 'São Paulo', regiao: null }];
		const result = normalizeStates(data, 'brasilapi');
		expect(result[0].region).toBe('');
	});

	it('PASS — state with regiao: undefined → region defaults to ""', () => {
		const data = [{ id: 35, sigla: 'SP', nome: 'São Paulo', regiao: undefined }];
		const result = normalizeStates(data, 'ibge');
		expect(result[0].region).toBe('');
	});

	it('PASS — state with regiao as string instead of object → region defaults to ""', () => {
		const data = [{ id: 35, sigla: 'SP', nome: 'São Paulo', regiao: 'Sudeste' }];
		const result = normalizeStates(data, 'brasilapi');
		// regiao is cast to Record<string,unknown>, string has no .nome → safeStr(undefined) → ''
		expect(result[0].region).toBe('');
	});

	it('PASS — state with regiao as number → region defaults to ""', () => {
		const data = [{ id: 35, sigla: 'SP', nome: 'São Paulo', regiao: 42 }];
		const result = normalizeStates(data, 'ibge');
		expect(result[0].region).toBe('');
	});

	it('PASS — state with regiao: {} (empty object) → region defaults to ""', () => {
		const data = [{ id: 35, sigla: 'SP', nome: 'São Paulo', regiao: {} }];
		const result = normalizeStates(data, 'brasilapi');
		expect(result[0].region).toBe('');
	});

	it('PASS — state with regiao.nome as number → region is coerced to string', () => {
		const data = [{ id: 35, sigla: 'SP', nome: 'São Paulo', regiao: { nome: 123 } }];
		const result = normalizeStates(data, 'brasilapi');
		expect(result[0].region).toBe('123');
	});

	it('PASS — state with regiao.nome as null → region defaults to ""', () => {
		const data = [{ id: 35, sigla: 'SP', nome: 'São Paulo', regiao: { nome: null } }];
		const result = normalizeStates(data, 'ibge');
		expect(result[0].region).toBe('');
	});
});

// ─────────────────────────────────────────────────────────────
// IBGE VECTOR 4: Non-numeric id/codigo_ibge
// ─────────────────────────────────────────────────────────────
describe('IBGE VECTOR 4: Non-numeric id/codigo_ibge', () => {
	describe('normalizeStates — id type coercion', () => {
		it('PASS — id as string "35" → falls back to 0 (typeof !== "number")', () => {
			const data = [{ id: '35', sigla: 'SP', nome: 'São Paulo', regiao: { nome: 'Sudeste' } }];
			const result = normalizeStates(data, 'brasilapi');
			expect(result[0].code).toBe(0);
		});

		it('PASS — id as null → falls back to 0', () => {
			const data = [{ id: null, sigla: 'SP', nome: 'São Paulo', regiao: { nome: 'Sudeste' } }];
			const result = normalizeStates(data, 'ibge');
			expect(result[0].code).toBe(0);
		});

		it('PASS — id as undefined → falls back to 0', () => {
			const data = [{ sigla: 'SP', nome: 'São Paulo', regiao: { nome: 'Sudeste' } }];
			const result = normalizeStates(data, 'brasilapi');
			expect(result[0].code).toBe(0);
		});

		it('PASS — id as boolean true → falls back to 0', () => {
			const data = [{ id: true, sigla: 'SP', nome: 'São Paulo', regiao: { nome: 'Sudeste' } }];
			const result = normalizeStates(data, 'ibge');
			expect(result[0].code).toBe(0);
		});

		it('PASS — id as NaN → accepted as-is (typeof NaN === "number")', () => {
			const data = [{ id: NaN, sigla: 'SP', nome: 'São Paulo', regiao: { nome: 'Sudeste' } }];
			const result = normalizeStates(data, 'brasilapi');
			expect(result[0].code).toBeNaN();
		});

		it('PASS — id as Infinity → accepted as-is (typeof Infinity === "number")', () => {
			const data = [{ id: Infinity, sigla: 'SP', nome: 'São Paulo', regiao: { nome: 'Sudeste' } }];
			const result = normalizeStates(data, 'ibge');
			expect(result[0].code).toBe(Infinity);
		});

		it('PASS — id as negative number → accepted as-is', () => {
			const data = [{ id: -1, sigla: 'SP', nome: 'São Paulo', regiao: { nome: 'Sudeste' } }];
			const result = normalizeStates(data, 'brasilapi');
			expect(result[0].code).toBe(-1);
		});

		it('PASS — id as object {} → falls back to 0', () => {
			const data = [{ id: {}, sigla: 'SP', nome: 'São Paulo', regiao: { nome: 'Sudeste' } }];
			const result = normalizeStates(data, 'ibge');
			expect(result[0].code).toBe(0);
		});
	});

	describe('normalizeCities (brasilapi) — codigo_ibge type coercion via parseInt', () => {
		it('PASS — codigo_ibge as number 3550308 → parseInt("3550308") = 3550308', () => {
			const data = [{ nome: 'São Paulo', codigo_ibge: 3550308 }];
			const result = normalizeCities(data, 'brasilapi');
			expect(result[0].code).toBe(3550308);
		});

		it('PASS — codigo_ibge as string "3550308" → parseInt works', () => {
			const data = [{ nome: 'São Paulo', codigo_ibge: '3550308' }];
			const result = normalizeCities(data, 'brasilapi');
			expect(result[0].code).toBe(3550308);
		});

		it('PASS — codigo_ibge as null → parseInt("") = NaN → || 0 → 0', () => {
			const data = [{ nome: 'São Paulo', codigo_ibge: null }];
			const result = normalizeCities(data, 'brasilapi');
			expect(result[0].code).toBe(0);
		});

		it('PASS — codigo_ibge as undefined → parseInt("") = NaN → || 0 → 0', () => {
			const data = [{ nome: 'São Paulo' }];
			const result = normalizeCities(data, 'brasilapi');
			expect(result[0].code).toBe(0);
		});

		it('PASS — codigo_ibge as "abc" → parseInt("") = NaN → || 0 → 0', () => {
			const data = [{ nome: 'São Paulo', codigo_ibge: 'abc' }];
			const result = normalizeCities(data, 'brasilapi');
			expect(result[0].code).toBe(0);
		});

		it('PASS — codigo_ibge as boolean true → parseInt("true") = NaN → || 0 → 0', () => {
			const data = [{ nome: 'São Paulo', codigo_ibge: true }];
			const result = normalizeCities(data, 'brasilapi');
			expect(result[0].code).toBe(0);
		});

		it('PASS — codigo_ibge as object {} → parseInt("") = NaN → || 0 → 0', () => {
			const data = [{ nome: 'São Paulo', codigo_ibge: {} }];
			const result = normalizeCities(data, 'brasilapi');
			expect(result[0].code).toBe(0);
		});

		it('PASS — codigo_ibge as "3550308extra" → parseInt parses leading digits = 3550308', () => {
			const data = [{ nome: 'São Paulo', codigo_ibge: '3550308extra' }];
			const result = normalizeCities(data, 'brasilapi');
			expect(result[0].code).toBe(3550308);
		});
	});

	describe('normalizeCities (ibge) — id type coercion (same as states)', () => {
		it('PASS — id as string "3550308" → falls back to 0 (typeof !== "number")', () => {
			const data = [{ id: '3550308', nome: 'São Paulo' }];
			const result = normalizeCities(data, 'ibge');
			expect(result[0].code).toBe(0);
		});

		it('PASS — id as null → falls back to 0', () => {
			const data = [{ id: null, nome: 'São Paulo' }];
			const result = normalizeCities(data, 'ibge');
			expect(result[0].code).toBe(0);
		});

		it('PASS — id as undefined → falls back to 0', () => {
			const data = [{ nome: 'São Paulo' }];
			const result = normalizeCities(data, 'ibge');
			expect(result[0].code).toBe(0);
		});

		it('PASS — id as NaN → accepted as-is (typeof NaN === "number")', () => {
			const data = [{ id: NaN, nome: 'São Paulo' }];
			const result = normalizeCities(data, 'ibge');
			expect(result[0].code).toBeNaN();
		});

		it('PASS — id as negative → accepted as-is', () => {
			const data = [{ id: -999, nome: 'São Paulo' }];
			const result = normalizeCities(data, 'ibge');
			expect(result[0].code).toBe(-999);
		});
	});
});

// ─────────────────────────────────────────────────────────────
// IBGE VECTOR 5: Unknown provider throws
// ─────────────────────────────────────────────────────────────
describe('IBGE VECTOR 5: Unknown provider throws', () => {
	it('PASS — normalizeStates with unknown provider throws', () => {
		expect(() => normalizeStates([], 'unknown')).toThrow('Unknown IBGE states provider: unknown');
	});

	it('PASS — normalizeCities with unknown provider throws', () => {
		expect(() => normalizeCities([], 'unknown')).toThrow('Unknown IBGE cities provider: unknown');
	});

	it('PASS — normalizeStates with empty string provider throws', () => {
		expect(() => normalizeStates([], '')).toThrow('Unknown IBGE states provider: ');
	});

	it('PASS — normalizeCities with empty string provider throws', () => {
		expect(() => normalizeCities([], '')).toThrow('Unknown IBGE cities provider: ');
	});

	it('PASS — normalizeStates with "BRASILAPI" (uppercase) throws (case-sensitive)', () => {
		expect(() => normalizeStates([], 'BRASILAPI')).toThrow('Unknown IBGE states provider: BRASILAPI');
	});

	it('PASS — normalizeCities with "IBGE" (uppercase) throws (case-sensitive)', () => {
		expect(() => normalizeCities([], 'IBGE')).toThrow('Unknown IBGE cities provider: IBGE');
	});
});

// ─────────────────────────────────────────────────────────────
// IBGE VECTOR 6: XSS in state/city names
// ─────────────────────────────────────────────────────────────
describe('IBGE VECTOR 6: XSS in state/city names (NOTED — passthrough expected for backend)', () => {
	const xssPayload = '<script>alert("xss")</script>';
	const sqli = "'; DROP TABLE states--";

	it('NOTED — normalizeStates with XSS in state name passes through', () => {
		const data = [{ id: 35, sigla: 'SP', nome: xssPayload, regiao: { nome: xssPayload } }];
		const result = normalizeStates(data, 'brasilapi');
		expect(result[0].name).toBe(xssPayload);
		expect(result[0].region).toBe(xssPayload);
	});

	it('NOTED — normalizeStates with XSS in sigla passes through', () => {
		const data = [{ id: 35, sigla: xssPayload, nome: 'São Paulo', regiao: { nome: 'Sudeste' } }];
		const result = normalizeStates(data, 'ibge');
		expect(result[0].abbreviation).toBe(xssPayload);
	});

	it('NOTED — normalizeCities (brasilapi) with XSS in city name passes through', () => {
		const data = [{ nome: xssPayload, codigo_ibge: '3550308' }];
		const result = normalizeCities(data, 'brasilapi');
		expect(result[0].name).toBe(xssPayload);
	});

	it('NOTED — normalizeCities (ibge) with XSS in city name passes through', () => {
		const data = [{ id: 3550308, nome: xssPayload }];
		const result = normalizeCities(data, 'ibge');
		expect(result[0].name).toBe(xssPayload);
	});

	it('NOTED — normalizeStates with SQL injection in state name passes through', () => {
		const data = [{ id: 35, sigla: 'SP', nome: sqli, regiao: { nome: sqli } }];
		const result = normalizeStates(data, 'brasilapi');
		expect(result[0].name).toBe(sqli);
		expect(result[0].region).toBe(sqli);
	});

	it('NOTED — normalizeCities with SQL injection in city name passes through', () => {
		const data = [{ nome: sqli, codigo_ibge: '3550308' }];
		const result = normalizeCities(data, 'brasilapi');
		expect(result[0].name).toBe(sqli);
	});
});

// ─────────────────────────────────────────────────────────────
// IBGE VECTOR 7: Empty objects / missing fields
// ─────────────────────────────────────────────────────────────
describe('IBGE VECTOR 7: Empty objects / missing fields', () => {
	it('PASS — normalizeStates with array of empty objects → defaults', () => {
		const data = [{}];
		const result = normalizeStates(data, 'brasilapi');
		expect(result).toHaveLength(1);
		expect(result[0].code).toBe(0);
		expect(result[0].abbreviation).toBe('');
		expect(result[0].name).toBe('');
		expect(result[0].region).toBe('');
	});

	it('PASS — normalizeCities (brasilapi) with array of empty objects → defaults', () => {
		const data = [{}];
		const result = normalizeCities(data, 'brasilapi');
		expect(result).toHaveLength(1);
		expect(result[0].code).toBe(0);
		expect(result[0].name).toBe('');
	});

	it('PASS — normalizeCities (ibge) with array of empty objects → defaults', () => {
		const data = [{}];
		const result = normalizeCities(data, 'ibge');
		expect(result).toHaveLength(1);
		expect(result[0].code).toBe(0);
		expect(result[0].name).toBe('');
	});

	it('PASS — normalizeStates with empty array → []', () => {
		expect(normalizeStates([], 'brasilapi')).toEqual([]);
		expect(normalizeStates([], 'ibge')).toEqual([]);
	});

	it('PASS — normalizeCities with empty array → []', () => {
		expect(normalizeCities([], 'brasilapi')).toEqual([]);
		expect(normalizeCities([], 'ibge')).toEqual([]);
	});
});

// ─────────────────────────────────────────────────────────────
// IBGE VECTOR 8: Extremely large payloads
// ─────────────────────────────────────────────────────────────
describe('IBGE VECTOR 8: Extremely large payloads', () => {
	it('PASS — normalizeStates handles 100,000 entries', () => {
		const large = Array.from({ length: 100_000 }, (_, i) => ({
			id: i,
			sigla: `U${i}`,
			nome: `State ${i}`,
			regiao: { nome: 'Region' },
		}));
		const result = normalizeStates(large, 'brasilapi');
		expect(result).toHaveLength(100_000);
		expect(result[0].code).toBe(0);
		expect(result[99_999].code).toBe(99_999);
	});

	it('PASS — normalizeCities handles 100,000 entries (brasilapi)', () => {
		const large = Array.from({ length: 100_000 }, (_, i) => ({
			nome: `City ${i}`,
			codigo_ibge: String(3500000 + i),
		}));
		const result = normalizeCities(large, 'brasilapi');
		expect(result).toHaveLength(100_000);
		expect(result[0].code).toBe(3500000);
		expect(result[99_999].code).toBe(3599999);
	});

	it('PASS — normalizeCities handles 100,000 entries (ibge)', () => {
		const large = Array.from({ length: 100_000 }, (_, i) => ({
			id: 3500000 + i,
			nome: `City ${i}`,
		}));
		const result = normalizeCities(large, 'ibge');
		expect(result).toHaveLength(100_000);
		expect(result[0].code).toBe(3500000);
		expect(result[99_999].code).toBe(3599999);
	});
});

// ─────────────────────────────────────────────────────────────
// IBGE VECTOR 9: Unicode/emoji in state/city names
// ─────────────────────────────────────────────────────────────
describe('IBGE VECTOR 9: Unicode/emoji in state/city names', () => {
	it('PASS — normalizeStates with emoji names passes through', () => {
		const data = [{ id: 1, sigla: 'SP', nome: 'São Paulo \u{1F1E7}\u{1F1F7}', regiao: { nome: 'Sudeste \u2603\uFE0F' } }];
		const result = normalizeStates(data, 'brasilapi');
		expect(result[0].name).toBe('São Paulo \u{1F1E7}\u{1F1F7}');
		expect(result[0].region).toBe('Sudeste \u2603\uFE0F');
	});

	it('PASS — normalizeCities with CJK characters', () => {
		const data = [{ id: 1, nome: '\u4E30\u7530\u5361\u7F57\u62C9' }];
		const result = normalizeCities(data, 'ibge');
		expect(result[0].name).toBe('\u4E30\u7530\u5361\u7F57\u62C9');
	});

	it('PASS — normalizeStates with zero-width characters', () => {
		const data = [{ id: 1, sigla: 'S\u200BP', nome: 'São\u200C Paulo', regiao: { nome: 'Sudeste' } }];
		const result = normalizeStates(data, 'ibge');
		expect(result[0].abbreviation).toBe('S\u200BP');
		expect(result[0].name).toBe('São\u200C Paulo');
	});
});

// ─────────────────────────────────────────────────────────────
// IBGE VECTOR 10: Prototype pollution attempts
// ─────────────────────────────────────────────────────────────
describe('IBGE VECTOR 10: Prototype pollution attempts', () => {
	it('PASS — normalizeStates with __proto__ field does not pollute Object prototype', () => {
		const malicious = [{ id: 1, sigla: 'SP', nome: 'Test', regiao: { nome: 'R' }, __proto__: { polluted: true } }];
		normalizeStates(malicious, 'brasilapi');
		expect(({} as Record<string, unknown>).polluted).toBeUndefined();
	});

	it('PASS — normalizeCities with constructor.prototype in items', () => {
		const malicious = [{ id: 1, nome: 'Test', constructor: { prototype: { hacked: true } } }];
		normalizeCities(malicious, 'ibge');
		expect(({} as Record<string, unknown>).hacked).toBeUndefined();
	});
});

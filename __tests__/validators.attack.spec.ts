/**
 * Attack vectors for validators and utils — adversarial testing.
 *
 * These tests probe edge cases that normal unit tests miss:
 * type confusion, unicode injection, prototype pollution,
 * integer overflow, ReDoS, safeStr exotic types, and NaN propagation.
 */
import { validateCnpj, validateCep, validateCpf, sanitizeCpf, sanitizeCnpj, sanitizeCep } from '../nodes/BrasilHub/shared/validators';
import { safeStr, stripNonDigits } from '../nodes/BrasilHub/shared/utils';

// =============================================================================
// VECTOR 1: Type Confusion — numbers instead of strings
// =============================================================================
// PREDICTION: stripNonDigits calls value.replace() — Number has no .replace()
//             method, so this should throw TypeError at runtime.
//             TypeScript catches this at compile time, but JS callers won't.

describe('VECTOR 1: Type Confusion', () => {
	// FIXED: stripNonDigits now coerces non-string values via String(value ?? '')
	describe('validateCnpj with number input — FIXED (defensive coercion)', () => {
		it('number with valid digits → validates successfully', () => {
			const result = validateCnpj(11222333000181 as unknown as string);
			expect(result.valid).toBe(true);
		});

		it('number with leading zeros truncated → invalid (too short)', () => {
			// 00000000000191 as number becomes 191 → '191' → length !== 14
			const result = validateCnpj(191 as unknown as string);
			expect(result.valid).toBe(false);
		});
	});

	describe('validateCep with number input — FIXED', () => {
		it('number 1001000 → invalid (7 digits instead of 8)', () => {
			const result = validateCep(1001000 as unknown as string);
			expect(result.valid).toBe(false);
		});
	});

	describe('validateCpf with number input — FIXED', () => {
		it('number with valid digits → validates successfully', () => {
			const result = validateCpf(52998224725 as unknown as string);
			expect(result.valid).toBe(true);
		});
	});

	describe('stripNonDigits with number input — FIXED', () => {
		it('coerces number to string via String()', () => {
			expect(stripNonDigits(12345 as unknown as string)).toBe('12345');
		});
	});

	describe('sanitize functions with number input — FIXED', () => {
		it('sanitizeCpf coerces number to formatted CPF', () => {
			expect(() => sanitizeCpf(52998224725 as unknown as string)).not.toThrow();
		});

		it('sanitizeCnpj coerces number to formatted CNPJ', () => {
			expect(() => sanitizeCnpj(11222333000181 as unknown as string)).not.toThrow();
		});

		it('sanitizeCep with number 1001000 → coerces to "1001000"', () => {
			// sanitizeCep just strips non-digits, doesn't validate length
			const result = sanitizeCep(1001000 as unknown as string);
			expect(result).toBe('1001000');
		});
	});
});

// =============================================================================
// VECTOR 2: Unicode Attacks
// =============================================================================
// PREDICTION: Zero-width spaces and RTL marks are \D, so stripNonDigits removes them.
//             Arabic-Indic digits (e.g. \u0661) — JavaScript \d in regex only matches
//             ASCII digits [0-9] (no Unicode flag), so they ARE \D and get stripped.
//             Result: invalid length → valid:false. PASS.

describe('VECTOR 2: Unicode Attacks', () => {
	describe('zero-width spaces mixed with digits', () => {
		it('should strip zero-width spaces and validate correctly (CNPJ)', () => {
			// Inject zero-width spaces between every digit
			const cnpjWithZWS = '1\u200B1\u200B2\u200B2\u200B2\u200B3\u200B3\u200B3\u200B0\u200B0\u200B0\u200B1\u200B8\u200B1';
			const result = validateCnpj(cnpjWithZWS);
			// ZWS should be stripped by \D regex, leaving valid digits
			expect(result.valid).toBe(true);
		});

		it('should strip zero-width spaces from CEP', () => {
			const cepWithZWS = '0\u200B1\u200B0\u200B0\u200B1\u200B0\u200B0\u200B0';
			const result = validateCep(cepWithZWS);
			expect(result.valid).toBe(true);
		});

		it('should strip zero-width spaces from CPF', () => {
			const cpfWithZWS = '5\u200B2\u200B9\u200B9\u200B8\u200B2\u200B2\u200B4\u200B7\u200B2\u200B5';
			const result = validateCpf(cpfWithZWS);
			expect(result.valid).toBe(true);
		});
	});

	describe('RTL override characters', () => {
		it('should strip RTL override and validate CNPJ', () => {
			const cnpjWithRTL = '\u202E11222333000181';
			const result = validateCnpj(cnpjWithRTL);
			expect(result.valid).toBe(true);
		});

		it('should strip RTL embedding in middle of CNPJ', () => {
			const cnpjWithRTL = '112223\u202D33000181';
			const result = validateCnpj(cnpjWithRTL);
			expect(result.valid).toBe(true);
		});
	});

	describe('Arabic-Indic digits (non-ASCII digit characters)', () => {
		it('should reject CNPJ with Arabic-Indic digits', () => {
			// \u0661 = Arabic-Indic 1, \u0662 = Arabic-Indic 2, etc.
			// In JS regex without /u flag, \d only matches [0-9], so these are \D
			const arabicCnpj = '\u0661\u0661\u0662\u0662\u0662\u0663\u0663\u0663\u0660\u0660\u0660\u0661\u0668\u0661';
			const result = validateCnpj(arabicCnpj);
			// All chars are stripped as \D → empty string → length != 14 → invalid
			expect(result.valid).toBe(false);
		});
	});

	describe('combining characters over digits', () => {
		it('should strip combining diacritical marks and validate CNPJ', () => {
			// Combining characters (e.g., combining acute accent \u0301) after digits
			const cnpjWithCombining = '1\u03011222333000181';
			const result = validateCnpj(cnpjWithCombining);
			// \u0301 is \D, stripped → '11222333000181' → valid
			expect(result.valid).toBe(true);
		});
	});

	describe('homoglyph attacks', () => {
		it('should reject fullwidth digit characters', () => {
			// Fullwidth digits: ０１２３４５ etc. (\uFF10-\uFF19)
			// These are NOT matched by \d in JS regex (no /u flag)
			const fullwidthCnpj = '\uFF11\uFF11\uFF12\uFF12\uFF12\uFF13\uFF13\uFF13\uFF10\uFF10\uFF10\uFF11\uFF18\uFF11';
			const result = validateCnpj(fullwidthCnpj);
			expect(result.valid).toBe(false);
		});
	});
});

// =============================================================================
// VECTOR 3: Prototype Pollution / Object Input
// =============================================================================
// PREDICTION: Object with toString does NOT have .replace() method.
//             stripNonDigits calls value.replace() which won't exist on a plain object.
//             Should throw TypeError.

describe('VECTOR 3: Prototype Pollution / Object Input — FIXED', () => {
	// FIXED: stripNonDigits coerces via String(value ?? '') — objects use toString()

	it('object with toString for CNPJ → coerces and validates', () => {
		const malicious = { toString: () => '11222333000181' };
		const result = validateCnpj(malicious as unknown as string);
		expect(result.valid).toBe(true);
	});

	it('object with toString for CEP → coerces and validates', () => {
		const malicious = { toString: () => '01001000' };
		const result = validateCep(malicious as unknown as string);
		expect(result.valid).toBe(true);
	});

	it('object with toString for CPF → coerces and validates', () => {
		const malicious = { toString: () => '52998224725' };
		const result = validateCpf(malicious as unknown as string);
		expect(result.valid).toBe(true);
	});

	it('null input → invalid (coerced to empty string)', () => {
		const result = validateCnpj(null as unknown as string);
		expect(result.valid).toBe(false);
	});

	it('undefined input → invalid (coerced to empty string)', () => {
		const result = validateCnpj(undefined as unknown as string);
		expect(result.valid).toBe(false);
	});

	it('array input → coerced via String([...]) and validates', () => {
		// String(['11222333000181']) → '11222333000181' → valid CNPJ
		const result = validateCnpj(['11222333000181'] as unknown as string);
		expect(result.valid).toBe(true);
	});

	it('stripNonDigits with null → empty string', () => {
		expect(stripNonDigits(null as unknown as string)).toBe('');
	});

	it('stripNonDigits with undefined → empty string', () => {
		expect(stripNonDigits(undefined as unknown as string)).toBe('');
	});
});

// =============================================================================
// VECTOR 4: Integer Overflow / Boundary CEP values
// =============================================================================
// PREDICTION: parseInt('99999999') = 99999999, well within safe integer range.
//             Number.MAX_SAFE_INTEGER as string = 17 digits → length !== 8 → invalid.
//             No overflow issue expected. PASS.

describe('VECTOR 4: Integer Overflow / Boundary Values', () => {
	it('should handle CEP 99999999 (max valid) without overflow', () => {
		const result = validateCep('99999999');
		expect(result.valid).toBe(true);
		expect(result.formatted).toBe('99999-999');
	});

	it('should reject Number.MAX_SAFE_INTEGER as string (too many digits)', () => {
		const maxSafe = Number.MAX_SAFE_INTEGER.toString(); // "9007199254740991" — 16 digits
		const result = validateCep(maxSafe);
		expect(result.valid).toBe(false);
	});

	it('should reject huge number string for CEP', () => {
		const huge = '9'.repeat(100);
		const result = validateCep(huge);
		expect(result.valid).toBe(false);
	});

	it('should handle CEP at parseInt boundary correctly', () => {
		// CEP '00999999' → parseInt = 999999 < 1000000 → invalid
		const result = validateCep('00999999');
		expect(result.valid).toBe(false);
	});

	it('should handle CEP exactly at boundary: 01000000', () => {
		// parseInt('01000000') = 1000000 — this is the boundary
		// The check is < 1000000, so 1000000 should be valid
		const result = validateCep('01000000');
		expect(result.valid).toBe(true);
	});

	it('should reject CEP just below boundary: 00999999', () => {
		// parseInt('00999999') = 999999 < 1000000 → invalid
		const result = validateCep('00999999');
		expect(result.valid).toBe(false);
	});

	it('should handle CNPJ near Number.MAX_SAFE_INTEGER', () => {
		// 14-digit number: 90071992547409 is within safe range (< 2^53)
		// but likely invalid checksum
		const result = validateCnpj('90071992547409');
		expect(result.valid).toBe(false); // checksum won't match
	});

	it('should handle CPF near Number.MAX_SAFE_INTEGER', () => {
		const result = validateCpf('90071992547');
		// Just checking it doesn't crash — checksum unlikely to match
		expect(typeof result.valid).toBe('boolean');
	});
});

// =============================================================================
// VECTOR 5: Regex ReDoS
// =============================================================================
// PREDICTION: ^(\d)\1{13}$ is a simple regex with no alternation or nested quantifiers.
//             It's O(n) and cannot be attacked. PASS.

describe('VECTOR 5: Regex ReDoS', () => {
	it('should not hang on very long repeated-digit string (CNPJ regex)', () => {
		const start = Date.now();
		// Even though length check catches this first, let's test the regex path
		// by giving exactly 14 chars that almost match
		const almostMatch = '1'.repeat(13) + '2';
		const result = validateCnpj(almostMatch);
		const elapsed = Date.now() - start;

		expect(result.valid).toBe(false);
		expect(elapsed).toBeLessThan(100); // Should be instant
	});

	it('should not hang on repeated-digit CPF string', () => {
		const start = Date.now();
		const almostMatch = '1'.repeat(10) + '2';
		const result = validateCpf(almostMatch);
		const elapsed = Date.now() - start;

		expect(result.valid).toBe(false);
		expect(elapsed).toBeLessThan(100);
	});

	it('should handle stripNonDigits on massive input without hanging', () => {
		const start = Date.now();
		const massive = 'a1b2c3d4e5f6g7h8i9j0'.repeat(10000); // 200k chars
		const result = stripNonDigits(massive);
		const elapsed = Date.now() - start;

		expect(result.length).toBe(100000);
		expect(elapsed).toBeLessThan(1000); // Should be well under 1 second
	});
});

// =============================================================================
// VECTOR 6: safeStr with exotic types
// =============================================================================
// PREDICTION:
//   - Symbol: typeof === 'symbol' → not string/number/boolean → returns ''  ✅
//   - BigInt: typeof === 'bigint' → not string/number/boolean → returns ''  ✅
//     BUT BigInt HAS a .toString() method. safeStr deliberately ignores it.
//   - Proxy: depends on the target. typeof on Proxy is transparent.
//   - Array: typeof === 'object' → returns ''  ✅
//   - Function: typeof === 'function' → returns ''  ✅
//   All should PASS (return '' for exotic types).

describe('VECTOR 6: safeStr with exotic types', () => {
	it('should return empty string for Symbol', () => {
		const sym = Symbol('test');
		expect(safeStr(sym)).toBe('');
	});

	it('should return empty string for BigInt', () => {
		const big = BigInt(11222333000181);
		expect(safeStr(big)).toBe('');
	});

	it('should return empty string for Array', () => {
		expect(safeStr([1, 2, 3])).toBe('');
	});

	it('should return empty string for nested Array', () => {
		expect(safeStr(['11222333000181'])).toBe('');
	});

	it('should return empty string for plain object', () => {
		expect(safeStr({ value: 42 })).toBe('');
	});

	it('should return empty string for null', () => {
		expect(safeStr(null)).toBe('');
	});

	it('should return empty string for undefined', () => {
		expect(safeStr(undefined)).toBe('');
	});

	it('should return empty string for Function', () => {
		expect(safeStr(() => '11222333000181')).toBe('');
	});

	it('should return empty string for Date object', () => {
		expect(safeStr(new Date())).toBe('');
	});

	it('should return empty string for RegExp', () => {
		expect(safeStr(/test/)).toBe('');
	});

	it('should return empty string for Map', () => {
		expect(safeStr(new Map())).toBe('');
	});

	it('should return empty string for Set', () => {
		expect(safeStr(new Set())).toBe('');
	});

	it('should handle Proxy wrapping a string object (transparent typeof)', () => {
		// Note: Proxy requires an object target, so we use Object('hello')
		// typeof Object('hello') === 'object' → returns ''
		const proxy = new Proxy(Object('hello'), {});
		expect(safeStr(proxy)).toBe('');
	});

	it('should handle Proxy wrapping an object', () => {
		const proxy = new Proxy({}, {
			get: (_target, prop) => {
				if (prop === 'toString') return () => 'sneaky';
				return undefined;
			},
		});
		// typeof Proxy({}) === 'object' → returns ''
		expect(safeStr(proxy)).toBe('');
	});

	it('should handle Proxy wrapping a number', () => {
		const proxy = new Proxy(Object(42), {});
		// typeof Object(42) === 'object' → returns ''
		expect(safeStr(proxy)).toBe('');
	});

	it('should convert NaN to string', () => {
		expect(safeStr(NaN)).toBe('NaN');
	});

	it('should convert Infinity to string', () => {
		expect(safeStr(Infinity)).toBe('Infinity');
	});

	it('should convert negative Infinity to string', () => {
		expect(safeStr(-Infinity)).toBe('-Infinity');
	});

	it('should convert negative zero to string', () => {
		expect(safeStr(-0)).toBe('0');
	});

	it('should handle boolean true', () => {
		expect(safeStr(true)).toBe('true');
	});

	it('should handle boolean false', () => {
		expect(safeStr(false)).toBe('false');
	});

	it('should handle empty string', () => {
		expect(safeStr('')).toBe('');
	});

	it('should handle string with only whitespace', () => {
		expect(safeStr('   ')).toBe('   ');
	});
});

// =============================================================================
// VECTOR 7: NaN Propagation in Checksum Calculation
// =============================================================================
// PREDICTION: stripNonDigits guarantees only ASCII digits [0-9] remain.
//             So parseInt on each digit[i] will never return NaN for valid-length input
//             that passed through stripNonDigits.
//             However, if stripNonDigits is somehow bypassed or returns unexpected chars,
//             NaN would propagate: NaN * weight = NaN, sum + NaN = NaN,
//             NaN % 11 = NaN, NaN < 2 = false, 11 - NaN = NaN, NaN !== check → invalid.
//             So NaN would cause validation to fail (false negative), not pass (no false positive).
//             This is SAFE behavior even in the NaN case.

describe('VECTOR 7: NaN Propagation', () => {
	it('should reject CNPJ where digits contain non-digit after strip (theoretical)', () => {
		// This tests what happens if somehow a non-digit char makes it through
		// We can't directly test this without bypassing stripNonDigits,
		// but we can verify the behavior by testing edge cases
		const result = validateCnpj('ab.cde.fgh/ijkl-mn');
		expect(result.valid).toBe(false);
		expect(result.formatted).toBe('');
	});

	it('should reject CPF where all digits stripped leaves empty', () => {
		const result = validateCpf('!!!!!!!!!!!');
		expect(result.valid).toBe(false);
	});

	it('should handle CNPJ with mixed valid digits and unicode non-digits', () => {
		// Mix ASCII digits with non-digit unicode that stripNonDigits will remove
		// \u0661 = Arabic-Indic digit 1 — NOT matched by \d in JS (ASCII-only)
		// So stripNonDigits removes them. Let's build carefully:
		// We want '1' + \u0661 + '1' + '2' + '2' + '2' + '3' + '3' + '3' + '0' + '0' + '0' + '1' + '8' + '1'
		// After strip: '112223330001811' = 15 ASCII digits — too many!
		// The original test had the wrong expectation. Let's fix:
		// Insert Arabic digits BETWEEN ASCII digits that form a valid CNPJ
		const mixed = '1\u06611\u0662222333000181';
		// After strip: the Arabic digits are removed, leaving the ASCII digits
		// Count ASCII digits: 1,1,2,2,2,3,3,3,0,0,0,1,8,1 = 14 digits = '11222333000181'
		const result = validateCnpj(mixed);
		expect(result.valid).toBe(true);
	});

	it('should handle CPF where parseInt would return NaN if digits were non-ASCII', () => {
		// Verify that stripNonDigits correctly removes Arabic-Indic digits
		// so parseInt never sees them
		const arabicDigits = '\u0661\u0662\u0663\u0664\u0665\u0666\u0667\u0668\u0669\u0660\u0669';
		const result = validateCpf(arabicDigits);
		// All stripped → empty → length !== 11 → invalid
		expect(result.valid).toBe(false);
	});

	it('NaN arithmetic should cause validation failure, not success', () => {
		// Direct test: if NaN gets into checksum, verify it causes rejection
		// We simulate by directly testing parseInt behavior
		const nanResult = Number.parseInt('not-a-number', 10);
		expect(Number.isNaN(nanResult)).toBe(true);
		expect(Number.isNaN(nanResult * 5)).toBe(true);
		expect(Number.isNaN(0 + nanResult)).toBe(true);
		expect(Number.isNaN(NaN % 11)).toBe(true);
		// NaN < 2 → false, so check would be 11 - NaN = NaN
		expect(NaN < 2).toBe(false);
		expect(Number.isNaN(11 - NaN)).toBe(true);
		// NaN is never equal to anything (including itself) → validation always fails
		const nanVal = Number.parseInt('not-a-digit', 10);
		expect(Number.isNaN(nanVal)).toBe(true);
		// So if NaN leaks into check1/check2, comparison with digit fails → rejected
		// This is inherently SAFE: NaN causes false-negative, never false-positive
	});
});

// =============================================================================
// BONUS VECTOR: Edge cases in input field preservation
// =============================================================================

describe('BONUS: Input preservation attacks', () => {
	it('should preserve original input including malicious characters in result', () => {
		const xssAttempt = '<script>alert("xss")</script>11222333000181';
		const result = validateCnpj(xssAttempt);
		// The input field should preserve the original string exactly
		expect(result.input).toBe(xssAttempt);
		// After stripping HTML tags (all non-digits removed), we get just digits
		// 'scriptalertxss/script11222333000181' stripped → '11222333000181' → valid!
		expect(result.valid).toBe(true);
	});

	it('should preserve prototype-like strings in input', () => {
		const protoAttempt = '__proto__11222333000181';
		const result = validateCnpj(protoAttempt);
		expect(result.input).toBe(protoAttempt);
		// strip non-digits: '11222333000181' → valid CNPJ
		expect(result.valid).toBe(true);
	});

	it('should preserve constructor pollution attempt in input', () => {
		const constructorAttempt = 'constructor11222333000181';
		const result = validateCnpj(constructorAttempt);
		expect(result.input).toBe(constructorAttempt);
		expect(result.valid).toBe(true);
	});
});

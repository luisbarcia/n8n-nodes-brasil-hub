/**
 * Adversarial attack tests for cambio and taxas execute handlers.
 *
 * Vectors:
 * 1. Type confusion — wrong types for parameters (number, object, null, undefined)
 * 2. Null injection — null/undefined in arrays and params
 * 3. XSS payloads — script tags in currency code, rate code, date
 * 4. Overflow — very long strings (1000+ chars), very large numbers
 * 5. Unicode — unicode chars in currency code, date, rate code
 * 6. Path traversal — "../" in URL parameters
 * 7. SQL injection patterns — "'; DROP TABLE--" in string params
 * 8. Empty/whitespace — empty strings, whitespace-only, leading/trailing spaces
 */

import { cambioCurrencies, cambioRate } from '../nodes/BrasilHub/resources/cambio/cambio.execute';
import { taxasList, taxasQuery } from '../nodes/BrasilHub/resources/taxas/taxas.execute';
import { normalizeCurrencies, normalizeCotacoes } from '../nodes/BrasilHub/resources/cambio/cambio.normalize';
import { normalizeTaxa, normalizeTaxas } from '../nodes/BrasilHub/resources/taxas/taxas.normalize';
import type { IExecuteFunctions } from 'n8n-workflow';

// ─── Helpers ──────────────────────────────────────────────────────────

/** Sentinel value to distinguish "no httpResponse argument" from "explicitly null". */
const NO_RESPONSE = Symbol('NO_RESPONSE');

function createCambioRateContext(
	overrides: Record<string, unknown> = {},
	httpResponse: unknown = NO_RESPONSE,
) {
	const params: Record<string, unknown> = {
		currencyCode: 'USD',
		date: '2024-01-15',
		includeRaw: false,
		timeout: 10000,
		primaryProvider: 'auto',
		...overrides,
	};
	const resolvedResponse = httpResponse === NO_RESPONSE
		? {
			moeda: 'USD',
			data: '2024-01-15',
			cotacoes: [{ cotacao_compra: 4.95, cotacao_venda: 4.96, paridade_compra: 1, paridade_venda: 1, data_hora_cotacao: '2024-01-15T10:00:00', tipo_boletim: 'Abertura' }],
		}
		: httpResponse;
	return {
		getNodeParameter: jest.fn((name: string, _index: number, fallback?: unknown) =>
			params[name] ?? fallback,
		),
		getNode: jest.fn(() => ({ name: 'Brasil Hub' })),
		helpers: {
			httpRequest: jest.fn().mockResolvedValue(resolvedResponse),
		},
	} as unknown as IExecuteFunctions;
}

function createCambioCurrenciesContext(
	overrides: Record<string, unknown> = {},
	httpResponse: unknown = NO_RESPONSE,
) {
	const params: Record<string, unknown> = {
		includeRaw: false,
		timeout: 10000,
		primaryProvider: 'auto',
		...overrides,
	};
	const resolvedResponse = httpResponse === NO_RESPONSE
		? [{ simbolo: 'USD', nome: 'Dollar', tipo_moeda: 'A' }]
		: httpResponse;
	return {
		getNodeParameter: jest.fn((name: string, _index: number, fallback?: unknown) =>
			params[name] ?? fallback,
		),
		getNode: jest.fn(() => ({ name: 'Brasil Hub' })),
		helpers: {
			httpRequest: jest.fn().mockResolvedValue(resolvedResponse),
		},
	} as unknown as IExecuteFunctions;
}

function createTaxasQueryContext(
	overrides: Record<string, unknown> = {},
	httpResponse: unknown = NO_RESPONSE,
) {
	const params: Record<string, unknown> = {
		rateCode: 'Selic',
		includeRaw: false,
		timeout: 10000,
		primaryProvider: 'auto',
		...overrides,
	};
	const resolvedResponse = httpResponse === NO_RESPONSE
		? { nome: 'Selic', valor: 13.75 }
		: httpResponse;
	return {
		getNodeParameter: jest.fn((name: string, _index: number, fallback?: unknown) =>
			params[name] ?? fallback,
		),
		getNode: jest.fn(() => ({ name: 'Brasil Hub' })),
		helpers: {
			httpRequest: jest.fn().mockResolvedValue(resolvedResponse),
		},
	} as unknown as IExecuteFunctions;
}

function createTaxasListContext(
	overrides: Record<string, unknown> = {},
	httpResponse: unknown = NO_RESPONSE,
) {
	const params: Record<string, unknown> = {
		includeRaw: false,
		timeout: 10000,
		primaryProvider: 'auto',
		...overrides,
	};
	const resolvedResponse = httpResponse === NO_RESPONSE
		? [{ nome: 'Selic', valor: 13.75 }]
		: httpResponse;
	return {
		getNodeParameter: jest.fn((name: string, _index: number, fallback?: unknown) =>
			params[name] ?? fallback,
		),
		getNode: jest.fn(() => ({ name: 'Brasil Hub' })),
		helpers: {
			httpRequest: jest.fn().mockResolvedValue(resolvedResponse),
		},
	} as unknown as IExecuteFunctions;
}

// ═══════════════════════════════════════════════════════════════════════
// VECTOR 1: Type confusion
// ═══════════════════════════════════════════════════════════════════════

describe('VECTOR 1: Type confusion', () => {
	describe('cambioRate — currencyCode type confusion', () => {
		it.each([
			['number 123', 123],
			['boolean true', true],
			['object {}', {}],
			['array []', []],
			['null', null],
			['undefined', undefined],
		])('currencyCode = %s → rejects with NodeOperationError', async (_label, value) => {
			const ctx = createCambioRateContext({ currencyCode: value });
			await expect(cambioRate(ctx, 0)).rejects.toThrow('Invalid currency code');
			// Must NOT have made any HTTP request
			expect(ctx.helpers.httpRequest).not.toHaveBeenCalled();
		});

		it.each([
			['number 20240115', 20240115],
			['boolean false', false],
			['object {year: 2024}', { year: 2024 }],
			['null', null],
			['undefined', undefined],
		])('date = %s → rejects with NodeOperationError', async (_label, value) => {
			const ctx = createCambioRateContext({ date: value });
			await expect(cambioRate(ctx, 0)).rejects.toThrow('Invalid');
			expect(ctx.helpers.httpRequest).not.toHaveBeenCalled();
		});
	});

	describe('taxasQuery — rateCode type confusion', () => {
		it.each([
			['object {}', {}],
			['array []', []],
			['null', null],
			['undefined', undefined],
		])('rateCode = %s → rejects with NodeOperationError', async (_label, value) => {
			const ctx = createTaxasQueryContext({ rateCode: value });
			await expect(taxasQuery(ctx, 0)).rejects.toThrow('Invalid rate code');
			expect(ctx.helpers.httpRequest).not.toHaveBeenCalled();
		});

		// String() coercion: number 999 → "999", boolean true → "true"
		// Both match ^[A-Za-z0-9_-]{1,50}$ — this is correct behavior (resilient coercion)
		it.each([
			['number 999 → "999"', 999],
			['boolean true → "true"', true],
		])('rateCode = %s → coerced to valid string, accepted', async (_label, value) => {
			const ctx = createTaxasQueryContext({ rateCode: value });
			await expect(taxasQuery(ctx, 0)).resolves.toBeDefined();
			expect(ctx.helpers.httpRequest).toHaveBeenCalled();
		});
	});

	describe('normalizers with wrong types', () => {
		it('normalizeCurrencies with number → returns empty array', () => {
			expect(normalizeCurrencies(42)).toEqual([]);
		});

		it('normalizeCurrencies with string → returns empty array', () => {
			expect(normalizeCurrencies('not an array')).toEqual([]);
		});

		it('normalizeCurrencies with boolean → returns empty array', () => {
			expect(normalizeCurrencies(true)).toEqual([]);
		});

		it('normalizeCotacoes with number → returns empty array', () => {
			expect(normalizeCotacoes(42)).toEqual([]);
		});

		it('normalizeTaxa with number → returns default object', () => {
			const result = normalizeTaxa(42);
			expect(result.name).toBe('');
			expect(result.value).toBe(0);
		});

		it('normalizeTaxa with string → returns default object', () => {
			const result = normalizeTaxa('hello');
			expect(result.name).toBe('');
			expect(result.value).toBe(0);
		});

		it('normalizeTaxas with number → returns empty array', () => {
			expect(normalizeTaxas(42)).toEqual([]);
		});

		it('normalizeTaxas with boolean → returns empty array', () => {
			expect(normalizeTaxas(true)).toEqual([]);
		});
	});
});

// ═══════════════════════════════════════════════════════════════════════
// VECTOR 2: Null injection
// ═══════════════════════════════════════════════════════════════════════

describe('VECTOR 2: Null injection', () => {
	describe('normalizeCurrencies with null entries in array', () => {
		it('array with null entries → filters them out', () => {
			const data = [null, { simbolo: 'USD', nome: 'Dollar', tipo_moeda: 'A' }, null, undefined];
			const result = normalizeCurrencies(data);
			expect(result).toHaveLength(1);
			expect(result[0].symbol).toBe('USD');
		});
	});

	describe('normalizeCotacoes with null cotacoes entries', () => {
		it('cotacoes array with null entries → filters them out', () => {
			const data = {
				moeda: 'USD',
				data: '2024-01-15',
				cotacoes: [null, { cotacao_compra: 4.95, cotacao_venda: 4.96 }, undefined],
			};
			const result = normalizeCotacoes(data);
			expect(result).toHaveLength(1);
			expect(result[0].buyRate).toBe(4.95);
		});
	});

	describe('normalizeTaxas with null entries', () => {
		it('array with null entries → filters them out', () => {
			const data = [null, { nome: 'Selic', valor: 13.75 }, undefined, null];
			const result = normalizeTaxas(data);
			expect(result).toHaveLength(1);
			expect(result[0].name).toBe('Selic');
		});
	});

	describe('normalizeTaxa with null data', () => {
		it('null → returns defaults', () => {
			const result = normalizeTaxa(null);
			expect(result.name).toBe('');
			expect(result.value).toBe(0);
		});

		it('undefined → returns defaults', () => {
			const result = normalizeTaxa(undefined);
			expect(result.name).toBe('');
			expect(result.value).toBe(0);
		});
	});

	describe('normalizeCotacoes with null data', () => {
		it('null → returns empty array', () => {
			expect(normalizeCotacoes(null)).toEqual([]);
		});

		it('undefined → returns empty array', () => {
			expect(normalizeCotacoes(undefined)).toEqual([]);
		});
	});

	describe('normalizeCurrencies with null data', () => {
		it('null → returns empty array', () => {
			expect(normalizeCurrencies(null)).toEqual([]);
		});
	});

	describe('cambioCurrencies with API returning null', () => {
		it('API returns null → no crash, returns empty items', async () => {
			const ctx = createCambioCurrenciesContext({}, null);
			const result = await cambioCurrencies(ctx, 0);
			expect(result).toEqual([]);
		});
	});

	describe('taxasList with API returning null', () => {
		it('API returns null → no crash, returns empty items', async () => {
			const ctx = createTaxasListContext({}, null);
			const result = await taxasList(ctx, 0);
			expect(result).toEqual([]);
		});
	});
});

// ═══════════════════════════════════════════════════════════════════════
// VECTOR 3: XSS payloads
// ═══════════════════════════════════════════════════════════════════════

describe('VECTOR 3: XSS payloads', () => {
	const xssPayloads = [
		'<script>alert(1)</script>',
		'"><img src=x onerror=alert(1)>',
		"'; alert('xss'); '",
		'javascript:alert(1)',
		'<svg onload=alert(1)>',
	];

	describe('cambioRate — XSS in currencyCode', () => {
		it.each(xssPayloads.map((p) => [p]))('currencyCode = "%s" → rejects', async (payload) => {
			const ctx = createCambioRateContext({ currencyCode: payload });
			await expect(cambioRate(ctx, 0)).rejects.toThrow('Invalid currency code');
			expect(ctx.helpers.httpRequest).not.toHaveBeenCalled();
		});
	});

	describe('cambioRate — XSS in date', () => {
		it.each(xssPayloads.map((p) => [p]))('date = "%s" → rejects', async (payload) => {
			const ctx = createCambioRateContext({ date: payload });
			await expect(cambioRate(ctx, 0)).rejects.toThrow('Invalid date');
			expect(ctx.helpers.httpRequest).not.toHaveBeenCalled();
		});
	});

	describe('taxasQuery — XSS in rateCode', () => {
		it.each(xssPayloads.map((p) => [p]))('rateCode = "%s" → rejects', async (payload) => {
			const ctx = createTaxasQueryContext({ rateCode: payload });
			await expect(taxasQuery(ctx, 0)).rejects.toThrow('Invalid rate code');
			expect(ctx.helpers.httpRequest).not.toHaveBeenCalled();
		});
	});

	describe('error messages do NOT leak internal details', () => {
		it('cambioRate error does not include file paths', async () => {
			const ctx = createCambioRateContext({ currencyCode: '<script>' });
			try {
				await cambioRate(ctx, 0);
			} catch (e: unknown) {
				const msg = (e as Error).message;
				expect(msg).not.toMatch(/\//); // no file paths
				expect(msg).not.toMatch(/node_modules/);
				expect(msg).not.toMatch(/\.ts$/);
				expect(msg).not.toMatch(/\.js$/);
			}
		});

		it('taxasQuery error does not include file paths', async () => {
			const ctx = createTaxasQueryContext({ rateCode: '<script>' });
			try {
				await taxasQuery(ctx, 0);
			} catch (e: unknown) {
				const msg = (e as Error).message;
				expect(msg).not.toMatch(/node_modules/);
				expect(msg).not.toMatch(/\.ts$/);
				expect(msg).not.toMatch(/\.js$/);
			}
		});
	});
});

// ═══════════════════════════════════════════════════════════════════════
// VECTOR 4: Overflow
// ═══════════════════════════════════════════════════════════════════════

describe('VECTOR 4: Overflow — very long strings and large numbers', () => {
	describe('cambioRate — overflow in currencyCode', () => {
		it('1000-char string → rejects (not 3 uppercase letters)', async () => {
			const longStr = 'A'.repeat(1000);
			const ctx = createCambioRateContext({ currencyCode: longStr });
			await expect(cambioRate(ctx, 0)).rejects.toThrow('Invalid currency code');
			expect(ctx.helpers.httpRequest).not.toHaveBeenCalled();
		});

		it('4-char valid-looking code → rejects (must be exactly 3)', async () => {
			const ctx = createCambioRateContext({ currencyCode: 'USDC' });
			await expect(cambioRate(ctx, 0)).rejects.toThrow('Invalid currency code');
			expect(ctx.helpers.httpRequest).not.toHaveBeenCalled();
		});
	});

	describe('cambioRate — overflow in date', () => {
		it('1000-char string → rejects', async () => {
			const longStr = '2024-01-15' + 'x'.repeat(1000);
			const ctx = createCambioRateContext({ date: longStr });
			await expect(cambioRate(ctx, 0)).rejects.toThrow('Invalid date');
			expect(ctx.helpers.httpRequest).not.toHaveBeenCalled();
		});
	});

	describe('taxasQuery — overflow in rateCode', () => {
		it('1000-char string → rejects (max 50 chars)', async () => {
			const longStr = 'A'.repeat(1000);
			const ctx = createTaxasQueryContext({ rateCode: longStr });
			await expect(taxasQuery(ctx, 0)).rejects.toThrow('Invalid rate code');
			expect(ctx.helpers.httpRequest).not.toHaveBeenCalled();
		});

		it('51-char string → rejects (boundary test at 50)', async () => {
			const str51 = 'A'.repeat(51);
			const ctx = createTaxasQueryContext({ rateCode: str51 });
			await expect(taxasQuery(ctx, 0)).rejects.toThrow('Invalid rate code');
			expect(ctx.helpers.httpRequest).not.toHaveBeenCalled();
		});

		it('50-char string → accepts (at boundary)', async () => {
			const str50 = 'A'.repeat(50);
			const ctx = createTaxasQueryContext({ rateCode: str50 });
			// Should NOT throw — 50 is within limit
			await expect(taxasQuery(ctx, 0)).resolves.toBeDefined();
			expect(ctx.helpers.httpRequest).toHaveBeenCalled();
		});
	});

	describe('normalizers with extremely large values', () => {
		it('normalizeTaxa with Number.MAX_SAFE_INTEGER → preserves value', () => {
			const result = normalizeTaxa({ nome: 'test', valor: Number.MAX_SAFE_INTEGER });
			expect(result.value).toBe(Number.MAX_SAFE_INTEGER);
		});

		it('normalizeTaxa with Infinity → defaults to 0', () => {
			const result = normalizeTaxa({ nome: 'test', valor: Infinity });
			expect(result.value).toBe(0);
		});

		it('normalizeTaxa with -Infinity → defaults to 0', () => {
			const result = normalizeTaxa({ nome: 'test', valor: -Infinity });
			expect(result.value).toBe(0);
		});

		it('normalizeTaxa with NaN → defaults to 0', () => {
			const result = normalizeTaxa({ nome: 'test', valor: NaN });
			expect(result.value).toBe(0);
		});

		it('normalizeCotacoes with Infinity rates → defaults to 0', () => {
			const data = {
				moeda: 'USD',
				data: '2024-01-15',
				cotacoes: [{ cotacao_compra: Infinity, cotacao_venda: -Infinity, paridade_compra: NaN, paridade_venda: 0 }],
			};
			const result = normalizeCotacoes(data);
			expect(result[0].buyRate).toBe(0);
			expect(result[0].sellRate).toBe(0);
			expect(result[0].buyParity).toBe(0);
			expect(result[0].sellParity).toBe(0);
		});
	});
});

// ═══════════════════════════════════════════════════════════════════════
// VECTOR 5: Unicode
// ═══════════════════════════════════════════════════════════════════════

describe('VECTOR 5: Unicode chars in parameters', () => {
	describe('cambioRate — unicode in currencyCode', () => {
		it.each([
			['emoji 💰', '💰💰💰'],
			['CJK chars', '美元币'],
			['Cyrillic USD lookalike', 'UЅD'],
			['zero-width joiner', 'US\u200DD'],
			['combining diacritical', 'U\u0308SD'],
			['right-to-left override', '\u202EDSU'],
		])('currencyCode = %s → rejects', async (_label, value) => {
			const ctx = createCambioRateContext({ currencyCode: value });
			await expect(cambioRate(ctx, 0)).rejects.toThrow('Invalid currency code');
			expect(ctx.helpers.httpRequest).not.toHaveBeenCalled();
		});
	});

	describe('cambioRate — unicode in date', () => {
		it.each([
			['fullwidth digits', '２０２４-０１-１５'],
			['arabic digits', '٢٠٢٤-٠١-١٥'],
			['emoji in date', '2024-01-1️⃣5️⃣'],
		])('date = %s → rejects', async (_label, value) => {
			const ctx = createCambioRateContext({ date: value });
			await expect(cambioRate(ctx, 0)).rejects.toThrow('Invalid date');
			expect(ctx.helpers.httpRequest).not.toHaveBeenCalled();
		});
	});

	describe('taxasQuery — unicode in rateCode', () => {
		it.each([
			['emoji', '📈Selic'],
			['CJK chars', '利率'],
			['combining chars', 'Se\u0308lic'],
			['zero-width space', 'Se\u200Blic'],
		])('rateCode = %s → rejects', async (_label, value) => {
			const ctx = createTaxasQueryContext({ rateCode: value });
			await expect(taxasQuery(ctx, 0)).rejects.toThrow('Invalid rate code');
			expect(ctx.helpers.httpRequest).not.toHaveBeenCalled();
		});
	});

	describe('normalizers with unicode data (downstream — already past validation)', () => {
		it('normalizeCurrencies with unicode symbol → preserves as-is via safeStr', () => {
			const data = [{ simbolo: '💰', nome: 'Moeda Especial', tipo_moeda: 'B' }];
			const result = normalizeCurrencies(data);
			expect(result[0].symbol).toBe('💰');
		});

		it('normalizeTaxa with unicode name → preserves as-is via safeStr', () => {
			const result = normalizeTaxa({ nome: 'Taxa Sêlic', valor: 13.75 });
			expect(result.name).toBe('Taxa Sêlic');
		});
	});
});

// ═══════════════════════════════════════════════════════════════════════
// VECTOR 6: Path traversal
// ═══════════════════════════════════════════════════════════════════════

describe('VECTOR 6: Path traversal', () => {
	describe('cambioRate — path traversal in currencyCode', () => {
		it.each([
			'../../../etc/passwd',
			'..%2F..%2Fetc%2Fpasswd',
			'USD/../../../etc/passwd',
			'USD/..\\..\\windows\\system32',
		])('currencyCode = "%s" → rejects (not 3 uppercase letters)', async (payload) => {
			const ctx = createCambioRateContext({ currencyCode: payload });
			await expect(cambioRate(ctx, 0)).rejects.toThrow('Invalid currency code');
			expect(ctx.helpers.httpRequest).not.toHaveBeenCalled();
		});
	});

	describe('cambioRate — path traversal in date', () => {
		it.each([
			'../../../etc/passwd',
			'2024-01-15/../../admin',
			'2024-01-15%00',
		])('date = "%s" → rejects (not YYYY-MM-DD)', async (payload) => {
			const ctx = createCambioRateContext({ date: payload });
			await expect(cambioRate(ctx, 0)).rejects.toThrow('Invalid date');
			expect(ctx.helpers.httpRequest).not.toHaveBeenCalled();
		});
	});

	describe('taxasQuery — path traversal in rateCode', () => {
		it.each([
			'../../../etc/passwd',
			'Selic/../../../admin',
			'Selic%00',
		])('rateCode = "%s" → rejects (dots, slashes, percent not allowed)', async (payload) => {
			const ctx = createTaxasQueryContext({ rateCode: payload });
			await expect(taxasQuery(ctx, 0)).rejects.toThrow('Invalid rate code');
			expect(ctx.helpers.httpRequest).not.toHaveBeenCalled();
		});
	});

	describe('encodeURIComponent is used even after validation passes', () => {
		it('cambioRate encodes currency in URL', async () => {
			const ctx = createCambioRateContext({ currencyCode: 'USD', date: '2024-01-15' });
			await cambioRate(ctx, 0);
			const httpMock = ctx.helpers.httpRequest as jest.Mock;
			const callUrl = httpMock.mock.calls[0][0].url as string;
			// Valid input is already URL-safe, but the URL should contain the correct path
			expect(callUrl).toContain('/cotacao/USD/2024-01-15');
			expect(callUrl).not.toContain('../');
		});

		it('taxasQuery encodes rateCode in URL', async () => {
			const ctx = createTaxasQueryContext({ rateCode: 'Selic' });
			await taxasQuery(ctx, 0);
			const httpMock = ctx.helpers.httpRequest as jest.Mock;
			const callUrl = httpMock.mock.calls[0][0].url as string;
			expect(callUrl).toContain('/taxas/v1/Selic');
			expect(callUrl).not.toContain('../');
		});
	});
});

// ═══════════════════════════════════════════════════════════════════════
// VECTOR 7: SQL injection patterns
// ═══════════════════════════════════════════════════════════════════════

describe('VECTOR 7: SQL injection patterns', () => {
	const sqlPayloads = [
		"'; DROP TABLE rates--",
		"1' OR '1'='1",
		'1; SELECT * FROM users',
		"' UNION SELECT * FROM information_schema.tables--",
		'Robert\'); DROP TABLE Students;--',
	];

	describe('cambioRate — SQL injection in currencyCode', () => {
		it.each(sqlPayloads.map((p) => [p]))('currencyCode = "%s" → rejects', async (payload) => {
			const ctx = createCambioRateContext({ currencyCode: payload });
			await expect(cambioRate(ctx, 0)).rejects.toThrow('Invalid currency code');
			expect(ctx.helpers.httpRequest).not.toHaveBeenCalled();
		});
	});

	describe('cambioRate — SQL injection in date', () => {
		it.each(sqlPayloads.map((p) => [p]))('date = "%s" → rejects', async (payload) => {
			const ctx = createCambioRateContext({ date: payload });
			await expect(cambioRate(ctx, 0)).rejects.toThrow('Invalid date');
			expect(ctx.helpers.httpRequest).not.toHaveBeenCalled();
		});
	});

	describe('taxasQuery — SQL injection in rateCode', () => {
		it.each(sqlPayloads.map((p) => [p]))('rateCode = "%s" → rejects', async (payload) => {
			const ctx = createTaxasQueryContext({ rateCode: payload });
			await expect(taxasQuery(ctx, 0)).rejects.toThrow('Invalid rate code');
			expect(ctx.helpers.httpRequest).not.toHaveBeenCalled();
		});
	});
});

// ═══════════════════════════════════════════════════════════════════════
// VECTOR 8: Empty/whitespace
// ═══════════════════════════════════════════════════════════════════════

describe('VECTOR 8: Empty and whitespace strings', () => {
	describe('cambioRate — empty/whitespace currencyCode', () => {
		it.each([
			['empty string', ''],
			['single space', ' '],
			['multiple spaces', '     '],
			['tab', '\t'],
			['newline', '\n'],
			['mixed whitespace', ' \t\n '],
		])('currencyCode = %s → rejects', async (_label, value) => {
			const ctx = createCambioRateContext({ currencyCode: value });
			await expect(cambioRate(ctx, 0)).rejects.toThrow('Invalid currency code');
			expect(ctx.helpers.httpRequest).not.toHaveBeenCalled();
		});
	});

	describe('cambioRate — empty/whitespace date', () => {
		it.each([
			['empty string', ''],
			['single space', ' '],
			['multiple spaces', '     '],
			['tab', '\t'],
			['newline', '\n'],
		])('date = %s → rejects', async (_label, value) => {
			const ctx = createCambioRateContext({ date: value });
			await expect(cambioRate(ctx, 0)).rejects.toThrow('Invalid date');
			expect(ctx.helpers.httpRequest).not.toHaveBeenCalled();
		});
	});

	describe('taxasQuery — empty/whitespace rateCode', () => {
		it.each([
			['empty string', ''],
			['single space', ' '],
			['multiple spaces', '     '],
			['tab', '\t'],
			['newline', '\n'],
		])('rateCode = %s → rejects', async (_label, value) => {
			const ctx = createTaxasQueryContext({ rateCode: value });
			await expect(taxasQuery(ctx, 0)).rejects.toThrow('Invalid rate code');
			expect(ctx.helpers.httpRequest).not.toHaveBeenCalled();
		});
	});

	describe('cambioRate — valid input with leading/trailing spaces (should trim and accept)', () => {
		it('currencyCode " USD " → trims to "USD" and accepts', async () => {
			const ctx = createCambioRateContext({ currencyCode: ' USD ' });
			await expect(cambioRate(ctx, 0)).resolves.toBeDefined();
			expect(ctx.helpers.httpRequest).toHaveBeenCalled();
		});

		it('currencyCode "usd" (lowercase) → converts to "USD" and accepts', async () => {
			const ctx = createCambioRateContext({ currencyCode: 'usd' });
			await expect(cambioRate(ctx, 0)).resolves.toBeDefined();
			expect(ctx.helpers.httpRequest).toHaveBeenCalled();
		});

		it('date " 2024-01-15 " → trims and accepts', async () => {
			const ctx = createCambioRateContext({ date: ' 2024-01-15 ' });
			await expect(cambioRate(ctx, 0)).resolves.toBeDefined();
			expect(ctx.helpers.httpRequest).toHaveBeenCalled();
		});
	});

	describe('taxasQuery — valid input with leading/trailing spaces', () => {
		it('rateCode " Selic " → trims and accepts', async () => {
			const ctx = createTaxasQueryContext({ rateCode: ' Selic ' });
			await expect(taxasQuery(ctx, 0)).resolves.toBeDefined();
			expect(ctx.helpers.httpRequest).toHaveBeenCalled();
		});
	});

	describe('cambioCurrencies and taxasList — no user input params (always work)', () => {
		it('cambioCurrencies succeeds with default context', async () => {
			const ctx = createCambioCurrenciesContext();
			const result = await cambioCurrencies(ctx, 0);
			expect(result).toHaveLength(1);
			expect(result[0].json).toHaveProperty('symbol', 'USD');
		});

		it('taxasList succeeds with default context', async () => {
			const ctx = createTaxasListContext();
			const result = await taxasList(ctx, 0);
			expect(result).toHaveLength(1);
			expect(result[0].json).toHaveProperty('name', 'Selic');
		});
	});
});

// ═══════════════════════════════════════════════════════════════════════
// BONUS: Edge cases — valid boundary inputs
// ═══════════════════════════════════════════════════════════════════════

describe('BONUS: Valid boundary inputs that SHOULD pass', () => {
	it('cambioRate with exactly 3-letter code "EUR" → accepts', async () => {
		const ctx = createCambioRateContext({ currencyCode: 'EUR', date: '2024-12-31' });
		await expect(cambioRate(ctx, 0)).resolves.toBeDefined();
	});

	it('cambioRate with 2-letter code "US" → rejects', async () => {
		const ctx = createCambioRateContext({ currencyCode: 'US' });
		await expect(cambioRate(ctx, 0)).rejects.toThrow('Invalid currency code');
	});

	it('cambioRate with date at year boundary "2000-01-01" → accepts', async () => {
		const ctx = createCambioRateContext({ date: '2000-01-01' });
		await expect(cambioRate(ctx, 0)).resolves.toBeDefined();
	});

	it('cambioRate with date "9999-12-31" → accepts (regex only, no semantic validation)', async () => {
		const ctx = createCambioRateContext({ date: '9999-12-31' });
		await expect(cambioRate(ctx, 0)).resolves.toBeDefined();
	});

	it('cambioRate with date "2024-13-40" → accepts (regex only validates format, not semantics)', async () => {
		// NOTE: This is a known limitation — regex validates format, not date validity
		const ctx = createCambioRateContext({ date: '2024-13-40' });
		await expect(cambioRate(ctx, 0)).resolves.toBeDefined();
	});

	it('taxasQuery with hyphenated code "taxa-selic" → accepts', async () => {
		const ctx = createTaxasQueryContext({ rateCode: 'taxa-selic' });
		await expect(taxasQuery(ctx, 0)).resolves.toBeDefined();
	});

	it('taxasQuery with underscored code "taxa_cdi" → accepts', async () => {
		const ctx = createTaxasQueryContext({ rateCode: 'taxa_cdi' });
		await expect(taxasQuery(ctx, 0)).resolves.toBeDefined();
	});

	it('taxasQuery with single char "S" → accepts', async () => {
		const ctx = createTaxasQueryContext({ rateCode: 'S' });
		await expect(taxasQuery(ctx, 0)).resolves.toBeDefined();
	});
});

// ═══════════════════════════════════════════════════════════════════════
// BONUS: API garbage responses (post-validation, pre-normalization)
// ═══════════════════════════════════════════════════════════════════════

describe('BONUS: API returns garbage after validation passes', () => {
	describe('cambioCurrencies with garbage API responses', () => {
		it.each([
			['empty object {}', {}],
			['string "error"', 'error'],
			['number 404', 404],
			['boolean false', false],
		])('API returns %s → returns empty items (no crash)', async (_label, apiData) => {
			const ctx = createCambioCurrenciesContext({}, apiData);
			const result = await cambioCurrencies(ctx, 0);
			expect(result).toEqual([]);
		});
	});

	describe('cambioRate with garbage API responses', () => {
		it('API returns empty object → returns empty cotacoes', async () => {
			const ctx = createCambioRateContext({}, {});
			const result = await cambioRate(ctx, 0);
			expect(result).toEqual([]);
		});

		it('API returns { cotacoes: null } → returns empty', async () => {
			const ctx = createCambioRateContext({}, { moeda: 'USD', data: '2024-01-15', cotacoes: null });
			const result = await cambioRate(ctx, 0);
			expect(result).toEqual([]);
		});

		it('API returns { cotacoes: "not array" } → returns empty', async () => {
			const ctx = createCambioRateContext({}, { moeda: 'USD', data: '2024-01-15', cotacoes: 'not array' });
			const result = await cambioRate(ctx, 0);
			expect(result).toEqual([]);
		});
	});

	describe('taxasList with garbage API responses', () => {
		it.each([
			['empty object {}', {}],
			['string "error"', 'error'],
			['number 500', 500],
		])('API returns %s → returns empty items', async (_label, apiData) => {
			const ctx = createTaxasListContext({}, apiData);
			const result = await taxasList(ctx, 0);
			expect(result).toEqual([]);
		});
	});

	describe('taxasQuery with garbage API responses', () => {
		it('API returns null → normalizer produces defaults', async () => {
			const ctx = createTaxasQueryContext({}, null);
			const result = await taxasQuery(ctx, 0);
			expect(result).toHaveLength(1);
			expect(result[0].json).toHaveProperty('name', '');
			expect(result[0].json).toHaveProperty('value', 0);
		});

		it('API returns string → normalizer produces defaults', async () => {
			const ctx = createTaxasQueryContext({}, 'garbage');
			const result = await taxasQuery(ctx, 0);
			expect(result).toHaveLength(1);
			expect(result[0].json).toHaveProperty('name', '');
			expect(result[0].json).toHaveProperty('value', 0);
		});
	});
});

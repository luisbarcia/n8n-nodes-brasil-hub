/**
 * Attack tests for execute handlers and fallback engine.
 *
 * Vectors:
 * 1. API returns garbage (null, undefined, "", "not json", 42, true, [])
 * 2. API returns error object instead of data
 * 3. HTTP status codes (404 vs 500 — fallback behavior)
 * 4. Timeout behavior (REQUEST_TIMEOUT_MS boundary)
 * 5. continueOnFail edge cases (no .message, string throw, throw null)
 * 6. Race condition: duplicate items in same batch
 * 7. banks.execute banksList includeRaw index mismatch after normalization
 * 8. DDD municipios fallback: string vs number strict equality on ddd field
 */

import { queryWithFallback } from '../nodes/BrasilHub/shared/fallback';
import { normalizeCnpj } from '../nodes/BrasilHub/resources/cnpj/cnpj.normalize';
import { normalizeCep } from '../nodes/BrasilHub/resources/cep/cep.normalize';
import { normalizeBank, normalizeBanks } from '../nodes/BrasilHub/resources/banks/banks.normalize';
import { normalizeDdd } from '../nodes/BrasilHub/resources/ddd/ddd.normalize';
import { cnpjQuery } from '../nodes/BrasilHub/resources/cnpj/cnpj.execute';
// cepQuery not directly tested (covered via BrasilHub.execute + normalizer tests)
import { banksList } from '../nodes/BrasilHub/resources/banks/banks.execute';
import { dddQuery } from '../nodes/BrasilHub/resources/ddd/ddd.execute';
import { fipeBrands, fipeModels, fipeYears, fipePrice } from '../nodes/BrasilHub/resources/fipe/fipe.execute';
import { BrasilHub } from '../nodes/BrasilHub/BrasilHub.node';
import type { IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';
import type { IProvider } from '../nodes/BrasilHub/types';

// ─── Helpers ──────────────────────────────────────────────────────────

function createFallbackContext(
	responseOrError: { data?: unknown; error?: Error | string | null },
) {
	return {
		helpers: {
			httpRequest: jest.fn().mockImplementation(async () => {
				if (responseOrError.error !== undefined) {
					throw responseOrError.error;
				}
				return responseOrError.data;
			}),
		},
	} as unknown as Parameters<typeof queryWithFallback>[0];
}

function createCnpjContext(overrides: Record<string, unknown> = {}, httpResponse?: unknown) {
	const params: Record<string, unknown> = {
		cnpj: '11222333000181',
		includeRaw: false,
		...overrides,
	};
	return {
		getNodeParameter: jest.fn((name: string, _index: number, fallback?: unknown) =>
			params[name] ?? fallback,
		),
		getNode: jest.fn(() => ({ name: 'Brasil Hub' })),
		helpers: {
			httpRequest: jest.fn().mockResolvedValue(httpResponse ?? {}),
		},
	} as unknown as Parameters<typeof cnpjQuery>[0];
}

// createCepContext removed — not needed for current attack vectors

function createBanksListContext(overrides: Record<string, unknown> = {}, httpResponse?: unknown) {
	const params: Record<string, unknown> = {
		includeRaw: false,
		...overrides,
	};
	return {
		getNodeParameter: jest.fn((name: string, _index: number, fallback?: unknown) =>
			params[name] ?? fallback,
		),
		getNode: jest.fn(() => ({ name: 'Brasil Hub' })),
		helpers: {
			httpRequest: jest.fn().mockResolvedValue(httpResponse ?? []),
		},
	} as unknown as Parameters<typeof banksList>[0];
}

function createDddContext(overrides: Record<string, unknown> = {}, httpResponse?: unknown) {
	const params: Record<string, unknown> = {
		ddd: '11',
		includeRaw: false,
		...overrides,
	};
	return {
		getNodeParameter: jest.fn((name: string, _index: number, fallback?: unknown) =>
			params[name] ?? fallback,
		),
		getNode: jest.fn(() => ({ name: 'Brasil Hub' })),
		helpers: {
			httpRequest: jest.fn().mockResolvedValue(httpResponse ?? {}),
		},
	} as unknown as Parameters<typeof dddQuery>[0];
}

function createExecuteContext(overrides: {
	resource?: string;
	operation?: string;
	cnpj?: string;
	cep?: string;
	cpf?: string;
	bankCode?: string;
	ddd?: string;
	includeRaw?: boolean;
	items?: INodeExecutionData[];
	continueOnFail?: boolean;
	httpResponse?: unknown;
	httpError?: unknown; // intentionally unknown — testing non-Error throws
}) {
	const params: Record<string, unknown> = {
		resource: overrides.resource ?? 'cnpj',
		operation: overrides.operation ?? 'query',
		cnpj: overrides.cnpj ?? '11222333000181',
		cep: overrides.cep ?? '01001000',
		cpf: overrides.cpf ?? '52998224725',
		bankCode: overrides.bankCode ?? '1',
		ddd: overrides.ddd ?? '11',
		includeRaw: overrides.includeRaw ?? false,
	};

	const items = overrides.items ?? [{ json: {} }];

	const httpRequest = overrides.httpError !== undefined
		? jest.fn().mockRejectedValue(overrides.httpError)
		: jest.fn().mockResolvedValue(overrides.httpResponse ?? {
			cnpj: '11222333000181',
			razao_social: 'TESTE',
			nome_fantasia: '',
			descricao_situacao_cadastral: 'ATIVA',
			data_inicio_atividade: '2020-01-01',
			descricao_porte: 'ME',
			natureza_juridica: 'LTDA',
			capital_social: 10000,
			cnae_fiscal: 6201501,
			cnae_fiscal_descricao: 'Dev',
			logradouro: 'RUA',
			numero: '1',
			complemento: '',
			bairro: 'CENTRO',
			cep: '01001000',
			municipio: 'SP',
			uf: 'SP',
			ddd_telefone_1: '',
			ddd_telefone_2: '',
			email: '',
			qsa: [],
		});

	return {
		getInputData: jest.fn(() => items),
		getNodeParameter: jest.fn((name: string, _index: number, fallback?: unknown) =>
			params[name] ?? fallback,
		),
		getNode: jest.fn(() => ({ name: 'Brasil Hub' })),
		continueOnFail: jest.fn(() => overrides.continueOnFail ?? false),
		helpers: { httpRequest },
	} as unknown as IExecuteFunctions;
}

const singleProvider: IProvider[] = [
	{ name: 'brasilapi', url: 'https://brasilapi.com.br/api/cnpj/v1/123' },
];

// ═══════════════════════════════════════════════════════════════════════
// VECTOR 1: API returns garbage
// ═══════════════════════════════════════════════════════════════════════

describe('VECTOR 1: API returns garbage', () => {
	describe('fallback engine accepts any truthy or falsy value from httpRequest', () => {
		it.each([
			['null', null],
			['undefined', undefined],
			['empty string', ''],
			['non-JSON string', 'not json'],
			['number 42', 42],
			['boolean true', true],
			['empty array', []],
		])('httpRequest returns %s → fallback returns it without error', async (label, value) => {
			const ctx = createFallbackContext({ data: value });
			const result = await queryWithFallback(ctx, singleProvider);
			// Fallback engine doesn't validate — it passes through whatever httpRequest returns
			expect(result.data).toBe(value);
			expect(result.provider).toBe('brasilapi');
		});
	});

	describe('CNPJ normalizer with garbage data', () => {
		it('null data → normalizer treats null properties as empty strings via safeStr', () => {
			// normalizeCnpj casts data as Record<string,unknown> — null.property = undefined
			// safeStr(undefined) → ''
			// This should not crash but produce empty fields
			const result = normalizeCnpj({}, 'brasilapi');
			expect(result.cnpj).toBe('');
			expect(result.razao_social).toBe('');
			expect(result.capital_social).toBe(0);
			expect(result.socios).toEqual([]);
		});

		it('number 42 as data → normalizer accesses properties of Number, returns empty strings', () => {
			// 42 cast as Record<string,unknown> — (42).cnpj = undefined → safeStr → ''
			const result = normalizeCnpj(42 as unknown, 'brasilapi');
			expect(result.cnpj).toBe('');
			expect(result.razao_social).toBe('');
		});

		it('string "not json" as data → normalizer accesses string properties', () => {
			const result = normalizeCnpj('not json' as unknown, 'brasilapi');
			expect(result.cnpj).toBe('');
		});

		it('boolean true as data → normalizer produces empty fields', () => {
			const result = normalizeCnpj(true as unknown, 'brasilapi');
			expect(result.cnpj).toBe('');
		});

		it('FIXED — null as data → normalizer produces empty defaults (no crash)', () => {
			const result = normalizeCnpj(null, 'brasilapi');
			expect(result.cnpj).toBe('');
			expect(result.capital_social).toBe(0);
		});
	});

	describe('CEP normalizer with garbage data', () => {
		it('empty object → normalizer produces empty strings', () => {
			const result = normalizeCep({}, 'brasilapi');
			expect(result.cep).toBe('');
			expect(result.logradouro).toBe('');
		});

		it('FIXED — null as data → normalizer produces empty defaults (no crash)', () => {
			const result = normalizeCep(null, 'brasilapi');
			expect(result.cep).toBe('');
		});

		it('array as data → normalizer accesses array properties (no crash but garbage)', () => {
			const result = normalizeCep([] as unknown, 'brasilapi');
			expect(result.cep).toBe('');
		});
	});

	describe('Banks normalizer with garbage data', () => {
		it('empty object as single bank → produces zeroed/empty fields', () => {
			const result = normalizeBank({}, 'brasilapi');
			expect(result.code).toBe(0);
			expect(result.name).toBe('');
		});

		it('FIXED — null as data → produces empty defaults (no crash)', () => {
			const result = normalizeBank(null, 'brasilapi');
			expect(result.code).toBe(0);
			expect(result.name).toBe('');
		});

		it('FIXED — normalizeBanks with non-array data → returns empty array', () => {
			const result = normalizeBanks('not array' as unknown, 'brasilapi');
			expect(result).toEqual([]);
		});

		it('FIXED — normalizeBanks with null → returns empty array', () => {
			const result = normalizeBanks(null, 'brasilapi');
			expect(result).toEqual([]);
		});
	});

	describe('DDD normalizer with garbage data', () => {
		it('empty object for brasilapi → produces empty state and empty cities', () => {
			const result = normalizeDdd({}, 'brasilapi');
			expect(result.state).toBe('');
			expect(result.cities).toEqual([]);
		});

		it('FIXED — null as data for brasilapi → produces empty defaults (no crash)', () => {
			const result = normalizeDdd(null, 'brasilapi');
			expect(result.state).toBe('');
			expect(result.cities).toEqual([]);
		});
	});

	describe('End-to-end: CNPJ query with garbage API response', () => {
		it('API returns null → createCnpjContext mock coerces null to {} via ??, producing empty fields', async () => {
			// NOTE: createCnpjContext uses `httpResponse ?? {}`, so null → {}.
			// The normalizer sees {} not null. This masks the real bug in dev mocks.
			const ctx = createCnpjContext({}, null);
			const [result] = await cnpjQuery(ctx, 0);
			expect(result.json).toHaveProperty('cnpj', '');
		});

		it('FIXED — API truly returns null → cnpjQuery produces empty defaults (no crash)', async () => {
			// Force httpRequest to resolve to null directly
			const ctx = createCnpjContext({});
			(ctx.helpers.httpRequest as jest.Mock).mockResolvedValue(null);
			// normalizeCnpj(null, 'brasilapi') → null coerced to {} → empty defaults
			const [result] = await cnpjQuery(ctx, 0);
			expect(result.json).toHaveProperty('cnpj', '');
		});

		it('API returns empty object → cnpjQuery returns empty fields without crash', async () => {
			const ctx = createCnpjContext({}, {});
			const [result] = await cnpjQuery(ctx, 0);
			expect(result.json).toHaveProperty('cnpj', '');
			expect(result.json).toHaveProperty('_meta');
		});
	});
});

// ═══════════════════════════════════════════════════════════════════════
// VECTOR 2: API returns error object instead of data
// ═══════════════════════════════════════════════════════════════════════

describe('VECTOR 2: API returns error object instead of data', () => {
	it('BrasilAPI error object → normalizer treats as valid data with empty fields (silent garbage)', () => {
		const errorResponse = { message: 'CNPJ not found', type: 'NOT_FOUND' };
		const result = normalizeCnpj(errorResponse, 'brasilapi');
		// BUG CANDIDATE: normalizer doesn't check for error responses
		// It produces a result with cnpj='', razao_social='', etc.
		expect(result.cnpj).toBe('');
		expect(result.razao_social).toBe('');
		// The error message is silently swallowed — user gets garbage instead of error
		expect(result.situacao).toBe('');
	});

	it('BrasilAPI error with status field → normalizer silently produces empty data', () => {
		const errorResponse = { message: 'CNPJ inválido', type: 'bad_request', status: 400 };
		const result = normalizeCnpj(errorResponse, 'brasilapi');
		expect(result.cnpj).toBe('');
	});

	it('ViaCEP error response {erro: true} → normalizer correctly throws', () => {
		// ViaCEP returns { erro: true } for not-found — this IS handled
		expect(() => normalizeCep({ erro: true }, 'viacep')).toThrow('CEP not found');
	});

	it('BrasilAPI CEP error → normalizer silently produces empty data (no error detection)', () => {
		const errorResponse = { message: 'CEP não encontrado', type: 'service_error' };
		const result = normalizeCep(errorResponse, 'brasilapi');
		expect(result.cep).toBe('');
		// Same pattern as CNPJ — silent garbage
	});

	it('FIXED — BancosBrasileiros error object for banksList → returns empty array (not crash)', () => {
		const errorResponse = { message: 'Rate limited' };
		const result = normalizeBanks(errorResponse, 'brasilapi');
		expect(result).toEqual([]);
	});

	it('End-to-end: error object flows through fallback → normalizer produces garbage', async () => {
		const errorResponse = { message: 'CNPJ not found', type: 'NOT_FOUND' };
		const ctx = createCnpjContext({}, errorResponse);
		const [result] = await cnpjQuery(ctx, 0);
		// BUG: user gets an "empty" CNPJ result instead of an error
		expect(result.json).toHaveProperty('cnpj', '');
		expect(result.json).toHaveProperty('razao_social', '');
		expect(result.json).toHaveProperty('_meta');
	});
});

// ═══════════════════════════════════════════════════════════════════════
// VECTOR 3: HTTP status codes (404 vs 500)
// ═══════════════════════════════════════════════════════════════════════

describe('VECTOR 3: HTTP status codes (404 vs 500)', () => {
	it('fallback engine does NOT distinguish 404 from 500 — both trigger fallback', async () => {
		let callIndex = 0;
		const providers: IProvider[] = [
			{ name: 'p1', url: 'https://p1.com' },
			{ name: 'p2', url: 'https://p2.com' },
		];
		const ctx = {
			helpers: {
				httpRequest: jest.fn().mockImplementation(async () => {
					callIndex++;
					if (callIndex === 1) {
						const err = new Error('404 Not Found');
						(err as unknown as Record<string, unknown>).httpCode = 404;
						throw err;
					}
					return { result: 'ok' };
				}),
			},
		} as unknown as Parameters<typeof queryWithFallback>[0];

		const result = await queryWithFallback(ctx, providers);
		expect(result.provider).toBe('p2');
		expect(result.errors).toEqual(['p1: 404 Not Found']);
		// OBSERVATION: 404 means "this CNPJ doesn't exist" — ideally should NOT
		// fallback because other providers will also return not-found.
		// But the current implementation treats all errors identically.
	});

	it('both providers return 404 → throws combined error (correct behavior for all-fail)', async () => {
		const providers: IProvider[] = [
			{ name: 'p1', url: 'https://p1.com' },
			{ name: 'p2', url: 'https://p2.com' },
		];
		const ctx = {
			helpers: {
				httpRequest: jest.fn().mockRejectedValue(new Error('404 Not Found')),
			},
		} as unknown as Parameters<typeof queryWithFallback>[0];

		await expect(queryWithFallback(ctx, providers)).rejects.toThrow(
			'No provider could fulfill the request',
		);
	});
});

// ═══════════════════════════════════════════════════════════════════════
// VECTOR 4: Timeout behavior
// ═══════════════════════════════════════════════════════════════════════

describe('VECTOR 4: Timeout behavior', () => {
	it('httpRequest is called with timeout=10000 (10s)', async () => {
		const ctx = createFallbackContext({ data: { ok: true } });
		await queryWithFallback(ctx, singleProvider);

		expect(ctx.helpers.httpRequest).toHaveBeenCalledWith(
			expect.objectContaining({
				timeout: 10000,
			}),
		);
	});

	it('timeout is delegated to n8n httpRequest helper — not a manual setTimeout', async () => {
		// The fallback engine passes `timeout: REQUEST_TIMEOUT_MS` to httpRequest.
		// n8n's httpRequest handles the actual timeout. The engine has no manual
		// setTimeout/clearTimeout logic. This means the behavior at exactly 10001ms
		// depends on n8n's implementation, not ours.
		const ctx = createFallbackContext({ data: 'ok' });
		await queryWithFallback(ctx, singleProvider);
		const callArgs = (ctx.helpers.httpRequest as jest.Mock).mock.calls[0][0];
		expect(callArgs.timeout).toBe(10000);
		// PASS: timeout delegation is correct — but there's no 1s delay between
		// retries as the CLAUDE.md mentions. Let's verify:
	});

	it('no delay between provider retries (fallback is immediate)', async () => {
		const timestamps: number[] = [];
		let callIndex = 0;
		const providers: IProvider[] = [
			{ name: 'p1', url: 'https://p1.com' },
			{ name: 'p2', url: 'https://p2.com' },
		];
		const ctx = {
			helpers: {
				httpRequest: jest.fn().mockImplementation(async () => {
					timestamps.push(Date.now());
					callIndex++;
					if (callIndex === 1) throw new Error('fail');
					return { ok: true };
				}),
			},
		} as unknown as Parameters<typeof queryWithFallback>[0];

		await queryWithFallback(ctx, providers);
		// No sleep/delay between retries — difference should be < 50ms
		const elapsed = timestamps[1] - timestamps[0];
		expect(elapsed).toBeLessThan(50);
		// OBSERVATION: CLAUDE.md says "1s delay" but the code has no delay.
		// This is a discrepancy between documentation and implementation.
	});
});

// ═══════════════════════════════════════════════════════════════════════
// VECTOR 5: continueOnFail edge cases
// ═══════════════════════════════════════════════════════════════════════

describe('VECTOR 5: continueOnFail edge cases', () => {
	const node = new BrasilHub();

	it('Error without message property → (error as Error).message returns undefined', async () => {
		// Create an object that looks like an Error but has no message
		const weirdError = { stack: 'fake stack' };
		const ctx = createExecuteContext({
			resource: 'cnpj',
			operation: 'query',
			continueOnFail: true,
			httpError: weirdError,
		});

		const [[result]] = await node.execute.call(ctx);
		// The fallback engine will String(error) this weird object
		// But then the execute() handler does (error as Error).message
		// Error from fallback: "No provider could fulfill the request: brasilapi: [object Object]..."
		expect(result.json).toHaveProperty('error');
		expect(typeof result.json.error).toBe('string');
		expect(result.pairedItem).toEqual({ item: 0 });
	});

	it('string throw → continueOnFail handles it', async () => {
		const ctx = createExecuteContext({
			resource: 'cnpj',
			operation: 'query',
			continueOnFail: true,
			httpError: 'broken', // throw "broken"
		});

		const [[result]] = await node.execute.call(ctx);
		// fallback.ts: String(error) → "broken" → errors.push("brasilapi: broken")
		// Then throws Error("No provider could fulfill the request: brasilapi: broken")
		// execute(): (error as Error).message → the Error's message
		expect(result.json).toHaveProperty('error');
		expect(result.json.error).toContain('No provider could fulfill the request');
		expect(result.json.error).toContain('broken');
	});

	it('throw null → continueOnFail handles it without crashing', async () => {
		const ctx = createExecuteContext({
			resource: 'cnpj',
			operation: 'query',
			continueOnFail: true,
			httpError: null, // throw null
		});

		const [[result]] = await node.execute.call(ctx);
		// fallback.ts: error instanceof Error → false, String(null) → "null"
		// execute(): (error as Error).message → Error object message
		expect(result.json).toHaveProperty('error');
		expect(typeof result.json.error).toBe('string');
	});

	it('throw undefined → continueOnFail handles it', async () => {
		// Special case: httpError is undefined means "no error" in our mock
		// so we need to test this differently
		const ctx = createExecuteContext({
			resource: 'cnpj',
			operation: 'query',
			continueOnFail: true,
		});
		// Override httpRequest to throw undefined
		(ctx.helpers.httpRequest as jest.Mock).mockImplementation(async () => {
			throw undefined;
		});

		const [[result]] = await node.execute.call(ctx);
		// fallback.ts: String(undefined) → "undefined"
		// The fallback error message becomes valid
		expect(result.json).toHaveProperty('error');
	});

	it('FIXED — continueOnFail with string throw: json.error is the string message', async () => {
		// execute() now uses: error instanceof Error ? error.message : String(error)
		const ctx = createExecuteContext({
			resource: 'cnpj',
			operation: 'query',
			continueOnFail: true,
		});
		(ctx.getNodeParameter as jest.Mock).mockImplementation((name: string) => {
			if (name === 'resource') return 'cnpj';
			if (name === 'operation') return 'query';
			if (name === 'cnpj') throw 'raw string error';			return undefined;
		});

		const [[result]] = await node.execute.call(ctx);
		// FIXED: String(error) produces the string message instead of undefined
		expect(result.json.error).toBe('raw string error');
	});

	it('FIXED — continueOnFail wrapping: string throw → proper error extraction', async () => {
		const ctx = createExecuteContext({
			resource: 'cnpj',
			operation: 'query',
			continueOnFail: true,
		});
		(ctx.getNodeParameter as jest.Mock).mockImplementation((name: string) => {
			if (name === 'resource') return 'cnpj';
			if (name === 'operation') return 'query';
			if (name === 'cnpj') throw 'string thrown';			return undefined;
		});

		const [[result]] = await node.execute.call(ctx);
		expect(result).toHaveProperty('pairedItem');
		// FIXED: json.error is now the thrown string, not undefined
		expect(result.json.error).toBe('string thrown');
	});
});

// ═══════════════════════════════════════════════════════════════════════
// VECTOR 6: Race condition — duplicate items in same batch
// ═══════════════════════════════════════════════════════════════════════

describe('VECTOR 6: Race condition — duplicate items in batch', () => {
	const node = new BrasilHub();

	it('two items with same CNPJ each get independent provider calls', async () => {
		const ctx = createExecuteContext({
			resource: 'cnpj',
			operation: 'validate',
			cnpj: '11222333000181',
			items: [{ json: {} }, { json: {} }],
		});

		const [results] = await node.execute.call(ctx);
		// Each item should be processed independently (sequential loop, not parallel)
		expect(results).toHaveLength(2);
		expect(results[0].pairedItem).toEqual({ item: 0 });
		expect(results[1].pairedItem).toEqual({ item: 1 });
	});

	it('two items querying same CNPJ → two separate HTTP calls', async () => {
		const ctx = createExecuteContext({
			resource: 'cnpj',
			operation: 'query',
			cnpj: '11222333000181',
			items: [{ json: {} }, { json: {} }],
		});

		const [results] = await node.execute.call(ctx);
		expect(results).toHaveLength(2);
		// httpRequest is called once per item (no deduplication)
		expect(ctx.helpers.httpRequest).toHaveBeenCalledTimes(2);
		// OBSERVATION: No deduplication — each item makes its own API call.
		// This is correct behavior for n8n (each item is independent) but
		// could be optimized for performance.
	});

	it('sequential processing: first item uses fallback (call 1 fails, call 2 succeeds), second item succeeds directly', async () => {
		let callCount = 0;
		const ctx = createExecuteContext({
			resource: 'cnpj',
			operation: 'query',
			continueOnFail: true,
			items: [{ json: {} }, { json: {} }],
		});
		(ctx.helpers.httpRequest as jest.Mock).mockImplementation(async () => {
			callCount++;
			if (callCount === 1) throw new Error('First provider group failed');
			return {
				cnpj: '11222333000181', razao_social: 'RESULT', nome_fantasia: '',
				descricao_situacao_cadastral: 'ATIVA', data_inicio_atividade: '',
				descricao_porte: '', natureza_juridica: '', capital_social: 0,
				cnae_fiscal: 0, cnae_fiscal_descricao: '', logradouro: '', numero: '',
				complemento: '', bairro: '', cep: '', municipio: '', uf: '',
				ddd_telefone_1: '', ddd_telefone_2: '', email: '', qsa: [],
			};
		});

		const [results] = await node.execute.call(ctx);
		expect(results).toHaveLength(2);
		// Call 1: item 0, provider brasilapi → fails
		// Call 2: item 0, provider cnpjws → succeeds via fallback
		// Call 3: item 1, provider brasilapi → succeeds directly
		expect(results[0].json).toHaveProperty('razao_social', 'RESULT');
		expect((results[0].json._meta as Record<string, unknown>).strategy).toBe('fallback');
		expect(results[1].json).toHaveProperty('razao_social', 'RESULT');
		expect((results[1].json._meta as Record<string, unknown>).strategy).toBe('direct');
	});

	it('all providers fail for all items with continueOnFail → all items get error', async () => {
		const ctx = createExecuteContext({
			resource: 'cnpj',
			operation: 'query',
			continueOnFail: true,
			items: [{ json: {} }, { json: {} }],
			httpError: new Error('All providers down'),
		});

		const [results] = await node.execute.call(ctx);
		expect(results).toHaveLength(2);
		expect(results[0].json).toHaveProperty('error');
		expect(results[0].json.error).toContain('No provider could fulfill the request');
		expect(results[1].json).toHaveProperty('error');
	});
});

// ═══════════════════════════════════════════════════════════════════════
// VECTOR 7: banks.execute banksList includeRaw index mismatch
// ═══════════════════════════════════════════════════════════════════════

describe('VECTOR 7: banksList includeRaw index mismatch', () => {
	it('normalizeBanks preserves order → rawItems[index] aligns correctly', async () => {
		const rawData = [
			{ ispb: '00000000', name: 'BANCO A', code: 1, fullName: 'Banco A S.A.' },
			{ ispb: '11111111', name: 'BANCO B', code: 2, fullName: 'Banco B S.A.' },
			{ ispb: '22222222', name: 'BANCO C', code: 3, fullName: 'Banco C S.A.' },
		];
		const ctx = createBanksListContext({ includeRaw: true }, rawData);
		const results = await banksList(ctx, 0);

		expect(results).toHaveLength(3);
		// Verify each item's _raw matches its normalized data
		for (let i = 0; i < results.length; i++) {
			const normalizedName = results[i].json.name;
			const rawName = (results[i].json._raw as Record<string, unknown>)?.name;
			expect(normalizedName).toBe(rawName);
		}
	});

	it('normalizeBanks with bancosbrasileiros data → same order, correct _raw', async () => {
		const rawData = [
			{ COMPE: '001', ShortName: 'BB', LongName: 'Banco do Brasil', ISPB: '00000000' },
			{ COMPE: '237', ShortName: 'BRADESCO', LongName: 'Bradesco S.A.', ISPB: '60746948' },
		];
		// For bancosbrasileiros provider, we need to mock the fallback so brasilapi fails first
		let callIndex = 0;
		const ctx = createBanksListContext({ includeRaw: true });
		(ctx.helpers.httpRequest as jest.Mock).mockImplementation(async () => {
			callIndex++;
			if (callIndex === 1) throw new Error('brasilapi failed');
			return rawData;
		});

		// Note: banksList uses BANKS_LIST_PROVIDERS which has brasilapi first, bancosbrasileiros second
		// When brasilapi fails and bancosbrasileiros returns, the provider will be 'bancosbrasileiros'
		// normalizeBanks uses the bancosbrasileiros normalizer → maps COMPE, ShortName, etc.
		const results = await banksList(ctx, 0);
		expect(results).toHaveLength(2);
		// The order is preserved — normalizeBanks.map() doesn't reorder
		expect(results[0].json.name).toBe('BB');
		expect(results[1].json.name).toBe('BRADESCO');
		// _raw should match the original array items in order
		expect((results[0].json._raw as Record<string, unknown>)?.ShortName).toBe('BB');
		expect((results[1].json._raw as Record<string, unknown>)?.ShortName).toBe('BRADESCO');
	});

	it('BUG POTENTIAL: if normalizeBanks filtered items, rawItems[index] would mismatch', () => {
		// Currently normalizeBanks does NOT filter — it maps all items.
		// But if a future change adds filtering, rawItems[index] would be wrong.
		// Let's verify normalizeBanks doesn't filter:
		const data = [
			{ ispb: '00000000', name: 'A', code: 1, fullName: 'A' },
			{ ispb: '', name: '', code: 0, fullName: '' }, // "empty" bank
			{ ispb: '22222222', name: 'C', code: 3, fullName: 'C' },
		];
		const banks = normalizeBanks(data, 'brasilapi');
		// normalizeBanks maps ALL items, even "empty" ones — no filtering
		expect(banks).toHaveLength(3);
		expect(banks[1].code).toBe(0);
		expect(banks[1].name).toBe('');
		// PASS: no filtering, so index alignment is safe
	});
});

// ═══════════════════════════════════════════════════════════════════════
// VECTOR 8: DDD municipios fallback — string vs number strict equality
// ═══════════════════════════════════════════════════════════════════════

describe('VECTOR 8: DDD municipios strict equality bug', () => {
	it('FIXED: ddd field as STRING "11" → Number() coercion matches correctly', () => {
		const data = [
			{ nome: 'São Paulo', ddd: '11', codigo_uf: 35 },
			{ nome: 'Guarulhos', ddd: '11', codigo_uf: 35 },
			{ nome: 'Campinas', ddd: '19', codigo_uf: 35 },
		];
		// FIXED: Number(m.ddd) === dddCode handles string/number coercion
		const result = normalizeDdd(data, 'municipios', 11);
		expect(result.state).toBe('SP');
		expect(result.cities).toEqual(['São Paulo', 'Guarulhos']);
	});

	it('ddd field as NUMBER 11 → matches correctly', () => {
		const data = [
			{ nome: 'São Paulo', ddd: 11, codigo_uf: 35 },
			{ nome: 'Guarulhos', ddd: 11, codigo_uf: 35 },
		];
		const result = normalizeDdd(data, 'municipios', 11);
		expect(result.state).toBe('SP');
		expect(result.cities).toEqual(['São Paulo', 'Guarulhos']);
	});

	it('FIXED: mixed types in municipios JSON → both string and number DDD entries match', () => {
		const data = [
			{ nome: 'São Paulo', ddd: 11, codigo_uf: 35 },  // number → matches
			{ nome: 'Guarulhos', ddd: '11', codigo_uf: 35 }, // string → also matches now
			{ nome: 'Campinas', ddd: 19, codigo_uf: 35 },
		];
		const result = normalizeDdd(data, 'municipios', 11);
		// FIXED: Number() coercion handles both types
		expect(result.cities).toEqual(['São Paulo', 'Guarulhos']);
	});

	it('FIXED: end-to-end dddQuery with municipios fallback and string DDD data → succeeds', async () => {
		const municipiosData = [
			{ nome: 'São Paulo', ddd: '11', codigo_uf: 35 },
			{ nome: 'Guarulhos', ddd: '11', codigo_uf: 35 },
		];
		let callIndex = 0;
		const ctx = createDddContext({ ddd: '11' });
		(ctx.helpers.httpRequest as jest.Mock).mockImplementation(async () => {
			callIndex++;
			if (callIndex === 1) throw new Error('brasilapi down');
			return municipiosData;
		});

		// FIXED: Number() coercion handles string DDDs from municipios JSON
		const [result] = await dddQuery(ctx, 0);
		expect(result.json).toHaveProperty('state', 'SP');
		expect(result.json).toHaveProperty('cities', ['São Paulo', 'Guarulhos']);
	});

	it('codigo_uf as string → UF_CODES lookup fails (returns empty state)', () => {
		const data = [
			{ nome: 'São Paulo', ddd: 11, codigo_uf: '35' }, // string instead of number
		];
		const result = normalizeDdd(data, 'municipios', 11);
		// ufCounts maps with key '35' (string from JSON), but UF_CODES uses numeric keys
		// Map.get('35') when key was set as '35' works... but UF_CODES[35] vs UF_CODES['35']
		// Actually: JavaScript object keys are strings anyway, so UF_CODES['35'] === UF_CODES[35] === 'SP'
		// BUT: the code does `const uf = m.codigo_uf as number` and then UF_CODES[uf]
		// When uf is actually string '35': UF_CODES['35'] still works because JS object property access
		// coerces the key to string anyway.
		expect(result.state).toBe('SP');
		// PASS: JS object property access coerces keys to strings, so this works
	});
});

// ═══════════════════════════════════════════════════════════════════════
// Additional attack: normalizer with undefined provider
// ═══════════════════════════════════════════════════════════════════════

describe('Additional: unknown provider names', () => {
	it('normalizeCnpj with unknown provider throws', () => {
		expect(() => normalizeCnpj({}, 'unknown')).toThrow('Unknown CNPJ provider: unknown');
	});

	it('normalizeCep with unknown provider throws', () => {
		expect(() => normalizeCep({}, 'unknown')).toThrow('Unknown CEP provider: unknown');
	});

	it('normalizeBank with unknown provider throws', () => {
		expect(() => normalizeBank({}, 'unknown')).toThrow('Unknown bank provider: unknown');
	});

	it('normalizeDdd with unknown provider throws', () => {
		expect(() => normalizeDdd({}, 'unknown')).toThrow('Unknown DDD provider: unknown');
	});
});

// ═══════════════════════════════════════════════════════════════════════
// FIPE EXECUTE ATTACK TESTS
// ═══════════════════════════════════════════════════════════════════════

// ─── FIPE Helpers ────────────────────────────────────────────────────

function createFipeContext(
	overrides: Record<string, unknown> = {},
	httpResponse: unknown = [],
) {
	const params: Record<string, unknown> = {
		vehicleType: 'carros',
		brandCode: '59',
		modelCode: '4828',
		yearCode: '2024-1',
		referenceTable: 0,
		includeRaw: false,
		...overrides,
	};
	return {
		getNodeParameter: jest.fn((name: string, _index: number, fallback?: unknown) =>
			params[name] ?? fallback,
		),
		getNode: jest.fn(() => ({ name: 'Brasil Hub' })),
		helpers: {
			httpRequest: jest.fn().mockResolvedValue(httpResponse),
		},
	} as unknown as Parameters<typeof fipeBrands>[0];
}

// ═══════════════════════════════════════════════════════════════════════
// FIPE VECTOR 9: API returns garbage for all 4 FIPE operations
// ═══════════════════════════════════════════════════════════════════════

describe('FIPE VECTOR 9: API returns garbage for FIPE operations', () => {
	describe('fipeBrands — garbage API responses', () => {
		it.each([
			['null', null],
			['undefined', undefined],
			['empty string', ''],
			['number 42', 42],
			['boolean true', true],
			['object {}', {}],
		])('API returns %s → fipeBrands returns empty array', async (_label, value) => {
			const ctx = createFipeContext({}, value);
			const results = await fipeBrands(ctx, 0);
			expect(results).toEqual([]);
		});
	});

	describe('fipeModels — garbage API responses', () => {
		it.each([
			['null', null],
			['undefined', undefined],
			['empty string', ''],
			['number 42', 42],
			['boolean true', true],
			['empty array', []],
		])('API returns %s → fipeModels returns empty array', async (_label, value) => {
			const ctx = createFipeContext({}, value);
			const results = await fipeModels(ctx, 0);
			expect(results).toEqual([]);
		});
	});

	describe('fipeYears — garbage API responses', () => {
		it.each([
			['null', null],
			['undefined', undefined],
			['empty string', ''],
			['number 42', 42],
			['boolean true', true],
			['object {}', {}],
		])('API returns %s → fipeYears returns empty array', async (_label, value) => {
			const ctx = createFipeContext({}, value);
			const results = await fipeYears(ctx, 0);
			expect(results).toEqual([]);
		});
	});

	describe('fipePrice — garbage API responses produce safe defaults', () => {
		it.each([
			['null', null],
			['undefined', undefined],
			['empty string', ''],
			['number 42', 42],
			['boolean true', true],
			['empty array', []],
		])('API returns %s → fipePrice returns item with safe defaults', async (_label, value) => {
			const ctx = createFipeContext({}, value);
			const results = await fipePrice(ctx, 0);
			expect(results).toHaveLength(1);
			expect(results[0].json).toHaveProperty('vehicleType', 0);
			expect(results[0].json).toHaveProperty('brand', '');
			expect(results[0].json).toHaveProperty('price', '');
			expect(results[0].json).toHaveProperty('modelYear', 0);
			expect(results[0].pairedItem).toEqual({ item: 0 });
		});

		it('API returns empty object {} → fipePrice returns item with safe defaults', async () => {
			const ctx = createFipeContext({}, {});
			const results = await fipePrice(ctx, 0);
			expect(results).toHaveLength(1);
			expect(results[0].json).toHaveProperty('vehicleType', 0);
			expect(results[0].json).toHaveProperty('brand', '');
		});
	});
});

// ═══════════════════════════════════════════════════════════════════════
// FIPE VECTOR 10: Empty string vs whitespace for code validation
// ═══════════════════════════════════════════════════════════════════════

describe('FIPE VECTOR 10: Empty string vs whitespace for code validation', () => {
	it('fipeModels throws when brandCode is empty string ""', async () => {
		const ctx = createFipeContext({ brandCode: '' });
		await expect(fipeModels(ctx, 0)).rejects.toThrow('Brand code is required');
	});

	it('fipeModels does NOT throw when brandCode is whitespace " " (truthy)', async () => {
		const ctx = createFipeContext({ brandCode: ' ' });
		// Whitespace is truthy — passes !brandCode check but is likely invalid
		// OBSERVATION: No trim-then-validate — whitespace passes validation
		const results = await fipeModels(ctx, 0);
		expect(results).toEqual([]);
	});

	it('fipeYears throws when brandCode is empty', async () => {
		const ctx = createFipeContext({ brandCode: '' });
		await expect(fipeYears(ctx, 0)).rejects.toThrow('Brand code is required');
	});

	it('fipeYears throws when modelCode is empty', async () => {
		const ctx = createFipeContext({ modelCode: '' });
		await expect(fipeYears(ctx, 0)).rejects.toThrow('Model code is required');
	});

	it('fipePrice throws when brandCode is empty', async () => {
		const ctx = createFipeContext({ brandCode: '' });
		await expect(fipePrice(ctx, 0)).rejects.toThrow('Brand code is required');
	});

	it('fipePrice throws when modelCode is empty', async () => {
		const ctx = createFipeContext({ modelCode: '' });
		await expect(fipePrice(ctx, 0)).rejects.toThrow('Model code is required');
	});

	it('fipePrice throws when yearCode is empty', async () => {
		const ctx = createFipeContext({ yearCode: '' });
		await expect(fipePrice(ctx, 0)).rejects.toThrow('Year code is required');
	});

	it('fipePrice does NOT throw when yearCode is whitespace " " (truthy)', async () => {
		const ctx = createFipeContext({ yearCode: ' ' });
		const results = await fipePrice(ctx, 0);
		expect(results).toHaveLength(1);
		expect(results[0].json).toHaveProperty('vehicleType', 0);
	});

	it('fipeModels does NOT throw when brandCode is "0" (truthy)', async () => {
		const ctx = createFipeContext({ brandCode: '0' });
		// "0" is truthy in JS string context
		const results = await fipeModels(ctx, 0);
		expect(results).toEqual([]);
	});
});

// ═══════════════════════════════════════════════════════════════════════
// FIPE VECTOR 11: referenceTable edge cases
// ═══════════════════════════════════════════════════════════════════════

describe('FIPE VECTOR 11: referenceTable edge cases', () => {
	it('referenceTable = 0 → no query param appended', async () => {
		const ctx = createFipeContext({ referenceTable: 0 });
		await fipeBrands(ctx, 0);
		const callUrl = (ctx.helpers.httpRequest as jest.Mock).mock.calls[0][0].url;
		expect(callUrl).not.toContain('tabela_referencia');
	});

	it('referenceTable = -1 → no query param appended (< 0 is not > 0)', async () => {
		const ctx = createFipeContext({ referenceTable: -1 });
		await fipeBrands(ctx, 0);
		const callUrl = (ctx.helpers.httpRequest as jest.Mock).mock.calls[0][0].url;
		expect(callUrl).not.toContain('tabela_referencia');
	});

	it('referenceTable = NaN → no query param appended (NaN > 0 is false)', async () => {
		const ctx = createFipeContext({ referenceTable: NaN });
		await fipeBrands(ctx, 0);
		const callUrl = (ctx.helpers.httpRequest as jest.Mock).mock.calls[0][0].url;
		expect(callUrl).not.toContain('tabela_referencia');
	});

	it('referenceTable = Infinity → query param IS appended (Infinity > 0 is true)', async () => {
		const ctx = createFipeContext({ referenceTable: Infinity });
		await fipeBrands(ctx, 0);
		const callUrl = (ctx.helpers.httpRequest as jest.Mock).mock.calls[0][0].url;
		expect(callUrl).toContain('tabela_referencia=Infinity');
	});

	it('referenceTable = 0.5 → query param IS appended (0.5 > 0 is true)', async () => {
		const ctx = createFipeContext({ referenceTable: 0.5 });
		await fipeBrands(ctx, 0);
		const callUrl = (ctx.helpers.httpRequest as jest.Mock).mock.calls[0][0].url;
		expect(callUrl).toContain('tabela_referencia=0.5');
	});

	it('referenceTable = 301 → query param appended to all 4 operations', async () => {
		// Verify for fipeBrands
		let ctx = createFipeContext({ referenceTable: 301 });
		await fipeBrands(ctx, 0);
		expect((ctx.helpers.httpRequest as jest.Mock).mock.calls[0][0].url).toContain('tabela_referencia=301');

		// Verify for fipeModels
		ctx = createFipeContext({ referenceTable: 301 }, { modelos: [] });
		await fipeModels(ctx, 0);
		expect((ctx.helpers.httpRequest as jest.Mock).mock.calls[0][0].url).toContain('tabela_referencia=301');

		// Verify for fipeYears
		ctx = createFipeContext({ referenceTable: 301 });
		await fipeYears(ctx, 0);
		expect((ctx.helpers.httpRequest as jest.Mock).mock.calls[0][0].url).toContain('tabela_referencia=301');

		// Verify for fipePrice
		ctx = createFipeContext({ referenceTable: 301 }, {});
		await fipePrice(ctx, 0);
		expect((ctx.helpers.httpRequest as jest.Mock).mock.calls[0][0].url).toContain('tabela_referencia=301');
	});
});

// ═══════════════════════════════════════════════════════════════════════
// FIPE VECTOR 12: HTTP error responses for all 4 operations
// ═══════════════════════════════════════════════════════════════════════

describe('FIPE VECTOR 12: HTTP error responses for all 4 FIPE operations', () => {
	describe('timeout errors', () => {
		it('fipeBrands — timeout → throws error', async () => {
			const ctx = createFipeContext({});
			(ctx.helpers.httpRequest as jest.Mock).mockRejectedValue(new Error('ETIMEDOUT'));
			await expect(fipeBrands(ctx, 0)).rejects.toThrow('ETIMEDOUT');
		});

		it('fipeModels — timeout → throws error', async () => {
			const ctx = createFipeContext({});
			(ctx.helpers.httpRequest as jest.Mock).mockRejectedValue(new Error('ETIMEDOUT'));
			await expect(fipeModels(ctx, 0)).rejects.toThrow('ETIMEDOUT');
		});

		it('fipeYears — timeout → throws error', async () => {
			const ctx = createFipeContext({});
			(ctx.helpers.httpRequest as jest.Mock).mockRejectedValue(new Error('ETIMEDOUT'));
			await expect(fipeYears(ctx, 0)).rejects.toThrow('ETIMEDOUT');
		});

		it('fipePrice — timeout → throws error', async () => {
			const ctx = createFipeContext({});
			(ctx.helpers.httpRequest as jest.Mock).mockRejectedValue(new Error('ETIMEDOUT'));
			await expect(fipePrice(ctx, 0)).rejects.toThrow('ETIMEDOUT');
		});
	});

	describe('404 Not Found', () => {
		it('fipeBrands — 404 → throws error (no fallback for FIPE)', async () => {
			const ctx = createFipeContext({});
			const err = new Error('Request failed with status code 404');
			(err as unknown as Record<string, unknown>).httpCode = 404;
			(ctx.helpers.httpRequest as jest.Mock).mockRejectedValue(err);
			await expect(fipeBrands(ctx, 0)).rejects.toThrow('404');
		});

		it('fipePrice — 404 → throws error (vehicle not found)', async () => {
			const ctx = createFipeContext({});
			(ctx.helpers.httpRequest as jest.Mock).mockRejectedValue(
				new Error('Request failed with status code 404'),
			);
			await expect(fipePrice(ctx, 0)).rejects.toThrow('404');
		});
	});

	describe('500 Internal Server Error', () => {
		it('fipeBrands — 500 → throws error', async () => {
			const ctx = createFipeContext({});
			(ctx.helpers.httpRequest as jest.Mock).mockRejectedValue(
				new Error('Request failed with status code 500'),
			);
			await expect(fipeBrands(ctx, 0)).rejects.toThrow('500');
		});

		it('fipeModels — 500 → throws error', async () => {
			const ctx = createFipeContext({});
			(ctx.helpers.httpRequest as jest.Mock).mockRejectedValue(
				new Error('Request failed with status code 500'),
			);
			await expect(fipeModels(ctx, 0)).rejects.toThrow('500');
		});
	});

	describe('non-Error throws', () => {
		it('fipeBrands — httpRequest throws string → propagates', async () => {
			const ctx = createFipeContext({});
			(ctx.helpers.httpRequest as jest.Mock).mockRejectedValue('rate limited');
			await expect(fipeBrands(ctx, 0)).rejects.toBe('rate limited');
		});

		it('fipePrice — httpRequest throws null → propagates', async () => {
			const ctx = createFipeContext({});
			(ctx.helpers.httpRequest as jest.Mock).mockRejectedValue(null);
			await expect(fipePrice(ctx, 0)).rejects.toBeNull();
		});
	});
});

// ═══════════════════════════════════════════════════════════════════════
// FIPE VECTOR 13: End-to-end via BrasilHub.execute (continueOnFail)
// ═══════════════════════════════════════════════════════════════════════

describe('FIPE VECTOR 13: End-to-end via BrasilHub.execute (continueOnFail)', () => {
	const node = new BrasilHub();

	it('fipe/brands — continueOnFail catches HTTP errors', async () => {
		const ctx = createExecuteContext({
			resource: 'fipe',
			operation: 'brands',
			continueOnFail: true,
			httpError: new Error('Service unavailable'),
		});
		// Add FIPE params
		const origGetParam = ctx.getNodeParameter as jest.Mock;
		origGetParam.mockImplementation((name: string, _index: number, fallback?: unknown) => {
			const params: Record<string, unknown> = {
				resource: 'fipe',
				operation: 'brands',
				vehicleType: 'carros',
				referenceTable: 0,
				includeRaw: false,
			};
			return params[name] ?? fallback;
		});

		const [[result]] = await node.execute.call(ctx);
		expect(result.json).toHaveProperty('error');
		expect(typeof result.json.error).toBe('string');
		expect(result.pairedItem).toEqual({ item: 0 });
	});

	it('fipe/price — continueOnFail catches missing required param', async () => {
		const ctx = createExecuteContext({
			resource: 'fipe',
			operation: 'price',
			continueOnFail: true,
		});
		const origGetParam = ctx.getNodeParameter as jest.Mock;
		origGetParam.mockImplementation((name: string, _index: number, fallback?: unknown) => {
			const params: Record<string, unknown> = {
				resource: 'fipe',
				operation: 'price',
				vehicleType: 'carros',
				brandCode: '',  // empty → NodeOperationError
				modelCode: '4828',
				yearCode: '2024-1',
				referenceTable: 0,
				includeRaw: false,
			};
			return params[name] ?? fallback;
		});

		const [[result]] = await node.execute.call(ctx);
		expect(result.json).toHaveProperty('error');
		expect(result.json.error).toContain('Brand code is required');
	});

	it('fipe/brands — multiple items with HTTP failure → all get errors', async () => {
		const ctx = createExecuteContext({
			resource: 'fipe',
			operation: 'brands',
			continueOnFail: true,
			items: [{ json: {} }, { json: {} }, { json: {} }],
			httpError: new Error('Connection refused'),
		});
		const origGetParam = ctx.getNodeParameter as jest.Mock;
		origGetParam.mockImplementation((name: string, _index: number, fallback?: unknown) => {
			const params: Record<string, unknown> = {
				resource: 'fipe',
				operation: 'brands',
				vehicleType: 'carros',
				referenceTable: 0,
				includeRaw: false,
			};
			return params[name] ?? fallback;
		});

		const [results] = await node.execute.call(ctx);
		expect(results).toHaveLength(3);
		for (let i = 0; i < results.length; i++) {
			expect(results[i].json).toHaveProperty('error');
			expect(results[i].json.error).toContain('Connection refused');
			expect(results[i].pairedItem).toEqual({ item: i });
		}
	});

	it('fipe/brands — without continueOnFail throws on HTTP error', async () => {
		const ctx = createExecuteContext({
			resource: 'fipe',
			operation: 'brands',
			continueOnFail: false,
			httpError: new Error('Service down'),
		});
		const origGetParam = ctx.getNodeParameter as jest.Mock;
		origGetParam.mockImplementation((name: string, _index: number, fallback?: unknown) => {
			const params: Record<string, unknown> = {
				resource: 'fipe',
				operation: 'brands',
				vehicleType: 'carros',
				referenceTable: 0,
				includeRaw: false,
			};
			return params[name] ?? fallback;
		});

		await expect(node.execute.call(ctx)).rejects.toThrow();
	});
});

// ═══════════════════════════════════════════════════════════════════════
// FIPE VECTOR 14: includeRaw alignment for list operations
// ═══════════════════════════════════════════════════════════════════════

describe('FIPE VECTOR 14: includeRaw alignment', () => {
	it('fipeBrands — _raw[index] aligns with normalized[index]', async () => {
		const rawData = [
			{ codigo: '1', nome: 'Acura' },
			{ codigo: '59', nome: 'Honda' },
			{ codigo: '99', nome: 'BMW' },
		];
		const ctx = createFipeContext({ includeRaw: true }, rawData);
		const results = await fipeBrands(ctx, 0);

		expect(results).toHaveLength(3);
		for (let i = 0; i < results.length; i++) {
			expect(results[i].json._raw).toBeDefined();
			expect((results[i].json._raw as Record<string, unknown>).nome).toBe(rawData[i].nome);
		}
	});

	it('fipeModels — _raw[index] aligns with normalized[index]', async () => {
		const rawData = {
			modelos: [
				{ codigo: 1, nome: 'Model A' },
				{ codigo: 2, nome: 'Model B' },
			],
			anos: [{ codigo: '2024-1', nome: '2024 Gasolina' }],
		};
		const ctx = createFipeContext({ includeRaw: true }, rawData);
		const results = await fipeModels(ctx, 0);

		expect(results).toHaveLength(2);
		expect((results[0].json._raw as Record<string, unknown>).nome).toBe('Model A');
		expect((results[1].json._raw as Record<string, unknown>).nome).toBe('Model B');
	});

	it('fipeYears — _raw[index] aligns with normalized[index]', async () => {
		const rawData = [
			{ codigo: '2024-1', nome: '2024 Gasolina' },
			{ codigo: '2023-1', nome: '2023 Gasolina' },
		];
		const ctx = createFipeContext({ includeRaw: true }, rawData);
		const results = await fipeYears(ctx, 0);

		expect(results).toHaveLength(2);
		expect((results[0].json._raw as Record<string, unknown>).codigo).toBe('2024-1');
		expect((results[1].json._raw as Record<string, unknown>).codigo).toBe('2023-1');
	});

	it('fipePrice — _raw is the full raw response', async () => {
		const rawData = {
			TipoVeiculo: 1,
			Marca: 'Honda',
			Modelo: 'Civic',
			AnoModelo: 2024,
			Combustivel: 'Gasolina',
			CodigoFipe: '014275-3',
			MesReferencia: 'marco de 2026',
			Valor: 'R$ 148.363,00',
			SiglaCombustivel: 'G',
		};
		const ctx = createFipeContext({ includeRaw: true }, rawData);
		const results = await fipePrice(ctx, 0);

		expect(results).toHaveLength(1);
		expect(results[0].json._raw).toEqual(rawData);
	});

	it('fipeBrands — non-array response + includeRaw=true → empty array (no crash)', async () => {
		const ctx = createFipeContext({ includeRaw: true }, { unexpected: 'object' });
		const results = await fipeBrands(ctx, 0);
		expect(results).toEqual([]);
	});

	it('fipeYears — non-array response + includeRaw=true → empty array (no crash)', async () => {
		const ctx = createFipeContext({ includeRaw: true }, 'not an array');
		const results = await fipeYears(ctx, 0);
		expect(results).toEqual([]);
	});

	it('fipeModels — response with modelos but no matching raw → _raw is undefined', async () => {
		// Edge: normalizeModels extracts models but the raw response has fewer items than expected
		const rawData = {
			modelos: [{ codigo: 1, nome: 'Only' }],
		};
		const ctx = createFipeContext({ includeRaw: true }, rawData);
		const results = await fipeModels(ctx, 0);

		expect(results).toHaveLength(1);
		expect(results[0].json._raw).toEqual({ codigo: 1, nome: 'Only' });
	});
});

// ═══════════════════════════════════════════════════════════════════════
// FIPE VECTOR 15: URL construction attack vectors
// ═══════════════════════════════════════════════════════════════════════

describe('FIPE VECTOR 15: URL construction attack vectors', () => {
	it('NOTED — brandCode with path traversal "../" is passed to URL as-is', async () => {
		const ctx = createFipeContext({ brandCode: '../../../etc/passwd' });
		await fipeModels(ctx, 0);
		const callUrl = (ctx.helpers.httpRequest as jest.Mock).mock.calls[0][0].url;
		// OBSERVATION: No URL sanitization — path traversal is passed through
		// The API server should reject this, not the client node
		expect(callUrl).toContain('../../../etc/passwd');
	});

	it('NOTED — vehicleType with query injection is passed to URL as-is', async () => {
		const ctx = createFipeContext({ vehicleType: 'carros?injected=true&' });
		await fipeBrands(ctx, 0);
		const callUrl = (ctx.helpers.httpRequest as jest.Mock).mock.calls[0][0].url;
		expect(callUrl).toContain('carros?injected=true&');
	});

	it('NOTED — yearCode with URL encoding bypasses', async () => {
		const ctx = createFipeContext({ yearCode: '2024-1%00.html' });
		await fipePrice(ctx, 0);
		const callUrl = (ctx.helpers.httpRequest as jest.Mock).mock.calls[0][0].url;
		expect(callUrl).toContain('2024-1%00.html');
	});

	it('PASS — httpRequest is called with correct headers', async () => {
		const ctx = createFipeContext({});
		await fipeBrands(ctx, 0);
		const callArgs = (ctx.helpers.httpRequest as jest.Mock).mock.calls[0][0];
		expect(callArgs.headers).toHaveProperty('User-Agent', 'n8n-brasil-hub-node/1.0');
		expect(callArgs.headers).toHaveProperty('Accept', 'application/json');
		expect(callArgs.method).toBe('GET');
		expect(callArgs.timeout).toBe(10000);
	});
});

// ═══════════════════════════════════════════════════════════════════════
// FIPE VECTOR 16: API returns error object instead of data
// ═══════════════════════════════════════════════════════════════════════

describe('FIPE VECTOR 16: API returns error object instead of data', () => {
	it('fipeBrands — error object {error: "message"} → returns empty (not array)', async () => {
		const ctx = createFipeContext({}, { error: 'veiculos nao encontrados', status: 404 });
		const results = await fipeBrands(ctx, 0);
		// normalizeBrands checks Array.isArray → false → returns []
		expect(results).toEqual([]);
	});

	it('fipeModels — error object → returns empty (no modelos key)', async () => {
		const ctx = createFipeContext({}, { error: 'marca nao encontrada' });
		const results = await fipeModels(ctx, 0);
		expect(results).toEqual([]);
	});

	it('fipeYears — error object → returns empty (not array)', async () => {
		const ctx = createFipeContext({}, { error: 'modelo nao encontrado' });
		const results = await fipeYears(ctx, 0);
		expect(results).toEqual([]);
	});

	it('fipePrice — error object → produces safe defaults (silent garbage)', async () => {
		const ctx = createFipeContext({}, { error: 'veiculo nao encontrado', status: 404 });
		const results = await fipePrice(ctx, 0);
		// BUG CANDIDATE: normalizePrice doesn't check for error responses
		// It produces an item with vehicleType=0, brand='', etc.
		expect(results).toHaveLength(1);
		expect(results[0].json).toHaveProperty('vehicleType', 0);
		expect(results[0].json).toHaveProperty('brand', '');
		expect(results[0].json).toHaveProperty('price', '');
	});

	it('fipeBrands — HTML error page → returns empty (string is not array)', async () => {
		const ctx = createFipeContext({}, '<html><body>503 Service Unavailable</body></html>');
		const results = await fipeBrands(ctx, 0);
		expect(results).toEqual([]);
	});
});

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
		let callIndex = 0;
		const ctx = createExecuteContext({
			resource: 'cnpj',
			operation: 'query',
			continueOnFail: true,
		});
		// Override httpRequest to throw undefined
		(ctx.helpers.httpRequest as jest.Mock).mockImplementation(async () => {
			callIndex++;
			throw undefined; // eslint-disable-line no-throw-literal
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
			if (name === 'cnpj') throw 'raw string error'; // eslint-disable-line no-throw-literal
			return undefined;
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
			if (name === 'cnpj') throw 'string thrown'; // eslint-disable-line no-throw-literal
			return undefined;
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

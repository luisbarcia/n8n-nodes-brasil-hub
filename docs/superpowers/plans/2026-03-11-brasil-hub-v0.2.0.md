# Brasil Hub v0.2.0 Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add 5 new resources (CPF, Banks, DDD, FIPE, Feriados), 4 CNPJ providers, 1 CEP provider, Simplify parameter, and enhanced error messages. After v0.2.0, no other n8n node covers more Brazilian data endpoints.

**Architecture:** Single node (`BrasilHub`) with dictionary map router. Each resource has 3 files (description, execute, normalize). Multi-provider fallback via `shared/fallback.ts`. TDD: RED → GREEN for every file.

**Tech Stack:** TypeScript, n8n-workflow, Jest + ts-jest, zero runtime dependencies.

**Spec:** `docs/superpowers/specs/2026-03-11-brasil-hub-v0.2.0-design.md`
**Milestone:** https://github.com/luisbarcia/n8n-nodes-brasil-hub/milestone/1

---

## File Structure (full map of changes)

### New files (15)
```
nodes/BrasilHub/resources/
├── cpf/
│   ├── cpf.description.ts
│   ├── cpf.execute.ts
│   └── cpf.normalize.ts
├── banks/
│   ├── banks.description.ts
│   ├── banks.execute.ts
│   └── banks.normalize.ts
├── ddd/
│   ├── ddd.description.ts
│   ├── ddd.execute.ts
│   └── ddd.normalize.ts
├── fipe/
│   ├── fipe.description.ts
│   ├── fipe.execute.ts
│   └── fipe.normalize.ts
└── feriados/
    ├── feriados.description.ts
    ├── feriados.execute.ts
    └── feriados.normalize.ts

__tests__/
├── cpf.validate.spec.ts
├── banks.normalize.spec.ts
├── banks.execute.spec.ts
├── ddd.normalize.spec.ts
├── ddd.execute.spec.ts
├── fipe.normalize.spec.ts
├── fipe.execute.spec.ts
├── feriados.normalize.spec.ts
└── feriados.execute.spec.ts
```

### Modified files (8)
```
nodes/BrasilHub/BrasilHub.node.ts       — router entries, ExecuteFunction signature, imports
nodes/BrasilHub/types.ts                — IBank, IDdd, IFipeBrand/Model/Year/Price, IFeriado
nodes/BrasilHub/shared/validators.ts    — validateCpf(), sanitizeCpf()
nodes/BrasilHub/resources/cnpj/cnpj.normalize.ts  — +4 normalizer functions
nodes/BrasilHub/resources/cnpj/cnpj.execute.ts    — +4 providers, simplify param
nodes/BrasilHub/resources/cnpj/cnpj.description.ts — +simplify checkbox
nodes/BrasilHub/resources/cep/cep.normalize.ts     — +1 normalizer (ApiCEP)
nodes/BrasilHub/resources/cep/cep.execute.ts       — +1 provider, buildProviders fix
nodes/BrasilHub/shared/fallback.ts      — enhanced error messages
__tests__/cnpj.normalize.spec.ts        — +4 provider tests
__tests__/cnpj.execute.spec.ts          — +simplify tests
__tests__/cep.normalize.spec.ts         — +1 provider test
__tests__/BrasilHub.execute.spec.ts     — +new resource integration tests
```

---

## Chunk 1: Router Refactor + CPF Resource

### Task 1: Update ExecuteFunction signature for multi-item returns (#40)

The current signature returns a single `INodeExecutionData`. New resources (Feriados, FIPE Brands/Models/Years, Banks List) return arrays. Change the signature **first** so all new resources can use it.

**Files:**
- Modify: `nodes/BrasilHub/BrasilHub.node.ts`
- Modify: `nodes/BrasilHub/resources/cnpj/cnpj.execute.ts`
- Modify: `nodes/BrasilHub/resources/cep/cep.execute.ts`

- [ ] **Step 1: Update ExecuteFunction type and execute loop**

In `nodes/BrasilHub/BrasilHub.node.ts`, change the type and loop:

```typescript
// Change the return type from single to array
type ExecuteFunction = (
	context: IExecuteFunctions,
	itemIndex: number,
) => Promise<INodeExecutionData[]>;  // was INodeExecutionData

// In the execute() method, change:
//   const result = await handler(this, i);
//   returnData.push(result);
// To:
const results = await handler(this, i);
returnData.push(...results);
```

- [ ] **Step 2: Update existing CNPJ handlers to return arrays**

In `nodes/BrasilHub/resources/cnpj/cnpj.execute.ts`, wrap both handlers:

```typescript
// cnpjQuery: change last line from `return { json: ... }` to:
return [{ json: ..., pairedItem: { item: itemIndex } }];

// cnpjValidate: same wrap
return [{ json: result as unknown as IDataObject, pairedItem: { item: itemIndex } }];
```

- [ ] **Step 3: Update existing CEP handlers to return arrays**

Same pattern in `nodes/BrasilHub/resources/cep/cep.execute.ts`.

- [ ] **Step 4: Run all tests — must pass without changes**

Run: `npx jest`
Expected: All 60 tests PASS (the spread `...results` with single-element arrays produces same output).

Note: Integration tests in `BrasilHub.execute.spec.ts` destructure `[[result]]` which still works because the outer array is from the node output and the inner spread produces the same items.

- [ ] **Step 5: Build + lint**

Run: `npx n8n-node build && npx n8n-node lint`
Expected: Clean.

- [ ] **Step 6: Commit**

```bash
git add nodes/BrasilHub/BrasilHub.node.ts nodes/BrasilHub/resources/cnpj/cnpj.execute.ts nodes/BrasilHub/resources/cep/cep.execute.ts
git commit -m "refactor: update ExecuteFunction to return arrays for multi-item support

Closes #40"
```

---

### Task 2: CPF Validator (#5 — part 1)

**Files:**
- Modify: `nodes/BrasilHub/shared/validators.ts`
- Create: `__tests__/cpf.validate.spec.ts`

- [ ] **Step 1: Write failing tests for validateCpf**

Create `__tests__/cpf.validate.spec.ts`:

```typescript
import { validateCpf } from '../nodes/BrasilHub/shared/validators';

describe('validateCpf', () => {
	it('should validate a correct CPF', () => {
		const result = validateCpf('529.982.247-25');
		expect(result).toEqual({
			valid: true,
			formatted: '529.982.247-25',
			input: '529.982.247-25',
		});
	});

	it('should validate CPF without formatting', () => {
		const result = validateCpf('52998224725');
		expect(result.valid).toBe(true);
		expect(result.formatted).toBe('529.982.247-25');
	});

	it('should reject CPF with wrong length', () => {
		expect(validateCpf('123').valid).toBe(false);
		expect(validateCpf('123456789012').valid).toBe(false);
	});

	it('should reject all-same-digit CPFs', () => {
		for (let d = 0; d <= 9; d++) {
			const cpf = String(d).repeat(11);
			expect(validateCpf(cpf).valid).toBe(false);
		}
	});

	it('should reject CPF with invalid first check digit', () => {
		// 529.982.247-35 — wrong first check digit (3 instead of 2)
		expect(validateCpf('52998224735').valid).toBe(false);
	});

	it('should reject CPF with invalid second check digit', () => {
		// 529.982.247-26 — wrong second check digit (6 instead of 5)
		expect(validateCpf('52998224726').valid).toBe(false);
	});

	it('should validate another known-valid CPF', () => {
		// 347.066.120-98 is mathematically valid
		expect(validateCpf('34706612098').valid).toBe(true);
		expect(validateCpf('34706612098').formatted).toBe('347.066.120-98');
	});

	it('should handle CPF with special characters', () => {
		expect(validateCpf('529-982-247/25').valid).toBe(true);
	});
});
```

- [ ] **Step 2: Run tests — verify they fail**

Run: `npx jest __tests__/cpf.validate.spec.ts`
Expected: FAIL — `validateCpf` is not exported from validators.

- [ ] **Step 3: Implement validateCpf and sanitizeCpf**

Add to `nodes/BrasilHub/shared/validators.ts`:

```typescript
/** Formats an 11-digit string into `XXX.XXX.XXX-XX`. */
function formatCpf(digits: string): string {
	return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9, 11)}`;
}

/**
 * Validates a CPF number using the Módulo 11 checksum algorithm.
 *
 * Checks length (11 digits), rejects all-same-digit sequences, and verifies
 * both check digits using weighted modular arithmetic.
 *
 * @param cpf - CPF string, with or without formatting.
 * @returns Validation result with `valid`, `formatted`, and original `input`.
 */
export function validateCpf(cpf: string): IValidationResult {
	const input = cpf;
	const digits = stripNonDigits(cpf);

	if (digits.length !== 11) {
		return { valid: false, formatted: '', input };
	}

	if (/^(\d)\1{10}$/.test(digits)) {
		return { valid: false, formatted: '', input };
	}

	const weights1 = [10, 9, 8, 7, 6, 5, 4, 3, 2];
	let sum = 0;
	for (let i = 0; i < 9; i++) {
		sum += Number.parseInt(digits[i], 10) * weights1[i];
	}
	let remainder = sum % 11;
	const check1 = remainder < 2 ? 0 : 11 - remainder;

	if (Number.parseInt(digits[9], 10) !== check1) {
		return { valid: false, formatted: '', input };
	}

	const weights2 = [11, 10, 9, 8, 7, 6, 5, 4, 3, 2];
	sum = 0;
	for (let i = 0; i < 10; i++) {
		sum += Number.parseInt(digits[i], 10) * weights2[i];
	}
	remainder = sum % 11;
	const check2 = remainder < 2 ? 0 : 11 - remainder;

	if (Number.parseInt(digits[10], 10) !== check2) {
		return { valid: false, formatted: '', input };
	}

	return { valid: true, formatted: formatCpf(digits), input };
}

/**
 * Strips non-digit characters from a CPF string.
 *
 * @param cpf - Raw CPF input.
 * @returns Digits-only string.
 */
export function sanitizeCpf(cpf: string): string {
	return stripNonDigits(cpf);
}
```

- [ ] **Step 4: Run tests — verify they pass**

Run: `npx jest __tests__/cpf.validate.spec.ts`
Expected: All 8 tests PASS.

- [ ] **Step 5: Run full suite**

Run: `npx jest`
Expected: All tests PASS.

- [ ] **Step 6: Commit**

```bash
git add nodes/BrasilHub/shared/validators.ts __tests__/cpf.validate.spec.ts
git commit -m "feat: add CPF validator with Módulo 11 checksum

TDD: 8 tests covering valid CPFs, all-same-digit rejection, check digit
verification, and format handling.

Ref #5"
```

---

### Task 3: CPF Resource Files (#5 — part 2)

**Files:**
- Create: `nodes/BrasilHub/resources/cpf/cpf.description.ts`
- Create: `nodes/BrasilHub/resources/cpf/cpf.execute.ts`
- Create: `nodes/BrasilHub/resources/cpf/cpf.normalize.ts`
- Modify: `nodes/BrasilHub/BrasilHub.node.ts` (router + description + imports)

- [ ] **Step 1: Create cpf.description.ts**

```typescript
import type { INodeProperties } from 'n8n-workflow';

const showForCpf = { resource: ['cpf'] };

/** n8n node property definitions for the CPF resource. */
export const cpfDescription: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: showForCpf },
		options: [
			{
				name: 'Validate',
				value: 'validate',
				action: 'Validate a CPF number',
				description: 'Check if a CPF number is valid using checksum verification',
			},
		],
		default: 'validate',
	},
	{
		displayName: 'CPF',
		name: 'cpf',
		type: 'string',
		required: true,
		displayOptions: { show: showForCpf },
		default: '',
		placeholder: 'e.g. 529.982.247-25',
		description: 'The CPF number to validate (with or without formatting)',
	},
];
```

- [ ] **Step 2: Create cpf.execute.ts**

```typescript
import type { IExecuteFunctions, INodeExecutionData, IDataObject } from 'n8n-workflow';
import { validateCpf } from '../../shared/validators';

/**
 * Validates a CPF number locally using the Módulo 11 checksum algorithm.
 *
 * No API call is made. Returns `{valid, formatted, input}` as n8n execution data.
 */
export async function cpfValidate(
	context: IExecuteFunctions,
	itemIndex: number,
): Promise<INodeExecutionData[]> {
	const cpfInput = context.getNodeParameter('cpf', itemIndex) as string;
	const result = validateCpf(cpfInput);

	return [{
		json: result as unknown as IDataObject,
		pairedItem: { item: itemIndex },
	}];
}
```

- [ ] **Step 3: Create cpf.normalize.ts**

Thin file — CPF has no API providers, but we keep the pattern for consistency:

```typescript
/**
 * CPF resource uses local-only validation (no API providers).
 * This file exists to maintain the 3-file resource pattern.
 * All normalization is handled by the validator in shared/validators.ts.
 */
```

- [ ] **Step 4: Register CPF in router**

In `nodes/BrasilHub/BrasilHub.node.ts`:

Add import:
```typescript
import { cpfDescription } from './resources/cpf/cpf.description';
import { cpfValidate } from './resources/cpf/cpf.execute';
```

Add to resource options array:
```typescript
{ name: 'CPF', value: 'cpf', description: 'Validate Brazilian individual tax IDs' },
```

Add to `resourceOperations`:
```typescript
cpf: { validate: cpfValidate },
```

Add to properties spread:
```typescript
...cpfDescription,
```

- [ ] **Step 5: Add CPF integration tests**

Add to `__tests__/BrasilHub.execute.spec.ts`:

```typescript
it('should dispatch cpf/validate and return result', async () => {
	const ctx = createExecuteContext({
		resource: 'cpf',
		operation: 'validate',
		cpf: '52998224725',
	});
	const [[result]] = await node.execute.call(ctx);
	expect(result.json).toEqual({
		valid: true,
		formatted: '529.982.247-25',
		input: '52998224725',
	});
});
```

Note: `createExecuteContext` needs a `cpf` param added to its `params` object.

- [ ] **Step 6: Run full test suite**

Run: `npx jest`
Expected: All tests PASS.

- [ ] **Step 7: Build + lint**

Run: `npx n8n-node build && npx n8n-node lint`
Expected: Clean.

- [ ] **Step 8: Commit**

```bash
git add nodes/BrasilHub/resources/cpf/ nodes/BrasilHub/BrasilHub.node.ts __tests__/BrasilHub.execute.spec.ts
git commit -m "feat: add CPF resource with local validation

Validates CPF numbers using Módulo 11 checksum. No API call needed.
Rejects all-same-digit CPFs (000...000 through 999...999).

Closes #5"
```

---

## Chunk 2: Banks + DDD Resources

### Task 4: Banks Types + Normalizers (#32 — part 1)

**Files:**
- Modify: `nodes/BrasilHub/types.ts`
- Create: `nodes/BrasilHub/resources/banks/banks.normalize.ts`
- Create: `__tests__/banks.normalize.spec.ts`

- [ ] **Step 1: Add IBank to types.ts**

```typescript
/** Normalized bank information from BrasilAPI or BancosBrasileiros. */
export interface IBank {
	/** Bank code (COMPE code). */
	code: number;
	/** Short bank name. */
	name: string;
	/** Full legal name. */
	fullName: string;
	/** ISPB code (8 digits). */
	ispb: string;
}
```

- [ ] **Step 2: Write failing normalizer tests**

Create `__tests__/banks.normalize.spec.ts`:

```typescript
import { normalizeBank } from '../nodes/BrasilHub/resources/banks/banks.normalize';

const brasilApiResponse = {
	ispb: '00000000',
	name: 'BCO DO BRASIL S.A.',
	code: 1,
	fullName: 'Banco do Brasil S.A.',
};

const bancosBrasileirosResponse = {
	COMPE: 1,
	ISPB: '00000000',
	Document: '00.000.000/0001-91',
	LongName: 'Banco do Brasil S.A.',
	ShortName: 'BCO DO BRASIL S.A.',
	Network: 'RSFN',
	Type: 'Banco Múltiplo',
	PixType: 'DRCT',
	Charge: true,
	CreditDocument: true,
	SalaryPortability: 'Destinatário',
	Products: ['Banco Múltiplo'],
	Url: 'https://www.bb.com.br',
	DateOperationStarted: '2002-04-22',
	DatePixStarted: '2020-11-03',
	DateRegistered: '2023-01-01',
	DateUpdated: '2023-06-01',
};

describe('normalizeBank', () => {
	it('should normalize BrasilAPI bank response', () => {
		const result = normalizeBank(brasilApiResponse, 'brasilapi');
		expect(result).toEqual({
			code: 1,
			name: 'BCO DO BRASIL S.A.',
			fullName: 'Banco do Brasil S.A.',
			ispb: '00000000',
		});
	});

	it('should normalize BancosBrasileiros bank response', () => {
		const result = normalizeBank(bancosBrasileirosResponse, 'bancosbrasileiros');
		expect(result).toEqual({
			code: 1,
			name: 'BCO DO BRASIL S.A.',
			fullName: 'Banco do Brasil S.A.',
			ispb: '00000000',
		});
	});

	it('should handle missing fields gracefully', () => {
		const minimal = { code: 1 };
		const result = normalizeBank(minimal, 'brasilapi');
		expect(result.code).toBe(1);
		expect(result.name).toBe('');
		expect(result.fullName).toBe('');
		expect(result.ispb).toBe('');
	});

	it('should throw for unknown provider', () => {
		expect(() => normalizeBank({}, 'unknown')).toThrow('Unknown Banks provider: unknown');
	});
});
```

- [ ] **Step 3: Run tests — verify they fail**

Run: `npx jest __tests__/banks.normalize.spec.ts`
Expected: FAIL — module not found.

- [ ] **Step 4: Implement banks.normalize.ts**

```typescript
import type { IBank } from '../../types';
import { safeStr } from '../../shared/utils';

/** Maps BrasilAPI bank response to {@link IBank}. */
function normalizeBrasilApi(data: Record<string, unknown>): IBank {
	return {
		code: Number(data.code ?? 0),
		name: safeStr(data.name),
		fullName: safeStr(data.fullName),
		ispb: safeStr(data.ispb),
	};
}

/** Maps BancosBrasileiros (GitHub JSON) response to {@link IBank}. */
function normalizeBancosBrasileiros(data: Record<string, unknown>): IBank {
	return {
		code: Number(data.COMPE ?? 0),
		name: safeStr(data.ShortName),
		fullName: safeStr(data.LongName),
		ispb: safeStr(data.ISPB),
	};
}

const normalizers: Record<string, (data: Record<string, unknown>) => IBank> = {
	brasilapi: normalizeBrasilApi,
	bancosbrasileiros: normalizeBancosBrasileiros,
};

/**
 * Normalizes raw bank API response into the unified {@link IBank} schema.
 *
 * @param data - Raw JSON response from the provider.
 * @param provider - Provider identifier.
 * @returns Normalized bank result.
 * @throws {Error} If the provider name is not recognized.
 */
export function normalizeBank(data: unknown, provider: string): IBank {
	const normalizer = normalizers[provider];
	if (!normalizer) {
		throw new Error(`Unknown Banks provider: ${provider}`);
	}
	return normalizer(data as Record<string, unknown>);
}
```

- [ ] **Step 5: Run tests — verify they pass**

Run: `npx jest __tests__/banks.normalize.spec.ts`
Expected: All 4 tests PASS.

- [ ] **Step 6: Commit**

```bash
git add nodes/BrasilHub/types.ts nodes/BrasilHub/resources/banks/banks.normalize.ts __tests__/banks.normalize.spec.ts
git commit -m "feat: add Banks normalizers for BrasilAPI and BancosBrasileiros

TDD: 4 tests covering both providers, missing fields, and unknown
provider error.

Ref #32"
```

---

### Task 5: Banks Description + Execute + Router (#32 — part 2)

**Files:**
- Create: `nodes/BrasilHub/resources/banks/banks.description.ts`
- Create: `nodes/BrasilHub/resources/banks/banks.execute.ts`
- Create: `__tests__/banks.execute.spec.ts`
- Modify: `nodes/BrasilHub/BrasilHub.node.ts`

- [ ] **Step 1: Create banks.description.ts**

```typescript
import type { INodeProperties } from 'n8n-workflow';

const showForBanks = { resource: ['banks'] };
const showForBanksQuery = { resource: ['banks'], operation: ['query'] };

/** n8n node property definitions for the Banks resource. */
export const banksDescription: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: showForBanks },
		options: [
			{
				name: 'Query',
				value: 'query',
				action: 'Query bank by code',
				description: 'Fetch bank information by COMPE code',
			},
			{
				name: 'List',
				value: 'list',
				action: 'List all banks',
				description: 'Fetch all Brazilian financial institutions',
			},
		],
		default: 'query',
	},
	{
		displayName: 'Bank Code',
		name: 'bankCode',
		type: 'string',
		required: true,
		displayOptions: { show: showForBanksQuery },
		default: '',
		placeholder: 'e.g. 1',
		description: 'The COMPE bank code (positive integer)',
	},
	{
		displayName: 'Include Raw Response',
		name: 'includeRaw',
		type: 'boolean',
		displayOptions: { show: showForBanks },
		default: false,
		description: 'Whether to include the raw API response alongside the normalized data',
	},
];
```

- [ ] **Step 2: Create banks.execute.ts**

```typescript
import type { IExecuteFunctions, INodeExecutionData, IDataObject } from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';
import type { IProvider, IMeta } from '../../types';
import { queryWithFallback } from '../../shared/fallback';
import { normalizeBank } from './banks.normalize';

const BANKS_QUERY_PROVIDERS: IProvider[] = [
	{ name: 'brasilapi', url: 'https://brasilapi.com.br/api/banks/v1/' },
];

const BANKS_LIST_PROVIDERS: IProvider[] = [
	{ name: 'brasilapi', url: 'https://brasilapi.com.br/api/banks/v1' },
	{ name: 'bancosbrasileiros', url: 'https://raw.githubusercontent.com/guibranco/BancosBrasileiros/main/data/bancos.json' },
];

/**
 * Queries a single bank by COMPE code.
 */
export async function banksQuery(
	context: IExecuteFunctions,
	itemIndex: number,
): Promise<INodeExecutionData[]> {
	const bankCodeInput = context.getNodeParameter('bankCode', itemIndex) as string;
	const includeRaw = context.getNodeParameter('includeRaw', itemIndex, false) as boolean;

	const bankCode = Number.parseInt(bankCodeInput, 10);
	if (Number.isNaN(bankCode) || bankCode <= 0) {
		throw new NodeOperationError(
			context.getNode(),
			'Invalid bank code: must be a positive number',
			{ itemIndex },
		);
	}

	const providers = BANKS_QUERY_PROVIDERS.map((p) => ({
		name: p.name,
		url: `${p.url}${bankCode}`,
	}));

	const result = await queryWithFallback(context, providers);
	const normalized = normalizeBank(result.data, result.provider);

	const meta: IMeta = {
		provider: result.provider,
		query: String(bankCode),
		queried_at: new Date().toISOString(),
		strategy: result.errors.length > 0 ? 'fallback' : 'direct',
		...(result.errors.length > 0 && { errors: result.errors }),
	};

	return [{
		json: {
			...normalized,
			_meta: meta,
			...(includeRaw && { _raw: result.data as IDataObject }),
		} as IDataObject,
		pairedItem: { item: itemIndex },
	}];
}

/**
 * Lists all Brazilian banks. Returns one n8n item per bank.
 */
export async function banksList(
	context: IExecuteFunctions,
	itemIndex: number,
): Promise<INodeExecutionData[]> {
	const includeRaw = context.getNodeParameter('includeRaw', itemIndex, false) as boolean;

	const result = await queryWithFallback(context, BANKS_LIST_PROVIDERS);
	const banks = Array.isArray(result.data) ? result.data : [];

	const meta: IMeta = {
		provider: result.provider,
		query: 'list',
		queried_at: new Date().toISOString(),
		strategy: result.errors.length > 0 ? 'fallback' : 'direct',
		...(result.errors.length > 0 && { errors: result.errors }),
	};

	return banks.map((raw: unknown) => {
		const normalized = normalizeBank(raw, result.provider);
		return {
			json: {
				...normalized,
				_meta: meta,
				...(includeRaw && { _raw: raw as IDataObject }),
			} as IDataObject,
			pairedItem: { item: itemIndex },
		};
	});
}
```

- [ ] **Step 3: Write banks execute tests**

Create `__tests__/banks.execute.spec.ts`:

```typescript
import { banksQuery, banksList } from '../nodes/BrasilHub/resources/banks/banks.execute';

function createMockContext(overrides: Record<string, unknown> = {}) {
	const params: Record<string, unknown> = {
		bankCode: '1',
		includeRaw: false,
		...overrides,
	};
	return {
		getNodeParameter: jest.fn((name: string, _index: number, fallback?: unknown) =>
			params[name] ?? fallback,
		),
		getNode: jest.fn(() => ({ name: 'Brasil Hub' })),
		helpers: {
			httpRequest: jest.fn().mockResolvedValue({
				ispb: '00000000',
				name: 'BCO DO BRASIL S.A.',
				code: 1,
				fullName: 'Banco do Brasil S.A.',
			}),
		},
	} as unknown as Parameters<typeof banksQuery>[0];
}

describe('banksQuery', () => {
	it('should return normalized bank data with _meta', async () => {
		const ctx = createMockContext();
		const results = await banksQuery(ctx, 0);
		expect(results).toHaveLength(1);
		expect(results[0].json).toHaveProperty('code', 1);
		expect(results[0].json).toHaveProperty('name', 'BCO DO BRASIL S.A.');
		expect(results[0].json).toHaveProperty('_meta');
		expect(results[0].pairedItem).toEqual({ item: 0 });
	});

	it('should throw on invalid bank code (non-number)', async () => {
		const ctx = createMockContext({ bankCode: 'abc' });
		await expect(banksQuery(ctx, 0)).rejects.toThrow('Invalid bank code: must be a positive number');
	});

	it('should throw on negative bank code', async () => {
		const ctx = createMockContext({ bankCode: '-1' });
		await expect(banksQuery(ctx, 0)).rejects.toThrow('Invalid bank code: must be a positive number');
	});

	it('should throw on zero bank code', async () => {
		const ctx = createMockContext({ bankCode: '0' });
		await expect(banksQuery(ctx, 0)).rejects.toThrow('Invalid bank code: must be a positive number');
	});
});

describe('banksList', () => {
	it('should return multiple items (one per bank)', async () => {
		const ctx = {
			...createMockContext(),
			helpers: {
				httpRequest: jest.fn().mockResolvedValue([
					{ ispb: '00000000', name: 'BCO DO BRASIL S.A.', code: 1, fullName: 'Banco do Brasil S.A.' },
					{ ispb: '00000208', name: 'BRB', code: 70, fullName: 'BRB - Banco de Brasília S.A.' },
				]),
			},
		} as unknown as Parameters<typeof banksList>[0];
		const results = await banksList(ctx, 0);
		expect(results).toHaveLength(2);
		expect(results[0].json).toHaveProperty('code', 1);
		expect(results[1].json).toHaveProperty('code', 70);
	});
});
```

- [ ] **Step 4: Run tests — verify they pass**

Run: `npx jest __tests__/banks`
Expected: All tests PASS.

- [ ] **Step 5: Register Banks in router**

In `nodes/BrasilHub/BrasilHub.node.ts`:

Add imports:
```typescript
import { banksDescription } from './resources/banks/banks.description';
import { banksQuery, banksList } from './resources/banks/banks.execute';
```

Add resource option:
```typescript
{ name: 'Banks', value: 'banks', description: 'Query or list Brazilian financial institutions' },
```

Add to `resourceOperations`:
```typescript
banks: { query: banksQuery, list: banksList },
```

Add to properties:
```typescript
...banksDescription,
```

- [ ] **Step 6: Build + lint + full test suite**

Run: `npx n8n-node build && npx n8n-node lint && npx jest`
Expected: All clean, all tests pass.

- [ ] **Step 7: Commit**

```bash
git add nodes/BrasilHub/resources/banks/ nodes/BrasilHub/BrasilHub.node.ts __tests__/banks.execute.spec.ts __tests__/banks.normalize.spec.ts
git commit -m "feat: add Banks resource with Query and List operations

Two providers: BrasilAPI (primary) and BancosBrasileiros (fallback).
List returns 1 item per bank. Query validates bank code is positive integer.

Closes #32"
```

---

### Task 6: DDD Types + Resource (#33)

**Files:**
- Modify: `nodes/BrasilHub/types.ts`
- Create: `nodes/BrasilHub/resources/ddd/ddd.description.ts`
- Create: `nodes/BrasilHub/resources/ddd/ddd.execute.ts`
- Create: `nodes/BrasilHub/resources/ddd/ddd.normalize.ts`
- Create: `__tests__/ddd.normalize.spec.ts`
- Create: `__tests__/ddd.execute.spec.ts`
- Modify: `nodes/BrasilHub/BrasilHub.node.ts`

- [ ] **Step 1: Add IDdd to types.ts**

```typescript
/** Normalized DDD (area code) result from BrasilAPI. */
export interface IDdd {
	/** Two-letter state code (e.g. "SP"). */
	state: string;
	/** Cities served by this DDD. */
	cities: string[];
}
```

- [ ] **Step 2: Write failing normalizer tests**

Create `__tests__/ddd.normalize.spec.ts`:

```typescript
import { normalizeDdd } from '../nodes/BrasilHub/resources/ddd/ddd.normalize';

describe('normalizeDdd', () => {
	it('should normalize BrasilAPI response', () => {
		const data = { state: 'SP', cities: ['SAO PAULO', 'GUARULHOS', 'OSASCO'] };
		const result = normalizeDdd(data, 'brasilapi');
		expect(result).toEqual({
			state: 'SP',
			cities: ['SAO PAULO', 'GUARULHOS', 'OSASCO'],
		});
	});

	it('should handle empty cities', () => {
		const data = { state: 'SP' };
		const result = normalizeDdd(data, 'brasilapi');
		expect(result.state).toBe('SP');
		expect(result.cities).toEqual([]);
	});

	it('should throw for unknown provider', () => {
		expect(() => normalizeDdd({}, 'unknown')).toThrow('Unknown DDD provider: unknown');
	});
});
```

- [ ] **Step 3: Implement ddd.normalize.ts**

```typescript
import type { IDdd } from '../../types';
import { safeStr } from '../../shared/utils';

function normalizeBrasilApi(data: Record<string, unknown>): IDdd {
	const cities = Array.isArray(data.cities) ? data.cities.map(String) : [];
	return {
		state: safeStr(data.state),
		cities,
	};
}

const normalizers: Record<string, (data: Record<string, unknown>) => IDdd> = {
	brasilapi: normalizeBrasilApi,
};

/**
 * Normalizes raw DDD API response into the unified {@link IDdd} schema.
 */
export function normalizeDdd(data: unknown, provider: string): IDdd {
	const normalizer = normalizers[provider];
	if (!normalizer) {
		throw new Error(`Unknown DDD provider: ${provider}`);
	}
	return normalizer(data as Record<string, unknown>);
}
```

- [ ] **Step 4: Create ddd.description.ts**

```typescript
import type { INodeProperties } from 'n8n-workflow';

const showForDdd = { resource: ['ddd'] };
const showForDddQuery = { resource: ['ddd'], operation: ['query'] };

/** n8n node property definitions for the DDD resource. */
export const dddDescription: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: showForDdd },
		options: [
			{
				name: 'Query',
				value: 'query',
				action: 'Query cities by DDD area code',
				description: 'Fetch state and cities served by a DDD area code',
			},
		],
		default: 'query',
	},
	{
		displayName: 'DDD',
		name: 'ddd',
		type: 'string',
		required: true,
		displayOptions: { show: showForDddQuery },
		default: '',
		placeholder: 'e.g. 11',
		description: 'The 2-digit area code (DDD) to query (range 11-99)',
	},
	{
		displayName: 'Include Raw Response',
		name: 'includeRaw',
		type: 'boolean',
		displayOptions: { show: showForDddQuery },
		default: false,
		description: 'Whether to include the raw API response alongside the normalized data',
	},
];
```

- [ ] **Step 5: Create ddd.execute.ts**

```typescript
import type { IExecuteFunctions, INodeExecutionData, IDataObject } from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';
import type { IProvider, IMeta } from '../../types';
import { queryWithFallback } from '../../shared/fallback';
import { normalizeDdd } from './ddd.normalize';
import { stripNonDigits } from '../../shared/utils';

const DDD_PROVIDERS: IProvider[] = [
	{ name: 'brasilapi', url: 'https://brasilapi.com.br/api/ddd/v1/' },
];

/**
 * Queries cities and state by DDD area code.
 */
export async function dddQuery(
	context: IExecuteFunctions,
	itemIndex: number,
): Promise<INodeExecutionData[]> {
	const dddInput = context.getNodeParameter('ddd', itemIndex) as string;
	const includeRaw = context.getNodeParameter('includeRaw', itemIndex, false) as boolean;

	const ddd = stripNonDigits(dddInput);
	const dddNum = Number.parseInt(ddd, 10);

	if (ddd.length !== 2 || Number.isNaN(dddNum) || dddNum < 11 || dddNum > 99) {
		throw new NodeOperationError(
			context.getNode(),
			'Invalid DDD: must be a 2-digit area code between 11 and 99',
			{ itemIndex },
		);
	}

	const providers = DDD_PROVIDERS.map((p) => ({ name: p.name, url: `${p.url}${ddd}` }));
	const result = await queryWithFallback(context, providers);
	const normalized = normalizeDdd(result.data, result.provider);

	const meta: IMeta = {
		provider: result.provider,
		query: ddd,
		queried_at: new Date().toISOString(),
		strategy: result.errors.length > 0 ? 'fallback' : 'direct',
		...(result.errors.length > 0 && { errors: result.errors }),
	};

	return [{
		json: {
			...normalized,
			_meta: meta,
			...(includeRaw && { _raw: result.data as IDataObject }),
		} as IDataObject,
		pairedItem: { item: itemIndex },
	}];
}
```

- [ ] **Step 6: Write DDD execute tests**

Create `__tests__/ddd.execute.spec.ts`:

```typescript
import { dddQuery } from '../nodes/BrasilHub/resources/ddd/ddd.execute';

function createMockContext(overrides: Record<string, unknown> = {}) {
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
			httpRequest: jest.fn().mockResolvedValue({
				state: 'SP',
				cities: ['SAO PAULO', 'GUARULHOS'],
			}),
		},
	} as unknown as Parameters<typeof dddQuery>[0];
}

describe('dddQuery', () => {
	it('should return normalized DDD data with _meta', async () => {
		const ctx = createMockContext();
		const results = await dddQuery(ctx, 0);
		expect(results).toHaveLength(1);
		expect(results[0].json).toHaveProperty('state', 'SP');
		expect(results[0].json).toHaveProperty('cities');
		expect(results[0].json).toHaveProperty('_meta');
	});

	it('should throw on single-digit DDD', async () => {
		const ctx = createMockContext({ ddd: '1' });
		await expect(dddQuery(ctx, 0)).rejects.toThrow('Invalid DDD');
	});

	it('should throw on DDD below 11', async () => {
		const ctx = createMockContext({ ddd: '10' });
		await expect(dddQuery(ctx, 0)).rejects.toThrow('Invalid DDD');
	});

	it('should throw on DDD above 99', async () => {
		const ctx = createMockContext({ ddd: '100' });
		await expect(dddQuery(ctx, 0)).rejects.toThrow('Invalid DDD');
	});

	it('should throw on non-numeric DDD', async () => {
		const ctx = createMockContext({ ddd: 'ab' });
		await expect(dddQuery(ctx, 0)).rejects.toThrow('Invalid DDD');
	});
});
```

- [ ] **Step 7: Register DDD in router + run tests**

Same pattern as Banks. Add imports, resource option, router entry, description spread.

- [ ] **Step 8: Build + lint + full test suite**

Run: `npx n8n-node build && npx n8n-node lint && npx jest`
Expected: All clean.

- [ ] **Step 9: Commit**

```bash
git add nodes/BrasilHub/resources/ddd/ nodes/BrasilHub/types.ts nodes/BrasilHub/BrasilHub.node.ts __tests__/ddd.normalize.spec.ts __tests__/ddd.execute.spec.ts
git commit -m "feat: add DDD resource with area code query

Single provider (BrasilAPI). Validates DDD range 11-99.
Returns state and list of cities served.

Closes #33"
```

---

## Chunk 3: FIPE Resource

### Task 7: FIPE Types + Normalizers (#34 — part 1)

**Files:**
- Modify: `nodes/BrasilHub/types.ts`
- Create: `nodes/BrasilHub/resources/fipe/fipe.normalize.ts`
- Create: `__tests__/fipe.normalize.spec.ts`

- [ ] **Step 1: Add FIPE interfaces to types.ts**

```typescript
/** Normalized FIPE vehicle brand. */
export interface IFipeBrand {
	/** Brand name (e.g. "VW - VolksWagen"). */
	name: string;
	/** Brand code (e.g. "59"). */
	code: string;
}

/** Normalized FIPE vehicle model. */
export interface IFipeModel {
	/** Model code (e.g. 5585). */
	code: number;
	/** Model name (e.g. "AMAROK CD2.0 16V/S CD2.0 16V TDI 4x2 Die"). */
	name: string;
}

/** Normalized FIPE model year. */
export interface IFipeYear {
	/** Year code in YYYY-F format (e.g. "2024-1" where 1=gasoline). */
	code: string;
	/** Year display name (e.g. "2024 Gasolina"). */
	name: string;
}

/** Normalized FIPE vehicle price. */
export interface IFipePrice {
	/** Price formatted in BRL (e.g. "R$ 150.000,00"). */
	value: string;
	/** Brand name. */
	brand: string;
	/** Model name. */
	model: string;
	/** Model year. */
	modelYear: number;
	/** Fuel type (e.g. "Gasolina", "Diesel"). */
	fuel: string;
	/** FIPE table code (e.g. "005527-6"). */
	fipeCode: string;
	/** Reference month (e.g. "março de 2026"). */
	referenceMonth: string;
}
```

- [ ] **Step 2: Write failing normalizer tests**

Create `__tests__/fipe.normalize.spec.ts` with test cases for:
- `normalizeFipeBrands` (parallelum format: `[{codigo, nome}]`)
- `normalizeFipeModels` (parallelum format: `{modelos: [{codigo, nome}]}`)
- `normalizeFipeYears` (parallelum format: `[{codigo, nome}]`)
- `normalizeFipePrice` (parallelum format: `{Valor, Marca, Modelo, AnoModelo, Combustivel, CodigoFipe, MesReferencia}`)
- Unknown provider errors

- [ ] **Step 3: Implement fipe.normalize.ts**

Each normalizer maps parallelum's Portuguese fields to our English schema. Key mappings:
- `codigo` → `code`, `nome` → `name`
- `Valor` → `value`, `Marca` → `brand`, `Modelo` → `model`
- `AnoModelo` → `modelYear`, `Combustivel` → `fuel`
- `CodigoFipe` → `fipeCode`, `MesReferencia` → `referenceMonth`

Export 4 functions: `normalizeFipeBrands`, `normalizeFipeModels`, `normalizeFipeYears`, `normalizeFipePrice`.

- [ ] **Step 4: Run tests — verify they pass**

Run: `npx jest __tests__/fipe.normalize.spec.ts`
Expected: All tests PASS.

- [ ] **Step 5: Commit**

```bash
git add nodes/BrasilHub/types.ts nodes/BrasilHub/resources/fipe/fipe.normalize.ts __tests__/fipe.normalize.spec.ts
git commit -m "feat: add FIPE normalizers for parallelum provider

Maps Portuguese API fields to English normalized schema.
Four normalizers: brands, models, years, price.

Ref #34"
```

---

### Task 8: FIPE Description + Execute + Router (#34 — part 2)

**Files:**
- Create: `nodes/BrasilHub/resources/fipe/fipe.description.ts`
- Create: `nodes/BrasilHub/resources/fipe/fipe.execute.ts`
- Create: `__tests__/fipe.execute.spec.ts`
- Modify: `nodes/BrasilHub/BrasilHub.node.ts`

- [ ] **Step 1: Create fipe.description.ts**

This is the most complex description file — 4 operations with conditional displayOptions:

```typescript
import type { INodeProperties } from 'n8n-workflow';

const showForFipe = { resource: ['fipe'] };
// brandCode shows for models, years, price
const showForFipeWithBrand = { resource: ['fipe'], operation: ['models', 'years', 'price'] };
// modelCode shows for years, price
const showForFipeWithModel = { resource: ['fipe'], operation: ['years', 'price'] };
// yearCode shows for price only
const showForFipePrice = { resource: ['fipe'], operation: ['price'] };

export const fipeDescription: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: showForFipe },
		options: [
			{
				name: 'Brands',
				value: 'brands',
				action: 'List vehicle brands',
				description: 'List all vehicle brands for a vehicle type',
			},
			{
				name: 'Models',
				value: 'models',
				action: 'List vehicle models',
				description: 'List all models for a brand',
			},
			{
				name: 'Years',
				value: 'years',
				action: 'List model years',
				description: 'List available years for a model',
			},
			{
				name: 'Price',
				value: 'price',
				action: 'Get vehicle price',
				description: 'Get FIPE reference price for a specific vehicle',
			},
		],
		default: 'brands',
	},
	{
		displayName: 'Vehicle Type',
		name: 'vehicleType',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: showForFipe },
		options: [
			{ name: 'Cars', value: 'carros' },
			{ name: 'Motorcycles', value: 'motos' },
			{ name: 'Trucks', value: 'caminhoes' },
		],
		default: 'carros',
		description: 'The type of vehicle to query',
	},
	{
		displayName: 'Brand Code',
		name: 'brandCode',
		type: 'string',
		required: true,
		displayOptions: { show: showForFipeWithBrand },
		default: '',
		placeholder: 'e.g. 59',
		description: 'The brand code returned by the Brands operation',
	},
	{
		displayName: 'Model Code',
		name: 'modelCode',
		type: 'string',
		required: true,
		displayOptions: { show: showForFipeWithModel },
		default: '',
		placeholder: 'e.g. 5585',
		description: 'The model code returned by the Models operation',
	},
	{
		displayName: 'Year Code',
		name: 'yearCode',
		type: 'string',
		required: true,
		displayOptions: { show: showForFipePrice },
		default: '',
		placeholder: 'e.g. 2024-1',
		description: 'The year code in YYYY-F format (F: 1=gasoline, 2=ethanol, 3=diesel)',
	},
	{
		displayName: 'Include Raw Response',
		name: 'includeRaw',
		type: 'boolean',
		displayOptions: { show: showForFipe },
		default: false,
		description: 'Whether to include the raw API response alongside the normalized data',
	},
];
```

- [ ] **Step 2: Create fipe.execute.ts**

4 exported functions: `fipeBrands`, `fipeModels`, `fipeYears`, `fipePrice`. Each builds the URL from params and calls parallelum. Brands/Models/Years return multiple items.

Key URL pattern: `https://parallelum.com.br/fipe/api/v1/{vehicleType}/marcas/...`

Input validation:
- `fipeModels`: brandCode required
- `fipeYears`: brandCode + modelCode required
- `fipePrice`: brandCode + modelCode + yearCode required

- [ ] **Step 3: Write FIPE execute tests**

Create `__tests__/fipe.execute.spec.ts` with mock context for each operation. Test:
- Brands returns array of `IFipeBrand` items
- Models returns array of `IFipeModel` items
- Years returns array of `IFipeYear` items
- Price returns single `IFipePrice` item
- Empty brandCode throws `NodeOperationError`
- Empty modelCode throws `NodeOperationError`
- Empty yearCode throws `NodeOperationError`

- [ ] **Step 4: Register FIPE in router (4 entries)**

```typescript
fipe: { brands: fipeBrands, models: fipeModels, years: fipeYears, price: fipePrice },
```

- [ ] **Step 5: Build + lint + full test suite**

Run: `npx n8n-node build && npx n8n-node lint && npx jest`

- [ ] **Step 6: Commit**

```bash
git commit -m "feat: add FIPE resource with 4 operations (brands, models, years, price)

Hierarchical navigation: vehicleType → brands → models → years → price.
Primary provider: parallelum.com.br with full hierarchy support.
Conditional displayOptions show only relevant params per operation.

Closes #34"
```

---

## Chunk 4: Feriados + Additional Providers

### Task 9: Feriados Resource (#35)

**Files:**
- Modify: `nodes/BrasilHub/types.ts` — add `IFeriado`
- Create: `nodes/BrasilHub/resources/feriados/feriados.normalize.ts`
- Create: `nodes/BrasilHub/resources/feriados/feriados.description.ts`
- Create: `nodes/BrasilHub/resources/feriados/feriados.execute.ts`
- Create: `__tests__/feriados.normalize.spec.ts`
- Create: `__tests__/feriados.execute.spec.ts`
- Modify: `nodes/BrasilHub/BrasilHub.node.ts`

- [ ] **Step 1: Add IFeriado to types.ts**

```typescript
/** Normalized Brazilian holiday. */
export interface IFeriado {
	/** Holiday date in ISO format (YYYY-MM-DD). */
	date: string;
	/** Holiday name in Portuguese. */
	name: string;
	/** Holiday type (e.g. "national"). */
	type: string;
}
```

- [ ] **Step 2: Write failing normalizer tests**

Test BrasilAPI response (`{date, name, type}`) and Nager.Date response (`{date, localName, name, fixed, global, types}`). Nager.Date `types` is an array — take first element or "national".

- [ ] **Step 3: Implement feriados.normalize.ts**

Two normalizer functions. BrasilAPI is almost 1:1. Nager.Date maps `localName` → `name` and `types[0]` → `type`.

- [ ] **Step 4: Create feriados.description.ts**

Single operation (query). Year parameter with placeholder "e.g. 2026".

- [ ] **Step 5: Create feriados.execute.ts**

Key differences from other resources:
- Input validation: year must be 4 digits, range 1900–2199
- Response is array → each holiday becomes an n8n item
- BrasilAPI URL: `/api/feriados/v1/{year}`
- Nager.Date URL: `https://date.nager.at/api/v3/PublicHolidays/{year}/BR`

```typescript
// feriadosQuery returns multiple items:
const holidays = Array.isArray(result.data) ? result.data : [];
return holidays.map((raw: unknown) => {
	const normalized = normalizeFeriado(raw, result.provider);
	return {
		json: { ...normalized, _meta: meta, ...(includeRaw && { _raw: raw as IDataObject }) } as IDataObject,
		pairedItem: { item: itemIndex },
	};
});
```

- [ ] **Step 6: Write execute tests + register in router**

- [ ] **Step 7: Build + lint + full test suite**

- [ ] **Step 8: Commit**

```bash
git commit -m "feat: add Feriados resource with holiday query

Two providers: BrasilAPI (primary) → Nager.Date (fallback).
Returns 1 item per holiday. Validates year range 1900-2199.

Closes #35"
```

---

### Task 10: Additional CNPJ Providers (#36)

**Files:**
- Modify: `nodes/BrasilHub/resources/cnpj/cnpj.normalize.ts`
- Modify: `nodes/BrasilHub/resources/cnpj/cnpj.execute.ts`
- Modify: `__tests__/cnpj.normalize.spec.ts`

- [ ] **Step 1: Write failing tests for 4 new normalizers**

Add to `__tests__/cnpj.normalize.spec.ts`:
- `normalizeMinhaReceita` — flat, snake_case, closest to BrasilAPI
- `normalizeOpenCnpjOrg` — flat, snake_case, `capital_social` string → number
- `normalizeOpenCnpjCom` — wrapped `{success, data}`, camelCase
- `normalizeCnpja` — deeply nested (`company.name`, `address.street`)

Use realistic fixtures from the spec field mapping tables.

- [ ] **Step 2: Implement 4 normalizer functions**

Add to `cnpj.normalize.ts`:

Key challenges per provider:
- **MinhaReceita:** `descricao_situacao_cadastral` → `situacao`, `cnae_fiscal` → `atividade_principal.codigo`
- **OpenCNPJ.org:** `capital_social` is string "0,00" — parse with `Number.parseFloat(str.replace(',', '.'))`
- **OpenCNPJ.com:** Unwrap `data.data` (response is `{success, data}`), camelCase fields
- **CNPJA:** Navigate `company.name`, `company.members[].person.name`, `address.*`

Add all 4 to the normalizers dispatch table.

- [ ] **Step 3: Add 4 providers to CNPJ_PROVIDERS array**

In `cnpj.execute.ts`, append after the existing 3:

```typescript
const CNPJ_PROVIDERS: IProvider[] = [
	{ name: 'brasilapi', url: 'https://brasilapi.com.br/api/cnpj/v1/' },
	{ name: 'cnpjws', url: 'https://publica.cnpj.ws/cnpj/' },
	{ name: 'receitaws', url: 'https://receitaws.com.br/v1/cnpj/' },
	{ name: 'minhareceita', url: 'https://minhareceita.org/' },
	{ name: 'opencnpjorg', url: 'https://api.opencnpj.org/' },
	{ name: 'opencnpjcom', url: 'https://kitana.opencnpj.com/cnpj/' },
	{ name: 'cnpja', url: 'https://open.cnpja.com/office/' },
];
```

- [ ] **Step 4: Run tests — verify they pass**

Run: `npx jest __tests__/cnpj`
Expected: All old + new tests PASS.

- [ ] **Step 5: Commit**

```bash
git commit -m "feat: add 4 CNPJ providers (MinhaReceita, OpenCNPJ.org, OpenCNPJ.com, CNPJA)

Total: 7 providers — more than any competitor.
Fallback: BrasilAPI → CNPJ.ws → ReceitaWS → MinhaReceita → OpenCNPJ.org → OpenCNPJ.com → CNPJA

Closes #36"
```

---

### Task 11: Additional CEP Provider — ApiCEP (#37)

**Files:**
- Modify: `nodes/BrasilHub/resources/cep/cep.normalize.ts`
- Modify: `nodes/BrasilHub/resources/cep/cep.execute.ts`
- Modify: `__tests__/cep.normalize.spec.ts`

- [ ] **Step 1: Write failing test for ApiCEP normalizer**

Add to `__tests__/cep.normalize.spec.ts`:

```typescript
const apiCepResponse = {
	status: 200,
	ok: true,
	code: '01001-000',
	state: 'SP',
	city: 'São Paulo',
	district: 'Sé',
	address: 'Praça da Sé',
	statusText: 'ok',
};

it('should normalize ApiCEP response', () => {
	const result = normalizeCep(apiCepResponse, 'apicep');
	expect(result.cep).toBe('01001000'); // hyphen stripped
	expect(result.logradouro).toBe('Praça da Sé');
	expect(result.cidade).toBe('São Paulo');
	expect(result.uf).toBe('SP');
	expect(result.bairro).toBe('Sé');
	expect(result.complemento).toBe(''); // not in response
	expect(result.ibge).toBe(''); // not in response
});
```

- [ ] **Step 2: Implement normalizeApiCep**

```typescript
function normalizeApiCep(data: Record<string, unknown>): ICepResult {
	return {
		cep: stripNonDigits(safeStr(data.code)),
		logradouro: safeStr(data.address),
		complemento: '',
		bairro: safeStr(data.district),
		cidade: safeStr(data.city),
		uf: safeStr(data.state),
		ibge: '',
		ddd: '',
	};
}
```

Add `apicep: normalizeApiCep` to the dispatch table.

- [ ] **Step 3: Add ApiCEP to providers + fix buildProviders**

In `cep.execute.ts`:

```typescript
const CEP_PROVIDERS: IProvider[] = [
	{ name: 'brasilapi', url: 'https://brasilapi.com.br/api/cep/v2/' },
	{ name: 'viacep', url: 'https://viacep.com.br/ws/' },
	{ name: 'opencep', url: 'https://opencep.com/v1/' },
	{ name: 'apicep', url: 'https://cdn.apicep.com/file/apicep/' },
];

function buildProviders(cep: string): IProvider[] {
	return CEP_PROVIDERS.map((p) => {
		if (p.name === 'viacep') return { name: p.name, url: `${p.url}${cep}/json` };
		if (p.name === 'apicep') {
			const formatted = `${cep.slice(0, 5)}-${cep.slice(5)}`;
			return { name: p.name, url: `${p.url}${formatted}.json` };
		}
		return { name: p.name, url: `${p.url}${cep}` };
	});
}
```

- [ ] **Step 4: Run tests — verify they pass**

Run: `npx jest __tests__/cep`
Expected: All old + new tests PASS.

- [ ] **Step 5: Commit**

```bash
git commit -m "feat: add ApiCEP as 4th CEP provider

Requires hyphen in CEP input (handled by buildProviders).
Maps English field names to our Portuguese schema.

Closes #37"
```

---

## Chunk 5: Simplify + Error Messages + Polish + Release

### Task 12: CNPJ Simplify Parameter (#38)

**Files:**
- Modify: `nodes/BrasilHub/resources/cnpj/cnpj.description.ts`
- Modify: `nodes/BrasilHub/resources/cnpj/cnpj.execute.ts`
- Modify: `__tests__/cnpj.execute.spec.ts`

- [ ] **Step 1: Add Simplify checkbox to description**

After `includeRaw`, add:

```typescript
{
	displayName: 'Simplify',
	name: 'simplify',
	type: 'boolean',
	displayOptions: { show: showForCnpjQuery },
	default: true,
	description: 'Whether to return a simplified output with only key fields',
},
```

- [ ] **Step 2: Implement simplify logic in cnpjQuery**

After normalization, extract 8 fields:

```typescript
const simplify = context.getNodeParameter('simplify', itemIndex, true) as boolean;

const output = simplify ? {
	cnpj: normalized.cnpj,
	razao_social: normalized.razao_social,
	nome_fantasia: normalized.nome_fantasia,
	situacao: normalized.situacao,
	data_abertura: normalized.data_abertura,
	uf: normalized.endereco.uf,
	municipio: normalized.endereco.municipio,
	cep: normalized.endereco.cep,
} : normalized;
```

- [ ] **Step 3: Write tests for both modes**

```typescript
it('should return simplified output when simplify is true', async () => {
	const ctx = createMockContext({ simplify: true });
	const results = await cnpjQuery(ctx, 0);
	const keys = Object.keys(results[0].json).filter(k => !k.startsWith('_'));
	expect(keys).toEqual(['cnpj', 'razao_social', 'nome_fantasia', 'situacao', 'data_abertura', 'uf', 'municipio', 'cep']);
});

it('should return full output when simplify is false', async () => {
	const ctx = createMockContext({ simplify: false });
	const results = await cnpjQuery(ctx, 0);
	expect(results[0].json).toHaveProperty('endereco');
	expect(results[0].json).toHaveProperty('socios');
});
```

- [ ] **Step 4: Run tests + build + lint**

- [ ] **Step 5: Commit**

```bash
git commit -m "feat: add Simplify parameter for CNPJ Query

When enabled (default), returns 8 key fields flat.
Full output available by disabling Simplify.

Closes #38"
```

---

### Task 13: Enhanced Error Messages (#39)

**Files:**
- Modify: `nodes/BrasilHub/shared/fallback.ts`
- Modify: `__tests__/fallback.spec.ts`

- [ ] **Step 1: Capture HTTP status from errors**

In `fallback.ts`, enhance the catch block to extract HTTP status:

```typescript
catch (error) {
	let message: string;
	if (error instanceof Error) {
		const statusCode = (error as Record<string, unknown>).statusCode
			?? (error as Record<string, unknown>).httpStatusCode;
		message = statusCode
			? `${provider.name} (${statusCode})`
			: `${provider.name}: ${error.message}`;
	} else {
		message = `${provider.name}: ${String(error)}`;
	}
	errors.push(message);
}
```

- [ ] **Step 2: Update error message format**

```typescript
throw new Error(
	`No provider could fulfill the request. Attempted: ${errors.join(', ')}`,
);
```

- [ ] **Step 3: Update tests**

- [ ] **Step 4: Commit**

```bash
git commit -m "feat: enhanced error messages with provider context

Includes HTTP status codes when available.
Format: 'Attempted: brasilapi (500), cnpjws (timeout), receitaws (429)'

Closes #39"
```

---

### Task 14: Integration Tests Update

**Files:**
- Modify: `__tests__/BrasilHub.execute.spec.ts`

- [ ] **Step 1: Add integration tests for all new resources**

Add test cases to `BrasilHub.execute.spec.ts` for:
- `banks/query` dispatch
- `banks/list` dispatch
- `ddd/query` dispatch
- `fipe/brands` dispatch
- `feriados/query` dispatch
- `cpf/validate` dispatch (if not already added in Task 3)

Update `createExecuteContext` to support new params (`bankCode`, `ddd`, `vehicleType`, `brandCode`, `modelCode`, `yearCode`, `year`, `cpf`).

- [ ] **Step 2: Run full test suite**

Run: `npx jest --coverage`
Expected: All tests pass, coverage ≥ 90%.

- [ ] **Step 3: Commit**

```bash
git commit -m "test: add integration tests for all v0.2.0 resources"
```

---

### Task 15: Package Metadata Update (#41)

**Files:**
- Modify: `package.json`
- Modify: `nodes/BrasilHub/BrasilHub.node.ts` (description)
- Modify: `nodes/BrasilHub/BrasilHub.node.json` (codex)
- Modify: `README.md`
- Modify: `CHANGELOG.md`

- [ ] **Step 1: Update package.json**

Add keywords: `"cpf"`, `"banks"`, `"ddd"`, `"fipe"`, `"feriados"`, `"holidays"`

Update description:
```json
"description": "n8n community node for querying Brazilian public data (CNPJ, CEP, CPF, Banks, DDD, FIPE, Feriados) with multi-provider fallback"
```

- [ ] **Step 2: Update node description**

In `BrasilHub.node.ts`:
```typescript
description: 'Query Brazilian public data (CNPJ, CEP, CPF, Banks, DDD, FIPE, Feriados) with multi-provider fallback',
```

- [ ] **Step 3: Update README.md**

Update features list, provider count table, operations list, example outputs.

- [ ] **Step 4: Update CHANGELOG.md**

Add `[0.2.0]` section with all Added/Changed entries.

- [ ] **Step 5: Build + lint + tests**

- [ ] **Step 6: Commit**

```bash
git commit -m "docs: update metadata and documentation for v0.2.0

Closes #41"
```

---

### Task 16: Release v0.2.0 (#42)

Follow the pre-release checklist from CLAUDE.md:

- [ ] **Step 1: Fase 1 — Compliance & Security**
  - n8n Node Compliance (17 checks)
  - Security Review
  - Zero Critical/High findings

- [ ] **Step 2: Fase 2 — Quality**
  - Coverage ≥ 90% branches
  - Code review (`/simplify`)
  - JSDoc 100% exported functions

- [ ] **Step 3: Fase 3 — Build & CI**
  - `npx n8n-node build` clean
  - `npx n8n-node lint` clean
  - `npx jest --coverage` green
  - `npm audit --audit-level=critical` clean
  - Push + CI green

- [ ] **Step 4: Fase 4 — Release**
  - Update CHANGELOG.md `[Unreleased]` → `[0.2.0] - YYYY-MM-DD`
  - `npm version 0.2.0`
  - `git tag -a v0.2.0 -m "Release v0.2.0"`
  - `git push && git push --tags`
  - `gh release create v0.2.0 --title "v0.2.0" --notes-file /tmp/release-notes.md`

- [ ] **Step 5: Fase 5 — Post-Release**
  - CI release workflow green
  - `npx @n8n/scan-community-package n8n-nodes-brasil-hub@0.2.0` passes
  - `npm view n8n-nodes-brasil-hub version` shows 0.2.0
  - Creator Portal resubmission

```bash
git commit -m "chore: release v0.2.0

Closes #42"
```

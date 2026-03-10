# n8n-nodes-brasil-hub Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a community n8n node that queries Brazilian public data (CNPJ and CEP) with multi-provider fallback, following all official n8n standards.

**Architecture:** Single node "Brasil Hub" with resource/operation routing (dictionary map pattern). Each resource has its own description, execute handler, and normalizer. Shared fallback and validation logic. BrasilAPI as primary provider with 1-2 direct fallbacks per resource.

**Tech Stack:** TypeScript, n8n-workflow, @n8n/node-cli (build/lint/dev), Jest + ts-jest (tests), ESLint via @n8n/node-cli/eslint.

**Spec:** `docs/superpowers/specs/2026-03-10-n8n-nodes-brasil-hub-design.md`

---

## File Map

| File | Responsibility |
|------|---------------|
| `package.json` | Package metadata, scripts, dependencies, n8n registration |
| `tsconfig.json` | TypeScript strict config matching starter template |
| `eslint.config.mjs` | ESLint via @n8n/node-cli config |
| `jest.config.js` | Jest + ts-jest config |
| `.gitignore` | Git ignore rules (node_modules, dist, etc.) |
| `index.js` | Empty entry point (npm requirement) |
| `nodes/BrasilHub/BrasilHub.node.ts` | Node class, description, resource/operation router |
| `nodes/BrasilHub/BrasilHub.node.json` | Codex metadata |
| `nodes/BrasilHub/brasilHub.svg` | Node icon |
| `nodes/BrasilHub/types.ts` | Output interfaces: ICnpjResult, ICepResult, IMeta, IValidationResult |
| `nodes/BrasilHub/shared/validators.ts` | CNPJ checksum, CEP format validation |
| `nodes/BrasilHub/shared/fallback.ts` | Generic multi-provider fallback with delay |
| `nodes/BrasilHub/resources/cnpj/cnpj.description.ts` | CNPJ resource INodeProperties[] |
| `nodes/BrasilHub/resources/cnpj/cnpj.execute.ts` | CNPJ query + validate handlers |
| `nodes/BrasilHub/resources/cnpj/cnpj.normalize.ts` | Normalize BrasilAPI/CNPJ.ws/ReceitaWS responses |
| `nodes/BrasilHub/resources/cep/cep.description.ts` | CEP resource INodeProperties[] |
| `nodes/BrasilHub/resources/cep/cep.execute.ts` | CEP query + validate handlers |
| `nodes/BrasilHub/resources/cep/cep.normalize.ts` | Normalize BrasilAPI/ViaCEP/OpenCEP responses |
| `__tests__/validators.spec.ts` | CNPJ checksum + CEP format tests |
| `__tests__/cnpj.normalize.spec.ts` | CNPJ normalizer tests per provider |
| `__tests__/cep.normalize.spec.ts` | CEP normalizer tests per provider |
| `__tests__/fallback.spec.ts` | Fallback logic tests |
| `__tests__/cnpj.execute.spec.ts` | CNPJ execute handler tests (mocked context) |
| `__tests__/cep.execute.spec.ts` | CEP execute handler tests (mocked context) |
| `__tests__/BrasilHub.node.spec.ts` | Node router + continueOnFail tests |

---

## Chunk 1: Project Scaffold and Foundation

### Task 1: Initialize Project

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `eslint.config.mjs`
- Create: `index.js`
- Create: `.gitignore`

- [ ] **Step 1: Init git in existing project directory**

```bash
cd /Users/luismattos/Documents/Workspaces/luisbarcia/n8n-nodes-brasil-hub
git init
```

- [ ] **Step 2: Create package.json**

```json
{
  "name": "n8n-nodes-brasil-hub",
  "version": "0.1.0",
  "description": "n8n community node for querying Brazilian public data (CNPJ, CEP) with multi-provider fallback",
  "license": "MIT",
  "homepage": "https://github.com/luisbarcia/n8n-nodes-brasil-hub",
  "main": "index.js",
  "keywords": [
    "n8n-community-node-package"
  ],
  "author": {
    "name": "Luis Barcia"
  },
  "repository": {
    "type": "git",
    "url": "https://github.com/luisbarcia/n8n-nodes-brasil-hub.git"
  },
  "scripts": {
    "build": "n8n-node build",
    "build:watch": "tsc --watch",
    "dev": "n8n-node dev",
    "lint": "n8n-node lint",
    "lint:fix": "n8n-node lint --fix",
    "release": "n8n-node release",
    "prepublishOnly": "n8n-node prerelease",
    "test": "jest",
    "test:watch": "jest --watch"
  },
  "files": [
    "dist"
  ],
  "n8n": {
    "n8nNodesApiVersion": 1,
    "strict": true,
    "nodes": [
      "dist/nodes/BrasilHub/BrasilHub.node.js"
    ]
  },
  "devDependencies": {
    "@n8n/node-cli": "*",
    "@types/jest": "^29.5.0",
    "eslint": "^9.0.0",
    "jest": "^29.7.0",
    "ts-jest": "^29.1.0",
    "typescript": "^5.9.0"
  },
  "peerDependencies": {
    "n8n-workflow": "*"
  }
}
```

- [ ] **Step 3: Create tsconfig.json**

Copy exactly from the starter template:

```json
{
  "compilerOptions": {
    "strict": true,
    "module": "commonjs",
    "moduleResolution": "node",
    "target": "es2019",
    "lib": ["es2019", "es2020", "es2022.error"],
    "removeComments": true,
    "useUnknownInCatchVariables": false,
    "forceConsistentCasingInFileNames": true,
    "noImplicitAny": true,
    "noImplicitReturns": true,
    "noUnusedLocals": true,
    "strictNullChecks": true,
    "preserveConstEnums": true,
    "esModuleInterop": true,
    "resolveJsonModule": true,
    "incremental": true,
    "declaration": true,
    "sourceMap": true,
    "skipLibCheck": true,
    "outDir": "./dist/"
  },
  "include": ["nodes/**/*", "nodes/**/*.json", "package.json"]
}
```

- [ ] **Step 4: Create eslint.config.mjs**

```javascript
import { config } from '@n8n/node-cli/eslint';

export default config;
```

- [ ] **Step 5: Create index.js**

```javascript
// n8n community node entry point
```

- [ ] **Step 6: Create .gitignore**

```
node_modules/
dist/
*.js.map
.DS_Store
*.tsbuildinfo
```

- [ ] **Step 7: Create jest.config.js**

```javascript
/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/__tests__'],
  testMatch: ['**/*.spec.ts'],
};
```

- [ ] **Step 8: Install dependencies**

```bash
cd /Users/luismattos/Documents/Workspaces/luisbarcia/n8n-nodes-brasil-hub
npm install
```

- [ ] **Step 9: Commit**

```bash
git add package.json tsconfig.json eslint.config.mjs index.js .gitignore jest.config.js package-lock.json
git commit -m "feat: scaffold n8n-nodes-brasil-hub project"
```

---

### Task 2: Type Definitions

**Files:**
- Create: `nodes/BrasilHub/types.ts`

- [ ] **Step 1: Create types.ts with all output interfaces**

```typescript
export interface ICnpjResult {
  cnpj: string;
  razao_social: string;
  nome_fantasia: string;
  situacao: string;
  data_abertura: string;
  porte: string;
  natureza_juridica: string;
  capital_social: number;
  atividade_principal: {
    codigo: string;
    descricao: string;
  };
  endereco: {
    logradouro: string;
    numero: string;
    complemento: string;
    bairro: string;
    cep: string;
    municipio: string;
    uf: string;
  };
  contato: {
    telefone: string;
    email: string;
  };
  socios: Array<{
    nome: string;
    cpf_cnpj: string;
    qualificacao: string;
    data_entrada: string;
  }>;
  _meta?: IMeta;
  _raw?: unknown;
}

export interface ICepResult {
  cep: string;
  logradouro: string;
  complemento: string;
  bairro: string;
  cidade: string;
  uf: string;
  ibge: string;
  ddd: string;
  _meta?: IMeta;
  _raw?: unknown;
}

export interface IValidationResult {
  valid: boolean;
  formatted: string;
  input: string;
}

export interface IMeta {
  provider: string;
  query: string;
  queried_at: string;
  strategy: 'fallback' | 'direct';
  errors?: string[];
}

export interface IProvider {
  name: string;
  url: string;
}

export interface IFallbackResult {
  data: unknown;
  provider: string;
  errors: string[];
}
```

- [ ] **Step 2: Commit**

```bash
git add nodes/BrasilHub/types.ts
git commit -m "feat: add type definitions for CNPJ, CEP, meta, and fallback"
```

---

### Task 3: Validators (TDD)

**Files:**
- Create: `nodes/BrasilHub/shared/validators.ts`
- Create: `__tests__/validators.spec.ts`

- [ ] **Step 1: Write failing tests for CNPJ validation**

```typescript
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

  it('should validate known real CNPJs', () => {
    // Banco do Brasil
    expect(validateCnpj('00000000000191').valid).toBe(true);
    // Petrobras
    expect(validateCnpj('33000167000101').valid).toBe(true);
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
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd /Users/luismattos/Documents/Workspaces/luisbarcia/n8n-nodes-brasil-hub
npx jest __tests__/validators.spec.ts --no-cache
```

Expected: FAIL — module not found

- [ ] **Step 3: Implement validators**

```typescript
import type { IValidationResult } from '../types';

function stripNonDigits(value: string): string {
  return value.replace(/\D/g, '');
}

function formatCnpj(digits: string): string {
  return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12, 14)}`;
}

function formatCep(digits: string): string {
  return `${digits.slice(0, 5)}-${digits.slice(5, 8)}`;
}

export function validateCnpj(cnpj: string): IValidationResult {
  const input = cnpj;
  const digits = stripNonDigits(cnpj);

  if (digits.length !== 14) {
    return { valid: false, formatted: '', input };
  }

  // Reject all-same-digit CNPJs
  if (/^(\d)\1{13}$/.test(digits)) {
    return { valid: false, formatted: '', input };
  }

  // Checksum validation (Receita Federal algorithm)
  const weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];

  let sum = 0;
  for (let i = 0; i < 12; i++) {
    sum += parseInt(digits[i], 10) * weights1[i];
  }
  let remainder = sum % 11;
  const check1 = remainder < 2 ? 0 : 11 - remainder;

  if (parseInt(digits[12], 10) !== check1) {
    return { valid: false, formatted: '', input };
  }

  sum = 0;
  for (let i = 0; i < 13; i++) {
    sum += parseInt(digits[i], 10) * weights2[i];
  }
  remainder = sum % 11;
  const check2 = remainder < 2 ? 0 : 11 - remainder;

  if (parseInt(digits[13], 10) !== check2) {
    return { valid: false, formatted: '', input };
  }

  return { valid: true, formatted: formatCnpj(digits), input };
}

export function validateCep(cep: string): IValidationResult {
  const input = cep;
  const digits = stripNonDigits(cep);

  if (digits.length !== 8) {
    return { valid: false, formatted: '', input };
  }

  if (/^0{8}$/.test(digits)) {
    return { valid: false, formatted: '', input };
  }

  return { valid: true, formatted: formatCep(digits), input };
}

export function sanitizeCnpj(cnpj: string): string {
  return stripNonDigits(cnpj);
}

export function sanitizeCep(cep: string): string {
  return stripNonDigits(cep);
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx jest __tests__/validators.spec.ts --no-cache
```

Expected: All tests PASS

- [ ] **Step 5: Commit**

```bash
git add nodes/BrasilHub/shared/validators.ts __tests__/validators.spec.ts
git commit -m "feat: add CNPJ checksum and CEP format validators with tests"
```

---

### Task 4: Fallback Logic (TDD)

**Files:**
- Create: `nodes/BrasilHub/shared/fallback.ts`
- Create: `__tests__/fallback.spec.ts`

- [ ] **Step 1: Write failing tests for fallback**

```typescript
import { queryWithFallback } from '../nodes/BrasilHub/shared/fallback';
import type { IProvider } from '../nodes/BrasilHub/types';

// Use fake timers to avoid 1s real delay between retries
jest.useFakeTimers();

// Mock IExecuteFunctions
function createMockContext(responses: Array<{ success: boolean; data?: unknown; error?: string }>) {
  let callIndex = 0;
  return {
    helpers: {
      httpRequest: jest.fn().mockImplementation(async () => {
        const response = responses[callIndex++];
        if (!response || !response.success) {
          throw new Error(response?.error ?? 'Request failed');
        }
        return response.data;
      }),
    },
  } as unknown as Parameters<typeof queryWithFallback>[0];
}

const providers: IProvider[] = [
  { name: 'provider1', url: 'https://api1.example.com/123' },
  { name: 'provider2', url: 'https://api2.example.com/123' },
  { name: 'provider3', url: 'https://api3.example.com/123' },
];

// Helper: run queryWithFallback while advancing fake timers
async function runWithTimers<T>(promise: Promise<T>): Promise<T> {
  const result = promise;
  // Advance timers repeatedly to resolve all delays
  for (let i = 0; i < 5; i++) {
    jest.advanceTimersByTime(1100);
    await Promise.resolve();
  }
  return result;
}

afterAll(() => {
  jest.useRealTimers();
});

describe('queryWithFallback', () => {
  it('should return data from the first provider on success', async () => {
    const ctx = createMockContext([{ success: true, data: { name: 'Test' } }]);
    const result = await runWithTimers(queryWithFallback(ctx, providers, 0));

    expect(result.data).toEqual({ name: 'Test' });
    expect(result.provider).toBe('provider1');
    expect(result.errors).toHaveLength(0);
    expect(ctx.helpers.httpRequest).toHaveBeenCalledTimes(1);
  });

  it('should fallback to second provider when first fails', async () => {
    const ctx = createMockContext([
      { success: false, error: 'Timeout' },
      { success: true, data: { name: 'Fallback' } },
    ]);
    const result = await runWithTimers(queryWithFallback(ctx, providers, 0));

    expect(result.data).toEqual({ name: 'Fallback' });
    expect(result.provider).toBe('provider2');
    expect(result.errors).toEqual(['provider1: Timeout']);
    expect(ctx.helpers.httpRequest).toHaveBeenCalledTimes(2);
  });

  it('should fallback to third provider when first two fail', async () => {
    const ctx = createMockContext([
      { success: false, error: 'Error 1' },
      { success: false, error: 'Error 2' },
      { success: true, data: { name: 'Third' } },
    ]);
    const result = await runWithTimers(queryWithFallback(ctx, providers, 0));

    expect(result.data).toEqual({ name: 'Third' });
    expect(result.provider).toBe('provider3');
    expect(result.errors).toHaveLength(2);
  });

  it('should throw when all providers fail', async () => {
    const ctx = createMockContext([
      { success: false, error: 'E1' },
      { success: false, error: 'E2' },
      { success: false, error: 'E3' },
    ]);

    await expect(runWithTimers(queryWithFallback(ctx, providers, 0))).rejects.toThrow(
      'All providers failed',
    );
  });

  it('should collect all error messages from failed providers', async () => {
    const ctx = createMockContext([
      { success: false, error: 'Timeout' },
      { success: false, error: '404 Not Found' },
      { success: true, data: {} },
    ]);
    const result = await runWithTimers(queryWithFallback(ctx, providers, 0));

    expect(result.errors).toEqual([
      'provider1: Timeout',
      'provider2: 404 Not Found',
    ]);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx jest __tests__/fallback.spec.ts --no-cache
```

Expected: FAIL — module not found

- [ ] **Step 3: Implement fallback logic**

```typescript
import type { IExecuteFunctions } from 'n8n-workflow';
import type { IProvider, IFallbackResult } from '../types';

const DELAY_BETWEEN_RETRIES_MS = 1000;
const REQUEST_TIMEOUT_MS = 10000;

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function queryWithFallback(
  context: IExecuteFunctions,
  providers: IProvider[],
  _itemIndex: number,
): Promise<IFallbackResult> {
  const errors: string[] = [];

  for (let i = 0; i < providers.length; i++) {
    const provider = providers[i];

    // Delay between retries (not before first request)
    if (i > 0) {
      await delay(DELAY_BETWEEN_RETRIES_MS);
    }

    try {
      const data = await context.helpers.httpRequest({
        method: 'GET',
        url: provider.url,
        headers: {
          Accept: 'application/json',
          'User-Agent': 'n8n-brasil-hub-node/1.0',
        },
        timeout: REQUEST_TIMEOUT_MS,
      });

      return { data, provider: provider.name, errors };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      errors.push(`${provider.name}: ${message}`);
    }
  }

  throw new Error(`All providers failed: ${errors.join('; ')}`);
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx jest __tests__/fallback.spec.ts --no-cache
```

Expected: All tests PASS

- [ ] **Step 5: Commit**

```bash
git add nodes/BrasilHub/shared/fallback.ts __tests__/fallback.spec.ts
git commit -m "feat: add generic multi-provider fallback logic with tests"
```

---

## Chunk 2: CNPJ Resource

### Task 5: CNPJ Normalizer (TDD)

**Files:**
- Create: `nodes/BrasilHub/resources/cnpj/cnpj.normalize.ts`
- Create: `__tests__/cnpj.normalize.spec.ts`

- [ ] **Step 1: Write failing tests with real API response fixtures**

```typescript
import { normalizeCnpj } from '../nodes/BrasilHub/resources/cnpj/cnpj.normalize';

// Fixture: BrasilAPI response
const brasilApiResponse = {
  cnpj: '00000000000191',
  razao_social: 'BANCO DO BRASIL SA',
  nome_fantasia: 'DIRECAO GERAL',
  situacao_cadastral: 2,
  descricao_situacao_cadastral: 'ATIVA',
  data_inicio_atividade: '1966-08-01',
  porte: 5,
  descricao_porte: 'DEMAIS',
  natureza_juridica: 'Sociedade de Economia Mista',
  capital_social: 120000000000,
  cnae_fiscal: 6422100,
  cnae_fiscal_descricao: 'Bancos múltiplos, com carteira comercial',
  descricao_tipo_de_logradouro: 'SAUN',
  logradouro: 'QUADRA 5 LOTE B',
  numero: 'S/N',
  complemento: 'ANDAR 1 A 16 SALA 101 A 1601 ANDAR 1 A 16 SALA 101 A 1601 ED BANCO DO BRASIL',
  bairro: 'ASA NORTE',
  cep: '70040912',
  uf: 'DF',
  municipio: 'BRASILIA',
  ddd_telefone_1: '6134934000',
  ddd_telefone_2: '',
  ddd_fax: '',
  email: '',
  qsa: [
    {
      nome_socio: 'TARCIANA PAULA GOMES MEDEIROS',
      cnpj_cpf_do_socio: '***456789**',
      qualificacao_socio: 'Presidente',
      data_entrada_sociedade: '2023-01-16',
    },
  ],
  cnaes_secundarios: [{ codigo: 6423900, descricao: 'Caixas econômicas' }],
  opcao_pelo_simples: false,
  data_opcao_pelo_simples: null,
  data_exclusao_do_simples: null,
};

// Fixture: CNPJ.ws response
const cnpjWsResponse = {
  razao_social: 'BANCO DO BRASIL SA',
  estabelecimento: {
    cnpj: '00000000000191',
    nome_fantasia: 'DIRECAO GERAL',
    situacao_cadastral: 'Ativa',
    data_inicio_atividade: '1966-08-01',
    atividade_principal: { id: '64.22-1-00', descricao: 'Bancos múltiplos, com carteira comercial' },
    tipo_logradouro: 'SAUN',
    logradouro: 'QUADRA 5 LOTE B',
    numero: 'S/N',
    complemento: 'ED BANCO DO BRASIL',
    bairro: 'ASA NORTE',
    cep: '70040912',
    cidade: { nome: 'BRASILIA' },
    estado: { sigla: 'DF' },
    ddd1: '61',
    telefone1: '34934000',
    ddd2: null,
    telefone2: null,
    email: null,
    atividades_secundarias: [],
  },
  porte: { descricao: 'DEMAIS' },
  natureza_juridica: { descricao: 'Sociedade de Economia Mista' },
  capital_social: 120000000000,
  socios: [
    {
      nome: 'TARCIANA PAULA GOMES MEDEIROS',
      cpf_cnpj_socio: '***456789**',
      qualificacao_socio: { descricao: 'Presidente' },
      data_entrada: '2023-01-16',
    },
  ],
  simples: { optante: false, data_opcao: null, data_exclusao: null },
};

// Fixture: ReceitaWS response
const receitaWsResponse = {
  cnpj: '00.000.000/0001-91',
  nome: 'BANCO DO BRASIL SA',
  fantasia: 'DIRECAO GERAL',
  situacao: 'ATIVA',
  abertura: '01/08/1966',
  porte: 'DEMAIS',
  natureza_juridica: '2038 - Sociedade de Economia Mista',
  capital_social: '120000000000.00',
  atividade_principal: [{ code: '64.22-1-00', text: 'Bancos múltiplos, com carteira comercial' }],
  logradouro: 'SAUN QUADRA 5 LOTE B',
  numero: 'S/N',
  complemento: 'ED BANCO DO BRASIL',
  bairro: 'ASA NORTE',
  cep: '70.040-912',
  municipio: 'BRASILIA',
  uf: 'DF',
  telefone: '(61) 3493-4000',
  email: '',
  qsa: [
    {
      nome: 'TARCIANA PAULA GOMES MEDEIROS',
      qual: 'Presidente',
    },
  ],
  atividades_secundarias: [{ code: '64.23-9-00', text: 'Caixas econômicas' }],
  status: 'OK',
};

describe('normalizeCnpj', () => {
  it('should normalize BrasilAPI response', () => {
    const result = normalizeCnpj(brasilApiResponse, 'brasilapi');
    expect(result.cnpj).toBe('00000000000191');
    expect(result.razao_social).toBe('BANCO DO BRASIL SA');
    expect(result.nome_fantasia).toBe('DIRECAO GERAL');
    expect(result.situacao).toBe('ATIVA');
    expect(result.capital_social).toBe(120000000000);
    expect(result.atividade_principal.codigo).toBe('6422100');
    expect(result.endereco.uf).toBe('DF');
    expect(result.socios).toHaveLength(1);
    expect(result.socios[0].nome).toBe('TARCIANA PAULA GOMES MEDEIROS');
  });

  it('should normalize CNPJ.ws response', () => {
    const result = normalizeCnpj(cnpjWsResponse, 'cnpjws');
    expect(result.cnpj).toBe('00000000000191');
    expect(result.razao_social).toBe('BANCO DO BRASIL SA');
    expect(result.contato.telefone).toBe('6134934000');
    expect(result.contato.telefone).not.toContain('undefined');
    expect(result.endereco.municipio).toBe('BRASILIA');
  });

  it('should normalize ReceitaWS response', () => {
    const result = normalizeCnpj(receitaWsResponse, 'receitaws');
    expect(result.cnpj).toBe('00000000000191');
    expect(result.razao_social).toBe('BANCO DO BRASIL SA');
    expect(result.atividade_principal.codigo).toBe('64.22-1-00');
    expect(result.contato.telefone).toBe('(61) 3493-4000');
  });

  it('should handle missing optional fields gracefully', () => {
    const minimal = { cnpj: '00000000000191' };
    const result = normalizeCnpj(minimal, 'brasilapi');
    expect(result.cnpj).toBe('00000000000191');
    expect(result.razao_social).toBe('');
    expect(result.socios).toEqual([]);
    expect(result.contato.telefone).toBe('');
  });

  it('should never produce "undefined" strings in phone field', () => {
    const withPartialPhone = {
      ...cnpjWsResponse,
      estabelecimento: {
        ...cnpjWsResponse.estabelecimento,
        ddd1: '11',
        telefone1: undefined,
        ddd2: undefined,
        telefone2: '99998888',
      },
    };
    const result = normalizeCnpj(withPartialPhone, 'cnpjws');
    expect(result.contato.telefone).not.toContain('undefined');
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx jest __tests__/cnpj.normalize.spec.ts --no-cache
```

Expected: FAIL — module not found

- [ ] **Step 3: Implement CNPJ normalizer**

```typescript
import type { ICnpjResult } from '../../types';

function buildPhone(ddd?: string | null, phone?: string | null): string {
  if (ddd && phone) return `${ddd}${phone}`;
  return '';
}

function stripNonDigits(value: string): string {
  return value.replace(/\D/g, '');
}

function normalizeBrasilApi(data: Record<string, unknown>): ICnpjResult {
  const qsa = Array.isArray(data.qsa) ? data.qsa : [];
  return {
    cnpj: String(data.cnpj ?? ''),
    razao_social: String(data.razao_social ?? ''),
    nome_fantasia: String(data.nome_fantasia ?? ''),
    situacao: String(data.descricao_situacao_cadastral ?? ''),
    data_abertura: String(data.data_inicio_atividade ?? ''),
    porte: String(data.descricao_porte ?? ''),
    natureza_juridica: String(data.natureza_juridica ?? ''),
    capital_social: Number(data.capital_social ?? 0),
    atividade_principal: {
      codigo: String(data.cnae_fiscal ?? ''),
      descricao: String(data.cnae_fiscal_descricao ?? ''),
    },
    endereco: {
      logradouro: `${data.descricao_tipo_de_logradouro ?? ''} ${data.logradouro ?? ''}`.trim(),
      numero: String(data.numero ?? ''),
      complemento: String(data.complemento ?? ''),
      bairro: String(data.bairro ?? ''),
      cep: String(data.cep ?? ''),
      municipio: String(data.municipio ?? ''),
      uf: String(data.uf ?? ''),
    },
    contato: {
      telefone: [
        String(data.ddd_telefone_1 ?? ''),
        String(data.ddd_telefone_2 ?? ''),
      ].filter(Boolean).join(' / '),
      email: String(data.email ?? ''),
    },
    socios: qsa.map((s: Record<string, unknown>) => ({
      nome: String(s.nome_socio ?? ''),
      cpf_cnpj: String(s.cnpj_cpf_do_socio ?? ''),
      qualificacao: String(s.qualificacao_socio ?? ''),
      data_entrada: String(s.data_entrada_sociedade ?? ''),
    })),
  };
}

function normalizeCnpjWs(data: Record<string, unknown>): ICnpjResult {
  const est = (data.estabelecimento ?? {}) as Record<string, unknown>;
  const ativPrincipal = (est.atividade_principal ?? {}) as Record<string, unknown>;
  const cidade = (est.cidade ?? {}) as Record<string, unknown>;
  const estado = (est.estado ?? {}) as Record<string, unknown>;
  const porte = (data.porte ?? {}) as Record<string, unknown>;
  const natJuridica = (data.natureza_juridica ?? {}) as Record<string, unknown>;
  const simples = (data.simples ?? {}) as Record<string, unknown>;
  const socios = Array.isArray(data.socios) ? data.socios : [];

  const phones = [
    buildPhone(est.ddd1 as string | undefined, est.telefone1 as string | undefined),
    buildPhone(est.ddd2 as string | undefined, est.telefone2 as string | undefined),
  ].filter(Boolean);

  return {
    cnpj: String(est.cnpj ?? ''),
    razao_social: String(data.razao_social ?? ''),
    nome_fantasia: String(est.nome_fantasia ?? ''),
    situacao: String(est.situacao_cadastral ?? ''),
    data_abertura: String(est.data_inicio_atividade ?? ''),
    porte: String(porte.descricao ?? ''),
    natureza_juridica: String(natJuridica.descricao ?? ''),
    capital_social: Number(data.capital_social ?? 0),
    atividade_principal: {
      codigo: String(ativPrincipal.id ?? ''),
      descricao: String(ativPrincipal.descricao ?? ''),
    },
    endereco: {
      logradouro: `${est.tipo_logradouro ?? ''} ${est.logradouro ?? ''}`.trim(),
      numero: String(est.numero ?? ''),
      complemento: String(est.complemento ?? ''),
      bairro: String(est.bairro ?? ''),
      cep: String(est.cep ?? ''),
      municipio: String(cidade.nome ?? ''),
      uf: String(estado.sigla ?? ''),
    },
    contato: {
      telefone: phones.join(' / '),
      email: String(est.email ?? ''),
    },
    socios: socios.map((s: Record<string, unknown>) => {
      const qual = (s.qualificacao_socio ?? {}) as Record<string, unknown>;
      return {
        nome: String(s.nome ?? ''),
        cpf_cnpj: String(s.cpf_cnpj_socio ?? ''),
        qualificacao: String(qual.descricao ?? ''),
        data_entrada: String(s.data_entrada ?? ''),
      };
    }),
  };
}

function normalizeReceitaWs(data: Record<string, unknown>): ICnpjResult {
  const ativPrincipal = Array.isArray(data.atividade_principal) ? data.atividade_principal[0] ?? {} : {};
  const qsa = Array.isArray(data.qsa) ? data.qsa : [];

  return {
    cnpj: stripNonDigits(String(data.cnpj ?? '')),
    razao_social: String(data.nome ?? ''),
    nome_fantasia: String(data.fantasia ?? ''),
    situacao: String(data.situacao ?? ''),
    data_abertura: String(data.abertura ?? ''),
    porte: String(data.porte ?? ''),
    natureza_juridica: String(data.natureza_juridica ?? ''),
    capital_social: parseFloat(String(data.capital_social ?? '0')),
    atividade_principal: {
      codigo: String((ativPrincipal as Record<string, unknown>).code ?? ''),
      descricao: String((ativPrincipal as Record<string, unknown>).text ?? ''),
    },
    endereco: {
      logradouro: String(data.logradouro ?? ''),
      numero: String(data.numero ?? ''),
      complemento: String(data.complemento ?? ''),
      bairro: String(data.bairro ?? ''),
      cep: stripNonDigits(String(data.cep ?? '')),
      municipio: String(data.municipio ?? ''),
      uf: String(data.uf ?? ''),
    },
    contato: {
      telefone: String(data.telefone ?? ''),
      email: String(data.email ?? ''),
    },
    socios: qsa.map((s: Record<string, unknown>) => ({
      nome: String(s.nome ?? ''),
      cpf_cnpj: '',
      qualificacao: String(s.qual ?? ''),
      data_entrada: '',
    })),
  };
}

const normalizers: Record<string, (data: Record<string, unknown>) => ICnpjResult> = {
  brasilapi: normalizeBrasilApi,
  cnpjws: normalizeCnpjWs,
  receitaws: normalizeReceitaWs,
};

export function normalizeCnpj(data: unknown, provider: string): ICnpjResult {
  const normalizer = normalizers[provider];
  if (!normalizer) {
    throw new Error(`Unknown CNPJ provider: ${provider}`);
  }
  return normalizer(data as Record<string, unknown>);
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx jest __tests__/cnpj.normalize.spec.ts --no-cache
```

Expected: All tests PASS

- [ ] **Step 5: Commit**

```bash
git add nodes/BrasilHub/resources/cnpj/cnpj.normalize.ts __tests__/cnpj.normalize.spec.ts
git commit -m "feat: add CNPJ normalizer for BrasilAPI, CNPJ.ws, ReceitaWS with tests"
```

---

### Task 6: CNPJ Description and Execute Handler

**Files:**
- Create: `nodes/BrasilHub/resources/cnpj/cnpj.description.ts`
- Create: `nodes/BrasilHub/resources/cnpj/cnpj.execute.ts`

- [ ] **Step 1: Create CNPJ description (INodeProperties[])**

```typescript
import type { INodeProperties } from 'n8n-workflow';

const showForCnpj = { resource: ['cnpj'] };
const showForCnpjQuery = { resource: ['cnpj'], operation: ['query'] };

export const cnpjDescription: INodeProperties[] = [
  {
    displayName: 'Operation',
    name: 'operation',
    type: 'options',
    noDataExpression: true,
    displayOptions: { show: showForCnpj },
    options: [
      {
        name: 'Query',
        value: 'query',
        action: 'Query company data by CNPJ',
        description: 'Fetch company data from public APIs by CNPJ number',
      },
      {
        name: 'Validate',
        value: 'validate',
        action: 'Validate a CNPJ number',
        description: 'Check if a CNPJ number is valid using checksum verification',
      },
    ],
    default: 'query',
  },
  {
    displayName: 'CNPJ',
    name: 'cnpj',
    type: 'string',
    required: true,
    displayOptions: { show: showForCnpj },
    default: '',
    placeholder: '11.222.333/0001-81',
    description: 'The CNPJ number to query or validate (with or without formatting)',
  },
  {
    displayName: 'Include Raw Response',
    name: 'includeRaw',
    type: 'boolean',
    displayOptions: { show: showForCnpjQuery },
    default: false,
    description: 'Whether to include the raw API response alongside the normalized data',
  },
];
```

- [ ] **Step 2: Create CNPJ execute handlers**

```typescript
import type { IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';
import type { IProvider, IMeta } from '../../types';
import { validateCnpj, sanitizeCnpj } from '../../shared/validators';
import { queryWithFallback } from '../../shared/fallback';
import { normalizeCnpj } from './cnpj.normalize';

const CNPJ_PROVIDERS: IProvider[] = [
  { name: 'brasilapi', url: 'https://brasilapi.com.br/api/cnpj/v1/' },
  { name: 'cnpjws', url: 'https://publica.cnpj.ws/cnpj/' },
  { name: 'receitaws', url: 'https://receitaws.com.br/v1/cnpj/' },
];

function buildProviders(cnpj: string): IProvider[] {
  return CNPJ_PROVIDERS.map((p) => ({ name: p.name, url: `${p.url}${cnpj}` }));
}

export async function cnpjQuery(
  context: IExecuteFunctions,
  itemIndex: number,
): Promise<INodeExecutionData> {
  const cnpjInput = context.getNodeParameter('cnpj', itemIndex) as string;
  const includeRaw = context.getNodeParameter('includeRaw', itemIndex, false) as boolean;
  const cnpj = sanitizeCnpj(cnpjInput);

  if (cnpj.length !== 14) {
    throw new NodeOperationError(context.getNode(), 'CNPJ must have 14 digits', { itemIndex });
  }

  const providers = buildProviders(cnpj);
  const result = await queryWithFallback(context, providers, itemIndex);

  const normalized = normalizeCnpj(result.data, result.provider);

  const meta: IMeta = {
    provider: result.provider,
    query: cnpj,
    queried_at: new Date().toISOString(),
    strategy: 'fallback',
    ...(result.errors.length > 0 && { errors: result.errors }),
  };

  return {
    json: {
      ...normalized,
      _meta: meta,
      ...(includeRaw && { _raw: result.data }),
    },
    pairedItem: { item: itemIndex },
  };
}

export async function cnpjValidate(
  context: IExecuteFunctions,
  itemIndex: number,
): Promise<INodeExecutionData> {
  const cnpjInput = context.getNodeParameter('cnpj', itemIndex) as string;
  const result = validateCnpj(cnpjInput);

  return {
    json: result,
    pairedItem: { item: itemIndex },
  };
}
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
cd /Users/luismattos/Documents/Workspaces/luisbarcia/n8n-nodes-brasil-hub
npx tsc --noEmit
```

Expected: No errors

- [ ] **Step 4: Write tests for CNPJ execute handlers**

Create `__tests__/cnpj.execute.spec.ts`:

```typescript
import { cnpjQuery, cnpjValidate } from '../nodes/BrasilHub/resources/cnpj/cnpj.execute';

jest.useFakeTimers();

function createMockContext(overrides: Record<string, unknown> = {}) {
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
      httpRequest: jest.fn().mockResolvedValue({
        cnpj: '11222333000181',
        razao_social: 'EMPRESA TESTE',
        nome_fantasia: '',
        descricao_situacao_cadastral: 'ATIVA',
        data_inicio_atividade: '2020-01-01',
        descricao_porte: 'ME',
        natureza_juridica: 'LTDA',
        capital_social: 10000,
        cnae_fiscal: 6201501,
        cnae_fiscal_descricao: 'Desenvolvimento de software',
        logradouro: 'RUA TESTE',
        numero: '100',
        complemento: '',
        bairro: 'CENTRO',
        cep: '01001000',
        municipio: 'SAO PAULO',
        uf: 'SP',
        ddd_telefone_1: '1199999999',
        ddd_telefone_2: '',
        email: '',
        qsa: [],
      }),
    },
  } as unknown as Parameters<typeof cnpjQuery>[0];
}

async function runWithTimers<T>(promise: Promise<T>): Promise<T> {
  const result = promise;
  for (let i = 0; i < 5; i++) {
    jest.advanceTimersByTime(1100);
    await Promise.resolve();
  }
  return result;
}

afterAll(() => jest.useRealTimers());

describe('cnpjQuery', () => {
  it('should return normalized data with _meta', async () => {
    const ctx = createMockContext();
    const result = await runWithTimers(cnpjQuery(ctx, 0));
    expect(result.json).toHaveProperty('cnpj', '11222333000181');
    expect(result.json).toHaveProperty('_meta');
    expect(result.json._meta).toHaveProperty('provider', 'brasilapi');
    expect(result.pairedItem).toEqual({ item: 0 });
  });

  it('should throw on invalid CNPJ length', async () => {
    const ctx = createMockContext({ cnpj: '123' });
    await expect(cnpjQuery(ctx, 0)).rejects.toThrow('CNPJ must have 14 digits');
  });
});

describe('cnpjValidate', () => {
  it('should return validation result', async () => {
    const ctx = createMockContext({ cnpj: '11222333000181' });
    const result = await cnpjValidate(ctx, 0);
    expect(result.json).toEqual({
      valid: true,
      formatted: '11.222.333/0001-81',
      input: '11222333000181',
    });
    expect(result.pairedItem).toEqual({ item: 0 });
  });
});
```

- [ ] **Step 5: Run tests to verify they pass**

```bash
npx jest __tests__/cnpj.execute.spec.ts --no-cache
```

Expected: All tests PASS

- [ ] **Step 6: Commit**

```bash
git add nodes/BrasilHub/resources/cnpj/ __tests__/cnpj.execute.spec.ts
git commit -m "feat: add CNPJ resource description, execute handlers, and tests"
```

---

## Chunk 3: CEP Resource

### Task 7: CEP Normalizer (TDD)

**Files:**
- Create: `nodes/BrasilHub/resources/cep/cep.normalize.ts`
- Create: `__tests__/cep.normalize.spec.ts`

- [ ] **Step 1: Write failing tests with real API response fixtures**

```typescript
import { normalizeCep } from '../nodes/BrasilHub/resources/cep/cep.normalize';

const brasilApiResponse = {
  cep: '01001000',
  state: 'SP',
  city: 'São Paulo',
  neighborhood: 'Sé',
  street: 'Praça da Sé',
  service: 'open-cep',
  location: {
    type: 'Point',
    coordinates: { longitude: '-46.6339', latitude: '-23.5504' },
  },
};

const viaCepResponse = {
  cep: '01001-000',
  logradouro: 'Praça da Sé',
  complemento: 'lado ímpar',
  unidade: '',
  bairro: 'Sé',
  localidade: 'São Paulo',
  uf: 'SP',
  ibge: '3550308',
  gia: '1004',
  ddd: '11',
  siafi: '7107',
};

const openCepResponse = {
  cep: '01001-000',
  logradouro: 'Praça da Sé',
  complemento: 'lado ímpar',
  bairro: 'Sé',
  localidade: 'São Paulo',
  uf: 'SP',
  ibge: '3550308',
  ddd: '11',
};

describe('normalizeCep', () => {
  it('should normalize BrasilAPI response', () => {
    const result = normalizeCep(brasilApiResponse, 'brasilapi');
    expect(result.cep).toBe('01001000');
    expect(result.logradouro).toBe('Praça da Sé');
    expect(result.bairro).toBe('Sé');
    expect(result.cidade).toBe('São Paulo');
    expect(result.uf).toBe('SP');
  });

  it('should normalize ViaCEP response', () => {
    const result = normalizeCep(viaCepResponse, 'viacep');
    expect(result.cep).toBe('01001000');
    expect(result.logradouro).toBe('Praça da Sé');
    expect(result.cidade).toBe('São Paulo');
    expect(result.ibge).toBe('3550308');
    expect(result.ddd).toBe('11');
  });

  it('should normalize OpenCEP response', () => {
    const result = normalizeCep(openCepResponse, 'opencep');
    expect(result.cep).toBe('01001000');
    expect(result.cidade).toBe('São Paulo');
    expect(result.ddd).toBe('11');
  });

  it('should handle missing fields gracefully', () => {
    const result = normalizeCep({ cep: '01001000' }, 'brasilapi');
    expect(result.logradouro).toBe('');
    expect(result.bairro).toBe('');
    expect(result.cidade).toBe('');
  });

  it('should detect ViaCEP error response', () => {
    expect(() => normalizeCep({ erro: true }, 'viacep')).toThrow();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx jest __tests__/cep.normalize.spec.ts --no-cache
```

- [ ] **Step 3: Implement CEP normalizer**

```typescript
import type { ICepResult } from '../../types';

function stripNonDigits(value: string): string {
  return value.replace(/\D/g, '');
}

function normalizeBrasilApi(data: Record<string, unknown>): ICepResult {
  return {
    cep: stripNonDigits(String(data.cep ?? '')),
    logradouro: String(data.street ?? ''),
    complemento: '',
    bairro: String(data.neighborhood ?? ''),
    cidade: String(data.city ?? ''),
    uf: String(data.state ?? ''),
    ibge: '',
    ddd: '',
  };
}

function normalizeViaCep(data: Record<string, unknown>): ICepResult {
  if (data.erro) {
    throw new Error('CEP not found');
  }
  return {
    cep: stripNonDigits(String(data.cep ?? '')),
    logradouro: String(data.logradouro ?? ''),
    complemento: String(data.complemento ?? ''),
    bairro: String(data.bairro ?? ''),
    cidade: String(data.localidade ?? ''),
    uf: String(data.uf ?? ''),
    ibge: String(data.ibge ?? ''),
    ddd: String(data.ddd ?? ''),
  };
}

function normalizeOpenCep(data: Record<string, unknown>): ICepResult {
  return {
    cep: stripNonDigits(String(data.cep ?? '')),
    logradouro: String(data.logradouro ?? ''),
    complemento: String(data.complemento ?? ''),
    bairro: String(data.bairro ?? ''),
    cidade: String(data.localidade ?? ''),
    uf: String(data.uf ?? ''),
    ibge: String(data.ibge ?? ''),
    ddd: String(data.ddd ?? ''),
  };
}

const normalizers: Record<string, (data: Record<string, unknown>) => ICepResult> = {
  brasilapi: normalizeBrasilApi,
  viacep: normalizeViaCep,
  opencep: normalizeOpenCep,
};

export function normalizeCep(data: unknown, provider: string): ICepResult {
  const normalizer = normalizers[provider];
  if (!normalizer) {
    throw new Error(`Unknown CEP provider: ${provider}`);
  }
  return normalizer(data as Record<string, unknown>);
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx jest __tests__/cep.normalize.spec.ts --no-cache
```

- [ ] **Step 5: Commit**

```bash
git add nodes/BrasilHub/resources/cep/cep.normalize.ts __tests__/cep.normalize.spec.ts
git commit -m "feat: add CEP normalizer for BrasilAPI, ViaCEP, OpenCEP with tests"
```

---

### Task 8: CEP Description and Execute Handler

**Files:**
- Create: `nodes/BrasilHub/resources/cep/cep.description.ts`
- Create: `nodes/BrasilHub/resources/cep/cep.execute.ts`

- [ ] **Step 1: Create CEP description**

```typescript
import type { INodeProperties } from 'n8n-workflow';

const showForCep = { resource: ['cep'] };
const showForCepQuery = { resource: ['cep'], operation: ['query'] };

export const cepDescription: INodeProperties[] = [
  {
    displayName: 'Operation',
    name: 'operation',
    type: 'options',
    noDataExpression: true,
    displayOptions: { show: showForCep },
    options: [
      {
        name: 'Query',
        value: 'query',
        action: 'Query address by CEP',
        description: 'Fetch address data from public APIs by CEP number',
      },
      {
        name: 'Validate',
        value: 'validate',
        action: 'Validate a CEP number',
        description: 'Check if a CEP number has valid format',
      },
    ],
    default: 'query',
  },
  {
    displayName: 'CEP',
    name: 'cep',
    type: 'string',
    required: true,
    displayOptions: { show: showForCep },
    default: '',
    placeholder: '01001-000',
    description: 'The CEP number to query or validate (with or without formatting)',
  },
  {
    displayName: 'Include Raw Response',
    name: 'includeRaw',
    type: 'boolean',
    displayOptions: { show: showForCepQuery },
    default: false,
    description: 'Whether to include the raw API response alongside the normalized data',
  },
];
```

- [ ] **Step 2: Create CEP execute handlers**

```typescript
import type { IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';
import type { IProvider, IMeta } from '../../types';
import { validateCep, sanitizeCep } from '../../shared/validators';
import { queryWithFallback } from '../../shared/fallback';
import { normalizeCep } from './cep.normalize';

const CEP_PROVIDERS: IProvider[] = [
  { name: 'brasilapi', url: 'https://brasilapi.com.br/api/cep/v2/' },
  { name: 'viacep', url: 'https://viacep.com.br/ws/' },
  { name: 'opencep', url: 'https://opencep.com/v1/' },
];

function buildProviders(cep: string): IProvider[] {
  return CEP_PROVIDERS.map((p) => {
    const suffix = p.name === 'viacep' ? `${cep}/json` : cep;
    return { name: p.name, url: `${p.url}${suffix}` };
  });
}

export async function cepQuery(
  context: IExecuteFunctions,
  itemIndex: number,
): Promise<INodeExecutionData> {
  const cepInput = context.getNodeParameter('cep', itemIndex) as string;
  const includeRaw = context.getNodeParameter('includeRaw', itemIndex, false) as boolean;
  const cep = sanitizeCep(cepInput);

  if (cep.length !== 8) {
    throw new NodeOperationError(context.getNode(), 'CEP must have 8 digits', { itemIndex });
  }

  const providers = buildProviders(cep);
  const result = await queryWithFallback(context, providers, itemIndex);

  const normalized = normalizeCep(result.data, result.provider);

  const meta: IMeta = {
    provider: result.provider,
    query: cep,
    queried_at: new Date().toISOString(),
    strategy: 'fallback',
    ...(result.errors.length > 0 && { errors: result.errors }),
  };

  return {
    json: {
      ...normalized,
      _meta: meta,
      ...(includeRaw && { _raw: result.data }),
    },
    pairedItem: { item: itemIndex },
  };
}

export async function cepValidate(
  context: IExecuteFunctions,
  itemIndex: number,
): Promise<INodeExecutionData> {
  const cepInput = context.getNodeParameter('cep', itemIndex) as string;
  const result = validateCep(cepInput);

  return {
    json: result,
    pairedItem: { item: itemIndex },
  };
}
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

- [ ] **Step 4: Write tests for CEP execute handlers**

Create `__tests__/cep.execute.spec.ts`:

```typescript
import { cepQuery, cepValidate } from '../nodes/BrasilHub/resources/cep/cep.execute';

jest.useFakeTimers();

function createMockContext(overrides: Record<string, unknown> = {}) {
  const params: Record<string, unknown> = {
    cep: '01001000',
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
        cep: '01001000',
        state: 'SP',
        city: 'São Paulo',
        neighborhood: 'Sé',
        street: 'Praça da Sé',
        service: 'open-cep',
      }),
    },
  } as unknown as Parameters<typeof cepQuery>[0];
}

async function runWithTimers<T>(promise: Promise<T>): Promise<T> {
  const result = promise;
  for (let i = 0; i < 5; i++) {
    jest.advanceTimersByTime(1100);
    await Promise.resolve();
  }
  return result;
}

afterAll(() => jest.useRealTimers());

describe('cepQuery', () => {
  it('should return normalized data with _meta', async () => {
    const ctx = createMockContext();
    const result = await runWithTimers(cepQuery(ctx, 0));
    expect(result.json).toHaveProperty('cep', '01001000');
    expect(result.json).toHaveProperty('_meta');
    expect(result.json._meta).toHaveProperty('provider', 'brasilapi');
    expect(result.pairedItem).toEqual({ item: 0 });
  });

  it('should throw on invalid CEP length', async () => {
    const ctx = createMockContext({ cep: '123' });
    await expect(cepQuery(ctx, 0)).rejects.toThrow('CEP must have 8 digits');
  });
});

describe('cepValidate', () => {
  it('should return validation result', async () => {
    const ctx = createMockContext({ cep: '01001-000' });
    const result = await cepValidate(ctx, 0);
    expect(result.json).toEqual({
      valid: true,
      formatted: '01001-000',
      input: '01001-000',
    });
    expect(result.pairedItem).toEqual({ item: 0 });
  });
});
```

- [ ] **Step 5: Run tests to verify they pass**

```bash
npx jest __tests__/cep.execute.spec.ts --no-cache
```

Expected: All tests PASS

- [ ] **Step 6: Commit**

```bash
git add nodes/BrasilHub/resources/cep/ __tests__/cep.execute.spec.ts
git commit -m "feat: add CEP resource description, execute handlers, and tests"
```

---

## Chunk 4: Node Assembly and Final Polish

### Task 9: Node Main File, Codex, and Icon

**Files:**
- Create: `nodes/BrasilHub/BrasilHub.node.ts`
- Create: `nodes/BrasilHub/BrasilHub.node.json`
- Create: `nodes/BrasilHub/brasilHub.svg`

- [ ] **Step 1: Create BrasilHub.node.ts**

```typescript
import type {
  IExecuteFunctions,
  INodeExecutionData,
  INodeType,
  INodeTypeDescription,
} from 'n8n-workflow';
import { NodeConnectionTypes, NodeOperationError } from 'n8n-workflow';
import { cnpjDescription } from './resources/cnpj/cnpj.description';
import { cnpjQuery, cnpjValidate } from './resources/cnpj/cnpj.execute';
import { cepDescription } from './resources/cep/cep.description';
import { cepQuery, cepValidate } from './resources/cep/cep.execute';

type ExecuteFunction = (
  context: IExecuteFunctions,
  itemIndex: number,
) => Promise<INodeExecutionData>;

const resourceOperations: Record<string, Record<string, ExecuteFunction>> = {
  cnpj: { query: cnpjQuery, validate: cnpjValidate },
  cep: { query: cepQuery, validate: cepValidate },
};

export class BrasilHub implements INodeType {
  description: INodeTypeDescription = {
    displayName: 'Brasil Hub',
    name: 'brasilHub',
    icon: 'file:brasilHub.svg',
    group: ['transform'],
    version: 1,
    subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
    description: 'Query Brazilian public data (CNPJ, CEP) with multi-provider fallback',
    defaults: {
      name: 'Brasil Hub',
    },
    usableAsTool: true,
    inputs: [NodeConnectionTypes.Main],
    outputs: [NodeConnectionTypes.Main],
    properties: [
      {
        displayName: 'Resource',
        name: 'resource',
        type: 'options',
        noDataExpression: true,
        options: [
          { name: 'CNPJ', value: 'cnpj' },
          { name: 'CEP', value: 'cep' },
        ],
        default: 'cnpj',
      },
      ...cnpjDescription,
      ...cepDescription,
    ],
  };

  async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
    const items = this.getInputData();
    const returnData: INodeExecutionData[] = [];

    for (let i = 0; i < items.length; i++) {
      try {
        const resource = this.getNodeParameter('resource', i) as string;
        const operation = this.getNodeParameter('operation', i) as string;

        const handler = resourceOperations[resource]?.[operation];
        if (!handler) {
          throw new NodeOperationError(
            this.getNode(),
            `Unknown resource/operation: ${resource}/${operation}`,
            { itemIndex: i },
          );
        }

        const result = await handler(this, i);
        returnData.push(result);
      } catch (error) {
        if (this.continueOnFail()) {
          returnData.push({
            json: { error: (error as Error).message },
            error: error as Error,
            pairedItem: { item: i },
          });
          continue;
        }
        if ((error as Record<string, unknown>).context) {
          (error as Record<string, unknown> & { context: Record<string, unknown> }).context.itemIndex = i;
          throw error;
        }
        throw new NodeOperationError(this.getNode(), error as Error, { itemIndex: i });
      }
    }

    return [returnData];
  }
}
```

- [ ] **Step 2: Create BrasilHub.node.json (codex)**

```json
{
  "node": "n8n-nodes-brasil-hub",
  "nodeVersion": "1.0",
  "codexVersion": "1.0",
  "categories": ["Data & Storage"],
  "resources": {
    "primaryDocumentation": [
      {
        "url": "https://github.com/luismattos/n8n-nodes-brasil-hub"
      }
    ]
  }
}
```

- [ ] **Step 3: Create a placeholder SVG icon**

Create a simple SVG icon at `nodes/BrasilHub/brasilHub.svg`. Use the Brazilian flag colors (green, yellow, blue) in a simple hub/data icon design.

- [ ] **Step 4: Verify build succeeds**

```bash
cd /Users/luismattos/Documents/Workspaces/luisbarcia/n8n-nodes-brasil-hub
npm run build
```

Expected: Compiles without errors, `dist/` directory created

- [ ] **Step 5: Run lint**

```bash
npm run lint
```

Expected: No errors. If there are warnings from the n8n ESLint plugin, fix them before proceeding.

- [ ] **Step 6: Write node router tests**

Create `__tests__/BrasilHub.node.spec.ts`:

```typescript
import { BrasilHub } from '../nodes/BrasilHub/BrasilHub.node';

describe('BrasilHub node', () => {
  it('should have correct description metadata', () => {
    const node = new BrasilHub();
    expect(node.description.name).toBe('brasilHub');
    expect(node.description.displayName).toBe('Brasil Hub');
    expect(node.description.usableAsTool).toBe(true);
    expect(node.description.version).toBe(1);
  });

  it('should have resource property with CNPJ and CEP options', () => {
    const node = new BrasilHub();
    const resourceProp = node.description.properties.find((p) => p.name === 'resource');
    expect(resourceProp).toBeDefined();
    expect(resourceProp!.noDataExpression).toBe(true);
    const values = (resourceProp!.options as Array<{ value: string }>).map((o) => o.value);
    expect(values).toContain('cnpj');
    expect(values).toContain('cep');
  });

  it('should have operation properties for both resources', () => {
    const node = new BrasilHub();
    const ops = node.description.properties.filter((p) => p.name === 'operation');
    expect(ops.length).toBe(2); // one per resource
    for (const op of ops) {
      expect(op.noDataExpression).toBe(true);
      const values = (op.options as Array<{ value: string; action: string }>);
      for (const v of values) {
        expect(v.action).toBeDefined(); // n8n compliance: action required
      }
    }
  });
});
```

- [ ] **Step 7: Run all tests**

```bash
npm test
```

Expected: All tests pass

- [ ] **Step 8: Commit**

```bash
git add nodes/BrasilHub/BrasilHub.node.ts nodes/BrasilHub/BrasilHub.node.json nodes/BrasilHub/brasilHub.svg __tests__/BrasilHub.node.spec.ts
git commit -m "feat: assemble Brasil Hub node with resource router, codex, icon, and tests"
```

---

### Task 10: README and Final Validation

**Files:**
- Create: `README.md`
- Create: `LICENSE`

- [ ] **Step 1: Create LICENSE (MIT)**

Standard MIT license with author name and current year.

- [ ] **Step 2: Create README.md**

Follow the n8n community node README template. Include:
- What it does (CNPJ + CEP queries with fallback)
- Installation instructions (n8n community nodes UI)
- Operations table (Resource / Operation / Description)
- Example output (normalized JSON)
- Providers used per resource
- Compatibility (n8n version, Node.js version)
- License

- [ ] **Step 3: Final build + lint + test**

```bash
npm run build && npm run lint && npm test
```

Expected: All pass

- [ ] **Step 4: Commit**

```bash
git add README.md LICENSE
git commit -m "docs: add README and MIT license"
```

---

### Task 11: Integration Smoke Test

- [ ] **Step 1: Verify the package can be linked into n8n**

```bash
cd /Users/luismattos/Documents/Workspaces/luisbarcia/n8n-nodes-brasil-hub
npm run build
npm link
```

- [ ] **Step 2: Verify dist structure**

```bash
ls -R dist/nodes/BrasilHub/
```

Expected: All compiled `.js`, `.d.ts`, `.js.map` files present, plus `.node.json` and `.svg`

- [ ] **Step 3: Run n8n community package scanner**

```bash
npx @anthropic-ai/scan-community-package || npx @n8n/scan-community-package
```

Expected: No critical errors. Fix any issues before publishing.

Note: If `@n8n/scan-community-package` is not available, verify manually against the compliance checklist in the spec.

- [ ] **Step 4: Commit final state**

```bash
git add -A
git commit -m "chore: verify build output and package structure"
```

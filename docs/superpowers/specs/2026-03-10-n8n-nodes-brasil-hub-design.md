# Design: n8n-nodes-brasil-hub

**Date:** 2026-03-10
**Status:** Approved
**Package:** `n8n-nodes-brasil-hub`
**License:** MIT

## Overview

Community n8n node that centralizes Brazilian public data queries. A single "Brasil Hub" node with extensible resources — v1.0 ships with CNPJ and CEP.

## Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Node structure | Single node with resources | Standard n8n pattern (Google Sheets, Notion, Slack). Clean canvas, easy discovery. |
| Scope v1 | CNPJ + CEP | Most common use cases in Brazilian automation workflows. Two resources validate extensible architecture. |
| Data source strategy | BrasilAPI primary + 1-2 direct fallbacks | BrasilAPI is excellent but volunteer-maintained. Direct fallbacks ensure resilience without maintaining 6 providers. |
| Separate lib vs node-only | Node-only | BrasilAPI already solves data aggregation. The gap is a good n8n node, not another lib. |
| Output format | Normalized default + optional raw (`Include Raw Response` checkbox) | Clean output for 90% of cases. Raw available for debugging. |
| Validation operations | Local checksum/format (no API call) | Zero cost, prevents wasted API requests with invalid data. |
| Tooling | `@n8n/node-cli` for scaffold, build, lint | Official n8n CLI. Ensures compliance. |
| Tests | Jest + ts-jest | Ecosystem standard (n8n starter, Apify node). |
| AI Agent support | `usableAsTool: true` | Future-proof. Allows node to be used as tool by AI Agents in n8n. |

## Architecture

### File Structure

```
n8n-nodes-brasil-hub/
├── nodes/BrasilHub/
│   ├── BrasilHub.node.ts            # Class + resource/operation router
│   ├── BrasilHub.node.json          # Codex metadata
│   ├── BrasilHub.svg                # Icon
│   ├── resources/
│   │   ├── cnpj/
│   │   │   ├── cnpj.description.ts  # INodeProperties[] (fields + operations)
│   │   │   ├── cnpj.execute.ts      # { consultar: fn, validar: fn }
│   │   │   └── cnpj.normalize.ts    # Provider response → normalized schema
│   │   └── cep/
│   │       ├── cep.description.ts
│   │       ├── cep.execute.ts
│   │       └── cep.normalize.ts
│   ├── shared/
│   │   ├── fallback.ts              # Generic multi-provider fallback logic
│   │   └── validators.ts            # CNPJ checksum, CEP format validation
│   └── types.ts                     # Output interfaces (ICnpjResult, ICepResult, IMeta)
├── __tests__/
│   ├── cnpj.normalize.spec.ts
│   ├── cep.normalize.spec.ts
│   ├── validators.spec.ts
│   └── fallback.spec.ts
├── icons/
│   └── BrasilHub.svg
├── index.js                         # Empty (required by npm)
├── gulpfile.js                      # Copies icons to dist/
├── package.json
├── tsconfig.json
└── eslint.config.mjs                # import { config } from '@n8n/node-cli/eslint'
```

### Node Description

```typescript
export class BrasilHub implements INodeType {
  description: INodeTypeDescription = {
    displayName: 'Brasil Hub',
    name: 'brasilHub',
    icon: 'file:BrasilHub.svg',
    group: ['transform'],
    version: 1,
    subtitle: '={{$parameter["operation"]}}',
    description: 'Query Brazilian public data (CNPJ, CEP)',
    defaults: { name: 'Brasil Hub' },
    inputs: [NodeConnectionType.Main],
    outputs: [NodeConnectionType.Main],
    usableAsTool: true,
    properties: [...cnpjDescription, ...cepDescription],
  };
}
```

### Router Pattern (Dictionary Map)

Based on the Evolution API pattern (most popular community node, 6.6M downloads/month):

```typescript
const resourceOperations: Record<string, Record<string, ExecuteFunction>> = {
  cnpj: { consultar: cnpjConsultar, validar: cnpjValidar },
  cep:  { consultar: cepConsultar,  validar: cepValidar },
};
```

The `execute()` method reads resource + operation params and dispatches to the correct handler.

## Resources and Operations

### CNPJ

| Operation | Input | Output | API Call |
|-----------|-------|--------|----------|
| Query | CNPJ string | Normalized company data | Yes |
| Validate | CNPJ string | `{ valid, formatted_cnpj }` | No (local checksum) |

**Providers (fallback order):**
1. BrasilAPI: `https://brasilapi.com.br/api/cnpj/v1/{cnpj}`
2. CNPJ.ws: `https://publica.cnpj.ws/cnpj/{cnpj}`
3. ReceitaWS: `https://receitaws.com.br/v1/cnpj/{cnpj}`

### CEP

| Operation | Input | Output | API Call |
|-----------|-------|--------|----------|
| Query | CEP string | Normalized address data | Yes |
| Validate | CEP string | `{ valid, formatted_cep }` | No (local format check) |

**Providers (fallback order):**
1. BrasilAPI: `https://brasilapi.com.br/api/cep/v2/{cep}`
2. ViaCEP: `https://viacep.com.br/ws/{cep}/json`
3. OpenCEP: `https://opencep.com/v1/{cep}`

## Node Parameters

```
Resource:       [CNPJ | CEP]              noDataExpression: true
Operation:      [Query | Validate]        noDataExpression: true, each with action
CNPJ/CEP:       string (required)         Shown conditionally per resource
Include Raw:    boolean (default false)    Only for Query operation
```

No strategy selector, no rate limit config, no API picker. Fallback is automatic with 1s delay between retries. KISS.

## Output Schemas

### CNPJ (Normalized)

```typescript
interface ICnpjResult {
  cnpj: string;
  razao_social: string;
  nome_fantasia: string;
  situacao: string;
  data_abertura: string;
  porte: string;
  natureza_juridica: string;
  capital_social: number;
  atividade_principal: { codigo: string; descricao: string };
  endereco: {
    logradouro: string;
    numero: string;
    complemento: string;
    bairro: string;
    cep: string;
    municipio: string;
    uf: string;
  };
  contato: { telefone: string; email: string };
  socios: Array<{
    nome: string;
    cpf_cnpj: string;
    qualificacao: string;
    data_entrada: string;
  }>;
  _meta: IMeta;
  _raw?: unknown;
}
```

### CEP (Normalized)

```typescript
interface ICepResult {
  cep: string;
  logradouro: string;
  complemento: string;
  bairro: string;
  cidade: string;
  uf: string;
  ibge: string;
  ddd: string;
  _meta: IMeta;
  _raw?: unknown;
}
```

### Validation Result

```typescript
interface IValidationResult {
  valid: boolean;
  formatted: string;
  input: string;
}
```

### Meta (Shared)

```typescript
interface IMeta {
  provider: string;
  query: string;
  queried_at: string;
  strategy: 'fallback' | 'direct';
  errors?: string[];
}
```

## Error Handling

- **API errors** -> `NodeApiError` (preserves HTTP status code, descriptive messages)
- **Validation/operation errors** -> `NodeOperationError` with `itemIndex`
- **continueOnFail()** -> returns `{ json: inputItem.json, error, pairedItem: { item: i } }`
- **pairedItem** linking on all outputs for correct data tracing

## Fallback Logic (shared/fallback.ts)

Generic function used by both CNPJ and CEP:

```typescript
interface Provider {
  name: string;
  url: string;
}

async function queryWithFallback(
  context: IExecuteFunctions,
  providers: Provider[],
  itemIndex: number,
): Promise<{ data: unknown; provider: string; errors: string[] }>
```

- Tries providers in order
- 1s delay between attempts (hardcoded)
- 10s timeout per request
- Headers: `Accept: application/json`, `User-Agent: n8n-brasil-hub-node/1.0`
- Collects errors from failed providers into `_meta.errors`

## Validators (shared/validators.ts)

### CNPJ Checksum

Standard Receita Federal algorithm: two verification digits computed from weighted sums. Rejects all-same-digit CNPJs (00000000000000, 11111111111111, etc).

### CEP Format

Strips non-digits, checks for exactly 8 digits, rejects all-zeros.

## Testing Strategy

Framework: Jest + ts-jest

| Test File | What It Covers |
|-----------|---------------|
| `validators.spec.ts` | CNPJ checksum (valid, invalid, all-same-digits, edge cases). CEP format validation. |
| `cnpj.normalize.spec.ts` | Each provider's raw response -> normalized ICnpjResult. Snapshot tests. |
| `cep.normalize.spec.ts` | Each provider's raw response -> normalized ICepResult. Snapshot tests. |
| `fallback.spec.ts` | First provider succeeds. First fails, second succeeds. All fail. Error collection. |

## Compliance Checklist

| Requirement | Source | Status |
|-------------|--------|--------|
| MIT license | n8n verification guidelines | Yes |
| Zero runtime dependencies | n8n verification guidelines | Yes |
| `n8n-community-node-package` keyword | ESLint enforced | Yes |
| `n8n-workflow` as peerDependency | Starter template | Yes |
| `noDataExpression: true` on Resource/Operation | ESLint enforced | Yes |
| `action` on each Operation option | ESLint enforced | Yes |
| `continueOnFail()` with `pairedItem` | ESLint enforced + best practice | Yes |
| `usableAsTool: true` | Starter template (new) | Yes |
| Title Case displayNames | ESLint enforced | Yes |
| "Whether" prefix on boolean descriptions | ESLint enforced | Yes |
| Descriptions: no trailing period on single sentence | ESLint enforced | Yes |
| All UI text in English | n8n Cloud requirement | Yes |
| SVG icon | ESLint enforced | Yes |
| Passes `@n8n/scan-community-package` | n8n Cloud submission | To validate |
| Scaffold with `@n8n/node-cli` | Official recommendation | Yes |
| Build with `n8n-node build` | Official CLI | Yes |
| ESLint via `@n8n/node-cli/eslint` | Modern config | Yes |

## Extensibility

Adding a new resource (e.g., Banks):

1. Create `resources/banks/` with 3 files (description, execute, normalize)
2. Add interfaces to `types.ts`
3. Register in the dictionary map in `BrasilHub.node.ts`
4. Add tests

Zero changes to existing files except the router registration.

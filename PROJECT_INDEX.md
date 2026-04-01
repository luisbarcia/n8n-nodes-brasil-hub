# PROJECT_INDEX.md

> Auto-generated repository index. Reduces full-scan token cost by ~94%.
> Generated: 2026-03-27 | Version: 1.4.1 | Branch: main

## 1. Project Identity

| Field | Value |
|-------|-------|
| Name | `n8n-nodes-brasil-hub` |
| Version | 1.4.1 |
| License | MIT |
| Author | Luis Barcia (`luisbarcia`) |
| Stack | TypeScript, n8n-workflow (peer), Jest + ts-jest |
| Build tool | `@n8n/node-cli` (build, lint, scaffold) |
| Runtime deps | Zero (n8n-workflow is peerDependency only) |
| Node class | Single: `BrasilHub` |
| Pattern | Dictionary Map Router (resource + operation dispatch) |
| AI Agent | `usableAsTool: true` |

## 2. Directory Structure

```
n8n-nodes-brasil-hub/
├── nodes/BrasilHub/              # Main node source
│   ├── BrasilHub.node.ts         # Node class + router
│   ├── BrasilHub.node.json       # Codex metadata
│   ├── brasilHub.svg             # Node icon
│   ├── types.ts                  # All interfaces & types
│   ├── resources/                # 13 resource modules (see section 5)
│   │   ├── banks/
│   │   ├── cambio/
│   │   ├── cep/
│   │   ├── cnpj/
│   │   ├── cpf/
│   │   ├── ddd/
│   │   ├── fake/
│   │   ├── feriados/
│   │   ├── fipe/
│   │   ├── ibge/
│   │   ├── ncm/
│   │   ├── pix/
│   │   └── taxas/
│   └── shared/                   # Cross-cutting utilities
│       ├── fallback.ts           # Multi-provider fallback engine
│       ├── utils.ts              # buildMeta, buildResultItem(s), safeStr, stripNonDigits, reorderProviders, readCommonParams
│       ├── execute-helpers.ts    # Facade+Strategy: executeStandardQuery, executeStandardList, createNormalizerDispatch, createListNormalizerDispatch
│       ├── description-builders.ts # UI field builders (includeRawField)
│       └── validators.ts        # CNPJ/CPF checksum, CEP format (local, no API)
├── __tests__/                    # 35 test files, 1656 tests
├── __mocks__/                    # isolated-vm stub
├── .github/workflows/            # 11 CI/CD workflows
├── docs/                         # Specs, plans, articles, research
├── dist/                         # Build output
├── coverage/                     # Jest coverage reports
└── reports/                      # Additional reports
```

## 3. Entry Points

| Entry Point | Path | Purpose |
|-------------|------|---------|
| Node class | `nodes/BrasilHub/BrasilHub.node.ts` | Main node registration + execute router |
| Package main | `index.js` | n8n node loader entry |
| Types | `nodes/BrasilHub/types.ts` | All exported interfaces |
| Fallback engine | `nodes/BrasilHub/shared/fallback.ts` | `queryWithFallback()` |
| Execute helpers | `nodes/BrasilHub/shared/execute-helpers.ts` | Facade+Strategy pattern helpers |

## 4. Architecture: Router Pattern

```
allResources[] → resourceOperations{} → execute(resource, operation) → handler(context, itemIndex)
```

- `BrasilHub.node.ts` imports 13 resource modules
- Each module exports `IResourceDefinition { resource, description, operations }`
- `operations` is `Record<string, ExecuteFunction>`
- Router reads `resource` + `operation` params, dispatches to handler
- All handlers use `continueOnFail()` with `pairedItem`

### Shared Patterns (execute-helpers.ts)

| Function | Pattern | Used By |
|----------|---------|---------|
| `executeStandardQuery` | Facade for single-item API queries | Most `*Query` handlers |
| `executeStandardList` | Facade for multi-item API queries | Most `*List` handlers |
| `createNormalizerDispatch` | Strategy for provider-specific normalization | Single-item normalizers |
| `createListNormalizerDispatch` | Strategy for list normalization | List normalizers |

## 5. Resource Map (13 Resources, 28 Operations)

| Resource | Operations | Providers (fallback order) | Files |
|----------|------------|---------------------------|-------|
| **banks** | query, list | BrasilAPI, BancosBrasileiros | description, execute, normalize, index |
| **cambio** | currencies, rate | BrasilAPI (BCB) | description, execute, normalize, index |
| **cep** | query, validate | BrasilAPI, ViaCEP, OpenCEP, ApiCEP | description, execute, normalize, index |
| **cnpj** | query, validate | BrasilAPI, CNPJ.ws, ReceitaWS, MinhaReceita, OpenCNPJ.org, OpenCNPJ.com, CNPJA | description, execute, normalize, index |
| **cpf** | validate | Local (checksum) | description, execute, index |
| **ddd** | query | BrasilAPI, municipios-brasileiros | description, execute, normalize, index |
| **fake** | cpf, cnpj, person, company | Local (no API) | description, execute, generators, data, index |
| **feriados** | query | BrasilAPI, Nager.Date | description, execute, normalize, index |
| **fipe** | brands, models, years, price, referenceTables | parallelum | description, execute, normalize, index |
| **ibge** | states, cities | BrasilAPI, IBGE API | description, execute, normalize, index |
| **ncm** | query, search | BrasilAPI | description, execute, normalize, index |
| **pix** | list, query | BrasilAPI | description, execute, normalize, index |
| **taxas** | list, query | BrasilAPI | description, execute, normalize, index |

### Resource File Convention

Each resource directory contains 3-5 files:
- `<name>.description.ts` -- n8n UI property definitions
- `<name>.execute.ts` -- Operation handler functions
- `<name>.normalize.ts` -- Provider-specific response normalization (absent for local-only: cpf, fake)
- `index.ts` -- Barrel export of `IResourceDefinition`
- `fake/` also has: `fake.generators.ts` (CPF/CNPJ generation), `fake.data.ts` (name/address datasets)

## 6. Key Interfaces (types.ts)

| Interface | Purpose |
|-----------|---------|
| `ICnpjResult` | Normalized CNPJ query (7 providers) |
| `ICepResult` | Normalized CEP query (4 providers) |
| `IValidationResult` | Local validation result (CNPJ/CPF/CEP) |
| `IMeta` | Query metadata (provider, timestamp, errors, rate limit) |
| `IBank` | Normalized bank info |
| `IDdd` | Area code query result |
| `IState` | IBGE state |
| `ICity` | IBGE municipality |
| `INcm` | Tax classification code |
| `IFeriado` | Public holiday |
| `IPixParticipant` | PIX participant (BCB) |
| `IFipeBrand` / `IFipeModel` / `IFipeYear` / `IFipePrice` / `IFipeReferenceTable` | FIPE vehicle data hierarchy |
| `ICurrency` / `ICambioRate` | Exchange rate data |
| `ITaxa` | Interest rate (Selic, CDI, etc.) |
| `ExecuteFunction` | `(context, itemIndex) => Promise<INodeExecutionData[]>` |
| `IResourceDefinition` | `{ resource, description, operations }` |
| `IProvider` | `{ name, url }` for fallback engine |
| `IFallbackResult` | Internal fallback result before normalization |

## 7. Test Files (35 files, 1656 tests)

### Unit Tests (resource-specific)
| File | Tests |
|------|-------|
| `banks.execute.spec.ts` | Banks query/list handlers |
| `banks.normalize.spec.ts` | Banks normalization |
| `cambio.execute.spec.ts` | Cambio currencies/rate handlers |
| `cambio.normalize.spec.ts` | Cambio normalization |
| `cep.execute.spec.ts` | CEP query/validate handlers |
| `cep.normalize.spec.ts` | CEP normalization |
| `cnpj.execute.spec.ts` | CNPJ query/validate handlers |
| `cnpj.normalize.spec.ts` | CNPJ normalization |
| `cpf.execute.spec.ts` | CPF validate handler |
| `ddd.execute.spec.ts` | DDD query handler |
| `ddd.normalize.spec.ts` | DDD normalization |
| `fake.execute.spec.ts` | Fake data handlers |
| `fake.generators.spec.ts` | CPF/CNPJ generators |
| `feriados.execute.spec.ts` | Holidays query handler |
| `feriados.normalize.spec.ts` | Holidays normalization |
| `fipe.execute.spec.ts` | FIPE handlers (brands/models/years/price/tables) |
| `fipe.normalize.spec.ts` | FIPE normalization |
| `ibge.execute.spec.ts` | IBGE states/cities handlers |
| `ibge.normalize.spec.ts` | IBGE normalization |
| `ncm.execute.spec.ts` | NCM query/search handlers |
| `ncm.normalize.spec.ts` | NCM normalization |
| `pix.execute.spec.ts` | PIX list/query handlers |
| `pix.normalize.spec.ts` | PIX normalization |
| `taxas.execute.spec.ts` | Taxas list/query handlers |
| `taxas.normalize.spec.ts` | Taxas normalization |

### Shared / Cross-cutting Tests
| File | Tests |
|------|-------|
| `BrasilHub.node.spec.ts` | Node class registration, description, routing |
| `BrasilHub.execute.spec.ts` | Integration: full execute flow |
| `fallback.spec.ts` | Fallback engine, timeout clamping, rate limiting |
| `validators.spec.ts` | CNPJ/CPF/CEP validation (checksum, edge cases) |
| `utils.spec.ts` | Shared utilities (safeStr, buildMeta, stripNonDigits, etc.) |

### Attack / Adversarial Tests
| File | Tests |
|------|-------|
| `validators.attack.spec.ts` | Type confusion, null injection, unicode, overflow |
| `normalizers.attack.spec.ts` | Malicious API responses, XSS payloads |
| `execute.attack.spec.ts` | Handler-level adversarial inputs |
| `cambio-taxas.attack.spec.ts` | Cambio/Taxas adversarial inputs |

## 8. CI/CD Workflows (10 files)

| Workflow | Purpose |
|----------|---------|
| `ci.yml` | Main CI: lint, test, build (Node 20+22 matrix) |
| `release.yml` | Build+pack, attestation, npm publish |
| `release-please.yml` | Automated release PR via Release Please |
| `commitlint.yml` | Conventional Commits enforcement |
| `sonarcloud.yml` | SonarCloud quality gate |
| `codeql.yml` | GitHub CodeQL security scanning |
| `scorecard.yml` | OpenSSF Scorecard |
| `pr-size.yml` | PR size labeler |
| `stale.yml` | Stale issue/PR cleanup |
| `auto-merge-dependabot.yml` | Auto-merge Dependabot PRs |

## 9. Configuration Files

| File | Purpose |
|------|---------|
| `tsconfig.json` | TypeScript: strict, ES2019 target, commonjs, outDir=dist/ |
| `jest.config.js` | Jest: ts-jest preset, isolated-vm mock, roots=`__tests__/` |
| `eslint.config.mjs` | ESLint: `@n8n/node-cli/eslint` config |
| `sonar-project.properties` | SonarCloud: sources=nodes/, tests=`__tests__/` |
| `release-please-config.json` | Release Please automation config |
| `package.json` | 53 keywords, engines, scripts, n8n node registration |

## 10. Documentation Inventory

### Project Root
| File | Role |
|------|------|
| `README.md` | User-facing docs, badges, operations table |
| `CLAUDE.md` | AI coding assistant instructions |
| `CHANGELOG.md` | Release history (Keep a Changelog format) |
| `RELEASE_CHECKLIST.md` | 6-phase pre-release workflow |
| `ROADMAP.md` | Feature roadmap |
| `GOVERNANCE.md` | Project governance |
| `SECURITY-ASSESSMENT.md` | Security audit report |
| `LICENSE` | MIT license |

### Planning Files (Manus-style)
| File | Role |
|------|------|
| `task_plan.md` | Phase tracking, decisions, error log |
| `findings.md` | Research, discoveries, technical notes |
| `progress.md` | Session log, test results, milestones |

### .github/
| File | Role |
|------|------|
| `CONTRIBUTING.md` | Contributor guide |
| `SECURITY.md` | Security policy, supported versions |
| `CODE_OF_CONDUCT.md` | Community standards |
| `SUPPORT.md` | Support channels |
| `PULL_REQUEST_TEMPLATE.md` | PR template |
| `copilot-instructions.md` | GitHub Copilot context |

### docs/
| Path | Role |
|------|------|
| `docs/superpowers/specs/2026-03-10-*.md` | v0.1 design spec |
| `docs/superpowers/specs/2026-03-11-*.md` | v0.2-v0.7 design spec |
| `docs/superpowers/specs/2026-03-27-nfe-danfe-design.md` | NF-e/DANFE design spec (WIP) |
| `docs/superpowers/plans/2026-03-10-*.md` | v0.1 implementation plan |
| `docs/superpowers/plans/2026-03-11-*.md` | v0.2-v0.7 implementation plan |
| `docs/creator-portal/2026-03-11-demo-video-script-v0.1.6.md` | Demo video script |
| `docs/research/brazilian-validation-test-vectors.md` | CPF/CNPJ test vectors |
| `docs/articles/devto-tutorial-brasil-hub.md` | Dev.to tutorial draft |
| `docs/articles/comparison-brasil-hub-vs-alternatives.md` | Competitive comparison |

## 11. Shared Utilities Summary

### fallback.ts
- `queryWithFallback(context, providers, timeoutMs)` -- Sequential provider fallback
- `clampTimeout(value)` -- Clamp to [1000, 60000] ms
- Constants: `DEFAULT_TIMEOUT_MS=10000`, `MIN_TIMEOUT_MS=1000`, `MAX_TIMEOUT_MS=60000`

### utils.ts
- `safeStr(value)` -- Safe string coercion (prevents `[object Object]`)
- `buildMeta(provider, query, errors, rateLimited?, retryAfterMs?)` -- Standard `_meta` builder
- `buildResultItem(normalized, meta, rawData, includeRaw, itemIndex)` -- Single-item output
- `buildResultItems(items, meta, rawItems, includeRaw, itemIndex)` -- Multi-item output
- `stripNonDigits(value)` -- Remove non-digit chars
- `reorderProviders(providers, primary)` -- Move selected provider to front
- `readCommonParams(context, itemIndex)` -- Read includeRaw, timeoutMs, primaryProvider

### execute-helpers.ts
- `executeStandardQuery(context, itemIndex, config)` -- Facade for single-item queries
- `executeStandardList(context, itemIndex, config)` -- Facade for multi-item queries
- `createNormalizerDispatch(strategies, resourceName)` -- Strategy factory for normalizers
- `createListNormalizerDispatch(strategies, resourceName)` -- Strategy factory for list normalizers

### validators.ts
- `validateCnpj(cnpj)` -- Receita Federal checksum (14 digits)
- `validateCpf(cpf)` -- Receita Federal checksum (11 digits)
- `validateCep(cep)` -- Format + range validation (8 digits)
- `sanitizeCnpj(cnpj)` / `sanitizeCpf(cpf)` / `sanitizeCep(cep)` -- Strip formatting

### description-builders.ts
- `includeRawField(resource, operations?)` -- "Include Raw Response" toggle builder

## 12. Key Design Constraints

- Zero runtime dependencies (peerDependency only: n8n-workflow)
- All UI text in English (n8n Cloud requirement)
- Validate operations are local (no API call)
- NodeApiError for API errors, NodeOperationError for validation errors
- `continueOnFail()` with `pairedItem` on all outputs
- Normalized output by default, optional raw via checkbox
- JSDoc 100% coverage on all exports (130/130)
- User-Agent header: `n8n-brasil-hub-node/1.0`
- Timeout configurable per-node (default 10s, range 1-60s)

## 13. Stats

| Metric | Value |
|--------|-------|
| Source files (nodes/) | 59 .ts files |
| Test files | 35 .spec.ts files |
| Test count | 1656 |
| CI workflows | 10 |
| Resources | 13 |
| Operations | 28 |
| Providers | 25 |
| Exported interfaces | 20+ |
| JSDoc coverage | 100% (130/130) |

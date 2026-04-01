# Repository Index — n8n-nodes-brasil-hub

**Version:** 1.4.1 | **License:** MIT | **Node:** >=20.0.0
**Stats:** 59 source files, 35 test files, 1665 tests, 130 JSDoc'd exports

## Architecture

```
BrasilHub.node.ts (router)
  | reads resource + operation params
  | dispatches to handler via dictionary map
  |
resources/<name>/
  |- <name>.description.ts   -> INodeProperties[] (n8n UI fields)
  |- <name>.execute.ts       -> handler(this, i) -> INodeExecutionData
  |- <name>.normalize.ts     -> raw API -> typed interface (optional)
  +- index.ts                -> barrel export as IResourceDefinition

shared/
  |- description-builders.ts -> UI field factories (includeRawField)
  |- execute-helpers.ts      -> Facade+Strategy (executeStandardQuery, createNormalizerDispatch)
  |- fallback.ts             -> Multi-provider fallback with timeout+429 detection
  |- utils.ts                -> buildMeta, buildResultItem, safeStr, ICommonParams
  +- validators.ts           -> CNPJ/CPF mod11 checksum, CEP format (local, no API)
```

## Resource Map (13 resources, 28 operations, 25 providers)

| Resource | Operations | Providers (fallback order) |
|----------|-----------|---------------------------|
| **CNPJ** | Query, Validate | BrasilAPI -> CNPJ.ws -> ReceitaWS -> MinhaReceita -> OpenCNPJ.org -> OpenCNPJ.com -> CNPJA |
| **CEP** | Query, Validate | BrasilAPI -> ViaCEP -> OpenCEP -> ApiCEP |
| **CPF** | Validate | local (mod11) |
| **Banks** | Query, List | BrasilAPI -> BancosBrasileiros |
| **DDD** | Query | BrasilAPI -> municipios-brasileiros |
| **Feriados** | Query | BrasilAPI -> Nager.Date |
| **FIPE** | Brands, Models, Years, Price, RefTables | parallelum |
| **IBGE** | States, Cities | BrasilAPI -> IBGE API |
| **NCM** | Query, Search | BrasilAPI |
| **PIX** | List, Query | BrasilAPI |
| **Cambio** | ListCurrencies, QueryRate | BrasilAPI (BCB) |
| **Taxas** | List, Query | BrasilAPI |
| **Fake** | Person, Company, CPF, CNPJ | local (crypto.randomInt) |

## Types (types.ts — 23 exports)

| Interface | Used by |
|-----------|---------|
| `ICnpjResult` | cnpj.normalize |
| `ICepResult` | cep.normalize |
| `IValidationResult` | validators (CNPJ/CPF/CEP) |
| `IMeta` | all resources (provider, query, timing) |
| `IBank` | banks.normalize |
| `IDdd` | ddd.normalize |
| `IState`, `ICity` | ibge.normalize |
| `INcm` | ncm.normalize |
| `IFeriado` | feriados.normalize |
| `IPixParticipant` | pix.normalize |
| `IFipeBrand/Model/Year/Price/ReferenceTable` | fipe.normalize |
| `ICurrency`, `ICambioRate` | cambio.normalize |
| `ITaxa` | taxas.normalize |
| `ExecuteFunction` | execute handlers signature |
| `IResourceDefinition` | router registration |
| `IProvider`, `IFallbackResult` | fallback.ts |

## Source Files (59 files in nodes/BrasilHub/)

### Node class

| File | Purpose |
|------|---------|
| `BrasilHub.node.ts` | Main node class + dictionary map router |
| `BrasilHub.node.json` | Codex metadata (categories, aliases) |
| `brasilHub.svg` | Node icon |
| `types.ts` | All output interfaces + internal types |

### Shared utilities (5 files)

| File | Exports |
|------|---------|
| `shared/description-builders.ts` | `includeRawField` — reusable UI field |
| `shared/execute-helpers.ts` | `executeStandardQuery`, `createNormalizerDispatch` — Facade+Strategy |
| `shared/fallback.ts` | `tryProviders`, `clampTimeout`, `DEFAULT_TIMEOUT_MS` |
| `shared/utils.ts` | `safeStr`, `buildMeta`, `buildResultItem`, `reorderProviders`, `readCommonParams`, `ICommonParams` |
| `shared/validators.ts` | `isValidCnpj`, `isValidCpf`, `isValidCep` |

### Resources (13 x 3-4 files each = 50 files)

Each resource follows the pattern: `description.ts` + `execute.ts` + `normalize.ts` (optional) + `index.ts`

| Resource | Files | Notes |
|----------|-------|-------|
| `banks/` | 4 (desc, exec, norm, index) | Query + List |
| `cambio/` | 4 | ListCurrencies + QueryRate |
| `cep/` | 4 | Query + Validate (local) |
| `cnpj/` | 4 | Query + Validate (local), 7 providers |
| `cpf/` | 3 (no normalize) | Validate only (local) |
| `ddd/` | 4 | Query |
| `fake/` | 5 (+ data.ts, generators.ts) | Person, Company, CPF, CNPJ (no API) |
| `feriados/` | 4 | Query |
| `fipe/` | 4 | 5 operations (hierarchy API) |
| `ibge/` | 4 | States + Cities |
| `ncm/` | 4 | Query + Search |
| `pix/` | 4 | List + Query |
| `taxas/` | 4 | List + Query |

## Test Files (35 specs, 1665 tests)

| Category | Files | Coverage |
|----------|-------|----------|
| Execute handlers | 13 (`*.execute.spec.ts`) | All 13 resources |
| Normalizers | 11 (`*.normalize.spec.ts`) | All normalizer resources |
| Attack/adversarial | 4 (`*.attack.spec.ts`) | Type confusion, XSS, overflow, Unicode |
| Shared utilities | 3 (validators, utils, fallback) | Checksum, meta, timeout |
| Node class | 2 (BrasilHub.node, BrasilHub.execute) | Router, integration |
| Generators | 1 (fake.generators) | CSPRNG, data quality |

## CI/CD Workflows (11 files in .github/workflows/)

| Workflow | Trigger | Purpose |
|----------|---------|---------|
| `ci.yml` | push/PR | Lint -> Test (Node 20+22) -> Build -> Audit |
| `release-please.yml` | push main | Release PR automation |
| `release.yml` | tag v* | npm pack -> attestation -> npm publish |
| `codeql.yml` | push/PR/schedule | CodeQL security scanning |
| `sonarcloud.yml` | push/PR | Quality gate (SonarCloud) |
| `commitlint.yml` | PR | Conventional commit validation |
| `pr-size.yml` | PR | PR size label |
| `auto-merge-dependabot.yml` | PR | Auto-merge Dependabot minor/patch |
| `scorecard.yml` | schedule | OpenSSF Scorecard |
| `stale.yml` | schedule | Stale issue/PR cleanup |

## Documentation Map

| File | SOT for | Audience |
|------|---------|----------|
| `README.md` | Install, operations table, FAQ | Users |
| `CHANGELOG.md` | Release history | Users, contributors |
| `CLAUDE.md` | Architecture, CI/CD, design decisions | AI assistants |
| `RELEASE_CHECKLIST.md` | 6-phase release process | Maintainers |
| `.github/CONTRIBUTING.md` | Setup, coding style, PR process | Contributors |
| `.github/SECURITY.md` | Vulnerability disclosure | Security researchers |
| `SECURITY-ASSESSMENT.md` | Threat model (13 resources) | Auditors |
| `.github/copilot-instructions.md` | Code conventions | AI coding assistants |
| `GOVERNANCE.md` | Project governance | Community |
| `ROADMAP.md` | Planned features | Users, contributors |

## Design Specs & Plans

| File | Content |
|------|---------|
| `docs/superpowers/specs/2026-03-10-n8n-nodes-brasil-hub-design.md` | Original design spec (v0.1) |
| `docs/superpowers/specs/2026-03-11-brasil-hub-v0.2.0-design.md` | Extended design spec (v0.2-v0.7) |
| `docs/superpowers/specs/2026-03-27-nfe-danfe-design.md` | NF-e resource design (next feature) |
| `docs/superpowers/plans/2026-03-10-n8n-nodes-brasil-hub.md` | Original implementation plan |
| `docs/superpowers/plans/2026-03-11-brasil-hub-v0.2.0.md` | Extended implementation plan |

## Config Files

| File | Purpose |
|------|---------|
| `tsconfig.json` | TypeScript (es2019, strict) |
| `jest.config.js` | Jest + ts-jest, isolated-vm mock |
| `eslint.config.mjs` | n8n-node-cli ESLint config |
| `sonar-project.properties` | SonarCloud analysis |
| `package.json` | npm metadata, 53 keywords, engines >=20 |

## Planning Files (Manus-style)

| File | Purpose |
|------|---------|
| `task_plan.md` | Phase tracking, decisions, error log |
| `findings.md` | Research, discoveries, technical notes |
| `progress.md` | Session log, test results, milestones |

# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.1.0] - 2026-03-19

### Added
- **SEO**: +10 npm keywords (brazilian, automation, workflow, public-data, address, zip-code, company, tax-id, validation, api-fallback)
- **SEO**: +11 codex aliases with PT-BR terms (brasil, banco, municipios, endereco, empresa, consulta, receita, tabela-fipe) for n8n marketplace discoverability
- npm description now highlights "22 providers", "no credentials", "AI Agent ready"

### Fixed
- **Type safety**: Replaced unsafe `error as Error` casts with proper `instanceof` guards in router error handling (prevents TypeError on non-Error throws)
- **NaN/Infinity leak**: FIPE normalizers now use `Number.isFinite()` instead of `typeof === 'number'` — rejects NaN/Infinity (falls back to 0)
- **Infinity in URL**: `referenceTable=Infinity` no longer produces `?tabela_referencia=Infinity` in FIPE URLs

### Changed
- **Generic `buildResultItem<T>`/`buildResultItems<T>`**: Eliminates 14 double-cast expressions across all execute files. Cast centralized in utils.ts
- **`useUnknownInCatchVariables: true`** in tsconfig — stricter catch variable typing
- Fixed orphaned JSDoc comment in BrasilHub.node.ts (moved to resourceOperations)
- Fixed stale DDD description comment ("Single provider" → "BrasilAPI → municipios-brasileiros")

## [1.0.3] - 2026-03-18

### Fixed
- FIPE buildMeta calls now pass explicit `false` for rateLimited (consistency with 10 other handlers)
- Documented in JSDoc why fallback.ts uses Error (not NodeApiError) for aggregated multi-provider errors

## [1.0.2] - 2026-03-18

### Fixed
- Propagated `Feriado` → `Holiday` rename to all living docs: README, CLAUDE.md, copilot-instructions, package.json description, node description, ROADMAP
- Updated README hero text and Roadmap link description

## [1.0.1] - 2026-03-18

### Fixed
- Renamed resource display name `Feriado` → `Holiday` for English consistency (all UI text must be in English per n8n Cloud requirements)
- Reordered resource options alphabetically per n8n lint rules (Holiday now between FIPE and IBGE)

### Changed
- Internal `value` remains `feriados` — no breaking change for existing workflows

## [1.0.0] - 2026-03-17

### Added
- **Stable release** — first major version, API contract locked under semver
- All 4 power-user features from v0.10–v0.13 consolidated:
  - Configurable Timeout (1s–60s) with runtime clamping
  - CNPJ Output Mode (Simplified, Full, AI Summary)
  - Rate Limit Awareness (429 detection, Retry-After, fallback chain)
  - Configurable Provider Order (6 resources, 22 providers)

### Changed
- 9 resources, 17 operations, 22 providers
- 1174 tests, 24 suites, 99%+ branch coverage
- All pre-1.0 versions deprecated

## [0.13.0] - 2026-03-17

### Added
- **Configurable Provider Order** — "Primary Provider" dropdown for 6 resources with 2+ providers
  - CNPJ: 7 providers (Auto, BrasilAPI, CNPJ.ws, CNPJA, MinhaReceita, OpenCNPJ.com, OpenCNPJ.org, ReceitaWS)
  - CEP: 4 providers (ApiCEP, Auto, BrasilAPI, OpenCEP, ViaCEP)
  - Banks: 2 providers (Auto, BrasilAPI, BancosBrasileiros)
  - DDD: 2 providers (Auto, BrasilAPI, Municipios-BR)
  - Feriados: 2 providers (Auto, BrasilAPI, Nager.Date)
  - IBGE: 2 providers (Auto, BrasilAPI, IBGE API)
- `reorderProviders()` helper in shared/utils.ts — moves chosen provider to position 0
- 7 new tests for reorderProviders (move, keep order, edge cases, immutability)

### Changed
- Options alphabetized per n8n lint rules
- Default "Auto (BrasilAPI First)" preserves existing behavior
- 1174 tests total (was 1167)

## [0.12.0] - 2026-03-17

### Added
- **Rate Limit Awareness** — HTTP 429 detection in fallback engine
  - Detects 429 status from any provider, moves to next immediately
  - Extracts `Retry-After` header when present (seconds → milliseconds)
  - Adds `rate_limited: true` and `retry_after_ms` to `_meta` output
  - Specific error message when all providers are rate-limited: "All providers rate-limited or failed"
  - Works across all 9 resources via shared `queryWithFallback`
- 9 new rate limit tests (429 detection, Retry-After parsing, error messages, edge cases)

### Changed
- `IFallbackResult` now includes `rateLimited` and `retryAfterMs` fields
- `IMeta` now includes optional `rate_limited` and `retry_after_ms` fields
- `buildMeta` accepts optional `rateLimited` and `retryAfterMs` params
- All 10 execute handlers pass rate limit info through to `_meta`
- 1167 tests total (was 1158)

## [0.11.0] - 2026-03-17

### Added
- **CNPJ Output Mode** — new `Output Mode` dropdown when Simplify is disabled
  - **Full** (default): all normalized fields (address, contacts, partners)
  - **AI Summary**: 8 flat English key-value fields optimized for AI Agent tool usage
    (`cnpj`, `company`, `trade_name`, `status`, `since`, `size`, `activity`, `city`)
- 4 new output mode tests in cnpj.execute.spec.ts

### Changed
- 1158 tests total (was 1154)
- Backward-compatible: existing workflows with `simplify: true/false` keep working identically

## [0.10.1] - 2026-03-17

### Fixed
- **Runtime timeout clamping** — timeout values are now clamped to [1000, 60000] ms at runtime, not just UI
  - Prevents `timeout: 0` (infinite wait in axios) via expressions or AI tool usage
  - NaN/Infinity values fall back to DEFAULT_TIMEOUT_MS (10000)
  - `clampTimeout()` guard applied in both `queryWithFallback` and `fetchFipe`

### Changed
- Exported `DEFAULT_TIMEOUT_MS` constant — all 9 resource handlers now import it instead of hardcoding `10000` (single source of truth)
- 13 new boundary tests for `clampTimeout` + `queryWithFallback` edge cases
- 1154 tests total (was 1141)

## [0.10.0] - 2026-03-17

### Added
- **Configurable Timeout** — global "Timeout (Ms)" parameter (1s–60s, default 10s)
  - Exposed in node UI after all resource-specific fields
  - Passed to `queryWithFallback` and `fetchFipe` for all 9 resources
  - Replaces hardcoded `REQUEST_TIMEOUT_MS` constant
- 5 new tests for timeout behavior (fallback, node metadata, execute integration)

### Changed
- Renamed `REQUEST_TIMEOUT_MS` → `DEFAULT_TIMEOUT_MS` in fallback.ts
- All resource handlers now read timeout from node parameter instead of constant
- 1141 tests total, 24 suites, 99%+ branch coverage

## [0.9.0] - 2026-03-17

### Added
- **NCM resource** with Query and Search operations (BrasilAPI)
  - **Query**: Fetch tax classification details by NCM code
  - **Search**: Find codes by description keyword (min 3 characters, multi-item)
- INcm interface with 7 fields (code, description, dates, act info)
- NCM and tax-classification aliases added to codex
- Attack tests for NCM resource

### Changed
- Node description updated to include NCM
- Resource options now include NCM (9 resources, 17 operations total)

## [0.8.0] - 2026-03-16

### Added
- **IBGE resource** with States and Cities operations and multi-provider fallback (BrasilAPI → IBGE API oficial)
  - **States**: List all 27 Brazilian states with region info
  - **Cities**: List all municipalities for a given state
- UF validation via allowlist (27 valid abbreviations, case-insensitive)
- IState and ICity interfaces in types.ts
- IBGE and states/cities aliases added to codex
- Attack tests for IBGE resource

### Changed
- Node description updated to include IBGE
- Resource options now include IBGE (8 resources total)

## [0.7.0] - 2026-03-16

### Added
- **4 new CNPJ providers** — total 7 (most of any community node):
  BrasilAPI → CNPJ.ws → ReceitaWS → MinhaReceita → OpenCNPJ.org → OpenCNPJ.com → CNPJA
  - MinhaReceita: flat snake_case, regime_tributario field
  - OpenCNPJ.org: structured telefones array, capital_social as string
  - OpenCNPJ.com: wrapped response, camelCase
  - CNPJA: deeply nested, updated timestamp, suframa
- **ApiCEP provider** — total 4 CEP providers:
  BrasilAPI → ViaCEP → OpenCEP → ApiCEP
  - English field names, hyphenated CEP format, ok-based error detection
- **CNPJ Simplify parameter** — returns only top-level fields (cnpj, razao_social, nome_fantasia, situacao, data_abertura, porte) when enabled (default: true)
- **HTTP status codes in error messages** — fallback errors now show `[404]`, `[500]` etc. when available
- `buildResultItem` and `buildResultItems` shared helpers in utils.ts
- 21 new provider tests, 709 total, 99%+ branch coverage

### Changed
- DRY refactor: all 10 execute handlers use shared `buildResultItem`/`buildResultItems`
- Deduplicated `normalizeBrands`/`normalizeYears` via shared `normalizeCodeNameList` (SonarCloud S4144)
- Node description updated to reflect 7 CNPJ + 4 CEP providers

## [0.6.0] - 2026-03-16

### Added
- **Feriados resource** with Query operation and multi-provider fallback (BrasilAPI → Nager.Date)
  - Returns one n8n item per holiday for a given year
  - Nager.Date normalizer prefers `localName` (pt-BR) over `name` (English)
  - Year validation: integer in range 1900–2199
- IFeriado interface in types.ts
- 121 adversarial attack tests for Feriados (normalizer + execute)
- 688 total tests, 99.56% branch coverage

### Security
- `encodeURIComponent` on year in provider URLs (defense-in-depth)
- `safeStr` sanitization on Nager.Date `types` array items

### Changed
- Node description updated to include Feriados
- Resource options now include "Feriado" (alphabetical: Bank, CEP, CNPJ, CPF, DDD, Feriado, FIPE)

## [0.5.1] - 2026-03-16

### Fixed
- **FIPE normalizer crash**: `normalizeBrands`, `normalizeModels`, `normalizeYears` crashed with TypeError when API returned null/undefined items in arrays — now filtered out safely
- **FIPE path traversal**: User-supplied `brandCode`, `modelCode`, `yearCode` were interpolated into URLs without validation — now validated with regex (`/^\d{1,6}$/`, `/^\d{1,5}-\d{1,2}$/`)
- **FIPE SSRF via vehicleType**: `vehicleType` was not validated server-side — now checked against allowlist (carros, motos, caminhoes)
- **FIPE URL encoding**: All user inputs now `encodeURIComponent()`-encoded before URL interpolation
- **referenceTable float injection**: Applied `Math.floor()` to prevent decimal values in query string
- Indentation of FIPE resource option in router

### Added
- 121 FIPE adversarial attack tests (normalizer + execute) via Testing Arsenal
- Router completeness test: verifies every UI resource/operation has a handler
- `buildMeta` unit tests: ISO 8601 timestamp validation, strategy logic, errors key presence
- Testing Arsenal as mandatory Fase 3 in pre-release workflow (6 phases total)
- 574 total tests, 99.5%+ branch coverage

### Security
- Input validation for all FIPE parameters prevents path traversal and SSRF
- `encodeURIComponent()` applied as defense-in-depth on all URL path segments

### Deprecated
- v0.5.0 contains normalizer crash bugs and security vulnerabilities fixed in this release

## [0.5.0] - 2026-03-16

### Added
- **FIPE resource** with 4 hierarchical operations for vehicle price queries (Tabela FIPE)
  - **Brands**: List all vehicle brands by type (Cars, Motorcycles, Trucks)
  - **Models**: List models for a specific brand
  - **Years**: List available years for a specific model
  - **Price**: Get the FIPE table price for a specific vehicle (brand/model/year)
- Conditional parameter visibility via displayOptions (vehicleType → brandCode → modelCode → yearCode)
- Optional Reference Table parameter for querying historical FIPE data
- IFipeBrand, IFipeModel, IFipeYear, IFipePrice interfaces in types.ts
- 27 new tests (14 normalizer + 13 execute), 419 total, 99%+ branch coverage
- FIPE and vehicle aliases added to codex for discoverability

### Changed
- Node description updated to include FIPE
- Resource options now include FIPE (alphabetical: Bank, CEP, CNPJ, CPF, DDD, FIPE)
- Provider: parallelum.com.br (single provider — BrasilAPI only supports price-by-code, not hierarchy)

## [0.4.3] - 2026-03-16

### Fixed
- **Normalizers crash with null/undefined**: All normalizer entry points now guard against null/undefined API responses with `(data ?? {})` coercion, producing empty defaults instead of TypeError
- **normalizeBanks/normalizeDdd no Array guard**: Added `Array.isArray()` guard before `.map()` and `.filter()` — non-array data returns empty array or descriptive error instead of crashing
- **DDD municipios string-vs-number equality**: Fixed `===` comparison that failed when JSON had string DDD codes (`"11"` vs `11`) by using `Number()` coercion
- **capital_social NaN for non-numeric strings**: Added `safeCapital()` helper with `Number.isNaN()` guard — `"abc"` now returns `0` instead of `NaN`
- **continueOnFail string throw**: Fixed error message extraction using `error instanceof Error ? error.message : String(error)` — non-Error throws no longer produce `undefined` json.error
- **stripNonDigits crash with non-string**: Added defensive `String(value ?? '')` coercion for non-string input types
- Lint errors in attack test files (unused variable, unnecessary eslint-disable directives, direct NaN comparison)

### Added
- 250 adversarial attack tests across 3 new test files:
  - `validators.attack.spec.ts` (66 tests): type confusion, unicode injection, prototype pollution, NaN propagation
  - `normalizers.attack.spec.ts` (127 tests): null/undefined crashes, non-array data, XSS/SQLi passthrough, large payloads
  - `execute.attack.spec.ts` (57 tests): garbage API responses, error objects, timeout, continueOnFail edge cases, DDD strict equality
- JSDoc `@throws {NodeOperationError}` to `BrasilHub.execute()` method
- Formal JSDoc with `@param`/`@returns` to `safeCapital()` helper

### Changed
- 374 tests total (was 124), 100% statement/function/line coverage, 96%+ branch coverage
- Pre-release workflow: all 5 phases executed (compliance 17/17, security PASS, validation 12/12, simplify clean, JSDoc 87%)

### Deprecated
- All versions prior to 0.4.3 contain bugs fixed in this release (CEP validation, normalizer crashes, DDD equality, capital_social NaN)

## [0.4.2] - 2026-03-15

### Added
- **DDD fallback provider**: municipios-brasileiros (kelvins/municipios-brasileiros GitHub JSON) as fallback when BrasilAPI fails
- UF_CODES mapping table (27 IBGE codes → state abbreviations) for municipios normalization
- Multi-state DDD support: picks the most frequent UF when a DDD spans multiple states
- 6 new DDD tests (municipios filtering, multi-state, not-found)

### Changed
- DDD resource now has fallback resilience (was single-provider)
- 112 tests total, 99.27% branch coverage

## [0.4.1] - 2026-03-15

### Changed
- Extract `buildMeta()` helper to `shared/utils.ts`, eliminating duplicated meta-building logic across 5 execute handlers
- Improve branch coverage: Banks 91% → 100%, DDD normalize 66% → 100% (3 new edge case tests)
- 108 tests total, 98.6% branch coverage (remaining gap: DDD fallback dead code with single provider)

### Fixed
- Document mandatory pre-release workflow rules in CLAUDE.md (all 5 phases must execute in order)

## [0.4.0] - 2026-03-15

### Added
- **DDD resource** with Query operation (BrasilAPI)
- Fetch state and cities for a Brazilian area code (DDD)
- Input validation: 2-digit range 11–99 before API call
- IDdd interface in types.ts
- 9 new tests (normalizer, execute, integration)

### Changed
- Resource options sorted alphabetically (Bank, CEP, CNPJ, CPF, DDD)
- 105 tests total

## [0.3.0] - 2026-03-15

### Added
- **Bank resource** with Query and List operations
- Query: fetch bank info by COMPE code (BrasilAPI → BancosBrasileiros fallback)
- List: fetch all Brazilian banks, returns one n8n item per bank (multi-item)
- Bank code validation (must be positive integer) before API calls
- BancosBrasileiros (GitHub raw JSON) as fallback provider with local filtering
- IBank interface in types.ts
- 18 new tests (normalizer, execute, integration, fallback)

### Changed
- Resource option uses singular "Bank" per n8n lint convention
- 96 tests total, 100% statement/function/line coverage

## [0.2.0] - 2026-03-15

### Added
- **CPF resource** with Validate operation (local Módulo 11 checksum, no API call)
- CPF checksum validator (`validateCpf`) and sanitizer (`sanitizeCpf`) in shared validators
- 16 new tests for CPF validation (validators, execute handler, integration, edge cases)
- CPF alias added to codex for discoverability

### Changed
- Execute handlers now return `INodeExecutionData[]` (array) instead of single items, enabling future multi-item resources (Banks list, Feriados)
- Router uses `push(...results)` spread pattern for multi-item support
- Resource options sorted alphabetically (CEP, CNPJ, CPF)
- Node description updated to include CPF
- 76 tests total with 100% coverage (statements, branches, functions, lines)

## [0.1.6] - 2026-03-11

### Fixed
- Comply with n8n UX guidelines: replace "All providers failed" error message with "No provider could fulfill the request" (avoids prohibited words)
- Add descriptive sub-text to Resource options (CNPJ, CEP) for better UX

## [0.1.5] - 2026-03-11

### Fixed
- Align package.json with n8n-nodes-starter template to fix Creator Portal vetting
- Remove unused `main` field and `index.js` entry point (not present in starter template)
- Change `files` from `["dist/nodes"]` to `["dist"]` to match starter convention

## [0.1.4] - 2026-03-11

### Fixed
- Add author email to package.json (required by n8n Creator Portal for node verification)

## [0.1.3] - 2026-03-11

### Added
- CNPJ checksum validation before HTTP queries (prevents wasted API calls on invalid CNPJs)
- CEP format validation before HTTP queries (rejects all-zeros CEP early)
- 8 new tests covering pre-query validation and normalizer edge cases
- GitHub repository topics, homepage URL, and Discussions for discoverability

### Changed
- Simplify CI/CD: remove OpenSSF Scorecard workflow and CodeQL (SonarCloud covers SAST + quality gate)
- Remove OpenSSF Scorecard and CII Best Practices badges from README
- README redesigned with centered hero, "Why Brasil Hub?" section, collapsible examples, fallback diagram
- Icon SVG improved with `{}` data symbol
- 100% test coverage across all metrics (statements, branches, functions, lines)

## [0.1.2] - 2026-03-11

### Added
- GOVERNANCE.md with BDFL model, roles, and continuity/succession plan
- ROADMAP.md with planned features for v0.2 and v1.0
- SECURITY-ASSESSMENT.md with threat model (8 threats), trust boundaries, and secure design principles
- Release verification instructions in SECURITY.md (npm provenance + build attestation)
- Build provenance attestation via `actions/attest-build-provenance`
- GPG signing for commits and tags

### Changed
- Release pipeline: Build & Pack (with attestation) → Publish
- Branch protection enhanced with pull request requirement and required status checks

### Fixed
- Remove `paths-ignore` from `pull_request` triggers in CI workflow to prevent docs-only PRs from being blocked by required status checks

### Security
- SonarCloud quality gate integrated
- All GitHub Actions pinned to SHA for supply chain security

## [0.1.1] - 2026-03-10

### Fixed
- Remove `setTimeout` from fallback logic to pass `@n8n/scan-community-package` ESLint check
- Replace Portuguese aliases in codex file with English equivalents (`tax-id`, `zip-code`)

### Changed
- Remove inter-provider delay from fallback strategy (providers are queried immediately on failure)
- Simplify test infrastructure: remove fake timers and `runWithTimers` helper

## [0.1.0] - 2026-03-10

### Added
- Brasil Hub n8n node with CNPJ and CEP resources
- CNPJ query operation with multi-provider fallback (BrasilAPI, CNPJ.ws, ReceitaWS)
- CNPJ validate operation (local checksum verification, no API call)
- CEP query operation with multi-provider fallback (BrasilAPI, ViaCEP, OpenCEP)
- CEP validate operation (local format check, no API call)
- Normalized output schema for all providers
- Optional raw API response inclusion via `Include Raw Response` toggle
- `_meta` field with provider info, query timestamp, strategy (`direct`/`fallback`), and errors
- `usableAsTool: true` for AI Agent compatibility
- Generic multi-provider fallback engine with 10s timeout per provider
- CNPJ checksum and CEP format validators (zero runtime dependencies)
- TypeScript strict mode with full type definitions and JSDoc on all 23 public exports
- 49 tests (99.46% statement coverage) across 8 suites
- README with installation, operations table, example output, and provider documentation
- Design spec and implementation plan
- GitHub Actions CI pipeline (lint, test matrix Node 20/22, build, dependency audit)
- GitHub Actions release pipeline (npm publish with provenance on GitHub release)
- Community health files (CODE_OF_CONDUCT, CONTRIBUTING, SECURITY, SUPPORT)
- Issue templates (bug report, feature request) with YAML form schema
- Pull request template with n8n-specific checklist
- Dependabot configuration (npm + GitHub Actions weekly updates)
- MIT license

[Unreleased]: https://github.com/luisbarcia/n8n-nodes-brasil-hub/compare/v1.1.0...HEAD
[1.1.0]: https://github.com/luisbarcia/n8n-nodes-brasil-hub/compare/v1.0.3...v1.1.0
[1.0.3]: https://github.com/luisbarcia/n8n-nodes-brasil-hub/compare/v1.0.2...v1.0.3
[1.0.2]: https://github.com/luisbarcia/n8n-nodes-brasil-hub/compare/v1.0.1...v1.0.2
[1.0.1]: https://github.com/luisbarcia/n8n-nodes-brasil-hub/compare/v1.0.0...v1.0.1
[1.0.0]: https://github.com/luisbarcia/n8n-nodes-brasil-hub/compare/v0.13.0...v1.0.0
[0.13.0]: https://github.com/luisbarcia/n8n-nodes-brasil-hub/compare/v0.12.0...v0.13.0
[0.12.0]: https://github.com/luisbarcia/n8n-nodes-brasil-hub/compare/v0.11.0...v0.12.0
[0.11.0]: https://github.com/luisbarcia/n8n-nodes-brasil-hub/compare/v0.10.1...v0.11.0
[0.10.1]: https://github.com/luisbarcia/n8n-nodes-brasil-hub/compare/v0.10.0...v0.10.1
[0.10.0]: https://github.com/luisbarcia/n8n-nodes-brasil-hub/compare/v0.9.0...v0.10.0
[0.9.0]: https://github.com/luisbarcia/n8n-nodes-brasil-hub/compare/v0.8.0...v0.9.0
[0.8.0]: https://github.com/luisbarcia/n8n-nodes-brasil-hub/compare/v0.7.0...v0.8.0
[0.7.0]: https://github.com/luisbarcia/n8n-nodes-brasil-hub/compare/v0.6.0...v0.7.0
[0.6.0]: https://github.com/luisbarcia/n8n-nodes-brasil-hub/compare/v0.5.1...v0.6.0
[0.5.1]: https://github.com/luisbarcia/n8n-nodes-brasil-hub/compare/v0.5.0...v0.5.1
[0.5.0]: https://github.com/luisbarcia/n8n-nodes-brasil-hub/compare/v0.4.3...v0.5.0
[0.4.3]: https://github.com/luisbarcia/n8n-nodes-brasil-hub/compare/v0.4.2...v0.4.3
[0.4.2]: https://github.com/luisbarcia/n8n-nodes-brasil-hub/compare/v0.4.1...v0.4.2
[0.4.1]: https://github.com/luisbarcia/n8n-nodes-brasil-hub/compare/v0.4.0...v0.4.1
[0.4.0]: https://github.com/luisbarcia/n8n-nodes-brasil-hub/compare/v0.3.0...v0.4.0
[0.3.0]: https://github.com/luisbarcia/n8n-nodes-brasil-hub/compare/v0.2.0...v0.3.0
[0.2.0]: https://github.com/luisbarcia/n8n-nodes-brasil-hub/compare/v0.1.6...v0.2.0
[0.1.6]: https://github.com/luisbarcia/n8n-nodes-brasil-hub/compare/v0.1.5...v0.1.6
[0.1.5]: https://github.com/luisbarcia/n8n-nodes-brasil-hub/compare/v0.1.4...v0.1.5
[0.1.4]: https://github.com/luisbarcia/n8n-nodes-brasil-hub/compare/v0.1.3...v0.1.4
[0.1.3]: https://github.com/luisbarcia/n8n-nodes-brasil-hub/compare/v0.1.2...v0.1.3
[0.1.2]: https://github.com/luisbarcia/n8n-nodes-brasil-hub/compare/v0.1.1...v0.1.2
[0.1.1]: https://github.com/luisbarcia/n8n-nodes-brasil-hub/compare/v0.1.0...v0.1.1
[0.1.0]: https://github.com/luisbarcia/n8n-nodes-brasil-hub/releases/tag/v0.1.0

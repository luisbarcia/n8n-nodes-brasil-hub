# Task Plan: n8n-nodes-brasil-hub

## Goal
Implementar o community node n8n "Brasil Hub" que consulta dados públicos brasileiros (CNPJ e CEP) com fallback multi-provider, seguindo todos os padrões oficiais n8n.

## Current Phase
Phase 16 (pending) — v0.2.0: Feature parity + beyond all competitors

## Phases

### Phase 1: Project Scaffold (Tasks 1-2)
- [x] Init git repo
- [x] Create package.json, tsconfig.json, eslint.config.mjs, jest.config.js, .gitignore, index.js
- [x] Install dependencies
- [x] Create types.ts with all interfaces
- [x] Commit scaffold
- **Status:** complete
- **Plan reference:** Chunk 1, Tasks 1-2

### Phase 2: Shared Logic — Validators + Fallback (Tasks 3-4)
- [x] Write failing tests for validators (CNPJ checksum, CEP format)
- [x] Implement validators
- [x] Write failing tests for fallback logic (with fake timers)
- [x] Implement fallback
- [x] All tests pass, commit
- **Status:** complete
- **Plan reference:** Chunk 1, Tasks 3-4

### Phase 3: CNPJ Resource (Tasks 5-6)
- [x] Write failing tests for CNPJ normalizer (3 providers)
- [x] Implement normalizer
- [x] Create CNPJ description + execute handlers
- [x] Write tests for execute handlers
- [x] All tests pass, commit
- **Status:** complete
- **Plan reference:** Chunk 2, Tasks 5-6

### Phase 4: CEP Resource (Tasks 7-8)
- [x] Write failing tests for CEP normalizer (3 providers)
- [x] Implement normalizer
- [x] Create CEP description + execute handlers
- [x] Write tests for execute handlers
- [x] All tests pass, commit
- **Status:** complete
- **Plan reference:** Chunk 3, Tasks 7-8

### Phase 5: Node Assembly + Polish (Tasks 9-11)
- [x] Create BrasilHub.node.ts (router), .node.json (codex), .svg (icon)
- [x] Write node metadata tests
- [x] Build + lint + all tests pass
- [x] Create README.md (LICENSE already existed)
- [x] Verify dist structure
- [ ] Run @n8n/scan-community-package (not available as npm package)
- [x] Final commit
- **Status:** complete
- **Plan reference:** Chunk 4, Tasks 9-11

## Key Questions
1. `@n8n/node-cli` versão disponível? → Verificar no npm install
2. `n8n-node build` copia SVG automaticamente? → Verificar no Task 11
3. ESLint config flat (`eslint.config.mjs`) funciona com `@n8n/node-cli`? → Verificar no Task 9

## Decisions Made
| Decision | Rationale |
|----------|-----------|
| Operation values em inglês (query/validate) | n8n Cloud requer UI text em inglês |
| Icon em `nodes/BrasilHub/brasilHub.svg` | Starter template moderno coloca icon junto ao node |
| `_meta` e `_raw` como campos opcionais nos interfaces | Spec exige, corrigido na revisão do plano |
| Fake timers nos testes de fallback | Evita delay real de 1s entre retries |
| Testes para execute handlers | Corrigido na revisão — TDD exige cobertura de toda lógica |

## Errors Encountered
| Error | Attempt | Resolution |
|-------|---------|------------|
| TS2322: `_raw: unknown` incompatible with IDataObject | 1 | Cast `as IDataObject` on json and `_raw` |
| TS2322: IValidationResult missing index signature | 1 | Cast `as unknown as IDataObject` |
| TS2322: Error not assignable to NodeOperationError | 1 | Wrap in NodeOperationError in continueOnFail |
| ESLint: setTimeout restricted global | 1 | eslint-disable-next-line comment |
| ESLint: globalThis restricted | 1 | Reverted to setTimeout with eslint-disable |
| ESLint: _itemIndex unused | 1 | `void itemIndex` to acknowledge parameter |

### Phase 6: Documentation + Code Review
- [x] JSDoc em todos os 25 exports públicos
- [x] Code review: 6 findings identificados e corrigidos
  - Strategy semantics (direct vs fallback)
  - DRY: stripNonDigits extraído para shared/utils.ts
  - DRY: runWithTimers extraído para __tests__/helpers.ts
  - Dead parameter removido de queryWithFallback
  - Normalizers duplicados unificados (normalizeViaCepFormat)
- [x] 13 testes adicionados (36 → 49), cobertura 99.46%
- [x] Integration tests: BrasilHub.execute.spec.ts (8 cenários)
- **Status:** complete

### Phase 7: Security + Release v0.1.0
- [x] Security review manual (templates, CSP, inputs)
- [x] Automated security: gitleaks, trivy, npm audit — limpo
- [x] CHANGELOG atualizado para v0.1.0
- [x] Tag v0.1.0 + GitHub Release criada
- [ ] npm publish via release.yml (falhou — CI broken, corrigido na Phase 8)
- **Status:** complete (release criada, publish pendente re-trigger)

### Phase 8: CI/CD Fix
- [x] Diagnóstico: isolated-vm (native C++ addon) falha no Node < 22
- [x] Fix: --ignore-scripts em todos os npm ci do CI e release
- [x] Fix: mock isolated-vm no Jest (moduleNameMapper)
- [x] Drop Node 18 da matrix (EOL)
- [x] Release workflow atualizado para Node 22
- [x] CI verde confirmado: Lint ✓, Test Node 20 ✓, Test Node 22 ✓, Build ✓
- **Status:** complete

### Phase 9: Verification & Creator Portal Submission
- [x] Fix BLOCKER: removido `setTimeout` do fallback.ts (delay entre retries removido)
- [x] Fix: limpar aliases em português do codex (.node.json) → inglês only
- [x] Removido `jest.useFakeTimers()` e `runWithTimers` de todos os testes
- [x] Removido `__tests__/helpers.ts` (não mais necessário)
- [x] Build + lint + tests passando (49 tests, 0 errors)
- [x] Scan local contra dist/: ✅ 11 arquivos, 0 violações
- [ ] Publicar v0.1.1 com fixes
- [ ] Rodar `npx @n8n/scan-community-package n8n-nodes-brasil-hub` contra npm — deve passar
- [ ] Limpar /tmp/n8n-nodes-starter
- [ ] Submeter no n8n Creator Portal (https://creators.n8n.io/)
- **Status:** in_progress

### Phase 10: Quality Badges + Hardening
- [x] SonarCloud: workflow + sonar-project.properties, badge no README
- [x] OpenSSF Scorecard: workflow + badge (score subiu 5.6→6.7)
- [x] CII Best Practices: Passing badge (54/54 critérios)
- [x] Branch protection: Ruleset com PR required + status checks
- [x] v0.1.2 publicada com `attest-build-provenance` + npm provenance + GPG tag
- [x] Docs: GOVERNANCE.md, ROADMAP.md, SECURITY-ASSESSMENT.md
- **Status:** complete

### Phase 11: CI/CD Simplification
- [x] Removido Scorecard workflow + badges (over-engineering para o tamanho do projeto)
- [x] Removido CodeQL (SonarCloud já cobre SAST + quality gate)
- [x] Atualizado referências SLSA → attest-build-provenance em todos os docs
- [x] Adicionado `.claude/` e `reports/` ao .gitignore
- **Workflows finais:** ci.yml, sonarcloud.yml, release.yml (3 workflows)
- **Status:** complete

### Phase 12: Auditoria Completa Pré-Submissão
**Goal:** Validar tudo antes de submeter no Creator Portal.

#### Fase 1: Compliance & Segurança (bloqueia release)
- [ ] **1.1 n8n Node Compliance** — 17 checks (package.json, codex, icon, descriptions, ESLint)
  - [ ] name `n8n-nodes-*`, keyword `n8n-community-node-package`, MIT
  - [ ] n8n section com nodes paths corretos
  - [ ] Class name = filename, codex name match
  - [ ] SVG icon (não PNG)
  - [ ] resource/operation: `noDataExpression: true`, `action` em cada option
  - [ ] DisplayNames em Title Case
  - [ ] `constructExecutionMetaData` + `continueOnFail()`
  - [ ] Zero runtime dependencies
  - [ ] UI text em inglês
  - [ ] Sem globals restritos no dist/ (setTimeout, setInterval)
- [ ] **1.2 Security Review** — Input sanitization, SSRF, secrets, HTTP safety
- [ ] **Gate:** Zero findings Critical/High

#### Fase 2: Qualidade de Código (bloqueia release)
- [ ] **2.1 Testes** — Coverage ≥ 90% branches, edge cases
- [ ] **2.2 Build + Lint** — Limpos
- [ ] **2.3 JSDoc** — 100% funções/classes exportadas
- [ ] **Gate:** Coverage ≥ 90%, build + lint verdes

#### Fase 3: Build & CI
- [ ] `npm run build` — limpo
- [ ] `npm run lint` — limpo
- [ ] `npx jest --coverage` — verde
- [ ] `npm audit --audit-level=critical` — limpo
- [ ] Push + CI verde

#### Fase 4: Scan & Submissão
- [ ] `npx @n8n/scan-community-package n8n-nodes-brasil-hub@0.1.2` — passa
- [ ] Submeter no n8n Creator Portal (https://creators.n8n.io/)

**Status:** complete (v0.1.3 publicada, scan passed, submetida ao Creator Portal)

### Phase 13: Creator Portal Submission + Starter Template Alignment
- [x] Submetida v0.1.4 no Creator Portal → **REJEITADA** ("Some tests have failed")
- [x] Pesquisado `@n8n/scan-community-package` source code (13 ESLint rules, `allowInlineConfig: false`)
- [x] Pesquisado Creator Portal backend — closed-source (Strapi em api.n8n.io), pode ter checks adicionais
- [x] Comparado package.json com n8n-nodes-starter template — encontradas 3 diferenças:
  - `"main": "index.js"` (não existe no starter) → removido
  - `"files": ["dist/nodes"]` (starter usa `["dist"]`) → corrigido
  - `index.js` (não existe no starter) → deletado
- [x] Adicionado author email ao package.json (v0.1.4)
- [x] Alinhado package.json com starter template (v0.1.5)
- [x] `npx @n8n/scan-community-package n8n-nodes-brasil-hub@0.1.5` → **PASSED** ✅
- **Status:** complete
- **PRs:** #25 (author email), #26 (starter alignment)

### Phase 14: UX Guidelines Compliance
**Goal:** Corrigir violações das UX guidelines do n8n encontradas na auditoria.
- [x] Auditoria completa contra UX guidelines (3 violações encontradas)
- [x] **Fix 1:** Error message em fallback.ts — "All providers failed" → "No provider could fulfill the request" (evita palavras "error/failure")
- [x] **Fix 2:** Resource options sem description → adicionadas descriptions descritivas
- [ ] **Deferred:** Simplify/Output parameter para CNPJ query (>10 campos) — feature change maior, avaliar para v0.2
- [x] Commitar fixes → PR #27 (merged)
- [x] PR + merge + CI verde ✅
- [x] Release v0.1.6 → PR #28 (merged), tag v0.1.6, npm published ✅
- [ ] Resubmeter no Creator Portal
- **Status:** complete (release done, resubmission pending)

## Pending
- [ ] Creator Portal resubmission com v0.1.6

---

### Phase 16: v0.2.0 — Feature Parity + Beyond All Competitors
**Goal:** Oferecer tudo que qualquer concorrente oferece + features exclusivas. Após v0.2, nenhum outro node cobre mais endpoints ou tem mais qualidade.

**Competitive gap analysis:**
- cnpj-hub tem 6 CNPJ providers → nós teremos 6
- brasilapi-dv tem DDD, FIPE, Feriados → nós teremos todos
- ninguém tem CPF validate, Banks, testes, AI ready → continuamos únicos

#### 16.1 CPF Resource (local, sem API)
- [ ] RED: testes para `validateCpf()` (checksum, edge cases: 000.000.000-00, etc.)
- [ ] GREEN: implementar `validators.ts` + `cpf.description.ts` + `cpf.execute.ts`
- [ ] Registrar no router em `BrasilHub.node.ts`
- [ ] Adicionar types em `types.ts`
- **Providers:** nenhum (validação 100% local)
- **Operations:** validate

#### 16.2 Banks Resource (BrasilAPI + BancosBrasileiros)
- [ ] RED: testes para normalizers (2 providers) + execute
- [ ] GREEN: `banks.description.ts` + `banks.execute.ts` + `banks.normalize.ts`
- [ ] Registrar no router
- **Providers:** BrasilAPI (`/api/banks/v1/{code}`, `/api/banks/v1`) → BancosBrasileiros (raw JSON GitHub, 20+ campos)
- **Operations:** query (por código), list (todos os bancos, 1 item/banco)
- **Validação:** bank code deve ser inteiro positivo

#### 16.3 DDD Resource (BrasilAPI)
- [ ] RED: testes para normalizer + execute
- [ ] GREEN: `ddd.description.ts` + `ddd.execute.ts` + `ddd.normalize.ts`
- [ ] Registrar no router
- **Provider:** BrasilAPI (`/api/ddd/v1/{ddd}`) — único provider público disponível
- **Operations:** query
- **Validação:** 2 dígitos, range 11–99

#### 16.4 FIPE Resource (parallelum + BrasilAPI)
- [ ] RED: testes para normalizers (2 providers) + execute (4 operações)
- [ ] GREEN: `fipe.description.ts` + `fipe.execute.ts` + `fipe.normalize.ts`
- [ ] Registrar no router
- **Provider primário:** parallelum (`/fipe/api/v1/{tipo}/marcas/...`) — hierarquia completa
- **Provider fallback:** BrasilAPI (`/fipe/preco/v1/{codigoFipe}`) — lookup direto por código
- **Operations:** brands, models, years, price — 4 operações com displayOptions condicionais
- **Params:** vehicleType (Cars→carros, Motorcycles→motos, Trucks→caminhoes), brandCode, modelCode, yearCode
- **Validação:** brandCode/modelCode/yearCode non-empty conforme operação
- **Nota:** parallelum tem 500 req/dia free; BrasilAPI preenche gap para price por código direto

#### 16.5 Feriados Resource (BrasilAPI + Nager.Date)
- [ ] RED: testes para normalizers (2 providers) + execute
- [ ] GREEN: `feriados.description.ts` + `feriados.execute.ts` + `feriados.normalize.ts`
- [ ] Registrar no router
- **Providers:** BrasilAPI (`/api/feriados/v1/{ano}`) → Nager.Date (`date.nager.at/api/v3/PublicHolidays/{year}/BR`)
- **Operations:** query
- **Output:** Array → multiple items (1 item por feriado)
- **Validação:** ano 4 dígitos, range 1900–2199

#### 16.6 Additional CNPJ Providers (+4)
- [ ] RED: testes para normalizers dos 4 novos providers
- [ ] GREEN: adicionar normalizers em `cnpj.normalize.ts`
- [ ] Adicionar providers ao array em `cnpj.execute.ts`
- **Providers novos (appended após os 3 originais):**
  - MinhaReceita: `https://minhareceita.org/{cnpj}` (flat, snake_case)
  - OpenCNPJ.org: `https://api.opencnpj.org/{cnpj}` (flat, snake_case, 50 req/s)
  - OpenCNPJ.com: `https://kitana.opencnpj.com/cnpj/{cnpj}` (wrapped, camelCase, 100 req/min)
  - CNPJA: `https://open.cnpja.com/office/{cnpj}` (nested, camelCase, rate limit agressivo)
- **Resultado:** 7 providers total (mais que qualquer concorrente)

#### 16.6b Additional CEP Provider (+1)
- [ ] RED: testes para normalizer ApiCEP
- [ ] GREEN: adicionar normalizer em `cep.normalize.ts`
- [ ] Adicionar provider ao array em `cep.execute.ts`
- **Provider novo:** ApiCEP: `https://cdn.apicep.com/file/apicep/{XXXXX-XXX}.json`
- **Atenção:** CEP precisa de hífen (format XXXXX-XXX) — normalizer deve formatar
- **Resultado:** 4 providers CEP total

#### 16.7 Simplify Parameter para CNPJ
- [ ] Adicionar checkbox "Simplify" ao CNPJ query
- [ ] Quando ativo: retornar top-level flat (razao_social, situacao, cnpj)
- [ ] Quando desativo: retornar output completo (endereço, sócios, atividades)
- **Ref:** UX guidelines recomendam Simplify para >10 campos

#### 16.8 Error Messages com Contexto por Provider
- [ ] Incluir qual provider falhou e HTTP status no erro
- [ ] Melhorar mensagem final de fallback exhausted com lista de tentativas

#### 16.9 Release v0.2.0
- [ ] Atualizar CHANGELOG.md
- [ ] Bump version para 0.2.0
- [ ] Pre-release checklist (compliance, security, tests, build, lint)
- [ ] Tag + GitHub release + npm publish
- [ ] Verificar CI verde + scan passed

**Status:** pending

---

### Phase 17: v1.0 — Features Exclusivas (nenhum concorrente tem)
**Goal:** Consolidar liderança com features que ninguém mais oferece.

#### 17.1 IBGE Resource
- [ ] Cities, states, regions via BrasilAPI (`/api/ibge/municipios/v1/{siglaUF}`, `/uf/v1`)
- [ ] Operations: states (listar UFs), cities (listar municípios por UF)

#### 17.2 NCM Resource
- [ ] Tax classification codes via BrasilAPI (`/api/ncm/v1/{code}`, `/api/ncm/v1?search=`)
- [ ] Operations: query (por código), search (por descrição)

#### 17.3 Configurable Provider Order
- [ ] Param para usuário escolher provider primário
- [ ] Fallback segue ordem custom

#### 17.4 Configurable Timeout + Rate Limiting
- [ ] Timeout customizável por provider
- [ ] Respeitar HTTP 429 com backoff

**Status:** future

## Notes
- Plano detalhado: `docs/superpowers/plans/2026-03-10-n8n-nodes-brasil-hub.md`
- Spec de design: `docs/superpowers/specs/2026-03-10-n8n-nodes-brasil-hub-design.md`
- 11 tasks originais em 4 chunks + 3 fases pós-implementação
- TDD: red → green → commit em todas as tasks com código testável

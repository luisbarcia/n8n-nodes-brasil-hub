# Task Plan: n8n-nodes-brasil-hub

## Goal
Implementar o community node n8n "Brasil Hub" que consulta dados públicos brasileiros (CNPJ e CEP) com fallback multi-provider, seguindo todos os padrões oficiais n8n.

## Current Phase
Phase 11 (in_progress) — OpenSSF Scorecard Hardening (5.6 → 8+)

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

### Phase 10: Quality Badges (Codecov + SonarCloud + OpenSSF Scorecard)
- [x] Pesquisar requisitos de cada plataforma
- [x] Codecov: upload step no CI (codecov-action v5), badge no README
- [x] SonarCloud: workflow + sonar-project.properties, badge no README
- [x] OpenSSF Scorecard: workflow oficial (v2.4.3), badge no README
- [x] Fix SonarCloud findings: safeStr(), Number.parseInt, permissions job-level
- [x] Todos os 3 workflows verdes
- **Status:** complete

### Phase 11: OpenSSF Scorecard Hardening (5.6 → 8+)
**Goal:** Subir score de 5.6 para 8+ atacando os checks acionáveis.

**Scorecard atual (5.6/10):**
| Check | Score | Acionável? |
|-------|-------|-----------|
| Binary-Artifacts | 10 | -- |
| Dangerous-Workflow | 10 | -- |
| Dependency-Update-Tool | 10 | -- |
| License | 10 | -- |
| Packaging | 10 | -- |
| Pinned-Dependencies | 10 | -- |
| Security-Policy | 10 | -- |
| Token-Permissions | 9 | Minor |
| Vulnerabilities | 5 | **Sim** |
| Branch-Protection | 0 | **Sim** |
| Code-Review | 0 | Parcial (solo dev) |
| SAST | 0 | **Sim** |
| CII-Best-Practices | 0 | **Sim** |
| Fuzzing | 0 | Difícil |
| Maintained | 0 | Tempo (repo < 90 dias) |
| Contributors | 0 | Não (solo dev) |
| CI-Tests | -1 | Precisa de PRs |
| Signed-Releases | -1 | Timing |

**Tarefas (ordem de impacto):**
- [ ] **T1: Branch-Protection (0→10)** — Ativar branch protection rules no `main` via `gh api`
  - Require PR reviews (≥1)
  - Require status checks (CI, SonarCloud)
  - Require up-to-date branches
  - Enforce for admins
- [ ] **T2: SAST (0→10)** — Adicionar CodeQL Analysis workflow
  - SonarCloud já roda, mas Scorecard procura CodeQL/Semgrep especificamente
  - Criar `.github/workflows/codeql.yml`
- [ ] **T3: Vulnerabilities (5→10)** — Resolver 5 vulnerabilidades conhecidas
  - Identificar quais são (npm audit, Dependabot alerts)
  - Atualizar deps ou marcar como devDependency-only
- [x] **T4: CII-Best-Practices (0→10)** — Cadastrado no OpenSSF Best Practices
  - URL: https://www.bestpractices.dev/en/projects/12137
  - Badge passing: 54/54 critérios (100%)
- [ ] **T5: Signed-Releases (-1→10)** — Verificar se v0.1.1 com provenance satisfaz
  - Se não, criar release com signing explícito
- [ ] **T6: Token-Permissions (9→10)** — Auditar permissions em todos os workflows
- [ ] **T7: CI-Tests (-1→?)** — Criar PR de teste para que Scorecard detecte CI checks
- [ ] Verificar score atualizado no Scorecard
- **Status:** in_progress

## Pending
- [x] npm publish via release workflow — publicado com provenance
- [ ] Submeter no n8n Creator Portal para verificação
- [x] Actions atualizadas (checkout v6, setup-node v6, upload-artifact v7) — PRs #1-3 fechados

## Notes
- Plano detalhado: `docs/superpowers/plans/2026-03-10-n8n-nodes-brasil-hub.md`
- Spec de design: `docs/superpowers/specs/2026-03-10-n8n-nodes-brasil-hub-design.md`
- 11 tasks originais em 4 chunks + 3 fases pós-implementação
- TDD: red → green → commit em todas as tasks com código testável

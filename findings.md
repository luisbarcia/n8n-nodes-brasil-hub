# Findings & Decisions

## Requirements
- Community n8n node para dados públicos brasileiros
- v1.0: CNPJ + CEP (2 resources, 2 operations cada: Query + Validate)
- Multi-provider fallback automático (BrasilAPI primary)
- Output normalizado + opcional raw response
- Zero runtime dependencies
- MIT license, `usableAsTool: true`, compliance n8n Cloud
- TDD com Jest + ts-jest

## Research Findings
- **BrasilAPI** é o primary provider (volunteer-maintained, mas melhor aggregator)
- CNPJ providers: BrasilAPI → CNPJ.ws → ReceitaWS (3 schemas diferentes para normalizar)
- CEP providers: BrasilAPI → ViaCEP → OpenCEP (ViaCEP retorna `{erro: true}` quando não encontra)
- ViaCEP URL tem formato especial: `https://viacep.com.br/ws/{cep}/json` (suffix `/json`)
- Fallback: 1s delay entre retries, 10s timeout por request
- Headers: `Accept: application/json`, `User-Agent: n8n-brasil-hub-node/1.0`

## Technical Decisions
| Decision | Rationale |
|----------|-----------|
| Single node with resources | Padrão n8n (Google Sheets, Notion, Slack) — clean canvas |
| Dictionary map router | Padrão Evolution API (6.6M downloads/month) — extensível |
| BrasilAPI primary + 2 fallbacks | BrasilAPI é excelente mas volunteer-maintained |
| Local validation (no API) | Zero cost, previne requests inválidos |
| Normalized output default | 90% dos casos; raw via checkbox para debug |
| `@n8n/node-cli` para build/lint | CLI oficial n8n, garante compliance |
| Operation values em inglês | n8n Cloud exige UI text em inglês |
| Fake timers nos testes | Evita 1s real delay nos testes de fallback |

## Issues Encountered
| Issue | Resolution |
|-------|------------|
| Plano original tinha paths errados | Corrigido para `/Users/luismattos/Documents/Workspaces/luisbarcia/n8n-nodes-brasil-hub` |
| Tasks 6,8,9 sem testes (violava TDD) | Adicionados testes para execute handlers e node router |
| `types.ts` sem `_meta`/`_raw` | Adicionados como campos opcionais conforme spec |
| Testes fallback lentos (delay real) | Adicionado `jest.useFakeTimers()` + helper `runWithTimers` |
| `package.json` sem `"main"` | Adicionado `"main": "index.js"` |
| Spec diz operation em PT (consultar/validar) | Plano usa EN (query/validate) — correto pois UI deve ser em inglês |

## Discoverability Research (pre-release)

### Como n8n descobre community nodes
- GUI: Settings > Community Nodes > Browse → npm search com `keywords:n8n-community-node-package`
- 5,834+ community nodes (jan 2026), crescendo ~13.6/dia
- Verificação no Creator Portal dá badge "Verified" e acesso n8n Cloud (2,000 nodes)

### Campos package.json que afetam discoveribilidade
- **keywords**: `n8n-community-node-package` (obrigatório) + keywords de domínio
- **description**: Indexado pelo npm search, 30-150 chars
- **author.email**: Recomendado para verificação
- **repository**: GitHub URL válida

### Melhorias identificadas para nosso pacote
1. **Keywords de domínio**: Faltam brazil, cnpj, cep, brasilapi, receita-federal, viacep
2. **Codex metadata**: Faltam subcategories, alias para busca no editor n8n
3. **README Resources**: Faltam links para docs n8n, BrasilAPI, ViaCEP, etc
4. **Verificação n8n Cloud**: Submeter no Creator Portal pós-release

### Padrões de README de nodes populares
- Seções: Installation, Operations, Credentials, Compatibility, Usage, Resources
- Badges: npm version, CI status, license (já temos)
- Screenshots: Úteis mas só possíveis pós-install — adicionar depois
- Sem GIFs (problema de data load e manutenção)

## CI/CD Findings

### isolated-vm Problem
- `n8n-workflow` → `@n8n/ai-node-sdk` → `@n8n/ai-utilities` → `langchain` → `isolated-vm`
- `isolated-vm@6.0.2` é addon nativo C++ que exige Node >= 22 para compilar
- Nosso node **não usa** isolated-vm — só precisa dos tipos TypeScript
- **Solução:** `npm ci --ignore-scripts` + Jest `moduleNameMapper` apontando para `__mocks__/isolated-vm.js`
- Node 18 removido da matrix CI (EOL, deps transitivas exigem >= 20)

### CI/CD Monitoring Rule
- **Lição aprendida:** v0.1.0 foi lançada com CI e Release falhando
- Regra adicionada: sempre verificar `gh run list` após push/release
- Documentado em: CLAUDE.md, memory/MEMORY.md, ~/.claude/CLAUDE.md (global)

### n8n-node prerelease guard
- `@n8n/node-cli` injeta `"prepublishOnly": "n8n-node prerelease"` no starter template
- `n8n-node prerelease` imprime "Run `npm run release` to publish" e sai com exit code 1
- Isso bloqueia `npm publish` direto — design intencional para forçar uso de `npm run release`
- Mas `npm run release` (`n8n-node release`) não suporta `--provenance` (OIDC)
- **Solução:** `npm publish --ignore-scripts` no CI (já buildamos antes, guard desnecessário)

### npm token para CI publish
- Token npm precisa de **bypass 2FA** para publicar via CI (GitHub Actions)
- Tokens "Granular Access": habilitar "Bypass 2FA for automation" nas permissões
- Tokens "Classic/Automation": já bypassam 2FA por design
- Secret no GitHub: `NPM_TOKEN` em Settings → Secrets and variables → Actions

### Release workflow usa ref do tag
- `on: release: [published]` faz checkout do ref do tag, não de `main`
- Se corrigir workflows depois de criar o tag, o re-run ainda usa código antigo
- Precisa deletar tag + release e recriar no commit correto
- **Regra:** só tagar quando CI está verde em main

### Dependabot PRs
- actions/checkout v4 → v6, setup-node v4 → v6, upload-artifact v4 → v7
- Foram superados por commit manual `fd22874` que aplica os 3 bumps juntos
- PRs #1, #2, #3 fechados

## n8n Verification Guidelines (Creator Portal)

### Critérios de Verificação (extraídos de docs.n8n.io)
1. Usar `n8n-node` CLI tool para criar e verificar o pacote
2. Node NÃO pode ser duplicata de node existente (ok — Brasil Hub é único)
3. Sem Logic/Flow control nodes (ok — somos data lookup)
4. **Package source verification:**
   - npm repo URL deve bater com GitHub repo ✓
   - Author deve bater entre npm e repo ✓
   - Git link deve funcionar e repo deve ser público ✓
   - Documentação adequada (README) ✓
   - Licença MIT ✓
   - **Publicar via GitHub Action com provenance** ✓ (já fazemos)
5. **Zero dependências externas** ✓
6. **Sem acesso a env vars ou filesystem** ✓
7. **Linter deve passar:** `npx @n8n/scan-community-package n8n-nodes-brasil-hub`
8. **Tudo em inglês** — parâmetros, descrições, help text, erros, README
9. A partir de **1º maio 2026**, provenance será obrigatório (já temos!)

### Codex File (.node.json) Requirements
- `node`: nome do pacote (community nodes usam o nome do pacote npm)
- `nodeVersion`: deve bater com `version` no node principal (ex: "1.0")
- `codexVersion`: versão atual é "1.0"
- `categories`: deve usar nomes exatos — ex: "Data & Storage", "Development", "Utility"
- `subcategories`: subcategorias dentro da categoria
- `alias`: array de strings para busca no editor n8n
- `resources.primaryDocumentation`: link para docs do node

### Scan Results — Problemas Encontrados e Corrigidos
1. ~~**BLOCKER: ESLint `setTimeout` restrito**~~ ✅ FIXED — removido delay entre retries
   - `@n8n/scan-community-package` roda lint contra `dist/` com `allowInlineConfig: false`
   - eslint-disable comments são ignorados — única solução é eliminar o global
2. ~~**Aliases em português no codex**~~ ✅ FIXED — substituídos por inglês
   - De: `brasil, receita, empresa, endereco` → Para: `tax-id, zip-code`

### UX Guidelines Checklist (docs/reference/ux-guidelines.md)
- [x] Resource + Operation pattern (CNPJ, CEP × query, validate)
- [x] Title Case para displayName, Sentence case para descriptions
- [x] Placeholders com "e.g." — FIXED: adicionado `e.g.` prefix
- [x] Boolean descriptions começam com "Whether..." ✅ já seguia
- [x] Error messages seguem pattern: what happened + how to fix ✅ FIXED v0.1.6: "All providers failed" → "No provider could fulfill the request"
- [x] Error messages NÃO usam "error", "failure", "problem", "mistake" ✅ FIXED v0.1.6
- [ ] Delete operations retornam `{deleted: true}` — N/A (não temos delete)
- [x] Resource options têm description sub-text ✅ FIXED v0.1.6: adicionadas descriptions em CNPJ e CEP options
- [ ] Simplify parameter (>10 campos) — **DEFERRED para v0.2**: CNPJ query retorna ~15 campos top-level. UX guidelines recomendam Simplify para nodes normais ou Output para AI tool nodes. Avaliar na próxima minor.

### Code Standards Checklist (docs/reference/code-standards.md)
- [x] TypeScript strict mode
- [x] Resource + Operation pattern com displayOptions
- [x] Modular file structure (resources/cnpj/, resources/cep/)
- [x] Usa `context.helpers.httpRequest` (built-in, não lib externa)
- [x] Não muda incoming data (clone-safe)
- [x] Error handling com NodeOperationError + itemIndex

### Error Handling Checklist (docs/reference/error-handling.md)
- [x] NodeOperationError para validation failures
- [x] itemIndex passado em todos os erros
- [x] continueOnFail suportado
- [ ] NodeApiError para HTTP failures — atualmente usamos Error genérico no fallback (**TODO**: avaliar migrar)
- [x] Error messages descritivas

### Submission Checklist (docs/deploy/submit-community-nodes.md)
- [x] Package name começa com `n8n-nodes-` ✓
- [x] Keyword `n8n-community-node-package` ✓
- [x] Nodes/credentials listados no `n8n` attr do package.json ✓
- [x] Linter passa (`npm run lint`) ✓
- [x] Publicado no npm ✓
- [x] Publicado via GitHub Action com provenance ✓
- [x] MIT license ✓
- [x] README com docs ✓
- [ ] Scan passa (`npx @n8n/scan-community-package`) — passa local, precisa publicar v0.1.1

### Comparação package.json com Starter Template
- **Match:** `n8n.n8nNodesApiVersion: 1`, `n8n.strict: true`, `files: ["dist"]`, `peerDependencies`, scripts core
- **Divergências corrigidas (v0.1.5):**
  - `"main": "index.js"` — NÃO existe no starter → removido
  - `"files": ["dist/nodes"]` — starter usa `["dist"]` → corrigido
  - `index.js` na raiz — NÃO existe no starter → deletado
- **Extra nosso (ok):** keywords adicionais, scripts `test`/`test:watch`
- **Starter tem, nós não (ok):** `credentials` array (não temos credentials), `prettier`, `release-it`

### @n8n/scan-community-package — Análise Detalhada (v0.11.0)
**Como funciona:** Faz `npm pack --dry-run` para listar arquivos → roda ESLint contra todos `.js` com `allowInlineConfig: false`.

**13 regras ESLint (@n8n/community-nodes):**
1. `no-restricted-globals` — Bloqueia `setTimeout`, `setInterval`, `eval`, etc.
2. `no-restricted-imports` — Bloqueia `child_process`, `fs`, `net`, etc.
3. `credential-password-field` — Password fields devem ter `typeOptions: { password: true }`
4. `credential-test-required` — Credentials devem ter `test` property
5. `no-credential-reuse` — Cada node deve ter credentials próprias
6. `credential-documentation-url` — Credentials devem ter `documentationUrl`
7. `icon-validation` — SVG icon deve existir e ser válido
8. `node-usable-as-tool` — `usableAsTool: true` deve estar presente
9. `package-name-convention` — Package name deve começar com `n8n-nodes-`
10. `no-deprecated-workflow-functions` — Não usar helpers deprecated
11. `no-http-request-with-manual-auth` — Não fazer HTTP manual com credentials
12. `ai-node-package-json` — Validação do n8n section no package.json
13. `resource-operation-pattern` — Resource/operation devem seguir padrão

Também roda: `no-console: error` em todos os arquivos.

**Importante:** `allowInlineConfig: false` significa que `eslint-disable` comments no source NÃO funcionam — o código compilado não pode ter globals restritos.

### Creator Portal Backend
- **Closed-source** — Strapi backend em `api.n8n.io`
- Roda `@n8n/scan-community-package` + possivelmente checks adicionais
- Pode verificar: package source, provenance, author matching, npm metadata
- **Sem documentação pública** sobre checks adicionais além do scan tool
- **Canal de suporte:** Discord `#community-nodes`

## Quality Badges Research

### Codecov
- Action: `codecov/codecov-action@v5` — token opcional para repos públicos
- Upload: `coverage/lcov.info` (Jest já gera com `--coverage`)
- Badge: `[![codecov](https://codecov.io/gh/luisbarcia/n8n-nodes-brasil-hub/graph/badge.svg)](https://codecov.io/gh/luisbarcia/n8n-nodes-brasil-hub)`
- Config file (`codecov.yml`): opcional

### SonarCloud
- Action: `SonarSource/sonarqube-scan-action@v7` (antiga `sonarcloud-github-action` deprecated)
- **Requer SONAR_TOKEN** — criar em sonarcloud.io > My Account > Security
- **Requer setup manual**: criar projeto em sonarcloud.io primeiro
- Config: `sonar-project.properties` no root
- `sonar.sources` deve apontar para `nodes/` (não `src/`)
- Badge: `[![Quality Gate](https://sonarcloud.io/api/project_badges/measure?project=KEY&metric=alert_status)](https://sonarcloud.io/dashboard?id=KEY)`

### OpenSSF Scorecard
- Action: `ossf/scorecard-action@v2.4.3` — sem token extra (usa GITHUB_TOKEN)
- Permissions: `contents: read`, `security-events: write`, `id-token: write`
- `publish_results: true` publica automaticamente na API OpenSSF
- Recomenda schedule semanal + push on main
- Upload SARIF para GitHub Code Scanning via `github/codeql-action/upload-sarif@v3`
- Badge: `[![OpenSSF Scorecard](https://api.scorecard.dev/projects/github.com/luisbarcia/n8n-nodes-brasil-hub/badge)](https://scorecard.dev/viewer/?uri=github.com/luisbarcia/n8n-nodes-brasil-hub)`

### Decisão: SonarCloud requer setup manual externo
- Codecov e OpenSSF: podem ser configurados 100% via código
- SonarCloud: usuário precisa criar conta + projeto + gerar token
- **Plano:** configurar os 3 workflows, marcar SonarCloud como pendente de setup manual

## OpenSSF Scorecard Hardening Research

### Score atual: 5.6/10 (18 checks)
- 7 checks com nota 10 (já perfeitos)
- 4 checks com nota 0 (acionáveis: Branch-Protection, SAST, CII-Best-Practices, Code-Review)
- 2 checks inconclusivos (-1: CI-Tests, Signed-Releases)
- Vulnerabilities: 5/10 (5 vulns conhecidas)

### Branch-Protection (0→10)
- Scorecard verifica: require PR reviews, status checks, up-to-date, admin enforcement
- API: `gh api repos/{owner}/{repo}/branches/main/protection -X PUT`
- Solo dev: pode configurar self-review (PR required mas pode aprovar próprio)
- Alternativa: Settings → Branches → Add rule no GitHub UI

### SAST (0→10)
- Scorecard procura especificamente: CodeQL, Semgrep, Snyk, SonarCloud (via SARIF)
- SonarCloud já roda mas **não faz upload de SARIF para Code Scanning** → Scorecard não detecta
- CodeQL é o mais simples de adicionar (GitHub nativo, gratuito para public repos)
- Action: `github/codeql-action/init`, `analyze` — suporta TypeScript via `javascript`

### Vulnerabilities (5→10) — BLOQUEADO POR UPSTREAM

**Status: NÃO ACIONÁVEL — depende de fix upstream pelo time do n8n.**

Todas as 13 vulns são devDependencies transitivas que **não vão no pacote publicado** (`files: ["dist/nodes"]`). Risco real de segurança: zero.

| Vuln | Severidade | Cadeia de deps | Pacote raiz (devDep) |
|------|-----------|----------------|---------------------|
| minimatch ReDoS (3 CVEs) | High (5) | `eslint-plugin-n8n-nodes-base` → `@typescript-eslint/utils` → `minimatch 9.0.x` | `@n8n/node-cli` |
| @langchain/community SSRF | Moderate (3) | `@n8n/ai-node-sdk` → `@langchain/community` | `@n8n/node-cli` |
| file-type infinite loop | Moderate (3) | `@ibm-cloud/watsonx-ai` → `ibm-cloud-sdk-core` → `file-type` | `@n8n/node-cli` |
| langsmith SSRF | Moderate (2) | `@langchain/classic` → `langsmith` | `@n8n/node-cli` |

**Por que não corrigir localmente:**
- `npm audit fix` tenta atualizar transitivas fora das ranges de peer deps → quebra `@n8n/node-cli`
- `overrides` em package.json causa desync do lock file e conflitos de peer deps (testado e revertido na sessão anterior)
- Todas as vulns vêm de `@n8n/node-cli` ou `eslint-plugin-n8n-nodes-base` — só o time do n8n pode atualizar

**Quando re-avaliar:**
- Quando `@n8n/node-cli` lançar nova versão → rodar `npm update @n8n/node-cli` e re-testar
- Monitorar via Dependabot (já configurado, PRs automáticos)
- Scorecard OSV re-avalia semanalmente

**Impacto no Scorecard:** ~5/10 no check Vulnerabilities. Aceitar como limitação até fix upstream.

### CII-Best-Practices (0→?)
- URL: https://www.bestpractices.dev/en/projects
- Questionário: ~60 perguntas sobre qualidade, segurança, documentação
- Muitas já atendemos (MIT license, CI, tests, security policy, etc.)
- Badge "passing" requer ~67% das perguntas respondidas positivamente
- Ação manual do usuário (precisa cadastrar e preencher)

### Signed-Releases (-1→10)
- Scorecard verifica se releases têm assinaturas (cosign, GPG, Sigstore)
- npm publish com `--provenance` gera attestation OIDC (Sigstore-based)
- v0.1.1 já publicou com provenance — o Scorecard pode não ter re-avaliado ainda
- Alternativa: `gh attestation verify` para confirmar

### Codecov → Coveralls Migration
- Codecov Project Coverage requer Pro plan ($12/user/mês) — badge ficava "unknown"
- Coveralls é gratuito para repos públicos, badge mostra 97%
- Codecov Test Analytics mantido (funciona no free tier)
- Coveralls action: `coverallsapp/github-action@v2.3.6` com `github-token` automático

## CII Best Practices — Silver Level Criteria

**Pré-requisito:** Badge Passing ✅ (54/54, 100%)
**URL:** https://www.bestpractices.dev/en/projects/12137/silver/edit

### BASICS

| Critério | Status | Justificativa |
|----------|--------|---------------|
| achieve_passing | ✅ Met | Badge Passing 100% |
| contribution_requirements | ✅ Met | CONTRIBUTING.md com coding standards, lint, test requirements |
| dco | ✅ Met | DCO sign-off via Co-Authored-By; MIT license cobre contribuições |
| governance | ✅ Met | GOVERNANCE.md (BDFL model) |
| code_of_conduct | ✅ Met | .github/CODE_OF_CONDUCT.md (Contributor Covenant v2.1) |
| roles_responsibilities | ✅ Met | GOVERNANCE.md documenta roles (Maintainer BDFL + Contributor) |
| access_continuity | ❌ Difícil | Solo dev — sem backup maintainer |
| bus_factor | ❌ Difícil | Solo dev — bus factor = 1 |
| documentation_roadmap | ✅ Met | ROADMAP.md com v0.2 e v1.0 plans |
| documentation_architecture | ✅ Met | CLAUDE.md documenta arquitetura detalhada |
| documentation_security | ✅ Met | SECURITY.md documenta política de segurança |
| documentation_quick_start | ✅ Met | README tem Installation + Operations sections |
| documentation_current | ✅ Met | Living Docs pattern mantém docs atualizados |
| documentation_achievements | ✅ Met | Badges no README com hyperlinks |
| accessibility_best_practices | N/A | CLI node, não UI |
| internationalization | N/A | n8n exige inglês; dados são pt-BR por natureza |
| sites_password_security | N/A | Não armazenamos passwords |

### CHANGE CONTROL

| Critério | Status | Justificativa |
|----------|--------|---------------|
| maintenance_or_update | ✅ Met | Semver + CHANGELOG.md documentam breaking changes |

### REPORTING

| Critério | Status | Justificativa |
|----------|--------|---------------|
| report_tracker | ✅ Met | GitHub Issues habilitado |
| vulnerability_report_credit | ✅ Met | SECURITY.md menciona crédito a reporters |
| vulnerability_response_process | ✅ Met | SECURITY.md com timeline (48h ack, 1 week assessment, 30 days fix) |

### QUALITY

| Critério | Status | Justificativa |
|----------|--------|---------------|
| coding_standards | ✅ Met | ESLint config @n8n/node-cli documentado em CONTRIBUTING.md |
| coding_standards_enforced | ✅ Met | ESLint no CI, pre-commit checks |
| build_standard_variables | N/A | Não é C/C++ native binary |
| build_preserve_debug | N/A | TypeScript → JS transpilation |
| build_non_recursive | N/A | npm/tsc build, não make |
| build_repeatable | ✅ Met | package-lock.json + npm ci = builds reproduzíveis |
| installation_common | ✅ Met | npm install n8n-nodes-brasil-hub |
| installation_standard_variables | N/A | npm handles this |
| installation_development_quick | ✅ Met | npm install + npm test (README documenta) |
| external_dependencies | ✅ Met | package.json + package-lock.json |
| dependency_monitoring | ✅ Met | Dependabot + npm audit no CI |
| updateable_reused_components | ✅ Met | npm update, lockfile |
| interfaces_current | ✅ Met | Sem uso de APIs deprecated |
| automated_integration_testing | ✅ Met | Jest CI em cada push/PR |
| regression_tests_added50 | ✅ Met | Todos os bugs corrigidos tiveram testes adicionados |
| test_statement_coverage80 | ✅ Met | 99.46% statement coverage |
| test_policy_mandated | ✅ Met | TDD mandatório documentado em CONTRIBUTING.md |
| tests_documented_added | ✅ Met | CONTRIBUTING.md exige testes para novas features |
| warnings_strict | ✅ Met | TypeScript strict mode + ESLint strict |

### SECURITY

| Critério | Status | Justificativa |
|----------|--------|---------------|
| implement_secure_design | ✅ Met | Input validation, zero deps, least privilege |
| crypto_weaknesses | N/A | Não usa criptografia própria |
| crypto_algorithm_agility | N/A | Não usa criptografia |
| crypto_credential_agility | N/A | Não usa credentials próprias |
| crypto_used_network | ✅ Met | Todas as APIs usam HTTPS |
| crypto_tls12 | ✅ Met | Node.js >= 20 usa TLS 1.2+ por default |
| crypto_certificate_verification | ✅ Met | Node.js verifica certificados por default |
| crypto_verification_private | N/A | Não envia cookies/tokens |
| signed_releases | ✅ Met | npm --provenance + GitHub attestation (`attest-build-provenance`); verificação documentada em SECURITY.md |
| version_tags_signed | ✅ Met | v0.1.2 assinada com GPG via `.envrc` config |
| input_validation | ✅ Met | CNPJ checksum + CEP format validation antes de API calls |
| hardening | ✅ Met | Zero deps, input validation, TypeScript strict |
| assurance_case | ✅ Met | SECURITY-ASSESSMENT.md com threat model, trust boundaries, design principles |

### ANALYSIS

| Critério | Status | Justificativa |
|----------|--------|---------------|
| static_analysis_common_vulnerabilities | ✅ Met | SonarCloud no CI |
| dynamic_analysis_unsafe | N/A | TypeScript, não C/C++ |

### Resumo Silver

| Status | Count |
|--------|-------|
| ✅ Met | 35 |
| ⚠️ Parcial | 1 |
| ❌ Unmet/Difícil | 2 |
| N/A | 12 |

**Bloqueios restantes para Silver:**
1. **version_tags_signed** — Usar `git tag -s` (GPG) para releases futuras
2. **bus_factor / access_continuity** — Solo dev (SHOULD, não MUST — não bloqueia badge)

---

## CII Best Practices — Gold Level Criteria

**Pré-requisito:** Badge Silver
**URL:** https://www.bestpractices.dev/en/projects/12137/gold/edit

### BASICS

| Critério | Status | Justificativa |
|----------|--------|---------------|
| achieve_silver | ❌ Unmet | Precisa Silver primeiro |
| bus_factor | ❌ Difícil | Solo dev — bus factor = 1, Gold exige 2+ |
| contributors_unassociated | ❌ Difícil | Solo dev — precisa 2+ contribuidores de orgs diferentes |
| copyright_per_file | ⚠️ Parcial | Não temos header de copyright por arquivo (SPDX recomendado) |
| license_per_file | ⚠️ Parcial | Não temos SPDX-License-Identifier por arquivo |

### CHANGE CONTROL

| Critério | Status | Justificativa |
|----------|--------|---------------|
| repo_distributed | ✅ Met | Git (distributed VCS) |
| small_tasks | ⚠️ Parcial | Não temos "good first issue" labels |
| require_2FA | ✅ Met | GitHub 2FA habilitado |
| secure_2FA | ✅ Met | GitHub suporta TOTP/WebAuthn (criptográfico) |

### QUALITY

| Critério | Status | Justificativa |
|----------|--------|---------------|
| code_review_standards | ⚠️ Parcial | Temos Ruleset com PR required, mas não documentamos processo formal |
| two_person_review | ❌ Difícil | Solo dev — impossível sem 2º reviewer |
| build_reproducible | ✅ Met | package-lock.json + npm ci |
| test_invocation | ✅ Met | `npm test` (padrão npm) |
| test_continuous_integration | ✅ Met | GitHub Actions CI em cada push/PR |
| test_statement_coverage90 | ✅ Met | 99.46% statement coverage |
| test_branch_coverage80 | ✅ Met | Cobertura alta (99%+) |

### SECURITY

| Critério | Status | Justificativa |
|----------|--------|---------------|
| crypto_used_network | ✅ Met | HTTPS only |
| crypto_tls12 | ✅ Met | Node.js >= 20 |
| hardened_site | ⚠️ Parcial | GitHub Pages/npm — não controlamos headers diretamente |
| security_review | ✅ Met | Security review documentado (Phase 7 do task_plan) |
| hardening | ✅ Met | Input validation, zero deps, TypeScript strict |

### ANALYSIS

| Critério | Status | Justificativa |
|----------|--------|---------------|
| dynamic_analysis | ⚠️ Parcial | Jest testa runtime, mas não temos fuzzer/scanner dedicado |
| dynamic_analysis_enable_assertions | N/A | TypeScript, não C/C++ |

### Resumo Gold

| Status | Count |
|--------|-------|
| ✅ Met | 10 |
| ⚠️ Parcial | 5 |
| ❌ Difícil/Unmet | 4 |
| N/A | 1 |

**Bloqueios HARD para Gold (solo dev):**
1. **bus_factor ≥ 2** — Precisa de 2º maintainer
2. **contributors_unassociated** — Precisa de contribuidores de orgs diferentes
3. **two_person_review** — Precisa de 2º reviewer para 50%+ dos PRs

**Bloqueios SOFT para Gold (acionáveis):**
1. **copyright_per_file + license_per_file** — Adicionar SPDX headers
2. **code_review_standards** — Documentar processo
3. **small_tasks** — Adicionar "good first issue" labels
4. **hardened_site** — Limitação da plataforma (GitHub/npm)
5. **dynamic_analysis** — Considerar property-based testing (fast-check)

### Recomendação

**Silver é alcançável** para solo dev — os bloqueios são documentação (governance, roadmap, threat model, code of conduct) + signed tags. Bus factor e access_continuity são SHOULD, não MUST.

**Gold é praticamente impossível** para solo dev — bus_factor=2, contributors_unassociated, e two_person_review são MUST. Precisaria de pelo menos 1 co-maintainer ativo.

**Plano recomendado:**
1. Conquistar Silver (criar ~5 documentos + signed tags)
2. Gold só quando/se o projeto tiver co-maintainers

---

## Competitive Analysis: n8n-nodes-cnpj-hub (dssiqueira)

**Repo:** https://github.com/dssiqueira/n8n-nodes-cnpj-hub
**npm:** n8n-nodes-cnpj-hub@0.1.0 (única release, ago/2025)
**Autor:** Douglas Siqueira (doug@dsiqueira.com)

### Metadata

| | **cnpj-hub** | **brasil-hub** (nosso) |
|---|---|---|
| Versão npm | 0.1.0 (1 release) | 0.1.6 (7 releases) |
| Tooling | tsc + gulp + rimraf + prettier | `@n8n/node-cli` (oficial) |
| ESLint | `eslint-plugin-n8n-nodes-base` (legacy) | `@n8n/node-cli` config (atual) |
| `n8n.strict` | Ausente | `true` |
| `main` | `"index.js"` | Removido (starter template) |
| Testes | Zero | 60 testes, 100% coverage |
| CI/CD | Nenhum | GitHub Actions (CI + SonarCloud + Release) |

### Arquitetura

| | **cnpj-hub** | **brasil-hub** |
|---|---|---|
| Estrutura | 1 arquivo monolítico (591 linhas) | Modular: router + resources/ + shared/ |
| Resources | Apenas CNPJ | CNPJ + CEP |
| Operations | `consultarCnpj` (1 op) | `query` + `validate` (2 ops × 2 resources) |
| Providers CNPJ | 6 (cnpjws, cnpja, minhareceita, brasilapi, receitaws, opencnpj) | 3 (brasilapi, cnpjws, receitaws) |
| Fallback | Inline no execute, com `setTimeout` | Módulo separado (`shared/fallback.ts`) |
| Normalização | Switch/case monolítico (~240 linhas) | Funções por provider em arquivo separado |
| Validação local | Apenas length check (14 dígitos) | Checksum CNPJ + format CEP (local, sem API) |
| `usableAsTool` | Ausente | `true` |
| Type safety | ~10 `any` types | Zero `any` (`unknown` + narrowing) |

### UX / Compliance

| | **cnpj-hub** | **brasil-hub** |
|---|---|---|
| `setTimeout` | Usa (delay entre requests) | Não usa (proibido pelo scan) |
| Error handling | `ApplicationError` genérico | `NodeOperationError` + `itemIndex` |
| `continueOnFail` | Parcial (sem `pairedItem`) | Completo (`pairedItem` + typed `error`) |
| `_meta` fields | Português (`api_utilizada`) | Inglês (`provider`, `strategy`) |
| Rate limit delay | Exposto ao usuário | Nenhum (APIs públicas gratuitas) |
| Node description | Português | Inglês (n8n Cloud requirement) |
| `group` | `['transform']` | `[]` (correto) |

### Problemas de compliance no cnpj-hub (que o scan pegaria)

1. `setTimeout` — global restrito, scan falha imediatamente
2. `error.message` sem type guard — `error` é `unknown` em strict mode
3. Sem `usableAsTool` — falha regra `node-usable-as-tool`
4. `main: "index.js"` — diverge do starter template
5. Codex `node: "n8n-nodes-base.CNPJHUB"` — deveria ser o package name

### Providers que cnpj-hub tem e nós não

| Provider | URL pattern | Notas |
|----------|------------|-------|
| CNPJA | `https://open.cnpja.com/office/{cnpj}` | API com rate limit agressivo |
| MinhaReceita | `https://minhareceita.org/{cnpj}` | Open source, self-hosted ou público |
| OpenCNPJ | `https://api.opencnpj.org/{cnpj}` | Dados de bases abertas |

**Oportunidade futura (v0.2):** Adicionar esses 3 providers ao CNPJ — a arquitetura aceita sem tocar código existente (1 normalizer + 1 entry no array de providers).

## Competitive Analysis: n8n-nodes-cnpj (Integreme)

**Repo:** https://github.com/Integreme/integreme-cnpj
**npm:** n8n-nodes-cnpj@1.0.0 (única release, fev/2024)
**Autor:** Integre.me (dev@integre.me)
**Downloads último mês:** 5.701 (líder do segmento)

### Análise Técnica

| | **n8n-nodes-cnpj** | **brasil-hub** (nosso) |
|---|---|---|
| Versão | 1.0.0 (1 release, fev 2024) | 0.1.6 (7 releases) |
| Resources | Apenas CNPJ | CNPJ + CEP |
| Operations | Query (1 op) | Query + Validate (2 ops × 2 resources) |
| Providers | 1 (cnpj.ws) | 3 + fallback automático |
| Fallback | Nenhum | Automático com retry |
| Validação | Nenhuma (envia direto à API) | Checksum local + format check |
| HTTP client | `this.helpers.request()` (OBSOLETO — removido n8n v1) | `httpRequest()` (moderno) |
| Import | `request-promise-native` (deprecated) | Nenhum import externo |
| `usableAsTool` | Ausente | `true` |
| `constructExecutionMetaData` | Ausente | Presente (paired items) |
| Testes | Zero | 60+ testes, 100% coverage |
| CI/CD | Nenhum | GitHub Actions completo |
| Tooling | tsc + gulp + prettier | `@n8n/node-cli` (oficial) |
| TypeScript | 5.8 | 5.8 |

### Problemas Críticos

1. **`this.helpers.request()`** — API removida no n8n v1. O node **quebra** em n8n v1+
2. **`request-promise-native`** — Pacote deprecated desde 2020
3. **`returnData.push({ json: responseData })` → `returnJsonArray(returnData)`** — Double-wrapping: `returnJsonArray` já cria `{json}` wrappers, mas `returnData` já contém objetos `{json}`. Output é `{json: {json: data}}`
4. **Sem `continueOnFail` robusto** — Não inclui `pairedItem` no output de erro
5. **Sem fallback** — Se cnpj.ws cair, não retorna dados
6. **Sem validação** — CNPJ inválido gasta request desnecessariamente

### Por que tem mais downloads

- Publicado há 2+ anos (fev 2024) — first mover advantage
- Nome simples "cnpj" — aparece em buscas genéricas
- Integre.me é empresa brasileira de automação, possível base de usuários própria

---

## Competitive Analysis: n8n-nodes-brasilapi-dv (diversao)

**Repo:** https://github.com/diversao/n8n-nodes-brasilapi
**npm:** n8n-nodes-brasilapi-dv@1.1.4 (6 releases, jul/2025)
**Autor:** Gabryel Goncalves (diversao)
**Downloads último mês:** 74

### Análise Técnica

| | **brasilapi-dv** | **brasil-hub** (nosso) |
|---|---|---|
| Versão | 1.1.4 (6 releases) | 0.1.6 (7 releases) |
| Arquitetura | 6 nodes separados (1 por endpoint) | 1 node unificado com resources |
| Endpoints | CEP v1, CEP v2, DDD, CNPJ, FIPE, Feriados | CNPJ, CEP (v0.1); DDD, Banks planejados (v0.2) |
| Providers | 1 (BrasilAPI) | 3 por resource + fallback |
| Fallback | Nenhum | Automático |
| Validação | Nenhuma | Checksum + format local |
| HTTP client | `httpRequest()` (moderno) | `httpRequest()` (moderno) |
| `usableAsTool` | Ausente | `true` |
| `constructExecutionMetaData` | Ausente | Presente |
| Error handling | `catch → push {error}` (silencia erros) | `NodeOperationError` + `itemIndex` + `continueOnFail` |
| `continueOnFail` | Não implementado | Completo |
| Testes | Zero | 60+ testes, 100% coverage |
| CI/CD | Nenhum | GitHub Actions completo |
| Runtime deps | `n8n-core` + `n8n-workflow` como dependencies (errado) | Zero (`n8n-workflow` como peerDep) |
| Descriptions | Português | Inglês (n8n Cloud) |
| `noDataExpression` | Ausente em todos os params | `true` em resource/operation |
| Options descriptions | Ausente | Presente |
| Codex file | Nenhum | `.node.json` com categories e aliases |

### Problemas Críticos

1. **6 nodes separados** — Anti-pattern n8n. Um node por endpoint polui o canvas (Google Sheets, Notion, Slack usam resource/operation pattern)
2. **`n8n-core` como dependency** — Deve ser peerDependency. Bundling n8n-core no dist é desnecessário e arriscado
3. **Sem codex files** — Nodes não têm metadata, não aparecem em categorias/buscas
4. **`export default`** — n8n espera named exports (class name = filename)
5. **Descriptions em português** — Bloqueia uso no n8n Cloud
6. **Sem `continueOnFail`** — Erros silenciados em vez de reportados ao workflow
7. **`'main' as NodeConnectionType`** — Cast desnecessário, poderia usar `NodeConnectionTypes.Main`
8. **Fipe.node.ts** — Parâmetros condicionais (marca/modelo/ano) sem `displayOptions`, sempre visíveis

### Pontos Positivos

- Cobertura mais ampla de endpoints BrasilAPI (6 endpoints)
- FIPE é um recurso útil que poucos oferecem
- Feriados com output item-per-item (Array → multiple items) — boa prática UX
- Usa `httpRequest()` moderno (ao contrário do Integreme)

---

## Competitive Analysis: @gustavojosemelo/n8n-nodes-cnpj-biz-api

**npm:** @gustavojosemelo/n8n-nodes-cnpj-biz-api@0.0.3 (mar/2026)
**Repo:** Não encontrado (privado ou inexistente)
**Downloads último mês:** Não disponível (scoped package)

### O que sabemos

- Wrapper para CNPJ.biz API v2
- **Requer credentials/API key** (não é público)
- Scoped package (`@gustavojosemelo/`) — fora da convenção `n8n-nodes-*`
- Versão 0.0.3 — muito early stage
- Sem repo público para análise de código

### Diferença Fundamental

CNPJ.biz é API paga/com autenticação — nosso foco são APIs públicas sem credenciais. Não é concorrente direto.

---

## Competitive Landscape Summary

### Downloads (último mês, fev-mar 2026)

| Package | Downloads/mês | Releases | Primeiro release |
|---------|--------------|----------|-----------------|
| n8n-nodes-cnpj (Integreme) | 5.701 | 1 | Fev 2024 |
| n8n-nodes-cnpj-hub (dssiqueira) | 257 | 1 | Ago 2025 |
| n8n-nodes-brasilapi-dv (diversao) | 74 | 6 | Jul 2025 |
| n8n-nodes-brasil-hub (nosso) | — | 7 | Mar 2026 |
| @gustavojosemelo/cnpj-biz-api | — | 3 | Mar 2026 |

### Feature Matrix

| Feature | brasil-hub | cnpj (Integreme) | cnpj-hub (dssiqueira) | brasilapi-dv |
|---------|-----------|-------------------|----------------------|-------------|
| CNPJ Query | ✅ | ✅ | ✅ | ✅ |
| CNPJ Validate | ✅ | ❌ | ❌ | ❌ |
| CEP Query | ✅ | ❌ | ❌ | ✅ |
| CEP Validate | ✅ | ❌ | ❌ | ❌ |
| DDD Query | 🔜 v0.2 | ❌ | ❌ | ✅ |
| FIPE Query | 🔜 v1.0 | ❌ | ❌ | ✅ |
| Feriados | — | ❌ | ❌ | ✅ |
| Banks | 🔜 v0.2 | ❌ | ❌ | ❌ |
| Multi-provider fallback | ✅ (3) | ❌ (1) | ✅ (6) | ❌ (1) |
| Local validation | ✅ | ❌ | Parcial | ❌ |
| AI Agent ready | ✅ | ❌ | ❌ | ❌ |
| Tests | 60+ (100%) | 0 | 0 | 0 |
| CI/CD | ✅ | ❌ | ❌ | ❌ |
| SonarCloud | ✅ | ❌ | ❌ | ❌ |
| npm provenance | ✅ | ❌ | ❌ | ❌ |
| n8n Cloud ready | ✅ | ❌ | ❌ | ❌ |
| Modern HTTP API | ✅ | ❌ | ✅ | ✅ |
| Normalized output | ✅ | ❌ | ✅ | ❌ |

### Vantagens Competitivas do brasil-hub

1. **Único com testes e CI/CD** — nenhum concorrente tem sequer 1 teste
2. **Único AI Agent ready** (`usableAsTool: true`)
3. **Único com multi-resource** (CNPJ + CEP no mesmo node, extensível)
4. **Único com validação local** (economiza API calls)
5. **Único com npm provenance** e attestation (supply chain security)
6. **Único com SonarCloud** e análise estática
7. **Único pronto para n8n Cloud** (inglês, compliance, scan passa)

### Oportunidades Identificadas

1. **Adicionar 3 CNPJ providers** (CNPJA, MinhaReceita, OpenCNPJ) — equalizar com cnpj-hub nos fallbacks (v0.2)
2. **DDD + Banks** — endpoints simples que brasilapi-dv já cobre (v0.2)
3. **FIPE** — recurso diferencial, alto valor (v1.0)
4. **Feriados** — possível adição futura (baixa prioridade)

---

## API Provider Research (v0.2 preparation)

### Providers por recurso — resultado da pesquisa

| Recurso | Providers viáveis (sem auth, gratuitos) |
|---------|----------------------------------------|
| CNPJ | BrasilAPI, CNPJ.ws, ReceitaWS, MinhaReceita, OpenCNPJ.org, OpenCNPJ.com (kitana), CNPJA — **7 total** |
| CEP | BrasilAPI, ViaCEP, OpenCEP, ApiCEP (cdn.apicep.com) — **4 total** |
| FIPE | parallelum.com.br (hierarquia completa), BrasilAPI (price por código) — **2 total** |
| Feriados | BrasilAPI, Nager.Date (date.nager.at) — **2 total** |
| Banks | BrasilAPI, BancosBrasileiros (raw JSON GitHub, guibranco) — **2 total** |
| DDD | BrasilAPI — **1 total** (único público) |
| CPF | Nenhum (validação local only) |
| IBGE (v1.0) | IBGE API Oficial (servicodados.ibge.gov.br), BrasilAPI (wrapper) — **2 total** |

### Achados notáveis

- **parallelum.com.br** — Resolve gap da BrasilAPI no FIPE: tem endpoint de Years + navegação hierárquica completa (marca→modelo→ano→preço). 500 req/dia free
- **BancosBrasileiros** (GitHub guibranco) — 20+ campos por banco vs 4 da BrasilAPI. Atualizado diariamente por automação
- **Nager.Date** — Open source, 100+ países, campos extras (fixed/moveable, counties, types)
- **ApiCEP** — CEP precisa de hífen (XXXXX-XXX). Campos em inglês (state, city, district)
- **OpenCNPJ.com** — Diferente do .org! Host `kitana.opencnpj.com`, camelCase, wrapped response, 100 req/min
- **IBGE API Oficial** — Mais rica que wrapper BrasilAPI (hierarquia completa: município→microrregião→mesorregião→estado→região)

### APIs descartadas (requerem auth ou pagas)

CEP: Correios (contrato), CEP Aberto (token), Webmania (app_key), AutoCEP (chave)
CNPJ: SERPRO (contrato), CPF.CNPJ (pago), Brasil Aberto (401)
CEP instáveis: Postmon (503 no teste), República Virtual (legado 2005, schema estranho), CEP.rest (POST only, muito recente)

### Socket.dev Alerts (v0.1.6)

- **URL strings** (nosso código): URLs dos providers — esperado, inofensivo
- Todos os outros alertas (malware, eval, native code, etc.): dependências transitivas de `n8n-workflow`/`@n8n/node-cli` que **não vão no dist** (`files: ["dist"]`)
- Nenhuma ação necessária — alertas são de devDependencies

## Resources
- Spec v0.1: `docs/superpowers/specs/2026-03-10-n8n-nodes-brasil-hub-design.md`
- **Spec v0.2: `docs/superpowers/specs/2026-03-11-brasil-hub-v0.2.0-design.md`**
- Plano: `docs/superpowers/plans/2026-03-10-n8n-nodes-brasil-hub.md`
- BrasilAPI docs: `https://brasilapi.com.br/docs`
- n8n community nodes guide: `https://docs.n8n.io/integrations/community-nodes/`
- n8n starter template: `https://github.com/n8n-io/n8n-nodes-starter`
- n8n codex files: `https://docs.n8n.io/integrations/creating-nodes/build/reference/node-codex-files/`
- n8n verification guidelines: `https://docs.n8n.io/integrations/creating-nodes/build/reference/verification-guidelines/`
- n8n Creator Portal: `https://creators.n8n.io/`

---
*Update this file after every 2 view/browser/search operations*

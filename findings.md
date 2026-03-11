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
- [x] Error messages seguem pattern: what happened + how to fix
- [ ] Delete operations retornam `{deleted: true}` — N/A (não temos delete)
- [x] Simplify parameter (>10 campos) — N/A: nosso output JÁ É normalizado (13 top-level, vários objects). O Simplify existe para APIs raw com 30+ campos. Nosso normalizer É o simplify.

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
- **Extra nosso (ok):** `main: "index.js"`, keywords adicionais, scripts `test`/`test:watch`
- **Starter tem, nós não (ok):** `credentials` array (não temos credentials), `prettier`, `release-it`

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

### Vulnerabilities (5→10)
- Scorecard usa OSV (Open Source Vulnerabilities database)
- As 5 vulns provavelmente são de devDependencies transitivas (n8n-workflow → langchain chain)
- Resolver via `npm audit fix` ou atualizar deps
- Se são apenas devDeps, o Scorecard ainda pode contá-las

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

## Resources
- Spec: `docs/superpowers/specs/2026-03-10-n8n-nodes-brasil-hub-design.md`
- Plano: `docs/superpowers/plans/2026-03-10-n8n-nodes-brasil-hub.md`
- BrasilAPI docs: `https://brasilapi.com.br/docs`
- n8n community nodes guide: `https://docs.n8n.io/integrations/community-nodes/`
- n8n starter template: `https://github.com/n8n-io/n8n-nodes-starter`
- n8n codex files: `https://docs.n8n.io/integrations/creating-nodes/build/reference/node-codex-files/`
- n8n verification guidelines: `https://docs.n8n.io/integrations/creating-nodes/build/reference/verification-guidelines/`
- n8n Creator Portal: `https://creators.n8n.io/`

---
*Update this file after every 2 view/browser/search operations*

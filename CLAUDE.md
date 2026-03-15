# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Community n8n node (`n8n-nodes-brasil-hub`) that centralizes Brazilian public data queries. A single "Brasil Hub" node with extensible resources — v0.2.x ships CNPJ, CEP, and CPF. New resources ship as incremental MINOR releases (v0.3.0 Banks → v0.4.0 DDD → v0.5.0 FIPE → v0.6.0 Feriados → v0.7.0 additional providers).

- **License:** MIT
- **Tech Stack:** TypeScript, n8n-workflow, Jest + ts-jest
- **Tooling:** `@n8n/node-cli` for scaffold, build, lint, dev

## Build & Development Commands

```bash
# Install dependencies
npm install

# Build
npx n8n-node build

# Lint
npx n8n-node lint

# Run all tests
npx jest

# Run a single test file
npx jest __tests__/validators.spec.ts

# Link for local n8n testing
npm link
# then in n8n installation:
npm link n8n-nodes-brasil-hub
```

## Architecture

### Single Node, Multiple Resources (Dictionary Map Pattern)

One node class `BrasilHub` with a resource/operation router dispatching to per-resource handlers:

```
nodes/BrasilHub/
├── BrasilHub.node.ts            # Class + resource/operation dictionary map router
├── BrasilHub.node.json          # Codex metadata
├── brasilHub.svg                # Icon
├── types.ts                     # ICnpjResult, ICepResult, IMeta, IValidationResult
├── resources/
│   ├── cnpj/
│   │   ├── cnpj.description.ts  # INodeProperties[]
│   │   ├── cnpj.execute.ts      # { query, validate }
│   │   └── cnpj.normalize.ts    # Provider response → normalized schema
│   ├── cep/
│   │   ├── cep.description.ts
│   │   ├── cep.execute.ts
│   │   └── cep.normalize.ts
│   └── cpf/
│       ├── cpf.description.ts   # Validate only (no query — local checksum)
│       └── cpf.execute.ts
├── shared/
│   ├── fallback.ts              # Generic multi-provider fallback (10s timeout)
│   └── validators.ts            # CNPJ/CPF checksum, CEP format validation (local, no API)
```

### Router Pattern

```typescript
const resourceOperations: Record<string, Record<string, ExecuteFunction>> = {
  cnpj: { query: cnpjQuery, validate: cnpjValidate },
  cep:  { query: cepQuery,  validate: cepValidate },
  cpf:  { validate: cpfValidate },
};
```

The `execute()` method reads `resource` + `operation` params and dispatches to the correct handler.

### Adding a New Resource

1. Create `resources/<name>/` with 3 files (description, execute, normalize)
2. Add interfaces to `types.ts`
3. Register in the dictionary map in `BrasilHub.node.ts`
4. Add tests in `__tests__/`

Zero changes to existing resource files — only the router registration.

## Data Providers (Fallback Order)

**CNPJ:** BrasilAPI → CNPJ.ws → ReceitaWS
**CEP:** BrasilAPI → ViaCEP → OpenCEP

Fallback is automatic. BrasilAPI is always primary. Headers include `User-Agent: n8n-brasil-hub-node/1.0`.

## Key Design Decisions

- **Zero runtime dependencies** — only `n8n-workflow` as peerDependency
- **Validate operations are local** (checksum/format) — no API call needed
- **`usableAsTool: true`** — node works as AI Agent tool
- **`continueOnFail()`** with `pairedItem` on all outputs
- **All UI text in English** (n8n Cloud requirement)
- **Normalized output** by default, optional raw response via `Include Raw Response` checkbox
- **NodeApiError** for API errors (preserves HTTP status), **NodeOperationError** for validation/operation errors with `itemIndex`

## n8n Compliance

- `n8n-community-node-package` keyword in package.json
- `noDataExpression: true` on Resource/Operation params
- `action` property on each Operation option
- Title Case displayNames, "Whether" prefix on boolean descriptions
- SVG icon, no trailing period on single-sentence descriptions
- ESLint config: `import { config } from '@n8n/node-cli/eslint'`
- Must pass `@n8n/scan-community-package`

## n8n Skills Disponíveis

Skills especializadas em `~/.claude/skills/n8n-*/` — usar conforme necessidade:

| Skill | Quando usar neste projeto |
|-------|--------------------------|
| `n8n-node-dev` | Desenvolvimento do node (declarative/programmatic, credentials, versioning, publish) |
| `n8n-validation` | Validar configuração do node, interpretar erros de validação |
| `n8n-workflow` | Testar o node em workflows via MCP, buscar nodes/templates |
| `n8n-code` | Referência para Code nodes (JS/Python) — útil para testar integração |
| `n8n-expressions` | Sintaxe `{{ }}` nos campos do node |
| `n8n-data` | Transforms de dados, item linking, binary data |
| `n8n-ai` | Integração com AI agents (`usableAsTool: true`) |
| `n8n-security` | Criptografia de credentials, segurança de community nodes |
| `n8n-hosting` | Instalação, configuração, scaling do n8n |
| `n8n-devops` | Source control, environments, API |

**Prioridade neste projeto:** `n8n-node-dev` (principal) → `n8n-validation` → `n8n-workflow` → demais conforme contexto.

## Planning Method

This project uses **Manus-style file-based planning** (skill: `planning-with-files`). Three files in the project root serve as persistent working memory:

| File | Purpose |
|------|---------|
| `task_plan.md` | Phase tracking, decisions, error log |
| `findings.md` | Research, discoveries, technical notes |
| `progress.md` | Session log, test results, milestones |

**Rules — OBRIGATÓRIO, sem precisar o usuário pedir:**
- **Início de sessão:** Ler os 3 arquivos para recuperar contexto
- **Após cada commit:** Atualizar `progress.md` com ações realizadas, arquivos modificados, hash do commit
- **Após cada descoberta técnica:** Atualizar `findings.md`
- **Após concluir uma fase ou tarefa:** Atualizar `task_plan.md` (marcar checkboxes, atualizar status, adicionar novas fases se necessário)
- **Ao encontrar erros:** Logar em `progress.md` (Error Log) e `task_plan.md` (Errors Encountered)
- **Fim de sessão ou pausa longa:** Atualizar o "5-Question Reboot Check" no `progress.md`
- Esses updates são parte do trabalho, não extras — fazer proativamente sem esperar o usuário pedir

## CI/CD — Armadilhas Conhecidas

### isolated-vm (native addon)
- `n8n-workflow` puxa `isolated-vm` (C++ addon) como dependência transitiva via `@n8n/ai-node-sdk`
- Exige Node >= 22 para compilar, mas nosso node **não usa**
- **Solução CI:** `npm ci --ignore-scripts` em todos os workflows (pula `node-gyp`)
- **Solução Jest:** `moduleNameMapper` em `jest.config.js` aponta `isolated-vm` para `__mocks__/isolated-vm.js`
- Test matrix: Node 20 + 22 (Node 18 removido — EOL e incompatível)

### n8n-node prerelease guard
- `package.json` tem `"prepublishOnly": "n8n-node prerelease"` (gerado pelo starter template)
- Este script **bloqueia** `npm publish` direto — exige usar `npm run release` (que faz versioning interno)
- **Solução CI:** `npm publish *.tgz --provenance --access public --ignore-scripts` no release workflow
- O workflow já roda tests + build antes do publish, então pular lifecycle scripts é seguro

### Release pipeline (2 jobs)
- **Build & Pack** → testa, builda, cria tarball (`npm pack`), gera attestation via `actions/attest-build-provenance@v2`
- **Publish** → baixa tarball, publica no npm com `--provenance`
- O `release.yml` roda no ref do tag, não no `main`
- Se corrigir workflows após criar o tag, precisa **deletar tag + release e recriar** no commit corrigido
- Ordem correta: CI verde → tag → release (nunca tagar com CI falhando)

## CI/CD — Regra Obrigatória

**Após qualquer `git push` ou `gh release create`, SEMPRE verificar o resultado do CI/CD antes de considerar o trabalho concluído.**

```bash
# Após push — verificar CI
gh run list --limit 3
gh run view <run-id> --log-failed   # se falhou

# Após release — verificar CI + Release workflow
gh run list --workflow=ci.yml --limit 1
gh run list --workflow=release.yml --limit 1
```

- CI verde é pré-requisito para considerar qualquer tarefa finalizada
- Se falhar: diagnosticar e corrigir imediatamente, antes de seguir para próxima tarefa
- Nunca lançar release sem CI passando

## Pre-Release Workflow — Checklist Obrigatório

Executar **antes de cada release**, na ordem abaixo. Cada fase usa skills específicas.

### Fase 1: Compliance & Segurança (bloqueia release)

| # | Skill | O que faz | Comando referência |
|---|-------|-----------|--------------------|
| 1 | `n8n-node-dev` | Audita compliance com requisitos de community node (17 checks: package.json, codex, icons, descriptions, ESLint) | `/n8n-node-dev` → checklist |
| 2 | `n8n-validation` | Valida configuração do node (params, types, displayConditions) | `/n8n-validation` |
| 3 | `security-reviewer` | Audit de segurança: input sanitization, SSRF, secrets exposure, deps | `/security-reviewer` |

**Gate:** Todos os findings Critical/High devem ser corrigidos antes de prosseguir.

### Fase 2: Qualidade de Código (bloqueia release)

| # | Skill | O que faz | Target |
|---|-------|-----------|--------------------|
| 4 | `test-master` | Cobertura de testes ≥ 90% branches, edge cases | `/test-master` |
| 5 | `simplify` | Code review: reuso, duplicação, eficiência | `/simplify` |
| 6 | `code-documenter` | JSDoc 100% em funções/classes exportadas | `/code-documenter` |

**Gate:** Coverage ≥ 90%, zero findings HIGH do simplify sem justificativa.

### Fase 3: Build & CI (bloqueia release)

```bash
# 7. Build limpo
npx n8n-node build

# 8. Lint limpo
npx n8n-node lint

# 9. Testes passando
npx jest --coverage

# 10. npm audit
npm audit --audit-level=critical

# 11. Push e verificar CI verde
git push
gh run list --limit 3
```

**Gate:** Tudo verde, zero erros.

### Fase 4: Release (executar)

| # | Skill | O que faz |
|---|-------|-----------|
| 12 | `git-workflow-manager` | Conventional commits, CHANGELOG.md, tag semver |
| 13 | `project-release` | Versioning, tag, gh release create |
| 14 | `verification-before-completion` | Verificação final pós-release: CI verde, npm publicado, scan passou |

### Fase 5: Pós-Release (verificar)

```bash
# 15. CI do release workflow passou
gh run list --workflow=release.yml --limit 1

# 16. Scan de community package passou (roda no release workflow)
# Se falhar: corrigir e re-release

# 17. Pacote no npm
npm view n8n-nodes-brasil-hub version
```

### Resumo Rápido (copiar e colar)

```
PRE-RELEASE CHECKLIST:
□ Fase 1: /n8n-node-dev → /n8n-validation → /security-reviewer
□ Fase 2: /test-master → /simplify → /code-documenter
□ Fase 3: build → lint → test → audit → push → CI verde
□ Fase 4: changelog → tag → release
□ Fase 5: CI release verde → npm publicado
```

## Living Docs — Atualizar em Mudanças Estruturais

Estes arquivos contêm informações que ficam desatualizadas quando o projeto muda (Node version, test infra, CI pipeline, arquitetura). **Após qualquer mudança estrutural**, fazer grep pelos termos afetados e propagar para todos.

| Arquivo | O que contém de volátil |
|---------|------------------------|
| `README.md` | Badges, Node.js versions, features list |
| `CLAUDE.md` | Arquitetura, CI/CD pipeline, armadilhas |
| `.github/CONTRIBUTING.md` | Node.js version, project structure, test guidelines |
| `.github/copilot-instructions.md` | Arquitetura, test guidelines, code style |
| `.github/SECURITY.md` | Supported versions |
| `CHANGELOG.md` | Detalhes técnicos nas entries (test matrix, fallback behavior) |
| `package.json` | Keywords, engines, scripts |
| `sonar-project.properties` | Source/test paths, exclusions |
| `.github/workflows/*.yml` | Node versions, action pins, job structure |
| `task_plan.md` | Fases, status, erros |
| `progress.md` | Log de sessão, 5-Question Reboot Check |
| `findings.md` | Descobertas técnicas |

**Termos para grep após mudanças comuns:**
- Mudou Node version → grep `Node 18`, `Node 20`, `node-version`, `node:`
- Mudou test infra → grep `useFakeTimers`, `runWithTimers`, `jest.config`
- Mudou CI pipeline → grep `sonarcloud`, `coverage`, workflow names
- Adicionou arquivo em `shared/` → grep tree structures nos .md
- Mudou release flow → grep `npm publish`, `provenance`, `release.yml`

## Spec & Plan

- **Design spec (v0.1):** `docs/superpowers/specs/2026-03-10-n8n-nodes-brasil-hub-design.md`
- **Design spec (v0.2–v0.7):** `docs/superpowers/specs/2026-03-11-brasil-hub-v0.2.0-design.md`
- **Implementation plan (v0.1):** `docs/superpowers/plans/2026-03-10-n8n-nodes-brasil-hub.md`
- **Implementation plan (v0.2–v0.7):** `docs/superpowers/plans/2026-03-11-brasil-hub-v0.2.0.md`

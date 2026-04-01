# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Community n8n node (`n8n-nodes-brasil-hub`) that centralizes Brazilian public data queries. A single "Brasil Hub" node with extensible resources — v1.4.x ships CNPJ (7 providers), CEP (4 providers), CPF, Banks, DDD, Holiday (Feriados), FIPE, IBGE, NCM, PIX, Câmbio, Taxas, and Fake — 13 resources, 28 operations, 25 providers, configurable timeout, configurable provider order, rate limit awareness, CNPJ output mode.

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
├── types.ts                     # ICnpjResult, ICepResult, IFipe*, IMeta, IValidationResult
├── resources/
│   ├── banks/                   # Query + List (BrasilAPI → BancosBrasileiros)
│   ├── cambio/                  # List Currencies + Query Rate (BrasilAPI/BCB)
│   ├── cep/                     # Query + Validate (BrasilAPI → ViaCEP → OpenCEP → ApiCEP)
│   ├── cnpj/                    # Query + Validate (7 providers)
│   ├── cpf/                     # Validate only (local checksum)
│   ├── ddd/                     # Query (BrasilAPI → municipios-brasileiros)
│   ├── fake/                    # Person, Company, CPF, CNPJ (local, no API)
│   ├── feriados/                # Query (BrasilAPI → Nager.Date)
│   ├── fipe/                    # Brands, Models, Years, Price, Ref Tables (parallelum)
│   ├── ibge/                    # States + Cities (BrasilAPI → IBGE API)
│   ├── ncm/                     # Query + Search (BrasilAPI)
│   ├── pix/                     # List + Query (BrasilAPI)
│   └── taxas/                   # List + Query (BrasilAPI)
├── shared/
│   ├── description-builders.ts  # Shared UI field builders (includeRawField)
│   ├── execute-helpers.ts       # Facade + Strategy helpers (executeStandardQuery, createNormalizerDispatch)
│   ├── fallback.ts              # Generic multi-provider fallback (configurable timeout)
│   ├── utils.ts                 # Shared utilities (buildMeta, buildResultItem, safeStr)
│   └── validators.ts            # CNPJ/CPF checksum, CEP format validation (local, no API)
```

### Router Pattern

```typescript
// Built automatically from barrel-exported resource modules (IResourceDefinition[])
const allResources: IResourceDefinition[] = [
  banksResource, cambioResource, cepResource, cnpjResource, cpfResource,
  dddResource, fakeResource, feriadosResource, fipeResource, ibgeResource,
  ncmResource, pixResource, taxasResource,
];
const resourceOperations = Object.fromEntries(allResources.map(r => [r.resource, r.operations]));
```

The `execute()` method reads `resource` + `operation` params and dispatches to the correct handler.

### Adding a New Resource

See [CONTRIBUTING.md](.github/CONTRIBUTING.md) for detailed step-by-step instructions. Summary:

1. Create `resources/<name>/` with 3 files (description, execute, normalize)
2. Add interfaces to `types.ts`
3. Register in the dictionary map in `BrasilHub.node.ts`
4. Add tests in `__tests__/`

Zero changes to existing resource files — only the router registration.

## Data Providers (Fallback Order)

**CNPJ:** BrasilAPI → CNPJ.ws → ReceitaWS → MinhaReceita → OpenCNPJ.org → OpenCNPJ.com → CNPJA
**CEP:** BrasilAPI → ViaCEP → OpenCEP → ApiCEP
**Banks:** BrasilAPI → BancosBrasileiros
**Câmbio:** BrasilAPI (BCB data)
**DDD:** BrasilAPI → municipios-brasileiros
**Holiday (Feriados):** BrasilAPI → Nager.Date
**FIPE:** parallelum (single provider — hierarchy API)
**IBGE:** BrasilAPI → IBGE API
**NCM:** BrasilAPI
**PIX:** BrasilAPI
**Taxas:** BrasilAPI

Fallback is automatic. BrasilAPI is always primary. Headers include `User-Agent: n8n-brasil-hub-node/1.0`. Timeout is configurable per-node (default 10s, range 1–60s).

## Key Design Decisions

- **Zero runtime dependencies** — only `n8n-workflow` as peerDependency
- **Validate operations are local** (checksum/format) — no API call needed
- **`usableAsTool: true`** — node works as AI Agent tool
- **`continueOnFail()`** with `pairedItem` on all outputs
- **All UI text in English** (n8n Cloud requirement)
- **Normalized output** by default, optional raw response via `Include Raw Response` checkbox
- **NodeApiError** for API errors (preserves HTTP status), **NodeOperationError** for validation/operation errors with `itemIndex`

## JSDoc — 100% Coverage Obrigatório

**Toda função, interface, tipo e constante exportada DEVE ter JSDoc completo.**

- Funções: `@param` para cada parâmetro + `@returns` + descrição
- Interfaces: descrição na interface + descrição em cada campo
- Constantes: descrição do conteúdo e propósito
- Após adicionar/modificar código: rodar `/code-documenter` para verificar cobertura
- **Nunca commitar código exportado sem JSDoc** — isso é parte do checklist de qualidade

Status atual: **130/130 exports documentados (100%)**.

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

## Pre-Release Workflow — Regras

**Checklist detalhado: [`RELEASE_CHECKLIST.md`](RELEASE_CHECKLIST.md)** (6 fases, TODAS obrigatórias)

**REGRAS INVIOLÁVEIS:**
- **PROIBIDO publicar (tag/release/npm publish) sem completar TODAS as 6 fases.** Sem exceções.
- **Cada fase é um gate bloqueante** — não prosseguir para a próxima se houver findings Critical/High não resolvidos.
- **Testing Arsenal (`/testing-arsenal`) é obrigatório** — Fase 3, mínimo: test-master, test-skeptic, code-reviewer, security-reviewer.
- **Audits (Fase 1) devem COMPLETAR antes de merge/tag/release** — rodar em background é OK, mas esperar resultado.
- **Fase 2 (test-master, simplify, code-documenter) é OBRIGATÓRIA** — não pular por parecer redundante.
- **Paralelizar é permitido DENTRO de cada fase**, mas não ENTRE fases.
- **Fase 6 (post-release) é obrigatória** — GitHub Discussions, npm verification, living docs check.

**Lições aprendidas:** v0.2.0–v0.4.0 pularam Fase 2; v0.5.0 publicou antes do Testing Arsenal; v0.8.0 esqueceu Discussions. Bugs e vulnerabilidades foram encontrados após publicação.

## Living Docs — Atualizar em Mudanças Estruturais

Estes arquivos contêm informações que ficam desatualizadas quando o projeto muda (Node version, test infra, CI pipeline, arquitetura). **Após qualquer mudança estrutural**, fazer grep pelos termos afetados e propagar para todos.

| Arquivo | O que contém de volátil |
|---------|------------------------|
| `README.md` | Badges, Node.js versions, features list |
| `CLAUDE.md` | Arquitetura, CI/CD pipeline, armadilhas |
| `.github/CONTRIBUTING.md` | Node.js version, project structure, test guidelines |
| `.github/copilot-instructions.md` | Arquitetura, test guidelines, code style |
| `.github/SECURITY.md` | Supported versions |
| `SECURITY-ASSESSMENT.md` | Attack surface, threat table, resource/operation counts, provider list |
| `CHANGELOG.md` | Detalhes técnicos nas entries (test matrix, fallback behavior) |
| `package.json` | Keywords, engines, scripts |
| `sonar-project.properties` | Source/test paths, exclusions |
| `.github/workflows/*.yml` | Node versions, action pins, job structure |
| `task_plan.md` | Fases, status, erros |
| `progress.md` | Log de sessão, 5-Question Reboot Check |
| `findings.md` | Descobertas técnicas |
| `docs/articles/*.md` | Resource/operation/provider counts, test counts, feature lists |
| `PROJECT_INDEX.md` | File counts, test counts, JSDoc counts, workflow counts |
| `docs/PROJECT_INDEX.md` | Same as PROJECT_INDEX.md (condensed version) |

**Termos para grep após mudanças comuns:**
- Mudou Node version → grep `Node 18`, `Node 20`, `node-version`, `node:`
- Mudou test infra → grep `useFakeTimers`, `runWithTimers`, `jest.config`
- Mudou CI pipeline → grep `sonarcloud`, `coverage`, workflow names
- Adicionou arquivo em `shared/` → grep tree structures nos .md
- Adicionou novo recurso → grep resource counts, operations counts, provider lists nos .md + articles
- Mudou release flow → grep `npm publish`, `provenance`, `release.yml`

## Spec & Plan

- **Design spec (v0.1):** `docs/superpowers/specs/2026-03-10-n8n-nodes-brasil-hub-design.md`
- **Design spec (v0.2–v0.7):** `docs/superpowers/specs/2026-03-11-brasil-hub-v0.2.0-design.md`
- **Implementation plan (v0.1):** `docs/superpowers/plans/2026-03-10-n8n-nodes-brasil-hub.md`
- **Implementation plan (v0.2–v0.7):** `docs/superpowers/plans/2026-03-11-brasil-hub-v0.2.0.md`

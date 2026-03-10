# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Community n8n node (`n8n-nodes-brasil-hub`) that centralizes Brazilian public data queries. A single "Brasil Hub" node with extensible resources — v1.0 ships with CNPJ and CEP lookups.

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
│   │   ├── cnpj.execute.ts      # { consultar, validar }
│   │   └── cnpj.normalize.ts    # Provider response → normalized schema
│   └── cep/
│       ├── cep.description.ts
│       ├── cep.execute.ts
│       └── cep.normalize.ts
├── shared/
│   ├── fallback.ts              # Generic multi-provider fallback (1s delay, 10s timeout)
│   └── validators.ts            # CNPJ checksum, CEP format validation (local, no API)
```

### Router Pattern

```typescript
const resourceOperations: Record<string, Record<string, ExecuteFunction>> = {
  cnpj: { consultar: cnpjConsultar, validar: cnpjValidar },
  cep:  { consultar: cepConsultar,  validar: cepValidar },
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

## Planning Method

This project uses **Manus-style file-based planning** (skill: `planning-with-files`). Three files in the project root serve as persistent working memory:

| File | Purpose |
|------|---------|
| `task_plan.md` | Phase tracking, decisions, error log |
| `findings.md` | Research, discoveries, technical notes |
| `progress.md` | Session log, test results, milestones |

**Rules:** Create/read plan before starting work. Update after each phase. Log all errors. After every 2 search/view operations, save findings to disk.

## Spec & Plan

- **Design spec:** `docs/superpowers/specs/2026-03-10-n8n-nodes-brasil-hub-design.md`
- **Implementation plan:** `docs/superpowers/plans/2026-03-10-n8n-nodes-brasil-hub.md`

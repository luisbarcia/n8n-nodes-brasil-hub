# Copilot Instructions

## Project

n8n community node (`n8n-nodes-brasil-hub`) for querying Brazilian public data. Single "Brasil Hub" node with resource/operation routing pattern. Currently ships CNPJ, CEP, CPF, and Banks resources (v0.3.x), with DDD, FIPE, and Feriados planned as incremental MINOR releases (v0.4.0–v0.7.0).

## Tech Stack

- TypeScript (strict mode)
- n8n-workflow (peer dependency)
- @n8n/node-cli (build, lint, dev)
- Jest + ts-jest (tests)
- ESLint via @n8n/node-cli/eslint

## Architecture

Dictionary map router dispatches to per-resource handlers:

```
nodes/BrasilHub/
├── BrasilHub.node.ts            # Node class + router
├── types.ts                     # Output interfaces
├── shared/validators.ts         # CNPJ/CPF checksum, CEP format (local, no API)
├── shared/fallback.ts           # Generic multi-provider fallback
├── shared/utils.ts              # Shared utilities (stripNonDigits, safeStr)
└── resources/{cnpj,cep,cpf,banks}/  # description, execute, normalize per resource
```

## n8n Node Conventions (MUST follow)

- All UI text in English (n8n Cloud requirement)
- `noDataExpression: true` on Resource and Operation params
- Every Operation option needs an `action` property
- Boolean descriptions start with "Whether"
- Title Case for `displayName` values
- No trailing period on single-sentence descriptions
- `continueOnFail()` with `pairedItem` linking on all outputs
- `NodeApiError` for API errors, `NodeOperationError` for validation errors with `itemIndex`
- `usableAsTool: true` for AI Agent compatibility
- Zero runtime dependencies

## Code Style

- Use `Record<string, unknown>` for untyped API responses, not `any`
- Use `String(value ?? '')` for safe string conversion from API data
- Normalize all provider responses to a single interface
- Fallback logic is generic — same function for all resources
- Validators are pure functions with no side effects

## Testing

- TDD: write failing test first, then implement
- Test normalizers with real API response fixtures per provider
- Mock `IExecuteFunctions` context for execute handler tests

## Commands

- Build: `npm run build`
- Lint: `npm run lint`
- Test: `npm test`
- Single test: `npx jest __tests__/validators.spec.ts`

## Adding a New Resource

1. Create `resources/<name>/` with 3 files (description, execute, normalize)
2. Add interfaces to `types.ts`
3. Register in dictionary map in `BrasilHub.node.ts`
4. Add tests in `__tests__/`

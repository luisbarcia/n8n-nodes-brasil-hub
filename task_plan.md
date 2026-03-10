# Task Plan: n8n-nodes-brasil-hub

## Goal
Implementar o community node n8n "Brasil Hub" que consulta dados públicos brasileiros (CNPJ e CEP) com fallback multi-provider, seguindo todos os padrões oficiais n8n.

## Current Phase
Phase 5 (complete)

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

## Notes
- Plano detalhado: `docs/superpowers/plans/2026-03-10-n8n-nodes-brasil-hub.md`
- Spec de design: `docs/superpowers/specs/2026-03-10-n8n-nodes-brasil-hub-design.md`
- 11 tasks no total, 4 chunks
- TDD: red → green → commit em todas as tasks com código testável

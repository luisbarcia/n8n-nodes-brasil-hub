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

## Resources
- Spec: `docs/superpowers/specs/2026-03-10-n8n-nodes-brasil-hub-design.md`
- Plano: `docs/superpowers/plans/2026-03-10-n8n-nodes-brasil-hub.md`
- BrasilAPI docs: `https://brasilapi.com.br/docs`
- n8n community nodes guide: `https://docs.n8n.io/integrations/community-nodes/`
- n8n starter template: `https://github.com/n8n-io/n8n-nodes-starter`

---
*Update this file after every 2 view/browser/search operations*

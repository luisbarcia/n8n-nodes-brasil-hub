# Roadmap

This document describes the planned direction for n8n-nodes-brasil-hub.

Each new resource ships as its own MINOR release for faster iteration and easier rollback.

## Current (v0.7.x) ✅

- [x] **CNPJ resource** (Query + Validate) with 7 providers ([#36](https://github.com/luisbarcia/n8n-nodes-brasil-hub/issues/36))
- [x] **CEP resource** (Query + Validate) with 4 providers ([#37](https://github.com/luisbarcia/n8n-nodes-brasil-hub/issues/37))
- [x] **CPF resource** (Validate) — local checksum ([#5](https://github.com/luisbarcia/n8n-nodes-brasil-hub/issues/5))
- [x] **Bank resource** (Query + List) with 2 providers ([#32](https://github.com/luisbarcia/n8n-nodes-brasil-hub/issues/32))
- [x] **DDD resource** (Query) with 2 providers ([#33](https://github.com/luisbarcia/n8n-nodes-brasil-hub/issues/33))
- [x] **Feriado resource** (Query) with 2 providers ([#35](https://github.com/luisbarcia/n8n-nodes-brasil-hub/issues/35))
- [x] **FIPE resource** (Brands, Models, Years, Price) with 1 provider ([#34](https://github.com/luisbarcia/n8n-nodes-brasil-hub/issues/34))
- [x] CNPJ Simplify parameter ([#38](https://github.com/luisbarcia/n8n-nodes-brasil-hub/issues/38))
- [x] Enhanced error messages with HTTP status ([#39](https://github.com/luisbarcia/n8n-nodes-brasil-hub/issues/39))
- [x] DRY refactor: `buildResultItem`/`buildResultItems` shared helpers
- [x] 815 tests, 99%+ branch coverage
- [x] AI Agent ready (`usableAsTool: true`)
- [x] npm provenance + build attestation

## v0.8.0 — IBGE Resource ✅

- [x] **IBGE States** — List all Brazilian states/UFs (BrasilAPI + IBGE API oficial)
- [x] **IBGE Cities** — List municipalities by state (BrasilAPI + IBGE API oficial)
- [x] Operations: `states`, `cities`
- [x] Multi-item output (one item per state/city)

## v0.9.0 — NCM Resource ✅

- [x] **NCM Query** — Look up tax classification by code (BrasilAPI)
- [x] **NCM Search** — Search codes by description (BrasilAPI, multi-item)
- [x] Operations: `query`, `search`

## v1.0.0 — Power User Features + Stable Release

- [ ] **Configurable Provider Order** — User chooses primary provider per resource
- [x] **Configurable Timeout** — Override default 10s timeout per operation
- [ ] **Rate Limit Awareness** — Detect HTTP 429, retry with exponential backoff
- [x] **CNPJ Output Mode** — Simplified (default), Full, AI Summary
- [ ] **Creator Portal resubmission** — Submit stable v1.0.0 for "Verified" badge
- [ ] Comprehensive documentation site or wiki

## v1.1.0+ — Expansion (ideas, not committed)

- [ ] **PIX Directory** — Query PIX participants (BCB API)
- [ ] **CNES** — Health establishments (DataSUS)
- [ ] **Historical FIPE** — Query past reference tables
- [ ] **Correios Tracking** — Package tracking (if public API available)

## Not Planned

- Authentication/credentials — All providers are public APIs
- Caching — n8n handles caching at workflow level
- Batch operations — Use n8n's built-in loop/split mechanisms
- Non-Brazilian data — Out of scope for this project

## Contributing

Want to help with any of these? See [CONTRIBUTING.md](.github/CONTRIBUTING.md) and open an Issue to discuss before starting.

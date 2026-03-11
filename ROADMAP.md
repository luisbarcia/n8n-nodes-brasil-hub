# Roadmap

This document describes the planned direction for n8n-nodes-brasil-hub.

Each new resource ships as its own MINOR release for faster iteration and easier rollback.

## Current (v0.1.x)

- [x] CNPJ resource (Query + Validate) with 3 providers
- [x] CEP resource (Query + Validate) with 3 providers
- [x] Multi-provider fallback with 10s timeout
- [x] Normalized output + optional raw response
- [x] AI Agent ready (`usableAsTool: true`)
- [x] 99%+ test coverage
- [x] npm provenance + build attestation

## v0.2.0 — CPF Validate

- [ ] Refactor router for multi-item returns ([#40](https://github.com/luisbarcia/n8n-nodes-brasil-hub/issues/40))
- [ ] **CPF resource** — Validate CPF numbers (local Módulo 11 checksum, no API) ([#5](https://github.com/luisbarcia/n8n-nodes-brasil-hub/issues/5))

## v0.3.0 — Banks

- [ ] **Banks resource** — Query/list bank info (BrasilAPI + BancosBrasileiros fallback) ([#32](https://github.com/luisbarcia/n8n-nodes-brasil-hub/issues/32))

## v0.4.0 — DDD

- [ ] **DDD resource** — Query area codes by state/city (BrasilAPI) ([#33](https://github.com/luisbarcia/n8n-nodes-brasil-hub/issues/33))

## v0.5.0 — FIPE

- [ ] **FIPE resource** — Query vehicle brands/models/years/prices (parallelum + BrasilAPI fallback) ([#34](https://github.com/luisbarcia/n8n-nodes-brasil-hub/issues/34))

## v0.6.0 — Feriados

- [ ] **Feriados resource** — Query national holidays by year (BrasilAPI + Nager.Date fallback) ([#35](https://github.com/luisbarcia/n8n-nodes-brasil-hub/issues/35))

## v0.7.0 — Additional Providers + Polish

- [ ] **Additional CNPJ providers** — Add MinhaReceita, OpenCNPJ.org, OpenCNPJ.com, CNPJA (7 total) ([#36](https://github.com/luisbarcia/n8n-nodes-brasil-hub/issues/36))
- [ ] **Additional CEP provider** — Add ApiCEP (4 total) ([#37](https://github.com/luisbarcia/n8n-nodes-brasil-hub/issues/37))
- [ ] Simplify/Output parameter for CNPJ query (>10 fields) ([#38](https://github.com/luisbarcia/n8n-nodes-brasil-hub/issues/38))
- [ ] Improve error messages with provider-specific context ([#39](https://github.com/luisbarcia/n8n-nodes-brasil-hub/issues/39))

## Future (v1.0) — Features no competitor offers

- [ ] **IBGE resource** — Query cities, states, and regions
- [ ] **NCM resource** — Query tax classification codes
- [ ] Configurable provider order (user chooses primary)
- [ ] Configurable timeout per provider
- [ ] Rate limiting awareness (respect 429 responses)

## Not Planned

- Authentication/credentials — All providers are public APIs
- Caching — n8n handles caching at workflow level
- Batch operations — Use n8n's built-in loop/split mechanisms
- Non-Brazilian data — Out of scope for this project

## Contributing

Want to help with any of these? See [CONTRIBUTING.md](.github/CONTRIBUTING.md) and open an Issue to discuss before starting.

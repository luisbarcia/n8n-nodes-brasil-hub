# Roadmap

This document describes the planned direction for n8n-nodes-brasil-hub.

## Current (v0.1.x)

- [x] CNPJ resource (Query + Validate) with 3 providers
- [x] CEP resource (Query + Validate) with 3 providers
- [x] Multi-provider fallback with 10s timeout
- [x] Normalized output + optional raw response
- [x] AI Agent ready (`usableAsTool: true`)
- [x] 99%+ test coverage
- [x] npm provenance + SLSA attestation

## Next (v0.2.0)

- [ ] **CPF resource** — Validate CPF numbers (local checksum, no API)
- [ ] **Banks resource** — Query bank info by code (BrasilAPI provider)
- [ ] **DDD resource** — Query area codes by state/city (BrasilAPI provider)
- [ ] Improve error messages with provider-specific context

## Future (v1.0)

- [ ] **IBGE resource** — Query cities, states, and regions
- [ ] **NCM resource** — Query tax classification codes
- [ ] **FIPE resource** — Query vehicle prices
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

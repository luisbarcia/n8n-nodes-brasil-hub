# Security Assessment

Threat model and security assurance case for n8n-nodes-brasil-hub.

## Attack Surface

### What this package does

- Receives user input from n8n workflow items: CNPJ, CEP, CPF, bank codes, DDD area codes, FIPE vehicle identifiers, IBGE state codes, NCM codes/search terms, PIX ISPB codes, currency codes, interest rate codes, holiday years, and fake data generation parameters
- Makes HTTP GET requests to **public Brazilian data APIs** (no auth required)
- Generates fake data locally (Person, Company, CPF, CNPJ) with no external calls
- Returns normalized JSON responses to the n8n workflow

### What this package does NOT do

- Store or cache any data
- Require or manage credentials/secrets
- Access the filesystem, environment variables, or system resources
- Execute dynamic code or evaluate user expressions
- Process file uploads or binary data

## Trust Boundaries

```
┌──────────────────────────────────────────────────┐
│ n8n Runtime (trusted)                            │
│  ┌────────────────────────────────────────┐      │
│  │ Brasil Hub Node                        │      │
│  │  ┌──────────────┐                     │      │
│  │  │ Input        │ CNPJ/CEP/CPF/Bank/  │      │
│  │  │ Validation   │ DDD/FIPE/IBGE/NCM/  │      │
│  │  │              │ PIX/Câmbio/Taxas/   │      │
│  │  │              │ Holiday/Fake input   │      │
│  │  └──────┬───────┘                     │      │
│  │         │ validated input              │      │
│  │  ┌──────▼───────┐                     │      │
│  │  │ HTTP Client  │ (n8n built-in)      │      │
│  │  └──────┬───────┘                     │      │
│  └─────────┼──────────────────────────────┘      │
│            │ HTTPS only                           │
└────────────┼─────────────────────────────────────┘
             │ ◄── TRUST BOUNDARY ──►
┌────────────▼─────────────────────────────────────┐
│ Public APIs (untrusted) — 16 provider endpoints  │
│  BrasilAPI, CNPJ.ws, ReceitaWS, MinhaReceita,   │
│  OpenCNPJ.org, OpenCNPJ.com, CNPJA,             │
│  ViaCEP, OpenCEP, ApiCEP,                       │
│  BancosBrasileiros, Nager.Date, parallelum,      │
│  IBGE API, BCB/Câmbio, BCB/Taxas                │
└──────────────────────────────────────────────────┘
```

## Threat Analysis

| # | Threat | Mitigation | Status |
|---|--------|-----------|--------|
| T1 | **Malformed input** — Invalid identifiers passed as input | Input validation before API calls: CNPJ/CPF checksum (mod 11), CEP format (8 digits), Bank code (positive integer), DDD range (11–99), FIPE codes (type-checked), IBGE UF (2-letter), NCM code (8 digits), PIX ISPB (8 digits), currency/rate codes (string sanitized), year (4 digits) | ✅ Implemented |
| T2 | **Injection via input** — Input used in URL path | `stripNonDigits()` removes all non-numeric characters for numeric inputs; string inputs are URL-encoded; all URL paths are template literals with hardcoded base URLs | ✅ Implemented |
| T3 | **SSRF via provider URLs** — Attacker controls API endpoint | Provider URLs are hardcoded constants, not configurable by user input | ✅ Implemented |
| T4 | **Malicious API response** — Provider returns unexpected data | Normalizers extract only expected fields; TypeScript interfaces enforce shape; `safeStr()` coerces values safely | ✅ Implemented |
| T5 | **Man-in-the-middle** — API traffic intercepted | All provider URLs use HTTPS; Node.js verifies TLS certificates by default | ✅ Implemented |
| T6 | **Denial of service via slow provider** — Fallback hangs | Configurable timeout per node (1–60s, default 10s); up to 7 providers per resource with sequential fallback; rate limit awareness (HTTP 429 detection with `retryAfterMs` metadata) | ✅ Implemented |
| T7 | **Supply chain attack** — Malicious dependency | Zero runtime dependencies; only `n8n-workflow` as peerDependency; npm provenance + build attestation on every release | ✅ Implemented |
| T8 | **Data exfiltration** — Node leaks sensitive data | Node only reads workflow items and makes outbound HTTP to known APIs; no credentials stored; no data caching | ✅ Implemented |
| T9 | **Fake data predictability** — Generated data is predictable | Fake generators use `crypto.randomInt()` (CSPRNG) instead of `Math.random()` for all random selections | ✅ Implemented |

## Secure Design Principles Applied

| Principle | How Applied |
|-----------|-------------|
| **Least privilege** | Zero dependencies, no fs/env/net access beyond HTTP GET to known APIs |
| **Defense in depth** | Input validation + URL hardcoding + output normalization + type enforcement |
| **Fail securely** | Validation errors return structured `NodeOperationError` with `itemIndex`; API errors return `NodeApiError` preserving HTTP status |
| **Minimize attack surface** | 28 operations across 13 resources; 7 operations are local-only (CPF/CNPJ/CEP validate + Fake *) requiring no network access |
| **Separation of concerns** | Validators, normalizers, execute handlers, and fallback logic are isolated modules |

## Known Limitations

1. **Provider availability** — Public APIs may go down; mitigated by multi-provider fallback (up to 7 providers for CNPJ, 4 for CEP, 2 for Banks/DDD/Holiday/IBGE)
2. **Data accuracy** — Data comes from public APIs; this node does not verify accuracy against official government databases
3. **Rate limiting** — Providers may rate-limit; mitigated by HTTP 429 detection with `retryAfterMs` metadata in response `_meta`. Node does not auto-retry; downstream workflows can implement backoff using the metadata
4. **devDependency vulnerabilities** — Known vulns in `@n8n/node-cli` transitive deps; these do NOT ship in the published package (`files: ["dist/nodes"]`). See findings.md for details.

## Verification

- **Static analysis**: SonarCloud runs on every push/PR (Quality Gate enforced)
- **Dependency audit**: `npm audit` in CI (critical level gate)
- **Attack testing**: Dedicated attack test suites (`*.attack.spec.ts`) covering type confusion, null injection, overflow, Unicode edge cases
- **Security policy**: [SECURITY.md](.github/SECURITY.md) with responsible disclosure process
- **Provenance**: npm publish with `--provenance` + GitHub build attestation (Sigstore OIDC)

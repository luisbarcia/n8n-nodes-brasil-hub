# Security Assessment

Threat model and security assurance case for n8n-nodes-brasil-hub.

## Attack Surface

### What this package does

- Receives CNPJ/CEP/CPF/Bank code/DDD input from n8n workflow items
- Makes HTTP GET requests to **public Brazilian data APIs** (no auth required)
- Returns normalized JSON responses to the n8n workflow

### What this package does NOT do

- Store or cache any data
- Require or manage credentials/secrets
- Access the filesystem, environment variables, or system resources
- Execute dynamic code or evaluate user expressions
- Process file uploads or binary data

## Trust Boundaries

```
┌─────────────────────────────────────────────┐
│ n8n Runtime (trusted)                       │
│  ┌───────────────────────────────────┐      │
│  │ Brasil Hub Node                   │      │
│  │  ┌─────────────┐                 │      │
│  │  │ Input       │ CNPJ/CEP/CPF/   │      │
│  │  │ Validation  │ Bank/DDD input  │      │
│  │  └──────┬──────┘                 │      │
│  │         │ validated input         │      │
│  │  ┌──────▼──────┐                 │      │
│  │  │ HTTP Client │ (n8n built-in)  │      │
│  │  └──────┬──────┘                 │      │
│  └─────────┼─────────────────────────┘      │
│            │ HTTPS only                      │
└────────────┼────────────────────────────────┘
             │ ◄── TRUST BOUNDARY ──►
┌────────────▼────────────────────────────────┐
│ Public APIs (untrusted)                      │
│  BrasilAPI, CNPJ.ws, ReceitaWS              │
│  ViaCEP, OpenCEP, BancosBrasileiros         │
└─────────────────────────────────────────────┘
```

## Threat Analysis

| # | Threat | Mitigation | Status |
|---|--------|-----------|--------|
| T1 | **Malformed input** — Invalid CNPJ/CEP/CPF/Bank/DDD strings | Input validation before API calls: CNPJ/CPF checksum (mod 11), CEP format (8 digits), Bank code (positive integer), DDD range (11–99) | ✅ Implemented |
| T2 | **Injection via input** — Input used in URL path | `stripNonDigits()` removes all non-numeric characters before URL construction | ✅ Implemented |
| T3 | **SSRF via provider URLs** — Attacker controls API endpoint | Provider URLs are hardcoded constants, not configurable by user input | ✅ Implemented |
| T4 | **Malicious API response** — Provider returns unexpected data | Normalizers extract only expected fields; TypeScript interfaces enforce shape | ✅ Implemented |
| T5 | **Man-in-the-middle** — API traffic intercepted | All provider URLs use HTTPS; Node.js verifies TLS certificates by default | ✅ Implemented |
| T6 | **Denial of service via slow provider** — Fallback hangs | 10-second timeout per provider request; max 3 providers per resource | ✅ Implemented |
| T7 | **Supply chain attack** — Malicious dependency | Zero runtime dependencies; only `n8n-workflow` as peerDependency | ✅ Implemented |
| T8 | **Data exfiltration** — Node leaks sensitive data | Node only reads workflow items and makes outbound HTTP to known APIs | ✅ Implemented |

## Secure Design Principles Applied

| Principle | How Applied |
|-----------|-------------|
| **Least privilege** | Zero dependencies, no fs/env/net access beyond HTTP GET to known APIs |
| **Defense in depth** | Input validation + URL hardcoding + output normalization |
| **Fail securely** | Validation errors return structured error objects, not raw exceptions |
| **Minimize attack surface** | 8 operations across 5 resources, 3 of which are local-only (CPF/CNPJ/CEP validate) |
| **Separation of concerns** | Validators, normalizers, and fallback logic are isolated modules |

## Known Limitations

1. **Provider availability** — Public APIs may go down; mitigated by 3-provider fallback
2. **Data accuracy** — Data comes from public APIs; this node does not verify accuracy
3. **Rate limiting** — Providers may rate-limit; no retry-after handling yet (see ROADMAP.md)
4. **devDependency vulnerabilities** — 13 known vulns in `@n8n/node-cli` transitive deps; these do NOT ship in the published package (`files: ["dist/nodes"]`). See findings.md for details.

## Verification

- **Static analysis**: SonarCloud runs on every push/PR
- **Dependency audit**: `npm audit` in CI (critical level gate)
- **Security policy**: [SECURITY.md](.github/SECURITY.md) with responsible disclosure process
- **Provenance**: npm publish with `--provenance` + GitHub build attestation (Sigstore OIDC)

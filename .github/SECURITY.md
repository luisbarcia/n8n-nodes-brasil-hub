# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 0.7.x   | :white_check_mark: |
| < 0.7   | :x:                |

## Reporting a Vulnerability

We take security issues seriously. Thank you for helping to make this project more secure.

**Please DO NOT open a public GitHub issue for security vulnerabilities.**

Instead, please use one of these methods:

1. **GitHub Security Advisories** (preferred): Use the "Report a vulnerability" button on the [Security tab](https://github.com/luisbarcia/n8n-nodes-brasil-hub/security/advisories) of this repository.
2. **Email**: Send details to the repository maintainer via their GitHub profile.

### What to Include

- Description of the vulnerability
- Steps to reproduce
- Affected versions
- Potential impact
- Suggested fix (if you have one)

### Response Timeline

- **Acknowledgment**: Within 48 hours
- **Initial assessment**: Within 1 week
- **Fix target**: Within 30 days for critical issues

### Disclosure Policy

- We follow coordinated disclosure
- Please do not publicly disclose the vulnerability until a fix is available
- We will credit reporters in the security advisory (unless anonymity is requested)

## Security Considerations

This package:
- Has **zero runtime dependencies** (only `n8n-workflow` as peer dependency)
- Makes HTTP requests only to **public Brazilian data APIs** (BrasilAPI, ViaCEP, OpenCEP, ApiCEP, ReceitaWS, CNPJ.ws, MinhaReceita, OpenCNPJ.org, OpenCNPJ.com, CNPJA, BancosBrasileiros, Nager.Date, parallelum)
- Does **not** store or cache any data
- Does **not** require authentication credentials
- Runs within the n8n sandbox with standard node permissions

## Verifying Releases

### npm Provenance

Every release is published with [npm provenance](https://docs.npmjs.com/generating-provenance-statements), which cryptographically links the published package to its source code and build process via Sigstore.

```bash
# Verify provenance of installed package
npm audit signatures
```

You can also view provenance on the [npm package page](https://www.npmjs.com/package/n8n-nodes-brasil-hub) — look for the "Provenance" section.

### Build Attestation

Each release build generates a provenance attestation via [`actions/attest-build-provenance`](https://github.com/actions/attest-build-provenance), providing a tamper-proof record of what source code and build process produced the release artifacts. Attestations are stored in the GitHub repository and can be verified via the GitHub UI or CLI.

### Security Assessment

For a detailed threat model, trust boundaries, and security design analysis, see [SECURITY-ASSESSMENT.md](../SECURITY-ASSESSMENT.md).

## For Users

- Always use the latest version of this package
- Use `package-lock.json` to pin dependency versions
- Enable Dependabot or Renovate for automated security updates
- Run `npm audit signatures` to verify package provenance

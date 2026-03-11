# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 0.1.x   | :white_check_mark: |

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
- Makes HTTP requests only to **public Brazilian government data APIs** (BrasilAPI, ViaCEP, OpenCEP, ReceitaWS, CNPJ.ws)
- Does **not** store or cache any data
- Does **not** require authentication credentials
- Runs within the n8n sandbox with standard node permissions

## For Users

- Always use the latest version of this package
- Use `package-lock.json` to pin dependency versions
- Enable Dependabot or Renovate for automated security updates

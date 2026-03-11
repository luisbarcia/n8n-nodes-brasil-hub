# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Changed
- Simplify CI/CD: remove OpenSSF Scorecard workflow and CodeQL (SonarCloud covers SAST + quality gate)
- Remove OpenSSF Scorecard and CII Best Practices badges from README

## [0.1.2] - 2026-03-11

### Added
- GOVERNANCE.md with BDFL model, roles, and continuity/succession plan
- ROADMAP.md with planned features for v0.2 and v1.0
- SECURITY-ASSESSMENT.md with threat model (8 threats), trust boundaries, and secure design principles
- Release verification instructions in SECURITY.md (npm provenance + build attestation)
- Build provenance attestation via `actions/attest-build-provenance`
- GPG signing for commits and tags

### Changed
- Release pipeline: Build & Pack (with attestation) → Publish
- Branch protection enhanced with pull request requirement and required status checks

### Fixed
- Remove `paths-ignore` from `pull_request` triggers in CI workflow to prevent docs-only PRs from being blocked by required status checks

### Security
- SonarCloud quality gate integrated
- All GitHub Actions pinned to SHA for supply chain security

## [0.1.1] - 2026-03-10

### Fixed
- Remove `setTimeout` from fallback logic to pass `@n8n/scan-community-package` ESLint check
- Replace Portuguese aliases in codex file with English equivalents (`tax-id`, `zip-code`)

### Changed
- Remove inter-provider delay from fallback strategy (providers are queried immediately on failure)
- Simplify test infrastructure: remove fake timers and `runWithTimers` helper

## [0.1.0] - 2026-03-10

### Added
- Brasil Hub n8n node with CNPJ and CEP resources
- CNPJ query operation with multi-provider fallback (BrasilAPI, CNPJ.ws, ReceitaWS)
- CNPJ validate operation (local checksum verification, no API call)
- CEP query operation with multi-provider fallback (BrasilAPI, ViaCEP, OpenCEP)
- CEP validate operation (local format check, no API call)
- Normalized output schema for all providers
- Optional raw API response inclusion via `Include Raw Response` toggle
- `_meta` field with provider info, query timestamp, strategy (`direct`/`fallback`), and errors
- `usableAsTool: true` for AI Agent compatibility
- Generic multi-provider fallback engine with 10s timeout per provider
- CNPJ checksum and CEP format validators (zero runtime dependencies)
- TypeScript strict mode with full type definitions and JSDoc on all 23 public exports
- 49 tests (99.46% statement coverage) across 8 suites
- README with installation, operations table, example output, and provider documentation
- Design spec and implementation plan
- GitHub Actions CI pipeline (lint, test matrix Node 20/22, build, dependency audit)
- GitHub Actions release pipeline (npm publish with provenance on GitHub release)
- Community health files (CODE_OF_CONDUCT, CONTRIBUTING, SECURITY, SUPPORT)
- Issue templates (bug report, feature request) with YAML form schema
- Pull request template with n8n-specific checklist
- Dependabot configuration (npm + GitHub Actions weekly updates)
- MIT license

[Unreleased]: https://github.com/luisbarcia/n8n-nodes-brasil-hub/compare/v0.1.2...HEAD
[0.1.2]: https://github.com/luisbarcia/n8n-nodes-brasil-hub/compare/v0.1.1...v0.1.2
[0.1.1]: https://github.com/luisbarcia/n8n-nodes-brasil-hub/compare/v0.1.0...v0.1.1
[0.1.0]: https://github.com/luisbarcia/n8n-nodes-brasil-hub/releases/tag/v0.1.0

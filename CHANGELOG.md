# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Brasil Hub n8n node with CNPJ and CEP resources
- CNPJ query operation with multi-provider fallback (BrasilAPI, CNPJ.ws, ReceitaWS)
- CNPJ validate operation (local checksum verification, no API call)
- CEP query operation with multi-provider fallback (BrasilAPI, ViaCEP, OpenCEP)
- CEP validate operation (local format check, no API call)
- Normalized output schema for all providers
- Optional raw API response inclusion via `Include Raw Response` toggle
- `_meta` field with provider info, query timestamp, and fallback errors
- `usableAsTool: true` for AI Agent compatibility
- Generic multi-provider fallback engine with 1s delay between retries
- CNPJ checksum and CEP format validators (zero runtime dependencies)
- TypeScript strict mode with full type definitions
- 36 tests covering validators, normalizers, execute handlers, and node metadata
- README with installation, operations table, and example output
- Design spec and implementation plan
- GitHub Actions CI pipeline (lint, test matrix Node 18/20/22, build, dependency audit)
- GitHub Actions release pipeline (npm publish with provenance on GitHub release)
- Community health files (CODE_OF_CONDUCT, CONTRIBUTING, SECURITY, SUPPORT)
- Issue templates (bug report, feature request) with YAML form schema
- Pull request template with n8n-specific checklist
- GitHub Copilot instructions
- Dependabot configuration (npm + GitHub Actions weekly updates)
- Release notes auto-categorization
- CODEOWNERS and FUNDING.yml
- MIT license

[Unreleased]: https://github.com/luisbarcia/n8n-nodes-brasil-hub/compare/v0.1.0...HEAD

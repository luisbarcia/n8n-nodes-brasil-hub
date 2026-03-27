# Feature: docs-arsenal — Documentation Orchestrator Plugin

## Overview

A Claude Code plugin that orchestrates ~50 documentation-related skills into an automated quality gate. Instead of invoking skills one by one (code-documenter, changelog-generator, readme-generator, etc.), the user runs a single command and the plugin detects what documentation needs updating, audits for gaps and duplications, reports a score, and interactively fixes issues. Follows the testing-arsenal pattern: agents for auditing + skills for execution.

**Key differentiator:** Source of Truth (SoT) detection — automatically maps which document owns which information and flags duplications across docs, suggesting references instead of copies.

## Functional Requirements

### FR-001: Documentation Router
When the user invokes `/docs`, the plugin shall detect the project type, scan existing documentation files, and recommend which documentation actions are needed.

### FR-002: Documentation Audit
When the user invokes `/docs:audit`, the plugin shall dispatch specialized agents (doc-auditor, dedup-detector, sot-mapper) in parallel, scan all documentation files, and produce a scored report with gaps, duplications, and staleness findings.

### FR-003: Documentation Fix
When the user invokes `/docs:fix`, the plugin shall present the audit findings interactively and, for each gap, ask the user whether to fix it, skip it, or defer it. Fixes shall invoke the appropriate existing skill (code-documenter, changelog-generator, readme-generator, etc.).

### FR-004: Pre-Release Documentation Gate
When the user invokes `/docs:pre-release`, the plugin shall run a full audit and block release recommendation if critical documentation gaps exist (missing CHANGELOG entry, outdated README version, JSDoc coverage < 100% on exports).

### FR-005: Documentation Routing
When the user invokes `/docs:route` with a description of their documentation need, the plugin shall recommend the best skill to use from the available ~50 documentation skills.

### FR-006: Source of Truth Detection
When the plugin audits documentation, it shall automatically scan all markdown and config files, detect where each type of information appears (architecture, version, API reference, CI/CD, etc.), build a SoT map, and flag information that appears in more than one document without being a reference.

### FR-007: Deduplication Suggestions
Where duplicated information is detected across documents, the plugin shall suggest replacing the duplicate with a reference to the source of truth document (e.g., "Architecture details: see CLAUDE.md § Architecture").

### FR-008: Automatic Project Detection
When the plugin runs for the first time in a project, it shall detect the project type (Node.js, Python, Ruby, Go, etc.), identify existing documentation files, and adapt the audit checklist accordingly.

### FR-009: Parallel Agent Dispatch
Where the user passes "parallel" as an argument to `/docs:audit` or `/docs:pre-release`, the plugin shall dispatch all audit agents simultaneously using multiple Task tool calls in a single message.

### FR-010: Incremental Audit
When the user invokes `/docs:audit` with a scope argument (e.g., "code", "project", "spec"), the plugin shall only dispatch agents relevant to that scope.

## Non-Functional Requirements

### Performance
- Audit of a typical project (20-30 doc files): < 60 seconds sequential, < 30 seconds parallel
- Router detection (`/docs:route`): < 5 seconds
- No external API calls — all local analysis

### Compatibility
- Works with any project type (Node.js, Python, Ruby, Go, etc.)
- No runtime dependencies beyond Claude Code plugin system
- Compatible with existing skills — invokes them, doesn't replace them

### Extensibility
- New documentation categories can be added by creating new agent files
- New skills can be integrated by adding entries to the skill routing table
- Per-project configuration via `.docs-arsenal.local.md` (optional, not required)

## Acceptance Criteria

### AC-001: Full Audit Flow
Given a project with README.md, CHANGELOG.md, CLAUDE.md, and source code with JSDoc,
When the user runs `/docs:audit`,
Then the plugin produces a scored report showing JSDoc coverage %, README freshness, CHANGELOG completeness, and a list of duplicated information across documents.

### AC-002: Deduplication Detection
Given a project where CLAUDE.md and README.md both describe the architecture,
When the plugin runs dedup-detector,
Then it identifies the duplicated sections and suggests which document should be the source of truth and how the other should reference it.

### AC-003: Pre-Release Gate
Given a project ready for release with an outdated README version number,
When the user runs `/docs:pre-release`,
Then the plugin reports "version mismatch: package.json says 1.5.0 but README says 1.4.1" as a critical finding and recommends blocking the release.

### AC-004: Interactive Fix
Given an audit report with 3 findings (1 critical, 2 important),
When the user runs `/docs:fix`,
Then the plugin presents each finding and asks whether to fix, skip, or defer, and for "fix" invokes the appropriate skill (e.g., code-documenter for JSDoc gaps).

### AC-005: Router Accuracy
Given a user who asks `/docs:route I need to document my API endpoints`,
When the router processes the request,
Then it recommends `code-documenter` (for OpenAPI/JSDoc) as primary and `api-lifecycle-specialist` as alternative.

### AC-006: SoT Map Generation
Given a project with no `.docs-arsenal.local.md` config,
When the plugin runs sot-mapper,
Then it auto-generates a SoT map by scanning all docs and outputs a suggested ownership table.

### AC-007: Parallel Execution
Given a user running `/docs:audit parallel`,
When agents are dispatched,
Then all agents launch simultaneously and results are aggregated after all complete.

### AC-008: Scope-Limited Audit
Given a user running `/docs:audit code`,
When the audit runs,
Then only code documentation agents run (JSDoc coverage, OpenAPI completeness) — not README, CHANGELOG, or spec audits.

## Error Handling

| Error Condition | Behavior |
|-----------------|----------|
| No documentation files found | Report "No documentation files detected. Run `/docs:route` for guidance on what to create." |
| Skill not installed | Skip that check and note in report: "Skill X not available — install for full audit" |
| Agent timeout (>120s) | Cancel agent, report partial results, note timeout |
| Empty project (no source code) | Report "No source code found. Documentation audit requires a codebase." |
| Conflicting SoT detection | Present both candidates and ask user to decide |

## Architecture

### Plugin Structure

```
~/.claude/plugins/local/docs-arsenal/
├── .claude-plugin/
│   └── plugin.json
├── agents/
│   ├── doc-auditor.md         # Scans for doc gaps (missing README sections, stale info)
│   ├── dedup-detector.md      # Detects duplicated information across documents
│   ├── sot-mapper.md          # Auto-generates Source of Truth ownership map
│   ├── code-doc-auditor.md    # JSDoc/TSDoc/OpenAPI coverage analysis
│   └── freshness-checker.md   # Detects stale docs (version mismatches, outdated refs)
├── commands/
│   ├── docs.md                # /docs — smart router
│   ├── audit.md               # /docs:audit — full or scoped audit
│   ├── fix.md                 # /docs:fix — interactive fix from audit
│   ├── pre-release.md         # /docs:pre-release — gate bloqueante
│   └── route.md               # /docs:route — which skill to use
├── skills/
│   └── doc-debt-tracker/      # Track doc debt across sessions (like test-debt-tracker)
│       └── SKILL.md
├── docs/
│   ├── skill-routing-table.md # Maps doc needs → skills
│   └── sot-patterns.md        # Common SoT patterns by project type
└── README.md
```

### Agent Responsibilities

| Agent | What it audits | Output |
|-------|---------------|--------|
| `doc-auditor` | Missing docs, incomplete sections, no description in package.json | Gap list with severity |
| `dedup-detector` | Same information in 2+ files, copy-pasted sections | Duplication pairs + SoT suggestion |
| `sot-mapper` | Scans all docs, builds ownership map per info type | SoT map (JSON/table) |
| `code-doc-auditor` | JSDoc/TSDoc coverage, missing @param/@returns, OpenAPI completeness | Coverage % + list of undocumented exports |
| `freshness-checker` | Version mismatches, dates, references to removed files/features | Stale items list |

### Skill Routing Table

| Need | Primary Skill | Alternative |
|------|--------------|-------------|
| JSDoc/TSDoc/docstrings | `code-documenter` | `engineering-technical-writer` |
| OpenAPI/Swagger | `code-documenter` | `api-lifecycle-specialist` |
| README creation | `readme-generator` | `documentation` (engineering) |
| CHANGELOG generation | `changelog-generator` | `changelog` (compound-eng) |
| Feature spec (new) | `feature-forge` | `write-spec` (product-mgmt) |
| Spec from code (reverse) | `spec-miner` | — |
| Co-authored doc | `doc-coauthoring` | — |
| Postmortem | `postmortem-writing` | `incident-response` |
| Runbook/SOP | `runbook` | `process-doc` |
| PDF/PPTX/DOCX | `specialized-document-generator` | `pdf`, `pptx`, `docx` |
| Social content | `content-repurposer` | `social-post-writer` |
| Blog/article | `content-research-writer` | — |
| KB article | `kb-article` | — |
| Architecture (ADR) | `architecture-designer` | `architecture` (engineering) |
| Repo indexing | `superclaude:index-repo` | `superclaude:index` |
| Technical writing | `superclaude:technical-writer` | `engineering-technical-writer` |
| Notion docs | `notion-knowledge-capture` | `notion-research-documentation` |

### Report Format

```
## docs-arsenal Audit Report

### Scores
- Code Documentation: 85/100 (JSDoc 92%, OpenAPI missing)
- Project Documentation: 70/100 (README outdated version, CHANGELOG OK)
- Specs: 100/100 (All features have specs)
- Freshness: 60/100 (3 docs reference removed features)
- Deduplication: 40/100 (Architecture described in 3 places)

### Overall: 71/100

### Critical (must fix before release)
1. [DEDUP] Architecture described in CLAUDE.md, README.md, and copilot-instructions.md
   → SoT: CLAUDE.md. Others should reference it.
2. [STALE] README says v1.4.1, package.json says v1.5.0
   → Fix: update README version

### Important (should fix)
3. [GAP] No JSDoc on 3 exported functions in nfe.execute.ts
   → Fix: run code-documenter
4. [GAP] CHANGELOG missing entry for current [Unreleased]
   → Fix: run changelog-generator

### Info
5. [DEDUP] Test count appears in README and CLAUDE.md (minor)

### Action Plan
1. Fix critical items first
2. Re-run: /docs:audit [failed-scope]
3. When all critical pass: /docs:pre-release
```

## Implementation TODO

### Plugin Scaffold
- [ ] Create `~/.claude/plugins/local/docs-arsenal/` directory structure
- [ ] Create `plugin.json` with name, version, description
- [ ] Create `README.md` with usage instructions

### Commands
- [ ] `/docs` — smart router command (detect + recommend)
- [ ] `/docs:audit` — dispatch agents, aggregate, score
- [ ] `/docs:fix` — interactive fix from audit findings
- [ ] `/docs:pre-release` — gate with blocking verdict
- [ ] `/docs:route` — skill routing from description

### Agents
- [ ] `doc-auditor.md` — gap detection agent
- [ ] `dedup-detector.md` — duplication detection agent
- [ ] `sot-mapper.md` — Source of Truth auto-mapper
- [ ] `code-doc-auditor.md` — JSDoc/OpenAPI coverage agent
- [ ] `freshness-checker.md` — staleness detection agent

### Skills
- [ ] `doc-debt-tracker` skill — track doc debt across sessions

### Documentation
- [ ] `docs/skill-routing-table.md` — complete routing map
- [ ] `docs/sot-patterns.md` — SoT patterns by project type

### Testing
- [ ] Test with n8n-nodes-brasil-hub (complex project, many living docs)
- [ ] Test with a fresh empty project (graceful handling)
- [ ] Test with a Python project (different doc patterns)
- [ ] Verify skill invocation works for each routed skill
- [ ] Verify dedup detection catches known duplications in brasil-hub

## Out of Scope

- Generating documentation from scratch for projects with zero docs (use individual skills)
- Enforcing SoT map (plugin suggests, user decides)
- Auto-commit documentation changes (user reviews and commits)
- Web-based documentation sites (Docusaurus, MkDocs) — those have their own tooling
- Replacing individual skills — docs-arsenal orchestrates, it doesn't reimplement

## Open Questions

- [ ] Should `/docs:fix` auto-invoke skills or show the commands for the user to run?
  → Decision: Interactive — shows finding, asks user, then invokes if approved
- [ ] Should the SoT map be persisted as a file (`.docs-arsenal.local.md`) or regenerated each time?
  → Recommendation: Auto-generate each time, but allow optional persistent config for overrides
- [ ] Should the plugin integrate with `planning-with-files` to update task_plan.md/findings.md?
  → Recommendation: Yes, update progress.md after audit runs

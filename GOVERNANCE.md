# Governance

## Model

This project follows the **BDFL (Benevolent Dictator For Life)** governance model, common for small open-source projects maintained by a single developer.

## Roles

| Role | Responsibility | Current Holder |
|------|---------------|----------------|
| **Maintainer (BDFL)** | Final decision on features, releases, merges, and project direction | [@luisbarcia](https://github.com/luisbarcia) |
| **Contributor** | Submit PRs, report issues, suggest features | Anyone following [CONTRIBUTING.md](.github/CONTRIBUTING.md) |

## Decision Process

1. **Routine changes** (bug fixes, docs, deps): Maintainer merges directly or via PR
2. **New features/resources**: Discussed in GitHub Issues before implementation
3. **Breaking changes**: Require an Issue discussion, migration plan, and CHANGELOG entry
4. **Architecture decisions**: Documented in `CLAUDE.md` (Architecture section)

## Contributions

All contributions are welcome via pull requests. The maintainer reviews and merges PRs. See [CONTRIBUTING.md](.github/CONTRIBUTING.md) for guidelines.

## Code of Conduct

All participants must follow our [Code of Conduct](.github/CODE_OF_CONDUCT.md).

## Continuity & Succession

This project can continue with minimal interruption if the maintainer becomes unavailable. The following measures ensure that issues can be created/closed, changes accepted, and releases published within one week:

### No keys or passwords required

- **Source code**: Public repository under MIT license — anyone can fork and continue immediately
- **Issues & PRs**: GitHub allows issues and discussions on public repos without maintainer action
- **Releases**: Any fork can publish releases; npm package can be republished under a new name instantly

### Ownership transfer (if maintainer cooperates or via estate)

- **npm package**: Transfer via `npm owner add <new-maintainer>` (requires current owner or npm support)
- **GitHub repository**: Transfer via Settings > Transfer (requires current owner or GitHub support with legal documentation)
- **Domain/DNS**: No custom domain — project uses github.com and npmjs.com only

### How to claim maintainership

1. Open an Issue on this repository (or a fork) stating intent to maintain
2. If the maintainer does not respond within 2 weeks, fork the repository
3. Publish the fork to npm (under a new package name or request npm support for transfer)
4. Update the n8n community to point to the new package

### Legal

The MIT license grants perpetual, irrevocable rights to use, modify, and distribute the software. No additional legal rights are needed to continue the project.

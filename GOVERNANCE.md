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

## Succession

If the maintainer becomes unavailable:

- The repository is public under MIT license — anyone can fork
- npm package ownership can be transferred via `npm owner add`
- GitHub repository can be transferred via Settings > Transfer
- Interested parties should open an Issue requesting maintainer access

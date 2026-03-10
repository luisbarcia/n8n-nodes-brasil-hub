# Contributing to n8n-nodes-brasil-hub

Thank you for your interest in contributing! This guide will help you get started.

## Development Setup

### Prerequisites

- Node.js 18+ (20 recommended)
- npm 9+
- An n8n instance for testing (local or Docker)

### Getting Started

```bash
# Clone the repository
git clone https://github.com/luisbarcia/n8n-nodes-brasil-hub.git
cd n8n-nodes-brasil-hub

# Install dependencies
npm install

# Run tests
npm test

# Build
npm run build

# Lint
npm run lint
```

### Testing Locally with n8n

```bash
# Build the package
npm run build

# Link it globally
npm link

# In your n8n installation directory
npm link n8n-nodes-brasil-hub

# Restart n8n — the Brasil Hub node should appear
```

## Project Structure

```
nodes/BrasilHub/
├── BrasilHub.node.ts           # Main node class with router
├── BrasilHub.node.json         # Codex metadata
├── brasilHub.svg               # Node icon
├── types.ts                    # TypeScript interfaces
├── shared/
│   ├── validators.ts           # CNPJ/CEP validation (local, no API)
│   └── fallback.ts             # Multi-provider fallback logic
└── resources/
    ├── cnpj/                   # CNPJ resource (description, execute, normalize)
    └── cep/                    # CEP resource (description, execute, normalize)
```

## Adding a New Resource

1. Create `nodes/BrasilHub/resources/<name>/` with 3 files:
   - `<name>.description.ts` — `INodeProperties[]` (fields + operations)
   - `<name>.execute.ts` — Execute handler functions
   - `<name>.normalize.ts` — Provider response normalizers
2. Add output interfaces to `nodes/BrasilHub/types.ts`
3. Register in the dictionary map in `BrasilHub.node.ts`
4. Add tests in `__tests__/`

## Code Guidelines

### n8n Node Conventions

- **All UI text must be in English** (n8n Cloud requirement)
- `noDataExpression: true` on Resource and Operation fields
- Every Operation option must have an `action` property
- Boolean descriptions must start with "Whether"
- Title Case for `displayName` values
- No trailing period on single-sentence `description` values
- Always use `continueOnFail()` with `pairedItem` linking

### TypeScript

- Strict mode enabled
- Use `NodeApiError` for API errors (preserves HTTP status)
- Use `NodeOperationError` for validation/operation errors with `itemIndex`

### Testing

- TDD approach: write failing test first, then implement
- Jest + ts-jest
- Use `jest.useFakeTimers()` for tests involving delays
- Test normalizers with real API response fixtures per provider

## Commit Messages

We use [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add Banks resource with BrasilAPI provider
fix: handle empty CNPJ response from ReceitaWS
test: add edge case tests for CEP normalizer
docs: update README with Banks resource documentation
chore: update dependencies
```

## Pull Request Process

1. Fork the repository and create a feature branch from `main`
2. Write tests for your changes
3. Ensure all tests pass: `npm test`
4. Ensure lint passes: `npm run lint`
5. Ensure build succeeds: `npm run build`
6. Submit a pull request using the PR template

## Reporting Issues

- Use the [Bug Report](https://github.com/luisbarcia/n8n-nodes-brasil-hub/issues/new?template=bug_report.yml) template for bugs
- Use the [Feature Request](https://github.com/luisbarcia/n8n-nodes-brasil-hub/issues/new?template=feature_request.yml) template for new features
- Search existing issues before creating a new one

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

---
title: Brasil Hub vs CNPJ Hub vs HTTP Request — choosing the right approach for Brazilian data in n8n
---

# Brasil Hub vs alternatives

Three ways to query Brazilian public data in n8n. Here's how they compare.

## Feature comparison

| Feature | Brasil Hub | CNPJ Hub | HTTP Request |
|---------|-----------|----------|-------------|
| Resources | 11 (CNPJ, CEP, CPF, Banks, DDD, Fake, Holidays, FIPE, IBGE, NCM, PIX) | 1 (CNPJ only) | Any (manual setup) |
| Operations | 24 | 2 (Query, Validate) | Unlimited (manual) |
| Providers | 23 with automatic fallback | 5 with fallback | 1 per node (no fallback) |
| Credentials needed | None | None | Depends on API |
| Normalized output | Yes (same schema regardless of provider) | Yes | No (raw API response) |
| Rate limit handling | Detects 429, skips to next provider | Configurable delay | Manual retry logic |
| AI Agent compatible | Yes (`usableAsTool: true`) | No | No |
| Fake data generation | Yes (Person, Company, CPF, CNPJ) | No | No |
| Configurable timeout | 1-60s per operation | No | Yes |
| Provider selection | Dropdown to pick primary provider | No | N/A |
| Output modes | Simplified, Full, AI Summary (CNPJ) | Raw, Normalized | Raw |
| Tests | 1349 | Unknown | N/A |
| npm provenance | Yes | No | N/A |

## When to use each

### Use Brasil Hub when:
- You need more than just CNPJ (CEP, CPF, banks, FIPE, IBGE, PIX, etc.)
- Reliability matters (automatic fallback across 2-7 providers)
- You want consistent output without Code nodes to normalize
- You need AI Agent tool compatibility
- You want to generate fake test data

### Use CNPJ Hub when:
- You only need CNPJ lookups
- You're already using it and it works for your case

### Use HTTP Request when:
- You need an API that Brasil Hub doesn't cover yet
- You need custom headers or authentication
- You want full control over the request

## Migration from HTTP Request

If you're currently using HTTP Request nodes to call BrasilAPI, ViaCEP, or similar:

1. Install Brasil Hub: **Settings > Community Nodes > `n8n-nodes-brasil-hub`**
2. Replace the HTTP Request node with a Brasil Hub node
3. Select the resource and operation
4. Remove any Code nodes that were normalizing the response (Brasil Hub already normalizes)
5. Remove any IF nodes that were handling API failures (Brasil Hub has built-in fallback)

The output fields match common schemas, so downstream nodes should work with minimal changes.

## Migration from CNPJ Hub

Brasil Hub covers everything CNPJ Hub does, plus 10 more resources:

1. Install Brasil Hub
2. Replace CNPJ Hub nodes with Brasil Hub (Resource: CNPJ)
3. The output schema is compatible -- `razao_social`, `situacao`, `endereco` fields are the same
4. Optionally uninstall CNPJ Hub

## Links

- [Brasil Hub on npm](https://www.npmjs.com/package/n8n-nodes-brasil-hub)
- [Brasil Hub on GitHub](https://github.com/luisbarcia/n8n-nodes-brasil-hub)
- [CNPJ Hub on GitHub](https://github.com/dssiqueira/n8n-nodes-cnpj-hub)

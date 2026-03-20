---
title: How to query Brazilian public data in n8n without writing code
published: false
description: One node, 11 resources, 23 providers. Query CNPJ, CEP, CPF, banks, FIPE, IBGE, PIX and more with automatic fallback.
tags: n8n, brazil, automation, api
canonical_url: https://github.com/luisbarcia/n8n-nodes-brasil-hub
---

If you automate anything involving Brazilian data in n8n, you've probably built the same thing I did: an HTTP Request node pointing at BrasilAPI, a Code node to normalize the response, and a silent prayer that the API stays up at 2am when your workflow runs.

I got tired of rebuilding this for every project. So I built Brasil Hub -- a single n8n community node that handles CNPJ, CEP, CPF, banks, DDD, holidays, FIPE vehicle prices, IBGE geography, NCM tax codes, PIX participants, and even fake test data generation. 11 resources, 23 providers, automatic fallback, zero credentials.

Here's how to use it.

## Install

In n8n: **Settings > Community Nodes > Install > `n8n-nodes-brasil-hub`**

That's it. No API keys. No configuration.

## Example 1: Look up a company by CNPJ

Add a Brasil Hub node. Set Resource to **CNPJ**, Operation to **Query**, and type a CNPJ number.

The output is normalized regardless of which provider responds:

```json
{
  "cnpj": "00000000000191",
  "razao_social": "BANCO DO BRASIL SA",
  "situacao": "ATIVA",
  "endereco": {
    "municipio": "BRASILIA",
    "uf": "DF"
  },
  "_meta": {
    "provider": "brasilapi",
    "strategy": "direct"
  }
}
```

If BrasilAPI is down, the node tries CNPJ.ws, then ReceitaWS, then MinhaReceita, then three more providers. Seven total. You don't need to configure any of this -- it just works.

## Example 2: Validate addresses in bulk

Set Resource to **CEP**, Operation to **Query**. Feed it a list of CEPs from a Google Sheets node or database query. Each item gets its own address lookup with full fallback across 4 providers (BrasilAPI, ViaCEP, OpenCEP, ApiCEP).

The Validate operation checks CEP format locally without making an API call -- useful for filtering bad data before hitting the network.

## Example 3: Generate test data

This is the one I use most during development. Set Resource to **Fake**, Operation to **Person**, Quantity to **10**.

You get 10 realistic Brazilian profiles -- each with a valid CPF (checksum-correct), RG, birth date, email, phone number with the correct DDD for the state, and a full address where the CEP prefix matches the state.

No API calls. Everything runs locally. The CPF and CNPJ generators use the same checksum algorithm as the Receita Federal, so the generated documents pass any validation you throw at them.

## Example 4: FIPE vehicle prices for insurance

The FIPE resource has a hierarchical lookup: Brands > Models > Years > Price. The Reference Tables operation lists all 300+ monthly FIPE tables going back to 2001, so you can query historical prices too.

## Example 5: PIX participant lookup

Need to check if an institution participates in PIX? The PIX resource queries the Central Bank directory. List all 890+ participants or look up a specific one by ISPB code.

## How fallback works

```
Your query > Provider 1 (BrasilAPI)
                 |-- Success > Return data
                 |-- Fail > Provider 2 (ViaCEP / CNPJ.ws)
                                |-- Success > Return data
                                |-- Fail > Provider 3...
                                               |-- up to 7 for CNPJ
```

Each provider gets a configurable timeout (default 10s, range 1-60s). If any provider returns HTTP 429 (rate limited), the node skips to the next one and includes `rate_limited: true` in the metadata.

The output schema is always the same regardless of which provider answered. Your downstream workflow doesn't need to care.

## Using it as an AI Agent tool

Brasil Hub works as a tool in n8n AI Agent workflows (`usableAsTool: true`). Ask your agent "what company is registered under CNPJ 00.000.000/0001-91?" and it will call the node automatically.

For CNPJ queries, the AI Summary output mode returns flat English fields that LLMs can parse easily:

```json
{
  "company": "BANCO DO BRASIL SA",
  "status": "ATIVA",
  "city": "BRASILIA/DF",
  "activity": "Bancos multiplos (6422100)"
}
```

## The numbers

- 11 resources, 24 operations, 23 providers
- 1349 automated tests
- Zero runtime dependencies
- MIT license
- npm provenance + build attestation

## Install it

```bash
# In n8n:
# Settings > Community Nodes > Install > n8n-nodes-brasil-hub

# Or via npm:
npm install n8n-nodes-brasil-hub
```

- npm: [n8n-nodes-brasil-hub](https://www.npmjs.com/package/n8n-nodes-brasil-hub)
- GitHub: [luisbarcia/n8n-nodes-brasil-hub](https://github.com/luisbarcia/n8n-nodes-brasil-hub)

If you work with Brazilian data in n8n, give it a try. I'm on GitHub if you run into issues or have feature requests.

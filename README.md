<p align="center">
  <img src="nodes/BrasilHub/brasilHub.svg" alt="Brasil Hub" width="80" height="80">
</p>

<h1 align="center">Brasil Hub for n8n</h1>

<p align="center">
  Query Brazilian public data (CNPJ, CEP, CPF, Banks, DDD, Holidays, FIPE, IBGE, NCM, PIX, Câmbio, Taxas) + generate fake test data — automatic multi-provider fallback, zero credentials.
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/n8n-nodes-brasil-hub"><img src="https://img.shields.io/npm/dw/n8n-nodes-brasil-hub?style=for-the-badge&label=downloads&color=blue" alt="npm downloads"></a>
  &nbsp;
  <a href="https://github.com/luisbarcia/n8n-nodes-brasil-hub/stargazers"><img src="https://img.shields.io/github/stars/luisbarcia/n8n-nodes-brasil-hub?style=for-the-badge&color=gold" alt="GitHub stars"></a>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/n8n-nodes-brasil-hub"><img src="https://img.shields.io/npm/v/n8n-nodes-brasil-hub" alt="npm version"></a>
  <a href="https://github.com/luisbarcia/n8n-nodes-brasil-hub/actions/workflows/ci.yml"><img src="https://github.com/luisbarcia/n8n-nodes-brasil-hub/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
  <a href="https://sonarcloud.io/dashboard?id=luisbarcia_n8n-nodes-brasil-hub"><img src="https://sonarcloud.io/api/project_badges/measure?project=luisbarcia_n8n-nodes-brasil-hub&metric=alert_status" alt="Quality Gate Status"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-yellow.svg" alt="License: MIT"></a>
</p>

---

> **v1.4** — 13 resources, 28 operations, 25 providers + local fake data generation. The API is stable and follows semantic versioning.

---

## Why Brasil Hub?

Most Brazilian public data APIs are free but unreliable. A single provider going down breaks your entire workflow. Brasil Hub solves this:

- **Up to 7 providers per resource** — if one fails, the next kicks in automatically
- **Normalized output** — same schema regardless of which provider responds
- **No credentials needed** — all providers are public APIs
- **AI Agent ready** — works as a tool in n8n AI Agent workflows

## Installation

In your n8n instance: **Settings** → **Community Nodes** → search `n8n-nodes-brasil-hub` → **Install**

Or via CLI:

```bash
npm install n8n-nodes-brasil-hub
```

## Operations

| Resource | Operation | Description | Providers |
|----------|-----------|-------------|-----------|
| **Bank** | Query | Fetch bank info by COMPE code | BrasilAPI → BancosBrasileiros |
| **Bank** | List | List all Brazilian banks | BrasilAPI → BancosBrasileiros |
| **Câmbio** | List Currencies | List all available currencies from the Central Bank | BrasilAPI |
| **Câmbio** | Query Rate | Fetch exchange rate quotations by currency and date | BrasilAPI |
| **CEP** | Query | Fetch address data by CEP number | BrasilAPI → ViaCEP → OpenCEP → ApiCEP |
| **CEP** | Validate | Check if CEP format is valid (local, no API) | — |
| **CNPJ** | Query | Fetch company data by CNPJ number | BrasilAPI → CNPJ.ws → ReceitaWS → MinhaReceita → OpenCNPJ.org → OpenCNPJ.com → CNPJA |
| **CNPJ** | Validate | Check if CNPJ is valid (local checksum, no API) | — |
| **CPF** | Validate | Check if CPF is valid (local checksum, no API) | — |
| **DDD** | Query | Fetch state and cities by area code | BrasilAPI → municipios-brasileiros |
| **Fake** | Person | Generate fake Brazilian person profile | Local (no API) |
| **Fake** | Company | Generate fake Brazilian company profile | Local (no API) |
| **Fake** | CPF | Generate valid fake CPF numbers | Local (no API) |
| **Fake** | CNPJ | Generate valid fake CNPJ numbers | Local (no API) |
| **Holiday** | Query | Fetch public holidays by year | BrasilAPI → Nager.Date |
| **FIPE** | Brands | List vehicle brands by type | parallelum |
| **FIPE** | Models | List models for a brand | parallelum |
| **FIPE** | Price | Get FIPE table price for a vehicle | parallelum |
| **FIPE** | Reference Tables | List available FIPE reference tables | parallelum |
| **FIPE** | Years | List available years for a model | parallelum |
| **IBGE** | States | List all Brazilian states | BrasilAPI → IBGE API |
| **IBGE** | Cities | List municipalities by state | BrasilAPI → IBGE API |
| **NCM** | Query | Fetch tax classification by code | BrasilAPI |
| **NCM** | Search | Search tax codes by description | BrasilAPI |
| **PIX** | List | List all PIX participants | BrasilAPI |
| **PIX** | Query | Look up PIX participant by ISPB code | BrasilAPI |
| **Taxas** | List | List all available Brazilian interest rates | BrasilAPI |
| **Taxas** | Query | Query a specific interest rate by code (Selic, CDI, IPCA) | BrasilAPI |

## Example Output

<details>
<summary><strong>CNPJ Query</strong></summary>

```json
{
  "cnpj": "00000000000191",
  "razao_social": "BANCO DO BRASIL SA",
  "nome_fantasia": "DIRECAO GERAL",
  "situacao": "ATIVA",
  "data_abertura": "1966-08-01",
  "porte": "DEMAIS",
  "natureza_juridica": "Sociedade de Economia Mista",
  "capital_social": 120000000000,
  "atividade_principal": {
    "codigo": "6422100",
    "descricao": "Bancos múltiplos, com carteira comercial"
  },
  "endereco": {
    "logradouro": "SAUN QUADRA 5 LOTE B",
    "numero": "S/N",
    "bairro": "ASA NORTE",
    "cep": "70040912",
    "municipio": "BRASILIA",
    "uf": "DF"
  },
  "contato": {
    "telefone": "6134934000",
    "email": ""
  },
  "socios": [
    {
      "nome": "TARCIANA PAULA GOMES MEDEIROS",
      "qualificacao": "Presidente"
    }
  ],
  "_meta": {
    "provider": "brasilapi",
    "strategy": "direct",
    "queried_at": "2026-03-10T12:00:00.000Z"
  }
}
```

</details>

<details>
<summary><strong>CEP Query</strong></summary>

```json
{
  "cep": "01001000",
  "logradouro": "Praça da Sé",
  "bairro": "Sé",
  "cidade": "São Paulo",
  "uf": "SP",
  "_meta": {
    "provider": "brasilapi",
    "strategy": "direct",
    "queried_at": "2026-03-10T12:00:00.000Z"
  }
}
```

</details>

## How Fallback Works

```
Request → Provider 1 (BrasilAPI)
              ├─ Success → Return normalized data
              └─ Fail → Provider 2 (CNPJ.ws / ViaCEP)
                            ├─ Success → Return normalized data
                            └─ Fail → Provider 3 (ReceitaWS / OpenCEP)
                                          ├─ Success → Return normalized data
                                          └─ Fail → Return error with all failures
```

Each provider has a **configurable timeout** (default: 10 seconds, range: 1–60s). The `_meta.strategy` field tells you if the response came from the primary provider (`direct`) or a fallback.

## FAQ

**Do I need API keys or credentials?**
No. All data providers used by Brasil Hub are free public APIs. Just install the node and start querying. Zero configuration needed.

**What happens when a provider API goes down?**
Brasil Hub automatically tries the next provider. For CNPJ queries, there are 7 fallback providers. You can see which provider responded in the `_meta.strategy` field ("direct" or "fallback").

**Can I choose which provider to use first?**
Yes. Each resource with multiple providers has a "Primary Provider" dropdown. Pick your preferred provider and it becomes the first one tried.

**Does it work with n8n AI Agents?**
Yes. Brasil Hub has `usableAsTool: true`, so you can add it as a tool in any n8n AI Agent workflow. The AI Summary output mode for CNPJ returns flat English fields optimized for LLM consumption.

**Can I query exchange rates and interest rates?**
Yes. The Câmbio resource fetches exchange rate quotations from the Central Bank (BCB) by currency and date. The Taxas resource queries official interest rates and indices (Selic, CDI, IPCA). Both use BrasilAPI as provider.

**Can I generate fake test data?**
Yes. The Fake resource generates realistic Brazilian test data locally (no API calls): person profiles with valid CPF, company profiles with valid CNPJ, or standalone CPF/CNPJ numbers. All checksums are correct.

**How does Brasil Hub compare to using HTTP Request nodes?**
With HTTP Request nodes you need to handle each API individually, normalize different response formats, implement fallback logic, and deal with rate limits. Brasil Hub handles all of this in a single node with consistent output.

**What n8n versions are supported?**
n8n 1.0+ with Node.js 20 or 22. The node follows semantic versioning -- minor updates add features, patch updates fix bugs, and no breaking changes within a major version.

## Compatibility

| | Version |
|---|---------|
| **n8n** | 1.0+ |
| **Node.js** | 20, 22 |

## Development

```bash
git clone https://github.com/luisbarcia/n8n-nodes-brasil-hub.git
cd n8n-nodes-brasil-hub
npm install
npm test          # 1665 tests, 99%+ coverage
npm run build
npm run lint
```

To test locally in n8n:

```bash
npm run build && npm link
# In your n8n directory:
npm link n8n-nodes-brasil-hub
```

See [CONTRIBUTING.md](.github/CONTRIBUTING.md) for full development guidelines.

## Project

| | |
|---|---|
| [Roadmap](ROADMAP.md) | Planned features and version history |
| [Changelog](CHANGELOG.md) | Version history |
| [Contributing](.github/CONTRIBUTING.md) | How to contribute |
| [Security](.github/SECURITY.md) | Vulnerability reporting |
| [Governance](GOVERNANCE.md) | Decision-making process |
| [Code of Conduct](.github/CODE_OF_CONDUCT.md) | Community standards |

## License

[MIT](LICENSE) — Luis Barcia

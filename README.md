<p align="center">
  <img src="nodes/BrasilHub/brasilHub.svg" alt="Brasil Hub" width="80" height="80">
</p>

<h1 align="center">Brasil Hub for n8n</h1>

<p align="center">
  Query Brazilian public data (CNPJ, CEP, CPF, Banks, DDD &amp; FIPE) with automatic multi-provider fallback — zero configuration, zero credentials.
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/n8n-nodes-brasil-hub"><img src="https://img.shields.io/npm/v/n8n-nodes-brasil-hub" alt="npm version"></a>
  <a href="https://github.com/luisbarcia/n8n-nodes-brasil-hub/actions/workflows/ci.yml"><img src="https://github.com/luisbarcia/n8n-nodes-brasil-hub/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
  <a href="https://sonarcloud.io/dashboard?id=luisbarcia_n8n-nodes-brasil-hub"><img src="https://sonarcloud.io/api/project_badges/measure?project=luisbarcia_n8n-nodes-brasil-hub&metric=alert_status" alt="Quality Gate Status"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-yellow.svg" alt="License: MIT"></a>
</p>

---

> **Development Status:** This package is in active development (v0.x). The API is stable but may receive breaking changes in minor versions. Please pin your version in `package.json`.

---

## Why Brasil Hub?

Most Brazilian public data APIs are free but unreliable. A single provider going down breaks your entire workflow. Brasil Hub solves this:

- **3 providers per resource** — if one fails, the next kicks in automatically
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
| **CEP** | Query | Fetch address data by CEP number | BrasilAPI → ViaCEP → OpenCEP |
| **CEP** | Validate | Check if CEP format is valid (local, no API) | — |
| **CNPJ** | Query | Fetch company data by CNPJ number | BrasilAPI → CNPJ.ws → ReceitaWS |
| **CNPJ** | Validate | Check if CNPJ is valid (local checksum, no API) | — |
| **CPF** | Validate | Check if CPF is valid (local checksum, no API) | — |
| **DDD** | Query | Fetch state and cities by area code | BrasilAPI → municipios-brasileiros |
| **FIPE** | Brands | List vehicle brands by type | parallelum |
| **FIPE** | Models | List models for a brand | parallelum |
| **FIPE** | Years | List available years for a model | parallelum |
| **FIPE** | Price | Get FIPE table price for a vehicle | parallelum |

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

Each provider has a **10-second timeout**. The `_meta.strategy` field tells you if the response came from the primary provider (`direct`) or a fallback.

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
npm test          # 419 tests, 99%+ coverage
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
| [Roadmap](ROADMAP.md) | Planned features (Feriados, more providers) |
| [Changelog](CHANGELOG.md) | Version history |
| [Contributing](.github/CONTRIBUTING.md) | How to contribute |
| [Security](.github/SECURITY.md) | Vulnerability reporting |
| [Governance](GOVERNANCE.md) | Decision-making process |
| [Code of Conduct](.github/CODE_OF_CONDUCT.md) | Community standards |

## License

[MIT](LICENSE) — Luis Barcia

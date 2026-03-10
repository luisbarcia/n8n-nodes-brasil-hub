# n8n-nodes-brasil-hub

Community n8n node for querying Brazilian public data with multi-provider fallback.

## Features

- **CNPJ** — Query company data or validate CNPJ numbers
- **CEP** — Query address data or validate CEP numbers
- **Multi-provider fallback** — Automatic failover between 3 providers per resource
- **Normalized output** — Unified schema regardless of which provider responds
- **AI Agent ready** — `usableAsTool: true` for use with n8n AI Agent nodes

## Installation

1. Open your n8n instance
2. Go to **Settings** > **Community Nodes**
3. Search for `n8n-nodes-brasil-hub`
4. Click **Install**

Or install manually:

```bash
npm install n8n-nodes-brasil-hub
```

## Operations

| Resource | Operation | Description |
|----------|-----------|-------------|
| CNPJ | Query | Fetch company data from public APIs by CNPJ number |
| CNPJ | Validate | Check if a CNPJ number is valid (local checksum, no API call) |
| CEP | Query | Fetch address data from public APIs by CEP number |
| CEP | Validate | Check if a CEP number has valid format (local, no API call) |

## Providers

### CNPJ (fallback order)
1. [BrasilAPI](https://brasilapi.com.br) (primary)
2. [CNPJ.ws](https://publica.cnpj.ws)
3. [ReceitaWS](https://receitaws.com.br)

### CEP (fallback order)
1. [BrasilAPI](https://brasilapi.com.br) (primary)
2. [ViaCEP](https://viacep.com.br)
3. [OpenCEP](https://opencep.com)

## Example Output

### CNPJ Query

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
    "complemento": "...",
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
      "cpf_cnpj": "***456789**",
      "qualificacao": "Presidente",
      "data_entrada": "2023-01-16"
    }
  ],
  "_meta": {
    "provider": "brasilapi",
    "query": "00000000000191",
    "queried_at": "2026-03-10T12:00:00.000Z",
    "strategy": "fallback"
  }
}
```

### CEP Query

```json
{
  "cep": "01001000",
  "logradouro": "Praça da Sé",
  "complemento": "",
  "bairro": "Sé",
  "cidade": "São Paulo",
  "uf": "SP",
  "ibge": "",
  "ddd": "",
  "_meta": {
    "provider": "brasilapi",
    "query": "01001000",
    "queried_at": "2026-03-10T12:00:00.000Z",
    "strategy": "fallback"
  }
}
```

## Compatibility

- **n8n:** 1.0+
- **Node.js:** 18, 20, 22

## Development

```bash
npm install
npm test
npm run build
npm run lint
```

See [CONTRIBUTING.md](.github/CONTRIBUTING.md) for details.

## License

[MIT](LICENSE)

# Design Spec: Brasil Hub v0.2.0

**Date:** 2026-03-11
**Status:** Approved
**Goal:** Feature parity with all competitors + exclusive features. After v0.2, no other n8n node covers more Brazilian data endpoints or has higher quality.

## Competitive Context

| Competitor | What they have that we don't (pre-v0.2) |
|-----------|----------------------------------------|
| cnpj-hub (dssiqueira) | 3 extra CNPJ providers (CNPJA, MinhaReceita, OpenCNPJ) |
| brasilapi-dv (diversao) | DDD, FIPE, Feriados |

After v0.2 we cover everything above plus CPF validate, Banks, Simplify, and more providers per resource than any competitor.

## Resources & Operations

| Resource | Operations | Providers | Notes |
|----------|-----------|-----------|-------|
| CNPJ | Query, Validate | BrasilAPI → CNPJ.ws → ReceitaWS → MinhaReceita → OpenCNPJ.org → OpenCNPJ.com → CNPJA | +4 providers (7 total), +Simplify param |
| CEP | Query, Validate | BrasilAPI → ViaCEP → OpenCEP → ApiCEP | +1 provider (4 total) |
| CPF | Validate | None (local checksum) | New, single operation |
| Banks | Query, List | BrasilAPI → BancosBrasileiros | New, 2 providers |
| DDD | Query | BrasilAPI | New, single provider (only public API available) |
| FIPE | Brands, Models, Years, Price | parallelum → BrasilAPI | New, 2 providers, 4 ops |
| Feriados | Query | BrasilAPI → Nager.Date | New, 2 providers |

**Totals:** 7 resources, 12 operations, 7 CNPJ providers, 4 CEP providers.

## Design Decisions

| Decision | Rationale |
|----------|-----------|
| FIPE: parallelum as primary, BrasilAPI as secondary | parallelum has full hierarchy (brands→models→years→price). BrasilAPI lacks Years endpoint and Models only returns names (no codes). parallelum covers the complete navigation flow |
| FIPE as 4 distinct operations with displayOptions | n8n pattern (Google Sheets). Years operation now possible via parallelum. Fixes brasilapi-dv's problem of showing all params always |
| FIPE vehicleType: English display names, Portuguese API values | Dropdown shows "Cars/Motorcycles/Trucks" but `value` is `carros/motos/caminhoes`. n8n options handle this natively |
| CNPJ: 7 providers, originals first | Preserves v0.1 behavior. OpenCNPJ.com (kitana) is separate from OpenCNPJ.org — different schema, host, rate limits. CNPJA last (aggressive rate limiting) |
| CEP: add ApiCEP as 4th provider | Tested and working. Requires hyphen in CEP (normalizer handles). Increases resilience |
| Banks: BancosBrasileiros as fallback | GitHub raw JSON with 20+ fields vs BrasilAPI's 4. Richer data, daily updates, CDN-hosted |
| Feriados: Nager.Date as fallback | Open source, richer data (fixed/moveable, counties, types). Covers 100+ countries |
| Feriados output: 1 item per holiday | n8n paradigm — each item flows independently |
| Banks: Query + List operations | n8n CRUD pattern (Get / Get All) |
| All resources get normalizers even with 1 provider | Isolates output schema from API changes. Consistent architecture |
| CPF as its own resource | Clean extensibility. Resource with 1 op is fine (Google Calendar does it) |
| Simplify: 8 fields with snake_case | Consistent with existing full output keys |

## Fallback Chains

### CNPJ (7 providers)

```
BrasilAPI → CNPJ.ws → ReceitaWS → MinhaReceita → OpenCNPJ.org → OpenCNPJ.com → CNPJA
|__________ originals (unchanged) _________|_____________ new (appended) ______________|
```

OpenCNPJ.org (50 req/s) before OpenCNPJ.com (100 req/min) — .org is faster. CNPJA last — aggressive rate limits, 429 expected.

### CEP (4 providers)

```
BrasilAPI → ViaCEP → OpenCEP → ApiCEP
|______ originals (unchanged) __|_ new _|
```

ApiCEP requires hyphen in CEP input (`XXXXX-XXX`). The normalizer must format before calling.

### FIPE (2 providers)

```
parallelum (primary) → BrasilAPI (fallback for Price by code)
```

parallelum provides full hierarchy. BrasilAPI provides direct price lookup by FIPE code. For Brands/Models/Years, only parallelum is used (BrasilAPI lacks Years and Models returns incomplete data).

### Banks (2 providers)

```
BrasilAPI → BancosBrasileiros (raw JSON)
```

BancosBrasileiros URL: `https://raw.githubusercontent.com/guibranco/BancosBrasileiros/main/data/bancos.json`

### Feriados (2 providers)

```
BrasilAPI → Nager.Date
```

Nager.Date URL: `https://date.nager.at/api/v3/PublicHolidays/{year}/BR`

### DDD (1 provider)

```
BrasilAPI (only public API available)
```

## CNPJ Simplify Output

When `Simplify = true`, output uses the same `snake_case` keys as the full output:

```json
{
  "cnpj": "11.222.333/0001-81",
  "razao_social": "Nome da Empresa",
  "nome_fantasia": "Nome Fantasia",
  "situacao": "Ativa",
  "data_abertura": "2009-09-02",
  "uf": "RS",
  "municipio": "São Sebastião do Caí",
  "cep": "95760000"
}
```

Note: `uf`, `municipio`, and `cep` are pulled from the nested `endereco` object and flattened to top level in Simplify mode.

Full output (default) remains unchanged from v0.1.

## FIPE Operations & Conditional Parameters

With parallelum as primary, all 4 operations are fully supported:

```
Operation: Brands
  └─ vehicleType (Cars→carros | Motorcycles→motos | Trucks→caminhoes)
  Endpoint: GET /fipe/api/v1/{tipoVeiculo}/marcas
  Output: [{codigo: "59", nome: "VW - VolksWagen"}, ...]

Operation: Models
  └─ vehicleType
  └─ brandCode (string, e.g. "59")
  Endpoint: GET /fipe/api/v1/{tipoVeiculo}/marcas/{brandCode}/modelos
  Output: {modelos: [{codigo: 5585, nome: "AMAROK CD2.0..."}, ...], anos: [{codigo: "2024-1", nome: "2024 Gasolina"}, ...]}

Operation: Years
  └─ vehicleType
  └─ brandCode
  └─ modelCode (string, e.g. "5585")
  Endpoint: GET /fipe/api/v1/{tipoVeiculo}/marcas/{brandCode}/modelos/{modelCode}/anos
  Output: [{codigo: "2024-1", nome: "2024 Gasolina"}, ...]

Operation: Price
  └─ vehicleType
  └─ brandCode
  └─ modelCode
  └─ yearCode (string, e.g. "2024-1", format: year-fuelType where 1=gasoline, 2=ethanol, 3=diesel)
  Endpoint: GET /fipe/api/v1/{tipoVeiculo}/marcas/{brandCode}/modelos/{modelCode}/anos/{yearCode}
  Output: {Valor: "R$ 150.000,00", Marca: "VW", Modelo: "AMAROK...", AnoModelo: 2024, Combustivel: "Gasolina", CodigoFipe: "005527-6", MesReferencia: "março de 2026", ...}
```

Each operation shows only relevant fields via `displayOptions`. The parallelum yearCode format (`YYYY-F` where F is fuel type) is documented in the description field.

Optional `referenceTable` parameter on all operations (integer code). When omitted, uses the latest FIPE table.

## Input Validation

| Resource | Operation | Validation | Error Message |
|----------|-----------|-----------|---------------|
| CPF | Validate | Módulo 11 checksum (2 check digits) + reject all-same-digit CPFs (000.000.000-00 through 999.999.999-99) | "Invalid CPF: checksum does not match" |
| DDD | Query | Must be 2 digits, range 11–99 | "Invalid DDD: must be a 2-digit area code between 11 and 99" |
| Banks | Query | Must be a positive integer | "Invalid bank code: must be a positive number" |
| Banks | List | None (no input) | — |
| FIPE | Brands | vehicleType validated by dropdown (no free input) | — |
| FIPE | Models | brandCode must be non-empty string | "Brand code is required" |
| FIPE | Years | brandCode + modelCode must be non-empty | "Brand code and model code are required" |
| FIPE | Price | brandCode + modelCode + yearCode must be non-empty | "Brand code, model code, and year code are required" |
| Feriados | Query | Year must be 4 digits, range 1900–2199 | "Invalid year: must be between 1900 and 2199" |

CPF Módulo 11 algorithm: weights `[10,9,8,7,6,5,4,3,2]` for first check digit, `[11,10,9,8,7,6,5,4,3,2]` for second. All-same-digit CPFs (11 values: 000...000 through 999...999) are mathematically valid but legally invalid — must be explicitly rejected.

## New CNPJ Provider Response Schemas

### MinhaReceita (`https://minhareceita.org/{cnpj}`)

Flat structure, snake_case. Closest to our existing schema.

| Our field | MinhaReceita field |
|-----------|-------------------|
| `razao_social` | `razao_social` |
| `nome_fantasia` | `nome_fantasia` |
| `situacao` | `descricao_situacao_cadastral` |
| `data_abertura` | `data_inicio_atividade` |
| `porte` | — (not in response, use empty string) |
| `natureza_juridica` | `natureza_juridica` |
| `capital_social` | `capital_social` |
| `atividade_principal.codigo` | Extract from `cnae_fiscal` |
| `endereco.*` | `logradouro`, `numero`, `complemento`, `bairro`, `cep`, `municipio`, `uf` |
| `contato.telefone` | `ddd_telefone_1` + `ddd_telefone_2` |
| `contato.email` | `email` |
| `socios[].nome` | `qsa[].nome_socio` |
| `socios[].qualificacao` | `qsa[].qualificacao_socio` |
| `socios[].data_entrada` | `qsa[].data_entrada_sociedade` |

### OpenCNPJ.org (`https://api.opencnpj.org/{cnpj}`)

Flat structure, snake_case. Rate limit: 50 req/s.

| Our field | OpenCNPJ.org field |
|-----------|-------------------|
| `razao_social` | `razao_social` |
| `nome_fantasia` | `nome_fantasia` |
| `situacao` | `situacao_cadastral` |
| `data_abertura` | `data_inicio_atividade` |
| `porte` | `porte_empresa` |
| `natureza_juridica` | `natureza_juridica` |
| `capital_social` | `capital_social` (string "0,00" — needs parse to number) |
| `atividade_principal.codigo` | `cnae_principal` |
| `endereco.*` | `logradouro`, `numero`, `complemento`, `bairro`, `cep`, `municipio`, `uf` |
| `contato.telefone` | `telefones[].ddd` + `telefones[].numero` |
| `contato.email` | `email` |
| `socios[].nome` | `QSA[].nome_socio` |
| `socios[].qualificacao` | `QSA[].qualificacao_socio` |
| `socios[].data_entrada` | `QSA[].data_entrada_sociedade` |

### OpenCNPJ.com (`https://kitana.opencnpj.com/cnpj/{cnpj}`)

Wrapped response (`{success, data}`), camelCase fields. Rate limit: 100 req/min.

| Our field | OpenCNPJ.com field (inside `data`) |
|-----------|----------------------------------|
| `razao_social` | `razaoSocial` |
| `nome_fantasia` | `nomeFantasia` |
| `situacao` | `situacaoCadastral` |
| `data_abertura` | (not directly available — use `data_situacao_cadastral` or omit) |
| `porte` | (not in response) |
| `natureza_juridica` | `naturezaJuridica` |
| `capital_social` | `capitalSocial` |
| `atividade_principal.codigo` | `cnaes[0]` (if primary marked) |
| `endereco.*` | `cep`, `logradouro`, `numero`, `bairro`, `municipio`, `uf` |
| `contato.telefone` | `telefone` |
| `contato.email` | `email` |
| `socios[].nome` | `socios[].nome` |
| `socios[].qualificacao` | `socios[].qualificacao` |
| `socios[].data_entrada` | `socios[].data_entrada_sociedade` |

**Note:** Host `kitana.opencnpj.com` is an internal server name — URL stability is uncertain. Place after opencnpj.org in fallback chain.

### CNPJA (`https://open.cnpja.com/office/{cnpj}`)

Nested structure, camelCase. Most different from our schema.

| Our field | CNPJA field |
|-----------|------------|
| `razao_social` | `company.name` |
| `nome_fantasia` | `alias` |
| `situacao` | `status.text` |
| `data_abertura` | `founded` |
| `porte` | `company.size.text` |
| `natureza_juridica` | `company.nature.text` |
| `capital_social` | `company.equity` |
| `atividade_principal.codigo` | `mainActivity.id` |
| `atividade_principal.descricao` | `mainActivity.text` |
| `endereco.logradouro` | `address.street` |
| `endereco.numero` | `address.number` |
| `endereco.bairro` | `address.district` |
| `endereco.cep` | `address.zip` |
| `endereco.municipio` | `address.city` |
| `endereco.uf` | `address.state` |
| `contato.telefone` | `phones[].area` + `phones[].number` |
| `contato.email` | `emails[].address` |
| `socios[].nome` | `company.members[].person.name` |
| `socios[].qualificacao` | `company.members[].role.text` |
| `socios[].data_entrada` | `company.members[].since` |

**Note:** Aggressive rate limiting. Expect 429 responses. Last in fallback chain.

## New CEP Provider Response Schema

### ApiCEP (`https://cdn.apicep.com/file/apicep/{XXXXX-XXX}.json`)

**Important:** CEP must include hyphen (`01001-000`, not `01001000`). Normalizer must format input.

| Our field | ApiCEP field |
|-----------|-------------|
| `cep` | `code` (includes hyphen — strip it) |
| `logradouro` | `address` |
| `complemento` | — (not in response) |
| `bairro` | `district` |
| `cidade` | `city` |
| `uf` | `state` |
| `ibge` | — (not in response) |
| `ddd` | — (not in response) |

## File Structure (new files)

```
nodes/BrasilHub/resources/
├── cnpj/        (existing, +4 normalizers for new providers)
├── cep/         (existing, +1 normalizer for ApiCEP)
├── cpf/
│   ├── cpf.description.ts
│   ├── cpf.execute.ts
│   └── cpf.normalize.ts
├── banks/
│   ├── banks.description.ts
│   ├── banks.execute.ts
│   └── banks.normalize.ts
├── ddd/
│   ├── ddd.description.ts
│   ├── ddd.execute.ts
│   └── ddd.normalize.ts
├── fipe/
│   ├── fipe.description.ts
│   ├── fipe.execute.ts
│   └── fipe.normalize.ts
└── feriados/
    ├── feriados.description.ts
    ├── feriados.execute.ts
    └── feriados.normalize.ts
```

## Router (BrasilHub.node.ts)

```typescript
const resourceOperations = {
  cnpj: { query: cnpjQuery, validate: cnpjValidate },
  cep:  { query: cepQuery,  validate: cepValidate },
  cpf:  { validate: cpfValidate },
  banks: { query: banksQuery, list: banksList },
  ddd:  { query: dddQuery },
  fipe: { brands: fipeBrands, models: fipeModels, years: fipeYears, price: fipePrice },
  feriados: { query: feriadosQuery },
};
```

Zero changes to the execute loop — only new entries in the dictionary map.

## Types (types.ts)

New interfaces follow existing pattern with optional `_meta` and `_raw` fields:

- `ICpfValidation` — reuses `IValidationResult` (same as CNPJ/CEP validate)
- `IBank` — `code: number`, `name: string`, `fullName: string`, `ispb: string`
- `IDdd` — `state: string`, `cities: string[]`
- `IFipeBrand` — `name: string`, `code: string`
- `IFipeModel` — `code: number`, `name: string`
- `IFipeYear` — `code: string`, `name: string`
- `IFipePrice` — `value: string`, `brand: string`, `model: string`, `modelYear: number`, `fuel: string`, `fipeCode: string`, `referenceMonth: string`
- `IFeriado` — `date: string`, `name: string`, `type: string`

## Testing

TDD for each resource: RED → GREEN. Estimated ~50 new tests (normalizers for multiple providers + execute + validation + edge cases). Expected total: ~110 tests.

## What Does NOT Change

- Execute loop in `BrasilHub.node.ts`
- Shared `fallback.ts` generic logic (used by all multi-provider resources)
- CEP resource structure (just adds 1 provider + normalizer)
- No breaking changes — v0.2 is fully backward compatible

## All Endpoints Reference

| Resource | Provider | Endpoint | Response |
|----------|----------|----------|----------|
| CNPJ | BrasilAPI | `GET https://brasilapi.com.br/api/cnpj/v1/{cnpj}` | Flat, mixed case |
| CNPJ | CNPJ.ws | `GET https://publica.cnpj.ws/cnpj/{cnpj}` | Nested, mixed |
| CNPJ | ReceitaWS | `GET https://receitaws.com.br/v1/cnpj/{cnpj}` | Flat, snake_case |
| CNPJ | MinhaReceita | `GET https://minhareceita.org/{cnpj}` | Flat, snake_case |
| CNPJ | OpenCNPJ.org | `GET https://api.opencnpj.org/{cnpj}` | Flat, snake_case |
| CNPJ | OpenCNPJ.com | `GET https://kitana.opencnpj.com/cnpj/{cnpj}` | Wrapped, camelCase |
| CNPJ | CNPJA | `GET https://open.cnpja.com/office/{cnpj}` | Nested, camelCase |
| CEP | BrasilAPI | `GET https://brasilapi.com.br/api/cep/v2/{cep}` | Flat |
| CEP | ViaCEP | `GET https://viacep.com.br/ws/{cep}/json` | Flat |
| CEP | OpenCEP | `GET https://opencep.com/v1/{cep}` | Flat |
| CEP | ApiCEP | `GET https://cdn.apicep.com/file/apicep/{XXXXX-XXX}.json` | Flat, English keys |
| Banks | BrasilAPI | `GET https://brasilapi.com.br/api/banks/v1/{code}` | Single object |
| Banks | BrasilAPI | `GET https://brasilapi.com.br/api/banks/v1` | Array |
| Banks | BancosBrasileiros | `GET https://raw.githubusercontent.com/guibranco/BancosBrasileiros/main/data/bancos.json` | Array, 20+ fields |
| DDD | BrasilAPI | `GET https://brasilapi.com.br/api/ddd/v1/{ddd}` | `{state, cities[]}` |
| FIPE | parallelum | `GET https://parallelum.com.br/fipe/api/v1/{tipo}/marcas` | `[{codigo, nome}]` |
| FIPE | parallelum | `GET https://parallelum.com.br/fipe/api/v1/{tipo}/marcas/{marca}/modelos` | `{modelos[], anos[]}` |
| FIPE | parallelum | `GET https://parallelum.com.br/fipe/api/v1/{tipo}/marcas/{marca}/modelos/{modelo}/anos` | `[{codigo, nome}]` |
| FIPE | parallelum | `GET https://parallelum.com.br/fipe/api/v1/{tipo}/marcas/{marca}/modelos/{modelo}/anos/{ano}` | Price object |
| FIPE | BrasilAPI | `GET https://brasilapi.com.br/api/fipe/preco/v1/{codigoFipe}` | `[{valor, marca, ...}]` |
| FIPE | BrasilAPI | `GET https://brasilapi.com.br/api/fipe/tabelas/v1` | `[{codigo, mes}]` |
| Feriados | BrasilAPI | `GET https://brasilapi.com.br/api/feriados/v1/{ano}` | `[{date, name, type}]` |
| Feriados | Nager.Date | `GET https://date.nager.at/api/v3/PublicHolidays/{year}/BR` | `[{date, localName, name, fixed, global, types}]` |

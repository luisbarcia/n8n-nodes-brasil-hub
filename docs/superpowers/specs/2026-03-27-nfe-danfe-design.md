# Design Spec: NF-e Resource (Parse XML + Generate DANFE + Validate Key)

**Date:** 2026-03-27  
**Status:** Draft  
**Goal:** Add NF-e resource to Brasil Hub that parses Brazilian fiscal document XMLs, generates print-ready DANFE HTML, and validates access keys — all 100% local, no API calls.

## Context

Users download NF-e (Nota Fiscal Eletronica) from government portals as XML files. They need to:
1. Extract structured data from the XML for automation (populate spreadsheets, databases, ERPs)
2. Generate a visual DANFE (Documento Auxiliar da NF-e) for printing/archiving
3. Validate and extract information from the 44-digit access key

Currently no n8n community node handles NF-e XML parsing or DANFE generation.

## Scope

### In Scope (v1 — MVP)
- NF-e modelo 55 only (most common fiscal document)
- Parse XML operation (structured JSON output)
- Generate DANFE operation (structured JSON + HTML binary output)
- Validate Key operation (local validation + data extraction from 44 digits)
- XML input from text field or binary data
- Auto-detect document model from XML namespace
- Code128 barcode as inline SVG (zero deps)
- HTML DANFE with CSS inline, print-ready (A4)
- Single new dependency: `fast-xml-parser`

### In Scope (Future Phases)
- NFC-e modelo 65 (thermal receipt layout, QR code)
- CT-e modelo 57 (transport document, DACTE)
- MDF-e modelo 58 (transport manifest, DAMDFE)

### Out of Scope
- SEFAZ API consultation (requires digital certificate)
- PDF generation (user connects HTML-to-PDF node downstream)
- NFS-e (municipal service invoices — no standard schema)
- XML digital signature validation
- NF-e emission/transmission

## Resource & Operations

**Resource name:** `NF-e` (display: `NF-e (Nota Fiscal)`)

| Operation | Input | Output | API? |
|-----------|-------|--------|------|
| **Parse XML** | XML (text or binary) | Normalized JSON | No — 100% local |
| **Generate DANFE** | XML (text or binary) | Normalized JSON + HTML binary | No — 100% local |
| **Validate Key** | Access key (44 digits) | Extracted fields + validation | No — 100% local |

### Parameters — Parse XML & Generate DANFE

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| XML Source | dropdown | Text Field | "Text Field" or "Binary Data" |
| XML Content | string (multiline) | — | XML content (shown when Source = Text Field) |
| Binary Property | string | `data` | Binary property name (shown when Source = Binary Data) |
| Document Model | dropdown | Auto-detect | "Auto-detect", "NF-e (55)", "NFC-e (65)", "CT-e (57)", "MDF-e (58)" |
| Include Raw Response | boolean | false | Include original parsed XML object |

### Parameters — Generate DANFE (additional)

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| Output Property | string | `danfe` | Binary property name for HTML output |
| Paper Size | dropdown | A4 | "A4", "Letter", "80mm" (thermal, for NFC-e) |

### Parameters — Validate Key

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| Access Key | string | — | 44-digit NF-e access key |
| Include Raw Response | boolean | false | Include raw digit breakdown |

## NF-e XML Schema (Modelo 55, v4.00)

### Root Structure

```xml
<?xml version="1.0" encoding="UTF-8"?>
<nfeProc xmlns="http://www.portalfiscal.inf.br/nfe" versao="4.00">
  <NFe>
    <infNFe Id="NFe{chave44}" versao="4.00">
      <ide>...</ide>           <!-- Identification (number, series, dates, type) -->
      <emit>...</emit>         <!-- Issuer (emitente) -->
      <dest>...</dest>         <!-- Recipient (destinatario) -->
      <det nItem="1">...</det> <!-- Line items (repeating) -->
      <total>...</total>       <!-- Tax totals -->
      <transp>...</transp>     <!-- Transport -->
      <pag>...</pag>           <!-- Payment -->
      <infAdic>...</infAdic>   <!-- Additional info -->
    </infNFe>
    <Signature>...</Signature> <!-- XML digital signature (ignored by parser) -->
  </NFe>
  <protNFe versao="4.00">
    <infProt>
      <chNFe>{chave44}</chNFe>
      <dhRecbto>{datetime}</dhRecbto>
      <nProt>{protocol}</nProt>
      <cStat>100</cStat>       <!-- 100 = authorized -->
    </infProt>
  </protNFe>
</nfeProc>
```

### Namespace Detection (Auto-detect)

| Model | Namespace | Root Element | `ide/mod` |
|-------|-----------|--------------|-----------|
| NF-e (55) | `http://www.portalfiscal.inf.br/nfe` | `nfeProc` or `NFe` | `55` |
| NFC-e (65) | `http://www.portalfiscal.inf.br/nfe` | `nfeProc` or `NFe` | `65` |
| CT-e (57) | `http://www.portalfiscal.inf.br/cte` | `cteProc` or `CTe` | `57` |
| MDF-e (58) | `http://www.portalfiscal.inf.br/mdfe` | `mdfeProc` or `MDFe` | `58` |

**Note:** NF-e and NFC-e share the same namespace — differentiation requires reading `ide/mod` value.

### XML Encoding

- **v4.00 (current):** UTF-8 (mandatory per SEFAZ — Rejeição 402 for non-UTF-8)
- **v3.10 and older:** May use ISO-8859-1 (extremely rare in practice, pre-2015)
- Parser must handle both encodings — read from XML declaration `<?xml encoding="..."?>`
- For practical purposes, assume UTF-8. ISO-8859-1 support is a defensive measure for legacy XMLs.

## Access Key Structure (44 digits)

```
Pos  1-2:   cUF — IBGE state code (e.g., 35 = SP)
Pos  3-6:   AAMM — Year and month of emission (e.g., 2603 = Mar/2026)
Pos  7-20:  CNPJ — Issuer CNPJ (14 digits)
Pos 21-22:  mod — Document model (55, 57, 58, 65)
Pos 23-25:  serie — Series (3 digits, zero-padded)
Pos 26-34:  nNF — Document number (9 digits, zero-padded)
Pos 35:     tpEmis — Emission type (1=normal, 2-9=contingency modes)
Pos 36-43:  cNF — Random numeric code (8 digits)
Pos 44:     cDV — Check digit (modulo 11)
```

### Check Digit Algorithm (Modulo 11)

1. Take first 43 digits
2. Apply weights cycling `2,3,4,5,6,7,8,9` from right to left
3. Sum all products
4. `remainder = sum % 11`
5. If `remainder < 2` (i.e., 0 or 1): check digit = `0`
6. Otherwise: check digit = `11 - remainder`

```typescript
function calcularDV(chave43: string): number {
  const pesos = [2, 3, 4, 5, 6, 7, 8, 9];
  let soma = 0;
  for (let i = 42; i >= 0; i--) {
    soma += parseInt(chave43[i], 10) * pesos[(42 - i) % 8];
  }
  const resto = soma % 11;
  return resto < 2 ? 0 : 11 - resto;
}
```

### Validate Key Output

```typescript
interface INfeKeyResult {
  /** Whether the key format and check digit are valid. */
  valid: boolean;
  /** Error message if invalid, null if valid. */
  error: string | null;
  /** IBGE state code (2 digits). */
  uf_code: string;
  /** State abbreviation (e.g., "SP", "RJ"). */
  uf: string;
  /** Emission year and month (AAMM, 4 digits). */
  ano_mes: string;
  /** Emission year (2 digits, extracted from ano_mes). */
  ano: string;
  /** Emission month (2 digits, extracted from ano_mes). */
  mes: string;
  /** Issuer CNPJ (14 digits). */
  cnpj_emitente: string;
  /** Document model (55, 57, 58, 65). */
  modelo: string;
  /** Document model description. */
  modelo_descricao: string;
  /** Series number (3 digits). */
  serie: string;
  /** Document number (9 digits). */
  numero: string;
  /** Emission type code. */
  tipo_emissao: string;
  /** Emission type description. */
  tipo_emissao_descricao: string;
  /** Numeric code (8 digits). */
  codigo_numerico: string;
  /** Check digit (1 digit). */
  digito_verificador: string;
}
```

## Data Model — Parse XML Output (NF-e Modelo 55)

```typescript
/** Normalized NF-e document parsed from XML. */
interface INfeResult {
  /** Access key (44 digits). */
  chave_acesso: string;
  /** Document number. */
  numero: number;
  /** Series number. */
  serie: number;
  /** Fiscal model (55, 57, 58, 65). */
  modelo: number;
  /** Issue date (ISO 8601). */
  data_emissao: string;
  /** Entry/exit date (ISO 8601), null if not present. */
  data_saida: string | null;
  /** Operation type (0=entrada, 1=saida). */
  tipo_operacao: number;
  /** Operation nature description (e.g., "Venda de mercadoria"). */
  natureza_operacao: string;
  /** Authorization protocol number. */
  protocolo: string;
  /** Authorization date (ISO 8601). */
  data_autorizacao: string;
  /** Authorization status code (100=authorized, 101=cancelled). */
  status_codigo: number;
  /** Authorization status description. */
  status_descricao: string;

  /** Issuer (emitente) data. */
  emitente: {
    cnpj: string;
    razao_social: string;
    nome_fantasia: string;
    inscricao_estadual: string;
    /** Tax regime (1=Simples Nacional, 2=Simples excesso, 3=Regime Normal). */
    regime_tributario: number;
    endereco: INfeEndereco;
  };

  /** Recipient (destinatario) data. */
  destinatario: {
    /** CPF or CNPJ (varies by recipient type). */
    cpf_cnpj: string;
    nome: string;
    inscricao_estadual: string;
    /** Consumer indicator (0=normal, 1=final consumer). */
    indicador_consumidor_final: number;
    endereco: INfeEndereco;
  };

  /** Product/service line items. */
  produtos: Array<{
    /** Sequential item number (starts at 1). */
    numero_item: number;
    /** Product code (issuer's internal code). */
    codigo: string;
    /** EAN/GTIN barcode (may be "SEM GTIN"). */
    ean: string;
    /** Product description. */
    descricao: string;
    /** NCM code (8 digits). */
    ncm: string;
    /** CFOP code (4 digits). */
    cfop: string;
    /** Unit of measure. */
    unidade: string;
    /** Quantity. */
    quantidade: number;
    /** Unit price. */
    valor_unitario: number;
    /** Total value (quantidade * valor_unitario). */
    valor_total: number;
    /** ICMS tax details. */
    icms: {
      /** Tax situation code (e.g., "00", "60", "500"). */
      cst: string;
      base_calculo: number;
      aliquota: number;
      valor: number;
    };
    /** IPI tax details (null if not applicable). */
    ipi: {
      cst: string;
      base_calculo: number;
      aliquota: number;
      valor: number;
    } | null;
    /** PIS tax details. */
    pis: { cst: string; base_calculo: number; aliquota: number; valor: number };
    /** COFINS tax details. */
    cofins: { cst: string; base_calculo: number; aliquota: number; valor: number };
  }>;

  /** Tax totals (ICMSTot). */
  totais: {
    base_calculo_icms: number;
    valor_icms: number;
    base_calculo_icms_st: number;
    valor_icms_st: number;
    valor_produtos: number;
    valor_frete: number;
    valor_seguro: number;
    valor_desconto: number;
    valor_ipi: number;
    valor_pis: number;
    valor_cofins: number;
    valor_outros: number;
    /** Total NF-e value. */
    valor_total: number;
    /** Approximate total tax (Lei da Transparencia). */
    valor_aproximado_tributos: number;
  };

  /** Transport data. */
  transporte: {
    /** Freight modality (0=issuer, 1=recipient, 2=third-party, 9=no freight). */
    modalidade_frete: number;
    modalidade_frete_descricao: string;
    /** Carrier data (null if no carrier). */
    transportadora: {
      cpf_cnpj: string;
      nome: string;
      inscricao_estadual: string;
    } | null;
    /** Volume/package data. */
    volumes: Array<{
      quantidade: number;
      especie: string;
      peso_bruto: number;
      peso_liquido: number;
    }>;
  };

  /** Billing/installment data (optional — cobr section). */
  cobranca: {
    /** Invoice data (null if no billing). */
    fatura: {
      numero: string;
      valor_original: number;
      valor_desconto: number;
      valor_liquido: number;
    } | null;
    /** Installments (duplicatas). */
    duplicatas: Array<{
      numero: string;
      vencimento: string;
      valor: number;
    }>;
  };

  /** Payment data (NF-e v4.00+). */
  pagamento: Array<{
    /** Payment method code. */
    forma_codigo: string;
    /** Payment method description (e.g., "Dinheiro", "Cartao Credito"). */
    forma_descricao: string;
    /** Payment value. */
    valor: number;
  }>;

  /** Change amount (troco). */
  troco: number;

  /** Additional information. */
  informacoes_adicionais: {
    /** Taxpayer's additional info. */
    contribuinte: string;
    /** Tax authority's additional info. */
    fisco: string;
  };
}

/** Address used across NF-e entities. */
interface INfeEndereco {
  logradouro: string;
  numero: string;
  complemento: string;
  bairro: string;
  /** IBGE city code (7 digits). */
  codigo_municipio: string;
  municipio: string;
  uf: string;
  cep: string;
  /** Country code (1058 = Brazil). */
  codigo_pais: string;
  pais: string;
  telefone: string;
}
```

## Architecture

### File Structure

```
resources/nfe/
├── nfe.description.ts          # UI fields (resource, operations, params)
├── nfe.execute.ts              # Operation router: parse / generate / validate
├── nfe.normalize.ts            # Reserved for future provider normalization
├── index.ts                    # Barrel export (IResourceDefinition)
├── parsers/
│   ├── parser.types.ts         # IParsedNfe interface (contract)
│   ├── nfe55.parser.ts         # NF-e model 55 XML → IParsedNfe
│   ├── nfce65.parser.ts        # [FUTURE] NFC-e model 65
│   ├── cte57.parser.ts         # [FUTURE] CT-e model 57
│   └── mdfe58.parser.ts        # [FUTURE] MDF-e model 58
├── templates/
│   ├── danfe55.template.ts     # HTML template for DANFE (NF-e)
│   ├── danfce65.template.ts    # [FUTURE] HTML for DANFE NFC-e
│   ├── dacte57.template.ts     # [FUTURE] HTML for DACTE
│   └── damdfe58.template.ts    # [FUTURE] HTML for DAMDFE
└── utils/
    ├── xml-input.ts            # Resolve XML from text or binary data
    ├── detect-model.ts         # Auto-detect model from namespace + ide/mod
    ├── barcode128.ts           # Code128C SVG generator (zero deps)
    └── nfe-key.ts              # Access key validator + data extractor
```

### Execution Flow

```
Parse XML:
  XML input → xml-input.ts (text/binary → string)
            → detect-model.ts (namespace + ide/mod → model id)
            → nfe55.parser.ts (XML string → IParsedNfe via fast-xml-parser)
            → normalized JSON output

Generate DANFE:
  XML input → [same as Parse XML up to IParsedNfe]
            → danfe55.template.ts (IParsedNfe → HTML string)
            → barcode128.ts (chave_acesso → SVG string, embedded in HTML)
            → HTML output as n8n binary data (MIME: text/html)

Validate Key:
  Access key string → nfe-key.ts (format + modulo 11 + field extraction)
                    → INfeKeyResult output
```

### Dependency

**New runtime dependency:** `fast-xml-parser`

| Property | Value |
|----------|-------|
| Package | `fast-xml-parser` |
| Size | ~50KB minified |
| Own dependencies | Zero |
| Weekly downloads | 20M+ |
| Purpose | XML → JS object parsing with namespace support |
| Config needed | See config table below |

### fast-xml-parser Configuration

```typescript
const parser = new XMLParser({
  removeNSPrefix: true,       // "nfe:NFe" → "NFe" (handles prefixed and non-prefixed)
  ignoreAttributes: false,    // Preserve versao, Id, nItem attributes
  attributeNamePrefix: '@_',  // Attributes prefixed with @_
  textNodeName: '#text',
  parseTagValue: false,       // CRITICAL: prevents CNPJ/CEP/chave losing leading zeros
  isArray: (name: string) => {
    // Tags that may have 1 or N occurrences — must always be arrays
    return ['det', 'dup', 'detPag', 'vol', 'autXML', 'obsCont', 'obsFisco', 'procRef'].includes(name);
  },
});
```

| Option | Value | Rationale |
|--------|-------|-----------|
| `removeNSPrefix` | `true` | Removes `nfe:` prefix. Works for both prefixed and default-namespace XMLs |
| `ignoreAttributes` | `false` | Need `versao`, `Id`, `nItem` attributes |
| `parseTagValue` | `false` | **CRITICAL** — without this, CNPJ `00822602000124` becomes number `822602000124` (loses leading zeros). Same for CEP, chave de acesso, serie, etc. |
| `isArray` | callback | `det` (items, 1-990), `dup` (installments), `detPag` (payments), `vol` (volumes) must be arrays even with single occurrence |

**Known issue:** fast-xml-parser issue #596 reported a bug in `removeNSPrefix` in a specific version. Pin to a tested version in package.json.

**Justification for breaking zero-deps rule:** Node.js has no built-in XML parser. Regex-based parsing of NF-e XML (deeply nested, namespaced, variable encoding) would be fragile and unmaintainable. `fast-xml-parser` is the smallest, most reliable option with zero transitive dependencies.

## HTML DANFE Template (Modelo 55)

### Layout (CONFAZ standard)

```
┌─────────────────────────────────────────────────┐
│  DANFE — Documento Auxiliar da NF-e             │
│  ┌──────────────────┐  ┌──────────────────────┐ │
│  │  EMITENTE         │  │ [Code128 SVG Barcode]│ │
│  │  Razao Social     │  │ Chave de Acesso:     │ │
│  │  CNPJ, IE         │  │ 1234 5678 9012 ...   │ │
│  │  Endereco         │  │ Protocolo: ...       │ │
│  └──────────────────┘  └──────────────────────┘ │
│  Natureza da Operacao: Venda de mercadoria      │
├─────────────────────────────────────────────────┤
│  DESTINATARIO / REMETENTE                       │
│  Nome, CPF/CNPJ, IE, Endereco                  │
├─────────────────────────────────────────────────┤
│  PRODUTOS / SERVICOS                            │
│  # │ Cod │ Descricao │ NCM │ CFOP│ Un│ Qtd│Vlr │
│  1 │ ... │ ......... │ ... │ ... │...│....│... │
│  2 │ ... │ ......... │ ... │ ... │...│....│... │
├─────────────────────────────────────────────────┤
│  CALCULO DO IMPOSTO                             │
│  BC ICMS │ Vlr ICMS │ BC ICMS ST │ Vlr ICMS ST │
│  Vlr Frete │ Vlr Seguro │ Desconto │ Vlr Total  │
├─────────────────────────────────────────────────┤
│  TRANSPORTADOR / VOLUMES TRANSPORTADOS          │
│  Razao Social │ CNPJ │ Frete por conta │ Placa  │
│  Qtd │ Especie │ Peso Bruto │ Peso Liquido      │
├─────────────────────────────────────────────────┤
│  DADOS DO PAGAMENTO                             │
│  Forma │ Valor                                  │
├─────────────────────────────────────────────────┤
│  DADOS ADICIONAIS                               │
│  Informacoes Complementares                     │
│  Reservado ao Fisco                             │
└─────────────────────────────────────────────────┘
```

### Implementation Strategy

- **CSS inline only** — no external files, self-contained HTML document
- **`@media print`** — page breaks, margins for A4 printing
- **Font:** system monospace for values, system sans-serif for labels
- **Barcode:** Code128C SVG inline (~80 lines of encoding logic)
- **Encoding:** UTF-8 with explicit `<meta charset="UTF-8">`
- **Output:** n8n binary data with `mimeType: 'text/html'`, `fileName: 'danfe-{chave}.html'`
- **Downstream PDF conversion:** user connects HTML-to-PDF node (Puppeteer, wkhtmltopdf, or external API)

## Code128C Barcode (SVG)

Code128C encodes pairs of digits — ideal for the 44-digit access key (22 pairs).

**Encoding:**
1. Start with START_C symbol
2. For each pair of digits: encode as single Code128C symbol (value 00-99)
3. Calculate checksum (weighted sum mod 103)
4. Add STOP symbol
5. Render as SVG with bars (varying width modules)

**Output:** `<svg>` element with `width`, `height`, and `<rect>` elements for each bar.

No external dependency needed — Code128C encoding table is a fixed lookup table.

## Testing Strategy

### TDD (RED-GREEN-REFACTOR) — Mandatory

All implementation follows strict TDD cycle via `testing-arsenal`:

1. **RED:** Write failing test first
2. **GREEN:** Write minimum code to pass
3. **REFACTOR:** Clean up while tests stay green

### Test Categories

#### 1. XML Parser Tests (`__tests__/nfe-parser.spec.ts`)

**Fixtures:** Real NF-e XMLs (sanitized — fake CNPJ/CPF, scrambled names) in `__tests__/fixtures/`:
- `nfe55-standard.xml` — typical authorized NF-e
- `nfe55-cancelled.xml` — cancelled NF-e (cStat=101)
- `nfe55-multiple-items.xml` — NF-e with 50+ line items
- `nfe55-iso8859.xml` — old NF-e with ISO-8859-1 encoding
- `nfe55-minimal.xml` — minimum required fields only
- `nfe55-malformed.xml` — invalid XML (missing closing tags)
- `nfe55-no-namespace.xml` — XML without namespace prefix
- `nfe55-with-cdata.xml` — XML with CDATA sections in infAdic

**Test cases:**
- Parse standard NF-e and verify all fields match expected values
- Parse cancelled NF-e and verify status_codigo = 101
- Parse NF-e with 50+ items and verify all items extracted
- Parse ISO-8859-1 encoded XML correctly (accented characters)
- Parse XML without namespace prefix
- Parse XML with CDATA sections in additional info
- Reject malformed XML with NodeOperationError
- Reject empty XML string
- Reject non-XML content (JSON, plain text)
- Reject XML of wrong model (CT-e XML when expecting NF-e)
- Verify all monetary values are numbers (not strings)
- Verify dates are ISO 8601 format
- Handle missing optional fields (nome_fantasia, complemento) gracefully

#### 2. DANFE Template Tests (`__tests__/nfe-template.spec.ts`)

- Generate HTML from parsed NF-e and verify it contains key elements
- Verify HTML has Code128 SVG barcode
- Verify HTML has all product rows
- Verify HTML has proper CSS for A4 printing
- Verify HTML is valid self-contained document (no external refs)
- Snapshot test of generated HTML structure
- Handle NF-e with 0 products (edge case)
- Handle NF-e with very long product descriptions (truncation)
- Handle NF-e with special characters in company name (& < > " ')
- Verify HTML escaping of all user-provided data (XSS prevention)

#### 3. Validate Key Tests (`__tests__/nfe-key.spec.ts`)

- Valid key with correct check digit → valid: true, all fields extracted
- Invalid check digit → valid: false with error message
- Key with non-numeric characters → valid: false
- Key with wrong length (43, 45 digits) → valid: false
- Key with invalid UF code → valid: true but uf: "Desconhecido"
- Key with all zeros → valid: false (check digit mismatch)
- Key with model 55, 57, 58, 65 → correct modelo_descricao
- Key with unknown model → modelo_descricao: "Desconhecido"
- All emission types mapped correctly (1-9)
- Extract CNPJ from key and verify format (14 digits)
- Known real-world access key patterns (sanitized)
- Modulo 11 edge case: remainder = 0 → check digit = 0 (not 11)
- Modulo 11 edge case: remainder = 1 → check digit = 0 (not 10)
- Modulo 11: verify with reference implementation from SEFAZ technical manual

#### 4. XML Input Resolver Tests (`__tests__/nfe-xml-input.spec.ts`)

- Resolve from text field (string)
- Resolve from binary data
- Resolve from binary data with custom property name
- Reject when binary property doesn't exist
- Reject when binary data is not XML (e.g., PDF)
- Handle BOM (Byte Order Mark) in XML
- Handle XML with leading whitespace

#### 5. Barcode Tests (`__tests__/nfe-barcode.spec.ts`)

- Encode known input → verify SVG output contains correct bars
- Encode 44-digit access key → valid Code128C
- Encode empty string → error or empty SVG
- Encode odd-length string → fallback to Code128B or error
- SVG output is valid XML
- Verify checksum calculation with known test vectors

#### 6. Model Detection Tests (`__tests__/nfe-detect-model.spec.ts`)

- Detect NF-e (55) from namespace + ide/mod
- Detect NFC-e (65) from namespace + ide/mod=65
- Detect CT-e (57) from cte namespace
- Detect MDF-e (58) from mdfe namespace
- Handle XML without namespace (fallback to ide/mod)
- Reject unrecognized XML structure

### Testing Arsenal — Full Suite (Pre-Release)

All 6 testing-arsenal skills are mandatory before release:

| # | Skill | Purpose |
|---|-------|---------|
| 1 | `test-master` | Adversarial attack tests: type confusion, null injection, XSS in XML fields, buffer overflow via huge XML, unicode edge cases |
| 2 | `test-skeptic` | Audit test quality: no false confidence, no tautological tests, mocks match reality |
| 3 | `code-reviewer` | Correctness, compliance, consistency, DRY review |
| 4 | `security-reviewer` | SSRF prevention, XXE prevention (XML External Entity), input validation, HTML injection in DANFE |
| 5 | `coverage-analyzer` | Map source → test files, identify gaps |
| 6 | `gap-analyzer` | Post-testing analysis for missing test layers |

### Security-Specific Tests

- **XXE Prevention:** XML with `<!DOCTYPE>` and external entity references must be rejected or ignored
- **XSS in DANFE:** Company names, product descriptions with `<script>` tags must be HTML-escaped in template
- **Billion Laughs:** XML bomb (`<!ENTITY` expansion) must not crash the parser
- **Path Traversal:** Binary property name with `../` must not access files outside n8n data
- **Huge XML:** 100MB XML must fail gracefully with memory limit error, not OOM crash

### Coverage Target

- **Branches:** >= 90%
- **Lines:** >= 95%
- **Functions:** >= 95%

## Edge Cases & Encoding Scenarios

| Scenario | Expected Behavior |
|----------|-------------------|
| UTF-8 XML (v4.00) | Parse normally |
| ISO-8859-1 XML (v3.10) | Detect encoding from declaration, parse with correct charset |
| XML with BOM (EF BB BF) | Strip BOM before parsing |
| XML without `<?xml?>` declaration | Assume UTF-8 |
| `nfeProc` wrapper (authorized) | Extract `NFe` + `protNFe` |
| `NFe` only (no wrapper) | Parse `NFe` directly, protocol fields = null |
| Cancelled NF-e (cStat=101) | Parse normally, status_codigo=101, status_descricao="Cancelada" |
| Denied NF-e (cStat=110) | Parse normally, status_codigo=110, status_descricao="Denegada" |
| NF-e with 100+ items | Parse all items, no truncation |
| Empty `infAdic` | informacoes_adicionais = { contribuinte: "", fisco: "" } |
| Missing `dest` (NFC-e) | destinatario fields = empty strings |
| Duplicate namespace prefixes | fast-xml-parser handles with removeNSPrefix |
| CDATA in `infCpl` | Extract text content from CDATA |

## Implementation Phases

### Phase 1: Foundation (v1 MVP)
1. Add `fast-xml-parser` dependency
2. Implement `nfe-key.ts` (Validate Key) — simplest, no XML
3. Implement `xml-input.ts` (text/binary resolver)
4. Implement `detect-model.ts` (namespace detection)
5. Implement `nfe55.parser.ts` (XML → IParsedNfe)
6. Implement `barcode128.ts` (Code128C SVG)
7. Implement `danfe55.template.ts` (HTML generation)
8. Wire up `nfe.description.ts`, `nfe.execute.ts`, `index.ts`
9. Register in `BrasilHub.node.ts` router

### Phase 2: NFC-e (65)
1. Implement `nfce65.parser.ts`
2. Implement `danfce65.template.ts` (thermal 80mm layout)
3. Add QR Code generation (may need additional dep or inline implementation)

### Phase 3: CT-e (57)
1. Implement `cte57.parser.ts`
2. Implement `dacte57.template.ts`
3. New interface `ICteResult` in types.ts

### Phase 4: MDF-e (58)
1. Implement `mdfe58.parser.ts`
2. Implement `damdfe58.template.ts`
3. New interface `IMdfeResult` in types.ts

## Design Decisions

| Decision | Rationale |
|----------|-----------|
| `fast-xml-parser` as only new dep | Node.js has no built-in XML parser. This lib is smallest (50KB), zero own deps, 20M+ weekly downloads. Regex parsing would be fragile for nested namespaced XML. |
| HTML output (not PDF) | Zero-dep approach. PDF generation requires heavy libs (puppeteer, pdfkit). HTML is self-contained and user converts downstream with existing n8n nodes. |
| Code128C SVG inline | Code128C is optimal for numeric-only data (44-digit key = 22 pairs). SVG is vector (scales perfectly for print). Implementation is ~80 lines, well-documented encoding table. |
| Separate Parse vs Generate operations | Parse is fast (data only), Generate adds HTML rendering overhead. Users processing 10K+ XMLs for data extraction don't want HTML generation penalty. |
| Auto-detect with manual override | Most users won't know the model number. Auto-detect from namespace/ide covers 99% of cases. Manual override exists for edge cases where detection fails. |
| ISO-8859-1 support | Real-world NF-e XMLs from older systems still use this encoding. Silently failing on accented characters (common in Brazilian names/addresses) would be a bad UX. |
| XXE prevention as security requirement | XML External Entity is a known attack vector. fast-xml-parser doesn't expand entities by default, but we must explicitly test and document this. |
| All values as numbers, dates as ISO 8601 | Consistent with existing brasil-hub resources (CNPJ, CEP). Makes downstream processing in n8n expressions straightforward. |
| INfeEndereco shared interface | Same address structure used for emitente and destinatario. Follows existing IEndereco pattern but with additional fields (codigo_municipio, codigo_pais) specific to NF-e. |
| `parseTagValue: false` in fast-xml-parser | **CRITICAL** — without this, CNPJ/CEP/chave lose leading zeros (parsed as numbers). Discovered via research: `00822602000124` would become `822602000124`. |
| `isArray` callback for `det`, `detPag`, `vol` | NF-e with 1 item would return object instead of array without this. Defensive parsing ensures consistent output shape. |
| Max 990 items per NF-e | SEFAZ limit. Parser should not impose additional limits, but tests should cover this boundary. |
| `cobr` (cobranca) section in interface | Billing/installment data is optional but common in B2B NF-e. Omitting it would lose important financial data. |
| Pin fast-xml-parser version | Issue #596 reported removeNSPrefix bug in specific version. Use exact version in package.json, not range. |

## n8n Implementation Notes (from codebase analysis)

### Existing Patterns to Follow

- **displayOptions:** Use `showFor*` constant pattern (e.g., `const showForNfe = { resource: ['nfe'] }`)
- **includeRawField():** Reuse shared builder from `shared/description-builders.ts`
- **IValidationResult:** Reuse existing interface for Validate Key output (same pattern as CPF Validate)
- **Execute helpers:** NF-e Parse/Generate are 100% local (no API) — cannot use `executeStandardQuery`. Need direct execute functions similar to CPF Validate.
- **noDataExpression: true:** Required on Resource/Operation params
- **action property:** Required on each Operation option
- **Title Case:** All displayNames must be Title Case

### Binary Data — First in Project

NF-e will be the **first resource** to use n8n binary data (both input and output). Key n8n APIs:

**Input (reading binary):**
```typescript
const binaryData = this.helpers.assertBinaryData(itemIndex, binaryPropertyName);
const xmlString = Buffer.from(binaryData.data, 'base64').toString('utf-8');
```

**Output (writing binary):**
```typescript
const htmlBuffer = Buffer.from(htmlString, 'utf-8');
const binaryOutput = await this.helpers.prepareBinaryData(htmlBuffer, fileName, 'text/html');
returnData.push({
  json: { ...normalizedData },
  binary: { [outputPropertyName]: binaryOutput },
  pairedItem: { item: itemIndex },
});
```

### Conditional Parameters (displayOptions)

```typescript
const showForNfe = { resource: ['nfe'] };
const showForNfeParseOrGenerate = { resource: ['nfe'], operation: ['parseXml', 'generateDanfe'] };
const showForNfeGenerate = { resource: ['nfe'], operation: ['generateDanfe'] };
const showForNfeValidateKey = { resource: ['nfe'], operation: ['validateKey'] };
const showForNfeTextInput = { resource: ['nfe'], operation: ['parseXml', 'generateDanfe'], xmlSource: ['text'] };
const showForNfeBinaryInput = { resource: ['nfe'], operation: ['parseXml', 'generateDanfe'], xmlSource: ['binary'] };
```

## References

- [Portal NF-e (SEFAZ) — Esquemas XML](https://www.nfe.fazenda.gov.br/portal/listaConteudo.aspx?tipoConteudo=BMPFMBoln3w%3D)
- [Manual do Contribuinte (MOC SPED PR)](http://moc.sped.fazenda.pr.gov.br/)
- [DANFE/Codigo de Barras (MOC SPED PR)](http://moc.sped.fazenda.pr.gov.br/DanfeCodigoBarras.html)
- [XSD schemas PL_009_V4 (sped-nfe GitHub)](https://github.com/nfephp-org/sped-nfe/blob/master/schemes/PL_009_V4/)
- [procNFe_v4.00.xsd](https://github.com/nfephp-org/sped-nfe/blob/master/schemes/PL_009_V4/procNFe_v4.00.xsd)
- [Chave de acesso — composicao (FocusNFe)](https://focusnfe.com.br/blog/como-e-formada-a-chave-de-acesso-de-nf-e-nfc-e-ct-e-e-mdf-e/)
- [Chave de acesso — algoritmo (Tecnospeed)](https://blog.tecnospeed.com.br/chave-de-acesso/)
- [Rejeicao 402 UTF-8 (Oobj)](https://oobj.com.br/bc/rejeicao-402-como-resolver/)
- [fast-xml-parser v4 options](https://github.com/NaturalIntelligence/fast-xml-parser/blob/master/docs/v4/2.XMLparseOptions.md)
- [fast-xml-parser issue #596 (removeNSPrefix)](https://github.com/NaturalIntelligence/fast-xml-parser/issues/596)
- [nfelib Python bindings (reference impl)](https://github.com/akretion/nfelib)
- [Exemplo XML NF-e (nfephp)](https://github.com/nfephp-org/nfephp/blob/master/exemplos/xml/)

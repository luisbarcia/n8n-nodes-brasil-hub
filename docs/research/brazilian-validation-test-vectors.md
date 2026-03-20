# Brazilian Document Validation: Test Vectors & Edge Cases

Research date: 2026-03-15

---

## 1. CPF Validation

### 1.1 Algorithm Summary

CPF has 11 digits: 9 base digits + 2 check digits. Uses Modulo 11 with positional weights.

**First check digit (d1):**
- Weights: `10, 9, 8, 7, 6, 5, 4, 3, 2` applied to digits 1-9
- Sum all products, divide by 11
- If remainder < 2: d1 = 0; else d1 = 11 - remainder

**Second check digit (d2):**
- Weights: `11, 10, 9, 8, 7, 6, 5, 4, 3, 2` applied to digits 1-10 (including d1)
- Sum all products, divide by 11
- If remainder < 2: d2 = 0; else d2 = 11 - remainder

### 1.2 Ninth Digit: Fiscal Region Code

The 9th digit of a CPF indicates the Fiscal Region where it was registered:

| Digit | States |
|-------|--------|
| 0 | RS |
| 1 | DF, GO, MS, MT, TO |
| 2 | AC, AM, AP, PA, RO, RR |
| 3 | CE, MA, PI |
| 4 | AL, PB, PE, RN |
| 5 | BA, SE |
| 6 | MG |
| 7 | ES, RJ |
| 8 | SP |
| 9 | PR, SC |

### 1.3 All-Same-Digit CPFs (MUST reject)

All 10 pass the checksum algorithm but are legally invalid per Receita Federal rules:

| CPF (formatted) | CPF (digits only) | Checksum passes? |
|------------------|--------------------|------------------|
| 000.000.000-00 | 00000000000 | YES |
| 111.111.111-11 | 11111111111 | YES |
| 222.222.222-22 | 22222222222 | YES |
| 333.333.333-33 | 33333333333 | YES |
| 444.444.444-44 | 44444444444 | YES |
| 555.555.555-55 | 55555555555 | YES |
| 666.666.666-66 | 66666666666 | YES |
| 777.777.777-77 | 77777777777 | YES |
| 888.888.888-88 | 88888888888 | YES |
| 999.999.999-99 | 99999999999 | YES |

**Critical:** ALL 10 of these pass the mathematical checksum. They must be explicitly rejected via a business rule check before or after the checksum validation.

### 1.4 Valid CPF Test Vectors (algorithmically generated)

| CPF (formatted) | CPF (digits only) | Notes |
|------------------|--------------------|-------|
| 529.982.247-25 | 52998224725 | Random |
| 347.085.080-18 | 34708508018 | Region 0 (RS) |
| 123.456.789-09 | 12345678909 | Sequential pattern |
| 987.654.321-00 | 98765432100 | Reverse sequential, d2=0 |
| 111.444.777-35 | 11144477735 | Pattern |
| 000.000.001-91 | 00000000191 | Near-zero with leading zeros |
| 999.999.998-08 | 99999999808 | Near-max |
| 313.402.809-30 | 31340280930 | Classic algorithm example |

### 1.5 Edge Case: Both Check Digits = 0

| CPF (formatted) | CPF (digits only) |
|------------------|--------------------|
| 000.000.037-00 | 00000003700 |
| 987.654.321-00 | 98765432100 |

### 1.6 Invalid CPF Test Vectors

| Input | Reason |
|-------|--------|
| 123.456.789-00 | Wrong check digits (correct: -09) |
| 000.000.000-01 | All-same-digit base with wrong check |
| 12345678 | Too few digits (8) |
| 123456789012 | Too many digits (12) |
| abc.def.ghi-jk | Non-numeric |
| (empty string) | Empty |
| 000.000.000-00 | All same digits |

---

## 2. CNPJ Validation

### 2.1 Algorithm Summary

CNPJ has 14 digits: `BB.BBB.BBB/FFFF-CC` where B=base (8 digits), F=branch/filial (4 digits, 0001=headquarters), C=check digits (2 digits).

**First check digit (d1):**
- Weights: `5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2` applied to digits 1-12
- Sum all products, divide by 11
- If remainder < 2: d1 = 0; else d1 = 11 - remainder

**Second check digit (d2):**
- Weights: `6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2` applied to digits 1-13 (including d1)
- Sum all products, divide by 11
- If remainder < 2: d2 = 0; else d2 = 11 - remainder

### 2.2 All-Same-Digit CNPJs (MUST reject)

| CNPJ (digits only) | Checksum passes? |
|---------------------|------------------|
| 00000000000000 | YES |
| 11111111111111 | NO |
| 22222222222222 | NO |
| 33333333333333 | NO |
| 44444444444444 | NO |
| 55555555555555 | NO |
| 66666666666666 | NO |
| 77777777777777 | NO |
| 88888888888888 | NO |
| 99999999999999 | NO |

**Note:** Unlike CPF (where all 10 pass checksum), only `00000000000000` passes the CNPJ checksum. The others fail mathematically. However, best practice is to reject all 10 explicitly since the `00000000000000` case would pass without the check.

### 2.3 Real Company CNPJs (verified valid)

| Company | CNPJ (formatted) | CNPJ (digits only) | Notes |
|---------|-------------------|---------------------|-------|
| Banco do Brasil | 00.000.000/0001-91 | 00000000000191 | All-zero base, leading zeros edge case |
| Petrobras | 33.000.167/0001-01 | 33000167000101 | Check digit d2=1 |
| Itau Unibanco | 60.701.190/0001-04 | 60701190000104 | Check digit d2=4 |
| Vale SA | 33.592.510/0001-54 | 33592510000154 | Mining company |
| Caixa Economica Federal | 00.360.305/0001-04 | 00360305000104 | Leading zeros |
| Ambev | 07.526.557/0001-00 | 07526557000100 | Both check digits = 0 |
| Correios | 34.028.316/0001-03 | 34028316000103 | Brazilian postal service |
| Bradesco | 60.746.948/0001-12 | 60746948000112 | Major bank |

### 2.4 Generated Valid CNPJs for Testing

| CNPJ (formatted) | CNPJ (digits only) | Notes |
|-------------------|---------------------|-------|
| 44.038.188/0001-32 | 44038188000132 | Algorithm example |
| 12.345.678/0001-95 | 12345678000195 | Sequential base |
| 98.765.432/0001-98 | 98765432000198 | Reverse sequential |
| 11.122.233/0001-83 | 11122233000183 | Pattern |
| 55.555.555/0001-91 | 55555555000191 | Repeated 5s (NOT all-same: branch=0001) |
| 10.020.030/0001-13 | 10020030000113 | Sparse digits |

### 2.5 Edge Case: Both Check Digits = 0

| CNPJ (formatted) | CNPJ (digits only) |
|-------------------|---------------------|
| 00.000.009/0001-00 | 00000009000100 |
| 07.526.557/0001-00 | 07526557000100 | (Ambev - real company!) |

### 2.6 Edge Case: CNPJ with Leading Zeros

Banco do Brasil (`00.000.000/0001-91`) is the canonical example. The base is `00000000` with branch `0001`. This is a valid, real CNPJ that tests parsers handling leading zeros.

### 2.7 Invalid CNPJ Test Vectors

| Input | Reason |
|-------|--------|
| 12.345.678/0001-00 | Wrong check digits (correct: -95) |
| 00.000.000/0000-00 | All same digits |
| 1234567800019 | Too few digits (13) |
| 123456780001950 | Too many digits (15) |
| ab.cde.fgh/ijkl-mn | Non-numeric |
| (empty string) | Empty |

### 2.8 Alphanumeric CNPJ (July 2026)

Starting July 2026, Brazil will introduce alphanumeric CNPJ format (same 14-character length but with letters). This is a future concern for validation. The current numeric-only validation will need to be updated.

---

## 3. CEP Validation

### 3.1 Format

8 digits, formatted as `NNNNN-NNN`. No check digit (unlike CPF/CNPJ). Validation is format + range only.

### 3.2 Overall Range

- **Minimum:** 01000-000
- **Maximum:** 99999-999
- **Lowest assigned:** 01001-000 (Praca da Se, Sao Paulo)
- **Highest assigned:** ~99990-970

### 3.3 CEP Ranges by State

| State | Abbreviation | CEP Range (start) | CEP Range (end) |
|-------|-------------|-------------------|-----------------|
| Sao Paulo | SP | 01000-000 | 19999-999 |
| Rio de Janeiro | RJ | 20000-000 | 28999-999 |
| Espirito Santo | ES | 29000-000 | 29999-999 |
| Minas Gerais | MG | 30000-000 | 39999-999 |
| Bahia | BA | 40000-000 | 48999-999 |
| Sergipe | SE | 49000-000 | 49999-999 |
| Pernambuco | PE | 50000-000 | 56999-999 |
| Alagoas | AL | 57000-000 | 57999-999 |
| Paraiba | PB | 58000-000 | 58999-999 |
| Rio Grande do Norte | RN | 59000-000 | 59999-999 |
| Ceara | CE | 60000-000 | 63999-999 |
| Piaui | PI | 64000-000 | 64999-999 |
| Maranhao | MA | 65000-000 | 65999-999 |
| Para | PA | 66000-000 | 68899-999 |
| Amapa | AP | 68900-000 | 68999-999 |
| Amazonas | AM | 69000-000 | 69899-999 |
| Roraima | RR | 69300-000 | 69389-999 |
| Acre | AC | 69900-000 | 69999-999 |
| Distrito Federal | DF | 70000-000 | 73699-999 |
| Goias | GO | 72800-000 | 76799-999 |
| Tocantins | TO | 77000-000 | 77995-999 |
| Mato Grosso | MT | 78000-000 | 78899-999 |
| Rondonia | RO | 78900-000 | 78999-999 |
| Mato Grosso do Sul | MS | 79000-000 | 79999-999 |
| Parana | PR | 80000-000 | 87999-999 |
| Santa Catarina | SC | 88000-000 | 89999-999 |
| Rio Grande do Sul | RS | 90000-000 | 99999-999 |

**Notes:**
- SP capital has a split range: 01000-05999 and 08000-08499 (capital), 12000-19999 (interior)
- RJ capital: 20000-23799 (capital), 26601-28999 (interior)
- DF and GO ranges overlap (72800-73699 belongs to both DF entorno and GO)
- RR is nested within AM range (69300-69389 inside 69000-69899)
- AC is at the end of AM range (69900-69999)

### 3.4 Famous/Well-Known CEPs for Testing

| CEP | Location | Notes |
|-----|----------|-------|
| 01001-000 | Praca da Se, Sao Paulo-SP | Lowest active CEP in Brazil |
| 01310-100 | Avenida Paulista, Sao Paulo-SP | Most famous avenue |
| 20040-020 | Praca Pio X, Centro, Rio de Janeiro-RJ | Downtown RJ |
| 22041-080 | Rua Anita Garibaldi, Copacabana, Rio-RJ | Copacabana beach area |
| 22241-090 | Cristo Redentor entrance, Cosme Velho, Rio-RJ | Christ the Redeemer |
| 70040-020 | Brasilia-DF | Federal capital |
| 70150-900 | Congresso Nacional area, Brasilia-DF | National Congress |

### 3.5 Gaps and Unassigned Ranges

The CEP system has gaps between state ranges:
- 06000-07999: SP (metropolitan region), but not all assigned
- 24000-26600: Gap between RJ capital and interior ranges
- Some suffixes (last 3 digits) are reserved: `-000` for general delivery, `-900` to `-999` often for large volume recipients (empresas, orgaos publicos)

### 3.6 Valid CEP Test Vectors

| CEP | State | Notes |
|-----|-------|-------|
| 01001-000 | SP | Minimum meaningful CEP |
| 01310-100 | SP | Av. Paulista |
| 20040-020 | RJ | Centro RJ |
| 30130-000 | MG | Belo Horizonte |
| 40020-000 | BA | Salvador |
| 70040-020 | DF | Brasilia |
| 80010-000 | PR | Curitiba |
| 90010-000 | RS | Porto Alegre |
| 99999-999 | RS | Maximum valid CEP format |

### 3.7 Invalid CEP Test Vectors

| Input | Reason |
|-------|--------|
| 00000-000 | Below minimum range (01000-000) |
| 00999-999 | Below minimum range |
| 1234567 | Too few digits (7) |
| 123456789 | Too many digits (9) |
| ABCDE-FGH | Non-numeric |
| (empty) | Empty |

---

## 4. Bank Code (COMPE) Validation

### 4.1 Format

3-digit numeric code (001-999). No check digit. Validation is format + known-code lookup.

### 4.2 Range

- **Minimum known:** 001 (Banco do Brasil)
- **Maximum known:** 756 (Bancoob/Sicoob)
- **Total institutions:** 300+ active codes
- Codes are NOT sequential -- there are large gaps

### 4.3 Major Bank COMPE Codes

| Code | Bank |
|------|------|
| 001 | Banco do Brasil S.A. |
| 003 | Banco da Amazonia S.A. |
| 004 | Banco do Nordeste do Brasil S.A. |
| 033 | Banco Santander (Brasil) S.A. |
| 041 | Banrisul (Banco do Estado do RS) |
| 070 | BRB (Banco de Brasilia) |
| 077 | Banco Inter |
| 104 | Caixa Economica Federal |
| 208 | Banco BTG Pactual |
| 212 | Banco Original |
| 237 | Banco Bradesco S.A. |
| 246 | Banco ABC Brasil |
| 260 | Nu Pagamentos (Nubank) |
| 290 | Pagseguro Internet S.A. |
| 318 | Banco BMG |
| 320 | China Construction Bank (CCB Brasil) |
| 336 | Banco C6 S.A. |
| 341 | Itau Unibanco S.A. |
| 389 | Banco Mercantil do Brasil |
| 399 | Kirton Bank (HSBC predecessor) |
| 422 | Banco Safra |
| 623 | PAN (Banco PAN) |
| 633 | Banco Rendimento |
| 655 | Banco Votorantim (BV) |
| 707 | Banco Daycoval |
| 741 | Banco Ribeirão Preto |
| 745 | Citibank |
| 748 | Sicredi |
| 756 | Bancoob (Sicoob) |

### 4.4 Notes on Validation

- Not all 3-digit codes between 001 and 756 are valid (sparse allocation)
- Codes can be deactivated when banks merge or close
- The official list is maintained by Banco Central do Brasil (BCB)
- Official PDF: https://www.bcb.gov.br/Fis/CODCOMPE/Tabela.pdf
- For validation purposes, a static list of known codes is recommended rather than range-based validation

---

## 5. DDD (Area Code) Validation

### 5.1 Format

2-digit numeric code (11-99). No check digit.

### 5.2 Complete List of Valid DDDs (67 total)

| State | DDDs |
|-------|------|
| SP (Sao Paulo) | 11, 12, 13, 14, 15, 16, 17, 18, 19 |
| RJ (Rio de Janeiro) | 21, 22, 24 |
| ES (Espirito Santo) | 27, 28 |
| MG (Minas Gerais) | 31, 32, 33, 34, 35, 37, 38 |
| PR (Parana) | 41, 42, 43, 44, 45, 46 |
| SC (Santa Catarina) | 47, 48, 49 |
| RS (Rio Grande do Sul) | 51, 53, 54, 55 |
| DF (Distrito Federal) + GO (entorno) | 61 |
| GO (Goias) | 62, 64 |
| TO (Tocantins) | 63 |
| MT (Mato Grosso) | 65, 66 |
| MS (Mato Grosso do Sul) | 67 |
| AC (Acre) | 68 |
| RO (Rondonia) | 69 |
| BA (Bahia) | 71, 73, 74, 75, 77 |
| SE (Sergipe) | 79 |
| PE (Pernambuco) | 81, 87 |
| AL (Alagoas) | 82 |
| PB (Paraiba) | 83 |
| RN (Rio Grande do Norte) | 84 |
| CE (Ceara) | 85, 88 |
| PI (Piaui) | 86, 89 |
| PA (Para) | 91, 93, 94 |
| AM (Amazonas) | 92, 97 |
| RR (Roraima) | 95 |
| AP (Amapa) | 96 |
| MA (Maranhao) | 98, 99 |

### 5.3 Complete List of INVALID DDDs (23 total)

Numbers in range 10-99 that are NOT valid area codes:

**Ending in 0 (all 9 are invalid):** 10, 20, 30, 40, 50, 60, 70, 80, 90

**Other gaps (14 codes):** 23, 25, 26, 29, 36, 39, 52, 56, 57, 58, 59, 72, 76, 78

### 5.4 DDDs Shared Between States

| DDD | States | Notes |
|-----|--------|-------|
| 61 | DF + GO | Only DDD shared between different federal units. Covers Brasilia and surrounding cities in Goias (Luziania, Valparaiso de Goias, Novo Gama, etc.) |

All other DDDs map to exactly one state.

### 5.5 Test Vectors

**Valid DDDs:**
| DDD | State | City |
|-----|-------|------|
| 11 | SP | Sao Paulo (capital) |
| 21 | RJ | Rio de Janeiro (capital) |
| 31 | MG | Belo Horizonte |
| 41 | PR | Curitiba |
| 51 | RS | Porto Alegre |
| 61 | DF/GO | Brasilia |
| 71 | BA | Salvador |
| 85 | CE | Fortaleza |
| 91 | PA | Belem |
| 92 | AM | Manaus |
| 99 | MA | Imperatriz (highest valid DDD) |

**Invalid DDDs:**
| DDD | Reason |
|-----|--------|
| 10 | Below minimum / ends in 0 |
| 20 | Ends in 0 |
| 23 | Not assigned |
| 00 | Below range |
| 01 | Below range (single digit) |
| 100 | Above range (3 digits) |

### 5.6 Pattern Summary

- All DDDs ending in 0 are invalid (10, 20, 30, ..., 90)
- SP (Sao Paulo) has the most DDDs: 9 (11-19, all in the first decade)
- MG (Minas Gerais) has 7 DDDs (31-35, 37, 38)
- PR (Parana) has 6 DDDs (41-46)
- Several states have only 1 DDD: TO (63), MS (67), AC (68), RO (69), SE (79), AL (82), PB (83), RN (84), RR (95), AP (96)

---

## 6. Cross-Reference: Validation Complexity by Document Type

| Document | Has Check Digit | Algorithm | All-Same-Digit Rule | Format Validation Only |
|----------|----------------|-----------|---------------------|----------------------|
| CPF | YES (2 digits) | Mod 11 weighted | YES (10 patterns, all pass checksum) | NO |
| CNPJ | YES (2 digits) | Mod 11 weighted | YES (10 patterns, only 0s pass checksum) | NO |
| CEP | NO | N/A | N/A | YES (8 digits, range check) |
| Bank Code | NO | N/A | N/A | YES (3 digits, known-list lookup) |
| DDD | NO | N/A | N/A | YES (2 digits, known-list lookup) |

---

## Sources

- [CPF Algorithm (Medium)](https://medium.com/@luannzin/the-math-behind-a-brazilian-cpf-d7f340bb7e96)
- [CPF/CNPJ Algorithms (Dev.to)](https://dev.to/leandrostl/demystifying-cpf-and-cnpj-check-digit-algorithms-a-clear-and-concise-approach-f3j)
- [CNPJ Algorithm (Master da Web)](https://masterdaweb.com/en/blog/algorithm-to-generate-cnpj/)
- [CPF Generator (4Devs)](https://www.4devs.com.br/gerador_de_cpf)
- [CEP Ranges (cadcobol.com.br)](https://www.cadcobol.com.br/faixa_de_ceps_do_brasil.htm)
- [DDD Complete List (codigosddd.com.br)](https://www.codigosddd.com.br/ddd/)
- [Bank COMPE Codes (Wise)](https://wise.com/br/codigo-do-banco/)
- [Official COMPE Table (BCB PDF)](https://www.bcb.gov.br/Fis/CODCOMPE/Tabela.pdf)
- [CNPJ Wikipedia](https://en.wikipedia.org/wiki/CNPJ)
- [CPF Wikipedia](https://en.wikipedia.org/wiki/CPF_number)
- [CEP Wikipedia](https://en.wikipedia.org/wiki/C%C3%B3digo_de_Endere%C3%A7amento_Postal)
- [DDD Brazil Wikipedia](https://en.wikipedia.org/wiki/List_of_dialling_codes_in_Brazil)
- [Anatel DDD Codes](https://www.anatel.gov.br/hotsites/CodigosNacionaisLocalidade/TelefoneCelular-CodigosDeArea.htm)

# Demo Video Script — Brasil Hub for n8n (v0.1.6)

**Target duration:** 3–4 min | **No cuts** | **Loom or similar**
**Version:** 0.1.6
**Purpose:** n8n Creator Portal manual review submission

---

## Scene 1 — Installation (~30s)

1. Open n8n in browser
2. Go to **Settings → Community Nodes**
3. Click **Install a community node**
4. Type `n8n-nodes-brasil-hub`
5. Confirm installed version is **0.1.6**
6. **Narration:** *"Installing Brasil Hub version 0.1.6 from npm. This node queries Brazilian public data — CNPJ and CEP — with automatic multi-provider fallback."*

---

## Scene 2 — Create Workflow + Insert Node (~20s)

1. Click **New Workflow**
2. Click **+** → search "Brasil Hub"
3. Add the node to the canvas
4. Show briefly: icon, name, 2 resources (CNPJ, CEP)
5. **Narration:** *"The node appears with two resources: CNPJ for company data and CEP for address lookups."*

---

## Scene 3 — Credentials (~10s)

1. Show that the node **has no credentials field**
2. **Narration:** *"This node doesn't require any credentials — all data providers are free public APIs."*

> **Note:** The portal asks to demonstrate credentials, but since there are none, just mention all APIs are public.

---

## Scene 4 — CNPJ Query (~60s)

1. Select **Resource: CNPJ**, **Operation: Query**
2. Enter CNPJ (Banco do Brasil): `00.000.000/0001-91`
3. Click **Test step**
4. Show normalized output:
   - `razao_social`, `situacao`, `endereco`, `socios`
   - `_meta.provider` and `_meta.strategy` fields
5. **Narration:** *"Querying Banco do Brasil's CNPJ. The output is normalized — same schema regardless of which provider responds. The _meta field shows which provider was used and whether it was a direct hit or a fallback."*
6. Enable **Include Raw Response** → execute again
7. Show `_raw` appearing in output
8. **Narration:** *"Enabling Include Raw Response adds the original API response for advanced use cases."*

---

## Scene 5 — CNPJ Validate (~30s)

1. Change to **Operation: Validate**
2. Test with valid CNPJ: `11.222.333/0001-81` → show `valid: true`
3. Test with invalid CNPJ: `11.111.111/1111-11` → show `valid: false`
4. **Narration:** *"The Validate operation checks CNPJ locally using checksum verification — no API call needed, instant response."*

---

## Scene 6 — CEP Query (~40s)

1. Change to **Resource: CEP**, **Operation: Query**
2. Enter CEP (Praça da Sé): `01001-000`
3. Execute → show output: `logradouro`, `bairro`, `cidade`, `uf`, `_meta`
4. **Narration:** *"CEP Query returns address data. If the primary provider (BrasilAPI) fails, it automatically falls back to ViaCEP, then OpenCEP."*

---

## Scene 7 — CEP Validate (~15s)

1. Change to **Operation: Validate**
2. Test `01001000` → `valid: true`
3. Test `00000000` → `valid: false`
4. **Narration:** *"CEP validation checks format locally — rejects all-zeros and invalid formats."*

---

## Scene 8 — AI Agent Tool (~60s)

1. Create a new workflow
2. Add **AI Agent** node (or **Tools Agent**)
3. Add **Brasil Hub** as a tool (drag to the "tools" connection)
4. Configure an LLM (OpenAI, etc.)
5. In **Chat Trigger**, send: *"What company is registered under CNPJ 00.000.000/0001-91?"*
6. Execute → show the agent calling Brasil Hub automatically and returning the answer
7. **Narration:** *"Brasil Hub works as an AI Agent tool. The agent automatically selects the right resource and operation based on the user's question."*

---

## Scene 9 — Closing (~10s)

**Narration:** *"That's Brasil Hub — Brazilian public data queries with multi-provider fallback, zero credentials, and AI Agent compatibility. Thank you!"*

---

## Test Data (copy before recording)

| Test | Value |
|------|-------|
| Valid CNPJ (Banco do Brasil) | `00.000.000/0001-91` |
| Valid CNPJ (generic) | `11.222.333/0001-81` |
| Invalid CNPJ | `11.111.111/1111-11` |
| Valid CEP (Praça da Sé) | `01001-000` |
| Invalid CEP | `00000-000` |
| AI Agent prompt | `What company is registered under CNPJ 00.000.000/0001-91?` |

## Production Tips

- **Resolution:** 1080p minimum
- **Zoom:** Zoom into JSON output so it's readable
- **Before recording:** test all values to ensure APIs are responding
- **If a provider fails:** great — it shows fallback in action (`_meta.strategy: "fallback"`)

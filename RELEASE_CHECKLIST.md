# Release Checklist

Copiar este checklist para cada release. **TODOS os itens são obrigatórios.** Não publicar sem completar cada fase.

## Pre-Release

### Fase 1: Compliance & Segurança
- [ ] `/n8n-node-dev` — 17 checks de compliance (package.json, codex, icons, descriptions, ESLint)
- [ ] `/n8n-validation` — Validar configuração do node (params, types, displayConditions)
- [ ] `/security-reviewer` — Audit de segurança (input validation, SSRF, URL encoding, error messages)
- [ ] **Gate:** Zero findings Critical/High

### Fase 2: Qualidade de Código
- [ ] `/test-master` — Attack tests adversariais para novo código
- [ ] `/simplify` — Code review: reuso, duplicação, eficiência
- [ ] `/code-documenter` — JSDoc 100% em funções/classes exportadas
- [ ] **Gate:** Coverage ≥ 90%, zero findings HIGH do simplify sem justificativa

### Fase 3: Testing Arsenal
- [ ] `/testing-arsenal` — Pre-Ship Checklist (Library/Package profile)
- [ ] test-master: attack tests escritos e passando
- [ ] test-skeptic: testes provam algo (se nova feature significativa)
- [ ] code-reviewer: código revisado
- [ ] security-reviewer: 0 Critical/High
- [ ] **Gate:** Todos os findings corrigidos

### Fase 4: Build & CI
- [ ] `npx n8n-node build` — Build limpo
- [ ] `npx n8n-node lint` — 0 errors
- [ ] `npx jest --coverage` — Todos passando, ≥ 90% branches
- [ ] `npm audit --audit-level=critical` — 0 critical vulns
- [ ] **Gate:** Tudo verde

### Fase 5: Docs & Release
- [ ] **CHANGELOG.md** — Nova entry com [X.Y.Z] - YYYY-MM-DD + links
- [ ] **package.json** — version bump + description + keywords
- [ ] **README.md** — Operations table + description + test count
- [ ] **CLAUDE.md** — Overview + provider list + architecture tree
- [ ] **BrasilHub.node.json** (codex) — Aliases atualizados
- [ ] **.github/copilot-instructions.md** — Resource list + version
- [ ] **.github/SECURITY.md** — Supported versions + provider list
- [ ] **SECURITY-ASSESSMENT.md** — Attack surface, threat table, resource/operation counts
- [ ] **ROADMAP.md** — Marcar items como done
- [ ] **task_plan.md** — Current Phase + checkboxes + status
- [ ] **progress.md** — Session log + test results + 5-Question Reboot
- [ ] PR criado → CI verde → merge
- [ ] CI verde em main
- [ ] `git tag -a vX.Y.Z -m "Release vX.Y.Z"` + `git push --tags`
- [ ] `gh release create vX.Y.Z --title "vX.Y.Z" --notes-file /tmp/release-notes.md`

### Fase 6: Post-Release
- [ ] `gh run list --workflow=release.yml --limit 1` — Release workflow verde
- [ ] `npm view n8n-nodes-brasil-hub version` — Versão correta no npm
- [ ] **GitHub Discussions** — Criar Announcement com resumo do release
- [ ] **Roadmap Discussion (#63)** — Comentário com status atualizado
- [ ] **Deprecação** (se aplicável) — `npm deprecate` versões bugadas
- [ ] **Living Docs verificação final** — Grep por versão antiga, confirmar todos atualizados

## Verificação Final

```bash
# Confirmar tudo verde
gh run list --limit 3
npm view n8n-nodes-brasil-hub version
npx jest --coverage | tail -5
```

---

*Este checklist é referenciado pelo CLAUDE.md como obrigatório para cada release.*

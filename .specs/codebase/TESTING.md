# Testing Infrastructure

**Status:** Sem testes automatizados em nenhum dos dois repos.

## Frameworks

- **Frontend (jme-pwa):** Nenhum. Sem Vitest, Jest, Playwright, Cypress.
- **Backend (jme-back):** Pasta `tests/` existe mas sem framework configurado no package.json.

## Como Testar Manualmente (Processo Atual)

### Frontend
```bash
npm run dev          # Sobe em localhost:5173
npm run build        # Verifica erros de build antes de push
```

### Backend
```bash
npm run dev          # nodemon index.js — reload automático
# Ou
npm start            # node index.js
```

## Gate Checks (sem automação)

| Gate | Comando | Quando usar |
|------|---------|-------------|
| Build frontend | `npm run build` | Antes de push no jme-pwa |
| Start backend | `npm start` | Após mudanças no jme-back |
| Verificar status | `GET /api/status` | Após deploy Railway |
| Verificar SSE | Browser DevTools → Network → EventStream | Testar atualizações tempo real |

## Recomendação Futura

Adicionar Vitest no frontend e Jest no backend caso testes automatizados sejam necessários.
Pastas sugeridas: `src/__tests__/` (frontend), `tests/` (backend — já existe).

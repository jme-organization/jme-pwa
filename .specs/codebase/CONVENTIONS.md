# Code Conventions

## Naming

**Arquivos:**
- Pages: `camelcase.jsx` — `qr.jsx`, `dashboard.jsx`, `boasvindas.jsx`
- Components: `PascalCase.jsx` — `TopNav.jsx`, `ErrorBoundary.jsx`
- Hooks: `camelCase.js` prefixado com `use` — `useFetch.js`, `useSSEData.js`
- Contexts: `PascalCaseContext.jsx` — `ThemeContext.jsx`, `NotificationContext.jsx`
- Backend routes: `kebab-case.js` — `bot.js`, `boas-vindas.js`, `instalacoes-agendadas.js`
- Backend services: `camelCaseService.js` — `sseService.js`, `whatsappService.js`

**Exports Frontend:**
- Named exports em PascalCase: `export function PageQR`, `export function TopNav`
- Default export apenas em `App.jsx`

**Variáveis:**
- camelCase: `botAtivo`, `botIniciadoEm`, `situacaoRede`
- Constantes de env no topo do arquivo: `const API = import.meta.env.VITE_API_URL || ""`

## Estrutura de Arquivo (Frontend)

Padrão observado em pages:
```jsx
// 1. Imports React
import React, { useState, useEffect } from 'react';

// 2. Constantes de ambiente (local por arquivo)
const API = import.meta.env.VITE_API_URL || "";
const API_KEY = import.meta.env.VITE_ADMIN_API_KEY || "";
const authHeaders = () => API_KEY ? { "x-api-key": API_KEY } : {};

// 3. Export da função componente
export function PageXxx({ props }) {
  // estados
  // effects
  // handlers
  // return JSX
}
```

## Estilização

Inline styles exclusivamente via objeto `style={{}}`. Sem classes CSS externas, sem CSS modules, sem Tailwind. Paleta dark theme consistente:
- Background cards: `#0f1117`
- Borders: `rgba(255,255,255,0.05)` a `rgba(255,255,255,0.1)`
- Verde online: `#22c55e` / `rgba(34,197,94,.3)`
- Vermelho erro: `#ef4444` / `rgba(239,68,68,.3)`
- Azul info: `#38bdf8`
- Amarelo alerta: `#fbbf24`
- Texto secundário: `#64748b`

## Autenticação (Frontend)

Cada arquivo define `authHeaders()` localmente — padrão repetido em todas as pages. `src/api/client.js` existe mas não é usado universalmente.

```js
const authHeaders = () => API_KEY ? { "x-api-key": API_KEY } : {};
// uso:
fetch(url, { headers: { "Content-Type": "application/json", ...authHeaders() } })
```

## Error Handling (Frontend)

Try/catch nos async handlers com mensagem local via `setMsg`:
```js
try {
  const r = await fetch(...);
  const j = await r.json();
  setMsg(j.ok ? { tipo: 'ok', texto: '...' } : { tipo: 'erro', texto: j.erro });
} catch {
  setMsg({ tipo: 'erro', texto: 'Falha de conexão com o servidor.' });
}
```

## Backend — Estrutura de Route Handler

```js
module.exports = function setupXxxRoutes(app, ctx) {
  app.get('/api/xxx', async (req, res) => {
    try {
      // lógica
      res.json({ ok: true, data: ... });
    } catch(e) {
      res.status(500).json({ ok: false, erro: e.message });
    }
  });
};
```

## Resposta de API (Backend)

Padrão consistente:
- Sucesso: `{ ok: true, ...dados }`
- Erro: `{ ok: false, erro: string }` com status HTTP adequado
- `/api/status`: exceção — retorna direto `{ botAtivo, online, iniciadoEm, situacaoRede, previsaoRetorno }`

## Comentários

Mínimos. Usados para separar seções:
```js
// ─────────────────────────────────────────────────────
// WHATSAPP
// ─────────────────────────────────────────────────────
```
E para contexto não óbvio:
```js
// /api/status não toca Firebase — só lê variáveis em memória, custo zero
```

# Architecture

**Pattern:** Monolito frontend + Monolito backend separados, comunicação REST + SSE

---

## Visão Geral

```
[Browser — Vercel]          [Railway]
  jme-pwa (React)    ←→     jme-back (Express + whatsapp-web.js)
       │                          │
       │  REST (x-api-key)        │
       │  SSE (status-stream)     │── Firebase Firestore (dados)
       │  SSE (alertas)           │── Firebase Storage (sessão WA)
       └──────────────────────────┘
```

---

## Frontend — Padrões Identificados

### Prop Drilling de Status Global

`App.jsx` é o hub central. Faz polling REST + SSE de `/api/status` e distribui `botStatus` como prop para todas as pages.

```
App.jsx
  └── botStatus (state) ─── polling 30s + SSE /api/status-stream
        ├── TopNav (botAtivo, onToggle)
        ├── PageDashboard (status)
        └── PageQR (status)
```

### SSE Duplo

- **`/api/status-stream`** — gerenciado em `App.jsx`, alimenta status global (online, botAtivo, situacaoRede)
- **`/api/dashboard/alertas`** — gerenciado via `useSSEData` hook em `NotificationContext`, alimenta notificações

### Hooks

| Hook | Propósito |
|------|-----------|
| `useFetch(url, interval)` | Polling REST genérico com auto-refetch |
| `useSSEData(resource)` | SSE com singleton, refcount, reconnect exponencial |

### Contexts

| Context | Propósito |
|---------|-----------|
| `ThemeContext` | Tema claro/escuro |
| `NotificationContext` | Alertas em tempo real (promessas, inadimplentes, chamados) |

### Autenticação nas chamadas REST

Toda chamada inclui `x-api-key` via `authHeaders()` local em cada arquivo. Não há cliente HTTP centralizado usado consistentemente — `src/api/client.js` existe mas não é adotado em todas as pages.

---

## Backend — Padrões Identificados

### Inicialização Sequencial

`index.js` inicializa tudo em sequência:
1. Firebase + Firestore
2. Express app + middlewares
3. Rotas globais (status, QR, SSE)
4. `setupBotRoutes(app, ctxRotas)` + demais routes
5. `inicializarWhatsApp()` (async, com retry até 5x)

### Contexto Compartilhado (ctxRotas)

Objeto passado para todos os route handlers com getters/setters para variáveis globais:

```js
ctxRotas = {
  client,          // instância whatsapp-web.js
  botAtivo,        // get/set
  botIniciadoEm,   // get/set — determina online: !!botIniciadoEm
  situacaoRede,    // get/set
  sseService,      // singleton SSE
  db, banco,       // Firebase helpers
  ...
}
```

### Fluxo WhatsApp Session

```
inicializarWhatsApp()
  └── criarNovoClient() → RemoteAuth (FirestoreStore → Firebase Storage)
        ├── on('qr') → salva ultimoQR, serve em GET /qr
        ├── on('ready') → botIniciadoEm = Date.now(), sseService.broadcast()
        └── on('disconnected') → botIniciadoEm = null, sseService.broadcast(),
                                   deleta sessão, aguarda 30s, reinicia
```

### SSE Broadcast Triggers

| Evento | Onde | Quem chama |
|--------|------|-----------|
| WhatsApp ready | index.js:307 | automático |
| WhatsApp disconnected | index.js:316 | automático |
| Bot toggle | bot.js:53 | rota POST /api/bot/toggle |
| Rede status update | bot.js:96 | rota POST /api/rede |
| Heartbeat | sseService.js:137 | a cada 30s por cliente |

### Estrutura de Rotas

Todas as rotas são registradas via `module.exports = function(app, ctx)` e chamadas em `index.js`:

```
routes/
  index.js          — registra todas as rotas
  bot.js            — /api/status, /api/bot/*, /api/whatsapp/*, /api/rede
  clientes.js       — CRUD clientes Firebase
  cobranca.js       — disparo de cobranças WhatsApp
  dashboard.js      — métricas + SSE alertas
  agendamentos.js   — agenda de instalações
  chamados.js       — suporte técnico
  ...
```

---

## Fluxo de Status Online/Offline

```
Backend: botIniciadoEm (null = offline, timestamp = online)
    ↓
GET /api/status → { online: !!botIniciadoEm }
SSE /api/status-stream → { online: !!botIniciadoEm } (heartbeat 30s + eventos)
    ↓
Frontend: App.jsx botStatus.online
    ↓
PageQR: online = forceOffline ? false : status?.online
PageDashboard: mostra estado
TopNav: indicador visual
```

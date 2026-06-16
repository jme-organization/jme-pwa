# External Integrations

---

## WhatsApp

**Lib:** whatsapp-web.js 1.34.6 (Puppeteer-based — emula WhatsApp Web)
**Propósito:** Envio/recebimento de mensagens WhatsApp pelo bot
**Localização:** `jme-back/index.js` (lifecycle) + `services/whatsappService.js` (envio)
**Auth:** QR Code escaneado pelo celular → sessão salva no Firebase Storage
**Estratégia de sessão:** RemoteAuth com `FirestoreStore` customizado

### Ciclo de vida da sessão

```
criarNovoClient() → RemoteAuth(FirestoreStore)
  → client.initialize()
  → on('qr') → salva ultimoQR
  → on('ready') → botIniciadoEm = Date.now()
  → on('remote_session_saved') → sessão sincronizada no Storage
  → on('disconnected') → limpa, deleta sessão, reinicia em 30s
```

### Envio de mensagens

`services/whatsappService.js` — `enviarMensagemSegura(client, numero, mensagem)`
- Timeout configurado
- Fallback LID resolution para números com sufixo

---

## Firebase

**SDK:** firebase-admin 13.7.0
**Credenciais:** `firebasekey.json` (service account)

### Firestore

**Propósito:** Banco de dados principal — clientes, cobranças, chamados, promessas, logs, agendamentos
**Acesso:** Via `firebaseDb` (instância Firestore) passado em `ctxRotas`
**Collections principais:**
- `clientes` — dados dos clientes com subcoleções (`historico_pagamentos`, etc.)
- `promessas` — promessas de pagamento
- `chamados` — tickets de suporte
- `agendamentos` — instalações agendadas
- `logs` — logs do bot
- `alertas` — alertas automáticos

### Firebase Storage

**Propósito:** Persistência da sessão WhatsApp (arquivo zip da sessão Puppeteer)
**Acesso:** Via `services/FirestoreStore.js`
**Arquivo salvo:** `RemoteAuth-jme-bot` (zip com dados da sessão)
**Sync interval:** 12 horas (configurado em RemoteAuth)

---

## SSE (Server-Sent Events)

**Implementação:** Custom (`services/sseService.js` — sem lib externa)
**Endpoints:**
- `GET /api/status-stream` — status geral do bot (online, botAtivo, rede)
- `GET /api/dashboard/alertas` — alertas em tempo real (inadimplentes, promessas, chamados)

**Configuração:**
- Max 5 clientes simultâneos por endpoint
- Heartbeat a cada 30s
- Reconexão no frontend: exponential backoff (`useSSEData.js`)

---

## Vercel (Frontend Deploy)

**Trigger:** Push no branch `main` do jme-pwa
**Config:** Automático via framework detection (Vite)
**Env vars:** Configuradas no painel Vercel (`VITE_API_URL`, `VITE_ADMIN_API_KEY`)

---

## Railway (Backend Deploy)

**Trigger:** Push no branch `main` do jme-back
**Config:** `render.yaml` presente (também suporta Render)
**Start command:** `npm start` → `node index.js`
**Porta:** `process.env.PORT || 3001`

---

## QR Code

**Lib:** qrcode 1.5.4
**Endpoint:** `GET /qr` → retorna PNG do QR Code atual
**Fonte:** `ultimoQR` (variável em memória em `index.js`) — atualizado no evento `on('qr')`

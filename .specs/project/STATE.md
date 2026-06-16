# Project State

**Última atualização:** 2026-06-16

---

## Decisões

- **SSE em vez de WebSocket** — escolhido pela simplicidade (unidirecional backend→frontend é suficiente)
- **RemoteAuth + Firebase Storage** — sessão WhatsApp persiste entre reinícios do Railway
- **Inline styles** — toda estilização via style props, dark theme consistente, sem framework CSS
- **Prop drilling de botStatus** — mantido simples via props por enquanto (ver C8 em CONCERNS.md se crescer)

## Fixes Aplicados (2026-06-16)

### Bug: Botão desconectar WhatsApp não funcionava com sessão inválida

**Sintoma:** Celular deslogado do WhatsApp, frontend mostrava "conectado", botão não respondia.

**Causa raiz:**
1. `on('disconnected')` em `index.js` não chamava `sseService.broadcast()` → frontend só atualizava no próximo heartbeat (30s)
2. `POST /api/whatsapp/desconectar` chamava `client.logout()` que lançava erro quando sessão já era inválida → retornava `{ ok: false }` em vez de forçar offline

**Fixes:**
- `jme-back/index.js:316` — adicionado `sseService.broadcast()` após `botIniciadoEm = null`
- `jme-back/routes/bot.js:153` — `logout()` em try/catch, força `ctx.botIniciadoEm = null` + broadcast independente do resultado
- `jme-pwa/src/pages/qr.jsx` — `forceOffline` state para UI responder instantaneamente após clique

## Bloqueadores Ativos

Nenhum.

## Ideias Adiadas

- Autenticação real (login/senha + JWT) em vez de API key no frontend — ver C1 em CONCERNS.md
- Migrar de whatsapp-web.js para Baileys (sem Puppeteer, menos RAM) — avaliar se Railway tiver problemas de memória
- Adicionar `resetarSessao` com reinício automático do cliente (sem precisar reiniciar servidor) — ver C7
- ESLint + TypeScript no frontend para evitar erros silenciosos

## Preferências

- Commits em português (mensagens descritivas do que e por quê)
- Deploys automáticos via push no main (Railway + Vercel)
- Sem testes automatizados por enquanto (projeto pequeno, time pequeno)

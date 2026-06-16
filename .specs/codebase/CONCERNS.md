# Concerns

---

## CRÍTICO

### C1 — API Key exposta no frontend

**Arquivo:** `src/pages/*.jsx`, `src/App.jsx`
**Problema:** `VITE_ADMIN_API_KEY` é env var do Vite — vai para o bundle JavaScript público. Qualquer um pode ver a chave no browser.
**Risco:** Acesso não autorizado a todas as rotas admin do backend.
**Fix:** Criar camada de autenticação real (JWT com login/senha) ou restringir acesso por IP no Railway.

### C2 — `authHeaders()` duplicado em cada arquivo

**Arquivos:** Todos os pages (`qr.jsx`, `cobranca.jsx`, etc.) e `App.jsx`
**Problema:** Mesmo padrão copypasta em ~15 arquivos. `src/api/client.js` existe mas não é usado.
**Risco:** Se a forma de auth mudar, precisa atualizar 15+ arquivos.
**Fix:** Usar `src/api/client.js` em todos os lugares — já tem `headers()` centralizado.

---

## ALTO

### C3 — whatsapp-web.js depende de Puppeteer (Chrome headless)

**Arquivo:** `jme-back/index.js`
**Problema:** Puppeteer consome muita RAM (~300-500MB). Railway free tier tem limite. Se o Railway reiniciar o container por falta de memória, a sessão WhatsApp cai.
**Risco:** Downtime imprevisível do bot.
**Fix:** Monitorar uso de memória. Considerar Baileys (sem Puppeteer) no futuro se RAM for problema.

### C4 — Estado global em variáveis de módulo (`botIniciadoEm`, `botAtivo`)

**Arquivo:** `jme-back/index.js:67-71`
**Problema:** Estado em memória. Se o servidor reiniciar, `botAtivo` volta ao valor padrão. Configurações de rede (`situacaoRede`, `previsaoRetorno`) também se perdem.
**Risco:** Após reinício do Railway, bot pode ligar/desligar diferente do esperado.
**Fix:** Salvar `botAtivo` e config de rede no Firestore e carregar no boot (já há código parcial de restauração em `on('ready')`).

### C5 — Sem retry/timeout nas chamadas REST do frontend

**Arquivos:** `src/pages/*.jsx`
**Problema:** Chamadas `fetch` sem timeout. Se backend demorar, UI trava no estado "carregando" indefinidamente.
**Fix:** Adicionar `AbortController` com timeout (~10s) nas chamadas críticas.

---

## MÉDIO

### C6 — SSE limitado a 5 clientes simultâneos

**Arquivo:** `jme-back/services/sseService.js:41`
**Problema:** `maxClients = 5`. Se o painel abrir em múltiplas abas ou dispositivos, conexões são rejeitadas silenciosamente.
**Fix:** Aumentar limite ou implementar reconexão mais agressiva no frontend.

### C7 — `resetarSessao` requer reinício manual do servidor

**Arquivo:** `jme-back/routes/bot.js:162-171`
**Problema:** Rota deleta sessão do Storage mas não reinicia o cliente WhatsApp. Mensagem retornada: "Reinicie o servidor para gerar novo QR". Usuário precisa reiniciar o Railway manualmente.
**Fix:** Após deletar sessão, chamar `client.destroy()` e depois `inicializarWhatsApp()` para gerar novo QR automaticamente.

### C8 — Prop drilling de `status` em App.jsx

**Arquivo:** `src/App.jsx`
**Problema:** `botStatus` passado via props para pages. Se mais pages precisarem, o drilling fica profundo.
**Fix:** Mover `botStatus` para um Context (ex: `BotStatusContext`) se a quantidade de consumers crescer.

### C9 — Sem tratamento de erro de build no frontend

**Problema:** Sem TypeScript, sem linting configurado. Erros de sintaxe só aparecem no `npm run build`.
**Fix:** Adicionar ESLint com plugin React ao projeto.

---

## BAIXO

### C10 — `firebasekey.json` no repositório

**Arquivo:** `jme-back/firebasekey.json`
**Problema:** Credenciais do Firebase commitadas. Visíveis a qualquer um com acesso ao repo.
**Fix:** Mover para variável de ambiente (`FIREBASE_SERVICE_ACCOUNT` como JSON string) e remover do repo. Adicionar ao `.gitignore`.

### C11 — Sem paginação no frontend para listas grandes

**Arquivos:** `src/pages/clientes.jsx`, `src/pages/inadimplentes.jsx`
**Problema:** Se a base de clientes crescer muito, carregar tudo de uma vez pode travar o browser.
**Fix:** Backend tem `routes/paginacao.js` — integrar no frontend.

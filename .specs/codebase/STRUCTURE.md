# Project Structure

---

## Frontend — jme-pwa

```
jme-pwa/
├── src/
│   ├── api/
│   │   └── client.js           # Cliente HTTP com auth (pouco usado)
│   ├── components/
│   │   ├── TopNav.jsx           # Navbar global (bot toggle, navegação)
│   │   └── ErrorBoundary.jsx    # Catch de erros React
│   ├── contexts/
│   │   ├── ThemeContext.jsx     # Tema claro/escuro
│   │   └── NotificationContext.jsx  # Alertas SSE em tempo real
│   ├── hooks/
│   │   ├── useFetch.js          # Polling REST genérico
│   │   └── useSSEData.js        # SSE com singleton + reconnect
│   ├── pages/
│   │   ├── dashboard.jsx        # Home — status, métricas, gráficos
│   │   ├── qr.jsx               # Conexão WhatsApp (QR + desconectar)
│   │   ├── clientes.jsx         # Listagem e busca de clientes
│   │   ├── cobranca.jsx         # Disparos de cobrança
│   │   ├── chamados.jsx         # Suporte técnico
│   │   ├── promessas.jsx        # Promessas de pagamento
│   │   ├── inadimplentes.jsx    # Clientes inadimplentes
│   │   ├── agendamentos.jsx     # Agenda de instalações
│   │   ├── cancelamentos.jsx    # Cancelamentos
│   │   ├── boasvindas.jsx       # Mensagens de boas-vindas
│   │   ├── carne.jsx            # Carnê de pagamento
│   │   ├── logs.jsx             # Logs do bot
│   │   ├── sgp.jsx              # SGP
│   │   ├── novos.jsx            # Novos clientes
│   │   └── estados.jsx          # Estados de atendimento
│   ├── App.jsx                  # Root: SSE global, routing, status
│   ├── main.jsx                 # Entry point React
│   └── index.css                # Reset CSS mínimo
├── .specs/                      # Documentação spec-driven (este diretório)
├── public/
├── index.html
├── vite.config.js
└── package.json
```

### Onde ficam as coisas (Frontend)

| Capacidade | Localização |
|-----------|-------------|
| Status global WhatsApp/bot | `App.jsx` (state) → props |
| Conexão WhatsApp | `src/pages/qr.jsx` |
| Dashboard principal | `src/pages/dashboard.jsx` |
| Notificações em tempo real | `src/contexts/NotificationContext.jsx` |
| Polling de dados | `src/hooks/useFetch.js` |
| SSE | `src/hooks/useSSEData.js` |
| Navegação | `src/components/TopNav.jsx` |
| Rotas SPA | `src/App.jsx` (BrowserRouter) |

---

## Backend — jme-back

```
jme-back/
├── routes/
│   ├── index.js                 # Registra todos os route handlers
│   ├── bot.js                   # /api/status, /api/bot/*, /api/whatsapp/*, /api/rede
│   ├── clientes.js              # CRUD clientes Firebase
│   ├── cobranca.js              # Disparos de cobrança WhatsApp
│   ├── dashboard.js             # Métricas + SSE alertas
│   ├── agendamentos.js          # Agenda de instalações
│   ├── chamados.js              # Suporte técnico
│   ├── alertas.js               # Alertas automáticos
│   ├── cancelamentos.js         # Cancelamentos
│   ├── boas-vindas.js           # Mensagens automáticas
│   ├── logs.js                  # Logs do bot
│   ├── relatorios.js            # Relatórios
│   ├── instalacoes.js           # Instalações
│   ├── instalacoes-agendadas.js # Instalações agendadas
│   ├── admin.js                 # Rotas admin
│   ├── auth.js                  # Autenticação JWT
│   ├── backup.js                # Backup de dados
│   ├── migracao.js              # Migrações
│   └── paginacao.js             # Paginação genérica
├── services/
│   ├── FirestoreStore.js        # Sessão WhatsApp no Firebase Storage
│   ├── sseService.js            # SSE singleton (broadcast, heartbeat)
│   ├── whatsappService.js       # enviarMensagemSegura()
│   ├── cobrancaService.js       # Lógica de cobrança automática
│   ├── adminService.js          # Lógica admin
│   ├── mensagemService.js       # Templates de mensagens
│   ├── statusService.js         # Status e métricas
│   └── utilsService.js          # Utilitários
├── database/                    # Abstrações Firebase/banco
├── config/                      # Configurações
├── helpers/                     # Helpers genéricos
├── middleware/                  # Express middlewares
├── shared/                      # Código compartilhado
├── index.js                     # Entry point: init Express + WhatsApp
├── firebasekey.json             # Credenciais Firebase (não commitado em prod)
└── package.json
```

### Onde ficam as coisas (Backend)

| Capacidade | Localização |
|-----------|-------------|
| Init WhatsApp + lifecycle | `index.js` (`inicializarWhatsApp`) |
| Status online/offline | `index.js` (`botIniciadoEm`) → `routes/bot.js` |
| SSE broadcast | `services/sseService.js` |
| Sessão WhatsApp persistida | `services/FirestoreStore.js` |
| Envio de mensagens | `services/whatsappService.js` |
| Dados clientes | `routes/clientes.js` + Firebase Firestore |
| Cobrança automática | `services/cobrancaService.js` |

# Tech Stack

**Analyzed:** 2026-06-16

## Sistema Completo

Dois repositórios separados: `jme-pwa` (frontend) + `jme-back` (backend).

---

## Frontend — jme-pwa

- **Framework:** React 18.3.1
- **Build:** Vite 5.4.21 + @vitejs/plugin-react
- **Roteamento:** React Router DOM 7.13.1
- **Gráficos:** Recharts 2.12.7
- **Ícones:** react-icons 5.6.0
- **Linguagem:** JavaScript (JSX, ES Modules)
- **Package manager:** npm
- **Deploy:** Vercel (auto-deploy via push no main)
- **Estilização:** CSS inline via style props (sem framework CSS externo)
- **State management:** useState local + props drilling (sem Redux/Zustand)
- **Comunicação tempo real:** SSE (EventSource nativo)

### Variáveis de ambiente (frontend)

| Var | Uso |
|-----|-----|
| `VITE_API_URL` | URL base do backend Railway |
| `VITE_ADMIN_API_KEY` | Chave de autenticação das rotas |

---

## Backend — jme-back

- **Runtime:** Node.js
- **Framework:** Express 5.2.1
- **WhatsApp:** whatsapp-web.js 1.34.6 (Puppeteer-based, RemoteAuth strategy)
- **Banco:** Firebase Firestore (firebase-admin 13.7.0)
- **Sessão WhatsApp:** Firebase Storage via FirestoreStore customizado
- **Auth:** x-api-key header + JWT (jsonwebtoken 9.0.3)
- **Rate limiting:** express-rate-limit 8.4.1
- **QR Code:** qrcode 1.5.4
- **Deploy:** Railway (auto-deploy via push no main)
- **Dev:** nodemon 3.1.14

### Variáveis de ambiente (backend)

| Var | Uso |
|-----|-----|
| `PORT` | Porta do servidor (padrão 3001) |
| Firebase credentials | Via `firebasekey.json` |
| `ADMIN_API_KEY` | Validada nas rotas admin |

---

## Testing

Nenhum framework de teste configurado em nenhum dos dois repos.

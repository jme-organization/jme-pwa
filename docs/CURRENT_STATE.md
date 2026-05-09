# CURRENT_STATE.md

**Última atualização:** 2026-05-09

## Visão Geral

Painel admin React do JME-BOT. Frontend PWA com Vite, React Router DOM e Recharts, deploy na Vercel.

## Stack Tecnológico

- **Frontend:** React + Vite
- **Roteamento:** React Router DOM
- **Gráficos:** Recharts
- **Deploy:** Vercel
- **Backend:** jme-bot-backend (repo separado, Railway)

## Configuração

- `VITE_API_URL` → URL do backend Railway (definida no .env local e painel Vercel)
- `VITE_ADMIN_API_KEY` → Chave de autenticação para APIs

## Comunicação com Backend

- Todas as chamadas REST incluem header: `x-api-key`
- SSE em `/api/status-stream` para atualizações em tempo real do dashboard

## Páginas Disponíveis

| Página | Arquivo | Descrição |
|--------|---------|-----------|
| Dashboard | `dashboard.jsx` | Visão geral com métricas |
| Agendamentos | `agendamentos.jsx` | Gestão de agendamentos |
| Boas-vindas | `boasvindas.jsx` | Mensagens de boas-vindas |
| Cancelamentos | `cancelamentos.jsx` | Gestão de cancelamentos |
| Carne | `carne.jsx` | Gestão de carnês |
| Chamados | `chamados.jsx` | Gestão de chamados |
| Clientes | `clientes.jsx` | Gestão de clientes |
| **Cobrança** | `cobranca.jsx` | Disparo manual de cobranças |
| Estados | `estados.jsx` | Estados do sistema |
| Inadimplentes | `inadimplentes.jsx` | Gestão de inadimplentes |
| Logs | `logs.jsx` | Logs do sistema |
| Novos | `novos.jsx` | Gestão de novos clientes |
| Promessas | `promessas.jsx` | Gestão de promessas de pagamento |
| QR | `qr.jsx` | Conexão WhatsApp |
| SGP | `sgp.jsx` | Integração SGP |
| Backup | `BackupPage.jsx` | Gestão de backups |

## Alterações Recentes (2026-05-09)

### src/pages/cobranca.jsx
- Substituído `window.confirm` por modal de confirmação customizado
- Adicionado estado `modalConfirm` para controle do modal
- Função `disparar` dividida em `pedirConfirmacao` e `confirmarDisparo`
- Modal com design vermelho de alerta, exibindo data e tipo antes de confirmar disparo
- **Atualizado array `TIPOS_COBRANCA` para incluir 6 tipos:**
  - `""` - Automático (por data)
  - `"lembrete"` - Lembrete (D-1)
  - `"atraso"` - Atraso
  - `"atraso_final"` - Atraso Final
  - `"limite"` - Limite (suspensão hoje)
  - `"reconquista"` - Reconquista
  - `"reconquista_final"` - Reconquista Final
- **Modal de confirmação agora detecta `jaDisparado` e exibe aviso amarelo**
- **Função `confirmarDisparo` atualizada com parâmetro `forcando` e envio de `forcar` no body**

### src/pages/qr.jsx
- Adicionado botão "Resetar Sessão do WhatsApp" quando offline
- Nova função `resetarSessao` chamando `/api/whatsapp/resetar-sessao`
- Botão com estilo amarelo de aviso, com confirmação antes de executar

## Estrutura de Pastas

```
src/
├── api/           # Clientes API
├── components/    # Componentes reutilizáveis
├── constants/     # Constantes do sistema
├── contexts/      # Contextos React
├── hooks/         # Hooks customizados
├── pages/         # Páginas da aplicação
├── utils/         # Utilitários e formatadores
├── App.jsx        # Componente principal
├── index.css      # Estilos globais
└── main.jsx       # Entry point
```
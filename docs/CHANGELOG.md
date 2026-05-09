# CHANGELOG.md

Todas as alterações notáveis deste projeto serão documentadas neste arquivo.

## [2026-05-09]

### Adicionado
- Modal de confirmação customizado na página de cobranças (`src/pages/cobranca.jsx`)
  - Substituição de `window.confirm` por modal React
  - Design com borda vermelha e ícone de alerta
  - Exibe data de vencimento e tipo antes de confirmar
  - Botões "Cancelar" e "Confirmar Disparo" com estilos distintos

- Botão "Resetar Sessão do WhatsApp" na página QR (`src/pages/qr.jsx`)
  - Disponível apenas quando WhatsApp está offline
  - Chama endpoint `/api/whatsapp/resetar-sessao`
  - Estilo amarelo de aviso com ícone de lixeira
  - Confirmação via `confirm()` antes de executar

### Alterado
- `src/pages/cobranca.jsx`:
  - Estado `modalConfirm` adicionado para controle do modal
  - Função `disparar` refatorada em `pedirConfirmacao` e `confirmarDisparo`
  - `onClick` do botão alterado para `pedirConfirmacao`

- `src/pages/qr.jsx`:
  - Estado `resetando` adicionado para controle do botão de reset
  - Função `resetarSessao` adicionada para deletar sessão do WhatsApp

### Documentação
- Criada pasta `/docs` com documentação do projeto
  - `CURRENT_STATE.md` - Estado atual do projeto
  - `CHANGELOG.md` - Histórico de alterações
  - `API.md` - Documentação de APIs
  - `PENDING.md` - Tarefas pendentes
  - `AI_HANDOFF.md` - Guia para handoff entre sessões de IA

---

## [Versões anteriores]

Consulte o histórico de commits do Git para alterações anteriores.
# JME-BOT — Painel Admin

## O que é

Painel web administrativo para gerenciar um bot de WhatsApp de uma provedor de internet (ISP). O bot automatiza cobranças, atendimento a clientes, agendamentos de instalação e comunicações via WhatsApp.

## Repos

| Repo | Propósito | Deploy |
|------|-----------|--------|
| `jme-pwa` | Frontend React (este repo) | Vercel |
| `jme-back` | Backend Node.js + bot WhatsApp | Railway |

## Funcionalidades Principais

- **Conexão WhatsApp** — QR Code para conectar, desconectar, resetar sessão
- **Dashboard** — status do bot, métricas de atendimento, situação da rede
- **Clientes** — busca e visualização de clientes do ISP
- **Cobrança** — disparar cobranças via WhatsApp manualmente
- **Chamados** — gerenciar tickets de suporte
- **Promessas de pagamento** — controlar promessas de clientes
- **Inadimplentes** — lista de clientes em atraso
- **Agendamentos** — agenda de instalações técnicas
- **Boas-vindas** — mensagens automáticas para novos clientes
- **Logs** — histórico de ações do bot
- **Estados** — estados de atendimento dos clientes
- **SGP** — integração com sistema SGP

## Usuários

Administradores da JME NET (provedor de internet). Acesso único via API key.

## Objetivos Técnicos

- Bot WhatsApp sempre online e auto-reconectando
- Painel atualizado em tempo real (SSE)
- Zero downtime nas operações de cobrança automática

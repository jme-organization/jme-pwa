# CLAUDE.md — JME-BOT Frontend

## O que é este projeto
Painel admin React do JME-BOT. Backend em repo separado (jme-bot-backend) no Railway.

## Stack
React + Vite + React Router DOM + Recharts
Deploy: Vercel

## Configuração
VITE_API_URL → URL do backend Railway (definida no .env local e no painel da Vercel)

## Comunicação com o backend
- Todas as chamadas REST incluem header: x-api-key
- SSE em /api/status-stream para atualizações em tempo real do dashboard

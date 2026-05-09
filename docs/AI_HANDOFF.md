# AI_HANDOFF.md

Guia para handoff entre sessões de IA no desenvolvimento do JME-BOT Frontend.

## Contexto do Projeto

**Nome:** JME-BOT Frontend
**Tipo:** Painel admin React PWA
**Stack:** React + Vite + React Router DOM + Recharts
**Deploy:** Vercel
**Backend:** jme-bot-backend (repo separado, Railway)

## Estrutura do Projeto

```
jme-pwa/
├── src/
│   ├── api/           # Clientes API
│   ├── components/    # Componentes reutilizáveis (Card, Spinner, etc.)
│   ├── constants/     # Constantes do sistema
│   ├── contexts/      # Contextos React
│   ├── hooks/         # Hooks customizados (useFetch, etc.)
│   ├── pages/         # Páginas da aplicação
│   ├── utils/         # Utilitários e formatadores
│   ├── App.jsx        # Componente principal com rotas
│   ├── index.css      # Estilos globais
│   └── main.jsx       # Entry point
├── public/            # Arquivos estáticos
├── docs/              # Documentação do projeto
├── .env               # Variáveis de ambiente (não commitar)
├── .env.example       # Exemplo de variáveis de ambiente
├── package.json       # Dependências
├── vite.config.js     # Configuração do Vite
└── vercel.json        # Configuração de deploy na Vercel
```

## Padrões de Código

### Autenticação API
Todas as chamadas REST devem incluir o header `x-api-key`:

```javascript
const API = import.meta.env.VITE_API_URL || "";
const API_KEY = import.meta.env.VITE_ADMIN_API_KEY || "";
const authHeaders = () => API_KEY ? { "x-api-key": API_KEY } : {};
```

### Estrutura de Página
```javascript
// src/pages/nomePagina.jsx
import React, { useState } from 'react';
import { useFetch } from '../hooks/useFetch';
import { Card } from '../components/Card';

export function PageNomePagina() {
  const { data, loading, refetch } = useFetch("/api/endpoint");
  const [state, setState] = useState(null);

  return (
    <div className="page">
      <div className="page-title">Título da Página</div>
      {/* Conteúdo */}
    </div>
  );
}
```

### Modais de Confirmação
**NÃO usar `window.confirm()`**. Usar modais customizados:

```javascript
const [modalConfirm, setModalConfirm] = useState(null);

const pedirConfirmacao = () => {
  setModalConfirm({ /* dados */ });
};

const confirmarAcao = async () => {
  setModalConfirm(null);
  // executar ação
};

// No JSX:
{modalConfirm && (
  <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', ... }}>
    {/* Conteúdo do modal */}
  </div>
)}
```

## Convenções de Nomenclatura

- **Arquivos de página:** `nomePagina.jsx` (ex: `cobranca.jsx`, `qr.jsx`)
- **Componentes:** PascalCase (ex: `Card.jsx`, `Spinner.jsx`)
- **Hooks:** camelCase com prefixo `use` (ex: `useFetch.js`)
- **Funções:** camelCase (ex: `pedirConfirmacao`, `confirmarDisparo`)
- **Estados:** camelCase (ex: `modalConfirm`, `disparando`)

## Estilos

### Cores Principais
- Background escuro: `#0f1117`, `#1e293b`
- Texto claro: `#e2e8f0`
- Texto secundário: `#94a3b8`, `#64748b`
- Acento azul: `#38bdf8`, `#1d4ed8`
- Sucesso verde: `#22c55e`, `#4ade80`
- Erro vermelho: `#ef4444`, `#f87171`
- Aviso amarelo: `#fbbf24`

### Classes CSS
- `.page` - Container principal da página
- `.page-title` - Título da página
- `.tabela` - Tabela padrão
- `.tabela-scroll` - Container scrollável de tabela
- `.td-nome` - Célula de nome
- `.td-muted` - Célula com texto secundário
- `.td-empty` - Célula vazia

## APIs Importantes

### Cobranças
- `GET /api/cobrar/agenda` - Agenda de cobranças
- `POST /api/cobrar/manual` - Disparo manual
- `GET /api/logs/cobrancas?limit=20` - Logs de cobranças

### WhatsApp
- `POST /api/whatsapp/desconectar` - Desconectar
- `POST /api/whatsapp/resetar-sessao` - Resetar sessão
- `GET /qr` - QR Code

### Status
- `GET /api/status-stream` - SSE para atualizações em tempo real

## Checklist para Nova Funcionalidade

- [ ] Criar arquivo de página em `src/pages/`
- [ ] Adicionar rota em `App.jsx`
- [ ] Implementar loading states
- [ ] Adicionar tratamento de erros
- [ ] Usar modal customizado para confirmações
- [ ] Testar em diferentes tamanhos de tela
- [ ] Atualizar documentação em `/docs`

## Comandos Úteis

```bash
# Instalar dependências
npm install

# Iniciar servidor de desenvolvimento
npm run dev

# Build para produção
npm run build

# Preview do build
npm run preview

# Lint
npm run lint
```

## Variáveis de Ambiente

```env
VITE_API_URL=https://backend-url.railway.app
VITE_ADMIN_API_KEY=sua-chave-aqui
```

## Deploy

O projeto é deployado automaticamente na Vercel via Git. Configurações em `vercel.json`.

## Documentação

- `docs/CURRENT_STATE.md` - Estado atual do projeto
- `docs/CHANGELOG.md` - Histórico de alterações
- `docs/API.md` - Documentação de APIs
- `docs/PENDING.md` - Tarefas pendentes
- `CLAUDE.md` - Instruções para Claude Code

## Notas Importantes

1. **Backend separado:** O backend está em outro repositório (`jme-bot-backend`)
2. **Autenticação:** Sempre incluir `x-api-key` nas requisições
3. **Modais:** Nunca usar `window.confirm()` ou `alert()`
4. **Estilos:** Preferir estilos inline para componentes simples
5. **Responsividade:** Testar em mobile e desktop

## Handoff Rápido

Ao iniciar uma nova sessão, informe:

1. Qual funcionalidade está sendo desenvolvida
2. Quais arquivos foram modificados recentemente
3. Se há algum bug ou erro em andamento
4. Se há dependências do backend que precisam ser consideradas

Exemplo:
> "Estou trabalhando na página de cobranças. Modifiquei `src/pages/cobranca.jsx` para substituir o window.confirm por um modal customizado. O endpoint `/api/cobrar/manual` está funcionando corretamente."
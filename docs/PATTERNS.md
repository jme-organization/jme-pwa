# PATTERNS.md

Padrões e convenções utilizados no desenvolvimento do JME-BOT Frontend.

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

const confirmarAcao = async (parametro = false) => {
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

### Tratamento de Respostas com jaDisparado
Quando o backend retorna que um disparo já foi realizado:

```javascript
const confirmarDisparo = async (forcando = false) => {
  // ...
  const json = await r.json();
  if (json.ok) {
    // Sucesso
  } else if (json.jaDisparado) {
    setModalConfirm({ data, tipo, jaDisparado: true, aviso: json.aviso });
  } else {
    // Erro
  }
};

// No modal:
{modalConfirm?.jaDisparado && (
  <div style={{ background: 'rgba(251,191,36,.1)', ... }}>
    ⚠️ {modalConfirm.aviso}<br/>
    <strong>Deseja disparar novamente mesmo assim?</strong>
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

### Estilos Inline
Para componentes simples e modais, preferir estilos inline:

```javascript
<div style={{
  position: 'fixed',
  inset: 0,
  background: 'rgba(0,0,0,0.7)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 1000
}}>
```

## Padrões de Estado

### Estados de Loading
```javascript
const [loading, setLoading] = useState(false);
const [disparando, setDisparando] = useState(false);
const [resetando, setResetando] = useState(false);
```

### Estados de Modal
```javascript
const [modalConfirm, setModalConfirm] = useState(null);
// modalConfirm pode ser null ou um objeto com dados
```

### Estados de Resultado
```javascript
const [resultado, setResultado] = useState(null);
// resultado pode ser null ou { ok: boolean, mensagem: string }
```

## Padrões de Requisição

### Requisição POST Padrão
```javascript
const r = await fetch(API + "/api/endpoint", {
  method: "POST",
  headers: { "Content-Type": "application/json", ...authHeaders() },
  body: JSON.stringify({ /* dados */ }),
});
const json = await r.json();
```

### Tratamento de Erros
```javascript
try {
  const r = await fetch(API + "/api/endpoint", { /* ... */ });
  const json = await r.json();
  if (json.ok) {
    // Sucesso
  } else {
    setResultado({ ok: false, mensagem: json.erro || "Erro desconhecido" });
  }
} catch (e) {
  setResultado({ ok: false, mensagem: "Falha de conexão com o servidor" });
}
```

## Padrões de UI

### Botão com Loading State
```javascript
<button
  onClick={handleClick}
  disabled={loading}
  style={{
    background: loading ? "#1e3a5f" : "linear-gradient(135deg, #1d4ed8, #2563eb)",
    color: loading ? "#64748b" : "#fff",
    cursor: loading ? "not-allowed" : "pointer",
    // ...
  }}
>
  {loading ? "⏳ Processando..." : "📤 Ação"}
</button>
```

### Card Padrão
```javascript
<Card style={{ padding: "1.5rem" }}>
  <div style={{ fontWeight: 700, color: "#e2e8f0", marginBottom: "1.2rem", fontSize: 15 }}>
    📋 Título
  </div>
  {/* Conteúdo */}
</Card>
```

### Select Padrão
```javascript
<select
  value={value}
  onChange={(e) => setValue(e.target.value)}
  style={{
    width: "100%",
    padding: "10px 12px",
    borderRadius: 8,
    border: "1px solid #1e3a5f",
    background: "#0d1a2e",
    color: "#e2e8f0",
    fontSize: 13,
    cursor: "pointer"
  }}
>
  {options.map(opt => (
    <option key={opt.value} value={opt.value}>{opt.label}</option>
  ))}
</select>
```

## Padrões de Arrays de Opções

### Array de Opções para Select
```javascript
const OPCOES = [
  { value: "", label: "🔄 Automático" },
  { value: "opcao1", label: "🔔 Opção 1" },
  { value: "opcao2", label: "⏰ Opção 2" },
];
```

## Notas Importantes

1. **Backend separado:** O backend está em outro repositório (`jme-bot-backend`)
2. **Autenticação:** Sempre incluir `x-api-key` nas requisições
3. **Modais:** Nunca usar `window.confirm()` ou `alert()`
4. **Estilos:** Preferir estilos inline para componentes simples
5. **Responsividade:** Testar em mobile e desktop
6. **Tipos de cobrança:** Manter sincronizado com backend
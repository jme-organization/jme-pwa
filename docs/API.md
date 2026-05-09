# API.md

Documentação das APIs utilizadas pelo frontend JME-BOT.

## Autenticação

Todas as requisições REST devem incluir o header:

```
x-api-key: <VITE_ADMIN_API_KEY>
```

## Endpoints

### Cobranças

#### GET /api/cobrar/agenda
Busca a agenda de cobranças do mês atual.

**Resposta:**
```json
{
  "diaAtual": 9,
  "pendencia": {
    "dia": 8,
    "mes": 5,
    "motivoBloqueio": "manutencao",
    "entradas": [
      { "data": "08", "tipo": "lembrete" }
    ]
  },
  "agenda": {
    "10": [
      { "data": "10", "tipo": "lembrete" },
      { "data": "10", "tipo": "atraso" }
    ],
    "20": [
      { "data": "20", "tipo": "lembrete" }
    ]
  }
}
```

#### POST /api/cobrar/manual
Dispara cobranças manualmente.

**Headers:**
- `Content-Type: application/json`
- `x-api-key: <VITE_ADMIN_API_KEY>`

**Body:**
```json
{
  "data": "10",
  "tipo": "lembrete",
  "forcar": false
}
```

**Parâmetros:**
- `data` (string): Dia do vencimento (ex: "10", "20", "30")
- `tipo` (string, opcional): Tipo de cobrança. Valores:
  - `"lembrete"` - Lembrete (D-1)
  - `"atraso"` - Atraso
  - `"atraso_final"` - Atraso Final
  - `"limite"` - Limite (suspensão hoje)
  - `"reconquista"` - Reconquista
  - `"reconquista_final"` - Reconquista Final
  - `undefined` ou omitido - Automático (por data)
- `forcar` (boolean, opcional): Forçar disparo mesmo que já tenha sido realizado

**Resposta (Sucesso):**
```json
{
  "ok": true
}
```

**Resposta (Já Disparado):**
```json
{
  "ok": false,
  "jaDisparado": true,
  "aviso": "Cobrança do dia 10 já foi disparada hoje às 10:30"
}
```

**Resposta (Erro):**
```json
{
  "ok": false,
  "erro": "Mensagem de erro"
}
```

#### GET /api/logs/cobrancas?limit=20
Busca logs das últimas cobranças enviadas.

**Query Params:**
- `limit` (opcional): Número máximo de registros (padrão: 20)

**Resposta:**
```json
[
  {
    "nome": "João Silva",
    "data_vencimento": "10",
    "enviado_em": "2026-05-09T10:30:00Z"
  }
]
```

### WhatsApp

#### POST /api/whatsapp/desconectar
Desconecta a sessão do WhatsApp.

**Headers:**
- `Content-Type: application/json`
- `x-api-key: <VITE_ADMIN_API_KEY>`

**Resposta:**
```json
{
  "ok": true
}
```

#### POST /api/whatsapp/resetar-sessao
Deleta a sessão salva do WhatsApp e força geração de novo QR Code.

**Headers:**
- `Content-Type: application/json`
- `x-api-key: <VITE_ADMIN_API_KEY>`

**Resposta:**
```json
{
  "ok": true
}
```

#### GET /qr
Retorna o QR Code para conexão do WhatsApp.

**Query Params:**
- `t` (opcional): Timestamp para evitar cache

**Resposta:**
- Imagem PNG do QR Code

### Status Stream

#### GET /api/status-stream
Stream SSE (Server-Sent Events) para atualizações em tempo real do dashboard.

**Eventos:**
```json
{
  "online": true,
  "iniciadoEm": "2026-05-09T08:00:00Z"
}
```

## Tipos de Cobrança

| Tipo | Descrição | Timing |
|------|-----------|--------|
| `lembrete` | Lembrete | D-1 |
| `atraso` | Atraso | D+3 |
| `atraso_final` | Atraso Final | D+5 |
| `limite` | Limite (suspensão hoje) | D+? |
| `reconquista` | Reconquista | D+7 |
| `reconquista_final` | Reconquista Final | D+10 |

## Erros Comuns

| Código | Descrição |
|--------|-----------|
| `401` | API Key inválida ou ausente |
| `500` | Erro interno do servidor |
| `503` | Serviço indisponível (manutenção) |

## Notas

- Todas as datas estão em UTC
- O backend está hospedado no Railway
- As mensagens de cobrança são salvas no banco e enviadas em background pelo WhatsApp
- O QR Code atualiza automaticamente a cada 20 segundos quando offline
- Disparos já realizados retornam `jaDisparado: true` com aviso, permitindo forçar novo disparo
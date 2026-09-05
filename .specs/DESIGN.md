# DESIGN — jme-pwa (painel admin JME.NET)

Escrito em 05/09/2026, extraindo do código o que já estava decidido (`src/index.css` e os
componentes) e fechando com o dono o que faltava. Painel interno, usado no desktop do escritório
e no celular do dono em rua — a tela precisa ser lida em movimento, não admirada.

## Paleta — os tokens que já existem

Estão em `src/index.css` (`:root`), com tema claro por `[data-theme="light"]`. **Cor nova não
nasce em arquivo de tela**: entra aqui e vira token.

| Token | Valor | Onde vive |
|---|---|---|
| `--bg-primary` | `#0a0e1a` | fundo da página |
| `--bg-secondary` | `#0f1117` | fundo de tabela e de área dentro do card |
| `--bg-card` | `#1a1d2e` | card, cabeçalho de tabela, KPI |
| `--border` | `#2d3148` | toda borda e divisória |
| `--text-primary` | `#e2e8f0` | texto que precisa ser lido |
| `--text-secondary` | `#94a3b8` | apoio, rótulo de coluna |
| `--text-muted` | `#64748b` | metadado, data, "nenhum resultado" |
| `--green` | `#22c55e` | pago, sucesso, confirmação |
| `--amber` | `#f59e0b` | pendente, atenção |
| `--red` | `#ef4444` | inadimplente, falha, cancelamento |
| `--blue` | `#38bdf8` | ação, link, navegação |
| `--purple` | `#a78bfa` | promessa |
| `--orange` | `#fb923c` | **bloqueado** e divergência com o SGP — o "nem lá, nem cá" |

Azul `#2563eb` aparece como fundo de botão/aba ativa e ainda não é token; quem mexer em botão
promove pra `--blue-solid` antes de usar de novo.

**Significado fixo da cor** — não reaproveitar por estética: verde é dinheiro que entrou, âmbar é
esperando, vermelho é perdido ou quebrado, roxo é promessa, laranja é suspenso/divergente, azul é
"clique aqui".

## Tipografia

Pilha do sistema (painel interno; é a regra da casa e já é o que o `body` usa). Sem fonte
importada — o painel abre em rede ruim de provedor.

**Piso de legibilidade — vale para tela nova e para tudo que for reescrito** (decisão do dono em
05/09/2026: o painel antigo não é migrado de uma vez, migra quando cada tela for mexida):

- Corpo **≥ 15px**; texto de apoio **≥ 11px**.
- Peso **≥ 600** em título e em botão. 300 e 400 não entram.
- `letter-spacing` negativo no máximo `-0.5px`, e só acima de 24px.
- Contraste do texto principal **≥ 4.5:1** — `--text-muted` sobre `--bg-card` só para metadado,
  nunca para informação que precisa ser lida.
- `line-height` 1.4 no corpo.

Escala em uso: `1.5rem/800` no título de página (`.page-title`), `15px/600` no corpo novo,
`13px/600` em rótulo de coluna, `11px/600` em badge e metadado.

## Componentes que já existem — usar, não reinventar

- `.card` — fundo `--bg-card`, raio 12px, borda `--border`.
- `.badge` + `.badge-<estado>` — pago, pendente, promessa, bloqueado, cancelado, inadimplente,
  vencida. Estado novo entra como classe aqui, com cor do token.
- `.spinner` / `.spinner-wrap` — carregando.
- `Card`, `Spinner`, `BadgeCliente`, `Pagination` em `src/components/`.

## Estado de componente

- **Carregando:** `<Spinner/>` no lugar do conteúdo. Nunca skeleton falso.
- **Vazio:** emoji grande, uma frase que diz o que fazer, tom neutro — o painel tem 70 clientes,
  vazio é normal e não é erro. Padrão que já existe na página "Baixas SGP": `✅` + "Tudo em dia!".
- **Erro:** frase curta em `--red` com o que falhou, e o botão que refaz a ação. Nada de stack.
- **Ação destrutiva** (bloquear, cancelar, apagar): confirmação antes, e cor da consequência —
  laranja para reversível, vermelho para definitivo.

## Movimento

Quase nenhum, de propósito: só o `spin` do spinner e transições de até 150ms em hover. Painel
operacional não é vitrine; animação aqui atrasa quem está conferindo pagamento.

## Regra que dói (vem do `CONVENTIONS.md`)

**Cor e px fixo em `style={{}}` são proibidos** — o projeto tem 668 desses e é por isso que a tela
não tem cara própria. Valor fixo vai para classe no `index.css`; `style={{}}` só para valor
calculado em tempo de execução (largura proporcional, posição).

Dívida conhecida: a lista de bloqueados entregue em 05/09/2026 dentro de `VisualizadorBase.jsx`
usa estilo inline com hex e entrou num arquivo de 706 linhas — está fora deste documento e da
convenção, e deve ser migrada quando aquela tela for quebrada em componentes.

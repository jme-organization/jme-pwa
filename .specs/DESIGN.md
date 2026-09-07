# DESIGN — jme-pwa (painel admin JME.NET)

Escrito em 05/09/2026 extraindo do código o que já estava decidido, e **reescrito em
06/09/2026** junto com a reestruturação do front (sidebar + sistema de classes). Painel
interno, usado no desktop do escritório e no celular do dono na rua — a tela precisa ser
lida em movimento, não admirada.

## O que mudou em 06/09/2026 (e por quê)

A paleta **não mudou**: os mesmos tokens de cor de antes, com o mesmo significado. O que
mudou foi a composição e o vocabulário de classe:

- **Navegação saiu do topo e virou sidebar fixa à esquerda**, com as 14 telas agrupadas
  por assunto (Operação, Cobrança, Cadastro, Sistema). A barra horizontal escondia metade
  das telas atrás de um menu "Mais" e, no celular, montava `<NavLink to={undefined}>`.
- **Toda cor/px que morava em `style={{}}` virou classe** — eram 668 ocorrências, hoje são
  24, todas de valor calculado em tempo de execução (largura de barra) ou de layout local.
- **Ícone de navegação passou a ser `react-icons/fi`** (dependência que já existia) em vez
  de emoji. Emoji continua carregando **significado de estado** (✅ pago, 🚫 bloqueado):
  é vocabulário do domínio, não decoração.

## Paleta — os tokens

Bloco único em `src/index.css` (`:root`), com tema claro em `[data-theme="light"]` — o
atributo agora vive no `<html>`, não no `<body>`, porque os gráficos leem o token com
`getComputedStyle(documentElement)` (`src/hooks/useCorTokens.js`). **Cor nova não nasce em
arquivo de tela**: entra aqui e vira token.

| Token | Escuro | Onde vive |
|---|---|---|
| `--bg-primary` | `#0a0e1a` | fundo da página |
| `--bg-secondary` | `#0f1117` | sidebar, cabeçalho de tabela, área dentro do card |
| `--bg-card` | `#1a1d2e` | card, KPI |
| `--bg-hover` | branco 6% | hover de linha, de item de menu, de botão neutro |
| `--bg-ativo` | azul 12% | item de menu ativo |
| `--border` / `--border-forte` | `#2d3148` / `#3d4260` | divisória / borda em hover |
| `--text-primary` | `#e2e8f0` | texto que precisa ser lido |
| `--text-secondary` | `#94a3b8` | apoio, rótulo de coluna |
| `--text-muted` | `#64748b` | metadado, data, "nenhum resultado" |
| `--green` | `#22c55e` | pago, sucesso |
| `--amber` | `#f59e0b` | pendente, atenção |
| `--red` | `#ef4444` | inadimplente, falha, cancelamento |
| `--blue` | `#38bdf8` | ação, link, navegação |
| `--purple` | `#a78bfa` | promessa |
| `--orange` | `#fb923c` | **bloqueado** e divergência com o SGP |
| `--cyan` | `#22d3ee` | isento (mês de instalação) |
| `--blue-solid` | `#2563eb` | fundo sólido de botão/aba ativa (era hex solto em 11 arquivos) |

Cada estado também tem par `--<cor>-bg` e `--<cor>-bd` (fundo e borda derivados) — é o que
badge, botão colorido e caixa de aviso usam, para nunca inventar um `rgba()` novo na tela.

**Significado fixo da cor** — não reaproveitar por estética: verde é dinheiro que entrou,
âmbar é esperando, vermelho é perdido ou quebrado, roxo é promessa, laranja é
suspenso/divergente, ciano é isento, azul é "clique aqui".

**Tema claro não é o escuro com filtro:** os tons de estado são versões escurecidas
(`--green: #15803d`, `--red: #b91c1c`) porque o verde e o vermelho do escuro não passam de
4.5:1 sobre branco.

## Tipografia

Pilha do sistema (painel interno; é a regra da casa). Sem fonte importada — o painel abre
em rede ruim de provedor.

**Piso de legibilidade — vale para tudo:**

- Corpo **≥ 15px** (o `body` é 15px, a tabela também); texto de apoio **≥ 11px**.
- Peso **≥ 600** em título e em botão. 300 e 400 não entram.
- `letter-spacing` negativo no máximo `-0.5px`, e só acima de 24px (só o `.page-title` usa).
- Contraste do texto principal **≥ 4.5:1**.
- `line-height` 1.4 no corpo.

Escala em uso: `1.6rem/800` no título de página, `28px/800` no valor de KPI, `17px/800` no
nome de base, `15px/600-700` no corpo e na linha de tabela, `13px/700` em rótulo de coluna,
`12px/700` em rótulo de KPI e de campo, `11px/700` em badge e em título de grupo do menu.

## Vocabulário de classe — usar, não reinventar

O `index.css` é dividido em seções numeradas. O que existe:

- **Shell:** `.shell` / `.sidebar` / `.topbar` / `.conteudo`, com `.shell--recolhida`
  (menu só de ícone) e `.shell--gaveta` (drawer aberto no celular).
- **Página:** `.page` (+`.page-larga`), `.page-topo`, `.page-title`, `.page-sub`, `.page-acoes`.
- **Card:** `.card`, `.card-pad`, `.card-cab`, `.card-titulo`, `.secao-rotulo`.
- **Botão:** `.btn` + variante de consequência — `.btn-primario`, `.btn-ok`, `.btn-alerta`,
  `.btn-perigo`, `.btn-suspende` (laranja, para bloquear), `.btn-info`, `.btn-roxo`,
  `.btn-fantasma`; modificadores `.btn-pequeno` e `.btn-bloco`.
- **Filtro e aba:** `.filtro-group`/`.filtro-btn`/`.filtro-ativo`; `.abas`/`.aba`/`.aba-ativa`.
- **Formulário:** `.campo`, `.rotulo`, `.entrada` (input, select e textarea), `.dica`,
  `.opcoes`/`.opcao`/`.opcao-ativa`, `.marcavel` (checkbox com rótulo).
- **Tabela:** `.tabela` com `.td-nome`, `.td-mono`, `.td-muted`, `.td-centro`, `.td-fim`,
  `.td-corta`, `.td-empty`, `.linha-clicavel`.
- **Badge:** `.badge` + `.badge-<estado>` (pago, pendente, promessa, vencida, inadimplente,
  cancelado, bloqueado, isento, info, neutro).
- **KPI:** `.kpis`/`.kpi`/`.kpi-val`/`.kpi-label` + `.val-ok|alerta|erro|promessa|bloqueio|info`.
- **Estado da tela:** `.vazio` (+`.vazio-emoji`, `.vazio-dica`), `.aviso` (+`-ok`, `-alerta`,
  `-erro`, `-info`), `.spinner`.
- **Espaçamento:** `.mt-1..4` / `.mb-1..4` (6, 10, 14, 20px) e `.mt-0`. Margem nova usa a
  escala; não volta a virar `style={{ marginTop: 13 }}`.
- **Mídia no balão (06/09/2026):** `.balao-midia` (envelope clicável), `.balao-img`
  (imagem recebida) e `.balao-audio` (player). A imagem tem **teto de 320px de altura**
  porque o balão vive numa coluna rolável — foto de celular em pé empurraria a conversa
  inteira pra fora da tela, e o dono perderia o fio da leitura. O áudio ocupa a largura
  do balão: o player nativo encolhe sozinho até o botão de play ficar difícil de acertar
  no celular, que é justamente onde esta tela é usada na rua. Enquanto o arquivo carrega,
  falha ou expira, o balão volta pra `.balao-anexo` — a etiqueta de texto que já existia.

## Estado de componente

- **Carregando:** `<Spinner/>` no lugar do conteúdo. Nunca skeleton falso.
- **Vazio:** emoji grande, uma frase do que aconteceu e uma linha do que fazer. O painel tem
  70 clientes: vazio é normal, não é erro.
- **Erro:** `.aviso-erro` com frase curta e o botão que refaz a ação. Nada de stack.
- **Ação destrutiva:** confirmação antes, e cor da consequência — **laranja para reversível**
  (bloquear), **vermelho para definitivo** (cancelar, excluir).

## Movimento

Quase nenhum, de propósito: o `spin` do spinner, transições de 150ms em hover/tema, e o
deslize da sidebar. `prefers-reduced-motion` zera tudo. Painel operacional não é vitrine.

## Responsivo

- **> 1024px:** sidebar fixa (244px), recolhível para 68px (só ícone, com `title`). A
  preferência fica no `localStorage` (`jme_menu_recolhido`).
- **≤ 1024px:** sidebar vira gaveta com véu; hambúrguer aparece na topbar; a gaveta sempre
  abre por extenso, mesmo com o menu recolhido no desktop.
- **≤ 760px:** KPIs em 2 colunas, título 1.35rem, tabela com padding menor (e sempre dentro
  de `.tabela-scroll`).
- **≤ 620px:** as duas janelas de horário saem da topbar (são configuração, não operação de
  rua) para a busca caber. O estado do bot fica, como ponto colorido.

## O que ficou de fora, de propósito

- **Tela "Ao Vivo" (`/estados`)** — era um texto fixo dizendo que o atendimento automático
  não existe mais. Zero informação; a rota redireciona para o dashboard.
- **Botão e página de Backup** — abriam um modal explicando que o backup do Firebase é
  automático e ofereciam um link para o console. Nada acionável no painel, e o `fetch` de
  `/api/admin/backup-info` ia sem token. O caminho continua sendo o console do Firebase.

# STATE — jme-pwa (painel admin da JME.NET)

> Metade da frente do JME.NET. A API é `../jme-back` (repo separado).
> Mapa do código e concerns em `.specs/codebase/`; estado longo em `.specs/project/STATE.md`.

## Onde parei

Sessão de 06/09/2026 — **reestruturação do front inteiro** (commit `21eb94f`, ainda **sem
push**: o dono precisa autorizar o deploy na Vercel).

### O que mudou

| Tema | O que ficou |
|---|---|
| Navegação | Sidebar fixa à esquerda, 14 telas em 4 grupos (Operação, Cobrança, Cadastro, Sistema), recolhível no desktop (estado no `localStorage`) e gaveta com véu no celular. `TopNav.jsx` (687 linhas) apagada; nasceram `Sidebar.jsx` e `Topbar.jsx` |
| Topbar | Só o que é global: busca de cliente, janelas de cobrança e atendimento (agora no clique, não no hover), estado do bot, sino, tema, sair |
| Estilo | 668 `style={{}}` → 24 (só valor calculado). Tokens em bloco único, tema claro com tons próprios, escala de espaçamento em classe |
| Telas mortas | `/estados` ("Ao Vivo"), botão e página de Backup, `ModalNovaPromessa`, `StatusBadge`, `constants/index.js` |
| Specs | `.specs/DESIGN.md` e `.specs/codebase/CONVENTIONS.md` reescritos |

### Bugs achados e corrigidos no caminho

- `withTimeout` do `api` nunca passava o `signal` ao `fetch` — o timeout não abortava nada
- Duas conexões SSE por aba; o servidor corta em 3 por IP, então 2 abas davam 429
- Sino/menu assinavam um evento SSE (`alertas`) que o backend nunca emite: contagem congelava
- Tela de clientes: "← Bases" não voltava e `setState` durante o render; `?cliente=` ignorado
- Registros: `Invalid Date` em toda linha do `dbLog` (Timestamp do Firestore) e filtro de tipo inerte
- Menus de horário usavam classes (`.h-row`, `.h-input`…) que não existiam no CSS
- `<style jsx>` (sintaxe do Next) em `Pagination` e `NotificationBell`
- Dashboard com grid de 3 colunas fixas e `onAtualizar` indefinido no `PainelRede`
- Ficha do cliente: dois campos de promessa escrevendo no mesmo estado

### Como foi conferido

`npm run build` passa (bundle 723 kB), `npm run lint` com 0 erros (18 avisos pré-existentes
de `catch (_)`), e o painel foi aberto no navegador: login, dashboard escuro, dashboard
claro, celular 390px e gaveta aberta. **Não foi testado contra a API de produção** — a
conferência foi com o backend fora do ar.

## Próximo passo

1. **Autorizar o push** (`gh auth switch --user Everson9` e `git push`) — a Vercel publica
   no push. O backend não mudou, então a ordem não importa.
2. Rodar o painel contra a API de verdade e olhar as telas com dado real: tabela da base,
   ficha do cliente (abas), integração SGP e registros.
3. `VisualizadorBase.jsx` (417) e `ModalEditarCliente.jsx` (543) ainda passam do piso de 400
   linhas — quebrar antes da próxima funcionalidade, começando pelas abas do modal.

## Decisões
- SSE (não WebSocket) para atualização do painel: fluxo é só backend→frontend.
- Sem framework CSS: sistema de classes próprio no `index.css`.
- Ícone de navegação é `react-icons/fi`; emoji fica para significado de estado.
- Detalhe das decisões antigas: `.specs/project/STATE.md`.

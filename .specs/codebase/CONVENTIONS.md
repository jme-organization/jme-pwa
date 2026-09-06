# CONVENTIONS — jme-pwa

Escrito em 2026-09-05 a partir de **medição neste código** e atualizado em 2026-09-06,
depois da reestruturação do front. Cada regra existe porque o problema (ou o acerto)
foi encontrado aqui.

Stack: React 18 · Vite · React Router · Recharts · react-icons. Sem Tailwind, sem CSS-in-JS.

## O que já está certo — não "consertar"

- **Higiene de hook.** Zero `useEffect` sem array de dependência; zero timer, listener ou
  subscription sem cleanup. Não gastar sessão "corrigindo hooks" aqui.
- **`api` centralizado** (`src/api/client.js`): token no `Authorization`, 401 derruba pra
  tela de login por evento (`jme:sessao-expirada`). Nenhuma tela chama `fetch` crua para a
  API — a única exceção é o `/api/status`, que é público e não toca o Firestore.
- **Uma conexão SSE por aba** (`src/hooks/useSSEData.js`). O servidor corta em 3 conexões
  por IP; abrir uma segunda EventSource "só para o status" fazia duas abas darem 429.

## Estilo — a regra que dói

O sistema de cor mora em `src/index.css`, em **bloco único** de tokens (`:root` +
`[data-theme="light"]`).

- **Cor em `style={{}}` é proibida.** Usa `var(--token)` ou classe.
- **Espaçamento e tamanho fixos vão pro CSS**; há escala pronta (`.mt-1..4`, `.mb-1..4`).
- `style={{}}` só para valor **calculado em tempo de execução**: largura de barra de
  progresso, cor de fatia de gráfico lida do token. Hoje sobram 24 ocorrências, todas
  desse tipo ou de layout local (`flex`, `minWidth`) — eram 668 em 05/09/2026.
- **Recharts não aceita classe**: quem precisa de valor de cor usa `useCorTokens()`
  (`src/hooks/useCorTokens.js`), que lê o token do tema em vigor. Nunca hex no JSX.
- **`<style jsx>` não existe aqui.** É sintaxe do Next; o Vite não processa, e o resultado
  era um `<style jsx="true">` cru no DOM. Estava em `Pagination` e `NotificationBell` — CSS
  novo vai para o `index.css`.
- **Classe nova segue o vocabulário do `.specs/DESIGN.md`.** Se o que a tela precisa não
  existe lá, a emenda entra no DESIGN.md primeiro, com o motivo.

## Tamanho de arquivo

Componente acima de **400 linhas** não recebe funcionalidade nova sem ser quebrado antes.
Não é regra estética: é onde a revisão para de achar bug.

| Arquivo | Antes (05/09) | Agora |
|---|---|---|
| `ModalEditarCliente.jsx` | 857 | 545 |
| `VisualizadorBase.jsx` | 706 | 421 |
| `TopNav.jsx` | 687 | apagado (virou `Sidebar` 118 + `Topbar` 232) |
| `BackupButton.jsx` | 424 | apagado |

`VisualizadorBase` e `ModalEditarCliente` continuam acima do piso: **quem for mexer neles de
novo quebra primeiro**, começando pelas abas do modal (cada aba é um componente).

## URL é a fonte da verdade da navegação

Estado de tela que também aparece na URL (`?base=`, `?cliente=`, `?acao=nova`) é **derivado
da URL**, nunca guardado em `useState` em paralelo. Foi o que causou dois bugs na tela de
clientes: o "← Bases" não voltava, e um `setState` era chamado durante o render.

## Nunca

- Cor ou px fixo dentro de `style={{}}`.
- `<style jsx>`.
- Acrescentar tela nova em componente que já passou de 400 linhas.
- Declarar variável CSS nova fora do bloco de tokens.
- Reescrever hook que já tem dependência e cleanup corretos "pra padronizar".
- Duplicar em JS uma lista que o backend já define (tipos de cobrança, status) sem
  necessidade — se divergir, o painel mente sobre o que o bot faz.

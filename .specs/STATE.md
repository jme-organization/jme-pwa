# STATE — jme-pwa (painel admin da JME.NET)

> Metade da frente do JME.NET. A API é `../jme-back` (repo separado).
> Mapa do código e concerns em `.specs/codebase/`; estado longo em `.specs/project/STATE.md`.

## Onde parei

**07/09/2026 (noite) — tela nova `/onus`, publicada (`f5ef1dc`), mas ainda não vista renderizada.**

A fibra dos clientes entrou no painel: as 414 ONUs da OLT com sinal óptico, PON, modo e o cliente
casado pelo login PPPoE, mais os botões de reiniciar e desautorizar. Fica em **Operação → ONUs**.

Arquivos: `src/pages/onus.jsx` (orquestra) e `src/components/fttx/` — `TabelaOnus`, `PainelOnu`,
`NaoAutorizadas`, `Jobs` e `sinal.jsx`. Nenhum passa de 400 linhas, como manda o CONVENTIONS.

### O que precisa ser conferido a olho (pendência aberta)

O `agent-browser` não subiu nesta máquina — nem `doctor --offline --quick` respondeu. O bundle
publicado **contém** o código novo (conferido buscando `Procurar ONU nova` e `sinal-critico` no
JS servido pelo Vercel), mas ninguém viu a tela desenhada. Olhar:

- a tabela com as 414 linhas e a busca por nome/login/serial/PON;
- a coluna de sinal colorida (verde acima de −25 dBm, âmbar até −28, vermelho abaixo);
- o badge "login em 2 ONUs" nas quatro linhas de `josefadasilva` e `martins`;
- o aviso de escrita desligada dentro do card da ONU escolhida;
- e o vazio de "Procurar ONU nova", que hoje é o estado real (nenhuma ONU esperando).

### Vocabulário novo no DESIGN.md (entrou antes do código, como manda a casa)

Duas seções: **sinal óptico** (`.sinal-ok/-atencao/-critico/-sem`, faixas de referência de GPON)
e **estado do cliente na linha da ONU**. O motivo de não reaproveitar `.badge-pago` para "sinal
bom" está escrito lá: verde é dinheiro que entrou, e sinal não é dinheiro. Também entrou
`.linha-ativa`, porque a tabela tem 414 linhas e o painel de ação fica acima dela.

### O que a tela deliberadamente NÃO faz

**Autorizar ONU.** O SGP responde 403 na rota que lista os tipos de ONU, e sem esse id a
autorização não monta. A tela **diz isso** na janela de não autorizadas em vez de esconder o
botão e deixar o dono procurando.

### Depende do backend

A escrita só funciona com `FTTX_ESCRITA_HABILITADA=true` no `jme-back`, que nasce desligada. Com
ela desligada a tela mostra o aviso e esconde os botões — é o estado de hoje, e é o certo até a
sessão de teste com o dono.

---

## Sessão anterior



Sessão de 06/09/2026, segunda parte — **duas telas novas** (commit `fafd032`):

- **`/conversas` — Atendimentos.** A caixa de entrada do WhatsApp: lista de conversas com
  contador de não lidas, thread em balões e resposta manual. Da conversa dá pra abrir a
  ficha, virar chamado ou marcar resolvida. A tela diz na cara que nada é respondido
  automaticamente, porque essa é a regra do projeto.
- **`/carne` — duas abas.** "Renovação" mostra quem está ficando sem boleto; "Conferir e
  gerar" SIMULA primeiro e mostra as competências que seriam criadas, e só então oferece
  gerar de verdade, avisando que aquilo escreve no financeiro do SGP. O interruptor do
  automático exige confirmação para ligar.
- **Boas-vindas** ganhou "mandar o carnê completo" (ligado por padrão), e o aviso diz
  quando a segunda mensagem falha.
- Corrigido no teste de mesa: a pílula de horário virava "undefinedh–undefinedh" quando a
  rota respondia algo inesperado.

Depende do backend `e0f2cdd` (jme-back), que **ainda não foi publicado na VPS** — até lá as
telas novas mostram aviso em vez de quebrar.

### Primeira parte da mesma sessão: reestruturação do front inteiro, revisada pelo Codex e
**publicada**: commits `21eb94f` (refactor), `66abb5f` (STATE) e `1fb5f2b` (correção vinda
da revisão) empurrados para o `main` — a Vercel publica no push.

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

### Revisão cruzada (Codex, gpt-5.6)

Achou **uma** regressão real, corrigida em `1fb5f2b`: o guarda de "já abri essa ficha" em
`VisualizadorBase` era booleano, então a SEGUNDA busca global feita sem sair da base mudava
a URL e não abria ninguém. Agora o guarda anota qual cliente foi aberto, e fechar a ficha
tira o `?cliente=` da URL. O Codex procurou e **não** achou: vazamento no singleton SSE,
cleanup ausente, loop de estado derivado da URL, quebra de contrato com o backend ou furo
de segurança novo.

### Como foi conferido

`npm run build` passa (bundle 723 kB), `npm run lint` com 0 erros (18 avisos pré-existentes
de `catch (_)`), e o painel foi aberto no navegador: login, dashboard escuro, dashboard
claro, celular 390px e gaveta aberta. **Não foi testado contra a API de produção** — a
conferência foi com o backend fora do ar.

## Próximo passo

1. Rodar o painel contra a API de verdade e olhar as telas com dado real: tabela da base,
   ficha do cliente (abas), integração SGP e registros.
2. `VisualizadorBase.jsx` (423) e `ModalEditarCliente.jsx` (543) ainda passam do piso de 400
   linhas — quebrar antes da próxima funcionalidade, começando pelas abas do modal.

## Decisões
- SSE (não WebSocket) para atualização do painel: fluxo é só backend→frontend.
- Sem framework CSS: sistema de classes próprio no `index.css`.
- Ícone de navegação é `react-icons/fi`; emoji fica para significado de estado.
- Detalhe das decisões antigas: `.specs/project/STATE.md`.

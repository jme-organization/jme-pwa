# jme-pwa

## Contexto automático (ler no início da sessão, sem o usuário pedir)
1. Ler `.specs/STATE.md` (onde parei, próximo passo) se existir.
2. Consultar docs do projeto (CLAUDE.md/.specs) SÓ sob demanda — não carregar tudo por padrão.
3. Pergunta sobre código → usar grafo graphify (`graphify-out/`) se existir, não ler arquivos crus.
- **Vídeos trazidos pelo dono:** ler `~/Vault/jme-pwa/videos.md` se existir — links que a skill `video-nota` transcreveu e classificou pra este projeto; o `.md` completo fica em `~/Vault/_inbox/videos/`. É pauta pra discutir com o dono, não regra pra aplicar. Gatilho: "tem vídeo pra discutir".

## Ao encerrar / pausar (sem o usuário pedir)
1. Atualizar `.specs/STATE.md`: o que foi feito, o que ficou aberto, próximo passo.
2. Atualizar `~/Vault/pendencias.md` (seção deste projeto) — **ler o arquivo antes de escrever.** Item que já está `[x]` ou sumiu de lá foi fechado pelo dono no painel (vem carimbado *feita pelo dono no painel*): é palavra final — não reabrir nem recriar a partir do STATE; refletir o fechamento no STATE do projeto. Antes de escrever pendência nova, **reler cada `[ ]` da seção contra o que o STATE diz que foi feito hoje**: item que o STATE fecha, o vault fecha junto, com nota do que provou (commit/migration/arquivo) — senão STATE e vault discordam (aconteceu em 28/08: DPAs feitos no commit, `[ ]` no vault). O `encerra.js` cruza `[ ]` × commits × STATE e solta `AVISO` por item suspeito: responder a cada um, fechando ou dizendo por que fica, e rodar de novo com `--avisos-lidos` (sem isso AVISO é FALTA). Item novo: uma linha só, sem quebrar em 80 colunas. **Mexer nisso é pelo `pend.js`, não editando o arquivo à mão:** `node ~/Vault/scripts/pend.js listar --projeto jme-pwa` (ver o que está aberto), `pend.js feito "<trecho>" --nota "<o que provou>"` (fechar — ele recusa sem a prova), `pend.js add "<texto>" --projeto jme-pwa` (abrir, sempre na seção canônica do projeto), `pend.js pular|mover|apagar`. Ele acha o item pelo texto, para quando fica ambíguo e regenera o painel.
3. Aprendizado reusável → `~/Vault/jme-pwa/RESUMO.md` (a regra destilada, com o porquê).
4. **Rodar `node ~/Vault/scripts/sync-vault.js`.** Sem isto o vault fica só nesta máquina, sem backup no GitHub.
5. Repassar as linhas do `encerra.js` ao dono.
6. Mostrar em 3 linhas o que gravou.

## Regras de ouro
- (preencher conforme o projeto)

## Custo / upgrade de plano — vai pro PAINEL, não pras pendências
Algo que se resolve com CARTÃO e não com código (conta de loja, plano subindo de Free pra Pro,
domínio, taxa de gateway, ferramenta paga) registra na hora, sem perguntar:

```
node ~/Vault/scripts/investimento.js add "<o quê>" --projeto jme-pwa --gatilho "<o que faz o custo aparecer>" --quando agora|lancamento|crescer|futuro [--custo N --moeda USD|BRL] [--ciclo unico|mensal|anual|variavel] [--de "<plano de hoje>" --para "<plano depois>"] [--porque "<por quê>"] [--conferir]
```

Sem saber o preço: omitir `--custo` (o item fica fora das somas, e o painel diz quantos ficaram).
`--gatilho` é obrigatório. Isso **não** entra no `pendencias.md`: pendência se fecha com
código, isso se fecha pagando. O comando já regenera o painel.

**Três leituras:** `--obrigatorio` (sem isso não lança, não há decisão),
`--assinantes N` (só entra com N assinaturas ativas), ou nenhum dos dois — e aí é decisão de
produto, tomada aqui dentro e devolvida ao painel com
`investimento.js decidir "<nome>" --vale sim|nao|depois --porque "<motivo>"`.

**Gatilho "revisa os custos" / "o que eu tenho que pagar":** rodar
`node ~/Vault/scripts/investimento.js revisar --projeto jme-pwa --medir`, conferir com o dono o que só
ele sabe (preço de hoje, se a conta já existe), corrigir com `add`/`pago` e fechar em três
linhas: o que muda hoje, o que muda no lançamento, o que ainda não dá pra saber.

## GATILHOS (agir automático, sem pedir detalhes)
- **Pendência mexe NA HORA, pelo `pend.js`** — fechou algo agora: `node ~/Vault/scripts/pend.js feito "<trecho>" --nota "<o que provou>"`; apareceu coisa nova: `pend.js add "<texto>" --projeto jme-pwa`. Não guardar pro encerramento: sessão que acaba sem "encerra" leva junto o que só estava na cabeça dela.
Se o usuário disser "encerra", "vou fechar", "fim", "tchau", "vou sair", "salva aí", "parar por aqui": rodar a rotina de encerramento INTEIRA (os 6 passos acima), sozinho. NÃO perguntar "quer que eu atualize?" — o gatilho JÁ é a autorização.
Se disser "por onde paramos", "oi", "resume": ler STATE.md e dar contexto + próximo passo.

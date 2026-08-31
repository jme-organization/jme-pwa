# STATE — jme-pwa (painel admin da JME.NET)

> Metade da frente do JME.NET. A API é `../jme-back` (repo separado).
> Mapa do código e concerns em `.specs/codebase/`; estado longo em `.specs/project/STATE.md`.

## Onde parei
- Plugado no ecossistema em 31/08/2026 (manifesto do painel, vault, pendências, restore).
- Último trabalho no código: QR reage a evento SSE em vez de polling cego; aba própria de
  cobrança avançada. Commits `984b754`, `0ab7d14`.

## Próximo passo
- (definir na próxima sessão de código)

## Decisões
- SSE (não WebSocket) para atualização do dashboard: fluxo é só backend→frontend.
- Estilização inline, sem framework CSS.
- Detalhe das decisões antigas: `.specs/project/STATE.md`.

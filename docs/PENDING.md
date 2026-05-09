# PENDING.md

Tarefas pendentes e melhorias planejadas para o JME-BOT Frontend.

## Prioridade Alta

### Segurança
- [ ] Substituir todos os `window.confirm()` restantes por modais customizados
  - `src/pages/qr.jsx` - função `desconectar` ainda usa `confirm()`
  - Verificar outras páginas que possam ter `confirm()` ou `alert()`

### UX/UI
- [ ] Adicionar loading states globais para requisições de API
- [ ] Implementar toast notifications para feedback de ações
- [ ] Adicionar skeleton loaders para tabelas e cards

## Prioridade Média

### Funcionalidades
- [ ] Implementar paginação nas tabelas (logs, clientes, etc.)
- [ ] Adicionar filtros avançados nas listagens
- [ ] Implementar exportação de dados (CSV, Excel)
- [ ] Adicionar busca global na aplicação

### Performance
- [ ] Implementar lazy loading de componentes
- [ ] Otimizar re-renders com React.memo onde necessário
- [ ] Adicionar cache de requisições com SWR ou React Query

## Prioridade Baixa

### Melhorias
- [ ] Adicionar modo escuro/claro (temas)
- [ ] Implementar atalhos de teclado
- [ ] Adicionar animações de transição entre páginas
- [ ] Melhorar responsividade para dispositivos móveis

### Documentação
- [ ] Adicionar Storybook para componentes
- [ ] Criar guia de estilos (Design System)
- [ ] Documentar hooks customizados

## Bugs Conhecidos

- Nenhum bug crítico reportado

## Sugestões da Equipe

- [ ] Avaliar migração para TypeScript
- [ ] Considerar migração para Next.js para melhor SEO e performance
- [ ] Implementar testes E2E com Playwright

## Notas

- Este documento deve ser atualizado regularmente
- Tarefas concluídas devem ser movidas para CHANGELOG.md
- Prioridades podem ser ajustadas conforme necessidade do negócio
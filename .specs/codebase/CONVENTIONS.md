# CONVENTIONS — jme-pwa

Escrito em 2026-09-05 a partir de **medição neste código**, não de checklist genérico.
Cada regra abaixo existe porque o scanner achou o problema aqui, ou porque achou o
acerto aqui e ele merece ser preservado.

Stack: React 18 · Vite · React Router · Recharts. Sem Tailwind, sem CSS-in-JS.

## O que já está certo — não "consertar"

Medido em 05/09/2026 nos 53 `useEffect` e 181 `useState` do `src/`:

- **Zero** `useEffect` sem array de dependência.
- **Zero** timer, listener ou subscription sem `cleanup`.
- Os 7 efeitos que só chamam `setX` são reset intencional (troca de aba, troca de
  base, status de rede), não estado derivado por descuido.

**Não gastar sessão "corrigindo hooks" aqui.** A higiene de hook deste projeto está
boa; quem mexer deve manter o padrão, não reescrever o que já funciona.

## Estilo — a regra que dói

O projeto **já tem sistema de cor**: 12 variáveis CSS em `src/index.css`
(`--bg-primary`, `--bg-secondary`, `--bg-card`, `--border`, `--text-primary`,
`--text-secondary`, `--text-muted`, `--green`, `--amber`, `--red`, `--blue`,
`--purple`), com tema claro por `[data-theme="light"]`.

E **668 `style={{ }}` inline** espalhados pelo `src/`, cada um com hex e px escolhidos
na hora, passando por fora dessas variáveis. É por isso que a tela sai sem cara própria:
o sistema existe e é contornado 668 vezes.

- **Cor em `style={{}}` é proibida.** Usa `var(--token)` ou classe.
- **Espaçamento e tamanho novos vão pro CSS**, não pro atributo `style`.
- `style={{}}` só para valor **calculado em tempo de execução** (largura de barra
  proporcional a um número, posição de tooltip). Valor fixo nunca.
- As variáveis estão **declaradas duas vezes** no `index.css` (linhas 9 e 359).
  Quem mexer em token unifica antes de acrescentar mais um.

## Tamanho de arquivo

Quatro componentes passaram de 400 linhas:

| Arquivo | Linhas |
|---|---|
| `ModalEditarCliente.jsx` | 857 |
| `VisualizadorBase.jsx` | 706 |
| `TopNav.jsx` | 687 |
| `BackupButton.jsx` | 424 |

Componente acima de **400 linhas** não recebe funcionalidade nova sem ser quebrado
antes. Não é regra estética: é onde revisão para de achar bug e onde duas sessões
paralelas colidem.

## Nunca

- Cor ou px fixo dentro de `style={{}}`.
- Acrescentar tela nova em componente que já passou de 400 linhas.
- Declarar variável CSS nova sem antes unificar os dois blocos duplicados.
- Reescrever hook que já tem dependência e cleanup corretos "pra padronizar".

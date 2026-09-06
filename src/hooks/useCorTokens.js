// src/hooks/useCorTokens.js
//
// Recharts pinta com valor de cor, nao com classe CSS — e o CONVENTIONS.md
// proibe hex solto no arquivo de tela. A saida e ler o proprio token do
// :root em tempo de execucao: o grafico passa a seguir o tema claro/escuro
// junto com o resto do painel, sem nenhuma cor duplicada em JavaScript.
import { useEffect, useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';

const NOMES = ['green', 'amber', 'red', 'blue', 'purple', 'orange', 'cyan',
  'text-primary', 'text-secondary', 'text-muted', 'border', 'bg-card', 'bg-secondary'];

function lerTokens() {
  if (typeof window === 'undefined') return {};
  const estilo = window.getComputedStyle(document.documentElement);
  const saida = {};
  NOMES.forEach(nome => { saida[nome] = estilo.getPropertyValue(`--${nome}`).trim(); });
  return saida;
}

export function useCorTokens() {
  const { theme } = useTheme();
  const [tokens, setTokens] = useState(lerTokens);

  useEffect(() => { setTokens(lerTokens()); }, [theme]);

  return tokens;
}

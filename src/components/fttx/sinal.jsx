// src/components/fttx/sinal.jsx
// O sinal optico da ONU e o estado do cliente na linha — os dois pedacos que se
// repetem em toda a tela de ONUs.
//
// Faixas e significado: .specs/DESIGN.md, secao "Sinal optico da ONU".
import React from 'react';

// Referencia de GPON, nao invencao nossa: recepcao saudavel fica entre -8 e
// -25 dBm, e abaixo de -28 o enlace comeca a errar quadro.
const OK = -25;
const CRITICO = -28;

export function classeDoSinal(rx) {
  const n = Number(rx);
  if (rx === null || rx === undefined || rx === '' || Number.isNaN(n)) return 'sinal-sem';
  if (n >= OK) return 'sinal-ok';
  if (n >= CRITICO) return 'sinal-atencao';
  return 'sinal-critico';
}

/**
 * Sinal com unidade.
 *
 * Sem leitura mostra "—", NUNCA "0.0 dBm": zero e um valor otimo de sinal e
 * diria o contrario do que aconteceu. 13 das 414 ONUs nao reportam.
 */
export function Sinal({ rx }) {
  const n = Number(rx);
  const semLeitura = rx === null || rx === undefined || rx === '' || Number.isNaN(n);
  return (
    <span className={`sinal ${classeDoSinal(rx)}`}>
      {semLeitura ? '—' : `${n.toFixed(1)} dBm`}
    </span>
  );
}

const AVISOS = {
  ambiguo: 'login ambíguo',
  duplicado: 'login em 2 ONUs',
  desconhecido: 'sem cadastro',
};

/**
 * O cliente da ONU — ou o motivo de nao haver um.
 *
 * Nunca escolhe um nome quando ha duvida. Nome errado numa tela de onde se
 * derruba cliente e pior que nome nenhum.
 */
export function CelulaCliente({ cliente }) {
  const estado = cliente?.estado || 'sem_login';

  if (estado === 'casado') return <>{cliente.nome || '—'}</>;
  if (estado === 'sem_login') return <span className="td-muted">—</span>;
  if (estado === 'carregando') return <span className="td-muted" title="Montando a lista de nomes…">…</span>;

  return (
    <span className="badge badge-neutro" title={(cliente?.nomes || []).join(' · ') || undefined}>
      {AVISOS[estado] || estado}
    </span>
  );
}

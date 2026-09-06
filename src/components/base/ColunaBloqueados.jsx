// src/components/base/ColunaBloqueados.jsx — nem cobrado, nem cancelado.
//
// Bloqueado é o meio-termo: serviço cortado, cliente ainda recuperável. Ele sai
// da tabela do dia e das contas (pagos/pendentes/%) e fica aqui do lado — sem
// isso ficava eternamente "pendente", inflando a inadimplência todo mês.
import React from 'react';
import { Card } from '../Card';

export function ColunaBloqueados({ dia, clientes, bloqueando, onDesbloquear, onAbrir }) {
  return (
    <Card className="base-bloqueados">
      <div className="card-cab card-cab-bloco">
        <div className="card-titulo val-bloqueio">🚫 Bloqueados — dia {dia}</div>
        <div className="dica">
          {clientes.length === 0
            ? 'Ninguém bloqueado nesta data'
            : `${clientes.length} fora da cobrança e das contas`}
        </div>
      </div>

      {clientes.map(c => (
        <div key={c.id} className="bloqueado-item">
          <button type="button" className="bloqueado-nome" onClick={() => onAbrir(c)}>
            {c.nome}
          </button>
          <div className="td-mono">{c.telefone || '—'}</div>
          {c.bloqueado_em && (
            <div className="dica">
              desde {new Date(c.bloqueado_em).toLocaleDateString('pt-BR')}
              {c.motivo_bloqueio ? ` — ${c.motivo_bloqueio}` : ''}
            </div>
          )}
          <div className="page-acoes mt-1">
            <button
              type="button"
              className="btn btn-ok btn-pequeno"
              disabled={bloqueando === c.id}
              onClick={() => onDesbloquear(c)}
            >
              {bloqueando === c.id ? '…' : '↩ Desbloquear'}
            </button>
            <button
              type="button"
              className="btn btn-perigo btn-pequeno"
              title="Abre a ficha do cliente na aba de cancelamento"
              onClick={() => onAbrir(c)}
            >
              ❌ Cancelar
            </button>
          </div>
        </div>
      ))}
    </Card>
  );
}

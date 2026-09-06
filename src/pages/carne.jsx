// src/pages/carne.jsx — carnês físicos: solicitado, impresso, entregue.
import React, { useState } from 'react';
import { useFetch } from '../hooks/useFetch';
import { Card } from '../components/Card';
import { Spinner } from '../components/Spinner';
import { fmtDate, fmtTel } from '../utils/formatadores';
import { api } from '../api/client';

const ESTADO = {
  solicitado: { label: 'Solicitado', emoji: '📋', classe: 'badge-pendente' },
  impresso:   { label: 'Impresso',   emoji: '🖨️', classe: 'badge-promessa' },
  entregue:   { label: 'Entregue',   emoji: '🚚', classe: 'badge-info' },
  concluido:  { label: 'Concluído',  emoji: '✅', classe: 'badge-pago' },
};

export function PageCarne() {
  const { data, loading, refetch } = useFetch('/api/carne');
  const [filtro, setFiltro] = useState('pendentes');
  const [ocupado, setOcupado] = useState({});

  const todos = data || [];
  const filtrados = filtro === 'todos' ? todos
    : filtro === 'pendentes' ? todos.filter(c => c.status !== 'concluido')
    : todos.filter(c => c.status === filtro);

  const marcar = async (id, acao) => {
    const chave = `${id}-${acao}`;
    setOcupado(o => ({ ...o, [chave]: true }));
    try {
      await api.post(`/api/carne/${id}/${acao}`);
      refetch();
    } catch (e) {
      alert(`Não consegui marcar: ${e.message}`);
    }
    setOcupado(o => ({ ...o, [chave]: false }));
  };

  const remover = async (id) => {
    if (!confirm('Remover esta solicitação de carnê?')) return;
    try {
      await api.delete(`/api/carne/${id}`);
      refetch();
    } catch (e) {
      alert(`Não consegui remover: ${e.message}`);
    }
  };

  const totais = {
    pendentes: todos.filter(c => c.status !== 'concluido').length,
    impressos: todos.filter(c => !!c.impresso_em).length,
    entregues: todos.filter(c => !!c.entregue_em).length,
    concluidos: todos.filter(c => c.status === 'concluido').length,
  };

  return (
    <div className="page">
      <div className="page-topo">
        <div>
          <h1 className="page-title">Carnês físicos</h1>
          <div className="page-sub">Marcar impresso e entregue conclui a solicitação sozinho.</div>
        </div>
      </div>

      <div className="kpis">
        <div className="kpi"><span className="kpi-val val-alerta">{totais.pendentes}</span><span className="kpi-label">⏳ Pendentes</span></div>
        <div className="kpi"><span className="kpi-val val-promessa">{totais.impressos}</span><span className="kpi-label">🖨️ Impressos</span></div>
        <div className="kpi"><span className="kpi-val val-info">{totais.entregues}</span><span className="kpi-label">🚚 Entregues</span></div>
        <div className="kpi"><span className="kpi-val val-ok">{totais.concluidos}</span><span className="kpi-label">✅ Concluídos</span></div>
      </div>

      <Card>
        <div className="card-cab">
          <div className="filtro-group">
            {[['pendentes', '⏳ Pendentes'], ['concluido', '✅ Concluídos'], ['todos', 'Todos']].map(([v, l]) => (
              <button
                key={v}
                type="button"
                className={`filtro-btn ${filtro === v ? 'filtro-ativo' : ''}`}
                onClick={() => setFiltro(v)}
              >
                {l}
              </button>
            ))}
          </div>
          <span className="dica linha-fim mt-0">
            {filtrados.length} solicitação{filtrados.length !== 1 ? 'ões' : ''}
          </span>
        </div>

        {loading ? (
          <Spinner />
        ) : filtrados.length === 0 ? (
          <div className="vazio">
            <span className="vazio-emoji">📋</span>
            Nenhuma solicitação de carnê
          </div>
        ) : (
          <div className="tabela-scroll">
            <table className="tabela">
              <thead>
                <tr>
                  <th>#</th><th>Cliente</th><th>Venc.</th><th>WhatsApp</th>
                  <th>Endereço</th><th>Origem</th><th>Status</th><th>Solicitado</th><th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {filtrados.map(c => {
                  const e = ESTADO[c.status] || ESTADO.solicitado;
                  return (
                    <tr key={c.id}>
                      <td className="td-muted">#{c.id}</td>
                      <td className="td-nome">{c.nome || <span className="td-muted">não informado</span>}</td>
                      <td className="td-centro">{c.dia_vencimento ? `Dia ${c.dia_vencimento}` : '—'}</td>
                      <td className="td-mono">{fmtTel(c.numero)}</td>
                      <td className="td-corta">{c.endereco || '—'}</td>
                      <td>
                        <span className={`badge ${c.origem === 'painel' ? 'badge-info' : 'badge-neutro'}`}>
                          {c.origem === 'painel' ? '📱 Painel' : '💬 WhatsApp'}
                        </span>
                      </td>
                      <td><span className={`badge ${e.classe}`}>{e.emoji} {e.label}</span></td>
                      <td className="td-muted">{fmtDate(c.solicitado_em)}</td>
                      <td>
                        {c.status === 'concluido' ? (
                          <span className="badge badge-pago">✅ Concluído</span>
                        ) : (
                          <div className="pilha-fina">
                            <label className="marcavel">
                              <input
                                type="checkbox"
                                checked={!!c.impresso_em}
                                disabled={ocupado[`${c.id}-imprimir`]}
                                onChange={() => marcar(c.id, 'imprimir')}
                              />
                              🖨️ Impresso
                            </label>
                            <label className="marcavel">
                              <input
                                type="checkbox"
                                checked={!!c.entregue_em}
                                disabled={ocupado[`${c.id}-entregar`]}
                                onChange={() => marcar(c.id, 'entregar')}
                              />
                              🚚 Entregue
                            </label>
                          </div>
                        )}
                        <button
                          type="button"
                          className="btn btn-perigo btn-pequeno"
                          style={{ marginTop: 6 }}
                          onClick={() => remover(c.id)}
                        >
                          🗑️ Remover
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

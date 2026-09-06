// src/pages/cancelamentos.jsx — pedidos de cancelamento e o que virou de cada um.
import React, { useState } from 'react';
import { useSSEData } from '../hooks/useSSEData';
import { Card } from '../components/Card';
import { Spinner } from '../components/Spinner';
import { api } from '../api/client';

const ESTADO = {
  solicitado: { label: 'Solicitado', classe: 'badge-pendente' },
  confirmado: { label: 'Confirmado', classe: 'badge-vencida' },
  desistiu:   { label: 'Desistiu',   classe: 'badge-pago' },
};

const EMOJI_MOTIVO = {
  'Problemas financeiros': '💸',
  'Qualidade do serviço': '📶',
  'Mudança de endereço': '🏠',
  'Contratei outro provedor': '🔄',
  'Outro motivo': '💬',
};

const FILTROS = [
  ['todos', 'Todos'],
  ['solicitado', '⏳ Solicitados'],
  ['confirmado', '❌ Confirmados'],
  ['desistiu', '✅ Desistiram'],
];

export function PageCancelamentos() {
  const { data, loading, refetch } = useSSEData('/api/cancelamentos', 'cancelamentos');
  const [filtro, setFiltro] = useState('todos');
  const [agindo, setAgindo] = useState(null);

  const cancelamentos = data || [];
  const filtrados = cancelamentos.filter(c => filtro === 'todos' || c.status === filtro);

  const agir = async (id, caminho, pergunta, metodo = 'post') => {
    if (!confirm(pergunta)) return;
    setAgindo(id);
    try {
      if (metodo === 'delete') await api.delete(`/api/cancelamentos/${id}`);
      else await api.post(`/api/cancelamentos/${id}/${caminho}`);
      refetch();
    } catch (e) {
      alert(`Não consegui aplicar: ${e.message}`);
    }
    setAgindo(null);
  };

  const totais = {
    solicitado: cancelamentos.filter(c => c.status === 'solicitado').length,
    confirmado: cancelamentos.filter(c => c.status === 'confirmado').length,
    desistiu: cancelamentos.filter(c => c.status === 'desistiu').length,
  };

  return (
    <div className="page">
      <div className="page-topo">
        <div>
          <h1 className="page-title">Cancelamentos</h1>
          <div className="page-sub">Confirmar notifica o cliente. Reverter devolve ele como ativo.</div>
        </div>
        <div className="page-acoes">
          <button type="button" className="btn btn-pequeno" onClick={refetch}>↻ Atualizar</button>
        </div>
      </div>

      <div className="kpis">
        <div className="kpi"><span className="kpi-val val-alerta">{totais.solicitado}</span><span className="kpi-label">⏳ Solicitados</span></div>
        <div className="kpi"><span className="kpi-val val-erro">{totais.confirmado}</span><span className="kpi-label">❌ Confirmados</span></div>
        <div className="kpi"><span className="kpi-val val-ok">{totais.desistiu}</span><span className="kpi-label">✅ Desistiram</span></div>
      </div>

      <Card>
        <div className="card-cab">
          <div className="filtro-group">
            {FILTROS.map(([v, l]) => (
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
        </div>

        {loading ? (
          <Spinner />
        ) : filtrados.length === 0 ? (
          <div className="vazio">
            <span className="vazio-emoji">🙌</span>
            Nenhum cancelamento neste filtro
          </div>
        ) : (
          <div className="tabela-scroll">
            <table className="tabela">
              <thead>
                <tr><th>Cliente</th><th>Motivo</th><th>Plano</th><th>Venc.</th><th>Status</th><th>Data</th><th>Ações</th></tr>
              </thead>
              <tbody>
                {filtrados.map(c => {
                  const e = ESTADO[c.status] || { label: c.status, classe: 'badge-neutro' };
                  return (
                    <tr key={c.id}>
                      <td>
                        <div className="td-nome">{c.nome || '—'}</div>
                        <div className="td-mono">{c.telefone || c.numero_whatsapp?.replace('@c.us', '') || '—'}</div>
                      </td>
                      <td>{EMOJI_MOTIVO[c.motivo] || '💬'} {c.motivo || '—'}</td>
                      <td className="td-muted">{c.plano || '—'}</td>
                      <td className="td-muted">{c.dia_vencimento ? `Dia ${c.dia_vencimento}` : '—'}</td>
                      <td><span className={`badge ${e.classe}`}>{e.label}</span></td>
                      <td className="td-muted">
                        {c.solicitado_em ? new Date(c.solicitado_em).toLocaleDateString('pt-BR') : '—'}
                      </td>
                      <td>
                        <div className="page-acoes">
                          {c.status === 'solicitado' ? (
                            <>
                              <button
                                type="button"
                                className="btn btn-perigo btn-pequeno"
                                disabled={agindo === c.id}
                                onClick={() => agir(c.id, 'confirmar', `Confirmar o cancelamento de ${c.nome}? O cliente será notificado.`)}
                              >
                                ❌ Confirmar
                              </button>
                              <button
                                type="button"
                                className="btn btn-ok btn-pequeno"
                                disabled={agindo === c.id}
                                onClick={() => agir(c.id, 'cancelar', `Reverter? ${c.nome} volta como ativo.`)}
                              >
                                ↩ Reverter
                              </button>
                            </>
                          ) : (
                            <button
                              type="button"
                              className="btn btn-pequeno"
                              disabled={agindo === c.id}
                              onClick={() => agir(c.id, null, 'Excluir este registro do histórico?', 'delete')}
                            >
                              🗑️ Excluir
                            </button>
                          )}
                        </div>
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

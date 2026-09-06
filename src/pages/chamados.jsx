// src/pages/chamados.jsx — suporte aberto pelo cliente.
import React, { useState } from 'react';
import { useSSEData } from '../hooks/useSSEData';
import { Card } from '../components/Card';
import { Spinner } from '../components/Spinner';
import { fmtTel } from '../utils/formatadores';
import { api } from '../api/client';

const ESTADO = {
  aberto:         { label: 'Aberto',         emoji: '🔴', classe: 'badge-vencida' },
  em_atendimento: { label: 'Em atendimento', emoji: '🟡', classe: 'badge-pendente' },
  fechado:        { label: 'Fechado',        emoji: '✅', classe: 'badge-pago' },
};

const FILTROS = [
  ['aberto', '🔴 Abertos'],
  ['em_atendimento', '🟡 Em atendimento'],
  ['fechado', '✅ Fechados'],
  ['todos', 'Todos'],
];

const desde = (ms) => {
  if (!ms) return '—';
  const min = Math.floor((Date.now() - ms) / 60000);
  if (min < 1) return 'agora';
  if (min < 60) return `${min}min atrás`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h}h ${min % 60}min atrás`;
  return `${Math.floor(h / 24)}d atrás`;
};

export function PageChamados() {
  const { data, loading, refetch } = useSSEData('/api/chamados', 'chamados');
  const [filtro, setFiltro] = useState('todos');
  const [agindo, setAgindo] = useState(null);

  const chamados = data || [];
  const filtrados = chamados.filter(c => filtro === 'todos' || c.status === filtro);

  const agir = async (id, acao) => {
    setAgindo(id);
    try {
      await api.post(`/api/chamados/${id}/${acao}`);
      refetch();
    } catch (e) {
      alert(`Não consegui aplicar: ${e.message}`);
    }
    setAgindo(null);
  };

  const abertos = chamados.filter(c => c.status === 'aberto').length;
  const emAtendimento = chamados.filter(c => c.status === 'em_atendimento').length;

  return (
    <div className="page">
      <div className="page-topo">
        <div>
          <h1 className="page-title">Chamados</h1>
          <div className="page-sub">Assumir marca quem está cuidando; fechar encerra o chamado.</div>
        </div>
      </div>

      <div className="kpis">
        <div className="kpi">
          <span className="kpi-val val-erro">{abertos}</span>
          <span className="kpi-label">Aguardando atendimento</span>
        </div>
        <div className="kpi">
          <span className="kpi-val val-alerta">{emAtendimento}</span>
          <span className="kpi-label">Em atendimento agora</span>
        </div>
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
          <span className="dica linha-fim mt-0">
            {filtrados.length} chamado{filtrados.length !== 1 ? 's' : ''}
          </span>
        </div>

        {loading ? (
          <Spinner />
        ) : filtrados.length === 0 ? (
          <div className="vazio">
            <span className="vazio-emoji">🎫</span>
            Nenhum chamado neste filtro
          </div>
        ) : (
          <div className="tabela-scroll">
            <table className="tabela">
              <thead>
                <tr><th>#</th><th>Telefone</th><th>Nome</th><th>Motivo</th><th>Status</th><th>Aberto</th><th>Ações</th></tr>
              </thead>
              <tbody>
                {filtrados.map(c => {
                  const e = ESTADO[c.status] || ESTADO.aberto;
                  return (
                    <tr key={c.id}>
                      <td className="td-muted">#{c.id}</td>
                      <td className="td-mono">{fmtTel(c.numero)}</td>
                      <td className="td-nome">{c.nome || <span className="td-muted">desconhecido</span>}</td>
                      <td>{c.motivo || '—'}</td>
                      <td><span className={`badge ${e.classe}`}>{e.emoji} {e.label}</span></td>
                      <td className="td-muted">{desde(c.aberto_em)}</td>
                      <td>
                        <div className="page-acoes">
                          {c.status === 'aberto' && (
                            <button
                              type="button"
                              className="btn btn-alerta btn-pequeno"
                              disabled={agindo === c.id}
                              onClick={() => agir(c.id, 'assumir')}
                            >
                              👤 Assumir
                            </button>
                          )}
                          {c.status !== 'fechado' ? (
                            <button
                              type="button"
                              className="btn btn-ok btn-pequeno"
                              disabled={agindo === c.id}
                              onClick={() => agir(c.id, 'fechar')}
                            >
                              ✔ Fechar
                            </button>
                          ) : (
                            <span className="dica mt-0">encerrado</span>
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

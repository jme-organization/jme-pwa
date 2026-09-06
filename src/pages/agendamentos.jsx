// src/pages/agendamentos.jsx — visitas técnicas marcadas.
import React, { useState, useEffect, useCallback } from 'react';
import { useFetch } from '../hooks/useFetch';
import { Card } from '../components/Card';
import { Spinner } from '../components/Spinner';
import { Pagination } from '../components/Pagination';
import { api } from '../api/client';

const POR_PAGINA = 20;

const PERIODO = {
  manha: { emoji: '🌅', texto: 'Manhã', hora: '8h–12h' },
  tarde: { emoji: '☀️', texto: 'Tarde', hora: '13h–17h' },
};

const BADGE = { concluido: 'badge-pago', cancelado: 'badge-vencida' };

const FILTROS_DATA = [
  ['todos', 'Todos'],
  ['hoje', 'Hoje'],
  ['amanha', 'Amanhã'],
  ['semana', 'Próximos 7 dias'],
];

export function PageAgendamentos() {
  const [filtroData, setFiltroData] = useState('todos');
  const [filtroStatus, setFiltroStatus] = useState('todos');
  const [agendamentos, setAgendamentos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState(null);
  const [pagina, setPagina] = useState(1);
  const [agindo, setAgindo] = useState(null);

  const { data: disponibilidade } = useFetch('/api/agendamentos/disponibilidade');

  const carregar = useCallback(async () => {
    setLoading(true);
    try {
      setErro(null);
      const data = await api.get(`/api/agendamentos?data=${filtroData}&status=${filtroStatus}`);
      setAgendamentos(Array.isArray(data) ? data : []);
      setPagina(1);
    } catch (e) {
      setErro(e.message || 'Não consegui carregar os agendamentos');
      setAgendamentos([]);
    } finally {
      setLoading(false);
    }
  }, [filtroData, filtroStatus]);

  useEffect(() => { carregar(); }, [carregar]);

  const agir = async (id, acao, pergunta) => {
    if (!confirm(pergunta)) return;
    setAgindo(id);
    try {
      await api.post(`/api/agendamentos/${id}/${acao}`);
      carregar();
    } catch (e) {
      alert(`Não consegui aplicar: ${e.message}`);
    }
    setAgindo(null);
  };

  const totalPaginas = Math.max(1, Math.ceil(agendamentos.length / POR_PAGINA));
  const inicio = (pagina - 1) * POR_PAGINA;
  const daPagina = agendamentos.slice(inicio, inicio + POR_PAGINA);

  return (
    <div className="page">
      <div className="page-topo">
        <div>
          <h1 className="page-title">Agendamentos</h1>
          <div className="page-sub">Visitas marcadas por período, com a agenda dos próximos dias.</div>
        </div>
      </div>

      <div className="kpis">
        <div className="kpi"><span className="kpi-val">{disponibilidade?.hoje ?? 0}</span><span className="kpi-label">Hoje</span></div>
        <div className="kpi"><span className="kpi-val">{disponibilidade?.amanha ?? 0}</span><span className="kpi-label">Amanhã</span></div>
        <div className="kpi"><span className="kpi-val">{disponibilidade?.semana ?? 0}</span><span className="kpi-label">Próximos 7 dias</span></div>
      </div>

      <div className="linha mb-3">
        <div className="filtro-group">
          {FILTROS_DATA.map(([v, l]) => (
            <button
              key={v}
              type="button"
              className={`filtro-btn ${filtroData === v ? 'filtro-ativo' : ''}`}
              onClick={() => setFiltroData(v)}
            >
              {l}
            </button>
          ))}
        </div>
        <select
          className="entrada entrada-auto linha-fim"
          value={filtroStatus}
          onChange={e => setFiltroStatus(e.target.value)}
          aria-label="Filtrar por status"
        >
          <option value="todos">Todos os status</option>
          <option value="agendado">Agendado</option>
          <option value="concluido">Concluído</option>
          <option value="cancelado">Cancelado</option>
        </select>
      </div>

      {erro && <div className="aviso aviso-erro mb-3">{erro}</div>}

      <Card>
        {loading ? (
          <Spinner />
        ) : daPagina.length === 0 ? (
          <div className="vazio">
            <span className="vazio-emoji">📅</span>
            Nenhum agendamento neste filtro
          </div>
        ) : (
          <>
            <div className="tabela-scroll">
              <table className="tabela">
                <thead>
                  <tr><th>Data</th><th>Período</th><th>Cliente</th><th>Telefone</th><th>Endereço</th><th>Status</th><th>Ações</th></tr>
                </thead>
                <tbody>
                  {daPagina.map(ag => {
                    const p = PERIODO[ag.periodo] || { emoji: '❓', texto: ag.periodo || '—', hora: '' };
                    return (
                      <tr key={ag.id}>
                        <td>{ag.data ? new Date(ag.data).toLocaleDateString('pt-BR') : '—'}</td>
                        <td>{p.emoji} {p.texto} <span className="td-muted">{p.hora}</span></td>
                        <td className="td-nome">{ag.cliente_nome || '—'}</td>
                        <td className="td-mono">{ag.numero ? ag.numero.replace('@c.us', '') : '—'}</td>
                        <td className="td-corta">{ag.endereco || '—'}</td>
                        <td><span className={`badge ${BADGE[ag.status] || 'badge-pendente'}`}>{ag.status || '—'}</span></td>
                        <td>
                          {ag.status === 'agendado' && (
                            <div className="page-acoes">
                              <button
                                type="button"
                                className="btn btn-ok btn-pequeno"
                                disabled={agindo === ag.id}
                                onClick={() => agir(ag.id, 'concluir', 'Marcar como concluído?')}
                              >
                                ✅ Concluir
                              </button>
                              <button
                                type="button"
                                className="btn btn-perigo btn-pequeno"
                                disabled={agindo === ag.id}
                                onClick={() => agir(ag.id, 'cancelar', 'Cancelar este agendamento?')}
                              >
                                ❌ Cancelar
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <Pagination currentPage={pagina} totalPages={totalPaginas} onPageChange={setPagina} />
          </>
        )}
      </Card>
    </div>
  );
}

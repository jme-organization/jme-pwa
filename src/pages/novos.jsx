// src/pages/novos.jsx — instalações: o que foi pedido e o que está agendado.
import React, { useState } from 'react';
import { useFetch } from '../hooks/useFetch';
import { Card } from '../components/Card';
import { Spinner } from '../components/Spinner';
import { api } from '../api/client';

const BADGE = {
  finalizado: 'badge-pago',
  concluido: 'badge-pago',
  confirmado: 'badge-promessa',
  cancelado: 'badge-vencida',
};

const STATUS_POR_ABA = {
  solicitacoes: ['solicitado', 'confirmado', 'finalizado'],
  agendadas: ['agendado', 'confirmado', 'concluido', 'cancelado'],
};

export function PageNovos() {
  const [aba, setAba] = useState('solicitacoes');
  const [status, setStatus] = useState('todos');
  const [agindo, setAgindo] = useState(null);

  const filtro = status === 'todos' ? '' : status;
  const { data: solicitacoes, loading: carregandoSolic, refetch: recarregarSolic } =
    useFetch(`/api/instalacoes?status=${filtro}`);
  const { data: agendadas, loading: carregandoAgend, refetch: recarregarAgend } =
    useFetch(`/api/instalacoes-agendadas?status=${filtro}`);

  // Trocar de aba com um status que so existe na outra devolveria lista vazia
  // sem explicacao — por isso o filtro volta pra "todos" junto com a aba.
  const trocarAba = (nova) => { setAba(nova); setStatus('todos'); };

  const agir = async (url, pergunta, recarregar, aviso) => {
    if (!confirm(pergunta)) return;
    setAgindo(url);
    try {
      await api.post(url);
      if (aviso) alert(aviso);
      recarregar();
    } catch (e) {
      alert(`Não consegui aplicar: ${e.message}`);
    }
    setAgindo(null);
  };

  const listaSolic = solicitacoes || [];
  const listaAgend = agendadas || [];

  return (
    <div className="page">
      <div className="page-topo">
        <div>
          <h1 className="page-title">Instalações</h1>
          <div className="page-sub">Confirmar uma instalação agendada adiciona o cliente à base.</div>
        </div>
      </div>

      <div className="abas">
        <button
          type="button"
          className={`aba ${aba === 'solicitacoes' ? 'aba-ativa' : ''}`}
          onClick={() => trocarAba('solicitacoes')}
        >
          📋 Solicitações {listaSolic.length ? `(${listaSolic.length})` : ''}
        </button>
        <button
          type="button"
          className={`aba ${aba === 'agendadas' ? 'aba-ativa' : ''}`}
          onClick={() => trocarAba('agendadas')}
        >
          📅 Agendadas {listaAgend.length ? `(${listaAgend.length})` : ''}
        </button>
      </div>

      <div className="linha mb-3">
        <label className="dica" htmlFor="filtro-status" style={{ marginTop: 0 }}>Status</label>
        <select
          id="filtro-status"
          className="entrada entrada-auto"
          value={status}
          onChange={e => setStatus(e.target.value)}
        >
          <option value="todos">Todos</option>
          {STATUS_POR_ABA[aba].map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      <Card>
        {aba === 'solicitacoes' ? (
          carregandoSolic ? <Spinner /> : listaSolic.length === 0 ? (
            <div className="vazio"><span className="vazio-emoji">📋</span>Nenhuma solicitação</div>
          ) : (
            <div className="tabela-scroll">
              <table className="tabela">
                <thead>
                  <tr>
                    <th>Solicitado</th><th>Cliente</th><th>Telefone</th><th>Plano</th>
                    <th>Roteador</th><th>Endereço</th><th>Disponibilidade</th><th>Status</th><th>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {listaSolic.map(s => (
                    <tr key={s.id}>
                      <td className="td-muted">
                        {s.cadastrado_em ? new Date(s.cadastrado_em).toLocaleDateString('pt-BR') : '—'}
                      </td>
                      <td className="td-nome">{s.nome}</td>
                      <td className="td-mono">{s.telefone || s.numero?.replace('@c.us', '') || '—'}</td>
                      <td>{s.plano || '—'}</td>
                      <td>{s.roteador || '—'}</td>
                      <td className="td-corta">{s.endereco || '—'}</td>
                      <td className="td-muted">{s.disponibilidade || '—'}</td>
                      <td><span className={`badge ${BADGE[s.status] || 'badge-pendente'}`}>{s.status}</span></td>
                      <td>
                        {s.status === 'solicitado' && (
                          <button
                            type="button"
                            className="btn btn-info btn-pequeno"
                            disabled={agindo === `/api/instalacoes/${s.id}/confirmar`}
                            onClick={() => agir(`/api/instalacoes/${s.id}/confirmar`, 'Confirmar esta solicitação?', recarregarSolic)}
                          >
                            ✅ Confirmar
                          </button>
                        )}
                        {s.status === 'confirmado' && (
                          <button
                            type="button"
                            className="btn btn-ok btn-pequeno"
                            disabled={agindo === `/api/instalacoes/${s.id}/finalizar`}
                            onClick={() => agir(
                              `/api/instalacoes/${s.id}/finalizar`,
                              'Finalizar? O cliente será adicionado à base.',
                              recarregarSolic,
                            )}
                          >
                            🏁 Finalizar
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        ) : (
          carregandoAgend ? <Spinner /> : listaAgend.length === 0 ? (
            <div className="vazio"><span className="vazio-emoji">📅</span>Nenhuma instalação agendada</div>
          ) : (
            <div className="tabela-scroll">
              <table className="tabela">
                <thead>
                  <tr><th>Data</th><th>Cliente</th><th>Telefone</th><th>Endereço</th><th>Observação</th><th>Status</th><th>Ações</th></tr>
                </thead>
                <tbody>
                  {listaAgend.map(i => (
                    <tr key={i.id}>
                      <td>{i.data ? new Date(i.data).toLocaleDateString('pt-BR') : '—'}</td>
                      <td className="td-nome">{i.nome}</td>
                      <td className="td-mono">{i.numero?.replace('@c.us', '') || '—'}</td>
                      <td className="td-corta">{i.endereco || '—'}</td>
                      <td className="td-muted">{i.observacao || '—'}</td>
                      <td><span className={`badge ${BADGE[i.status] || 'badge-pendente'}`}>{i.status}</span></td>
                      <td>
                        <div className="page-acoes">
                          {i.status === 'agendado' && (
                            <>
                              <button
                                type="button"
                                className="btn btn-info btn-pequeno"
                                disabled={agindo === `/api/instalacoes-agendadas/${i.id}/confirmar`}
                                onClick={() => agir(
                                  `/api/instalacoes-agendadas/${i.id}/confirmar`,
                                  'Confirmar? O cliente será adicionado à base.',
                                  recarregarAgend,
                                  '✅ Cliente adicionado à base.',
                                )}
                              >
                                ✅ Confirmar
                              </button>
                              <button
                                type="button"
                                className="btn btn-perigo btn-pequeno"
                                disabled={agindo === `/api/instalacoes-agendadas/${i.id}/cancelar`}
                                onClick={() => agir(`/api/instalacoes-agendadas/${i.id}/cancelar`, 'Cancelar este agendamento?', recarregarAgend)}
                              >
                                ❌ Cancelar
                              </button>
                            </>
                          )}
                          {i.status === 'confirmado' && (
                            <button
                              type="button"
                              className="btn btn-ok btn-pequeno"
                              disabled={agindo === `/api/instalacoes-agendadas/${i.id}/concluir`}
                              onClick={() => agir(`/api/instalacoes-agendadas/${i.id}/concluir`, 'Marcar instalação como concluída?', recarregarAgend)}
                            >
                              🏁 Concluir
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        )}
      </Card>
    </div>
  );
}

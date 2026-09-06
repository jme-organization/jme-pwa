// src/pages/promessas.jsx — quem prometeu pagar, e quando.
import React, { useState, useEffect, useCallback } from 'react';
import { Card } from '../components/Card';
import { Spinner } from '../components/Spinner';
import { api } from '../api/client';

const FILTROS = [
  ['pendente', 'Pendentes'],
  ['pago', 'Pagas'],
  ['cancelada', 'Canceladas'],
  ['todos', 'Todas'],
];

const BADGE = { pago: 'badge-pago', cancelada: 'badge-vencida' };
const ROTULO = { pago: 'Paga', cancelada: 'Cancelada' };

// A data chega em tres formatos diferentes conforme a origem do registro.
const formatarData = (valor) => {
  if (!valor) return '—';
  if (valor.includes('/')) {
    const [d, m, y] = valor.split('/');
    return new Date(y, m - 1, d).toLocaleDateString('pt-BR');
  }
  if (valor.includes('-')) {
    const [y, m, d] = valor.split('-').map(Number);
    return new Date(y, m - 1, d).toLocaleDateString('pt-BR');
  }
  const d = new Date(valor);
  return Number.isNaN(d.getTime()) ? valor : d.toLocaleDateString('pt-BR');
};

export function PagePromessas() {
  const [filtro, setFiltro] = useState('pendente');
  const [promessas, setPromessas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');
  const [agindo, setAgindo] = useState(null);

  const carregar = useCallback(async () => {
    setLoading(true);
    setErro('');
    try {
      const url = `/api/promessas${filtro !== 'todos' ? `?status=${filtro}` : ''}`;
      const data = await api.get(url);
      setPromessas(Array.isArray(data) ? data : []);
    } catch (e) {
      setErro(e.message || 'Não consegui carregar as promessas');
      setPromessas([]);
    } finally {
      setLoading(false);
    }
  }, [filtro]);

  useEffect(() => { carregar(); }, [carregar]);

  const agir = async (id, acao, pergunta) => {
    if (!confirm(pergunta)) return;
    setAgindo(id);
    try {
      await api.post(`/api/promessas/${id}/${acao}`);
      await carregar();
    } catch (e) {
      alert(`Não consegui aplicar: ${e.message}`);
    }
    setAgindo(null);
  };

  return (
    <div className="page">
      <div className="page-topo">
        <div>
          <h1 className="page-title">Promessas de pagamento</h1>
          <div className="page-sub">Marcar como paga aqui atualiza o status do cliente na base.</div>
        </div>
        <div className="page-acoes">
          <div className="filtro-group">
            {FILTROS.map(([v, rotulo]) => (
              <button
                key={v}
                type="button"
                className={`filtro-btn ${filtro === v ? 'filtro-ativo' : ''}`}
                onClick={() => setFiltro(v)}
              >
                {rotulo}
              </button>
            ))}
          </div>
          <button type="button" className="btn btn-pequeno" onClick={carregar}>↻ Atualizar</button>
        </div>
      </div>

      {erro && <div className="aviso aviso-erro mb-3">{erro}</div>}

      <Card>
        {loading ? (
          <Spinner />
        ) : promessas.length === 0 ? (
          <div className="vazio">
            <span className="vazio-emoji">🤝</span>
            Nenhuma promessa {filtro !== 'todos' ? FILTROS.find(([v]) => v === filtro)?.[1].toLowerCase() : ''}
          </div>
        ) : (
          <div className="tabela-scroll">
            <table className="tabela">
              <thead>
                <tr><th>Cliente</th><th>Prometeu para</th><th>Vencimento</th><th>Base</th><th>Status</th><th /></tr>
              </thead>
              <tbody>
                {promessas.map(p => (
                  <tr key={p.id}>
                    <td className="td-nome">{p.nome}</td>
                    <td>{formatarData(p.data_promessa)}</td>
                    <td>{p.dia_vencimento ? `Dia ${p.dia_vencimento}` : '—'}</td>
                    <td className="td-muted">{p.base_nome || '—'}</td>
                    <td>
                      <span className={`badge ${BADGE[p.status] || 'badge-pendente'}`}>
                        {ROTULO[p.status] || 'Pendente'}
                      </span>
                    </td>
                    <td className="td-fim">
                      {p.status === 'pendente' ? (
                        <div className="page-acoes" style={{ justifyContent: 'flex-end' }}>
                          <button
                            type="button"
                            className="btn btn-ok btn-pequeno"
                            disabled={agindo === p.id}
                            onClick={() => agir(p.id, 'pago', `Confirmar que ${p.nome} pagou?`)}
                          >
                            💰 Pagou
                          </button>
                          <button
                            type="button"
                            className="btn btn-perigo btn-pequeno"
                            disabled={agindo === p.id}
                            onClick={() => agir(p.id, 'cancelar', `Cancelar a promessa de ${p.nome}?`)}
                          >
                            ❌ Cancelar
                          </button>
                        </div>
                      ) : p.status === 'pago' ? (
                        <span className="dica mt-0">Pago em {formatarData(p.pago_em)}</span>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

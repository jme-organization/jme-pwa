// src/pages/promessas.jsx — quem prometeu pagar, quando, e quem quebrou o combinado.
import React, { useState, useEffect, useCallback } from 'react';
import { Card } from '../components/Card';
import { Spinner } from '../components/Spinner';
import { api } from '../api/client';

// "Vencidas" vem logo depois de "Pendentes" porque e a aba de AGIR: e a lista de
// quem passou da data combinada e ainda nao foi avisado. Ate 21/09/2026 esse
// filtro nao existia e as promessas vencidas do banco nao apareciam em tela
// nenhuma — elas venciam no silencio.
const FILTROS = [
  ['pendente', 'Pendentes'],
  ['vencida', 'Vencidas'],
  ['pago', 'Pagas'],
  ['cancelada', 'Canceladas'],
  ['todos', 'Todas'],
];

const BADGE = { pago: 'badge-pago', cancelada: 'badge-vencida', vencida: 'badge-vencida' };
const ROTULO = { pago: 'Paga', cancelada: 'Cancelada', vencida: 'Vencida' };

// Status do cliente na base, ao lado da promessa. Existe porque dar baixa no SGP
// nao quer dizer que o cliente pagou — o dono as vezes da baixa so pra tirar a
// suspensao de quem esta derrubando. Entao a tela mostra o estado e ele decide.
const BADGE_CLIENTE = {
  pago: 'badge-pago', pendente: 'badge-pendente', promessa: 'badge-promessa',
  isento: 'badge-isento', bloqueado: 'badge-bloqueado', cancelado: 'badge-cancelado',
};

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

const formatarQuando = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('pt-BR') + ' ' + d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
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

  // `ms` explicito porque o aviso nao e uma gravacao: ele busca o titulo no SGP,
  // manda a mensagem, espera 3s e manda as chaves PIX. Nos 10s padrao do client
  // a tela mostraria "o servidor demorou demais" com a mensagem JA entregue ao
  // cliente — o mesmo engano que a baixa dava antes de 08/09/2026.
  const agir = async (id, acao, pergunta, corpo, ms) => {
    if (!confirm(pergunta)) return;
    setAgindo(id);
    try {
      await api.post(`/api/promessas/${id}/${acao}`, corpo, ms);
      await carregar();
    } catch (e) {
      alert(`Não consegui aplicar: ${e.message}`);
    }
    setAgindo(null);
  };

  // O aviso vai com o `cliente_id` que a tela MOSTROU na confirmacao. O servidor
  // resolve de novo e recusa se nao for o mesmo — sem isso, uma mudanca na base
  // entre carregar a lista e clicar mandaria o boleto pro cliente errado.
  const avisar = (p) => {
    const cli = p.cliente;
    const pergunta =
      `Avisar ${cli.nome} que a promessa de ${formatarData(p.data_promessa)} passou?\n\n` +
      `A mensagem vai com o boleto e o PIX.` +
      (cli.status === 'pago' ? `\n\nATENÇÃO: este cliente está marcado como PAGO na base.` : '');
    agir(p.id, 'cobrar', pergunta, { cliente_id: cli.id }, 60000);
  };

  return (
    <div className="page">
      <div className="page-topo">
        <div>
          <h1 className="page-title">Promessas de pagamento</h1>
          <div className="page-sub">
            Marcar como paga aqui atualiza o status do cliente na base. Em <strong>Vencidas</strong>,
            o botão avisa o cliente que o combinado passou — nada é enviado sem o seu clique.
          </div>
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
            {filtro === 'vencida' && <span className="vazio-dica">Ninguém quebrou o combinado. Bom sinal.</span>}
          </div>
        ) : (
          <div className="tabela-scroll">
            <table className="tabela">
              <thead>
                <tr><th>Cliente</th><th>Prometeu para</th><th>Na base</th><th>Vencimento</th><th>Status</th><th /></tr>
              </thead>
              <tbody>
                {promessas.map(p => {
                  const cli = p.cliente;
                  const podeAgir = p.status === 'pendente' || p.status === 'vencida';
                  return (
                    <tr key={p.id}>
                      <td className="td-nome">
                        {p.nome}
                        {p.base_nome && <div className="td-muted">{p.base_nome}</div>}
                      </td>
                      <td>{formatarData(p.data_promessa)}</td>
                      <td>
                        {cli ? (
                          <>
                            <span className={`badge ${BADGE_CLIENTE[cli.status] || 'badge-neutro'}`}>
                              {cli.status || 'pendente'}
                            </span>
                            {cli.nome !== p.nome && <div className="td-muted">{cli.nome}</div>}
                          </>
                        ) : (
                          <span className="badge badge-neutro" title={p.cliente_erro || ''}>sem cliente</span>
                        )}
                      </td>
                      <td>{p.dia_vencimento ? `Dia ${p.dia_vencimento}` : '—'}</td>
                      <td>
                        <span className={`badge ${BADGE[p.status] || 'badge-pendente'}`}>
                          {ROTULO[p.status] || 'Pendente'}
                        </span>
                        {p.cobrado_em && (
                          <div className="td-muted">avisado {formatarQuando(p.cobrado_em)}</div>
                        )}
                      </td>
                      <td className="td-fim">
                        {podeAgir ? (
                          <div className="page-acoes" style={{ justifyContent: 'flex-end' }}>
                            {p.status === 'vencida' && (
                              <button
                                type="button"
                                className="btn btn-roxo btn-pequeno"
                                disabled={agindo === p.id || !cli}
                                title={cli ? '' : (p.cliente_erro || 'Sem cliente na base')}
                                onClick={() => avisar(p)}
                              >
                                📣 {p.cobrado_em ? 'Avisar de novo' : 'Avisar'}
                              </button>
                            )}
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

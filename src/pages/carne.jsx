// src/pages/carne.jsx — carnês: o físico (impresso/entregue) e a renovação no SGP.
import React, { useState } from 'react';
import { useFetch } from '../hooks/useFetch';
import { Card } from '../components/Card';
import { Spinner } from '../components/Spinner';
import { fmtDate, fmtTel, fmtMoeda } from '../utils/formatadores';
import { api } from '../api/client';

const ESTADO = {
  solicitado: { label: 'Solicitado', emoji: '📋', classe: 'badge-pendente' },
  impresso:   { label: 'Impresso',   emoji: '🖨️', classe: 'badge-promessa' },
  entregue:   { label: 'Entregue',   emoji: '🚚', classe: 'badge-info' },
  concluido:  { label: 'Concluído',  emoji: '✅', classe: 'badge-pago' },
};

// ── Aba 1: carnês físicos (o fluxo que já existia) ───────────────
function AbaFisicos() {
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
    <>
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
            Nenhuma solicitação de carnê físico
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
                        <button type="button" className="btn btn-perigo btn-pequeno mt-1" onClick={() => remover(c.id)}>
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
    </>
  );
}

// ── Aba 2: renovação no SGP ──────────────────────────────────────
function AbaRenovacao() {
  const { data, loading, error, refetch } = useFetch('/api/carne/renovacao');
  const [previa, setPrevia] = useState(null);      // { cliente, resultado }
  const [ocupado, setOcupado] = useState(null);
  const [msg, setMsg] = useState(null);

  const clientes = data?.clientes || [];
  const liberados = data?.liberados || [];
  const auto = Boolean(data?.auto);

  // Carnê vazio nem sempre é esquecimento. O dono explicou: tem cliente instável
  // que ele NÃO cobra por carnê de propósito, porque só gera estresse — e esse
  // cliente aparecendo todo dia na lista faz a lista parar de ser lida.
  // Marcar tira da lista e da geração automática, sem apagar nada.
  const liberar = async (cliente, liberado) => {
    if (liberado) {
      const motivo = window.prompt(
        `Não gerar carnê para ${cliente.nome}?\n\n`
        + 'Ele sai desta lista e nunca entra na geração automática. Escreva o motivo (opcional):',
        cliente.motivo || '',
      );
      if (motivo === null) return;
      setOcupado(cliente.id);
      try {
        await api.post('/api/carne/renovacao/liberar', { cliente_id: cliente.id, liberado: true, motivo });
        setMsg({ ok: true, txt: `${cliente.nome} está fora da geração de carnê.` });
        refetch();
      } catch (e) { setMsg({ ok: false, txt: e.message }); }
      setOcupado(null);
      return;
    }

    if (!confirm(`Voltar a cobrar carnê de ${cliente.nome}?`)) return;
    setOcupado(cliente.id);
    try {
      await api.post('/api/carne/renovacao/liberar', { cliente_id: cliente.id, liberado: false });
      setMsg({ ok: true, txt: `${cliente.nome} voltou para a lista.` });
      refetch();
    } catch (e) { setMsg({ ok: false, txt: e.message }); }
    setOcupado(null);
  };

  const alternarAuto = async () => {
    const novo = !auto;
    if (novo && !confirm(
      'Ligar a geração automática?\n\n'
      + 'A partir daí o sistema cria as próximas mensalidades no SGP sozinho, uma vez por dia, '
      + 'para quem estiver com o carnê acabando. São documentos financeiros de verdade.\n\n'
      + 'Recomendado: gerar um cliente na mão primeiro e conferir no SGP.'
    )) return;
    try {
      await api.post('/api/carne/renovacao/auto', { ligado: novo });
      refetch();
    } catch (e) { setMsg({ ok: false, txt: e.message }); }
  };

  const conferir = async (cliente) => {
    setOcupado(cliente.id);
    setMsg(null);
    try {
      const r = await api.post('/api/carne/renovacao/gerar', {
        cliente_id: cliente.id,
        contrato: cliente.contrato,
        cpf: cliente.cpf,
        quantidade: data?.quantidadePadrao || 10,
        simular: true,
      }, 60000);
      setPrevia({ cliente, resultado: r });
    } catch (e) {
      setMsg({ ok: false, txt: e.message });
    }
    setOcupado(null);
  };

  const gerarDeVerdade = async () => {
    if (!previa) return;
    const quantas = previa.resultado?.criadas?.length || 0;
    if (!confirm(
      `Gerar ${quantas} mensalidade(s) no SGP para ${previa.cliente.nome}?\n\n`
      + 'Isto cria boletos de verdade, no valor do contrato.'
    )) return;

    setOcupado(previa.cliente.id);
    try {
      const r = await api.post('/api/carne/renovacao/gerar', {
        cliente_id: previa.cliente.id,
        contrato: previa.cliente.contrato,
        cpf: previa.cliente.cpf,
        quantidade: quantas || (data?.quantidadePadrao || 10),
        simular: false,
      }, 120000);
      setPrevia(null);
      const restantes = r.diagnostico?.futuros;
      setMsg(r.ok
        ? {
            ok: true,
            txt: `✅ ${r.criadas.length} mensalidade(s) criada(s) para ${previa.cliente.nome}.`
              + (Number.isFinite(restantes) ? ` Agora ele tem ${restantes} mês(es) de carnê pela frente.` : ''),
          }
        : { ok: false, txt: `Criei ${r.criadas.length} e parei: ${r.erros?.[0]?.erro || 'erro no SGP'}` });
      // O backend relê os títulos e já atualiza a lista, então o refetch mostra
      // o resultado na hora — antes a tela ficava dizendo "sem boleto futuro"
      // até a rodada de 30 min passar, e parecia que a geração não funcionou.
      refetch();
    } catch (e) {
      setMsg({ ok: false, txt: e.message });
    }
    setOcupado(null);
  };

  if (loading) return <Spinner />;

  if (error || data?.sgpAtivo === false) {
    return (
      <div className="aviso aviso-alerta">
        <span className="aviso-emoji">🔌</span>
        <span className="aviso-corpo">
          Integração com o SGP indisponível
          <span className="aviso-detalhe">
            {error ? 'O servidor não respondeu esta rota — talvez o backend ainda não tenha sido publicado.' : 'Faltam SGP_APP/SGP_TOKEN no servidor.'}
          </span>
        </span>
      </div>
    );
  }

  return (
    <>
      <div className={`aviso ${auto ? 'aviso-ok' : 'aviso-info'} mb-3`}>
        <span className="aviso-emoji">{auto ? '🤖' : '✋'}</span>
        <span className="aviso-corpo">
          {auto
            ? 'Geração automática LIGADA — o sistema renova sozinho, uma vez por dia.'
            : 'Geração automática desligada — hoje quem gera é você, no botão.'}
          <span className="aviso-detalhe">
            Ligue depois de gerar um cliente na mão e conferir os boletos no SGP. Criar mensalidade é escrita no financeiro.
          </span>
        </span>
        <button type="button" className={`btn btn-pequeno linha-fim ${auto ? 'btn-perigo' : 'btn-ok'}`} onClick={alternarAuto}>
          {auto ? 'Desligar' : 'Ligar automático'}
        </button>
      </div>

      {msg && <div className={`aviso ${msg.ok ? 'aviso-ok' : 'aviso-erro'} mb-3`}>{msg.txt}</div>}

      <Card>
        <div className="card-cab">
          <span className="card-titulo">
            Carnê acabando ({clientes.length})
          </span>
          <span className="dica linha-fim mt-0">
            {data?.lido_em ? `conferido em ${fmtDate(data.lido_em)}` : 'ainda não conferido'} · limiar: {data?.limiar ?? 2} meses
          </span>
        </div>

        {clientes.length === 0 ? (
          <div className="vazio">
            <span className="vazio-emoji">✅</span>
            Ninguém com o carnê acabando
            <span className="vazio-dica">
              A conferência roda junto da sincronização com o SGP, a cada 30 minutos.
            </span>
          </div>
        ) : clientes.map(c => (
          <div key={c.id} className="carne-linha">
            <span className="carne-nome">{c.nome}</span>
            <span className={`badge ${c.futuros === 0 ? 'badge-inadimplente' : 'badge-pendente'}`}>
              {c.futuros === 0 ? 'sem boleto futuro' : `${c.futuros} mês(es) restando`}
            </span>
            <span className="carne-meta">
              {c.ultimoVencimento ? `até ${String(c.ultimoVencimento).split('-').reverse().join('/')}` : 'nenhum em aberto'}
              {c.valorReferencia ? ` · carnê de ${fmtMoeda(c.valorReferencia)}` : ''}
              {c.vencidosEmAberto ? ` · ${c.vencidosEmAberto} vencido(s)` : ''}
            </span>
            {/* O SGP gera com o valor do CONTRATO, não com o do último carnê.
                Quando os dois divergem, o dono precisa saber ANTES de gerar. */}
            {c.valorContrato && c.valorReferencia && Math.abs(c.valorContrato - c.valorReferencia) >= 0.01 && (
              <span className="badge badge-bloqueado" title="O SGP gera pelo valor do contrato. Ajuste o contrato no SGP se quiser outro valor.">
                contrato {fmtMoeda(c.valorContrato)} ≠ carnê {fmtMoeda(c.valorReferencia)}
              </span>
            )}
            <div className="page-acoes linha-fim">
              <button
                type="button"
                className="btn btn-pequeno"
                disabled={ocupado === c.id}
                title="Cliente que você não cobra por carnê: some desta lista e nunca entra na geração automática"
                onClick={() => liberar(c, true)}
              >
                Não gerar
              </button>
              <button
                type="button"
                className="btn btn-info btn-pequeno"
                disabled={ocupado === c.id || !c.contrato}
                title={c.contrato ? 'Ver o que seria criado' : 'Cliente sem contrato do SGP identificado'}
                onClick={() => conferir(c)}
              >
                {ocupado === c.id ? 'Conferindo…' : 'Conferir e gerar'}
              </button>
            </div>
          </div>
        ))}
      </Card>

      {liberados.length > 0 && (
        <Card className="mt-3">
          <div className="card-cab">
            <span className="card-titulo">Fora da geração ({liberados.length})</span>
            <span className="dica linha-fim mt-0">
              Clientes que você não cobra por carnê — nunca entram na geração automática.
            </span>
          </div>
          {liberados.map(c => (
            <div key={c.id} className="carne-linha">
              <span className="carne-nome">{c.nome}</span>
              <span className="badge badge-isento">fora da geração</span>
              <span className="carne-meta">
                {c.motivo || 'sem motivo anotado'}
                {c.liberado_em ? ` · desde ${fmtDate(c.liberado_em)}` : ''}
              </span>
              <button
                type="button"
                className="btn btn-pequeno linha-fim"
                disabled={ocupado === c.id}
                onClick={() => liberar(c, false)}
              >
                Voltar a cobrar
              </button>
            </div>
          ))}
        </Card>
      )}

      {previa && (
        <div className="modal-overlay" onClick={() => setPrevia(null)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div className="modal-title">Renovar o carnê de {previa.cliente.nome}</div>

            {previa.resultado?.criadas?.length ? (
              <>
                <div className="dica mt-0">
                  Seriam criadas estas {previa.resultado.criadas.length} mensalidades:
                </div>
                <div className="linha g-1 mt-1">
                  {previa.cliente.valorContrato && (
                    <span className="badge badge-info">
                      o SGP vai gerar a {fmtMoeda(previa.cliente.valorContrato)} (valor do contrato)
                    </span>
                  )}
                  {previa.cliente.valorReferencia && (
                    <span className="badge badge-neutro">
                      carnê de hoje: {fmtMoeda(previa.cliente.valorReferencia)}
                    </span>
                  )}
                </div>
                <div className="previa-competencias">
                  {previa.resultado.criadas.map(c => (
                    <span key={c.competencia} className="badge badge-info">{c.competencia}</span>
                  ))}
                </div>
                {previa.cliente.valorContrato && previa.cliente.valorReferencia
                  && Math.abs(previa.cliente.valorContrato - previa.cliente.valorReferencia) >= 0.01 && (
                  <div className="aviso aviso-erro mt-3">
                    <span className="aviso-emoji">💰</span>
                    <span className="aviso-corpo">
                      O valor vai sair diferente do último carnê
                      <span className="aviso-detalhe">
                        O SGP gera pelo contrato ({fmtMoeda(previa.cliente.valorContrato)}), e o carnê
                        dele hoje é {fmtMoeda(previa.cliente.valorReferencia)}. Para gerar no valor certo,
                        ajuste o plano do contrato no SGP antes.
                      </span>
                    </span>
                  </div>
                )}

                <div className="aviso aviso-alerta mt-3">
                  <span className="aviso-emoji">⚠️</span>
                  <span className="aviso-corpo">
                    Isto escreve no financeiro do SGP
                    <span className="aviso-detalhe">
                      Competência que já tem título é pulada, então apertar duas vezes não duplica.
                    </span>
                  </span>
                </div>
              </>
            ) : (
              <div className="vazio vazio-curto">
                <span className="vazio-emoji">🤷</span>
                Nada a gerar: as próximas competências já existem.
              </div>
            )}

            <div className="modal-footer">
              <button type="button" className="btn" onClick={() => setPrevia(null)}>Fechar</button>
              {previa.resultado?.criadas?.length > 0 && (
                <button
                  type="button"
                  className="btn btn-primario"
                  disabled={ocupado === previa.cliente.id}
                  onClick={gerarDeVerdade}
                >
                  {ocupado === previa.cliente.id ? 'Gerando…' : 'Gerar de verdade'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export function PageCarne() {
  const [aba, setAba] = useState('renovacao');

  return (
    <div className="page">
      <div className="page-topo">
        <div>
          <h1 className="page-title">Carnês</h1>
          <div className="page-sub">
            Quem está ficando sem boleto, e as solicitações de carnê impresso.
          </div>
        </div>
      </div>

      <div className="abas">
        <button
          type="button"
          className={`aba ${aba === 'renovacao' ? 'aba-ativa' : ''}`}
          onClick={() => setAba('renovacao')}
        >
          🔄 Renovação
        </button>
        <button
          type="button"
          className={`aba ${aba === 'fisicos' ? 'aba-ativa' : ''}`}
          onClick={() => setAba('fisicos')}
        >
          📋 Carnês físicos
        </button>
      </div>

      {aba === 'renovacao' ? <AbaRenovacao /> : <AbaFisicos />}
    </div>
  );
}

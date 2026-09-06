// src/pages/conversas.jsx — a caixa de entrada do WhatsApp.
//
// O bot sempre falou e nunca escutou: a resposta do cliente ("já paguei",
// "manda o boleto", "tá sem internet") morria no celular do dono. Esta tela é
// onde ela aparece. Nada aqui responde sozinho — quem responde é uma pessoa.
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiSend, FiCheck, FiTool, FiRefreshCw } from 'react-icons/fi';
import { useSSEData } from '../hooks/useSSEData';
import { Card } from '../components/Card';
import { Spinner } from '../components/Spinner';
import { BadgeCliente } from '../components/BadgeCliente';
import { fmtDate, fmtTel, paraData } from '../utils/formatadores';
import { api } from '../api/client';

const horaCurta = (valor) => {
  const d = paraData(valor);
  if (!d) return '';
  const hoje = new Date();
  const mesmoDia = d.toDateString() === hoje.toDateString();
  return mesmoDia
    ? d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    : d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
};

export function PageConversas() {
  const navigate = useNavigate();
  const { data, loading, error, refetch } = useSSEData('/api/conversas', 'conversas');

  const [aberta, setAberta] = useState(null);      // número da conversa aberta
  const [mensagens, setMensagens] = useState([]);
  const [carregandoMsg, setCarregandoMsg] = useState(false);
  const [texto, setTexto] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [erroEnvio, setErroEnvio] = useState(null);
  // 'abertas' (padrão) | 'nao_lidas' | 'resolvidas'
  // Resolvida some da lista: o dono pediu — a conversa continua no WhatsApp
  // dele, aqui ela sai do caminho pra lista mostrar só o que falta responder.
  const [aba, setAba] = useState('abertas');
  const fimRef = useRef(null);

  const conversas = data?.conversas || [];
  const resolvidas = conversas.filter(c => c.status === 'resolvida');
  const visiveis = aba === 'resolvidas' ? resolvidas
    : aba === 'nao_lidas' ? conversas.filter(c => Number(c.nao_lidas || 0) > 0 && c.status !== 'resolvida')
    : conversas.filter(c => c.status !== 'resolvida');
  const conversaAtual = conversas.find(c => c.numero === aberta) || null;

  const carregarMensagens = useCallback(async (numero, { silencioso = false } = {}) => {
    if (!numero) return;
    if (!silencioso) setCarregandoMsg(true);
    try {
      const r = await api.get(`/api/conversas/${numero}/mensagens`);
      setMensagens(r?.mensagens || []);
    } catch (e) {
      setErroEnvio(e.message || 'Não consegui carregar a conversa');
    }
    if (!silencioso) setCarregandoMsg(false);
  }, []);

  const abrir = async (conversa) => {
    setAberta(conversa.numero);
    setErroEnvio(null);
    setTexto('');
    await carregarMensagens(conversa.numero);
    if (Number(conversa.nao_lidas || 0) > 0) {
      try {
        await api.post(`/api/conversas/${conversa.numero}/lida`);
        refetch();
      } catch (_) { /* marcar como lida não pode atrapalhar a leitura */ }
    }
  };

  // Mensagem nova chegou pelo SSE: se for da conversa aberta, recarrega a thread.
  useEffect(() => {
    if (aberta) carregarMensagens(aberta, { silencioso: true });
  }, [data, aberta, carregarMensagens]);

  useEffect(() => {
    fimRef.current?.scrollIntoView({ block: 'end' });
  }, [mensagens]);

  const responder = async (e) => {
    e?.preventDefault();
    const conteudo = texto.trim();
    if (!conteudo || !aberta || enviando) return;
    setEnviando(true);
    setErroEnvio(null);
    try {
      await api.post(`/api/conversas/${aberta}/responder`, { texto: conteudo }, 60000);
      setTexto('');
      await carregarMensagens(aberta, { silencioso: true });
      refetch();
    } catch (e2) {
      setErroEnvio(e2.message || 'Não consegui enviar');
    }
    setEnviando(false);
  };

  // Resolver fecha a conversa na tela e some da lista — no WhatsApp ela continua
  // lá, intacta. Reabrir é um clique na aba "Resolvidas".
  const resolver = async () => {
    if (!aberta) return;
    const eraResolvida = conversaAtual?.status === 'resolvida';
    try {
      await api.post(`/api/conversas/${aberta}/status`, {
        status: eraResolvida ? 'aberta' : 'resolvida',
      });
      if (!eraResolvida) setAberta(null);
      refetch();
    } catch (e) { setErroEnvio(e.message); }
  };

  const abrirChamado = async () => {
    if (!aberta) return;
    if (!confirm('Abrir um chamado de suporte a partir desta conversa?')) return;
    try {
      await api.post(`/api/conversas/${aberta}/chamado`, {});
      alert('✅ Chamado aberto.');
      navigate('/chamados');
    } catch (e) { setErroEnvio(e.message); }
  };

  return (
    <div className="page page-larga">
      <div className="page-topo">
        <div>
          <h1 className="page-title">Atendimentos</h1>
          <div className="page-sub">
            O que os clientes respondem no WhatsApp. Nada é respondido automaticamente — quem responde é você.
          </div>
        </div>
        <div className="page-acoes">
          <div className="filtro-group">
            {[
              ['abertas', 'Abertas'],
              ['nao_lidas', 'Não lidas'],
              ['resolvidas', `Resolvidas${resolvidas.length ? ` (${resolvidas.length})` : ''}`],
            ].map(([v, rotulo]) => (
              <button
                key={v}
                type="button"
                className={`filtro-btn ${aba === v ? 'filtro-ativo' : ''}`}
                onClick={() => { setAba(v); setAberta(null); }}
              >
                {rotulo}
              </button>
            ))}
          </div>
          <button type="button" className="btn btn-pequeno" onClick={refetch}>
            <FiRefreshCw /> Atualizar
          </button>
        </div>
      </div>

      {error && (
        <div className="aviso aviso-erro mb-3">
          <span className="aviso-emoji">📡</span>
          <span className="aviso-corpo">
            Não consegui falar com o servidor
            <span className="aviso-detalhe">
              Se o painel acabou de ser publicado, o backend ainda pode estar sem esta parte no ar.
            </span>
          </span>
        </div>
      )}

      <div className="inbox">
        <Card className="inbox-lista">
          {loading && !conversas.length ? (
            <Spinner />
          ) : visiveis.length === 0 ? (
            <div className="vazio">
              <span className="vazio-emoji">📭</span>
              {aba === 'resolvidas' ? 'Nenhuma conversa resolvida'
                : aba === 'nao_lidas' ? 'Nenhuma conversa sem resposta'
                : 'Nenhuma conversa aberta'}
              <span className="vazio-dica">
                {aba === 'abertas'
                  ? 'As mensagens que os clientes mandarem para o número do bot aparecem aqui. O que você resolve sai da lista.'
                  : 'As conversas resolvidas continuam no seu WhatsApp — aqui elas só saem do caminho.'}
              </span>
            </div>
          ) : visiveis.map(c => (
            <button
              key={c.numero}
              type="button"
              className={`inbox-item ${aberta === c.numero ? 'inbox-item-ativo' : ''} ${Number(c.nao_lidas || 0) > 0 ? 'inbox-item-novo' : ''}`}
              onClick={() => abrir(c)}
            >
              <div className="linha">
                <span className="inbox-nome">
                  {c.cliente_nome || c.nome_contato || fmtTel(c.numero)}
                </span>
                <span className="inbox-hora linha-fim">{horaCurta(c.ultima_em)}</span>
              </div>
              <div className="inbox-previa">
                {c.ultima_direcao === 'saida' && <span className="inbox-eu">Você: </span>}
                {c.ultima_mensagem || '—'}
              </div>
              <div className="linha g-1">
                {c.cliente_status && <BadgeCliente status={c.cliente_status} />}
                {!c.cliente_id && <span className="badge badge-neutro">fora da base</span>}
                {c.status === 'resolvida' && <span className="badge badge-pago">resolvida</span>}
                {Number(c.nao_lidas || 0) > 0 && (
                  <span className="badge badge-inadimplente linha-fim">{c.nao_lidas}</span>
                )}
              </div>
            </button>
          ))}
        </Card>

        <Card className="inbox-thread">
          {!conversaAtual ? (
            <div className="vazio">
              <span className="vazio-emoji">💬</span>
              Escolha uma conversa
              <span className="vazio-dica">A resposta sai do número do bot, o mesmo que cobra.</span>
            </div>
          ) : (
            <>
              <div className="card-cab">
                <div>
                  <div className="card-titulo">
                    {conversaAtual.cliente_nome || conversaAtual.nome_contato || fmtTel(conversaAtual.numero)}
                  </div>
                  <div className="dica">
                    {fmtTel(conversaAtual.numero)}
                    {conversaAtual.cliente_id ? ' · cliente da base' : ' · não está na base'}
                  </div>
                </div>
                <div className="page-acoes linha-fim">
                  {conversaAtual.cliente_id && (
                    <button
                      type="button"
                      className="btn btn-pequeno"
                      onClick={() => navigate(`/clientes?base=${conversaAtual.base_id}&cliente=${conversaAtual.cliente_id}`)}
                    >
                      Abrir ficha
                    </button>
                  )}
                  <button type="button" className="btn btn-alerta btn-pequeno" onClick={abrirChamado}>
                    <FiTool /> Virar chamado
                  </button>
                  <button
                    type="button"
                    className={`btn btn-pequeno ${conversaAtual.status === 'resolvida' ? '' : 'btn-ok'}`}
                    onClick={resolver}
                    title={conversaAtual.status === 'resolvida'
                      ? 'Voltar para a lista de abertas'
                      : 'Sai da lista; a conversa continua no seu WhatsApp'}
                  >
                    <FiCheck /> {conversaAtual.status === 'resolvida' ? 'Reabrir' : 'Resolvida'}
                  </button>
                </div>
              </div>

              <div className="inbox-mensagens">
                {carregandoMsg ? <Spinner /> : mensagens.length === 0 ? (
                  <div className="vazio vazio-curto">Nenhuma mensagem registrada</div>
                ) : mensagens.map(m => (
                  <div key={m.id} className={`balao ${m.direcao === 'saida' ? 'balao-saida' : 'balao-entrada'}`}>
                    {m.texto ? <span className="balao-texto">{m.texto}</span> : <span className="balao-anexo">📎 {m.tipo}</span>}
                    <span className="balao-hora">{fmtDate(m.criado_em)}</span>
                  </div>
                ))}
                <div ref={fimRef} />
              </div>

              {erroEnvio && <div className="aviso aviso-erro">{erroEnvio}</div>}

              <form className="inbox-responder" onSubmit={responder}>
                <textarea
                  className="entrada"
                  rows={2}
                  placeholder="Escreva a resposta…"
                  value={texto}
                  onChange={e => setTexto(e.target.value)}
                  onKeyDown={e => {
                    // Enter envia, Shift+Enter quebra linha — é o que a mão já espera.
                    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); responder(e); }
                  }}
                />
                <button type="submit" className="btn btn-primario" disabled={enviando || !texto.trim()}>
                  <FiSend /> {enviando ? 'Enviando…' : 'Responder'}
                </button>
              </form>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}

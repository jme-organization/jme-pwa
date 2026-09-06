// src/components/PainelDatas.jsx — as faturas do cliente, mes a mes.
import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../api/client';
import { fmtMoeda } from '../utils/formatadores';

const FORMAS = ['pix', 'boleto', 'dinheiro', 'cartão', 'carnê', 'efi'];

const ESTADO = {
  pago:         { icone: '✅', label: 'Pago',        classe: 'badge-pago' },
  isento:       { icone: '🆓', label: 'Isento',      classe: 'badge-isento' },
  pendente:     { icone: '⏳', label: 'Pendente',    classe: 'badge-pendente' },
  inadimplente: { icone: '❌', label: 'Inadimplente', classe: 'badge-inadimplente' },
  promessa:     { icone: '🤝', label: 'Promessa',    classe: 'badge-promessa' },
  aberto:       { icone: '📅', label: 'Em aberto',   classe: 'badge-neutro' },
};

// Valor do plano: o texto do plano ja traz o preco ("Fibra 200MB — R$60").
const valorDoPlano = (plano) => {
  if (!plano) return null;
  const m = plano.match(/R\$\s*(\d+)/i);
  if (m) return parseInt(m[1], 10);
  const p = plano.toLowerCase();
  if (p.includes('iptv')) return 70;
  if (p.includes('200') || p.includes('fibra')) return 60;
  if (p.includes('50') || p.includes('cabo')) return 50;
  return null;
};

export const PainelDatas = ({ clienteId, diaVencimento, plano, onStatusChange }) => {
  const [historico, setHistorico] = useState(null);
  const [baixando, setBaixando] = useState(null);
  const [modalForma, setModalForma] = useState(null);
  const [erro, setErro] = useState(null);

  const carregar = useCallback(async () => {
    try {
      setErro(null);
      setHistorico(await api.get(`/api/clientes/${clienteId}/historico`));
    } catch (e) {
      setErro(e.message || 'Não consegui carregar o histórico');
      setHistorico({ historico: [] });
    }
  }, [clienteId]);

  useEffect(() => { carregar(); }, [carregar]);

  const hoje = new Date();
  const refHoje = `${String(hoje.getMonth() + 1).padStart(2, '0')}/${hoje.getFullYear()}`;

  // 3 meses atras + o atual + 11 a frente.
  const refs = [];
  for (let i = -3; i < 12; i++) {
    const d = new Date(hoje.getFullYear(), hoje.getMonth() + i, 1);
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const ultimoDia = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
    refs.push({
      ref: `${mm}/${d.getFullYear()}`,
      dia: String(Math.min(diaVencimento || 10, ultimoDia)).padStart(2, '0'),
      mm,
      passado: i < 0,
      atual: i === 0,
    });
  }

  const confirmarBaixa = async (ref, forma) => {
    setModalForma(null);
    setBaixando(ref);
    setErro(null);
    try {
      await api.post(`/api/clientes/${clienteId}/historico/${encodeURIComponent(ref)}/pagar`, {
        forma_pagamento: forma || null,
      });
      await carregar();
      onStatusChange?.('pago');
    } catch (e) {
      setErro(`Não consegui dar baixa: ${e.message}`);
    }
    setBaixando(null);
  };

  const reverter = async (ref) => {
    if (!confirm(`Reverter a baixa de ${ref}?`)) return;
    setBaixando(`${ref}_rev`);
    setErro(null);
    try {
      await api.post(`/api/clientes/${clienteId}/historico/${encodeURIComponent(ref)}/reverter`, {});
      await carregar();
      onStatusChange?.('pendente');
    } catch (e) {
      setErro(`Não consegui reverter: ${e.message}`);
    }
    setBaixando(null);
  };

  if (!historico) return <div className="spinner-wrap"><div className="spinner" /></div>;

  const porRef = {};
  (historico.historico || []).forEach(h => { porRef[h.referencia] = h; });

  const valor = valorDoPlano(plano);
  const atual = porRef[refHoje];
  const estAtual = ESTADO[atual?.status || 'pendente'] || ESTADO.pendente;
  const infoAtual = refs.find(r => r.atual);

  const pagos = (historico.historico || []).filter(h => h.status === 'pago' || h.status === 'isento');

  return (
    <div>
      {erro && <div className="aviso aviso-erro mb-2">{erro}</div>}

      {modalForma && (
        <div className="modal-overlay" onClick={() => setModalForma(null)}>
          <div className="modal-box modal-estreito" onClick={e => e.stopPropagation()}>
            <div className="modal-title">Forma de pagamento</div>
            <div className="dica" style={{ marginTop: 0, marginBottom: 12 }}>Fatura {modalForma}</div>
            <div className="formas">
              {FORMAS.map(f => (
                <button key={f} type="button" className="btn btn-info" onClick={() => confirmarBaixa(modalForma, f)}>
                  {f}
                </button>
              ))}
            </div>
            <button type="button" className="btn btn-bloco mt-2" onClick={() => confirmarBaixa(modalForma, null)}>
              Sem forma registrada
            </button>
            <button type="button" className="btn btn-fantasma btn-bloco mt-1" onClick={() => setModalForma(null)}>
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Fatura do mês */}
      <div className={`fatura-atual ${estAtual.classe}`}>
        <div>
          <div className="rotulo">Fatura atual</div>
          <div className="fatura-data">{infoAtual?.dia}/{refHoje}</div>
          {atual?.pago_em && atual.status !== 'isento' && (
            <div className="dica">
              Pago em {new Date(atual.pago_em).toLocaleDateString('pt-BR')}
              {atual.forma_pagamento ? ` · ${atual.forma_pagamento.toUpperCase()}` : ''}
            </div>
          )}
          {valor && <div className="fatura-valor">{fmtMoeda(valor)}</div>}
        </div>

        <div className="fatura-acao">
          <span className="badge">{estAtual.icone} {estAtual.label}</span>
          {atual?.status === 'isento' ? (
            <span className="dica">Mês de instalação</span>
          ) : atual?.status === 'pago' ? (
            <button type="button" className="btn btn-perigo btn-pequeno" onClick={() => reverter(refHoje)} disabled={!!baixando}>
              ↩ Reverter
            </button>
          ) : (
            <button type="button" className="btn btn-ok" onClick={() => setModalForma(refHoje)} disabled={!!baixando}>
              {baixando === refHoje ? '…' : '✅ Dar baixa'}
            </button>
          )}
        </div>
      </div>

      {/* Meses anteriores */}
      <div className="rotulo mt-4">Meses anteriores</div>
      <div className="pilha-fina">
        {refs.filter(r => r.passado).map(({ ref }) => {
          const h = porRef[ref];
          const st = ESTADO[h?.status || 'aberto'] || ESTADO.aberto;
          const quitado = h?.status === 'pago' || h?.status === 'isento';
          return (
            <div key={ref} className="fatura-linha">
              <span className="fatura-ref">{ref}</span>
              <span className="fatura-meio">
                {h?.pago_em
                  ? `Pago em ${new Date(h.pago_em).toLocaleDateString('pt-BR')}${h.forma_pagamento ? ` · ${h.forma_pagamento.toUpperCase()}` : ''}`
                  : !h ? 'Sem registro' : ''}
              </span>
              <span className={`badge ${st.classe}`}>{st.icone} {st.label}</span>
              {quitado ? (
                h.status !== 'isento' && (
                  <button type="button" className="btn btn-perigo btn-pequeno" onClick={() => reverter(ref)} disabled={!!baixando}>↩</button>
                )
              ) : (
                <button type="button" className="btn btn-ok btn-pequeno" onClick={() => setModalForma(ref)} disabled={!!baixando}>
                  {baixando === ref ? '…' : '✅ Baixa'}
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Próximas faturas — adiantar pagamento é caso real (8 clientes em 09/2026) */}
      <div className="rotulo mt-4">Próximas faturas</div>
      <div className="futuras">
        {refs.filter(r => !r.passado && !r.atual).slice(0, 9).map(({ ref, dia, mm }) => {
          const h = porRef[ref];
          const st = ESTADO[h?.status || 'aberto'] || ESTADO.aberto;
          const travada = h?.status === 'pago' || h?.status === 'isento';
          return (
            <button
              key={ref}
              type="button"
              className={`futura ${st.classe}`}
              disabled={travada || !!baixando}
              title={travada ? `${ref} já quitada` : `Adiantar ${ref}`}
              onClick={() => setModalForma(ref)}
            >
              <span className="futura-ref">{dia}/{mm}</span>
              <span>{baixando === ref ? '…' : st.icone}</span>
            </button>
          );
        })}
      </div>

      {pagos.length > 0 && (
        <>
          <div className="rotulo mt-4">Histórico de pagamentos</div>
          <div className="pilha-fina historico-lista">
            {pagos.map(h => {
              const isento = h.status === 'isento';
              return (
                <div key={h.id || h.referencia} className="fatura-linha">
                  <span className="fatura-ref">{h.referencia}</span>
                  <span className="fatura-meio">
                    {isento ? '🆓 Isento — mês de instalação' : (
                      <>
                        {valor && <b>{fmtMoeda(valor)}</b>}
                        {h.forma_pagamento && <span className="badge badge-info">{h.forma_pagamento.toUpperCase()}</span>}
                        {h.pago_em && <span className="dica">{new Date(h.pago_em).toLocaleDateString('pt-BR')}</span>}
                      </>
                    )}
                  </span>
                  {!isento && (
                    <button type="button" className="btn btn-perigo btn-pequeno" onClick={() => reverter(h.referencia)} disabled={!!baixando}>↩</button>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};

// src/components/PainelRede.jsx — estado da rede que o bot conta pro cliente.
import React, { useState, useEffect } from 'react';
import { Card } from './Card';
import { api } from '../api/client';

const REDE = {
  normal:        { label: 'Normal',        emoji: '🟢', classe: 'badge-pago' },
  instavel:      { label: 'Instável',      emoji: '⚠️', classe: 'badge-pendente' },
  manutencao:    { label: 'Manutenção',    emoji: '🔧', classe: 'badge-pendente' },
  fibra_rompida: { label: 'Fibra rompida', emoji: '🔴', classe: 'badge-vencida' },
};

export const PainelRede = ({ situacaoRede: inicial, previsaoRetorno: prevInicial }) => {
  const [status, setStatus] = useState(inicial || 'normal');
  const [previsao, setPrevisao] = useState(prevInicial === 'sem previsão' ? '' : prevInicial || '');
  const [motivo, setMotivo] = useState('');
  const [salvando, setSalvando] = useState(false);
  const [msg, setMsg] = useState(null);

  // Busca o estado real ao montar — nao depende do SSE chegar a tempo.
  useEffect(() => {
    api.get('/api/rede')
      .then(d => {
        if (!d) return;
        setStatus(d.situacaoRede || 'normal');
        setPrevisao(d.previsaoRetorno === 'sem previsão' ? '' : d.previsaoRetorno || '');
        setMotivo(d.motivoRede || '');
      })
      .catch(() => { /* a tela ja mostra o ultimo estado conhecido */ });
  }, []);

  // Outro admin mudou o estado: o SSE traz e a tela acompanha.
  useEffect(() => { if (inicial) setStatus(inicial); }, [inicial]);
  useEffect(() => {
    if (prevInicial && prevInicial !== 'sem previsão') setPrevisao(prevInicial);
  }, [prevInicial]);

  const salvar = async () => {
    setSalvando(true);
    setMsg(null);
    try {
      await api.post('/api/rede', { status, previsao: previsao || 'sem previsão', motivo: motivo || '' });
      setMsg({ ok: true, txt: 'Estado atualizado.' });
    } catch (e) {
      setMsg({ ok: false, txt: e.message || 'Não consegui salvar.' });
    }
    setSalvando(false);
    setTimeout(() => setMsg(null), 4000);
  };

  const info = REDE[status] || REDE.normal;
  const anormal = status !== 'normal';

  return (
    <Card className="card-pad">
      <div className="linha mb-2">
        <span className="card-titulo">📡 Estado da rede</span>
        <span className={`badge ${info.classe} linha-fim`}>{info.emoji} {info.label}</span>
      </div>

      <div className="opcoes mb-3">
        {Object.entries(REDE).map(([valor, cfg]) => (
          <button
            key={valor}
            type="button"
            className={`opcao ${status === valor ? 'opcao-ativa' : ''}`}
            onClick={() => setStatus(valor)}
          >
            {cfg.emoji} {cfg.label}
          </button>
        ))}
      </div>

      {anormal && (
        <>
          <div className="campo">
            <label className="rotulo" htmlFor="rede-previsao">Previsão de retorno</label>
            <input
              id="rede-previsao"
              className="entrada"
              placeholder="Ex: hoje às 18h"
              value={previsao}
              onChange={e => setPrevisao(e.target.value)}
            />
          </div>

          <div className="campo">
            <label className="rotulo" htmlFor="rede-motivo">Motivo — o cliente lê isto</label>
            <textarea
              id="rede-motivo"
              className="entrada"
              rows={2}
              placeholder="Ex: rompimento de fibra na Rua X. Equipe a caminho."
              value={motivo}
              onChange={e => setMotivo(e.target.value)}
            />
          </div>
        </>
      )}

      <div className="linha">
        <button type="button" className="btn btn-primario btn-pequeno" onClick={salvar} disabled={salvando}>
          {salvando ? 'Salvando…' : 'Salvar estado'}
        </button>
        {msg && (
          <span className={`dica ${msg.ok ? 'val-ok' : 'val-erro'}`} style={{ marginTop: 0 }}>
            {msg.ok ? '✅' : '❌'} {msg.txt}
          </span>
        )}
      </div>
    </Card>
  );
};

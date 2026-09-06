// src/components/ficha/AbaCobranca.jsx — em que dias este cliente é avisado.
//
// O último dia depois do vencimento vem destacado em vermelho: é o que leva o
// cliente ao risco de suspensão, e quem mexe aqui precisa enxergar isso.
import React, { useState } from 'react';
import { Recado } from './Recado';

export function AbaCobranca({
  offsets, setOffsets, temConfigPropria,
  configMsg, salvarConfig, removerConfig, salvandoConfig,
  cobrarMsg, cobrarAgora, cobrando,
}) {
  const [novoOffset, setNovoOffset] = useState('');

  const antes = offsets.filter(o => o < 0).sort((a, b) => b - a);
  const depois = offsets.filter(o => o >= 0).sort((a, b) => a - b);
  const ultimo = depois[depois.length - 1];

  const remover = (o) => setOffsets(offsets.filter(x => x !== o));

  const adicionar = () => {
    const n = parseInt(novoOffset, 10);
    if (!Number.isNaN(n) && !offsets.includes(n)) setOffsets([...offsets, n].sort((a, b) => a - b));
    setNovoOffset('');
  };

  return (
    <div>
      <div className="dica mb-3">
        Em quais dias, contados do vencimento, este cliente é avisado. Sem configuração
        própria ele segue o calendário padrão da base.
      </div>

      <div className="campo">
        <span className="rotulo">🔔 Antes do vencimento</span>
        {antes.length === 0 ? (
          <div className="dica">Nenhum aviso antes.</div>
        ) : (
          <div className="linha g-1">
            {antes.map(o => (
              <span key={o} className="ficha ficha-info">
                {o}d
                <button type="button" onClick={() => remover(o)} aria-label={`Remover ${o}`}>✕</button>
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="campo">
        <span className="rotulo">⚠️ Depois do vencimento</span>
        {depois.length === 0 ? (
          <div className="dica">Nenhuma cobrança de atraso.</div>
        ) : (
          <div className="linha g-1">
            {depois.map(o => (
              <span key={o} className={`ficha ${o === ultimo ? 'ficha-erro' : 'ficha-alerta'}`}>
                +{o}d
                {o === ultimo && <em>risco de suspensão</em>}
                <button type="button" onClick={() => remover(o)} aria-label={`Remover ${o}`}>✕</button>
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="linha nao-quebra mb-3">
        <input
          className="entrada"
          type="number"
          placeholder="Ex: -1 (antes) ou 4 (depois)"
          value={novoOffset}
          onChange={e => setNovoOffset(e.target.value)}
        />
        <button type="button" className="btn btn-info" onClick={adicionar}>Adicionar</button>
      </div>

      <Recado msg={configMsg} />

      <div className="linha">
        <button type="button" className="btn btn-primario" onClick={salvarConfig} disabled={salvandoConfig}>
          {salvandoConfig ? 'Salvando…' : '💾 Salvar configuração'}
        </button>
        {temConfigPropria && (
          <button type="button" className="btn btn-perigo" onClick={removerConfig} disabled={salvandoConfig}>
            Remover
          </button>
        )}
      </div>

      <div className="modal-secao">
        <Recado msg={cobrarMsg} />
        <button type="button" className="btn btn-ok btn-bloco" onClick={cobrarAgora} disabled={cobrando}>
          {cobrando ? 'Enviando…' : '📤 Cobrar agora'}
        </button>
      </div>
    </div>
  );
}

// src/components/ficha/AbaPromessa.jsx — "pago dia tal".
import React from 'react';
import { Recado } from './Recado';

export function AbaPromessa({ dataPromessa, setDataPromessa, promMsg, salvarPromessa, salvandoProm }) {
  return (
    <div>
      <div className="aviso aviso-info mb-3">
        <span className="aviso-emoji">🤝</span>
        <span className="aviso-corpo">
          O cliente fica com status de promessa e o sistema acompanha o vencimento dela.
        </span>
      </div>

      <div className="campo">
        <label className="rotulo" htmlFor="data-promessa">Data prometida</label>
        <input
          id="data-promessa"
          className="entrada"
          type="date"
          value={dataPromessa}
          onChange={e => setDataPromessa(e.target.value)}
        />
      </div>

      <Recado msg={promMsg} />

      <button type="button" className="btn btn-roxo btn-bloco" onClick={salvarPromessa} disabled={salvandoProm}>
        {salvandoProm ? 'Salvando…' : '🤝 Registrar promessa'}
      </button>
    </div>
  );
}

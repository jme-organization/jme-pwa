// src/components/fttx/NaoAutorizadas.jsx
// As ONUs plugadas esperando autorizacao.
//
// So busca quando o dono pede. A consulta custa ~13 segundos porque vai
// perguntar pra OLT na hora, e um poll automatico bateria nela o dia inteiro —
// candidato a ser justamente uma das causas da lentidao que motivou esta tela.
import React, { useState } from 'react';
import { api } from '../../api/client';

export function NaoAutorizadas() {
  const [lista, setLista] = useState(null);
  const [buscando, setBuscando] = useState(false);
  const [erro, setErro] = useState(null);
  const [ms, setMs] = useState(null);

  const procurar = async () => {
    setBuscando(true);
    setErro(null);
    try {
      // 30s de teto: a chamada leva ~13s e o padrao do cliente e 10s.
      const r = await api.post('/api/fttx/nao-autorizadas', {}, 30000);
      setLista(r.onus || []);
      setMs(r.ms ?? null);
    } catch (e) {
      setErro(e.message);
    } finally {
      setBuscando(false);
    }
  };

  return (
    <div className="card card-pad mb-3">
      <div className="card-cab">
        <div className="card-titulo">ONUs esperando autorização</div>
        <button className="btn btn-info btn-pequeno" onClick={procurar} disabled={buscando}>
          {buscando ? 'Perguntando à OLT…' : 'Procurar ONU nova'}
        </button>
      </div>

      {erro && <div className="aviso aviso-erro mt-2">{erro}</div>}

      {buscando && <div className="dica mt-2">A OLT leva uns 13 segundos para responder isso.</div>}

      {!buscando && lista?.length === 0 && (
        <div className="vazio mt-2">
          <div className="vazio-emoji">🔌</div>
          <div>Nenhuma ONU esperando.</div>
          <div className="vazio-dica">
            Peça pro técnico plugar a ONU na casa do cliente e procure de novo.
            {ms !== null ? ` (consulta levou ${Math.round(ms / 1000)}s)` : ''}
          </div>
        </div>
      )}

      {lista?.length > 0 && (
        <div className="tabela-scroll mt-2">
          <table className="tabela">
            <thead>
              <tr>
                <th>Serial</th>
                <th className="td-centro">Slot</th>
                <th className="td-centro">PON</th>
                <th>Tipo</th>
              </tr>
            </thead>
            <tbody>
              {lista.map((o, i) => (
                <tr key={o.phy_addr || i}>
                  <td className="td-mono">{o.phy_addr || o.phyAddr || '—'}</td>
                  <td className="td-centro td-mono">{o.slot ?? '—'}</td>
                  <td className="td-centro td-mono">{o.pon ?? '—'}</td>
                  <td>{o.type || o.tipo || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="dica mt-1">
            Autorizar pelo painel ainda não está disponível: o SGP bloqueia a rota que lista
            os tipos de ONU. Por enquanto, suba pela tela dele.
          </div>
        </div>
      )}
    </div>
  );
}

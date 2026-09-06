// src/components/ficha/AbaDados.jsx — quem é o cliente e quando ele vence.
import React from 'react';
import { Recado } from './Recado';

const PLANOS = [
  'Cabo 50MB — R$50',
  'Fibra 200MB — R$60',
  'Fibra 200MB + IPTV — R$70',
];

export function AbaDados({
  form, set, campo, diaOutro, setDiaOutro,
  carneMsg, solicitarCarne, solicitandoCarne,
}) {
  return (
    <div>
      <div className="grade-form">
        {campo('nome', 'Nome completo', 'Ex: Marine Silva')}
        {campo('cpf', 'CPF', '000.000.000-00')}
      </div>
      <div className="grade-form grade-form-3-1">
        {campo('endereco', 'Endereço', 'Rua, bairro')}
        {campo('numero', 'Nº', '123')}
      </div>
      <div className="grade-form">
        {campo('senha', 'Login PPPoE', 'Ex: cliente123')}
        <div className="campo">
          <label className="rotulo" htmlFor="f-plano">Plano</label>
          <select id="f-plano" className="entrada" value={form.plano} onChange={e => set('plano', e.target.value)}>
            <option value="">— selecione —</option>
            {PLANOS.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
      </div>

      <div className="campo">
        <span className="rotulo">Roteador</span>
        <div className="opcoes">
          <button
            type="button"
            className={`opcao ${form.comodato ? 'opcao-ativa' : ''}`}
            onClick={() => set('comodato', true)}
          >
            📦 Comodato
          </button>
          <button
            type="button"
            className={`opcao ${!form.comodato ? 'opcao-ativa' : ''}`}
            onClick={() => set('comodato', false)}
          >
            🏠 Próprio
          </button>
        </div>
      </div>

      <div className="campo">
        <span className="rotulo">Dia de vencimento</span>
        <div className="opcoes">
          {['10', '20', '30'].map(d => (
            <button
              key={d}
              type="button"
              className={`opcao ${form.dia_vencimento === d && !diaOutro ? 'opcao-ativa' : ''}`}
              onClick={() => { set('dia_vencimento', d); setDiaOutro(''); }}
            >
              Dia {d}
            </button>
          ))}
          <input
            className="entrada campo-dia"
            type="number"
            min="1"
            max="31"
            placeholder="Outro"
            value={diaOutro}
            onChange={e => { setDiaOutro(e.target.value); if (e.target.value) set('dia_vencimento', e.target.value); }}
          />
        </div>
      </div>

      {campo('observacao', 'Observação', 'Notas internas…')}

      <div className="modal-secao">
        <Recado msg={carneMsg} />
        <button type="button" className="btn btn-roxo btn-bloco" onClick={solicitarCarne} disabled={solicitandoCarne}>
          {solicitandoCarne ? 'Solicitando…' : '📋 Solicitar carnê físico'}
        </button>
      </div>
    </div>
  );
}

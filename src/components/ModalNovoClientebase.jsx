// src/components/ModalNovoClientebase.jsx — cadastro rapido dentro da base.
import React, { useState } from 'react';
import { api } from '../api/client';

const PLANOS = [
  'Cabo 50MB — R$50',
  'Fibra 200MB — R$60',
  'Fibra 200MB + IPTV — R$70',
];

export const ModalNovoClienteBase = ({ baseId, diaDefault, onClose, onSalvo }) => {
  const [form, setForm] = useState({
    nome: '',
    cpf: '',
    telefone: '',
    endereco: '',
    numero: '',
    senha: '',
    plano: '',
    forma_pagamento: 'pix',
    dia_vencimento: String(diaDefault || 10),
    observacao: '',
  });
  const [diaOutro, setDiaOutro] = useState(
    !['10', '20', '30'].includes(String(diaDefault || 10)) ? String(diaDefault || '') : ''
  );
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState(null);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const salvar = async () => {
    if (!form.nome.trim()) { setErro('Nome é obrigatório'); return; }
    setSalvando(true);
    setErro(null);
    try {
      const json = await api.post('/api/clientes', {
        ...form,
        base_id: baseId,
        dia_vencimento: parseInt(form.dia_vencimento, 10) || 10,
      });
      if (json?.id) {
        onSalvo(json);
        onClose();
      } else {
        setErro(json?.erro || 'Não consegui salvar');
      }
    } catch (e) {
      setErro(e.message || 'Falha de conexão');
    }
    setSalvando(false);
  };

  const campo = (k, label, placeholder = '') => (
    <div className="campo">
      <label className="rotulo" htmlFor={`n-${k}`}>{label}</label>
      <input
        id={`n-${k}`}
        className="entrada"
        value={form[k]}
        placeholder={placeholder}
        onChange={e => set(k, e.target.value)}
      />
    </div>
  );

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box modal-grande" onClick={e => e.stopPropagation()}>
        <div className="modal-title">Novo cliente</div>

        <div className="grade-form">
          {campo('nome', 'Nome completo *', 'Ex: Marine Silva')}
          {campo('cpf', 'CPF', '000.000.000-00')}
        </div>

        <div className="grade-form">
          {campo('telefone', 'Telefone / WhatsApp', '81999999999')}
          <div className="campo">
            <label className="rotulo" htmlFor="n-plano">Plano</label>
            <select id="n-plano" className="entrada" value={form.plano} onChange={e => set('plano', e.target.value)}>
              <option value="">— selecione —</option>
              {PLANOS.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
        </div>

        <div className="grade-form grade-form-3-1">
          {campo('endereco', 'Endereço', 'Rua, bairro')}
          {campo('numero', 'Nº', '123')}
        </div>

        {campo('senha', 'Login PPPoE', 'Ex: cliente123')}

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

        {erro && <div className="aviso aviso-erro">{erro}</div>}

        <div className="modal-footer">
          <button type="button" className="btn" onClick={onClose}>Cancelar</button>
          <button type="button" className="btn btn-primario" onClick={salvar} disabled={salvando}>
            {salvando ? 'Salvando…' : 'Criar cliente'}
          </button>
        </div>
      </div>
    </div>
  );
};

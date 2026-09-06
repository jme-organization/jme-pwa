// src/components/ModalCriarBase.jsx
import React, { useState } from 'react';
import { api } from '../api/client';

const DIAS = [5, 10, 15, 20, 25, 30];

export const ModalCriarBase = ({ onClose, onCriada }) => {
  const [nome, setNome] = useState('');
  const [descricao, setDescricao] = useState('');
  const [dias, setDias] = useState([]);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState(null);

  const alternarDia = (dia) => {
    setDias(prev => (prev.includes(dia) ? prev.filter(d => d !== dia) : [...prev, dia].sort((a, b) => a - b)));
  };

  const salvar = async () => {
    if (!nome.trim()) { setErro('Nome é obrigatório'); return; }
    if (dias.length === 0) { setErro('Selecione pelo menos um dia de vencimento'); return; }

    setSalvando(true);
    setErro(null);
    try {
      const json = await api.post('/api/bases', { nome: nome.trim(), descricao, dias });
      if (json?.id) onCriada();
      else setErro(json?.erro || 'Não consegui criar a base');
    } catch (e) {
      setErro(e.message || 'Falha de conexão');
    }
    setSalvando(false);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()}>
        <div className="modal-title">Nova base de clientes</div>

        <div className="campo">
          <label className="rotulo" htmlFor="base-nome">Nome da base *</label>
          <input
            id="base-nome"
            className="entrada"
            value={nome}
            onChange={e => setNome(e.target.value)}
            placeholder="Ex: JME, Centro, Filial"
            autoFocus
          />
        </div>

        <div className="campo">
          <label className="rotulo" htmlFor="base-desc">Descrição</label>
          <input
            id="base-desc"
            className="entrada"
            value={descricao}
            onChange={e => setDescricao(e.target.value)}
            placeholder="Ex: base principal"
          />
        </div>

        <div className="campo">
          <span className="rotulo">Dias de vencimento *</span>
          <div className="opcoes">
            {DIAS.map(dia => (
              <button
                key={dia}
                type="button"
                className={`opcao ${dias.includes(dia) ? 'opcao-ativa' : ''}`}
                onClick={() => alternarDia(dia)}
              >
                Dia {dia}
              </button>
            ))}
          </div>
          <div className="dica">Cada dia vira uma aba dentro da base, com seu próprio ciclo.</div>
        </div>

        {erro && <div className="aviso aviso-erro">{erro}</div>}

        <div className="modal-footer">
          <button type="button" className="btn" onClick={onClose}>Cancelar</button>
          <button type="button" className="btn btn-primario" onClick={salvar} disabled={salvando}>
            {salvando ? 'Criando…' : 'Criar base'}
          </button>
        </div>
      </div>
    </div>
  );
};

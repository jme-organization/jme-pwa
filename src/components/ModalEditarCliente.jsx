// src/components/ModalEditarCliente.jsx — a ficha do cliente.
//
// Este arquivo tinha 543 linhas com as seis abas dentro. Cada aba virou um
// componente em `ficha/`, e o que sobrou aqui é o que de fato é do modal: o
// estado do cadastro, as chamadas de API e qual aba está aberta. O piso do
// CONVENTIONS.md é 400 linhas, e o motivo não é estético — é onde a revisão
// para de achar bug.
import React, { useState } from 'react';
import { BadgeCliente } from './BadgeCliente';
import { PainelDatas } from './PainelDatas';
import { Recado } from './ficha/Recado';
import { AbaDados } from './ficha/AbaDados';
import { AbaCobranca } from './ficha/AbaCobranca';
import { AbaPromessa } from './ficha/AbaPromessa';
import { AbaCancelar } from './ficha/AbaCancelar';
import { api } from '../api/client';

const ABAS = [
  { id: 'dados', rotulo: '📋 Dados' },
  { id: 'contato', rotulo: '📞 Contato' },
  { id: 'financeiro', rotulo: '💰 Financeiro' },
  { id: 'cobranca', rotulo: '⚙️ Cobrança' },
  { id: 'promessa', rotulo: '🤝 Promessa' },
  { id: 'cancelar', rotulo: '❌ Cancelar', perigo: true },
];

export const ModalEditarCliente = ({ cliente, baseId, onClose, onSalvo }) => {
  const [form, setForm] = useState({
    nome: cliente.nome || '',
    cpf: cliente.cpf || '',
    telefone: cliente.telefone || '',
    endereco: cliente.endereco || '',
    numero: cliente.numero || '',
    senha: cliente.senha || '',
    plano: cliente.plano || '',
    forma_pagamento: cliente.forma_pagamento || '',
    dia_vencimento: String(cliente.dia_vencimento || ''),
    comodato: cliente.comodato === true,
    observacao: cliente.observacao || '',
    status: cliente.status || 'pendente',
  });

  const [aba, setAba] = useState('dados');
  const [diaOutro, setDiaOutro] = useState(
    !['10', '20', '30'].includes(String(cliente.dia_vencimento)) ? String(cliente.dia_vencimento || '') : ''
  );
  const [offsets, setOffsets] = useState(
    cliente.config_cobranca?.offsets?.length ? cliente.config_cobranca.offsets : [-1, 1, 3, 5, 7, 9]
  );
  const [salvandoConfig, setSalvandoConfig] = useState(false);
  const [configMsg, setConfigMsg] = useState(null);
  const [cobrando, setCobrando] = useState(false);
  const [cobrarMsg, setCobrarMsg] = useState(null);
  const [solicitandoCarne, setSolicitandoCarne] = useState(false);
  const [carneMsg, setCarneMsg] = useState(null);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState(null);

  const [dataPromessa, setDataPromessa] = useState('');
  const [salvandoProm, setSalvandoProm] = useState(false);
  const [promMsg, setPromMsg] = useState(null);

  const [motivoCancelamento, setMotivoCancelamento] = useState('');
  const [motivoDetalhe, setMotivoDetalhe] = useState('');
  const [cancelMsg, setCancelMsg] = useState(null);
  const [salvandoCancel, setSalvandoCancel] = useState(false);
  const [cancelado, setCancelado] = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const salvar = async () => {
    if (!form.nome.trim()) { setErro('Nome é obrigatório'); return; }
    setSalvando(true);
    setErro(null);
    try {
      const json = await api.put(`/api/bases/${baseId}/clientes/${cliente.id}`, {
        ...form,
        dia_vencimento: parseInt(form.dia_vencimento, 10) || null,
        comodato: Boolean(form.comodato),
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

  const solicitarCarne = async () => {
    setSolicitandoCarne(true);
    setCarneMsg(null);
    try {
      const j = await api.post('/api/carne', {
        cliente_id: cliente.id,
        nome: form.nome,
        numero: form.telefone || null,
        endereco: form.endereco || null,
      });
      setCarneMsg(j?.ok
        ? { ok: true, txt: '✅ Solicitação registrada. Aparece na tela de Carnês.' }
        : { ok: false, txt: j?.erro || 'Não consegui solicitar' });
    } catch (e) {
      setCarneMsg({ ok: false, txt: e.message || 'Falha de conexão' });
    }
    setSolicitandoCarne(false);
  };

  const salvarPromessa = async () => {
    if (!dataPromessa) { setPromMsg({ ok: false, txt: 'Informe a data da promessa' }); return; }
    setSalvandoProm(true);
    setPromMsg(null);
    try {
      const json = await api.post('/api/promessas', {
        nome: form.nome,
        numero: form.telefone || null,
        data_promessa: dataPromessa,
      });
      if (json?.ok) {
        await api.post(`/api/bases/${baseId}/clientes/${cliente.id}/status`, { status: 'promessa' });
        set('status', 'promessa');
        setPromMsg({ ok: true, txt: `✅ Promessa registrada para ${dataPromessa.split('-').reverse().join('/')}` });
        onSalvo({ ...cliente, status: 'promessa' });
      } else {
        setPromMsg({ ok: false, txt: json?.erro || 'Não consegui salvar' });
      }
    } catch (e) {
      setPromMsg({ ok: false, txt: e.message || 'Falha de conexão' });
    }
    setSalvandoProm(false);
  };

  const salvarConfig = async () => {
    if (!offsets.length) { setConfigMsg({ ok: false, txt: 'Adicione pelo menos um dia de aviso' }); return; }
    setSalvandoConfig(true);
    setConfigMsg(null);
    try {
      const json = await api.put(`/api/bases/${baseId}/clientes/${cliente.id}/config-cobranca`, { offsets });
      setConfigMsg(json?.ok
        ? { ok: true, txt: '✅ Configuração salva.' }
        : { ok: false, txt: json?.erro || 'Não consegui salvar' });
    } catch (e) {
      setConfigMsg({ ok: false, txt: e.message || 'Falha de conexão' });
    }
    setSalvandoConfig(false);
  };

  const removerConfig = async () => {
    if (!confirm('Remover a configuração própria? O cliente volta ao calendário padrão (10/20/30).')) return;
    setSalvandoConfig(true);
    try {
      await api.put(`/api/bases/${baseId}/clientes/${cliente.id}/config-cobranca`, {});
      setOffsets([-1, 1, 3, 5, 7, 9]);
      setConfigMsg({ ok: true, txt: 'Configuração removida — voltou ao padrão.' });
    } catch (e) {
      setConfigMsg({ ok: false, txt: e.message || 'Falha de conexão' });
    }
    setSalvandoConfig(false);
  };

  const cobrarAgora = async () => {
    if (!confirm(`Enviar cobrança agora para ${form.nome}?`)) return;
    setCobrando(true);
    setCobrarMsg(null);
    try {
      const json = await api.post(`/api/clientes/${cliente.id}/cobrar-individual`, {
        offset: offsets[offsets.length - 1] ?? 0,
      });
      setCobrarMsg(json?.ok
        ? { ok: true, txt: '✅ Mensagem enviada.' }
        : { ok: false, txt: json?.erro || 'Não consegui enviar' });
    } catch (e) {
      setCobrarMsg({ ok: false, txt: e.message || 'Falha de conexão' });
    }
    setCobrando(false);
  };

  const confirmarCancelamento = async () => {
    if (!motivoCancelamento) { setCancelMsg({ ok: false, txt: 'Selecione um motivo' }); return; }
    if (!confirm(`Confirma o cancelamento de ${form.nome}? Isto remove o cliente da base.`)) return;
    setSalvandoCancel(true);
    setCancelMsg(null);
    try {
      // Cancelamento atomico — /api/cancelamentos ja apaga o cliente da base.
      const json = await api.post('/api/cancelamentos', {
        cliente_id: cliente.id,
        base_id: baseId,
        nome: form.nome,
        telefone: form.telefone || null,
        endereco: form.endereco || null,
        plano: form.plano || null,
        dia_vencimento: cliente.dia_vencimento || null,
        motivo: motivoCancelamento,
        motivo_detalhado: motivoDetalhe || null,
        solicitado_via: 'painel',
      });
      if (json?.ok) {
        setCancelado(true);
        onSalvo({ ...cliente, status: 'cancelado' });
        setTimeout(onClose, 1500);
      } else {
        setCancelMsg({ ok: false, txt: json?.erro || 'Não consegui registrar' });
      }
    } catch (e) {
      setCancelMsg({ ok: false, txt: e.message || 'Falha de conexão' });
    }
    setSalvandoCancel(false);
  };

  const campo = (k, label, placeholder = '', tipo = 'text') => (
    <div className="campo">
      <label className="rotulo" htmlFor={`f-${k}`}>{label}</label>
      <input
        id={`f-${k}`}
        className="entrada"
        type={tipo}
        value={form[k]}
        placeholder={placeholder}
        onChange={e => set(k, e.target.value)}
      />
    </div>
  );

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box modal-grande" onClick={e => e.stopPropagation()}>
        <div className="modal-title">
          <span>{cliente.nome}</span>
          <BadgeCliente status={form.status} />
        </div>

        <div className="abas">
          {ABAS.map(({ id, rotulo, perigo }) => (
            <button
              key={id}
              type="button"
              className={`aba ${aba === id ? (perigo ? 'aba-ativa aba-ativa-perigo' : 'aba-ativa') : ''}`}
              onClick={() => setAba(id)}
            >
              {rotulo}
            </button>
          ))}
        </div>

        {aba === 'dados' && (
          <AbaDados
            form={form}
            set={set}
            campo={campo}
            diaOutro={diaOutro}
            setDiaOutro={setDiaOutro}
            carneMsg={carneMsg}
            solicitarCarne={solicitarCarne}
            solicitandoCarne={solicitandoCarne}
          />
        )}

        {aba === 'contato' && (
          <div>
            {campo('telefone', 'Telefone / WhatsApp', '81999999999')}
            <div className="dica">É por este número que toda cobrança sai. Sem ele, o cliente nunca é cobrado.</div>
          </div>
        )}

        {aba === 'financeiro' && (
          <PainelDatas
            clienteId={cliente.id}
            diaVencimento={parseInt(form.dia_vencimento, 10) || cliente.dia_vencimento || 10}
            plano={form.plano || cliente.plano || ''}
            onStatusChange={(novo) => {
              set('status', novo);
              onSalvo({ ...cliente, status: novo });
            }}
          />
        )}

        {aba === 'cobranca' && (
          <AbaCobranca
            offsets={offsets}
            setOffsets={setOffsets}
            temConfigPropria={!!cliente.config_cobranca}
            configMsg={configMsg}
            salvarConfig={salvarConfig}
            removerConfig={removerConfig}
            salvandoConfig={salvandoConfig}
            cobrarMsg={cobrarMsg}
            cobrarAgora={cobrarAgora}
            cobrando={cobrando}
          />
        )}

        {aba === 'promessa' && (
          <AbaPromessa
            dataPromessa={dataPromessa}
            setDataPromessa={setDataPromessa}
            promMsg={promMsg}
            salvarPromessa={salvarPromessa}
            salvandoProm={salvandoProm}
          />
        )}

        {aba === 'cancelar' && (
          <AbaCancelar
            nome={form.nome}
            cancelado={cancelado}
            motivo={motivoCancelamento}
            setMotivo={setMotivoCancelamento}
            detalhe={motivoDetalhe}
            setDetalhe={setMotivoDetalhe}
            cancelMsg={cancelMsg}
            confirmar={confirmarCancelamento}
            salvando={salvandoCancel}
          />
        )}

        <Recado msg={erro ? { ok: false, txt: erro } : null} />

        <div className="modal-footer">
          <button type="button" className="btn" onClick={onClose}>Fechar</button>
          {aba !== 'promessa' && aba !== 'cancelar' && (
            <button type="button" className="btn btn-primario" onClick={salvar} disabled={salvando}>
              {salvando ? 'Salvando…' : '💾 Salvar alterações'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

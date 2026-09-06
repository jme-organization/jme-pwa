// src/components/ModalEditarCliente.jsx — a ficha do cliente.
//
// Mudou de forma, nao de funcao: as seis abas continuam as mesmas. O que saiu
// foi o `toggleStatus` que ninguem chamava e o segundo campo de promessa ("ou
// data em texto livre"), que escrevia no MESMO estado do campo de data — quem
// digitasse ali mandava texto solto pro backend, que espera uma data.
import React, { useState } from 'react';
import { BadgeCliente } from './BadgeCliente';
import { PainelDatas } from './PainelDatas';
import { api } from '../api/client';

const PLANOS = [
  'Cabo 50MB — R$50',
  'Fibra 200MB — R$60',
  'Fibra 200MB + IPTV — R$70',
];

const MOTIVOS_CANCELAMENTO = [
  'Problemas financeiros',
  'Qualidade do serviço',
  'Mudança de endereço',
  'Contratei outro provedor',
  'Outro motivo',
];

const ABAS = [
  { id: 'dados', rotulo: '📋 Dados' },
  { id: 'contato', rotulo: '📞 Contato' },
  { id: 'financeiro', rotulo: '💰 Financeiro' },
  { id: 'cobranca', rotulo: '⚙️ Cobrança' },
  { id: 'promessa', rotulo: '🤝 Promessa' },
  { id: 'cancelar', rotulo: '❌ Cancelar', perigo: true },
];

function Recado({ msg }) {
  if (!msg) return null;
  return <div className={`aviso ${msg.ok ? 'aviso-ok' : 'aviso-erro'} mb-2`}>{msg.txt}</div>;
}

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
  const [novoOffset, setNovoOffset] = useState('');
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

  const antes = offsets.filter(o => o < 0).sort((a, b) => b - a);
  const depois = offsets.filter(o => o >= 0).sort((a, b) => a - b);
  const ultimo = depois[depois.length - 1];

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
                >📦 Comodato</button>
                <button
                  type="button"
                  className={`opcao ${!form.comodato ? 'opcao-ativa' : ''}`}
                  onClick={() => set('comodato', false)}
                >🏠 Próprio</button>
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
                      <button type="button" onClick={() => setOffsets(offsets.filter(x => x !== o))} aria-label={`Remover ${o}`}>✕</button>
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
                      <button type="button" onClick={() => setOffsets(offsets.filter(x => x !== o))} aria-label={`Remover ${o}`}>✕</button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="linha" style={{ flexWrap: 'nowrap', marginBottom: 14 }}>
              <input
                className="entrada"
                type="number"
                placeholder="Ex: -1 (antes) ou 4 (depois)"
                value={novoOffset}
                onChange={e => setNovoOffset(e.target.value)}
              />
              <button
                type="button"
                className="btn btn-info"
                onClick={() => {
                  const n = parseInt(novoOffset, 10);
                  if (!Number.isNaN(n) && !offsets.includes(n)) setOffsets([...offsets, n].sort((a, b) => a - b));
                  setNovoOffset('');
                }}
              >
                Adicionar
              </button>
            </div>

            <Recado msg={configMsg} />

            <div className="linha">
              <button type="button" className="btn btn-primario" onClick={salvarConfig} disabled={salvandoConfig}>
                {salvandoConfig ? 'Salvando…' : '💾 Salvar configuração'}
              </button>
              {!!cliente.config_cobranca && (
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
        )}

        {aba === 'promessa' && (
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
        )}

        {aba === 'cancelar' && (
          cancelado ? (
            <div className="vazio">
              <span className="vazio-emoji">✅</span>
              Cancelamento registrado
              <span className="vazio-dica">O cliente foi para a tela de cancelamentos.</span>
            </div>
          ) : (
            <div>
              <div className="aviso aviso-erro mb-3">
                <span className="aviso-emoji">⚠️</span>
                <span className="aviso-corpo">
                  Cancelar remove {form.nome} da base
                  <span className="aviso-detalhe">
                    Se é só para parar de cobrar sem perder o cliente, use Bloquear na lista do dia.
                  </span>
                </span>
              </div>

              <div className="campo">
                <span className="rotulo">Motivo</span>
                <div className="opcoes" style={{ flexDirection: 'column' }}>
                  {MOTIVOS_CANCELAMENTO.map(m => (
                    <button
                      key={m}
                      type="button"
                      className={`opcao opcao-lista ${motivoCancelamento === m ? 'opcao-ativa-perigo opcao-ativa' : ''}`}
                      onClick={() => setMotivoCancelamento(m)}
                    >
                      {motivoCancelamento === m ? '● ' : '○ '}{m}
                    </button>
                  ))}
                </div>
              </div>

              <div className="campo">
                <label className="rotulo" htmlFor="motivo-detalhe">Observação</label>
                <textarea
                  id="motivo-detalhe"
                  className="entrada"
                  rows={3}
                  placeholder="Detalhes do cancelamento…"
                  value={motivoDetalhe}
                  onChange={e => setMotivoDetalhe(e.target.value)}
                />
              </div>

              <Recado msg={cancelMsg} />

              <button
                type="button"
                className="btn btn-perigo btn-bloco"
                onClick={confirmarCancelamento}
                disabled={salvandoCancel || !motivoCancelamento}
              >
                {salvandoCancel ? 'Registrando…' : '❌ Confirmar cancelamento'}
              </button>
            </div>
          )
        )}

        {erro && <div className="aviso aviso-erro mt-2">{erro}</div>}

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

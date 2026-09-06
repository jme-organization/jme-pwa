// src/pages/boasvindas.jsx — primeira mensagem para quem acabou de entrar.
import React, { useState, useEffect, useCallback } from 'react';
import { Card } from '../components/Card';
import { Spinner } from '../components/Spinner';
import { BadgeCliente } from '../components/BadgeCliente';
import { fmtDataCurta } from '../utils/formatadores';
import { api } from '../api/client';

const modeloMensagem = (cliente) => (
  `🤖 *Assistente JMENET*\n\n`
  + `Olá, *${(cliente.nome || 'Cliente').split(' ')[0]}*! 🎉 Seja bem-vindo(a) à JMENET!\n\n`
  + `📡 Plano: ${cliente.plano || 'Não informado'}\n`
  + `📅 Vencimento: todo dia ${cliente.dia_vencimento || '10'}\n\n`
  + `Qualquer dúvida é só chamar! 😊`
);

const lerArquivo = (file) => new Promise((resolve, reject) => {
  const leitor = new FileReader();
  leitor.onload = () => resolve({ base64: leitor.result.split(',')[1], nome: file.name, tipo: file.type });
  leitor.onerror = reject;
  leitor.readAsDataURL(file);
});

export function PageBoasVindas() {
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState(null);
  const [enviando, setEnviando] = useState(false);

  // modal de boas-vindas
  const [alvo, setAlvo] = useState(null);
  const [mensagem, setMensagem] = useState('');
  const [solicitarCarne, setSolicitarCarne] = useState(false);
  // Carne completo direto do SGP: o dono pediu que a boas-vindas ja leve os
  // boletos das proximas mensalidades, porque hoje ele manda a mao — quando manda.
  const [enviarCarneSgp, setEnviarCarneSgp] = useState(true);
  const [obsCarne, setObsCarne] = useState('');
  const [arquivo, setArquivo] = useState(null);

  // modal de envio avulso
  const [avulso, setAvulso] = useState(false);
  const [telefone, setTelefone] = useState('');
  const [msgAvulsa, setMsgAvulsa] = useState('');

  const carregar = useCallback(async () => {
    setLoading(true);
    try {
      setErro(null);
      const data = await api.get('/api/clientes/recentes?limite=25');
      setClientes(Array.isArray(data) ? data : []);
    } catch (e) {
      setErro(e.message || 'Não consegui carregar os clientes recentes');
    }
    setLoading(false);
  }, []);

  useEffect(() => { carregar(); }, [carregar]);

  const abrirEnvio = (cliente) => {
    setAlvo(cliente);
    // A mensagem vive em estado. Antes ela era lida do DOM com
    // document.getElementById no momento do envio.
    setMensagem(modeloMensagem(cliente));
    setSolicitarCarne(false);
    setEnviarCarneSgp(true);
    setObsCarne('');
    setArquivo(null);
  };

  const confirmarEnvio = async () => {
    if (!alvo) return;
    setEnviando(true);
    try {
      const corpo = {
        cliente_id: alvo.id,
        mensagem,
        solicitar_carne: solicitarCarne,
        obs_carne: obsCarne,
        enviar_carne_sgp: enviarCarneSgp,
      };
      if (arquivo) {
        const { base64, nome, tipo } = await lerArquivo(arquivo);
        corpo.carne_arquivo_base64 = base64;
        corpo.carne_arquivo_nome = nome;
        corpo.carne_arquivo_tipo = tipo;
      }
      const r = await api.post('/api/boas-vindas/enviar', corpo, 90000);
      // O carne vai numa SEGUNDA mensagem: ela pode falhar sozinha, e dizer
      // "enviado" quando o carne nao foi seria mentir pro dono.
      const recado = r?.carneSgp
        ? (r.carneSgp.ok
            ? ` Carnê com ${r.carneSgp.boletos} boleto(s) enviado.`
            : ` ⚠️ O carnê NÃO foi: ${r.carneSgp.erro}`)
        : '';
      alert(`✅ Boas-vindas enviada para ${alvo.nome}.${recado}`);
      setAlvo(null);
    } catch (e) {
      alert(`❌ Não consegui enviar: ${e.message}`);
    }
    setEnviando(false);
  };

  const enviarAvulso = async () => {
    if (!telefone.trim() || !msgAvulsa.trim()) {
      alert('Preencha o telefone e a mensagem.');
      return;
    }
    setEnviando(true);
    try {
      await api.post('/api/boas-vindas/manual', { telefone, mensagem: msgAvulsa }, 30000);
      alert('✅ Mensagem enviada.');
      setAvulso(false);
      setTelefone('');
      setMsgAvulsa('');
    } catch (e) {
      alert(`❌ Não consegui enviar: ${e.message}`);
    }
    setEnviando(false);
  };

  return (
    <div className="page">
      <div className="page-topo">
        <div>
          <h1 className="page-title">Boas-vindas</h1>
          <div className="page-sub">Os 25 cadastros mais recentes. Dá para anexar o carnê no mesmo envio.</div>
        </div>
        <div className="page-acoes">
          <button type="button" className="btn btn-info" onClick={() => setAvulso(true)}>
            💬 Enviar para um número
          </button>
        </div>
      </div>

      {erro && <div className="aviso aviso-erro mb-3">{erro}</div>}

      {loading ? <Spinner /> : clientes.length === 0 ? (
        <Card>
          <div className="vazio">
            <span className="vazio-emoji">👋</span>
            Nenhum cliente cadastrado recentemente
          </div>
        </Card>
      ) : (
        <Card>
          <div className="tabela-scroll">
            <table className="tabela">
              <thead>
                <tr><th>Nome</th><th>Telefone</th><th>Plano</th><th>Venc.</th><th>Status</th><th>Cadastrado</th><th /></tr>
              </thead>
              <tbody>
                {clientes.map(c => (
                  <tr key={c.id}>
                    <td className="td-nome">{c.nome}</td>
                    <td className="td-mono">{c.telefone || '—'}</td>
                    <td>{c.plano || '—'}</td>
                    <td className="td-centro">{c.dia_vencimento ? `Dia ${c.dia_vencimento}` : '—'}</td>
                    <td><BadgeCliente status={c.status} /></td>
                    <td className="td-muted">{fmtDataCurta(c.criado_em)}</td>
                    <td className="td-fim">
                      <button
                        type="button"
                        className="btn btn-primario btn-pequeno"
                        disabled={!c.telefone}
                        title={c.telefone ? 'Enviar boas-vindas' : 'Cliente sem telefone cadastrado'}
                        onClick={() => abrirEnvio(c)}
                      >
                        👋 Enviar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {alvo && (
        <div className="modal-overlay" onClick={() => setAlvo(null)}>
          <div className="modal-box modal-grande" onClick={e => e.stopPropagation()}>
            <div className="modal-title">Boas-vindas — {alvo.nome}</div>

            <div className="campo">
              <label className="rotulo" htmlFor="msg-bv">Mensagem</label>
              <textarea
                id="msg-bv"
                className="entrada"
                rows={7}
                value={mensagem}
                onChange={e => setMensagem(e.target.value)}
              />
            </div>

            <div className="campo">
              <label className="rotulo" htmlFor="arq-bv">Anexar carnê (PDF ou imagem)</label>
              <input
                id="arq-bv"
                className="entrada"
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={e => setArquivo(e.target.files[0] || null)}
              />
            </div>

            <div className="campo">
              <label className="marcavel">
                <input
                  type="checkbox"
                  checked={enviarCarneSgp}
                  onChange={e => setEnviarCarneSgp(e.target.checked)}
                />
                🧾 Mandar o carnê completo (boletos do SGP)
              </label>
              <div className="dica">
                Vai numa segunda mensagem, com vencimento, valor e link de cada mensalidade.
              </div>
            </div>

            <div className="campo">
              <label className="marcavel">
                <input
                  type="checkbox"
                  checked={solicitarCarne}
                  onChange={e => setSolicitarCarne(e.target.checked)}
                />
                📋 Solicitar carnê físico junto
              </label>
            </div>

            {solicitarCarne && (
              <div className="campo">
                <label className="rotulo" htmlFor="obs-carne">Observação do carnê</label>
                <input
                  id="obs-carne"
                  className="entrada"
                  placeholder="Ex: entregar junto com o roteador"
                  value={obsCarne}
                  onChange={e => setObsCarne(e.target.value)}
                />
              </div>
            )}

            <div className="modal-footer">
              <button type="button" className="btn" onClick={() => setAlvo(null)}>Cancelar</button>
              <button type="button" className="btn btn-primario" onClick={confirmarEnvio} disabled={enviando}>
                {enviando ? 'Enviando…' : '✅ Enviar agora'}
              </button>
            </div>
          </div>
        </div>
      )}

      {avulso && (
        <div className="modal-overlay" onClick={() => setAvulso(false)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div className="modal-title">Mensagem avulsa</div>

            <div className="campo">
              <label className="rotulo" htmlFor="tel-avulso">Telefone com DDD</label>
              <input
                id="tel-avulso"
                className="entrada"
                placeholder="5581999999999"
                value={telefone}
                onChange={e => setTelefone(e.target.value)}
              />
            </div>

            <div className="campo">
              <label className="rotulo" htmlFor="msg-avulsa">Mensagem</label>
              <textarea
                id="msg-avulsa"
                className="entrada"
                rows={6}
                value={msgAvulsa}
                onChange={e => setMsgAvulsa(e.target.value)}
              />
            </div>

            <div className="modal-footer">
              <button type="button" className="btn" onClick={() => setAvulso(false)}>Cancelar</button>
              <button type="button" className="btn btn-primario" onClick={enviarAvulso} disabled={enviando}>
                {enviando ? 'Enviando…' : 'Enviar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

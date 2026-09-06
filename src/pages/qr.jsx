// src/pages/qr.jsx — conexão do WhatsApp.
//
// O QR vem do /api/whatsapp/qr como data URL (imagem nao manda header
// Authorization, e era so por isso que o painel carregava a chave de admin no
// bundle). O timer visual so reinicia quando o `geradoEm` muda: rebusca que
// devolve o MESMO QR nao pode fingir que ele foi renovado.
import React, { useState, useEffect, useRef } from 'react';
import { Card } from '../components/Card';
import { api } from '../api/client';

const INTERVALO_QR = 20000;
const ESPERA_SCAN = 180000; // a VPS pode demorar pra fechar a sessao

export function PageQR({ status }) {
  const [qrUrl, setQrUrl] = useState(null);
  const [qrErro, setQrErro] = useState(false);
  const [desconectando, setDesconectando] = useState(false);
  const [resetando, setResetando] = useState(false);
  const [msg, setMsg] = useState(null);
  const [forcarOffline, setForcarOffline] = useState(false);
  const [escaneando, setEscaneando] = useState(false);
  const [contagem, setContagem] = useState(INTERVALO_QR / 1000);

  const carregarQr = useRef(null);
  const timerScan = useRef(null);
  const timerContagem = useRef(null);
  const ultimoGeradoEm = useRef(null);

  const online = forcarOffline ? false : status?.online;

  const iniciarContagem = () => {
    if (timerContagem.current) clearInterval(timerContagem.current);
    setContagem(INTERVALO_QR / 1000);
    timerContagem.current = setInterval(() => {
      setContagem(v => (v <= 1 ? 0 : v - 1));
    }, 1000);
  };

  carregarQr.current = async () => {
    try {
      const r = await api.get('/api/whatsapp/qr');
      if (!r?.dataUrl) { setQrUrl(null); return; }
      const novo = r.geradoEm && r.geradoEm !== ultimoGeradoEm.current;
      if (r.geradoEm) ultimoGeradoEm.current = r.geradoEm;
      setQrUrl(r.dataUrl);
      setQrErro(false);
      if (novo || !timerContagem.current) iniciarContagem();
    } catch (_) {
      setQrUrl(null);
      setQrErro(true);
    }
  };

  useEffect(() => { if (status?.online) setForcarOffline(false); }, [status?.online]);

  // O backend avisa por SSE (status.qrTs muda a cada QR novo).
  useEffect(() => {
    if (online || escaneando) {
      setQrUrl(null);
      if (timerContagem.current) { clearInterval(timerContagem.current); timerContagem.current = null; }
      setContagem(INTERVALO_QR / 1000);
      return;
    }
    setQrErro(false);
    carregarQr.current?.();
  }, [online, escaneando, status?.qrTs]);

  // Rede de seguranca, caso o evento do SSE se perca.
  useEffect(() => {
    if (online || escaneando) return undefined;
    const t = setInterval(() => { setQrErro(false); carregarQr.current?.(); }, INTERVALO_QR * 1.5);
    return () => clearInterval(t);
  }, [online, escaneando]);

  useEffect(() => () => {
    if (timerContagem.current) clearInterval(timerContagem.current);
    if (timerScan.current) clearTimeout(timerScan.current);
  }, []);

  useEffect(() => {
    if (status?.online && timerScan.current) {
      clearTimeout(timerScan.current);
      timerScan.current = null;
      setEscaneando(false);
    }
  }, [status?.online]);

  const marcarEscaneado = () => {
    setEscaneando(true);
    if (timerScan.current) clearTimeout(timerScan.current);
    timerScan.current = setTimeout(() => {
      setEscaneando(false);
      setMsg({ ok: false, txt: 'A conexão não foi confirmada. Tente escanear de novo.' });
    }, ESPERA_SCAN);
  };

  const desconectar = async () => {
    if (!confirm('Desconectar o WhatsApp? Vai ser preciso escanear o QR de novo.')) return;
    setDesconectando(true);
    try {
      await api.post('/api/whatsapp/desconectar', {}, 30000);
      setForcarOffline(true);
      setMsg({ ok: true, txt: 'Desconectado.' });
    } catch (e) {
      setMsg({ ok: false, txt: e.message || 'Não consegui desconectar' });
    }
    setDesconectando(false);
  };

  // So aparece na tela de QR (ja desconectado): nao ha sessao pareada a perder.
  const resetarSessao = async () => {
    if (!confirm('Forçar um QR Code novo agora?')) return;
    setResetando(true);
    try {
      await api.post('/api/whatsapp/resetar-sessao', {}, 30000);
      setMsg({ ok: true, txt: 'Gerando QR Code novo…' });
    } catch (e) {
      setMsg({ ok: false, txt: e.message || 'Não consegui resetar a sessão' });
    }
    setResetando(false);
  };

  return (
    <div className="page qr-page">
      <div className="page-topo">
        <div>
          <h1 className="page-title">Conexão WhatsApp</h1>
          <div className="page-sub">É por esta conta que toda cobrança sai.</div>
        </div>
      </div>

      <Card className="card-pad mb-3">
        <div className="linha">
          <span className={`pilula-ponto ${online ? 'pilula-ponto-on' : 'pilula-ponto-off'}`} />
          <span className={`dash-estado ${online ? 'val-ok' : 'val-erro'}`}>
            {online ? 'Conectado' : 'Desconectado'}
          </span>
        </div>
        <div className="dica">
          {online && status?.iniciadoEm
            ? `Conectado desde ${new Date(status.iniciadoEm).toLocaleString('pt-BR')}`
            : 'Escaneie o QR Code abaixo para conectar.'}
        </div>

        {online && (
          <button
            type="button"
            className="btn btn-perigo btn-bloco"
            style={{ marginTop: 16 }}
            onClick={desconectar}
            disabled={desconectando}
          >
            {desconectando ? 'Desconectando…' : '🔌 Desconectar WhatsApp'}
          </button>
        )}
      </Card>

      {msg && (
        <div className={`aviso ${msg.ok ? 'aviso-ok' : 'aviso-erro'} mb-3`}>
          <span className="aviso-corpo">{msg.txt}</span>
          <button type="button" className="btn btn-fantasma btn-pequeno linha-fim" onClick={() => setMsg(null)}>✕</button>
        </div>
      )}

      {!online && escaneando && (
        <Card>
          <div className="vazio">
            <span className="vazio-emoji">⏳</span>
            Conectando ao WhatsApp…
            <span className="vazio-dica">Não feche esta página enquanto a sessão é estabelecida.</span>
          </div>
          <div className="linha" style={{ justifyContent: 'center', paddingBottom: 20 }}>
            <button type="button" className="btn btn-perigo btn-pequeno" onClick={() => setEscaneando(false)}>
              Cancelar e tentar de novo
            </button>
          </div>
        </Card>
      )}

      {!online && !escaneando && (
        <Card>
          <div className="qr-quadro">
            <div className="page-sub" style={{ textAlign: 'center', marginTop: 0 }}>
              No celular: WhatsApp → Dispositivos conectados → Conectar dispositivo
            </div>

            {qrErro ? (
              <div className="qr-vazio">
                Não consegui carregar o QR
                <button type="button" className="btn btn-info btn-pequeno" onClick={() => { setQrErro(false); carregarQr.current?.(); }}>
                  ↻ Tentar de novo
                </button>
              </div>
            ) : qrUrl ? (
              <>
                <div className="qr-box">
                  <img className="qr-img" src={qrUrl} alt="QR Code do WhatsApp" onError={() => setQrErro(true)} />
                  {contagem <= 5 && contagem > 0 && <span className="qr-contagem">{contagem}s</span>}
                </div>
                <div className="dica mt-0">
                  {contagem > 0 ? `O QR se renova em ${contagem}s` : 'Renovando o QR…'}
                </div>
                <button type="button" className="btn btn-ok btn-bloco" onClick={marcarEscaneado}>
                  ✅ Já escaneei
                </button>
              </>
            ) : (
              <div className="qr-vazio">Carregando o QR Code…</div>
            )}

            <div className="page-acoes" style={{ justifyContent: 'center' }}>
              <button type="button" className="btn btn-pequeno" onClick={() => { setQrErro(false); carregarQr.current?.(); }}>
                ↻ Recarregar
              </button>
              <button type="button" className="btn btn-alerta btn-pequeno" onClick={resetarSessao} disabled={resetando}>
                {resetando ? 'Gerando…' : '🔄 Forçar QR novo'}
              </button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}

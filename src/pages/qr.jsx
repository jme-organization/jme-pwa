// src/pages/PageQR.jsx — Conexão WhatsApp
import React, { useState, useEffect, useRef } from 'react';
import { api } from '../api/client';

const API = import.meta.env.VITE_API_URL || "";

const QR_INTERVALO = 20000; // ms entre refreshes do QR
const SCAN_TIMEOUT = 60000; // ms esperando conexão após scan

export function PageQR({ status }) {
  const [qrUrl, setQrUrl] = useState(null);
  const [qrErro, setQrErro] = useState(false);
  const [desconectando, setDesconectando] = useState(false);
  const [msg, setMsg] = useState(null);
  const [resetando, setResetando] = useState(false);
  const [forceOffline, setForceOffline] = useState(false);
  const [escaneando, setEscaneando] = useState(false);
  const [countdown, setCountdown] = useState(QR_INTERVALO / 1000);
  const escaneandoTimer = useRef(null);
  const countdownTimer = useRef(null);

  const online = forceOffline ? false : status?.online;

  // Reseta forceOffline quando status real vira online
  useEffect(() => {
    if (status?.online) setForceOffline(false);
  }, [status?.online]);

  // Polling do QR quando offline
  useEffect(() => {
    if (online || escaneando) {
      setQrUrl(null);
      setCountdown(QR_INTERVALO / 1000);
      return;
    }

    const carregarQR = () => {
      setQrErro(false);
      setQrUrl(`${API}/qr?t=${Date.now()}`);
      setCountdown(QR_INTERVALO / 1000);
    };

    carregarQR();
    const t = setInterval(carregarQR, QR_INTERVALO);
    return () => clearInterval(t);
  }, [online, escaneando]);

  // Countdown visual do QR
  useEffect(() => {
    if (online || escaneando || !qrUrl) return;
    if (countdownTimer.current) clearInterval(countdownTimer.current);
    setCountdown(QR_INTERVALO / 1000);
    countdownTimer.current = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) { clearInterval(countdownTimer.current); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(countdownTimer.current);
  }, [qrUrl, online, escaneando]);

  const marcarEscaneado = () => {
    setEscaneando(true);
    if (escaneandoTimer.current) clearTimeout(escaneandoTimer.current);
    // Se em 60s não conectou, volta pro QR
    escaneandoTimer.current = setTimeout(() => {
      setEscaneando(false);
      setMsg({ tipo: 'erro', texto: 'Conexão não confirmada. Tente escanear novamente.' });
    }, SCAN_TIMEOUT);
  };

  // Cancela timer de scan se conectou
  useEffect(() => {
    if (status?.online && escaneandoTimer.current) {
      clearTimeout(escaneandoTimer.current);
      setEscaneando(false);
    }
  }, [status?.online]);

  const desconectar = async () => {
    if (!confirm('Desconectar o WhatsApp? Você precisará escanear o QR novamente.')) return;
    setDesconectando(true);
    try {
      await api.post('/api/whatsapp/desconectar');
      setForceOffline(true);
      setMsg({ tipo: 'ok', texto: 'Desconectado com sucesso.' });
    } catch(e) {
      setMsg({ tipo: 'erro', texto: e.message || 'Erro ao desconectar' });
    }
    setDesconectando(false);
  };

  const resetarSessao = async () => {
    if (!confirm('Isso vai deletar a sessão salva e forçar um novo QR Code. Continuar?')) return;
    setResetando(true);
    try {
      await api.post('/api/whatsapp/resetar-sessao');
      setMsg({ tipo: 'ok', texto: '✅ Sessão deletada! Gerando novo QR Code em instantes...' });
    } catch(e) {
      setMsg({ tipo: 'erro', texto: e.message || 'Erro ao resetar sessão' });
    }
    setResetando(false);
  };

  return (
    <div className="page" style={{ maxWidth: 540, margin: '0 auto' }}>
      <h1 className="page-title">📱 Conexão WhatsApp</h1>

      {/* Card de status */}
      <div style={{ background: '#0f1117', borderRadius: 16, padding: 24, marginBottom: 20,
        border: `1px solid ${online ? 'rgba(34,197,94,.3)' : 'rgba(239,68,68,.3)'}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 48, height: 48, borderRadius: '50%', display: 'flex',
            alignItems: 'center', justifyContent: 'center', fontSize: 24,
            background: online ? 'rgba(34,197,94,.12)' : 'rgba(239,68,68,.12)' }}>
            {online ? '✅' : '❌'}
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 16, color: online ? '#22c55e' : '#ef4444' }}>
              {online ? 'WhatsApp Conectado' : 'WhatsApp Desconectado'}
            </div>
            <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
              {online && status?.iniciadoEm
                ? `Conectado desde ${new Date(status.iniciadoEm).toLocaleString('pt-BR')}`
                : 'Escaneie o QR Code abaixo para conectar'}
            </div>
          </div>
        </div>

        {online && (
          <button onClick={desconectar} disabled={desconectando}
            style={{ marginTop: 20, width: '100%', padding: '10px 0', borderRadius: 10,
              border: '1px solid rgba(239,68,68,.4)', background: 'rgba(239,68,68,.08)',
              color: '#f87171', fontWeight: 700, fontSize: 14,
              cursor: desconectando ? 'not-allowed' : 'pointer', opacity: desconectando ? .6 : 1 }}>
            {desconectando ? 'Desconectando...' : '🔌 Desconectar WhatsApp'}
          </button>
        )}
      </div>

      {/* Mensagem de feedback */}
      {msg && (
        <div style={{ padding: '12px 16px', borderRadius: 10, marginBottom: 16, fontSize: 13,
          background: msg.tipo === 'ok' ? 'rgba(34,197,94,.08)' : 'rgba(239,68,68,.08)',
          border: `1px solid ${msg.tipo === 'ok' ? 'rgba(34,197,94,.3)' : 'rgba(239,68,68,.3)'}`,
          color: msg.tipo === 'ok' ? '#4ade80' : '#f87171',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span>{msg.texto}</span>
          <button onClick={() => setMsg(null)}
            style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: 16 }}>✕</button>
        </div>
      )}

      {/* Estado: aguardando conexão após scan */}
      {!online && escaneando && (
        <div style={{ background: '#0f1117', borderRadius: 16, padding: 40,
          border: '1px solid rgba(56,189,248,.3)', textAlign: 'center' }}>
          <div style={{ fontSize: 40, marginBottom: 16 }}>⏳</div>
          <div style={{ fontWeight: 700, fontSize: 16, color: '#38bdf8', marginBottom: 8 }}>
            Conectando ao WhatsApp...
          </div>
          <div style={{ fontSize: 13, color: '#64748b', marginBottom: 24 }}>
            Aguarde enquanto a sessão é estabelecida.<br />
            Não feche esta página.
          </div>
          <button onClick={() => setEscaneando(false)}
            style={{ padding: '8px 20px', borderRadius: 8, border: '1px solid rgba(239,68,68,.3)',
              background: 'rgba(239,68,68,.08)', color: '#f87171', fontSize: 13, cursor: 'pointer' }}>
            Cancelar — tentar novamente
          </button>
        </div>
      )}

      {/* QR Code */}
      {!online && !escaneando && (
        <div style={{ background: '#0f1117', borderRadius: 16, padding: 32,
          border: '1px solid #2d3148', textAlign: 'center' }}>
          <div style={{ color: '#94a3b8', fontSize: 14, marginBottom: 20 }}>
            Abra o WhatsApp no seu celular →<br />
            <strong style={{ color: '#e2e8f0' }}>Dispositivos conectados → Conectar dispositivo</strong>
          </div>

          <button onClick={resetarSessao} disabled={resetando}
            style={{ marginBottom: 16, width: '100%', padding: '10px 0', borderRadius: 10,
              border: '1px solid rgba(251,191,36,.4)', background: 'rgba(251,191,36,.08)',
              color: '#fbbf24', fontWeight: 700, fontSize: 14,
              cursor: resetando ? 'not-allowed' : 'pointer', opacity: resetando ? .6 : 1 }}>
            {resetando ? 'Deletando sessão...' : '🗑️ Resetar Sessão do WhatsApp'}
          </button>

          {qrErro ? (
            <div style={{ width: 240, height: 240, borderRadius: 12, background: '#1a1d2e',
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto', gap: 12 }}>
              <div style={{ color: '#f87171', fontSize: 13 }}>Erro ao carregar QR</div>
              <button onClick={() => { setQrErro(false); setQrUrl(`${API}/qr?t=${Date.now()}`); }}
                style={{ padding: '6px 16px', borderRadius: 8, border: 'none',
                  background: 'rgba(56,189,248,.15)', color: '#38bdf8', fontSize: 13, cursor: 'pointer' }}>
                ↻ Tentar novamente
              </button>
            </div>
          ) : qrUrl ? (
            <div>
              <div style={{ position: 'relative', display: 'inline-block' }}>
                <img src={qrUrl} alt="QR Code WhatsApp"
                  style={{ width: 240, height: 240, borderRadius: 12, background: '#fff', padding: 8, display: 'block' }}
                  onError={() => setQrErro(true)} />
                {countdown <= 5 && countdown > 0 && (
                  <div style={{ position: 'absolute', bottom: 8, right: 8,
                    background: 'rgba(239,68,68,.85)', borderRadius: 8,
                    padding: '2px 8px', fontSize: 12, fontWeight: 700, color: '#fff' }}>
                    {countdown}s
                  </div>
                )}
              </div>
              <div style={{ marginTop: 10, fontSize: 12, color: '#64748b' }}>
                {countdown > 0 ? `QR atualiza em ${countdown}s` : 'Atualizando QR...'}
              </div>

              {/* Botão confirmar scan */}
              <button onClick={marcarEscaneado}
                style={{ marginTop: 16, width: '100%', padding: '11px 0', borderRadius: 10,
                  border: '1px solid rgba(34,197,94,.4)', background: 'rgba(34,197,94,.1)',
                  color: '#22c55e', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>
                ✅ Já escaneei o QR Code
              </button>

              <button onClick={() => { setQrErro(false); setQrUrl(`${API}/qr?t=${Date.now()}`); }}
                style={{ marginTop: 10, padding: '7px 20px', borderRadius: 8, border: 'none',
                  background: 'rgba(56,189,248,.15)', color: '#38bdf8',
                  fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
                ↻ Recarregar QR
              </button>
            </div>
          ) : (
            <div style={{ width: 240, height: 240, borderRadius: 12, background: '#1a1d2e',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto', color: '#64748b', fontSize: 13 }}>
              Carregando QR Code...
            </div>
          )}
        </div>
      )}
    </div>
  );
}

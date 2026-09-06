// src/hooks/useSSEData.js — uma unica conexao SSE para o painel inteiro.
//
// O backend manda dois tipos de evento no MESMO stream (/api/status-stream):
//   - evento sem nome  -> status do bot (online, botAtivo, situacaoRede, qrTs)
//   - evento "update"  -> "o recurso X mudou, rebusque"
// Antes o App.jsx abria uma EventSource so pro status e este hook abria outra
// pros recursos: duas conexoes por aba. Como o servidor corta em 3 conexoes por
// IP (sseService.maxPorIp), duas abas abertas ja levavam 429 e o painel parava
// de atualizar sozinho. Agora e uma conexao so, compartilhada.
import { useState, useEffect, useCallback, useRef } from 'react';
import { api } from '../api/client';

const API = import.meta.env.VITE_API_URL || '';
const DELAY_INICIAL = 5000;
const DELAY_MAX = 60000;

let _es = null;
let _timerReconexao = null;
let _delay = DELAY_INICIAL;
const _porRecurso = new Map();   // recurso -> Set<callback>
const _deStatus = new Set();     // callback(status)

function temAssinante() {
  if (_deStatus.size > 0) return true;
  for (const cbs of _porRecurso.values()) if (cbs.size > 0) return true;
  return false;
}

function conectar() {
  if (_es || !temAssinante()) return;

  _es = new EventSource(API + '/api/status-stream');

  _es.addEventListener('open', () => { _delay = DELAY_INICIAL; });

  // status do bot
  _es.onmessage = (e) => {
    try {
      const status = JSON.parse(e.data);
      _deStatus.forEach(cb => cb(status));
    } catch (_) { /* pacote parcial: ignora */ }
  };

  // "recurso mudou"
  _es.addEventListener('update', (e) => {
    try {
      const { recurso } = JSON.parse(e.data);
      _porRecurso.get(recurso)?.forEach(cb => cb());
    } catch (_) { /* idem */ }
  });

  _es.onerror = () => {
    fecharConexao();
    if (_timerReconexao || !temAssinante()) return;
    _timerReconexao = setTimeout(() => {
      _timerReconexao = null;
      _delay = Math.min(_delay * 2, DELAY_MAX);
      conectar();
    }, _delay);
  };
}

function fecharConexao() {
  if (!_es) return;
  try { _es.close(); } catch (_) { /* ja fechada */ }
  _es = null;
}

function revisar() {
  if (temAssinante()) {
    conectar();
  } else {
    if (_timerReconexao) { clearTimeout(_timerReconexao); _timerReconexao = null; }
    fecharConexao();
  }
}

function assinarRecurso(recurso, cb) {
  if (!_porRecurso.has(recurso)) _porRecurso.set(recurso, new Set());
  _porRecurso.get(recurso).add(cb);
  revisar();
  return () => {
    const cbs = _porRecurso.get(recurso);
    cbs?.delete(cb);
    if (cbs && cbs.size === 0) _porRecurso.delete(recurso);
    revisar();
  };
}

function assinarStatus(cb) {
  _deStatus.add(cb);
  revisar();
  return () => { _deStatus.delete(cb); revisar(); };
}

// Status do bot em tempo real. O polling de 30s continua como rede de seguranca
// (/api/status nao toca o Firestore: le variavel em memoria, custo zero).
export function useStatusBot() {
  const [status, setStatus] = useState(null);

  useEffect(() => {
    let vivo = true;

    const buscar = async () => {
      try {
        const r = await fetch(API + '/api/status');
        if (r.ok && vivo) setStatus(await r.json());
      } catch (_) { /* offline: mantem o ultimo status conhecido */ }
    };

    buscar();
    const timer = setInterval(buscar, 30000);
    const cancelar = assinarStatus(s => { if (vivo) setStatus(s); });

    return () => { vivo = false; clearInterval(timer); cancelar(); };
  }, []);

  return status;
}

// `recurso` aceita um nome ou uma lista deles: ha telas (a de alertas, por
// exemplo) cujo conteudo muda quando QUALQUER um de varios recursos muda, e o
// backend nunca emite um evento proprio pra elas.
export function useSSEData(url, recurso) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const montadoRef = useRef(true);
  const loadRef = useRef(null);

  const load = useCallback(async () => {
    if (!montadoRef.current) return;
    try {
      setLoading(true);
      const json = await api.get(url);
      if (montadoRef.current) {
        setData(json);
        setError(null);
      }
    } catch (e) {
      if (montadoRef.current) setError(e.message);
    } finally {
      if (montadoRef.current) setLoading(false);
    }
  }, [url]);

  loadRef.current = load;
  const loadEstavel = useCallback(() => loadRef.current?.(), []);

  // Array vira string estavel pra nao reassinar a cada render.
  const chaveRecurso = Array.isArray(recurso) ? recurso.join(',') : (recurso || '');

  useEffect(() => {
    montadoRef.current = true;
    loadEstavel();
    const cancelamentos = chaveRecurso
      ? chaveRecurso.split(',').map(r => assinarRecurso(r, loadEstavel))
      : [];
    return () => {
      montadoRef.current = false;
      cancelamentos.forEach(cancelar => cancelar());
    };
    // `url` entra aqui de proposito: tela que troca a URL (filtro na query)
    // precisa rebuscar, e o loadEstavel sozinho nunca muda.
  }, [url, chaveRecurso, loadEstavel]);

  return { data, loading, error, refetch: load };
}

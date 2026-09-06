// src/utils/formatadores.js

// O backend grava data de dois jeitos: string ISO na maioria das rotas e
// Timestamp do Firestore em `dbLog` (log_bot). O Timestamp chega no JSON como
// { _seconds, _nanoseconds } — `new Date(objeto)` nisso da "Invalid Date", que
// era o que a tela de registros mostrava. Toda conversao passa por aqui.
export const paraData = (valor) => {
  if (!valor) return null;
  if (valor instanceof Date) return Number.isNaN(valor.getTime()) ? null : valor;
  if (typeof valor === 'object') {
    const seg = valor._seconds ?? valor.seconds;
    if (typeof seg === 'number') return new Date(seg * 1000);
    return null;
  }
  if (typeof valor === 'number') return new Date(valor);
  const d = new Date(valor);
  return Number.isNaN(d.getTime()) ? null : d;
};

// Data + hora curtas
export const fmtDate = (valor) => {
  const d = paraData(valor);
  return d ? d.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }) : '—';
};

// Só a data
export const fmtDataCurta = (valor) => {
  const d = paraData(valor);
  return d ? d.toLocaleDateString('pt-BR') : '—';
};

// Data para <input type="date">
export const fmtDataInput = (valor) => {
  const d = paraData(valor);
  if (!d) return '';
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mm}-${dd}`;
};

// Telefone sem o sufixo do WhatsApp e sem o 55
export const fmtTel = (n) => {
  if (!n) return '—';
  return n.replace('@c.us', '').replace(/^55/, '') || '—';
};

export const fmtMoeda = (v) => {
  if (v === null || v === undefined || Number.isNaN(Number(v))) return '—';
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(v));
};

export const tempoDecorrido = (valor) => {
  const d = paraData(valor);
  if (!d) return '—';
  const min = Math.floor((Date.now() - d.getTime()) / 60000);
  if (min < 1) return 'agora';
  if (min < 60) return `${min}min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h}h ${min % 60}min`;
  return `${Math.floor(h / 24)}d ${h % 24}h`;
};

export const truncar = (str, tamanho = 50) => {
  if (!str) return '';
  return str.length <= tamanho ? str : `${str.slice(0, tamanho)}…`;
};

export const capitalizar = (str) => (str ? str.charAt(0).toUpperCase() + str.slice(1).toLowerCase() : '');

export const removerAcentos = (str) => (str ? str.normalize('NFD').replace(/[\u0300-\u036f]/g, '') : '');

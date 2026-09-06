import React from 'react';

const MAPA = {
  pago: ['badge-pago', 'PAGO'],
  pendente: ['badge-pendente', 'PENDENTE'],
  isento: ['badge-isento', 'ISENTO'],
};

export const Badge = ({ type }) => {
  const [cls, label] = MAPA[type] || ['badge-neutro', String(type || '—').toUpperCase()];
  return <span className={`badge ${cls}`}>{label}</span>;
};

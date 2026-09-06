// src/components/ficha/Recado.jsx — o retorno de uma ação dentro da ficha.
import React from 'react';

export function Recado({ msg }) {
  if (!msg) return null;
  return <div className={`aviso ${msg.ok ? 'aviso-ok' : 'aviso-erro'} mb-2`}>{msg.txt}</div>;
}

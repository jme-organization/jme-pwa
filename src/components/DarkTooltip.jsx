// src/components/DarkTooltip.jsx — dica dos graficos, no tema em vigor.
import React from 'react';

export const DarkTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="grafico-dica">
      <span className="grafico-dica-rotulo">{label}</span>
      {payload[0].value}
    </div>
  );
};

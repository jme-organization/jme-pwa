// src/components/DonutClientes.jsx — composicao da base num anel.
import React from 'react';
import { PieChart, Pie, Cell, Tooltip } from 'recharts';
import { useCorTokens } from '../hooks/useCorTokens';

export const DonutClientes = ({ ativos, cancelados, pendentes, promessas, instalacoes }) => {
  const cor = useCorTokens();
  const total = (ativos || 0) + (cancelados || 0);

  if (!total) {
    return (
      <div className="vazio">
        <span className="vazio-emoji">📭</span>
        Nenhuma base carregada ainda
      </div>
    );
  }

  const pagos = Math.max(0, ativos - pendentes - promessas);
  const fatias = [
    { nome: 'Pagos', valor: pagos, cor: cor.green },
    { nome: 'Pendentes', valor: pendentes, cor: cor.amber },
    { nome: 'Promessas', valor: promessas, cor: cor.purple },
    { nome: 'Cancelados', valor: cancelados, cor: cor.red },
    { nome: 'Instalações', valor: instalacoes || 0, cor: cor.blue },
  ].filter(f => f.valor > 0);

  return (
    <div className="donut">
      <PieChart width={132} height={132}>
        <Pie
          data={fatias}
          cx={61}
          cy={61}
          innerRadius={39}
          outerRadius={60}
          dataKey="valor"
          nameKey="nome"
          paddingAngle={2}
          strokeWidth={0}
          isAnimationActive={false}
        >
          {fatias.map(f => <Cell key={f.nome} fill={f.cor} />)}
        </Pie>
        <Tooltip
          content={({ active, payload }) => {
            if (!active || !payload?.length) return null;
            const { name, value } = payload[0];
            return <div className="grafico-dica">{name}: <b>{value}</b></div>;
          }}
        />
      </PieChart>

      <ul className="donut-legenda">
        {fatias.map(f => (
          <li key={f.nome}>
            {/* cor calculada em tempo de execucao: vem do token do tema */}
            <span className="donut-ponto" style={{ background: f.cor }} />
            <span className="donut-nome">{f.nome}</span>
            <span className="donut-valor">{f.valor}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

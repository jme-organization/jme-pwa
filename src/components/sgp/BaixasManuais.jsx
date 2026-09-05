// src/components/sgp/BaixasManuais.jsx
// Lista antiga da flag `baixa_sgp`: clientes que o dono marcou como "preciso
// lançar isso no SGP na mão". Continua valendo para quem a integração não casa
// (sem CPF válido) e para pagamento em dinheiro que nasce aqui.
import React, { useState } from 'react';
import { Card } from '../Card';
import { Badge } from '../Badge';
import { api } from '../../api/client';

export function BaixasManuais({ planilha, onConfirmado }) {
  const [confirmando, setConfirmando] = useState({});
  const [confirmados, setConfirmados] = useState({});

  const pendentes = planilha
    ? Object.entries(planilha).flatMap(([aba, info]) =>
        (info.clientes || []).filter(c => c.baixa_sgp).map(c => ({ ...c, aba })))
    : [];

  const porAba = ['Data 10', 'Data 20', 'Data 30']
    .map(aba => ({ aba, clientes: pendentes.filter(c => c.aba === aba) }))
    .filter(g => g.clientes.length > 0);

  const confirmar = async (nome, aba) => {
    const key = `${aba}-${nome}`;
    setConfirmando(p => ({ ...p, [key]: true }));
    try {
      await api.post('/api/sgp/confirmar', { nome, aba });
      setConfirmados(p => ({ ...p, [key]: true }));
      setTimeout(() => onConfirmado?.(), 1000);
    } catch (e) {
      console.error(e);
    } finally {
      setConfirmando(p => ({ ...p, [key]: false }));
    }
  };

  return (
    <Card className="sgp-secao">
      <div className="sgp-secao-titulo">
        <span>✍️ Baixas para lançar no SGP na mão</span>
        <span className="sgp-detalhe">{pendentes.length}</span>
      </div>

      {porAba.length === 0 ? (
        <div className="sgp-vazio">
          <span className="sgp-vazio-emoji">✅</span>
          Nenhuma baixa manual pendente.
        </div>
      ) : (
        porAba.map(({ aba, clientes }) => (
          <div key={aba}>
            <div className="sgp-secao-sub">{aba} — {clientes.length} pendente(s)</div>
            {clientes.map((c, i) => {
              const key = `${aba}-${c.nome}`;
              const feito = confirmados[key];
              return (
                <div className="sgp-linha" key={`${key}-${i}`}>
                  <span className="sgp-nome">{c.nome}</span>
                  <Badge type={c.status} />
                  <span className="sgp-detalhe">{c.forma || '—'}</span>
                  {feito ? (
                    <span className="sgp-detalhe">✅ Confirmado</span>
                  ) : (
                    <button
                      className="sgp-btn"
                      disabled={confirmando[key]}
                      onClick={() => confirmar(c.nome, aba)}
                    >
                      {confirmando[key] ? 'Salvando…' : '✔ Dei baixa no SGP'}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        ))
      )}
    </Card>
  );
}

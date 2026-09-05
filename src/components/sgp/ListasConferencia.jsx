// src/components/sgp/ListasConferencia.jsx
import React from 'react';
import { Card } from '../Card';

const dataBR = (iso) => (iso ? String(iso).split('-').reverse().join('/') : '—');
const dinheiro = (v) => (v || v === 0 ? `R$ ${Number(v).toFixed(2).replace('.', ',')}` : '—');

function Vazio({ emoji, texto }) {
  return (
    <div className="sgp-vazio">
      <span className="sgp-vazio-emoji">{emoji}</span>
      {texto}
    </div>
  );
}

// Pagos no SGP que ainda não estão refletidos aqui. Numa rodada normal a lista
// vem vazia — ela só enche quando o sync está parado ou acabou de ser ligado.
export function ListaPendentes({ itens }) {
  return (
    <Card className="sgp-secao">
      <div className="sgp-secao-titulo">
        <span>💰 Pagos no SGP, ainda não refletidos aqui</span>
        <span className="sgp-detalhe">{itens.length}</span>
      </div>
      {itens.length === 0 ? (
        <Vazio emoji="✅" texto="Nada pendente — o painel está igual ao SGP." />
      ) : (
        itens.map((d, i) => (
          <div className="sgp-linha" key={`${d.id}-${d.ciclo}-${i}`}>
            <span className="sgp-nome">{d.nome}</span>
            <span className="sgp-detalhe">
              ciclo {d.ciclo}{d.cicloCorrente ? '' : ' (anterior)'} · venc. {dataBR(d.vencimento)} ·
              pago em {dataBR(d.pagoEm)} · {dinheiro(d.valor)} {d.forma ? `· ${d.forma}` : ''}
            </span>
          </div>
        ))
      )}
    </Card>
  );
}

// Pago aqui e aberto no SGP. O sync NUNCA reverte isso sozinho: parte do dinheiro
// entra em espécie e a baixa lá é que ficou faltando. Quem decide é o dono.
export function ListaDivergencias({ itens }) {
  return (
    <Card className="sgp-secao">
      <div className="sgp-secao-titulo">
        <span>⚠️ Pago aqui, em aberto no SGP</span>
        <span className="sgp-detalhe">{itens.length}</span>
      </div>
      <div className="sgp-secao-sub">
        O painel não mexe nesses — pode ser pagamento em dinheiro que ainda não foi lançado no SGP.
        Confira e dê a baixa lá, ou corrija aqui.
      </div>
      {itens.length === 0 ? (
        <Vazio emoji="👍" texto="Nenhuma divergência." />
      ) : (
        itens.map((d, i) => (
          <div className="sgp-linha" key={`${d.id}-${i}`}>
            <span className="sgp-nome">{d.nome}</span>
            <span className="sgp-detalhe">
              ciclo {d.ciclo} · venc. {dataBR(d.vencimento)} · boleto {d.documento}
            </span>
            <span className="sgp-motivo">aberto no SGP</span>
          </div>
        ))
      )}
    </Card>
  );
}

// Quem a integração não consegue casar. Enquanto o CPF não for corrigido no
// cadastro, esses clientes seguem 100% no fluxo manual.
export function ListaSemMatch({ itens }) {
  return (
    <Card className="sgp-secao">
      <div className="sgp-secao-titulo">
        <span>🔍 Sem correspondência no SGP</span>
        <span className="sgp-detalhe">{itens.length}</span>
      </div>
      <div className="sgp-secao-sub">
        Esses não sincronizam: sem CPF válido aqui, ou o CPF não acha título no SGP. Corrigir o
        cadastro resolve.
      </div>
      {itens.length === 0 ? (
        <Vazio emoji="🎯" texto="Todo mundo casou com o SGP." />
      ) : (
        itens.map((d, i) => (
          <div className="sgp-linha" key={`${d.id}-${i}`}>
            <span className="sgp-nome">{d.nome}</span>
            <span className="sgp-motivo">{d.motivo}</span>
          </div>
        ))
      )}
    </Card>
  );
}

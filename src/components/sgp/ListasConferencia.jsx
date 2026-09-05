// src/components/sgp/ListasConferencia.jsx
import React, { useState } from 'react';
import { Card } from '../Card';
import { api } from '../../api/client';

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

// Contrato que o SGP mostra fora de 'Ativo' (suspenso, cancelado lá). O painel
// NÃO aplica isso sozinho — bloquear é decisão do dono, e a suspensão lá pode
// ser temporária ou engano. Aqui ele vê e aplica com um clique.
export function ListaSuspensos({ itens, onAplicado }) {
  const [aplicando, setAplicando] = useState(null);
  const [erro, setErro] = useState(null);

  const bloquear = async (item) => {
    if (!window.confirm(
      `Bloquear ${item.nome} aqui?

O SGP mostra o contrato como ${item.statusSgp}. ` +
      `Ele sai da cobrança e das contas do dia. Não é cancelamento.`
    )) return;
    setAplicando(item.id);
    setErro(null);
    try {
      await api.post(`/api/bases/${item.base_id}/clientes/${item.id}/bloqueio`, {
        bloquear: true,
        motivo: `Contrato ${item.statusSgp} no SGP${item.motivo ? ` — ${item.motivo}` : ''}`,
      });
      onAplicado?.();
    } catch (e) {
      setErro(`Não consegui bloquear ${item.nome}: ${e.message}`);
    } finally {
      setAplicando(null);
    }
  };

  // Quem já está bloqueado aqui não precisa aparecer: painel e SGP concordam.
  const relevantes = itens.filter(i => i.statusAqui !== 'bloqueado' && i.statusAqui !== 'cancelado');

  // 'Ativo V. Reduzida' é velocidade reduzida por falta de pagamento — o serviço
  // ainda está de pé, o cliente continua sendo cobrado, e bloquear aqui seria
  // errado. Vira aviso sem botão. Só 'Suspenso' e 'Cancelado' ganham a ação.
  const cortados = relevantes.filter(i => /^(suspenso|cancelado)/i.test(i.statusSgp || ''));
  const reduzidos = relevantes.filter(i => !/^(suspenso|cancelado)/i.test(i.statusSgp || ''));

  return (
    <Card className="sgp-secao">
      <div className="sgp-secao-titulo">
        <span>🚫 Situação do contrato no SGP</span>
        <span className="sgp-detalhe">{cortados.length + reduzidos.length}</span>
      </div>
      <div className="sgp-secao-sub">
        Contratos que no SGP não estão simplesmente ativos. Suspenso e cancelado podem virar
        bloqueio aqui — com o seu clique, o painel não aplica sozinho.
      </div>
      {erro && <div className="sgp-erro">{erro}</div>}
      {cortados.length === 0 && reduzidos.length === 0 ? (
        <Vazio emoji="👌" texto="Nenhum contrato fora de sincronia." />
      ) : (
        <>
          {cortados.map((d, i) => (
            <div className="sgp-linha" key={`${d.id}-${i}`}>
              <span className="sgp-nome">{d.nome}</span>
              <span className="sgp-motivo">{d.statusSgp}{d.motivo ? ` — ${d.motivo}` : ''}</span>
              <span className="sgp-detalhe">aqui: {d.statusAqui || 'pendente'}</span>
              <button
                className="sgp-btn"
                disabled={aplicando === d.id || d.base_id === null}
                onClick={() => bloquear(d)}
              >
                {aplicando === d.id ? 'Bloqueando…' : '🚫 Bloquear aqui'}
              </button>
            </div>
          ))}
          {reduzidos.length > 0 && (
            <>
              <div className="sgp-secao-sub">
                Velocidade reduzida no SGP — o serviço continua de pé e o cliente segue no ciclo de
                cobrança. É aviso, não motivo pra bloquear.
              </div>
              {reduzidos.map((d, i) => (
                <div className="sgp-linha" key={`red-${d.id}-${i}`}>
                  <span className="sgp-nome">{d.nome}</span>
                  <span className="sgp-motivo">{d.statusSgp}</span>
                  <span className="sgp-detalhe">aqui: {d.statusAqui || 'pendente'}</span>
                </div>
              ))}
            </>
          )}
        </>
      )}
    </Card>
  );
}

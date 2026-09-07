// src/components/fttx/PainelOnu.jsx
// A ONU escolhida: o que se sabe dela, e o que da pra fazer com ela.
//
// A confirmacao do desautorizar mora AQUI dentro, e nao num modal, porque o
// dono precisa continuar vendo de qual ONU se trata enquanto digita. O acidente
// que isso evita e clicar na linha vizinha numa tabela de 414.
import React, { useState } from 'react';
import { Sinal, CelulaCliente } from './sinal';

export function PainelOnu({ onu, escritaHabilitada, onOperar, ocupado }) {
  const [confirmando, setConfirmando] = useState(false);
  const [texto, setTexto] = useState('');

  if (!onu) return null;

  const fim = String(onu.phy_addr || '').slice(-4).toUpperCase();
  const podeConfirmar = texto.trim().toUpperCase() === fim;

  const desautorizar = () => {
    onOperar('desautorizar', onu, texto.trim().toUpperCase());
    setConfirmando(false);
    setTexto('');
  };

  return (
    <div className="card card-pad mb-3">
      <div className="card-cab">
        <div className="card-titulo">
          <CelulaCliente cliente={onu._cliente} />
        </div>
        <Sinal rx={onu.info_rx} />
      </div>

      <div className="secao-rotulo">Serial</div>
      <div className="td-mono mb-2">{onu.phy_addr}</div>

      <div className="onu-barra">
        <span className="onu-contagem">PON {onu.slot}/{onu.pon}</span>
        <span className="onu-contagem">VLAN {onu.vlan}</span>
        <span className="onu-contagem">{onu.mode}</span>
        {onu.login && <span className="onu-contagem">login {onu.login}</span>}
        {onu.description && <span className="onu-contagem td-corta">{onu.description}</span>}
      </div>

      {!escritaHabilitada && (
        <div className="aviso aviso-info mt-2">
          A operação de ONU está desligada no servidor. Só dá para consultar.
        </div>
      )}

      {escritaHabilitada && !confirmando && (
        <div className="page-acoes mt-2">
          {/* Reset e reversivel: o aparelho reinicia e volta. Por isso amarelo,
              nao vermelho — a cor diz a consequencia. */}
          <button
            className="btn btn-alerta btn-pequeno"
            disabled={ocupado}
            onClick={() => onOperar('resetar', onu)}
          >
            Reiniciar ONU
          </button>
          <button
            className="btn btn-perigo btn-pequeno"
            disabled={ocupado}
            onClick={() => setConfirmando(true)}
          >
            Desautorizar
          </button>
        </div>
      )}

      {confirmando && (
        <div className="onu-confirma">
          <div className="onu-confirma-alvo">
            Isto derruba o serviço desta ONU.
            {onu._cliente?.estado === 'casado' ? ` Cliente: ${onu._cliente.nome}.` : ' Sem cliente identificado.'}
          </div>
          <div className="onu-confirma-linha">
            <div className="campo onu-confirma-campo">
              <label className="rotulo">Digite os 4 últimos do serial ({fim.length === 4 ? '••••' : '—'})</label>
              <input
                className="entrada"
                value={texto}
                onChange={e => setTexto(e.target.value)}
                placeholder={fim.replace(/./g, '•')}
                autoFocus
              />
            </div>
            <button className="btn btn-perigo btn-pequeno" disabled={!podeConfirmar || ocupado} onClick={desautorizar}>
              Desautorizar
            </button>
            <button className="btn btn-fantasma btn-pequeno" onClick={() => { setConfirmando(false); setTexto(''); }}>
              Cancelar
            </button>
          </div>
          <div className="dica mt-1">
            O SGP costuma demorar e responder erro mesmo quando funciona. O painel confere
            sozinho se a ONU saiu e avisa — o comando não é reenviado.
          </div>
        </div>
      )}
    </div>
  );
}

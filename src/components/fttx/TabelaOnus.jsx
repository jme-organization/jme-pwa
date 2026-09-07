// src/components/fttx/TabelaOnus.jsx
// A lista das ONUs da OLT, com busca.
//
// Sao 414 linhas. A busca e o que torna a tela usavel — o dono chega nela
// sabendo um nome, um login ou o final de um serial, nunca o id.
import React, { useMemo, useState } from 'react';
import { Sinal, CelulaCliente } from './sinal';

function combina(onu, termo) {
  if (!termo) return true;
  const alvo = [
    onu.login,
    onu.phy_addr,
    onu.description,
    onu.ident,
    onu._cliente?.nome,
    `pon ${onu.pon}`,
  ].filter(Boolean).join(' ').toLowerCase();
  return alvo.includes(termo);
}

export function TabelaOnus({ onus, resumo, idadeMs, onEscolher, escolhida, onAtualizar, atualizando }) {
  const [busca, setBusca] = useState('');

  const filtradas = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    return onus.filter(o => combina(o, termo));
  }, [onus, busca]);

  const idade = idadeMs == null ? null : Math.round(idadeMs / 1000);

  return (
    <div className="card card-pad">
      <div className="onu-barra">
        <input
          className="entrada onu-busca"
          placeholder="Buscar por nome, login, serial, descrição ou PON…"
          value={busca}
          onChange={e => setBusca(e.target.value)}
        />
        <span className="onu-contagem">
          {filtradas.length === onus.length
            ? `${onus.length} ONUs`
            : `${filtradas.length} de ${onus.length}`}
          {resumo?.casado ? ` · ${resumo.casado} com cliente` : ''}
          {idade !== null ? ` · lido há ${idade}s` : ''}
        </span>
        <button className="btn btn-fantasma btn-pequeno" onClick={onAtualizar} disabled={atualizando}>
          {atualizando ? 'Atualizando…' : 'Atualizar agora'}
        </button>
      </div>

      <div className="tabela-scroll">
        <table className="tabela">
          <thead>
            <tr>
              <th>Cliente</th>
              <th>Login</th>
              <th>Serial</th>
              <th className="td-centro">PON</th>
              <th className="td-centro">Modo</th>
              <th className="td-fim">Sinal</th>
            </tr>
          </thead>
          <tbody>
            {filtradas.length === 0 && (
              <tr><td colSpan={6} className="td-empty">Nenhuma ONU com esse termo.</td></tr>
            )}
            {filtradas.map(onu => (
              <tr
                key={onu.id}
                className={`linha-clicavel${escolhida?.id === onu.id ? ' linha-ativa' : ''}`}
                onClick={() => onEscolher(onu)}
              >
                <td className="td-nome"><CelulaCliente cliente={onu._cliente} /></td>
                <td className="td-corta">{onu.login || <span className="td-muted">—</span>}</td>
                <td className="td-mono td-corta">{onu.phy_addr}</td>
                <td className="td-centro td-mono">{onu.slot}/{onu.pon}</td>
                <td className="td-centro">{onu.mode}</td>
                <td className="td-fim"><Sinal rx={onu.info_rx} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

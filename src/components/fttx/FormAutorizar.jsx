// src/components/fttx/FormAutorizar.jsx
// Subir uma ONU que apareceu na OLT.
//
// Reproduz o que o dono faz hoje na tela do SGP, na mesma ordem: digita o PPPoE,
// escolhe o cliente que aparece, confere a senha (padrao 123), a descricao
// (`Jme - nome`) e o modo. VLAN, tipo de ONU e template NAO estao aqui — sao
// decididos no servidor, porque configurar equipamento de cliente com valor
// vindo do navegador e como deixar a chave na porta.
import React, { useEffect, useState } from 'react';
import { api } from '../../api/client';

// A senha que o dono usa em toda instalacao. Fica editavel porque um dia ele
// pode mudar de ideia, mas ninguem deveria ter que digitar a mesma coisa 400x.
const SENHA_PADRAO = '123';

// Primeiro nome, em caixa de titulo: e o formato que a base ja usa ("Jme - daniel").
function descricaoSugerida(nome) {
  const primeiro = String(nome || '').trim().split(/\s+/)[0] || '';
  if (!primeiro) return '';
  return `Jme - ${primeiro.charAt(0) + primeiro.slice(1).toLowerCase()}`;
}

export function FormAutorizar({ onu, onAutorizar, onCancelar, ocupado }) {
  const [busca, setBusca] = useState('');
  const [achados, setAchados] = useState([]);
  const [cliente, setCliente] = useState(null);
  const [senha, setSenha] = useState(SENHA_PADRAO);
  const [descricao, setDescricao] = useState('');
  const [modo, setModo] = useState('pppoe');

  // Busca enquanto digita, com uma pausa pra nao consultar a cada tecla.
  useEffect(() => {
    if (cliente || busca.trim().length < 2) { setAchados([]); return undefined; }
    const t = setTimeout(async () => {
      try {
        const r = await api.get(`/api/fttx/servicos?q=${encodeURIComponent(busca.trim())}`);
        setAchados(r.itens || []);
      } catch { setAchados([]); }
    }, 300);
    return () => clearTimeout(t);
  }, [busca, cliente]);

  const escolher = (item) => {
    setCliente(item);
    setBusca(item.login);
    setAchados([]);
    if (!descricao) setDescricao(descricaoSugerida(item.nome));
  };

  const trocar = () => { setCliente(null); setBusca(''); setDescricao(''); };

  const enviar = () => {
    onAutorizar({
      serial: onu.phy_addr || onu.phyAddr,
      slot: onu.slot,
      pon: onu.pon,
      modo,
      descricao: descricao.trim(),
      contratoId: cliente?.contratoId ?? null,
      pppoeLogin: cliente?.login || null,
      pppoeSenha: senha,
    });
  };

  return (
    <div className="card card-pad mb-3">
      <div className="card-cab">
        <div className="card-titulo">Subir ONU</div>
        <span className="td-mono">{onu.phy_addr || onu.phyAddr}</span>
      </div>

      <div className="onu-barra">
        <span className="onu-contagem">PON {onu.slot}/{onu.pon}</span>
        <span className="onu-contagem">VLAN 100</span>
        <span className="onu-contagem">ONU-1</span>
        <span className="onu-contagem">TEMPLATE HUAWEI NE</span>
      </div>

      <div className="campo">
        <label className="rotulo">Login PPPoE do cliente</label>
        {cliente ? (
          <div className="onu-job">
            <span className="badge badge-pago">{cliente.login}</span>
            <span>{cliente.nome}</span>
            <span className="td-muted">contrato {cliente.contratoId ?? '—'}</span>
            <button className="btn btn-fantasma btn-pequeno" onClick={trocar}>Trocar</button>
          </div>
        ) : (
          <>
            <input
              className="entrada"
              placeholder="Digite o PPPoE ou o nome…"
              value={busca}
              onChange={e => setBusca(e.target.value)}
              autoFocus
            />
            {achados.length > 0 && (
              <div className="mt-1">
                {achados.map(item => (
                  <div className="onu-job linha-clicavel" key={item.login} onClick={() => escolher(item)}>
                    <span className="badge badge-info">{item.login}</span>
                    <span>{item.nome}</span>
                    <span className="td-muted">contrato {item.contratoId ?? '—'}</span>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      <div className="onu-confirma-linha mt-2">
        <div className="campo onu-confirma-campo">
          <label className="rotulo">Senha PPPoE</label>
          <input className="entrada" value={senha} onChange={e => setSenha(e.target.value)} />
        </div>
        <div className="campo onu-confirma-campo">
          <label className="rotulo">Descrição</label>
          <input
            className="entrada"
            value={descricao}
            onChange={e => setDescricao(e.target.value)}
            placeholder="Jme - nome"
          />
        </div>
        <div className="campo onu-confirma-campo">
          <label className="rotulo">Modo</label>
          <select className="entrada" value={modo} onChange={e => setModo(e.target.value)}>
            <option value="pppoe">PPPoE</option>
            <option value="bridge">Bridge</option>
            <option value="bridge_wan">Bridge WAN</option>
            <option value="dhcp">DHCP</option>
          </select>
        </div>
      </div>

      <div className="page-acoes mt-2">
        <button
          className="btn btn-ok btn-pequeno"
          disabled={ocupado || !descricao.trim() || (modo === 'pppoe' && !cliente)}
          onClick={enviar}
        >
          Autorizar ONU
        </button>
        <button className="btn btn-fantasma btn-pequeno" onClick={onCancelar}>Cancelar</button>
      </div>

      {modo === 'pppoe' && !cliente && (
        <div className="dica mt-1">Escolha o cliente antes de subir em PPPoE — é o que amarra o serviço ao contrato.</div>
      )}
    </div>
  );
}

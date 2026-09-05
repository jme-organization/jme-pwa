// src/components/VisualizadorBase.jsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from './Card';
import { Spinner } from './Spinner';
import { BadgeCliente } from './BadgeCliente';
import { ModalEditarCliente } from './ModalEditarCliente';
import { ModalNovoClienteBase } from './ModalNovoClientebase';
import * as XLSX from "https://cdn.sheetjs.com/xlsx-0.20.0/package/xlsx.mjs";
import { api } from '../api/client';

export const VisualizadorBase = ({ base, onVoltar }) => {
  const [diaAtivo, setDiaAtivo] = useState(base?.dias?.[0] || 10);
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [busca, setBusca] = useState("");
  const [filtro, setFiltro] = useState("todos");
  const [mesReferencia, setMesReferencia] = useState(null);
  const [modoMes, setModoMes] = useState("corrente"); // "corrente" | "passado"
  const [modalCliente, setModalCliente] = useState(null);
  const [modalNovoCliente, setModalNovoCliente] = useState(false);
  const [pagina, setPagina] = useState(1);
  const itensPorPagina = 20;
  const navigate = useNavigate();
  const reqIdRef = useRef(0);
  const [bloqueando, setBloqueando] = useState(null); // id do cliente em operacao

  // Bloqueado e o meio-termo entre cobrar e cancelar: servico cortado, cliente
  // ainda recuperavel. Ele sai da tabela do dia e das contas (pagos/pendentes/
  // inadimplentes/%) e vai pra lista ao lado — senao ficava eternamente
  // "pendente" inflando a inadimplencia de todo mes.
  const ehBloqueado = (c) => (c.status_calculado || c.status) === 'bloqueado';

  const alternarBloqueio = async (cliente, bloquear) => {
    if (bloquear && !window.confirm(`Bloquear ${cliente.nome}?

Ele sai da lista do dia e para de receber cobrança. Não é cancelamento.`)) return;
    setBloqueando(cliente.id);
    try {
      await api.post(`/api/bases/${base.id}/clientes/${cliente.id}/bloqueio`, { bloquear });
      await carregar(true);
    } catch (e) {
      alert(`Erro: ${e.message}`);
    }
    setBloqueando(null);
  };

  const mesRefAnterior = () => {
    const agora = new Date();
    const d = new Date(agora.getFullYear(), agora.getMonth() - 1, 1);
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const yy = d.getFullYear();
    return `${mm}-${yy}`;
  };

  const mesRefCorrente = () => {
    const agora = new Date();
    const mm = String(agora.getMonth() + 1).padStart(2, "0");
    const yy = agora.getFullYear();
    return `${mm}-${yy}`;
  };

  // Função para calcular status histórico (como estava no último dia do mês)
  const calcularStatusHistorico = (cliente, mesRef) => {
    if (cliente.status === 'cancelado') return 'cancelado';
    if (cliente.status === 'bloqueado') return 'bloqueado';
    if (cliente.status === 'promessa') return 'promessa';
    
    const [mes, ano] = mesRef.split('-').map(Number);
    const ultimoDia = new Date(ano, mes, 0).getDate();
    
    const diaVenc = parseInt(cliente.dia_vencimento) || 10;
    const reg = cliente._historico?.[mesRef] || null;
    
    // Se já estava pago na época
    if (reg && (reg.status === 'pago' || reg.status === 'isento')) {
      return 'pago';
    }
    
    // Calcula se estava inadimplente na época
    const vencEfetivo = Math.min(diaVenc, ultimoDia);
    
    // Verifica se já tinha passado da tolerância no último dia do mês
    let diasTolerancia;
    if (diaVenc === 10) diasTolerancia = 15;
    else if (diaVenc === 20) diasTolerancia = 25;
    else diasTolerancia = 5;
    
    // Para data 30, a tolerância é no mês seguinte
    if (diaVenc === 30) {
      // No mês de referência (ex: março), ainda não passou da tolerância
      // A tolerância só vence dia 5 do mês seguinte
      return 'pendente';
    }
    
    // Para data 10 e 20: se o último dia do mês já passou da tolerância
    if (ultimoDia > diasTolerancia) {
      return 'inadimplente';
    }
    
    return 'pendente';
  };

  const carregar = useCallback(async (silencioso = false, modoMesOverride = null) => {
    if (!base?.id) return;
    if (!silencioso) setLoading(true);
    const modoAtual = modoMesOverride ?? modoMes;
    try {
      const qs = new URLSearchParams();
      if (modoAtual === "corrente") {
        qs.set("mes_ref", mesRefCorrente()); // Mês atual
      } else if (modoAtual === "passado") {
        qs.set("mes_ref", mesRefAnterior()); // Mês anterior
      }
      const reqId = ++reqIdRef.current;
      const data = await api.get(`/api/bases/${base.id}/clientes${qs.toString() ? `?${qs.toString()}` : ""}`);
      if (reqId === reqIdRef.current) {
        setClientes(data);
      }
    } catch (e) {
      console.error(e);
    }
    if (!silencioso) setLoading(false);
  }, [base?.id, modoMes]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  useEffect(() => {
    api.get("/api/ciclo-info")
      .then(d => setMesReferencia(d))
      .catch(() => {});
  }, []);

  useEffect(() => {
    setPagina(1);
  }, [diaAtivo, filtro, busca]);

  // Early return após todos os hooks (hooks não podem ser chamados condicionalmente)
  if (!base?.id) {
    return (
      <div className="page">
        <button onClick={onVoltar} style={{ background: 'none', border: 'none', color: '#38bdf8', fontSize: 14, cursor: 'pointer', marginBottom: 16 }}>
          ← Bases
        </button>
        <div style={{ padding: '2rem', color: '#64748b' }}>
          Base não encontrada.
        </div>
      </div>
    );
  }

  const clientesDia = clientes.filter(c => parseInt(c.dia_vencimento) === diaAtivo && !ehBloqueado(c));
  const filtrados = clientesDia.filter(c => {
    if (filtro !== "todos") {
      const statusParaComparar = c.status_calculado || c.status;
      if (filtro === 'pendente') {
        if (statusParaComparar !== 'pendente' && statusParaComparar !== 'em_dia') return false;
      } else {
        if (statusParaComparar !== filtro) return false;
      }
    }
    const b = busca.toLowerCase();
    return !b || 
      (c.nome || "").toLowerCase().includes(b) || 
      (c.telefone || "").includes(b) || 
      (c.cpf || "").includes(b) || 
      (c.endereco || "").toLowerCase().includes(b);
  });

  const inicio = (pagina - 1) * itensPorPagina;
  const fim = inicio + itensPorPagina;
  const clientesPagina = filtrados.slice(inicio, fim);
  const totalPaginas = Math.ceil(filtrados.length / itensPorPagina);

  const stats = (arr) => ({
    pagos: arr.filter(c => {
      const status = c.status_calculado || c.status;
      return status === "pago";
    }).length,
    pend: arr.filter(c => {
      const status = c.status_calculado || c.status;
      return status === "pendente" || status === "em_dia";
    }).length,
    inad: arr.filter(c => {
      const status = c.status_calculado || c.status;
      return status === "inadimplente";
    }).length,
    prom: arr.filter(c => {
      const status = c.status_calculado || c.status;
      return status === "promessa";
    }).length,
    total: arr.length,
    pct: arr.length > 0 ? Math.round((arr.filter(c => {
      const status = c.status_calculado || c.status;
      return status === "pago";
    }).length / arr.length) * 100) : 0,
  });

  const s = stats(clientesDia);
  const stotal = stats(clientes.filter(c => !ehBloqueado(c)));
  const totalBloqueados = clientes.filter(ehBloqueado).length;

  const onSalvo = () => {
    // Refetch em vez de merge local — status_calculado e outros campos
    // derivados so vem certo do backend, merge raso deixava a tela
    // desatualizada ate dar F5. O modal controla o proprio onClose.
    carregar(true);
  };

  const exportarExcel = async () => {
    try {
      const clientes = await api.get("/api/exportar/clientes");
      const rows = clientes.map(c => ({
        Nome: c.nome || "",
        CPF: c.cpf || "",
        Telefone: c.telefone || "",
        Endereco: c.endereco || "",
        NumeroCasa: c.numero_casa || "",
        Plano: c.plano || "",
        FormaPgto: c.forma_pagamento || "",
        Status: c.status_calculado || c.status || "",
        PPPoE: c.pppoe || "",
        Vencimento: c.dia_vencimento ? "Dia " + c.dia_vencimento : "",
        Base: c.base || "",
        Observacao: c.observacao || "",
        CadastradoEm: c.criado_em ? new Date(c.criado_em).toLocaleDateString("pt-BR") : "",
      }));
      const ws = XLSX.utils.json_to_sheet(rows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Clientes");
      XLSX.writeFile(wb, "clientes_" + new Date().toLocaleDateString("pt-BR").replace(/[/]/g, "-") + ".xlsx");
    } catch (e) {
      alert("Erro ao exportar: " + e.message);
    }
  };

  const copiarNomes = () => {
    const nomes = filtrados.map(c => c.nome).join("\n");
    const label = filtro === "pendente" ? "Pendentes" : filtro === "pago" ? "Pagos" : "Todos";
    const texto = `${label} — Dia ${diaAtivo} (${filtrados.length})\n${"─".repeat(28)}\n` + nomes;
    navigator.clipboard.writeText(texto).catch(() => {
      const el = document.createElement("textarea");
      el.value = texto;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
    });
    alert(`✅ ${filtrados.length} nome(s) copiado(s)!`);
  };

  // Processa os clientes para calcular o status correto baseado no modo
  const clientesProcessados = clientes.map(c => {
    const mesRef = modoMes === "corrente" ? mesRefCorrente() : mesRefAnterior();
    
    // Usa sempre o status_calculado que veio da API (já calculado corretamente no backend)
    const statusCalculado = c.status_calculado || c.status;
    
    return {
      ...c,
      status_calculado: statusCalculado,
      mes_referencia: mesRef.replace('-', '/')
    };
  });

  // Atualiza os arrays filtrados com os status processados
  const doDia = clientesProcessados.filter(c => parseInt(c.dia_vencimento) === diaAtivo);
  const clientesDiaProcessados = doDia.filter(c => !ehBloqueado(c));
  const bloqueadosDia = doDia.filter(ehBloqueado);
  const filtradosProcessados = clientesDiaProcessados.filter(c => {
    if (filtro !== "todos") {
      const statusParaComparar = c.status_calculado;
      if (filtro === 'pendente') {
        if (statusParaComparar !== 'pendente' && statusParaComparar !== 'em_dia') return false;
      } else {
        if (statusParaComparar !== filtro) return false;
      }
    }
    const b = busca.toLowerCase();
    return !b || 
      (c.nome || "").toLowerCase().includes(b) || 
      (c.telefone || "").includes(b) || 
      (c.cpf || "").includes(b) || 
      (c.endereco || "").toLowerCase().includes(b);
  });

  const clientesPaginaProcessados = filtradosProcessados.slice(inicio, fim);
  const sProcessado = stats(clientesDiaProcessados);

  return (
    <div className="page">
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20, flexWrap: 'wrap' }}>
        <button onClick={onVoltar} style={{ background: 'none', border: 'none', color: '#38bdf8', fontSize: 14, cursor: 'pointer' }}>
          ← Bases
        </button>
        <div style={{ flex: 1 }}>
          <span style={{ fontSize: '1.5rem', fontWeight: 700, color: '#f1f5f9', marginRight: 8 }}>
            {base?.nome}
          </span>
          <span style={{ fontSize: 13, color: '#64748b' }}>
            {base?.descricao} — {stotal.total} clientes
            {totalBloqueados > 0 && (
              <span style={{ color: '#fb923c', marginLeft: 6 }}>+ {totalBloqueados} bloqueado(s)</span>
            )}
          </span>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={() => setModalNovoCliente(true)}
            style={{
              padding: "7px 16px",
              borderRadius: 8,
              border: "none",
              background: "rgba(56,189,248,0.15)",
              color: "#38bdf8",
              fontWeight: 700,
              cursor: "pointer",
              fontSize: 13
            }}
          >
            + Novo Cliente
          </button>
        </div>
      </div>

      {/* Mês de referência */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '8px 14px',
          borderRadius: 8,
          background: 'rgba(56,189,248,0.08)',
          border: '1px solid rgba(56,189,248,0.2)',
          fontSize: 12,
          color: '#94a3b8',
          width: 'fit-content'
        }}>
          <span>📅</span>
          <span>
            Mostrando: {" "}
            <strong style={{ color: '#e2e8f0' }}>
              {modoMes === "corrente" 
                ? mesRefCorrente().replace("-", "/") 
                : mesRefAnterior().replace("-", "/")}
            </strong>
            {modoMes === "passado" && (
              <span style={{ fontSize: 10, color: '#475569', marginLeft: 8 }}>
                (status da época)
              </span>
            )}
          </span>
        </div>

        <div style={{ display: 'flex', gap: 4, background: '#1a1d2e', padding: 4, borderRadius: 8 }}>
          <button
            onClick={() => { setModoMes("corrente"); carregar(false, "corrente"); }}
            style={{
              padding: '6px 12px',
              borderRadius: 6,
              border: 'none',
              fontSize: 12,
              fontWeight: 700,
              cursor: 'pointer',
              background: modoMes === "corrente" ? '#2563eb' : 'transparent',
              color: modoMes === "corrente" ? '#fff' : '#94a3b8'
            }}
          >
            📅 Mês corrente
          </button>
          <button
            onClick={() => { setModoMes("passado"); carregar(false, "passado"); }}
            style={{
              padding: '6px 12px',
              borderRadius: 6,
              border: 'none',
              fontSize: 12,
              fontWeight: 700,
              cursor: 'pointer',
              background: modoMes === "passado" ? '#2563eb' : 'transparent',
              color: modoMes === "passado" ? '#fff' : '#94a3b8'
            }}
          >
            📆 Mês passado
          </button>
        </div>
      </div>

      {/* Tabs por dia de vencimento */}
      {base?.dias?.length > 0 && (
        <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
          {base.dias.sort((a, b) => a - b).map(d => {
            const doDiaTab = clientesProcessados.filter(c => parseInt(c.dia_vencimento) === d);
            const arr = doDiaTab.filter(c => !ehBloqueado(c));
            const bloq = doDiaTab.length - arr.length;
            const pg = arr.filter(c => c.status_calculado === "pago").length;
            return (
              <button
                key={d}
                onClick={() => setDiaAtivo(d)}
                style={{
                  padding: '10px 20px',
                  borderRadius: 8,
                  border: '1px solid #2d3148',
                  background: diaAtivo === d ? '#2563eb' : '#0f1117',
                  color: diaAtivo === d ? '#fff' : '#94a3b8',
                  fontWeight: 600,
                  cursor: 'pointer',
                  minWidth: 80
                }}
              >
                <div>Dia {d}</div>
                <div style={{ fontSize: 11, opacity: 0.8 }}>
                  {pg}/{arr.length}
                  {bloq > 0 && <span style={{ color: '#fb923c', marginLeft: 6 }}>🚫{bloq}</span>}
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* KPIs do dia */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 12, marginBottom: 20 }}>
        <div style={{ background: '#1a1d2e', borderRadius: 8, padding: '12px', textAlign: 'center' }}>
          <span style={{ fontSize: '1.5rem', fontWeight: 800, color: '#22c55e', display: 'block' }}>{sProcessado.pagos}</span>
          <span style={{ fontSize: 11, color: '#64748b' }}>✅ Pagos</span>
        </div>
        <div style={{ background: '#1a1d2e', borderRadius: 8, padding: '12px', textAlign: 'center' }}>
          <span style={{ fontSize: '1.5rem', fontWeight: 800, color: '#f59e0b', display: 'block' }}>{sProcessado.pend}</span>
          <span style={{ fontSize: 11, color: '#64748b' }}>⏳ Pendentes</span>
        </div>
        <div style={{ background: '#1a1d2e', borderRadius: 8, padding: '12px', textAlign: 'center' }}>
          <span style={{ fontSize: '1.5rem', fontWeight: 800, color: '#ef4444', display: 'block' }}>{sProcessado.inad}</span>
          <span style={{ fontSize: 11, color: '#64748b' }}>🔴 Inadimplentes</span>
        </div>
        <div style={{ background: '#1a1d2e', borderRadius: 8, padding: '12px', textAlign: 'center' }}>
          <span style={{ fontSize: '1.5rem', fontWeight: 800, color: '#a78bfa', display: 'block' }}>{sProcessado.prom}</span>
          <span style={{ fontSize: 11, color: '#64748b' }}>🤝 Promessas</span>
        </div>
        <div style={{ background: '#1a1d2e', borderRadius: 8, padding: '12px', textAlign: 'center' }}>
          <span style={{ fontSize: '1.5rem', fontWeight: 800, color: '#e2e8f0', display: 'block' }}>{sProcessado.total}</span>
          <span style={{ fontSize: 11, color: '#64748b' }}>Total dia {diaAtivo}</span>
        </div>
        <div style={{ background: '#1a1d2e', borderRadius: 8, padding: '12px', textAlign: 'center' }}>
          <span style={{ fontSize: '1.5rem', fontWeight: 800, color: sProcessado.pct >= 80 ? '#22c55e' : sProcessado.pct >= 50 ? '#f59e0b' : '#ef4444', display: 'block' }}>{sProcessado.pct}%</span>
          <span style={{ fontSize: 11, color: '#64748b' }}>Recebido</span>
        </div>
      </div>

      {/* Tabela do dia + lista de bloqueados ao lado */}
      <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', flexWrap: 'wrap' }}>
      <Card style={{ background: '#0f1117', borderRadius: 12, overflow: 'hidden', flex: '1 1 560px', minWidth: 0 }}>
        <div style={{ padding: '16px', borderBottom: '1px solid #2d3148' }}>
          <div style={{ display: 'flex', gap: 16, marginBottom: 12, flexWrap: 'wrap', alignItems: 'center' }}>
            <input
              placeholder="Buscar cliente..."
              value={busca}
              onChange={e => setBusca(e.target.value)}
              style={{
                flex: 1,
                minWidth: 200,
                padding: '8px 12px',
                borderRadius: 8,
                border: '1px solid #2d3148',
                background: '#0f1117',
                color: '#e2e8f0',
                fontSize: 13
              }}
            />
            <div style={{ display: 'flex', gap: 4, background: '#1a1d2e', padding: 4, borderRadius: 8 }}>
              {["todos", "pago", "pendente", "inadimplente", "promessa"].map(v => (
                <button
                  key={v}
                  onClick={() => setFiltro(v)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: 6,
                    border: 'none',
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: 'pointer',
                    background: filtro === v ? (v === 'inadimplente' ? '#ef4444' : '#2563eb') : 'transparent',
                    color: filtro === v ? '#fff' : '#94a3b8'
                  }}
                >
                  {v === 'todos' ? 'Todos' : v === 'pago' ? '✅ Pagos' : v === 'pendente' ? '⏳ Pendentes' : v === 'inadimplente' ? '🔴 Inadimplentes' : '🤝 Promessas'}
                </button>
              ))}
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'space-between' }}>
            <span style={{ fontSize: 13, color: '#94a3b8' }}>
              {filtradosProcessados.length === 0 ? '0 clientes' : `${inicio + 1}-${Math.min(fim, filtradosProcessados.length)} de ${filtradosProcessados.length}`}
            </span>
            <div style={{ display: 'flex', gap: 8 }}>
              {filtradosProcessados.length > 0 && (
                <button onClick={copiarNomes} style={{ padding: "4px 10px", borderRadius: 6, border: "1px solid rgba(148,163,184,0.25)", background: "rgba(148,163,184,0.08)", color: "#94a3b8", fontSize: 12, cursor: "pointer" }}>
                  📋 Copiar nomes
                </button>
              )}
              <button onClick={exportarExcel} style={{ padding: "4px 10px", borderRadius: 6, border: "1px solid rgba(34,197,94,.3)", background: "rgba(34,197,94,.08)", color: "#4ade80", fontSize: 12, cursor: "pointer" }}>
                📥 Exportar Excel
              </button>
            </div>
          </div>
        </div>

        {loading ? (
          <Spinner />
        ) : filtradosProcessados.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>Nenhum cliente</div>
        ) : (
          <>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#1a1d2e' }}>
                    <th style={{ padding: '12px', textAlign: 'left', color: '#94a3b8', fontSize: 11 }}>Nome</th>
                    <th style={{ padding: '12px', textAlign: 'left', color: '#94a3b8', fontSize: 11 }}>Telefone</th>
                    <th style={{ padding: '12px', textAlign: 'left', color: '#94a3b8', fontSize: 11 }}>Endereço</th>
                    <th style={{ padding: '12px', textAlign: 'left', color: '#94a3b8', fontSize: 11 }}>Plano</th>
                    <th style={{ padding: '12px', textAlign: 'left', color: '#94a3b8', fontSize: 11 }}>Comodato</th>
                    <th style={{ padding: '12px', textAlign: 'left', color: '#94a3b8', fontSize: 11 }}>Status</th>
                    <th style={{ padding: '12px', textAlign: 'right', color: '#94a3b8', fontSize: 11 }}>Ações</th>
                   </tr>
                </thead>
                <tbody>
                  {clientesPaginaProcessados.map(c => (
                    <tr key={c.id} onClick={() => setModalCliente(c)} style={{ cursor: "pointer", borderBottom: '1px solid #1a1d2e' }}>
                      <td style={{ padding: '12px', fontWeight: 600 }}>{c.nome}</td>
                      <td style={{ padding: '12px', fontFamily: 'monospace', fontSize: 12, color: '#94a3b8' }}>{c.telefone || "—"}</td>
                      <td style={{ padding: '12px', color: '#94a3b8' }}>{c.endereco || "—"}</td>
                      <td style={{ padding: '12px' }}>{c.plano || "—"}</td>
                      <td style={{ padding: '12px' }}>{c.comodato ? '✅ Sim' : '❌ Não'}</td>
                      <td style={{ padding: '12px', whiteSpace: 'nowrap' }}>
                        <BadgeCliente status={c.status_calculado} />
                        {c.mes_referencia && (
                          <span style={{ fontSize: 9, color: '#475569', marginLeft: 6 }}>
                            {c.mes_referencia}
                          </span>
                        )}
                      </td>
                      <td style={{ padding: '12px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                        <button
                          onClick={(e) => { e.stopPropagation(); alternarBloqueio(c, true); }}
                          disabled={bloqueando === c.id}
                          title="Bloquear: sai da lista e das contas do dia, sem cancelar"
                          style={{
                            padding: '4px 10px',
                            borderRadius: 6,
                            border: '1px solid rgba(249,115,22,0.35)',
                            background: 'rgba(249,115,22,0.1)',
                            color: '#fb923c',
                            fontSize: 12,
                            cursor: bloqueando === c.id ? 'wait' : 'pointer'
                          }}
                        >
                          {bloqueando === c.id ? '...' : '🚫 Bloquear'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* Paginação */}
            {totalPaginas > 1 && (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', padding: '16px' }}>
                <button
                  onClick={() => setPagina(p => Math.max(1, p - 1))}
                  disabled={pagina === 1}
                  style={{
                    padding: '6px 12px',
                    borderRadius: 6,
                    border: '1px solid #2d3148',
                    background: 'transparent',
                    color: pagina === 1 ? '#64748b' : '#94a3b8',
                    cursor: pagina === 1 ? 'not-allowed' : 'pointer',
                    fontSize: 13
                  }}
                >
                  ← Anterior
                </button>
                <span style={{ color: '#94a3b8', fontSize: 13 }}>
                  Página {pagina} de {totalPaginas}
                </span>
                <button
                  onClick={() => setPagina(p => Math.min(totalPaginas, p + 1))}
                  disabled={pagina === totalPaginas}
                  style={{
                    padding: '6px 12px',
                    borderRadius: 6,
                    border: '1px solid #2d3148',
                    background: 'transparent',
                    color: pagina === totalPaginas ? '#64748b' : '#94a3b8',
                    cursor: pagina === totalPaginas ? 'not-allowed' : 'pointer',
                    fontSize: 13
                  }}
                >
                  Próxima →
                </button>
              </div>
            )}
          </>
        )}
      </Card>

      {/* Lista dos bloqueados do dia — nem cobrado, nem cancelado */}
      <div style={{
        flex: '0 1 280px',
        minWidth: 240,
        background: '#0f1117',
        border: '1px solid #2d3148',
        borderRadius: 12,
        overflow: 'hidden'
      }}>
        <div style={{ padding: '14px 16px', borderBottom: '1px solid #2d3148' }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#fb923c' }}>
            🚫 Bloqueados — dia {diaAtivo}
          </div>
          <div style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>
            {bloqueadosDia.length === 0
              ? 'Ninguém bloqueado nesta data'
              : `${bloqueadosDia.length} fora da cobrança e das contas`}
          </div>
        </div>
        {bloqueadosDia.map(c => (
          <div key={c.id} style={{ padding: '10px 16px', borderBottom: '1px solid #1a1d2e' }}>
            <div
              onClick={() => setModalCliente(c)}
              style={{ fontSize: 13, fontWeight: 600, color: '#e2e8f0', cursor: 'pointer' }}
            >
              {c.nome}
            </div>
            <div style={{ fontSize: 11, color: '#64748b', fontFamily: 'monospace' }}>
              {c.telefone || '—'}
            </div>
            {c.bloqueado_em && (
              <div style={{ fontSize: 10, color: '#475569', marginTop: 2 }}>
                desde {new Date(c.bloqueado_em).toLocaleDateString('pt-BR')}
                {c.motivo_bloqueio ? ` — ${c.motivo_bloqueio}` : ''}
              </div>
            )}
            <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
              <button
                onClick={() => alternarBloqueio(c, false)}
                disabled={bloqueando === c.id}
                style={{
                  padding: '4px 10px',
                  borderRadius: 6,
                  border: '1px solid rgba(34,197,94,0.3)',
                  background: 'rgba(34,197,94,0.08)',
                  color: '#4ade80',
                  fontSize: 11,
                  cursor: bloqueando === c.id ? 'wait' : 'pointer'
                }}
              >
                {bloqueando === c.id ? '...' : '↩ Desbloquear'}
              </button>
              <button
                onClick={() => setModalCliente(c)}
                title="Abre o cliente na aba de cancelamento"
                style={{
                  padding: '4px 10px',
                  borderRadius: 6,
                  border: '1px solid rgba(248,113,113,0.3)',
                  background: 'rgba(248,113,113,0.08)',
                  color: '#f87171',
                  fontSize: 11,
                  cursor: 'pointer'
                }}
              >
                ❌ Cancelar
              </button>
            </div>
          </div>
        ))}
      </div>
      </div>

      {modalCliente && (
        <ModalEditarCliente
          cliente={modalCliente}
          baseId={base.id}
          onClose={() => setModalCliente(null)}
          onSalvo={onSalvo}
        />
      )}

      {modalNovoCliente && (
        <ModalNovoClienteBase
          baseId={base.id}
          diaDefault={diaAtivo}
          onClose={() => setModalNovoCliente(false)}
          onSalvo={() => {
            setModalNovoCliente(false);
            carregar(true);
          }}
        />
      )}
    </div>
  );
};
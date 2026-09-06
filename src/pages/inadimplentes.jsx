// src/pages/inadimplentes.jsx — quem está atrasado e quem já é candidato a corte.
import React, { useState, useEffect, useCallback } from 'react';
import { useSSEData } from '../hooks/useSSEData';
import { Card } from '../components/Card';
import { Spinner } from '../components/Spinner';
import { api } from '../api/client';
import * as XLSX from 'https://cdn.sheetjs.com/xlsx-0.20.0/package/xlsx.mjs';

const baixarPlanilha = (linhas, aba, prefixo) => {
  const ws = XLSX.utils.json_to_sheet(linhas);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, aba);
  XLSX.writeFile(wb, `${prefixo}_${new Date().toLocaleDateString('pt-BR').replace(/\//g, '-')}.xlsx`);
};

// Quanto mais dias, mais quente a cor. Vermelho so no que ja passou de 20.
const classeAtraso = (d) => (d > 20 ? 'val-erro' : d > 15 ? 'val-bloqueio' : d > 10 ? 'val-alerta' : '');
const badgeAtraso = (d) => (d > 20 ? 'badge-inadimplente' : d > 15 ? 'badge-bloqueado' : 'badge-pendente');

function AbaInadimplentes() {
  const [dias, setDias] = useState(5);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState(null);

  const carregar = useCallback(async () => {
    setLoading(true);
    try {
      setErro(null);
      const json = await api.get(`/api/relatorio/inadimplentes?dias=${dias}`, 30000);
      setData(Array.isArray(json) ? json : []);
    } catch (e) {
      setErro(e.message || 'Não consegui carregar o relatório');
      setData([]);
    }
    setLoading(false);
  }, [dias]);

  useEffect(() => { carregar(); }, [carregar]);

  const exportar = () => baixarPlanilha(data.map(c => ({
    Nome: c.nome,
    Telefone: c.telefone || '',
    Plano: c.plano || '',
    Vencimento: c.dia_vencimento ? `Dia ${c.dia_vencimento}` : '',
    Base: c.base_nome || '',
    'Dias inadimplente': Math.round(c.dias_pendente),
  })), 'Inadimplentes', 'inadimplentes');

  const porVencimento = [10, 20, 30].map(venc => {
    const grupo = data.filter(c => c.dia_vencimento === venc);
    if (!grupo.length) return null;
    return { venc, total: grupo.length, max: Math.round(Math.max(...grupo.map(c => c.dias_pendente))) };
  }).filter(Boolean);

  return (
    <>
      <div className="linha mb-3">
        <label className="dica" htmlFor="dias-inad" style={{ marginTop: 0 }}>Atrasado há mais de</label>
        <select
          id="dias-inad"
          className="entrada entrada-auto"
          value={dias}
          onChange={e => setDias(Number(e.target.value))}
        >
          {[3, 5, 7, 10, 15, 30].map(d => <option key={d} value={d}>{d} dias</option>)}
        </select>
        <button type="button" className="btn btn-ok btn-pequeno" onClick={exportar} disabled={!data.length}>
          📥 Exportar Excel
        </button>
        <button type="button" className="btn btn-pequeno" onClick={carregar}>↻ Atualizar</button>
      </div>

      {porVencimento.length > 0 && (
        <div className="kpis">
          {porVencimento.map(g => (
            <div key={g.venc} className="kpi">
              <span className={`kpi-val ${classeAtraso(g.max)}`}>{g.total}</span>
              <span className="kpi-label">venc. dia {g.venc} · até {g.max}d</span>
            </div>
          ))}
        </div>
      )}

      {erro && <div className="aviso aviso-erro mb-3">{erro}</div>}

      {loading ? <Spinner /> : !data.length ? (
        <Card>
          <div className="vazio">
            <span className="vazio-emoji">🎉</span>
            Ninguém atrasado há mais de {dias} dias
          </div>
        </Card>
      ) : (
        <Card>
          <div className="card-cab">
            <span className="card-titulo">{data.length} cliente{data.length !== 1 ? 's' : ''} em atraso</span>
            <span className="dica linha-fim mt-0">contado a partir do vencimento</span>
          </div>
          <div className="tabela-scroll">
            <table className="tabela">
              <thead>
                <tr><th>Nome</th><th>Telefone</th><th>Plano</th><th>Vencimento</th><th>Base</th><th>Atraso</th></tr>
              </thead>
              <tbody>
                {data.map((c, i) => (
                  <tr key={c.id || i}>
                    <td className="td-nome">{c.nome}</td>
                    <td className="td-mono">{c.telefone || '—'}</td>
                    <td>{c.plano || '—'}</td>
                    <td>{c.dia_vencimento ? `Dia ${c.dia_vencimento}` : '—'}</td>
                    <td className="td-muted">{c.base_nome || '—'}</td>
                    <td><span className={`badge ${badgeAtraso(c.dias_pendente)}`}>{Math.round(c.dias_pendente)}d</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </>
  );
}

function AbaBloqueio() {
  const { data, loading, refetch } = useSSEData('/api/alertas/bloquear', 'clientes');
  const [busca, setBusca] = useState('');
  const [copiado, setCopiado] = useState(null);

  const todos = data?.clientes || [];
  const clientes = todos.filter(c =>
    !busca
    || (c.nome || '').toLowerCase().includes(busca.toLowerCase())
    || (c.telefone || '').includes(busca)
  );

  const copiar = async (texto, chave) => {
    try {
      await navigator.clipboard.writeText(texto);
      setCopiado(chave);
      setTimeout(() => setCopiado(null), 2000);
    } catch (_) {
      alert('O navegador não liberou a área de transferência.');
    }
  };

  const exportar = () => baixarPlanilha(clientes.map(c => ({
    Nome: c.nome,
    Telefone: c.telefone || '',
    Vencimento: `Dia ${c.dia_vencimento}`,
    'Dias de atraso': c.dias_atraso,
    Plano: c.plano || '',
    Pagamento: c.forma_pagamento || '',
  })), 'Para bloquear', 'bloquear');

  return (
    <>
      <div className="aviso aviso-erro mb-3">
        <span className="aviso-emoji">⚠️</span>
        <span className="aviso-corpo">
          Estes já receberam toda a régua de cobrança, até D+10, sem retorno.
          <span className="aviso-detalhe">Bloquear tira da cobrança sem cancelar o cliente.</span>
        </span>
      </div>

      <div className="linha mb-3">
        <input
          className="entrada campo-largo"
          placeholder="Buscar por nome ou telefone…"
          value={busca}
          onChange={e => setBusca(e.target.value)}
        />
        {clientes.length > 0 && (
          <>
            <button
              type="button"
              className="btn btn-perigo btn-pequeno"
              onClick={() => copiar(clientes.map(c => c.telefone || '').filter(Boolean).join('\n'), 'todos')}
            >
              {copiado === 'todos' ? '✅ Copiado' : `📋 Copiar ${clientes.length} números`}
            </button>
            <button type="button" className="btn btn-ok btn-pequeno" onClick={exportar}>📥 Exportar</button>
          </>
        )}
        <button type="button" className="btn btn-pequeno" onClick={refetch}>↻</button>
      </div>

      {loading ? <Spinner /> : clientes.length === 0 ? (
        <Card>
          <div className="vazio">
            <span className="vazio-emoji">{todos.length === 0 ? '✅' : '🔍'}</span>
            {todos.length === 0 ? 'Nenhum cliente para bloquear' : 'Nenhum resultado para a busca'}
          </div>
        </Card>
      ) : (
        <Card>
          <div className="tabela-scroll">
            <table className="tabela">
              <thead>
                <tr>
                  <th>Nome</th><th>Telefone</th><th>Vencimento</th>
                  <th>Atraso</th><th>Plano</th><th>Pagamento</th><th />
                </tr>
              </thead>
              <tbody>
                {clientes.map((c, i) => (
                  <tr key={c.id || i}>
                    <td className="td-nome">{c.nome}</td>
                    <td className="td-mono">{c.telefone || '—'}</td>
                    <td className="td-centro">Dia {c.dia_vencimento}</td>
                    <td className="td-centro"><span className={`badge ${badgeAtraso(c.dias_atraso)}`}>{c.dias_atraso}d</span></td>
                    <td>{c.plano || '—'}</td>
                    <td className="td-muted">{c.forma_pagamento || '—'}</td>
                    <td className="td-fim">
                      <button
                        type="button"
                        className="btn btn-info btn-pequeno"
                        onClick={() => copiar(c.telefone, c.telefone)}
                        disabled={!c.telefone}
                      >
                        {copiado === c.telefone ? '✅' : '📋'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="card-cab" style={{ borderBottom: 'none', borderTop: '1px solid var(--border)' }}>
            <span className="dica mt-0">
              {clientes.length} cliente{clientes.length !== 1 ? 's' : ''} candidato(s) a bloqueio
            </span>
          </div>
        </Card>
      )}
    </>
  );
}

export function PageInadimplentes() {
  const [aba, setAba] = useState('inadimplentes');

  return (
    <div className="page">
      <div className="page-topo">
        <div>
          <h1 className="page-title">Inadimplentes</h1>
          <div className="page-sub">Quem está atrasado, e quem já esgotou a régua de cobrança.</div>
        </div>
      </div>

      <div className="abas">
        <button
          type="button"
          className={`aba ${aba === 'inadimplentes' ? 'aba-ativa' : ''}`}
          onClick={() => setAba('inadimplentes')}
        >
          ❌ Em atraso
        </button>
        <button
          type="button"
          className={`aba ${aba === 'bloquear' ? 'aba-ativa aba-ativa-perigo' : ''}`}
          onClick={() => setAba('bloquear')}
        >
          🔴 Para bloquear (D+10)
        </button>
      </div>

      {aba === 'inadimplentes' ? <AbaInadimplentes /> : <AbaBloqueio />}
    </div>
  );
}

// src/components/VisualizadorBase.jsx — a base por dia de vencimento.
//
// O arquivo tinha duas passagens sobre a mesma lista (`filtrados` e
// `filtradosProcessados`, `s` e `sProcessado`) e uma funcao de status historico
// que ninguem chamava: sobrou uma passagem so. E o `?cliente=<id>` que a busca
// global coloca na URL era ignorado — agora abre a ficha direto.
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from './Card';
import { ModalEditarCliente } from './ModalEditarCliente';
import { ModalNovoClienteBase } from './ModalNovoClientebase';
import { TabelaClientes, FILTROS } from './base/TabelaClientes';
import { ColunaBloqueados } from './base/ColunaBloqueados';
import * as XLSX from 'https://cdn.sheetjs.com/xlsx-0.20.0/package/xlsx.mjs';
import { api } from '../api/client';

const POR_PAGINA = 20;

const refDoMes = (deslocamento = 0) => {
  const agora = new Date();
  const d = new Date(agora.getFullYear(), agora.getMonth() + deslocamento, 1);
  return `${String(d.getMonth() + 1).padStart(2, '0')}-${d.getFullYear()}`;
};

export const VisualizadorBase = ({ base, clienteDestacado, onVoltar }) => {
  const [diaAtivo, setDiaAtivo] = useState(base?.dias?.[0] || 10);
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState(null);
  const [busca, setBusca] = useState('');
  const [filtro, setFiltro] = useState('todos');
  const [modoMes, setModoMes] = useState('corrente');
  const [modalCliente, setModalCliente] = useState(null);
  const [modalNovoCliente, setModalNovoCliente] = useState(false);
  const [pagina, setPagina] = useState(1);
  const [bloqueando, setBloqueando] = useState(null);
  const reqIdRef = useRef(0);
  const navigate = useNavigate();

  // Bloqueado e o meio-termo entre cobrar e cancelar: servico cortado, cliente
  // ainda recuperavel. Sai da tabela do dia e das contas, e vive na coluna ao
  // lado — senao ficava eternamente "pendente", inflando a inadimplencia.
  const ehBloqueado = (c) => (c.status_calculado || c.status) === 'bloqueado';

  const carregar = useCallback(async (silencioso = false, modoOverride = null) => {
    if (!base?.id) return;
    if (!silencioso) setLoading(true);
    const modo = modoOverride ?? modoMes;
    const mesRef = modo === 'corrente' ? refDoMes(0) : refDoMes(-1);
    const reqId = ++reqIdRef.current;
    try {
      setErro(null);
      const data = await api.get(`/api/bases/${base.id}/clientes?mes_ref=${mesRef}`);
      // Resposta velha de uma requisicao anterior nao pode sobrescrever a nova.
      if (reqId === reqIdRef.current) setClientes(Array.isArray(data) ? data : []);
    } catch (e) {
      if (reqId === reqIdRef.current) setErro(e.message || 'Não consegui carregar os clientes');
    } finally {
      if (!silencioso) setLoading(false);
    }
  }, [base?.id, modoMes]);

  useEffect(() => { carregar(); }, [carregar]);
  useEffect(() => { setPagina(1); }, [diaAtivo, filtro, busca]);

  // Veio da busca global (?cliente=<id>): abre a ficha assim que a lista chega.
  // O guarda anota QUAL cliente ja foi aberto, nao apenas que algum foi: com um
  // booleano, a segunda busca global feita sem sair da base mudava a URL e nao
  // abria ninguem — o efeito voltava cedo pra sempre.
  const ultimoDestacadoRef = useRef(null);
  useEffect(() => {
    if (!clienteDestacado) { ultimoDestacadoRef.current = null; return; }
    if (ultimoDestacadoRef.current === String(clienteDestacado)) return;
    if (clientes.length === 0) return;
    const alvo = clientes.find(c => String(c.id) === String(clienteDestacado));
    if (!alvo) return;
    ultimoDestacadoRef.current = String(clienteDestacado);
    if (alvo.dia_vencimento) setDiaAtivo(parseInt(alvo.dia_vencimento, 10));
    setModalCliente(alvo);
  }, [clienteDestacado, clientes]);

  const alternarBloqueio = async (cliente, bloquear) => {
    if (bloquear && !window.confirm(
      `Bloquear ${cliente.nome}?\n\nEle sai da lista do dia e para de receber cobrança. Não é cancelamento.`
    )) return;
    setBloqueando(cliente.id);
    try {
      await api.post(`/api/bases/${base.id}/clientes/${cliente.id}/bloqueio`, { bloquear });
      await carregar(true);
    } catch (e) {
      alert(`Não consegui aplicar: ${e.message}`);
    }
    setBloqueando(null);
  };

  const doDia = useMemo(
    () => clientes.filter(c => parseInt(c.dia_vencimento, 10) === diaAtivo),
    [clientes, diaAtivo],
  );
  const ativosDoDia = useMemo(() => doDia.filter(c => !ehBloqueado(c)), [doDia]);
  const bloqueadosDoDia = useMemo(() => doDia.filter(ehBloqueado), [doDia]);

  const filtrados = useMemo(() => {
    const b = busca.trim().toLowerCase();
    return ativosDoDia.filter(c => {
      const st = c.status_calculado || c.status;
      if (filtro !== 'todos') {
        if (filtro === 'pendente') {
          if (st !== 'pendente' && st !== 'em_dia') return false;
        } else if (st !== filtro) return false;
      }
      if (!b) return true;
      return (c.nome || '').toLowerCase().includes(b)
        || (c.telefone || '').includes(b)
        || (c.cpf || '').includes(b)
        || (c.endereco || '').toLowerCase().includes(b);
    });
  }, [ativosDoDia, filtro, busca]);

  const conta = (arr, ...estados) =>
    arr.filter(c => estados.includes(c.status_calculado || c.status)).length;

  const s = {
    pagos: conta(ativosDoDia, 'pago'),
    pendentes: conta(ativosDoDia, 'pendente', 'em_dia'),
    inadimplentes: conta(ativosDoDia, 'inadimplente'),
    promessas: conta(ativosDoDia, 'promessa'),
    total: ativosDoDia.length,
  };
  s.pct = s.total ? Math.round((s.pagos / s.total) * 100) : 0;

  const totalBloqueados = clientes.filter(ehBloqueado).length;
  const totalAtivos = clientes.length - totalBloqueados;

  const totalPaginas = Math.max(1, Math.ceil(filtrados.length / POR_PAGINA));
  const inicio = (pagina - 1) * POR_PAGINA;
  const daPagina = filtrados.slice(inicio, inicio + POR_PAGINA);

  const exportarExcel = async () => {
    try {
      const todos = await api.get('/api/exportar/clientes', 60000);
      const linhas = todos.map(c => ({
        Nome: c.nome || '',
        CPF: c.cpf || '',
        Telefone: c.telefone || '',
        Endereco: c.endereco || '',
        NumeroCasa: c.numero_casa || '',
        Plano: c.plano || '',
        FormaPgto: c.forma_pagamento || '',
        Status: c.status_calculado || c.status || '',
        PPPoE: c.pppoe || '',
        Vencimento: c.dia_vencimento ? `Dia ${c.dia_vencimento}` : '',
        Base: c.base || '',
        Observacao: c.observacao || '',
        CadastradoEm: c.criado_em ? new Date(c.criado_em).toLocaleDateString('pt-BR') : '',
      }));
      const ws = XLSX.utils.json_to_sheet(linhas);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Clientes');
      XLSX.writeFile(wb, `clientes_${new Date().toLocaleDateString('pt-BR').replace(/\//g, '-')}.xlsx`);
    } catch (e) {
      alert(`Não consegui exportar: ${e.message}`);
    }
  };

  const copiarNomes = async () => {
    const rotulo = FILTROS.find(([v]) => v === filtro)?.[1] || 'Todos';
    const texto = `${rotulo} — Dia ${diaAtivo} (${filtrados.length})\n${'─'.repeat(28)}\n`
      + filtrados.map(c => c.nome).join('\n');
    try {
      await navigator.clipboard.writeText(texto);
      alert(`✅ ${filtrados.length} nome(s) copiado(s).`);
    } catch (_) {
      alert('O navegador não liberou a área de transferência.');
    }
  };

  const mesRotulo = (modoMes === 'corrente' ? refDoMes(0) : refDoMes(-1)).replace('-', '/');

  return (
    <div className="page page-larga">
      <div className="page-topo">
        <div>
          <button type="button" className="btn btn-fantasma btn-pequeno" onClick={onVoltar}>← Bases</button>
          <h1 className="page-title mt-1">{base?.nome}</h1>
          <div className="page-sub">
            {base?.descricao ? `${base.descricao} — ` : ''}{totalAtivos} cliente{totalAtivos !== 1 ? 's' : ''}
            {totalBloqueados > 0 && <span className="val-bloqueio"> · {totalBloqueados} bloqueado(s)</span>}
          </div>
        </div>
        <div className="page-acoes">
          <div className="filtro-group">
            <button
              type="button"
              className={`filtro-btn ${modoMes === 'corrente' ? 'filtro-ativo' : ''}`}
              onClick={() => { setModoMes('corrente'); carregar(false, 'corrente'); }}
            >
              Mês corrente
            </button>
            <button
              type="button"
              className={`filtro-btn ${modoMes === 'passado' ? 'filtro-ativo' : ''}`}
              onClick={() => { setModoMes('passado'); carregar(false, 'passado'); }}
            >
              Mês passado
            </button>
          </div>
          <button type="button" className="btn btn-primario" onClick={() => setModalNovoCliente(true)}>
            + Novo cliente
          </button>
        </div>
      </div>

      <div className="aviso aviso-info mb-3">
        <span className="aviso-emoji">📅</span>
        <span className="aviso-corpo">
          Mostrando {mesRotulo}
          {modoMes === 'passado' && <span className="aviso-detalhe">status como estava na época</span>}
        </span>
      </div>

      {erro && <div className="aviso aviso-erro mb-3">{erro}</div>}

      {base?.dias?.length > 0 && (
        <div className="dias-tabs">
          {[...base.dias].sort((a, b) => a - b).map(d => {
            const doTab = clientes.filter(c => parseInt(c.dia_vencimento, 10) === d);
            const ativos = doTab.filter(c => !ehBloqueado(c));
            const bloq = doTab.length - ativos.length;
            const pagos = ativos.filter(c => (c.status_calculado || c.status) === 'pago').length;
            return (
              <button
                key={d}
                type="button"
                className={`dia-tab ${diaAtivo === d ? 'dia-ativo' : ''}`}
                onClick={() => setDiaAtivo(d)}
              >
                <span className="dia-num">Dia {d}</span>
                <span className="dia-stats">
                  {pagos}/{ativos.length}
                  {bloq > 0 && <span className="val-bloqueio"> · 🚫{bloq}</span>}
                </span>
              </button>
            );
          })}
        </div>
      )}

      <div className="kpis">
        <div className="kpi"><span className="kpi-val val-ok">{s.pagos}</span><span className="kpi-label">✅ Pagos</span></div>
        <div className="kpi"><span className="kpi-val val-alerta">{s.pendentes}</span><span className="kpi-label">⏳ Pendentes</span></div>
        <div className="kpi"><span className="kpi-val val-erro">{s.inadimplentes}</span><span className="kpi-label">🔴 Inadimplentes</span></div>
        <div className="kpi"><span className="kpi-val val-promessa">{s.promessas}</span><span className="kpi-label">🤝 Promessas</span></div>
        <div className="kpi"><span className="kpi-val">{s.total}</span><span className="kpi-label">Total dia {diaAtivo}</span></div>
        <div className="kpi">
          <span className={`kpi-val ${s.pct >= 80 ? 'val-ok' : s.pct >= 50 ? 'val-alerta' : 'val-erro'}`}>{s.pct}%</span>
          <span className="kpi-label">Recebido</span>
        </div>
      </div>

      <div className="base-colunas">
        <Card>
          <TabelaClientes
            clientes={daPagina}
            loading={loading}
            busca={busca}
            setBusca={setBusca}
            filtro={filtro}
            setFiltro={setFiltro}
            pagina={pagina}
            setPagina={setPagina}
            totalPaginas={totalPaginas}
            inicio={inicio}
            porPagina={POR_PAGINA}
            totalFiltrados={filtrados.length}
            bloqueando={bloqueando}
            onAbrir={setModalCliente}
            onBloquear={alternarBloqueio}
            onCopiarNomes={copiarNomes}
            onExportar={exportarExcel}
          />
        </Card>

        <ColunaBloqueados
          dia={diaAtivo}
          clientes={bloqueadosDoDia}
          bloqueando={bloqueando}
          onDesbloquear={(c) => alternarBloqueio(c, false)}
          onAbrir={setModalCliente}
        />
      </div>

      {modalCliente && (
        <ModalEditarCliente
          cliente={modalCliente}
          baseId={base.id}
          onClose={() => {
            setModalCliente(null);
            // Fechar a ficha aberta pela busca global tira o ?cliente da URL:
            // sem isso, procurar o MESMO cliente de novo nao reabria nada.
            if (clienteDestacado) navigate(`/clientes?base=${base.id}`, { replace: true });
          }}
          onSalvo={() => carregar(true)}
        />
      )}

      {modalNovoCliente && (
        <ModalNovoClienteBase
          baseId={base.id}
          diaDefault={diaAtivo}
          onClose={() => setModalNovoCliente(false)}
          onSalvo={() => { setModalNovoCliente(false); carregar(true); }}
        />
      )}
    </div>
  );
};

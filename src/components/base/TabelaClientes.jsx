// src/components/base/TabelaClientes.jsx — a lista do dia, com busca e filtro.
import React from 'react';
import { BadgeCliente } from '../BadgeCliente';
import { Spinner } from '../Spinner';
import { Pagination } from '../Pagination';

export const FILTROS = [
  ['todos', 'Todos'],
  ['pago', '✅ Pagos'],
  ['pendente', '⏳ Pendentes'],
  ['inadimplente', '🔴 Inadimplentes'],
  ['promessa', '🤝 Promessas'],
];

export function TabelaClientes({
  clientes, loading,
  busca, setBusca, filtro, setFiltro,
  pagina, setPagina, totalPaginas, inicio, porPagina, totalFiltrados,
  onAbrir, onBloquear, bloqueando,
  onCopiarNomes, onExportar,
}) {
  return (
    <>
      <div className="card-cab">
        <input
          className="entrada campo-largo"
          placeholder="Buscar por nome, telefone, CPF ou endereço…"
          value={busca}
          onChange={e => setBusca(e.target.value)}
        />
        <div className="filtro-group">
          {FILTROS.map(([v, rotulo]) => (
            <button
              key={v}
              type="button"
              className={`filtro-btn ${filtro === v ? (v === 'inadimplente' ? 'filtro-ativo filtro-ativo-perigo' : 'filtro-ativo') : ''}`}
              onClick={() => setFiltro(v)}
            >
              {rotulo}
            </button>
          ))}
        </div>
      </div>

      <div className="card-cab">
        <span className="pag-info">
          {totalFiltrados === 0
            ? '0 clientes'
            : `${inicio + 1}–${Math.min(inicio + porPagina, totalFiltrados)} de ${totalFiltrados}`}
        </span>
        <div className="page-acoes linha-fim">
          {totalFiltrados > 0 && (
            <button type="button" className="btn btn-pequeno" onClick={onCopiarNomes}>📋 Copiar nomes</button>
          )}
          <button type="button" className="btn btn-ok btn-pequeno" onClick={onExportar}>📥 Exportar Excel</button>
        </div>
      </div>

      {loading ? (
        <Spinner />
      ) : totalFiltrados === 0 ? (
        <div className="vazio">
          <span className="vazio-emoji">🔍</span>
          Nenhum cliente com esse filtro
          <span className="vazio-dica">Tente o filtro Todos, ou limpe a busca.</span>
        </div>
      ) : (
        <>
          <div className="tabela-scroll">
            <table className="tabela">
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>Telefone</th>
                  <th>Endereço</th>
                  <th>Plano</th>
                  <th>Comodato</th>
                  <th>Status</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {clientes.map(c => (
                  <tr key={c.id} className="linha-clicavel" onClick={() => onAbrir(c)}>
                    <td className="td-nome">{c.nome}</td>
                    <td className="td-mono">{c.telefone || '—'}</td>
                    <td className="td-corta">{c.endereco || '—'}</td>
                    <td>{c.plano || '—'}</td>
                    <td className="td-centro">{c.comodato ? '✅' : '—'}</td>
                    <td><BadgeCliente status={c.status_calculado || c.status} /></td>
                    <td className="td-fim">
                      <button
                        type="button"
                        className="btn btn-suspende btn-pequeno"
                        title="Bloquear: sai da lista e das contas do dia, sem cancelar"
                        disabled={bloqueando === c.id}
                        onClick={(e) => { e.stopPropagation(); onBloquear(c, true); }}
                      >
                        {bloqueando === c.id ? '…' : '🚫 Bloquear'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination currentPage={pagina} totalPages={totalPaginas} onPageChange={setPagina} />
        </>
      )}
    </>
  );
}

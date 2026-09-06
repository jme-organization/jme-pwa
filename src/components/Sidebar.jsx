// src/components/Sidebar.jsx — navegacao principal do painel.
//
// Substitui a TopNav horizontal, que tinha 687 linhas, escondia metade das
// telas atras de um menu "Mais" e, no celular, montava <NavLink to={undefined}>
// para o item "Clientes" (que so tinha submenu) — o que estourava a navegacao.
// Aqui a lista e plana, agrupada por assunto, e a mesma no desktop e no celular.
import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  FiGrid, FiSmartphone, FiTool, FiCalendar, FiMessageCircle,
  FiSend, FiAlertTriangle, FiClock, FiBookOpen, FiRefreshCw,
  FiUsers, FiTruck, FiMessageSquare, FiUserX,
  FiFileText, FiChevronsLeft, FiChevronsRight,
} from 'react-icons/fi';

export const GRUPOS = [
  {
    titulo: 'Operação',
    itens: [
      { to: '/', rotulo: 'Dashboard', Icone: FiGrid, exato: true },
      { to: '/conversas', rotulo: 'Atendimentos', Icone: FiMessageCircle, contagem: 'conversasNaoLidas' },
      { to: '/qr', rotulo: 'WhatsApp', Icone: FiSmartphone },
      { to: '/chamados', rotulo: 'Chamados', Icone: FiTool, contagem: 'chamadosAbertos' },
      { to: '/agendamentos', rotulo: 'Agendamentos', Icone: FiCalendar },
    ],
  },
  {
    titulo: 'Cobrança',
    itens: [
      { to: '/cobranca', rotulo: 'Cobranças', Icone: FiSend },
      { to: '/inadimplentes', rotulo: 'Inadimplentes', Icone: FiAlertTriangle, contagem: 'inadimplentes' },
      { to: '/promessas', rotulo: 'Promessas', Icone: FiClock, contagem: 'promessasHoje' },
      { to: '/carne', rotulo: 'Carnês', Icone: FiBookOpen },
      { to: '/sgp', rotulo: 'Integração SGP', Icone: FiRefreshCw },
    ],
  },
  {
    titulo: 'Cadastro',
    itens: [
      { to: '/clientes', rotulo: 'Clientes', Icone: FiUsers },
      { to: '/novos', rotulo: 'Instalações', Icone: FiTruck },
      { to: '/boas-vindas', rotulo: 'Boas-vindas', Icone: FiMessageSquare },
      { to: '/cancelamentos', rotulo: 'Cancelamentos', Icone: FiUserX },
    ],
  },
  {
    titulo: 'Sistema',
    itens: [
      { to: '/logs', rotulo: 'Registros', Icone: FiFileText },
    ],
  },
];

// Rotulo da rota atual — usado pelo titulo da topbar.
export function rotuloDaRota(pathname) {
  const todos = GRUPOS.flatMap(g => g.itens);
  const exato = todos.find(i => i.to === pathname);
  if (exato) return exato.rotulo;
  const prefixo = todos.find(i => i.to !== '/' && pathname.startsWith(i.to));
  return prefixo ? prefixo.rotulo : 'Painel';
}

export function Sidebar({ recolhida, onAlternarRecolhida, onNavegar, alertas }) {
  const contagem = (chave) => {
    if (!chave || !alertas) return null;
    const n = alertas[chave];
    return n > 0 ? n : null;
  };

  return (
    <aside className="sidebar" aria-label="Navegação principal">
      <NavLink to="/" className="sidebar-marca" onClick={onNavegar}>
        <span className="sidebar-logo" aria-hidden="true">JM</span>
        <span className="sidebar-marca-txt">
          <span className="sidebar-marca-nome">JMENET</span>
          <span className="sidebar-marca-sub">Painel</span>
        </span>
      </NavLink>

      <nav className="sidebar-nav">
        {GRUPOS.map(grupo => (
          <div className="sidebar-grupo" key={grupo.titulo}>
            <div className="sidebar-grupo-titulo">{grupo.titulo}</div>
            {grupo.itens.map(({ to, rotulo, Icone, exato, contagem: chave }) => {
              const n = contagem(chave);
              return (
                <NavLink
                  key={to}
                  to={to}
                  end={exato}
                  title={recolhida ? rotulo : undefined}
                  onClick={onNavegar}
                  className={({ isActive }) => `sidebar-link ${isActive ? 'ativo' : ''}`}
                >
                  <span className="sidebar-icone"><Icone /></span>
                  <span className="sidebar-rotulo">{rotulo}</span>
                  {n !== null && (
                    <span className="sidebar-contagem" title={`${n} pendente(s)`}>{n}</span>
                  )}
                </NavLink>
              );
            })}
          </div>
        ))}
      </nav>

      <div className="sidebar-rodape">
        <button
          type="button"
          className="sidebar-recolher"
          onClick={onAlternarRecolhida}
          title={recolhida ? 'Expandir menu' : 'Recolher menu'}
        >
          <span className="sidebar-icone">{recolhida ? <FiChevronsRight /> : <FiChevronsLeft />}</span>
          <span>Recolher menu</span>
        </button>
      </div>
    </aside>
  );
}

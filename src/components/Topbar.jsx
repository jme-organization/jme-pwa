// src/components/Topbar.jsx — barra fina do topo: o que e global, nao de tela.
//
// Estado do bot, busca de cliente, janelas de horario, notificacoes, tema e
// sair. Os dois menus de horario abriam no :hover e usavam classes (.h-row,
// .h-input, .h-btn-save) que nunca existiram no CSS — o conteudo caia cru na
// tela. Agora abrem no clique, fecham no Esc e no clique fora, e usam os
// componentes de formulario do sistema.
import React, { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { FiMenu, FiSun, FiMoon, FiLogOut, FiClock, FiSend } from 'react-icons/fi';
import { BuscaGlobal } from './BuscaGlobal';
import { NotificationBell } from './NotificationBell';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { useFetch } from '../hooks/useFetch';
import { api } from '../api/client';
import { rotuloDaRota } from './Sidebar';

// Fecha no clique fora e no Esc — vale para os dois menus de horario.
function useFechaFora(aberto, fechar) {
  const ref = useRef(null);
  useEffect(() => {
    if (!aberto) return undefined;
    const clique = (e) => { if (ref.current && !ref.current.contains(e.target)) fechar(); };
    const tecla = (e) => { if (e.key === 'Escape') fechar(); };
    document.addEventListener('mousedown', clique);
    document.addEventListener('keydown', tecla);
    return () => {
      document.removeEventListener('mousedown', clique);
      document.removeEventListener('keydown', tecla);
    };
  }, [aberto, fechar]);
  return ref;
}

function JanelaHorario({ Icone, resumo, titulo, valores, onSalvar, extra }) {
  const [aberto, setAberto] = useState(false);
  const [inicio, setInicio] = useState(valores.inicio);
  const [fim, setFim] = useState(valores.fim);
  const [salvando, setSalvando] = useState(false);
  const ref = useFechaFora(aberto, () => setAberto(false));

  const abrir = () => {
    setInicio(valores.inicio);
    setFim(valores.fim);
    setAberto(a => !a);
  };

  const salvar = async () => {
    setSalvando(true);
    try {
      await onSalvar(Number(inicio), Number(fim));
      setAberto(false);
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div className="suspenso-wrap" ref={ref}>
      <button type="button" className="pilula" onClick={abrir} title={titulo}>
        <Icone />
        <span className="pilula-txt">{resumo}</span>
      </button>

      {aberto && (
        <div className="suspenso" role="dialog" aria-label={titulo}>
          <div className="suspenso-titulo">{titulo}</div>
          {extra}
          <div className="linha" style={{ flexWrap: 'nowrap' }}>
            <div className="campo" style={{ flex: 1, marginBottom: 0 }}>
              <label className="rotulo" htmlFor={`ini-${titulo}`}>Início</label>
              <input
                id={`ini-${titulo}`}
                className="entrada"
                type="number"
                min={0}
                max={23}
                value={inicio}
                onChange={e => setInicio(e.target.value)}
              />
            </div>
            <div className="campo" style={{ flex: 1, marginBottom: 0 }}>
              <label className="rotulo" htmlFor={`fim-${titulo}`}>Fim</label>
              <input
                id={`fim-${titulo}`}
                className="entrada"
                type="number"
                min={0}
                max={23}
                value={fim}
                onChange={e => setFim(e.target.value)}
              />
            </div>
          </div>
          <div className="modal-footer mt-3">
            <button type="button" className="btn btn-pequeno" onClick={() => setAberto(false)}>Cancelar</button>
            <button type="button" className="btn btn-primario btn-pequeno" onClick={salvar} disabled={salvando}>
              {salvando ? 'Salvando…' : 'Salvar'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export function Topbar({ botAtivo, onToggleBot, onAbrirMenu }) {
  const { theme, toggleTheme } = useTheme();
  const { sair } = useAuth();
  const location = useLocation();

  const { data: atendimento, refetch: recarregarAtendimento } = useFetch('/api/horario');
  const { data: cobranca, refetch: recarregarCobranca } = useFetch('/api/horario/cobranca');

  const salvarAtendimento = async (inicio, fim) => {
    await api.post('/api/horario', { inicio, fim, ativo: true });
    recarregarAtendimento();
  };

  const salvarCobranca = async (inicio, fim) => {
    await api.post('/api/horario/cobranca', { inicio, fim });
    recarregarCobranca();
  };

  const alternarAtendimento = async () => {
    await api.post('/api/horario', { ativo: !atendimento?.ativo });
    recarregarAtendimento();
  };

  return (
    <header className="topbar">
      <div className="topbar-esq">
        <button
          type="button"
          className="icone-btn hamburguer"
          onClick={onAbrirMenu}
          aria-label="Abrir menu"
        >
          <FiMenu />
        </button>
        <span className="topbar-titulo">{rotuloDaRota(location.pathname)}</span>
        <BuscaGlobal />
      </div>

      <div className="topbar-dir">
        <JanelaHorario
          Icone={FiSend}
          titulo="Janela de cobrança"
          resumo={cobranca ? `${cobranca.inicio}h–${cobranca.fim}h` : '8h–17h'}
          valores={{ inicio: cobranca?.inicio ?? 8, fim: cobranca?.fim ?? 17 }}
          onSalvar={salvarCobranca}
        />

        <JanelaHorario
          Icone={FiClock}
          titulo="Janela de atendimento"
          resumo={atendimento?.ativo ? `${atendimento.inicio}h–${atendimento.fim}h` : '24h'}
          valores={{ inicio: atendimento?.inicio ?? 8, fim: atendimento?.fim ?? 20 }}
          onSalvar={salvarAtendimento}
          extra={
            <div className="linha mb-2">
              <span className="dica mt-0">
                {atendimento?.ativo ? 'Respeitando a janela' : 'Sem restrição de horário'}
              </span>
              <button
                type="button"
                className={`btn btn-pequeno ${atendimento?.ativo ? 'btn-ok' : ''} linha-fim`}
                onClick={alternarAtendimento}
              >
                {atendimento?.ativo ? 'Ativa' : '24h'}
              </button>
            </div>
          }
        />

        <button
          type="button"
          className={`pilula ${botAtivo ? 'pilula-on' : 'pilula-off'}`}
          onClick={onToggleBot}
          title={botAtivo ? 'Automação ligada — clique para desligar' : 'Automação desligada — clique para ligar'}
        >
          <span className={`pilula-ponto ${botAtivo ? 'pilula-ponto-on' : 'pilula-ponto-off'}`} />
          <span className="pilula-txt">Auto. {botAtivo ? 'on' : 'off'}</span>
        </button>

        <NotificationBell />

        <button
          type="button"
          className="icone-btn"
          onClick={toggleTheme}
          title={theme === 'dark' ? 'Tema claro' : 'Tema escuro'}
          aria-label={theme === 'dark' ? 'Tema claro' : 'Tema escuro'}
        >
          {theme === 'dark' ? <FiSun /> : <FiMoon />}
        </button>

        <button
          type="button"
          className="icone-btn"
          onClick={sair}
          title="Sair do painel"
          aria-label="Sair do painel"
        >
          <FiLogOut />
        </button>
      </div>
    </header>
  );
}

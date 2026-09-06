// src/App.jsx — shell do painel: sidebar fixa + topbar + rota.
import React, { useCallback, useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Sidebar } from './components/Sidebar';
import { Topbar } from './components/Topbar';
import { ErrorBoundary } from './components/ErrorBoundary';
import { ThemeProvider } from './contexts/ThemeContext';
import { NotificationProvider, useNotifications } from './contexts/NotificationContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { useStatusBot } from './hooks/useSSEData';
import { PageLogin } from './pages/login';

import { PageQR } from './pages/qr';
import { PageDashboard } from './pages/dashboard';
import { PageClientes } from './pages/clientes';
import { PagePromessas } from './pages/promessas';
import { PageCarne } from './pages/carne';
import { PageCancelamentos } from './pages/cancelamentos';
import { PageBoasVindas } from './pages/boasvindas';
import { PageChamados } from './pages/chamados';
import { PageLogs } from './pages/logs';
import { PageCobranca } from './pages/cobranca';
import { PageSGP } from './pages/sgp';
import { PageNovos } from './pages/novos';
import { PageInadimplentes } from './pages/inadimplentes';
import { PageAgendamentos } from './pages/agendamentos';

import { api } from './api/client';

const CHAVE_MENU = 'jme_menu_recolhido';

// Fecha a gaveta a cada troca de rota — no celular, clicar num item do menu
// tem que levar pra tela, nao deixar a gaveta por cima dela.
function FechaGavetaNaRota({ aoTrocar }) {
  const location = useLocation();
  useEffect(() => { aoTrocar(); }, [location.pathname, location.search, aoTrocar]);
  return null;
}

function AppContent() {
  const status = useStatusBot();
  const { alertasData } = useNotifications();

  const [recolhida, setRecolhida] = useState(() => {
    try { return localStorage.getItem(CHAVE_MENU) === '1'; } catch (_) { return false; }
  });
  const [gaveta, setGaveta] = useState(false);

  const alternarRecolhida = useCallback(() => {
    setRecolhida(v => {
      const novo = !v;
      try { localStorage.setItem(CHAVE_MENU, novo ? '1' : '0'); } catch (_) { /* modo anonimo */ }
      return novo;
    });
  }, []);

  const fecharGaveta = useCallback(() => setGaveta(false), []);

  const alternarBot = useCallback(async () => {
    try { await api.post('/api/bot/toggle'); } catch (_) { /* o SSE traz o estado real */ }
  }, []);

  const classes = [
    'shell',
    recolhida ? 'shell--recolhida' : '',
    gaveta ? 'shell--gaveta' : '',
  ].filter(Boolean).join(' ');

  return (
    <BrowserRouter>
      <FechaGavetaNaRota aoTrocar={fecharGaveta} />
      <div className={classes}>
        <Sidebar
          recolhida={recolhida}
          onAlternarRecolhida={alternarRecolhida}
          onNavegar={fecharGaveta}
          alertas={alertasData}
        />

        {gaveta && <button className="veu" aria-label="Fechar menu" onClick={fecharGaveta} />}

        <div className="shell-corpo">
          <Topbar
            botAtivo={status?.botAtivo}
            onToggleBot={alternarBot}
            onAbrirMenu={() => setGaveta(true)}
          />

          <main className="conteudo">
            <ErrorBoundary>
              <Routes>
                <Route path="/" element={<PageDashboard status={status} />} />
                <Route path="/boas-vindas" element={<PageBoasVindas />} />
                <Route path="/chamados" element={<PageChamados />} />
                <Route path="/clientes" element={<PageClientes />} />
                <Route path="/promessas" element={<PagePromessas />} />
                <Route path="/carne" element={<PageCarne />} />
                <Route path="/logs" element={<PageLogs />} />
                <Route path="/cobranca" element={<PageCobranca />} />
                <Route path="/sgp" element={<PageSGP />} />
                <Route path="/novos" element={<PageNovos />} />
                <Route path="/cancelamentos" element={<PageCancelamentos />} />
                <Route path="/inadimplentes" element={<PageInadimplentes />} />
                <Route path="/agendamentos" element={<PageAgendamentos />} />
                <Route path="/qr" element={<PageQR status={status} />} />
                {/* /estados era uma tela fixa dizendo que o atendimento
                    automatico nao existe mais: zero informacao. Quem chegar
                    pelo link antigo cai no dashboard. */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </ErrorBoundary>
          </main>
        </div>
      </div>
    </BrowserRouter>
  );
}

// Porta de entrada: sem token valido, o painel inteiro nao monta.
function AppComAuth() {
  const { autenticado, carregando } = useAuth();

  if (carregando) {
    return (
      <div className="login-tela">
        <div className="spinner-wrap"><div className="spinner" /></div>
      </div>
    );
  }

  // Os alertas so existem depois do login: montar o provider antes disso fazia
  // a tela de login pedir /api/dashboard/alertas sem token e levar 401.
  return autenticado
    ? <NotificationProvider><AppContent /></NotificationProvider>
    : <PageLogin />;
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppComAuth />
      </AuthProvider>
    </ThemeProvider>
  );
}

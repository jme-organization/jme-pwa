// src/pages/dashboard.jsx — a primeira tela: o que exige acao hoje, primeiro.
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { useFetch } from '../hooks/useFetch';
import { useNotifications } from '../contexts/NotificationContext';
import { useCorTokens } from '../hooks/useCorTokens';
import { Card } from '../components/Card';
import { DonutClientes } from '../components/DonutClientes';
import { PainelRede } from '../components/PainelRede';
import { DarkTooltip } from '../components/DarkTooltip';
import { fmtDate, fmtMoeda } from '../utils/formatadores';

const CLASSE_FORMA = {
  pix: 'badge-pago',
  boleto: 'badge-info',
  dinheiro: 'badge-pendente',
  'cartão': 'badge-promessa',
  'carnê': 'badge-bloqueado',
  efi: 'badge-isento',
};

function Alerta({ emoji, tom, titulo, detalhe, onClick }) {
  return (
    <button type="button" className={`aviso aviso-${tom} aviso-clicavel`} onClick={onClick}>
      <span className="aviso-emoji">{emoji}</span>
      <span className="aviso-corpo">
        {titulo}
        {detalhe && <span className="aviso-detalhe">{detalhe}</span>}
      </span>
    </button>
  );
}

export function PageDashboard({ status }) {
  const navigate = useNavigate();
  const cor = useCorTokens();

  const { data: fluxoClientes } = useFetch('/api/dashboard/fluxo-clientes');
  const { data: cobr } = useFetch('/api/graficos/cobrancas');
  const { data: bases } = useFetch('/api/bases');
  const { data: resumoBases } = useFetch('/api/dashboard/resumo-bases');
  const { data: caixaHoje } = useFetch('/api/dashboard/caixa-hoje');
  const { data: cicloInfo } = useFetch('/api/ciclo-info');
  const { alertasData: alertas } = useNotifications();

  const totalAtivos = resumoBases?.bases?.reduce((acc, b) => acc + (b.total || 0), 0) ?? 0;
  const totalCancelados = resumoBases?.bases?.reduce((acc, b) => acc + (b.cancelados || 0), 0) ?? 0;
  const totalPendentes = resumoBases?.totalPendentes ?? 0;
  const totalPromessas = resumoBases?.totalPromessas ?? 0;

  const temAlerta = alertas && (alertas.promessasHoje > 0 || alertas.promessasAmanha > 0
    || alertas.inadimplentes > 0 || alertas.chamadosAbertos > 0);

  const conectando = status === null;
  const online = status?.online;

  return (
    <div className="page page-larga">
      <div className="page-topo">
        <div>
          <h1 className="page-title">Dashboard</h1>
          {cicloInfo && <div className="page-sub">Ciclo de {cicloInfo.mesNome}</div>}
        </div>
      </div>

      {temAlerta && (
        <div className="grade grade-alertas">
          {alertas.promessasHoje > 0 && (
            <Alerta
              emoji="🔴"
              tom="erro"
              titulo={`${alertas.promessasHoje} promessa${alertas.promessasHoje !== 1 ? 's' : ''} vence hoje`}
              detalhe={alertas.promessasHojeDetalhe?.map(p => p.nome?.split(' ')[0]).filter(Boolean).join(', ')}
              onClick={() => navigate('/promessas')}
            />
          )}
          {alertas.promessasAmanha > 0 && (
            <Alerta
              emoji="⚠️"
              tom="alerta"
              titulo={`${alertas.promessasAmanha} promessa${alertas.promessasAmanha !== 1 ? 's' : ''} vence amanhã`}
              detalhe="acompanhar pagamento"
              onClick={() => navigate('/promessas')}
            />
          )}
          {alertas.inadimplentes > 0 && (
            <Alerta
              emoji="❌"
              tom="erro"
              titulo={`${alertas.inadimplentes} inadimplente${alertas.inadimplentes !== 1 ? 's' : ''} há mais de 5 dias`}
              detalhe="ver relatório"
              onClick={() => navigate('/inadimplentes')}
            />
          )}
          {alertas.chamadosAbertos > 0 && (
            <Alerta
              emoji="🔧"
              tom="alerta"
              titulo={`${alertas.chamadosAbertos} chamado${alertas.chamadosAbertos !== 1 ? 's' : ''} aberto há +24h`}
              detalhe="ver chamados"
              onClick={() => navigate('/chamados')}
            />
          )}
        </div>
      )}

      <div className="dash-grade">
        {/* ── coluna 1: quem são os clientes ── */}
        <div className="pilha">
          <Card className="card-pad">
            <div className="secao-rotulo">👥 Clientes</div>
            <DonutClientes
              ativos={totalAtivos}
              cancelados={totalCancelados}
              pendentes={totalPendentes}
              promessas={totalPromessas}
              instalacoes={fluxoClientes?.mes?.entradas ?? 0}
            />
            <div className="dash-fluxo">
              <div>
                <span className="kpi-val val-ok">+{fluxoClientes?.mes?.entradas ?? 0}</span>
                <span className="kpi-label">Entradas no mês</span>
              </div>
              <div>
                <span className="kpi-val val-erro">−{fluxoClientes?.mes?.saidas ?? 0}</span>
                <span className="kpi-label">Saídas no mês</span>
              </div>
            </div>
          </Card>

          {bases?.length > 0 && (
            <Card className="card-pad">
              <div className="secao-rotulo">📁 Bases</div>
              <div className="pilha-fina">
                {bases.map(b => {
                  const rb = resumoBases?.bases?.find(x => x.id === b.id);
                  const pct = rb?.total ? Math.round((rb.pagos / rb.total) * 100) : 0;
                  return (
                    <button
                      key={b.id}
                      type="button"
                      className="base-item"
                      onClick={() => navigate(`/clientes?base=${b.id}`)}
                    >
                      <div className="linha">
                        <span className="base-item-nome">{b.nome}</span>
                        <span className="base-item-pct linha-fim">{pct}%</span>
                      </div>
                      <div className="barra">
                        {/* largura calculada: unico caso em que px/% vive no style */}
                        <div className="barra-preenche" style={{ width: `${pct}%` }} />
                      </div>
                      <div className="base-item-meta">
                        <span>{rb?.pagos ?? 0} pagos</span>
                        <span>{rb?.pendentes ?? 0} pendentes</span>
                        <span>{rb?.total ?? 0} total</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </Card>
          )}
        </div>

        {/* ── coluna 2: o que está de pé agora ── */}
        <div className="pilha">
          <Card className="card-pad">
            <div className="secao-rotulo">🤖 Bot do WhatsApp</div>
            <div className="linha">
              <span className={`pilula-ponto ${online ? 'pilula-ponto-on' : 'pilula-ponto-off'}`} />
              <span className={`dash-estado ${conectando ? 'val-alerta' : online ? 'val-ok' : 'val-erro'}`}>
                {conectando ? 'Conectando…' : online ? 'Online' : 'Offline'}
              </span>
            </div>
            {status?.iniciadoEm && (
              <div className="dica">desde {fmtDate(status.iniciadoEm)}</div>
            )}
            {!conectando && !online && (
              <button type="button" className="btn btn-info btn-bloco mt-2" onClick={() => navigate('/qr')}>
                Reconectar pelo QR Code
              </button>
            )}
          </Card>

          <PainelRede
            situacaoRede={status?.situacaoRede}
            previsaoRetorno={status?.previsaoRetorno}
          />

          <Card className="card-pad">
            <div className="linha">
              <span className="secao-rotulo" style={{ marginBottom: 0 }}>💵 Caixa de hoje</span>
              {caixaHoje?.length > 0 && (
                <span className="badge badge-pago linha-fim">
                  {caixaHoje.length} baixa{caixaHoje.length !== 1 ? 's' : ''}
                </span>
              )}
            </div>

            {!caixaHoje?.length ? (
              <div className="vazio">
                <span className="vazio-emoji">🗓️</span>
                Nenhuma baixa registrada hoje
              </div>
            ) : (
              <div className="pilha-fina dash-caixa">
                {caixaHoje.map((r, i) => {
                  const forma = (r.forma_baixa || r.forma_pagamento || '—').toLowerCase();
                  const hora = r.pago_em
                    ? new Date(r.pago_em).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
                    : '—';
                  return (
                    <div key={r.id || `${r.nome}-${i}`} className="caixa-linha">
                      <span className="caixa-nome">{r.nome}</span>
                      {r.valor_plano != null && (
                        <span className="caixa-valor">{fmtMoeda(Number(r.valor_plano))}</span>
                      )}
                      <span className={`badge ${CLASSE_FORMA[forma] || 'badge-neutro'}`}>{forma.toUpperCase()}</span>
                      <span className="caixa-hora">{hora}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </div>

        {/* ── coluna 3: como está a cobrança ── */}
        <div className="pilha">
          <Card className="card-pad">
            <div className="secao-rotulo">💜 Cobranças — 7 dias</div>
            <ResponsiveContainer width="100%" height={150}>
              <BarChart data={cobr || []} barSize={16}>
                <XAxis
                  dataKey="dia"
                  tick={{ fontSize: 12, fill: cor['text-muted'] }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis hide />
                <Tooltip content={<DarkTooltip />} cursor={{ fill: cor['bg-secondary'] }} />
                <Bar dataKey="total" radius={[4, 4, 0, 0]} isAnimationActive={false}>
                  {(cobr || []).map((_, i) => <Cell key={i} fill={cor.purple} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            {!cobr?.length && <div className="dica">Nenhum disparo nos últimos 7 dias.</div>}
          </Card>

          <Card className="card-pad">
            <div className="secao-rotulo">❌ Inadimplentes (+5 dias)</div>
            {alertas?.inadimplentes ? (
              <div className="dash-destaque">
                <span className="dash-numero val-erro">{alertas.inadimplentes}</span>
                <span className="kpi-label">clientes pendentes há mais de 5 dias</span>
                <button type="button" className="btn btn-perigo btn-bloco" onClick={() => navigate('/inadimplentes')}>
                  Ver relatório completo
                </button>
              </div>
            ) : (
              <div className="vazio">
                <span className="vazio-emoji">✅</span>
                Nenhum inadimplente
                <span className="vazio-dica">Todo mundo dentro do prazo.</span>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}

// src/components/fttx/Diagnostico.jsx
// Por que o cliente caiu — e o que fazer a respeito.
//
// A pergunta que isto responde e a que o dono faz quando alguem reclama: foi
// problema na casa do cliente ou na rede? A OLT sabe, e diz em `Last down
// cause`. Faltou luz (dying-gasp) e um telefonema; fibra rompida (LOS) e uma
// visita.
//
// Mas a CAUSA e historia e a RECOMENDACAO e agora — sao coisas diferentes, e a
// primeira versao desta tela confundia as duas: mostrava "precisa de tecnico"
// para uma ONU online, com sinal bom, cuja unica queda tinha durado um minuto
// horas antes. Por isso a recomendacao vem primeiro e a causa vem depois.
//
// E sob demanda porque a consulta fala com a OLT na hora: medida entre 0,4s e
// 12s em producao. Nao da pra pendurar isso na abertura da tela.
import React, { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { api } from '../../api/client';
import { useCorTokens } from '../../hooks/useCorTokens';
import { Sinal } from './sinal';

// A cor segue a consequencia, como o resto do painel: vermelho so quando ha
// trabalho de campo pela frente.
const COR_ACAO = {
  tecnico: 'badge-inadimplente',
  cliente: 'badge-pendente',
  olhar: 'badge-promessa',
  nenhuma: 'badge-pago',
};

// "0 day(s), 6 hour(s), 29 minute(s)" nao pode virar "0 dias, 6 h, 29 min" na
// tela: o zero e ruido. Pedaco que e zero nao aparece.
function tempoLegivel(partes) {
  if (!partes) return null;
  const p = [];
  if (partes.dias) p.push(`${partes.dias} ${partes.dias === 1 ? 'dia' : 'dias'}`);
  if (partes.horas) p.push(`${partes.horas} h`);
  if (partes.minutos && !partes.dias) p.push(`${partes.minutos} min`);
  return p.length ? p.join(' ') : 'menos de 1 min';
}

// Duracao da queda em palavra curta: 60 -> "1 min".
function duracaoQueda(s) {
  if (s === null || s === undefined) return null;
  if (s < 60) return `${s} s`;
  if (s < 3600) return `${Math.round(s / 60)} min`;
  return `${(s / 3600).toFixed(1)} h`;
}

// A linha de limite so vale desenhar se couber no que o grafico esta mostrando:
// o dominio e colado nos dados. Desenhar fora nao aparece, e a legenda embaixo
// passava a afirmar que a linha estava la.
function mostraLimite(pontos, y) {
  if (!pontos || !pontos.length) return false;
  const vals = pontos.map(p => p.rx);
  return y >= Math.min(...vals) - 1 && y <= Math.max(...vals) + 1;
}

function quando(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' });
}

export function Diagnostico({ onu }) {
  const [dado, setDado] = useState(null);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState(null);
  const cores = useCorTokens();

  const consultar = async () => {
    setCarregando(true);
    setErro(null);
    try {
      // 40s: o backend espera ate 45s a OLT, e essa consulta ja levou 12s.
      const r = await api.get(
        `/api/fttx/onu/${onu.id}/diagnostico?phy_addr=${encodeURIComponent(onu.phy_addr)}`, 40000
      );
      setDado(r);
    } catch (e) {
      setErro(e.message);
    } finally {
      setCarregando(false);
    }
  };

  const d = dado?.diagnostico;
  const h = dado?.historico;
  const rec = d?.recomendacao;

  return (
    <div className="mt-2">
      {!dado && (
        <button className="btn btn-info btn-pequeno" onClick={consultar} disabled={carregando}>
          {carregando ? 'Perguntando à OLT…' : 'Por que caiu?'}
        </button>
      )}
      {carregando && <div className="dica mt-1">A OLT pode levar alguns segundos.</div>}
      {erro && <div className="aviso aviso-erro mt-2">{erro}</div>}

      {d && (
        <>
          <div className="onu-job mt-2">
            <span className={`badge ${d.online ? 'badge-pago' : 'badge-inadimplente'}`}>
              {d.online ? 'Online' : 'Offline'}
            </span>
            {tempoLegivel(d.onlineHa) && <span className="td-muted">há {tempoLegivel(d.onlineHa)}</span>}
            {d.distanciaM != null && <span className="td-muted">{d.distanciaM} m de fibra</span>}
            {/* Temperatura alta vira aviso, nao metadado perdido no meio: ela
                costuma aparecer ANTES do defeito. */}
            {d.temperatura && (d.temperatura.nivel === 'ok' ? (
              <span className="td-muted">{d.temperatura.valor} °C</span>
            ) : (
              <span className={`badge ${d.temperatura.nivel === 'critico' ? 'badge-inadimplente' : 'badge-pendente'}`}>
                {d.temperatura.valor} °C · {d.temperatura.texto}
              </span>
            ))}
          </div>

          {/* A recomendacao vem primeiro: e o que o dono decide em cima. */}
          {rec && (
            <div className="onu-job">
              <span className={`badge ${COR_ACAO[rec.acao] || 'badge-neutro'}`}>{rec.texto}</span>
              <span className="onu-job-msg">{rec.motivo}</span>
            </div>
          )}

          <div className="onu-job">
            <span className="secao-rotulo">Última queda</span>
            <strong>{d.rotulo}</strong>
            {duracaoQueda(d.quedaDuracaoS) && (
              <span className="td-muted">durou {duracaoQueda(d.quedaDuracaoS)}</span>
            )}
          </div>
          <div className="onu-job">
            <span className="onu-job-msg">{d.detalhe}</span>
          </div>
          <div className="onu-job">
            <span className="td-muted">caiu {quando(d.caiuEm)}</span>
            <span className="td-muted">voltou {quando(d.voltouEm)}</span>
            <span className="td-muted">código da OLT: {d.causa}</span>
          </div>

          {h?.pontos?.length > 1 && (
            <div className="card-pad mt-2">
              <div className="onu-barra">
                <span className="secao-rotulo">Sinal nas últimas {h.pontos.length} medições</span>
                {h.tendencia?.piorando && <span className="badge badge-inadimplente">piorando {h.tendencia.delta} dB</span>}
                {h.tendencia?.melhorando && <span className="badge badge-pago">melhorou {h.tendencia.delta} dB</span>}
              </div>
              <ResponsiveContainer width="100%" height={140}>
                <LineChart data={h.pontos} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
                  <XAxis dataKey="em" hide />
                  {/* 56px de largura: com 44 o rotulo saia cortado e "-23.2"
                      aparecia como "3.2" — que le como sinal POSITIVO, o oposto
                      do que e. `tickFormatter` fixa a casa decimal pra largura
                      nao variar com o dado. */}
                  <YAxis
                    domain={['dataMin - 1', 'dataMax + 1']}
                    tick={{ fill: cores['text-muted'], fontSize: 11, fontWeight: 700 }}
                    tickFormatter={v => Number(v).toFixed(1)}
                    width={56}
                  />
                  {mostraLimite(h.pontos, -25) && <ReferenceLine y={-25} stroke={cores.amber} strokeDasharray="4 4" />}
                  {mostraLimite(h.pontos, -28) && <ReferenceLine y={-28} stroke={cores.red} strokeDasharray="4 4" />}
                  <Tooltip
                    contentStyle={{
                      background: cores['bg-card'],
                      border: `1px solid ${cores.border}`,
                      borderRadius: 8,
                      color: cores['text-primary'],
                      fontWeight: 600,
                    }}
                    labelFormatter={quando}
                    formatter={(v) => [`${v} dBm`, 'sinal']}
                  />
                  <Line type="monotone" dataKey="rx" stroke={cores.blue} strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
              <div className="dica">
                {h.total} medições guardadas pelo SGP.
                {mostraLimite(h.pontos, -25) && ' Linha amarela: −25 dBm.'}
                {mostraLimite(h.pontos, -28) && ' Vermelha: −28 dBm.'}
                {!mostraLimite(h.pontos, -25) && ' O sinal está longe dos limites de alerta.'}
              </div>
            </div>
          )}

          <div className="page-acoes mt-2">
            <button className="btn btn-fantasma btn-pequeno" onClick={consultar} disabled={carregando}>
              Consultar de novo
            </button>
            <span className="onu-contagem">agora:</span>
            {/* `<Sinal>` mostra "—" sem leitura. ONU offline reporta ZERO, que e
                o melhor sinal possivel — escrever o numero cru mentiria. */}
            <Sinal rx={d.rx} />
          </div>
        </>
      )}
    </div>
  );
}

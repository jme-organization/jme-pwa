// src/components/fttx/Diagnostico.jsx
// Por que o cliente caiu — e o sinal dele ao longo do tempo.
//
// A pergunta que isto responde e a que o dono faz todo dia quando alguem
// reclama: foi problema na casa do cliente ou na rede? A OLT sabe, e diz em
// `Last down cause`. Faltou luz (dying-gasp) e um telefonema; fibra rompida
// (LOS) e uma visita. Sem isso, os dois casos parecem iguais.
//
// E sob demanda porque a consulta fala com a OLT na hora: medida entre 0,4s e
// 12s em producao. Nao da pra pendurar isso na abertura da tela.
import React, { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { api } from '../../api/client';
import { useCorTokens } from '../../hooks/useCorTokens';
import { Sinal } from './sinal';

// O que fazer com a informacao — e o que muda a decisao do dono.
const ACAO = {
  cliente: { texto: 'Ligue para o cliente', badge: 'badge-pendente' },
  tecnico: { texto: 'Provavelmente precisa de técnico', badge: 'badge-inadimplente' },
  nenhuma: { texto: '', badge: 'badge-neutro' },
};

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
      const serial = onu.phy_addr;
      // 40s: o backend espera ate 45s a OLT, e ja vi essa consulta levar 12s.
      const r = await api.get(
        `/api/fttx/onu/${onu.id}/diagnostico?phy_addr=${encodeURIComponent(serial)}`, 40000
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
  const acao = ACAO[d?.acao] || ACAO.nenhuma;

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
            {d.online_ha && <span className="td-muted">há {d.online_ha.replace(/day\(s\)/, 'dias').replace(/hour\(s\)/, 'h').replace(/minute\(s\)/, 'min').replace(/,? \d+ second\(s\)/, '')}</span>}
            {d.distanciaM != null && <span className="td-muted">{d.distanciaM} m de fibra</span>}
            {d.temperatura != null && <span className="td-muted">{d.temperatura} °C</span>}
          </div>

          <div className="onu-job">
            <span className="secao-rotulo">Última queda</span>
            <strong>{d.rotulo}</strong>
            {acao.texto && <span className={`badge ${acao.badge}`}>{acao.texto}</span>}
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
              {/* `.onu-barra` ja e flex com gap — evita px fixo em style inline,
                  que o CONVENTIONS.md proibe. */}
              <div className="onu-barra">
                <span className="secao-rotulo">Sinal nas últimas {h.pontos.length} medições</span>
                {h.tendencia?.piorando && <span className="badge badge-inadimplente">piorando {h.tendencia.delta} dB</span>}
                {h.tendencia?.melhorando && <span className="badge badge-pago">melhorou {h.tendencia.delta} dB</span>}
              </div>
              <ResponsiveContainer width="100%" height={140}>
                <LineChart data={h.pontos} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
                  <XAxis dataKey="em" hide />
                  <YAxis
                    domain={['dataMin - 1', 'dataMax + 1']}
                    tick={{ fill: cores['text-muted'], fontSize: 11, fontWeight: 700 }}
                    width={44}
                  />
                  {/* As duas linhas que separam sinal bom de ruim, iguais as da tabela. */}
                  <ReferenceLine y={-25} stroke={cores.amber} strokeDasharray="4 4" />
                  <ReferenceLine y={-28} stroke={cores.red} strokeDasharray="4 4" />
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
                {h.total} medições guardadas pelo SGP. Linha amarela: −25 dBm. Vermelha: −28 dBm.
              </div>
            </div>
          )}

          <div className="page-acoes mt-2">
            <button className="btn btn-fantasma btn-pequeno" onClick={consultar} disabled={carregando}>
              Consultar de novo
            </button>
            {/* `<Sinal>` mostra "—" quando nao ha leitura. Escrever {d.rx} direto
                faria a ONU OFFLINE dizer "null dBm" — ou, pior, "0 dBm", que e o
                melhor sinal possivel. */}
            <span className="onu-contagem">agora:</span>
            <Sinal rx={d.rx} />
          </div>
        </>
      )}
    </div>
  );
}

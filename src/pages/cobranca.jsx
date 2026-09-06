// src/pages/cobranca.jsx — disparo manual, agenda do mes e o que ja saiu.
import React, { useState } from 'react';
import { useFetch } from '../hooks/useFetch';
import { Card } from '../components/Card';
import { Spinner } from '../components/Spinner';
import { fmtDate } from '../utils/formatadores';
import { api } from '../api/client';

// Os tipos vivem no backend (services/tipoCobranca.js). Aqui e so o rotulo.
const TIPOS = [
  { value: '', label: '🔄 Automático (pela data)' },
  { value: 'lembrete', label: '🔔 Lembrete (D-1)' },
  { value: 'atraso', label: '⏰ Atraso' },
  { value: 'atraso_final', label: '⚠️ Atraso final' },
  { value: 'limite', label: '⛔ Limite (suspensão hoje)' },
  { value: 'reconquista', label: '📞 Reconquista' },
  { value: 'reconquista_final', label: '🚨 Reconquista final' },
];

export function PageCobranca() {
  const { data: agenda, loading: carregandoAgenda, refetch: recarregarAgenda } = useFetch('/api/cobrar/agenda');
  const { data: logs, refetch: recarregarLogs } = useFetch('/api/logs/cobrancas?limit=20');

  const [data, setData] = useState('10');
  const [tipo, setTipo] = useState('');
  const [disparando, setDisparando] = useState(false);
  const [resultado, setResultado] = useState(null);
  const [confirmacao, setConfirmacao] = useState(null);
  const [busca, setBusca] = useState('');
  const [expandido, setExpandido] = useState(null);

  const rotuloTipo = (t) => TIPOS.find(o => o.value === t)?.label || t || '—';

  const disparar = async (forcando = false) => {
    setConfirmacao(null);
    setDisparando(true);
    setResultado(null);
    try {
      const json = await api.post('/api/cobrar/manual', { data, tipo: tipo || undefined, forcar: forcando }, 30000);
      if (json?.jaDisparado) {
        setConfirmacao({ data, tipo: tipo || 'automático', jaDisparado: true, aviso: json.aviso });
      } else {
        setResultado({ ok: true, txt: 'Disparo iniciado. As mensagens saem em segundo plano.' });
        setTimeout(() => { recarregarLogs(); recarregarAgenda(); }, 3000);
      }
    } catch (e) {
      setResultado({ ok: false, txt: e.message || 'Falha de conexão com o servidor' });
    }
    setDisparando(false);
  };

  const hoje = agenda?.diaAtual;
  const pendencia = agenda?.pendencia;
  const filtrados = (logs || []).filter(r => !busca || (r.nome || '').toLowerCase().includes(busca.toLowerCase()));

  return (
    <div className="page">
      <div className="page-topo">
        <div>
          <h1 className="page-title">Cobranças</h1>
          <div className="page-sub">O disparo manda mensagem de verdade para os clientes elegíveis da data.</div>
        </div>
      </div>

      {pendencia && (
        <div className="aviso aviso-alerta mb-4">
          <span className="aviso-emoji">⏸️</span>
          <span className="aviso-corpo">
            Cobrança do dia {pendencia.dia}/{String(pendencia.mes).padStart(2, '0')} foi adiada
            (rede: {pendencia.motivoBloqueio}) e sai sozinha no próximo dia útil, às 11h.
            <span className="aviso-detalhe">
              {pendencia.entradas?.map(e => `Data ${e.data} — ${e.tipo}`).join(' · ')}
            </span>
          </span>
        </div>
      )}

      <div className="grade grade-cobranca">
        <Card className="card-pad">
          <div className="secao-rotulo">🚀 Disparo manual</div>

          <div className="campo">
            <span className="rotulo">Data de vencimento</span>
            <div className="opcoes">
              {['10', '20', '30'].map(d => (
                <button
                  key={d}
                  type="button"
                  className={`opcao ${data === d ? 'opcao-ativa' : ''}`}
                  onClick={() => setData(d)}
                >
                  Dia {d}
                </button>
              ))}
            </div>
          </div>

          <div className="campo">
            <label className="rotulo" htmlFor="tipo-msg">Tipo de mensagem</label>
            <select id="tipo-msg" className="entrada" value={tipo} onChange={e => setTipo(e.target.value)}>
              {TIPOS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>

          {resultado && (
            <div className={`aviso ${resultado.ok ? 'aviso-ok' : 'aviso-erro'} mb-3`}>
              {resultado.ok ? '✅' : '❌'} {resultado.txt}
            </div>
          )}

          <button
            type="button"
            className="btn btn-primario btn-bloco"
            onClick={() => setConfirmacao({ data, tipo: tipo || 'automático' })}
            disabled={disparando}
          >
            {disparando ? 'Disparando…' : '📤 Disparar agora'}
          </button>

          <div className="dica">
            As mensagens ficam registradas no banco e são enviadas mesmo se o bot reiniciar.
          </div>
        </Card>

        <Card className="card-pad">
          <div className="secao-rotulo">📅 Agenda do mês</div>
          {carregandoAgenda ? (
            <Spinner />
          ) : !agenda?.agenda ? (
            <div className="vazio">
              <span className="vazio-emoji">🗓️</span>
              Nenhuma agenda carregada
            </div>
          ) : (
            <div className="pilha-fina agenda-lista">
              {Object.entries(agenda.agenda)
                .sort((a, b) => Number(a[0]) - Number(b[0]))
                .map(([dia, entradas]) => {
                  const n = Number(dia);
                  const eHoje = n === hoje;
                  return (
                    <div key={dia} className={`agenda-dia ${eHoje ? 'agenda-hoje' : ''} ${n < hoje ? 'agenda-passou' : ''}`}>
                      <span className="agenda-num">{n}</span>
                      <div className="agenda-entradas">
                        {entradas.map((e, i) => (
                          <span key={`${e.data}-${e.tipo}-${i}`} className="badge badge-neutro">
                            Data {e.data} · {e.tipo}
                          </span>
                        ))}
                      </div>
                      {eHoje && <span className="badge badge-info">HOJE</span>}
                    </div>
                  );
                })}
            </div>
          )}
        </Card>
      </div>

      <Card style={{ marginTop: 20 }}>
        <div className="card-cab">
          <span className="card-titulo">📋 Últimas cobranças enviadas</span>
          <input
            className="busca-input linha-fim"
            placeholder="Buscar por nome…"
            value={busca}
            onChange={e => setBusca(e.target.value)}
          />
        </div>
        <div className="tabela-scroll">
          <table className="tabela">
            <thead>
              <tr><th>Nome</th><th>Vencimento</th><th>Tipo</th><th>Enviado em</th></tr>
            </thead>
            <tbody>
              {filtrados.length === 0 ? (
                <tr><td colSpan={4} className="td-empty">Nenhum registro</td></tr>
              ) : filtrados.map((r, i) => (
                <React.Fragment key={r.id || i}>
                  <tr
                    className={r.mensagem ? 'linha-clicavel' : ''}
                    onClick={() => r.mensagem && setExpandido(expandido === i ? null : i)}
                  >
                    <td className="td-nome">{r.nome}</td>
                    <td>Dia {r.data_vencimento}</td>
                    <td>{rotuloTipo(r.tipo)}</td>
                    <td className="td-muted">{fmtDate(r.enviado_em)}</td>
                  </tr>
                  {expandido === i && r.mensagem && (
                    <tr>
                      <td colSpan={4} className="td-mensagem">{r.mensagem}</td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {confirmacao && (
        <div className="modal-overlay" onClick={() => setConfirmacao(null)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div className="modal-title">Confirmar disparo</div>

            <div className="aviso aviso-alerta mb-3">
              <span className="aviso-emoji">⚠️</span>
              <span className="aviso-corpo">
                Isto envia WhatsApp de verdade para os clientes elegíveis.
                <span className="aviso-detalhe">
                  Vencimento dia {confirmacao.data} · tipo {confirmacao.tipo}
                </span>
              </span>
            </div>

            {confirmacao.jaDisparado && (
              <div className="aviso aviso-erro mb-3">
                <span className="aviso-emoji">🔁</span>
                <span className="aviso-corpo">
                  {confirmacao.aviso}
                  <span className="aviso-detalhe">Disparar de novo manda a mesma mensagem outra vez.</span>
                </span>
              </div>
            )}

            <div className="modal-footer">
              <button type="button" className="btn" onClick={() => setConfirmacao(null)}>Cancelar</button>
              <button type="button" className="btn btn-perigo" onClick={() => disparar(!!confirmacao.jaDisparado)}>
                📤 {confirmacao.jaDisparado ? 'Disparar mesmo assim' : 'Confirmar disparo'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

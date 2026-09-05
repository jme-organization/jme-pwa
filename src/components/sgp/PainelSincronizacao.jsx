// src/components/sgp/PainelSincronizacao.jsx
import React from 'react';
import { Card } from '../Card';

// Cabeça da página do SGP: diz se a integração está de pé, quando foi a última
// rodada e o que ela fez. Sync que morre calado é indistinguível de sync que não
// tem o que fazer — por isso o estado aparece antes de qualquer lista.
export function PainelSincronizacao({ status, resumo, sincronizando, onSincronizar, onSimular }) {
  const ativo = status?.ativo;
  const idade = status?.idadeMinutos;

  const classePulso = !ativo ? 'sgp-pulso-off'
    : status?.alerta ? 'sgp-pulso-velho'
    : 'sgp-pulso-ok';

  const frase = !ativo
    ? 'Integração desligada — falta SGP_APP/SGP_TOKEN no servidor'
    : idade === null
      ? 'Nunca sincronizou desde o último deploy'
      : idade < 60
        ? `Sincronizado há ${idade} min`
        : `Última sincronização há ${Math.floor(idade / 60)}h${idade % 60 ? ` ${idade % 60}min` : ''}`;

  return (
    <Card className="sgp-secao">
      <div className="sgp-topo">
        <div>
          <div className="sgp-estado">
            <span className={`sgp-pulso ${classePulso}`} />
            {frase}
          </div>
          {status?.ultima && (
            <div className="sgp-meta">
              {status.ultima.verificados} clientes conferidos · {status.ultima.baixados} baixa(s) ·{' '}
              {status.ultima.divergencias} divergência(s) · {status.ultima.erros} erro(s) em{' '}
              {Math.round((status.ultima.duracao_ms || 0) / 1000)}s
            </div>
          )}
        </div>

        <div className="sgp-acoes">
          <button className="sgp-btn" onClick={onSimular} disabled={sincronizando || !ativo}>
            {sincronizando ? 'Conferindo…' : 'Conferir sem aplicar'}
          </button>
          <button
            className="sgp-btn sgp-btn-primario"
            onClick={onSincronizar}
            disabled={sincronizando || !ativo}
          >
            {sincronizando ? 'Sincronizando…' : 'Sincronizar agora'}
          </button>
        </div>
      </div>

      {resumo && (
        <div className="sgp-kpis">
          <div className="sgp-kpi">
            <span className="sgp-kpi-valor sgp-kpi-valor-ok">{resumo.pendentesDeBaixa?.length ?? 0}</span>
            <span className="sgp-kpi-rotulo">Pagos no SGP a refletir aqui</span>
          </div>
          <div className="sgp-kpi">
            <span className="sgp-kpi-valor sgp-kpi-valor-alerta">{resumo.divergencias?.length ?? 0}</span>
            <span className="sgp-kpi-rotulo">Pago aqui, aberto no SGP</span>
          </div>
          <div className="sgp-kpi">
            <span className="sgp-kpi-valor">{resumo.semMatch?.length ?? 0}</span>
            <span className="sgp-kpi-rotulo">Sem correspondência</span>
          </div>
        </div>
      )}
    </Card>
  );
}

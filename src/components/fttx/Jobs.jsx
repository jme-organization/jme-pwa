// src/components/fttx/Jobs.jsx
// As operacoes disparadas e o que aconteceu com elas.
//
// Existe porque o resultado NAO vem na resposta do clique: o SGP demora e
// responde 404 mesmo quando funcionou, entao quem prova e a lista de ONU,
// conferida por ate 5 minutos. Sem este bloco, o dono clicaria e ficaria sem
// saber de nada.
import React from 'react';

// Cada estado com a palavra que o dono usa, e a cor da consequencia.
const ESTADOS = {
  aceito:        { rotulo: 'Na fila',        badge: 'badge-info' },
  enviado:       { rotulo: 'Enviado…',       badge: 'badge-info' },
  confirmado:    { rotulo: 'Feito',          badge: 'badge-pago' },
  nao_confirmado:{ rotulo: 'Não confirmou',  badge: 'badge-inadimplente' },
  ja_ausente:    { rotulo: 'Já não estava',  badge: 'badge-neutro' },
  erro:          { rotulo: 'Falhou',         badge: 'badge-inadimplente' },
  indeterminado: { rotulo: 'Indeterminado',  badge: 'badge-bloqueado' },
};

const COMANDOS = { desautorizar: 'Desautorizar', resetar: 'Reiniciar', autorizar: 'Subir ONU' };

export function Jobs({ jobs }) {
  if (!jobs?.length) return null;

  return (
    <div className="card card-pad mb-3">
      <div className="card-titulo mb-2">Operações</div>
      {jobs.map(job => {
        const e = ESTADOS[job.estado] || { rotulo: job.estado, badge: 'badge-neutro' };
        const seg = job.duracaoMs ? ` · ${Math.round(job.duracaoMs / 1000)}s` : '';
        return (
          <div className="onu-job" key={job.id}>
            <span className={`badge ${e.badge}`}>{e.rotulo}</span>
            <span>{COMANDOS[job.comando] || job.comando}</span>
            <span className="td-mono">{job.phyAddr}</span>
            {job.login && <span className="td-muted">{job.login}</span>}
            <span className="td-muted">{seg}</span>
            {job.mensagem && <span className="onu-job-msg">{job.mensagem}</span>}
          </div>
        );
      })}
    </div>
  );
}

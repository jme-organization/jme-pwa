// src/components/ficha/AbaCancelar.jsx — o fim da linha, e o aviso do meio-termo.
//
// A tela lembra que existe Bloquear: cancelar apaga o cliente da base, e muita
// vez o que o dono quer é só parar de cobrar sem perder o cadastro.
import React from 'react';
import { Recado } from './Recado';

const MOTIVOS = [
  'Problemas financeiros',
  'Qualidade do serviço',
  'Mudança de endereço',
  'Contratei outro provedor',
  'Outro motivo',
];

export function AbaCancelar({
  nome, cancelado,
  motivo, setMotivo, detalhe, setDetalhe,
  cancelMsg, confirmar, salvando,
}) {
  if (cancelado) {
    return (
      <div className="vazio">
        <span className="vazio-emoji">✅</span>
        Cancelamento registrado
        <span className="vazio-dica">O cliente foi para a tela de cancelamentos.</span>
      </div>
    );
  }

  return (
    <div>
      <div className="aviso aviso-erro mb-3">
        <span className="aviso-emoji">⚠️</span>
        <span className="aviso-corpo">
          Cancelar remove {nome} da base
          <span className="aviso-detalhe">
            Se é só para parar de cobrar sem perder o cliente, use Bloquear na lista do dia.
          </span>
        </span>
      </div>

      <div className="campo">
        <span className="rotulo">Motivo</span>
        <div className="opcoes opcoes-coluna">
          {MOTIVOS.map(m => (
            <button
              key={m}
              type="button"
              className={`opcao opcao-lista ${motivo === m ? 'opcao-ativa-perigo opcao-ativa' : ''}`}
              onClick={() => setMotivo(m)}
            >
              {motivo === m ? '● ' : '○ '}{m}
            </button>
          ))}
        </div>
      </div>

      <div className="campo">
        <label className="rotulo" htmlFor="motivo-detalhe">Observação</label>
        <textarea
          id="motivo-detalhe"
          className="entrada"
          rows={3}
          placeholder="Detalhes do cancelamento…"
          value={detalhe}
          onChange={e => setDetalhe(e.target.value)}
        />
      </div>

      <Recado msg={cancelMsg} />

      <button
        type="button"
        className="btn btn-perigo btn-bloco"
        onClick={confirmar}
        disabled={salvando || !motivo}
      >
        {salvando ? 'Registrando…' : '❌ Confirmar cancelamento'}
      </button>
    </div>
  );
}

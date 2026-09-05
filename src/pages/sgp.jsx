// src/pages/sgp.jsx
// Painel da integração com o SGP (TSMX).
//
// O SGP é onde o boleto é emitido e onde o GerenciaNet dá baixa sozinho; este
// painel é onde a cobrança por WhatsApp é decidida. A sincronização reflete o
// pagamento de lá pra cá — e o que ela NÃO resolve sozinha aparece aqui pro dono
// decidir: divergência (pago aqui, aberto lá) e cliente sem correspondência.
import React, { useState, useEffect, useCallback } from 'react';
import { useSSEData } from '../hooks/useSSEData';
import { Spinner } from '../components/Spinner';
import { api } from '../api/client';
import { PainelSincronizacao } from '../components/sgp/PainelSincronizacao';
import { ListaPendentes, ListaDivergencias, ListaSemMatch } from '../components/sgp/ListasConferencia';
import { BaixasManuais } from '../components/sgp/BaixasManuais';

export function PageSGP() {
  const { data: planilha, refetch: recarregarPlanilha } = useSSEData('/api/planilha/resumo', 'clientes');

  const [status, setStatus] = useState(null);
  const [resumo, setResumo] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [sincronizando, setSincronizando] = useState(false);
  const [erro, setErro] = useState(null);

  const carregarStatus = useCallback(async () => {
    try {
      setStatus(await api.get('/api/sgp/status'));
    } catch (e) {
      setErro(e.message);
    }
  }, []);

  // A conferência roda o sync em modo simulação: devolve o que ele FARIA, sem
  // escrever nada. É o mesmo cálculo da rodada real, então a lista não mente.
  const conferir = useCallback(async (silencioso = false) => {
    if (!silencioso) setSincronizando(true);
    setErro(null);
    try {
      setResumo(await api.get('/api/sgp/divergencias', 120000));
    } catch (e) {
      setErro(`Não consegui conferir com o SGP: ${e.message}`);
    } finally {
      setSincronizando(false);
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    carregarStatus();
    conferir(true);
  }, [carregarStatus, conferir]);

  const sincronizar = async () => {
    setSincronizando(true);
    setErro(null);
    try {
      await api.post('/api/sgp/sincronizar', {}, 120000);
      await Promise.all([carregarStatus(), conferir(true)]);
      recarregarPlanilha?.();
    } catch (e) {
      setErro(`A sincronização falhou: ${e.message}`);
    } finally {
      setSincronizando(false);
    }
  };

  return (
    <div className="page">
      <div className="page-title">Integração SGP</div>

      <PainelSincronizacao
        status={status}
        resumo={resumo}
        sincronizando={sincronizando}
        onSincronizar={sincronizar}
        onSimular={() => conferir(false)}
      />

      {erro && <div className="sgp-erro">{erro}</div>}

      {carregando ? (
        <Spinner />
      ) : (
        <>
          <ListaPendentes itens={resumo?.pendentesDeBaixa || []} />
          <ListaDivergencias itens={resumo?.divergencias || []} />
          <ListaSemMatch itens={resumo?.semMatch || []} />
        </>
      )}

      <BaixasManuais planilha={planilha} onConfirmado={recarregarPlanilha} />
    </div>
  );
}

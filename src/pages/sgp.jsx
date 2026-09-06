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
import { ListaPendentes, ListaDivergencias, ListaSemMatch, ListaSuspensos, ListaConflitos, ListaCpfDivergente } from '../components/sgp/ListasConferencia';
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

  // Ao ABRIR a tela: lê o resumo que a última rodada real deixou pronto —
  // instantâneo. Antes daqui a abertura disparava a sincronização inteira (76
  // requisições, ~40s), e sair e voltar refazia tudo.
  //
  // O botão "Conferir sem aplicar" (`recalcular=1`) continua rodando o cálculo
  // de verdade: é onde a espera se justifica, porque o dono pediu.
  const conferir = useCallback(async (recalcular = false) => {
    const silencioso = !recalcular;
    if (!silencioso) setSincronizando(true);
    setErro(null);
    try {
      const caminho = recalcular ? '/api/sgp/divergencias?recalcular=1' : '/api/sgp/divergencias';
      setResumo(await api.get(caminho, recalcular ? 120000 : 20000));
    } catch (e) {
      setErro(`Não consegui conferir com o SGP: ${e.message}`);
    } finally {
      setSincronizando(false);
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    carregarStatus();
    conferir(false);
  }, [carregarStatus, conferir]);

  const sincronizar = async () => {
    setSincronizando(true);
    setErro(null);
    try {
      await api.post('/api/sgp/sincronizar', {}, 120000);
      // A sincronização real já regravou o resumo — basta reler.
      await Promise.all([carregarStatus(), conferir(false)]);
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
        onSimular={() => conferir(true)}
      />

      {erro && <div className="sgp-erro">{erro}</div>}

      {carregando ? (
        <Spinner />
      ) : (
        <>
          <ListaConflitos itens={resumo?.conflitosIdentidade || []} />
          <ListaPendentes itens={resumo?.pendentesDeBaixa || []} />
          <ListaSuspensos itens={resumo?.suspensos || []} onAplicado={() => conferir(false)} />
          <ListaDivergencias itens={resumo?.divergencias || []} />
          <ListaSemMatch itens={resumo?.semMatch || []} />
          <ListaCpfDivergente itens={resumo?.cpfDivergente || []} />
        </>
      )}

      <BaixasManuais planilha={planilha} onConfirmado={recarregarPlanilha} />
    </div>
  );
}

// src/pages/onus.jsx
// A fibra: as ONUs da OLT, o sinal de cada uma, e a operacao do dia a dia.
//
// Esta tela existe porque o SGP faz isso mal: desautorizar por la leva de 25
// segundos a minutos, depois a tela dele fica dando 404 por uns 5 minutos. Aqui
// o dono dispara e vai embora — o resultado aparece no bloco de operacoes.
//
// O que ela NAO faz: autorizar ONU nova. O SGP bloqueia a rota que lista os
// tipos de ONU (403), e sem esse id a autorizacao nao monta.
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { api } from '../api/client';
import { Spinner } from '../components/Spinner';
import { TabelaOnus } from '../components/fttx/TabelaOnus';
import { PainelOnu } from '../components/fttx/PainelOnu';
import { NaoAutorizadas } from '../components/fttx/NaoAutorizadas';
import { Jobs } from '../components/fttx/Jobs';

// Enquanto houver job em andamento, o painel pergunta como foi. Nao e polling
// do SGP: e do nosso backend, que ja tem a resposta guardada.
const PASSO_JOB_MS = 5000;
const EM_ANDAMENTO = ['aceito', 'enviado'];

// Quantas vezes reler esperando os nomes dos clientes chegarem. Tem teto porque
// "carregando" nao significa so "ainda vem": se o SGP estiver recusando, o
// indice nunca monta e uma releitura a cada 8s viraria marretada eterna nele —
// com o agravante de ocupar o mesmo portao que a cobranca usa.
const MAX_ESPERAS_INDICE = 4;

export function PageOnus() {
  const [dados, setDados] = useState(null);
  const [status, setStatus] = useState(null);
  const [escolhida, setEscolhida] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [atualizando, setAtualizando] = useState(false);
  const [erro, setErro] = useState(null);
  const esperasIndice = useRef(0);

  const carregar = useCallback(async (fresco = false) => {
    if (fresco) setAtualizando(true);
    setErro(null);
    try {
      // 30s: a primeira carga do dia inclui montar o indice de nomes no backend.
      const r = await api.get(`/api/fttx/onus${fresco ? '?fresco=1' : ''}`, 30000);
      setDados(r);
      // A ONU escolhida e reapontada pro objeto novo, senao o painel lateral
      // mostraria sinal velho depois de um refresh.
      setEscolhida(atual => (atual ? r.onus.find(o => o.id === atual.id) || null : null));
    } catch (e) {
      setErro(e.message);
    } finally {
      setAtualizando(false);
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    api.get('/api/fttx/status').then(setStatus).catch(() => {});
    carregar(false);
  }, [carregar]);

  // Os nomes dos clientes chegam ~30s depois no primeiro acesso (o backend monta
  // o indice em segundo plano). Uma releitura resolve, e so uma: sem isso a tela
  // ficaria com "…" na coluna de cliente ate alguem clicar em atualizar.
  useEffect(() => {
    if (!dados?.resumo?.carregando) { esperasIndice.current = 0; return undefined; }
    if (esperasIndice.current >= MAX_ESPERAS_INDICE) return undefined;

    const t = setTimeout(() => {
      esperasIndice.current += 1;
      carregar(true);
    }, 8000);
    return () => clearTimeout(t);
  }, [dados, carregar]);

  // Acompanha os jobs em andamento ate terminarem.
  useEffect(() => {
    if (!jobs.some(j => EM_ANDAMENTO.includes(j.estado))) return undefined;

    const t = setInterval(async () => {
      const pendentes = jobs.filter(j => EM_ANDAMENTO.includes(j.estado));
      const novos = await Promise.all(pendentes.map(j =>
        api.get(`/api/fttx/job/${j.id}`).then(r => r.job).catch(() => null)
      ));
      setJobs(atual => atual.map(j => novos.find(n => n && n.id === j.id) || j));

      // Job que terminou desautorizando muda a lista: vale reler.
      if (novos.some(n => n && n.estado === 'confirmado' && n.comando === 'desautorizar')) {
        carregar(true);
      }
    }, PASSO_JOB_MS);

    return () => clearInterval(t);
  }, [jobs, carregar]);

  const operar = async (comando, onu, confirmacao) => {
    setErro(null);
    try {
      const r = await api.post('/api/fttx/operacao', {
        comando,
        onuId: onu.id,
        phyAddr: onu.phy_addr,
        confirmacao,
        // A chave de idempotencia e o que impede o duplo clique (e o retry do
        // navegador) de virarem dois comandos na OLT.
        chave: `${comando}:${onu.id}:${Date.now()}`,
      }, 30000);
      setJobs(atual => [r.job, ...atual.filter(j => j.id !== r.job.id)].slice(0, 10));
    } catch (e) {
      setErro(e.message);
    }
  };

  const ocupado = jobs.some(j => EM_ANDAMENTO.includes(j.estado));

  return (
    <div className="page page-larga">
      <div className="page-topo">
        <div>
          <div className="page-title">ONUs</div>
          <div className="page-sub">
            {status?.oltId ? `OLT ${status.oltId} · ` : ''}
            fibra dos clientes, direto da OLT
          </div>
        </div>
      </div>

      {erro && <div className="aviso aviso-erro mb-3">{erro}</div>}

      {status && !status.ativo && (
        <div className="aviso aviso-alerta mb-3">
          A integração com o SGP está desligada no servidor — sem ela esta tela não tem dados.
        </div>
      )}

      <NaoAutorizadas />

      <Jobs jobs={jobs} />

      <PainelOnu
        onu={escolhida}
        escritaHabilitada={Boolean(status?.escritaHabilitada)}
        onOperar={operar}
        ocupado={ocupado}
      />

      {carregando ? (
        <Spinner />
      ) : dados?.onus?.length ? (
        <TabelaOnus
          onus={dados.onus}
          resumo={dados.resumo}
          idadeMs={dados.idadeMs}
          escolhida={escolhida}
          onEscolher={setEscolhida}
          onAtualizar={() => carregar(true)}
          atualizando={atualizando}
        />
      ) : (
        <div className="vazio">
          <div className="vazio-emoji">📡</div>
          <div>Nenhuma ONU veio da OLT.</div>
          <div className="vazio-dica">Se o SGP estiver fora do ar, tente de novo em alguns minutos.</div>
        </div>
      )}
    </div>
  );
}

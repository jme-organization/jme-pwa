// src/pages/clientes.jsx — as bases e, dentro delas, o visualizador.
//
// Dois defeitos moravam aqui, os dois pela mesma causa (a base aberta era
// guardada em useState, em paralelo com a URL):
//   1. "← Bases" nao voltava: navigate('/clientes') limpava a querystring, mas
//      o estado seguia apontando pra base e a tela nao mudava;
//   2. base inexistente chamava setBaseAtiva(null) DURANTE o render.
// Agora a base aberta e derivada da URL. A URL e a unica fonte da verdade.
import React, { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useFetch } from '../hooks/useFetch';
import { Card } from '../components/Card';
import { Spinner } from '../components/Spinner';
import { VisualizadorBase } from '../components/VisualizadorBase';
import { ModalCriarBase } from '../components/ModalCriarBase';
import { api } from '../api/client';

export function PageClientes() {
  const [bases, setBases] = useState(null);
  const [erro, setErro] = useState(null);
  const { data: planilha } = useFetch('/api/planilha/resumo', 60000);
  const location = useLocation();
  const navigate = useNavigate();

  const params = new URLSearchParams(location.search);
  const baseIdUrl = params.get('base');
  const clienteIdUrl = params.get('cliente');
  const criando = params.get('acao') === 'nova';

  const carregarBases = useCallback(async () => {
    try {
      setErro(null);
      setBases(await api.get('/api/bases'));
    } catch (e) {
      setErro(e.message || 'Não consegui carregar as bases');
      setBases([]);
    }
  }, []);

  useEffect(() => { carregarBases(); }, [carregarBases]);

  const deletarBase = async (base) => {
    if (!confirm(`Excluir a base "${base.nome}" e todos os seus clientes?`)) return;
    try {
      await api.delete(`/api/bases/${base.id}`);
      carregarBases();
    } catch (e) {
      alert(`Não consegui excluir: ${e.message}`);
    }
  };

  // A base JME tem os numeros na planilha, nao no proprio documento.
  const basesExibir = (bases || []).map(b => {
    if (b.nome !== 'JME' || !planilha) return b;
    const dias = Object.entries(planilha).map(([aba, info]) => ({
      dia: parseInt(aba.replace('Data ', ''), 10),
      total: (info.pagos || 0) + (info.pendentes || 0),
      pagos: info.pagos || 0,
      pendentes: info.pendentes || 0,
      clientes: info.clientes || [],
    }));
    return {
      ...b,
      jmeDias: dias,
      total: dias.reduce((s, d) => s + d.total, 0),
      pagos: dias.reduce((s, d) => s + d.pagos, 0),
    };
  });

  if (baseIdUrl) {
    if (!bases) return <div className="page"><Spinner /></div>;
    const base = basesExibir.find(b => String(b.id) === String(baseIdUrl));
    if (!base) {
      return (
        <div className="page">
          <button type="button" className="btn btn-fantasma" onClick={() => navigate('/clientes')}>← Bases</button>
          <div className="card card-pad mt-3">
            <div className="vazio">
              <span className="vazio-emoji">🔍</span>
              Base não encontrada
              <span className="vazio-dica">Ela pode ter sido excluída em outra aba.</span>
            </div>
          </div>
        </div>
      );
    }
    return (
      <VisualizadorBase
        base={base}
        clienteDestacado={clienteIdUrl}
        onVoltar={() => navigate('/clientes')}
      />
    );
  }

  return (
    <div className="page">
      <div className="page-topo">
        <div>
          <h1 className="page-title">Bases de clientes</h1>
          <div className="page-sub">Cada base tem seus dias de vencimento e seu próprio ciclo de cobrança.</div>
        </div>
        <div className="page-acoes">
          <button type="button" className="btn btn-primario" onClick={() => navigate('/clientes?acao=nova')}>
            + Nova base
          </button>
        </div>
      </div>

      {erro && <div className="aviso aviso-erro mb-3">{erro}</div>}

      {!bases ? (
        <Spinner />
      ) : bases.length === 0 ? (
        <Card>
          <div className="vazio">
            <span className="vazio-emoji">📁</span>
            Nenhuma base cadastrada
            <span className="vazio-dica">Crie a primeira para começar a cobrar.</span>
          </div>
        </Card>
      ) : (
        <div className="grade grade-auto">
          {basesExibir.map(base => {
            const pct = base.total > 0 ? Math.round((base.pagos / base.total) * 100) : 0;
            const principal = base.nome === 'JME';
            return (
              <Card key={base.id} className="base-card">
                <button
                  type="button"
                  className="base-card-alvo"
                  onClick={() => navigate(`/clientes?base=${base.id}`)}
                >
                  <div className="linha">
                    <span className="base-card-nome">{base.nome}</span>
                    {principal && <span className="badge badge-info">Principal</span>}
                  </div>

                  {base.descricao && <div className="dica">{base.descricao}</div>}

                  <div className="linha" style={{ gap: 6, margin: '12px 0' }}>
                    {(base.dias || []).map(d => (
                      <span key={d} className="badge badge-neutro">Dia {d}</span>
                    ))}
                  </div>

                  <div className="barra">
                    {/* largura calculada em tempo de execucao */}
                    <div className="barra-preenche" style={{ width: `${pct}%` }} />
                  </div>

                  <div className="base-item-meta mt-1">
                    <span className="val-ok">{base.pagos ?? 0} pagos</span>
                    <span className="val-alerta">{Math.max(0, (base.total ?? 0) - (base.pagos ?? 0))} pendentes</span>
                    <span>{pct}%</span>
                  </div>
                </button>

                {!principal && (
                  <div className="base-card-rodape">
                    <button
                      type="button"
                      className="btn btn-perigo btn-pequeno"
                      onClick={() => deletarBase(base)}
                    >
                      🗑️ Excluir base
                    </button>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {criando && (
        <ModalCriarBase
          onClose={() => navigate('/clientes')}
          onCriada={() => { carregarBases(); navigate('/clientes'); }}
        />
      )}
    </div>
  );
}

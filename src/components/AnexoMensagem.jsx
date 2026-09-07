// src/components/AnexoMensagem.jsx — a foto e o áudio dentro da conversa.
//
// Antes disto, comprovante e áudio viravam a etiqueta "📷 imagem" e o dono
// tinha que abrir o celular pra ver o que a cliente mandou. O arquivo agora
// existe no servidor, atrás do mesmo JWT do resto do painel.
//
// Por que não é só `<img src={url}>`: tag de mídia não manda header
// Authorization. O arquivo é buscado com o Bearer e vira object URL — que é
// revogado ao desmontar, senão cada conversa aberta deixa o blob preso na
// memória da aba até o refresh.
import React, { useState, useEffect } from 'react';
import { api } from '../api/client';

const ROTULO = {
  imagem: '📷 imagem',
  audio: '🎤 áudio',
  audio_arquivo: '🎵 áudio',
};

export function AnexoMensagem({ numero, mensagem }) {
  const { midia_id: midiaId, tipo } = mensagem;
  const [url, setUrl] = useState(null);
  // 'carregando' | 'pronto' | 'expirado' | 'erro'
  const [estado, setEstado] = useState('carregando');

  useEffect(() => {
    let vivo = true;
    let criada = null;
    setEstado('carregando');
    setUrl(null);

    // 30s: imagem de celular em rede de provedor não cabe no timeout padrão.
    api.blob(`/api/conversas/${numero}/midia/${midiaId}`, 30000)
      .then((blob) => {
        if (!vivo) return;
        criada = URL.createObjectURL(blob);
        setUrl(criada);
        setEstado('pronto');
      })
      .catch((e) => {
        if (!vivo) return;
        setEstado(e?.expirada ? 'expirado' : 'erro');
      });

    return () => {
      vivo = false;
      if (criada) URL.revokeObjectURL(criada);
    };
  }, [numero, midiaId]);

  const rotulo = ROTULO[tipo] || '📎 anexo';

  if (estado === 'carregando') return <span className="balao-anexo">{rotulo} · carregando…</span>;
  if (estado === 'expirado') return <span className="balao-anexo">{rotulo} (expirado)</span>;
  if (estado === 'erro') return <span className="balao-anexo">{rotulo} · não consegui abrir</span>;

  if (tipo === 'imagem') {
    return (
      <a className="balao-midia" href={url} target="_blank" rel="noreferrer" title="Abrir em tamanho cheio">
        <img className="balao-img" src={url} alt="Imagem recebida do cliente" />
      </a>
    );
  }

  return <audio className="balao-audio" controls preload="metadata" src={url} />;
}

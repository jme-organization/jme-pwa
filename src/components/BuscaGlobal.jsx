// src/components/BuscaGlobal.jsx — achar um cliente de qualquer tela.
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiSearch } from 'react-icons/fi';
import { api } from '../api/client';
import { BadgeCliente } from './BadgeCliente';

export const BuscaGlobal = () => {
  const [q, setQ] = useState('');
  const [resultados, setResultados] = useState([]);
  const [buscando, setBuscando] = useState(false);
  const [aberto, setAberto] = useState(false);
  const navigate = useNavigate();
  const ref = useRef(null);

  useEffect(() => {
    const fora = (e) => { if (ref.current && !ref.current.contains(e.target)) setAberto(false); };
    const tecla = (e) => { if (e.key === 'Escape') setAberto(false); };
    document.addEventListener('mousedown', fora);
    document.addEventListener('keydown', tecla);
    return () => {
      document.removeEventListener('mousedown', fora);
      document.removeEventListener('keydown', tecla);
    };
  }, []);

  useEffect(() => {
    if (q.trim().length < 2) {
      setResultados([]);
      setAberto(false);
      return undefined;
    }
    const timer = setTimeout(async () => {
      setBuscando(true);
      try {
        const json = await api.get(`/api/clientes/busca-global?q=${encodeURIComponent(q.trim())}`);
        setResultados(Array.isArray(json) ? json : []);
        setAberto(true);
      } catch (_) {
        setResultados([]);
        setAberto(true);
      } finally {
        setBuscando(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [q]);

  const abrirCliente = (c) => {
    navigate(`/clientes?base=${c.base_id}&cliente=${c.id}`);
    setAberto(false);
    setQ('');
  };

  return (
    <div className="busca-wrap" ref={ref}>
      <div className="busca-campo">
        <span className="busca-icone"><FiSearch /></span>
        <input
          value={q}
          onChange={e => setQ(e.target.value)}
          onFocus={() => { if (resultados.length) setAberto(true); }}
          placeholder="Buscar cliente…"
          aria-label="Buscar cliente"
        />
        {buscando && <span className="dica mt-0">…</span>}
      </div>

      {aberto && (
        <div className="busca-resultados">
          {resultados.length === 0 ? (
            <div className="busca-vazia">Nenhum cliente encontrado</div>
          ) : resultados.map(c => (
            <div
              key={c.id}
              className="busca-item"
              role="button"
              tabIndex={0}
              onClick={() => abrirCliente(c)}
              onKeyDown={e => { if (e.key === 'Enter') abrirCliente(c); }}
            >
              <div className="flex-1">
                <div className="busca-item-nome">{c.nome}</div>
                <div className="busca-item-meta">
                  {(c.telefone || c.cpf || '—')} · {c.base_nome}
                </div>
              </div>
              <BadgeCliente status={c.status} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

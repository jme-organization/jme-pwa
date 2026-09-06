// src/pages/logs.jsx — registros do sistema.
//
// Duas coisas estavam quebradas aqui: o seletor "tipo" nao filtrava nada (o
// valor era guardado e nunca usado), e a data saia como "Invalid Date" porque
// o `dbLog` grava Timestamp do Firestore, que chega como objeto no JSON — agora
// a conversao passa por `paraData` (utils/formatadores.js).
import React, { useState, useCallback } from 'react';
import { usePagination } from '../hooks/usePagination';
import { Pagination } from '../components/Pagination';
import { Card } from '../components/Card';
import { Spinner } from '../components/Spinner';
import { fmtDate } from '../utils/formatadores';
import { api } from '../api/client';

const BADGE_DIRECAO = {
  entrada: 'badge-pendente',
  saida: 'badge-pago',
  decisao: 'badge-info',
};

export function PageLogs() {
    const [tipo, setTipo] = useState('');
    const [numero, setNumero] = useState('');
    const [numeroAplicado, setNumeroAplicado] = useState('');
    const [aberto, setAberto] = useState(null);

    const buscar = useCallback(async (pagina, tamanho) => {
        const offset = (pagina - 1) * tamanho;
        let url = `/api/logs/bot?limit=${tamanho}&offset=${offset}`;
        if (numeroAplicado) url += `&numero=${encodeURIComponent(numeroAplicado)}`;
        const json = await api.get(url);
        return {
            data: json.rows || [],
            total: json.total || 0,
            totalPages: Math.ceil((json.total || 0) / tamanho) || 1,
        };
    }, [numeroAplicado]);

    const { data: logs, loading, currentPage, totalPages, setCurrentPage, refresh } = usePagination(buscar, 50);

    // O tipo filtra a pagina ja carregada: o backend nao aceita esse parametro.
    const visiveis = (logs || []).filter(l => !tipo || l.tipo === tipo || l.direcao === tipo);

    const aplicar = (e) => {
        e.preventDefault();
        setNumeroAplicado(numero.trim());
        setCurrentPage(1);
        refresh();
    };

    return (
        <div className="page">
            <div className="page-topo">
                <div>
                    <h1 className="page-title">Registros</h1>
                    <div className="page-sub">Decisões do sistema, disparos e erros. Uma linha por evento.</div>
                </div>
            </div>

            <form className="linha mb-3" onSubmit={aplicar}>
                <input
                    className="entrada campo-largo"
                    placeholder="Filtrar por número…"
                    value={numero}
                    onChange={e => setNumero(e.target.value)}
                />
                <select
                    className="entrada entrada-auto"
                    value={tipo}
                    onChange={e => setTipo(e.target.value)}
                    aria-label="Filtrar por tipo"
                >
                    <option value="">Todos os tipos</option>
                    <option value="entrada">Entrada</option>
                    <option value="saida">Saída</option>
                    <option value="decisao">Decisão</option>
                    <option value="disparo_manual">Disparo manual</option>
                    <option value="erro">Erro</option>
                </select>
                <button type="submit" className="btn btn-primario">🔍 Filtrar</button>
            </form>

            <Card>
                {loading ? (
                    <Spinner />
                ) : visiveis.length === 0 ? (
                    <div className="vazio">
                        <span className="vazio-emoji">📄</span>
                        Nenhum registro nesta página
                        <span className="vazio-dica">Limpe o filtro de tipo ou avance de página.</span>
                    </div>
                ) : (
                    <>
                        <div className="tabela-scroll">
                            <table className="tabela">
                                <thead>
                                    <tr><th>Quando</th><th>Número</th><th>Direção</th><th>Tipo</th><th>Conteúdo</th></tr>
                                </thead>
                                <tbody>
                                    {visiveis.map(log => {
                                        const conteudo = log.conteudo || '';
                                        const longo = conteudo.length > 70;
                                        const expandido = aberto === log.id;
                                        return (
                                            <tr
                                                key={log.id}
                                                className={longo ? 'linha-clicavel' : ''}
                                                onClick={() => longo && setAberto(expandido ? null : log.id)}
                                            >
                                                <td className="td-muted">{fmtDate(log.criado_em)}</td>
                                                <td className="td-mono">{log.numero || '—'}</td>
                                                <td>
                                                    <span className={`badge ${BADGE_DIRECAO[log.direcao] || 'badge-neutro'}`}>
                                                        {log.direcao || '—'}
                                                    </span>
                                                </td>
                                                <td>{log.tipo || '—'}</td>
                                                <td className={expandido ? 'td-mensagem' : 'td-corta'}>
                                                    {expandido || !longo ? conteudo : `${conteudo.slice(0, 70)}…`}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                        <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
                    </>
                )}
            </Card>
        </div>
    );
}

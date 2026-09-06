// src/components/Pagination.jsx
//
// O estilo saia num <style jsx> — sintaxe do Next, que o Vite nao processa:
// virava um <style jsx="true"> cru no DOM e um aviso de atributo invalido a
// cada render. Agora as classes moram no index.css, com o resto do sistema.
import React from 'react';

export function Pagination({ currentPage, totalPages, onPageChange }) {
    if (totalPages <= 1) return null;

    const maxBotoes = 5;
    let inicio = Math.max(1, currentPage - Math.floor(maxBotoes / 2));
    const fim = Math.min(totalPages, inicio + maxBotoes - 1);
    if (fim - inicio + 1 < maxBotoes) inicio = Math.max(1, fim - maxBotoes + 1);

    const paginas = [];
    for (let i = inicio; i <= fim; i++) paginas.push(i);

    return (
        <nav className="paginacao" aria-label="Paginação">
            <button
                type="button"
                className="pag-btn"
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage === 1}
            >
                ← Anterior
            </button>

            {inicio > 1 && (
                <>
                    <button type="button" className="pag-btn" onClick={() => onPageChange(1)}>1</button>
                    {inicio > 2 && <span className="pag-pontos">…</span>}
                </>
            )}

            {paginas.map(p => (
                <button
                    key={p}
                    type="button"
                    className={`pag-btn ${currentPage === p ? 'pag-ativa' : ''}`}
                    aria-current={currentPage === p ? 'page' : undefined}
                    onClick={() => onPageChange(p)}
                >
                    {p}
                </button>
            ))}

            {fim < totalPages && (
                <>
                    {fim < totalPages - 1 && <span className="pag-pontos">…</span>}
                    <button type="button" className="pag-btn" onClick={() => onPageChange(totalPages)}>
                        {totalPages}
                    </button>
                </>
            )}

            <button
                type="button"
                className="pag-btn"
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
            >
                Próxima →
            </button>
        </nav>
    );
}

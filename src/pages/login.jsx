// src/pages/login.jsx
import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

export function PageLogin() {
    const { entrar } = useAuth();
    const [senha, setSenha] = useState('');
    const [erro, setErro] = useState('');
    const [enviando, setEnviando] = useState(false);

    async function aoEnviar(e) {
        e.preventDefault();
        if (!senha || enviando) return;
        setEnviando(true);
        setErro('');
        try {
            await entrar(senha);
        } catch (err) {
            setErro(err.message || 'Não foi possível entrar');
            setSenha('');
        } finally {
            setEnviando(false);
        }
    }

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 20,
            background: '#0f172a',
        }}>
            <form
                onSubmit={aoEnviar}
                style={{
                    width: '100%',
                    maxWidth: 360,
                    background: '#1e293b',
                    border: '1px solid rgba(148,163,184,0.2)',
                    borderRadius: 12,
                    padding: 28,
                }}
            >
                <div style={{ fontSize: 32, textAlign: 'center', marginBottom: 8 }}>🔒</div>
                <h1 style={{ fontSize: 20, fontWeight: 700, color: '#e2e8f0', textAlign: 'center', marginBottom: 6 }}>
                    Painel JME.NET
                </h1>
                <p style={{ fontSize: 13, color: '#94a3b8', textAlign: 'center', marginBottom: 22 }}>
                    Entre com a senha do administrador
                </p>

                <input
                    type="password"
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                    placeholder="Senha"
                    autoFocus
                    autoComplete="current-password"
                    style={{
                        width: '100%',
                        padding: '12px 14px',
                        borderRadius: 8,
                        border: '1px solid rgba(148,163,184,0.3)',
                        background: '#0f172a',
                        color: '#e2e8f0',
                        fontSize: 15,
                        marginBottom: 14,
                    }}
                />

                {erro && (
                    <div style={{
                        padding: '10px 12px',
                        borderRadius: 8,
                        background: 'rgba(239,68,68,0.12)',
                        border: '1px solid rgba(239,68,68,0.35)',
                        color: '#fca5a5',
                        fontSize: 13,
                        marginBottom: 14,
                    }}>
                        {erro}
                    </div>
                )}

                <button
                    type="submit"
                    disabled={enviando || !senha}
                    style={{
                        width: '100%',
                        padding: '12px 14px',
                        borderRadius: 8,
                        border: 'none',
                        background: enviando || !senha ? 'rgba(59,130,246,0.4)' : '#3b82f6',
                        color: '#fff',
                        fontSize: 15,
                        fontWeight: 600,
                        cursor: enviando || !senha ? 'not-allowed' : 'pointer',
                    }}
                >
                    {enviando ? 'Entrando…' : 'Entrar'}
                </button>

                <p style={{ fontSize: 11, color: '#64748b', textAlign: 'center', marginTop: 16 }}>
                    A sessão dura 7 dias neste navegador.
                </p>
            </form>
        </div>
    );
}

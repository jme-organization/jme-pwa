// src/pages/login.jsx — porta de entrada do painel.
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
        <div className="login-tela">
            <form className="login-caixa" onSubmit={aoEnviar}>
                <div className="login-marca" aria-hidden="true">JM</div>
                <h1 className="login-titulo">Painel JME.NET</h1>
                <p className="login-sub">Entre com a senha do administrador</p>

                <div className="campo">
                    <label className="rotulo" htmlFor="senha">Senha</label>
                    <input
                        id="senha"
                        className="entrada"
                        type="password"
                        value={senha}
                        onChange={(e) => setSenha(e.target.value)}
                        autoFocus
                        autoComplete="current-password"
                    />
                </div>

                {erro && <div className="aviso aviso-erro mb-3">{erro}</div>}

                <button type="submit" className="btn btn-primario btn-bloco" disabled={enviando || !senha}>
                    {enviando ? 'Entrando…' : 'Entrar'}
                </button>

                <p className="login-rodape">A sessão dura 7 dias neste navegador.</p>
            </form>
        </div>
    );
}

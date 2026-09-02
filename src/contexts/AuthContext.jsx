// src/contexts/AuthContext.jsx
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { getToken, setToken, login as loginApi, verificarSessao } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [autenticado, setAutenticado] = useState(!!getToken());
    const [carregando, setCarregando] = useState(true);

    // Ao abrir o painel, o token guardado pode estar vencido (7 dias) ou ter
    // sido invalidado por troca do JWT_SECRET. Perguntar ao backend evita a
    // tela cheia de erro que aparecia quando o app assumia que estava logado.
    useEffect(() => {
        let vivo = true;
        (async () => {
            const ok = await verificarSessao();
            if (!vivo) return;
            setAutenticado(ok);
            setCarregando(false);
        })();
        return () => { vivo = false; };
    }, []);

    // Qualquer 401 no meio do uso derruba pra tela de login (o client.js emite).
    useEffect(() => {
        const aoExpirar = () => setAutenticado(false);
        window.addEventListener('jme:sessao-expirada', aoExpirar);
        return () => window.removeEventListener('jme:sessao-expirada', aoExpirar);
    }, []);

    const entrar = useCallback(async (senha) => {
        await loginApi(senha);
        setAutenticado(true);
    }, []);

    const sair = useCallback(() => {
        setToken(null);
        setAutenticado(false);
    }, []);

    return (
        <AuthContext.Provider value={{ autenticado, carregando, entrar, sair }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth precisa estar dentro de <AuthProvider>');
    return ctx;
}

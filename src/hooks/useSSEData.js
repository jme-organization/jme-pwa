// src/hooks/useSSEData.js

import { useState, useEffect, useCallback, useRef } from 'react';
import { api } from '../api/client';

const API = import.meta.env.VITE_API_URL || "";

// SSE singleton com contagem de referência
let _es = null;
let _refCount = 0;
let _reconectando = false;
let _reconectDelay = 5000;
const _maxDelay = 60000;
const _listeners = new Map();

function getSSE() {
    // Se já existe conexão saudável, apenas incrementa referência
    if (_es && _es.readyState === EventSource.OPEN) {
        _refCount++;
        console.log(`📡 SSE: reutilizando conexão (refs: ${_refCount})`);
        return _es;
    }
    
    // Se existe mas está fechando, limpa
    if (_es) {
        _es.close();
        _es = null;
    }

    console.log(`📡 SSE: criando nova conexão (delay: ${_reconectDelay/1000}s)`);
    _es = new EventSource(API + '/api/status-stream');
    _refCount = 1;

    _es.addEventListener('update', (e) => {
        try {
            const { recurso } = JSON.parse(e.data);
            const cbs = _listeners.get(recurso);
            if (cbs) cbs.forEach(cb => cb());
        } catch(_) {}
    });

    _es.addEventListener('open', () => {
        _reconectDelay = 5000;
        console.log('📡 SSE: conectado (backoff resetado)');
    });

    _es.onerror = () => {
        if (_reconectando) return;
        _reconectando = true;
        
        console.log(`⚠️ SSE: erro, reconectando em ${_reconectDelay/1000}s...`);
        _es?.close();
        _es = null;
        _refCount = 0;
        
        setTimeout(() => {
            _reconectando = false;
            _reconectDelay = Math.min(_reconectDelay * 2, _maxDelay);
            getSSE();
        }, _reconectDelay);
    };

    return _es;
}

function releaseSSE() {
    _refCount--;
    console.log(`📡 SSE: liberando referência (refs restantes: ${_refCount})`);
    
    if (_refCount <= 0 && _es) {
        console.log('📡 SSE: fechando conexão (sem referências)');
        _es.close();
        _es = null;
        _refCount = 0;
    }
}

export function useSSEData(url, recurso) {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const mountedRef = useRef(true);
    const loadRef = useRef(null);

    const load = useCallback(async () => {
        if (!mountedRef.current) return;

        try {
            setLoading(true);
            const json = await api.get(url);
            if (mountedRef.current) {
                setData(json);
                setError(null);
            }
        } catch(e) {
            if (mountedRef.current) setError(e.message);
        } finally {
            if (mountedRef.current) setLoading(false);
        }
    }, [url]);

    loadRef.current = load;

    // Wrapper estável que sempre chama a versão atual de load via ref
    const stableLoad = useCallback(() => loadRef.current?.(), []);

    useEffect(() => {
        mountedRef.current = true;
        load();

        if (recurso) {
            getSSE();
            if (!_listeners.has(recurso)) _listeners.set(recurso, new Set());
            _listeners.get(recurso).add(stableLoad);
        }

        return () => {
            mountedRef.current = false;
            if (recurso) {
                _listeners.get(recurso)?.delete(stableLoad);
                releaseSSE();
            }
        };
    }, [recurso, stableLoad]);

    return { data, loading, error, refetch: load };
}
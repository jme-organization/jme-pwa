// src/contexts/ThemeContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
    const [theme, setTheme] = useState(() => {
        try { return localStorage.getItem('theme') || 'dark'; } catch (_) { return 'dark'; }
    });

    useEffect(() => {
        // O atributo vai no <html>, nao no <body>: os tokens sao declarados em
        // :root, e so assim getComputedStyle(documentElement) — usado pelos
        // graficos, que precisam de valor de cor e nao de classe — enxerga a
        // paleta do tema em vigor.
        document.documentElement.setAttribute('data-theme', theme);
        document.documentElement.style.colorScheme = theme;
        try { localStorage.setItem('theme', theme); } catch (_) { /* modo anonimo */ }
    }, [theme]);

    const toggleTheme = () => setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    return useContext(ThemeContext) || { theme: 'dark', toggleTheme: () => {} };
}

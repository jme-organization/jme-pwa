// src/components/NotificationBell.jsx — alertas do dia, no sino da topbar.
import React, { useState, useRef, useEffect } from 'react';
import { FiBell, FiX } from 'react-icons/fi';
import { useNotifications } from '../contexts/NotificationContext';

export function NotificationBell() {
    const [aberto, setAberto] = useState(false);
    const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
    const ref = useRef(null);

    useEffect(() => {
        if (!aberto) return undefined;
        const clique = (e) => { if (ref.current && !ref.current.contains(e.target)) setAberto(false); };
        const tecla = (e) => { if (e.key === 'Escape') setAberto(false); };
        document.addEventListener('mousedown', clique);
        document.addEventListener('keydown', tecla);
        return () => {
            document.removeEventListener('mousedown', clique);
            document.removeEventListener('keydown', tecla);
        };
    }, [aberto]);

    const emoji = { warning: '⚠️', error: '❌', info: 'ℹ️' };

    return (
        <div className="suspenso-wrap sino-wrap" ref={ref}>
            <button
                type="button"
                className="icone-btn"
                onClick={() => setAberto(a => !a)}
                aria-label={`Notificações${unreadCount ? ` (${unreadCount})` : ''}`}
            >
                <FiBell />
                {unreadCount > 0 && <span className="sino-contagem">{unreadCount}</span>}
            </button>

            {aberto && (
                <div className="suspenso" role="dialog" aria-label="Notificações">
                    <div className="suspenso-titulo">
                        Notificações
                        {notifications.length > 0 && (
                            <button type="button" className="btn btn-fantasma btn-pequeno" onClick={markAllAsRead}>
                                Limpar
                            </button>
                        )}
                    </div>

                    {notifications.length === 0 ? (
                        <div className="vazio vazio-curto">
                            <span className="vazio-emoji">🔕</span>
                            Nada pedindo atenção agora
                        </div>
                    ) : (
                        <div className="notif-lista">
                            {notifications.map(n => (
                                <div key={n.id} className={`notif-item notif-item-${n.type}`}>
                                    <span className="aviso-emoji">{emoji[n.type] || '📌'}</span>
                                    <div className="flex-1">
                                        <div className="notif-titulo">{n.title}</div>
                                        <div className="notif-msg">{n.message}</div>
                                        <div className="notif-hora">{n.time}</div>
                                    </div>
                                    <button
                                        type="button"
                                        className="btn btn-fantasma btn-pequeno"
                                        onClick={() => markAsRead(n.id)}
                                        aria-label="Dispensar"
                                    >
                                        <FiX />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

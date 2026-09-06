// src/contexts/NotificationContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useSSEData } from '../hooks/useSSEData';

const NotificationContext = createContext();

export function NotificationProvider({ children }) {
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    
    // O backend nunca emite um evento "alertas": ele emite 'clientes',
    // 'chamados' e 'cancelamentos'. Assinar só 'alertas', como estava aqui,
    // fazia o contador do sino e do menu carregarem uma vez e congelarem até
    // alguém dar F5 — um pagamento dado no painel não sumia da contagem.
    const { data: alertas } = useSSEData(
        '/api/dashboard/alertas',
        ['clientes', 'chamados', 'cancelamentos', 'conversas'],
    );

    useEffect(() => {
        if (alertas) {
            const novasNotificacoes = [];
            
            // Promessas de hoje
            if (alertas.promessasHoje > 0) {
                novasNotificacoes.push({
                    id: 'promessas-hoje',
                    type: 'warning',
                    title: 'Promessas para hoje',
                    message: `${alertas.promessasHoje} cliente(s) prometeram pagar hoje`,
                    time: new Date().toLocaleTimeString()
                });
            }
            
            // Promessas de amanhã
            if (alertas.promessasAmanha > 0) {
                novasNotificacoes.push({
                    id: 'promessas-amanha',
                    type: 'info',
                    title: 'Promessas para amanhã',
                    message: `${alertas.promessasAmanha} cliente(s) prometeram pagar amanhã`,
                    time: new Date().toLocaleTimeString()
                });
            }
            
            // Inadimplentes
            if (alertas.inadimplentes > 0) {
                novasNotificacoes.push({
                    id: 'inadimplentes',
                    type: 'error',
                    title: 'Clientes inadimplentes',
                    message: `${alertas.inadimplentes} cliente(s) com mais de 5 dias de atraso`,
                    time: new Date().toLocaleTimeString()
                });
            }
            
            // Conversa sem resposta: cliente que escreveu e ficou esperando
            if (alertas.conversasNaoLidas > 0) {
                novasNotificacoes.push({
                    id: 'conversas',
                    type: 'warning',
                    title: 'Mensagens sem resposta',
                    message: `${alertas.conversasNaoLidas} conversa(s) esperando você no WhatsApp`,
                    time: new Date().toLocaleTimeString(),
                });
            }

            // Chamados abertos
            if (alertas.chamadosAbertos > 0) {
                novasNotificacoes.push({
                    id: 'chamados',
                    type: 'info',
                    title: 'Chamados antigos',
                    message: `${alertas.chamadosAbertos} chamado(s) abertos há mais de 24h`,
                    time: new Date().toLocaleTimeString()
                });
            }

            setNotifications(novasNotificacoes);
            setUnreadCount(novasNotificacoes.length);
        }
    }, [alertas]);

    const markAsRead = (id) => {
        setNotifications(prev => prev.filter(n => n.id !== id));
        setUnreadCount(prev => Math.max(0, prev - 1));
    };

    const markAllAsRead = () => {
        setNotifications([]);
        setUnreadCount(0);
    };

    return (
        <NotificationContext.Provider value={{
            notifications,
            unreadCount,
            markAsRead,
            markAllAsRead,
            alertasData: alertas  // dados brutos para o dashboard
        }}>
            {children}
        </NotificationContext.Provider>
    );
}

export function useNotifications() {
    return useContext(NotificationContext);
}
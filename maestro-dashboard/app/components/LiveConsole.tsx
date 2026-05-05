'use client';

import React, { useEffect, useState, useRef } from 'react';

interface Log {
    id: number;
    mission_id: string;
    agent_name: string;
    thought: string;
    timestamp: string;
}

export default function LiveConsole() {
    const [logs, setLogs] = useState<Log[]>([]);
    const [error, setError] = useState(false);
    const [mounted, setMounted] = useState(false);
    const [autoScroll, setAutoScroll] = useState(true);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const fetchLogs = async () => {
            try {
                const res = await fetch('http://localhost:8081/api/logs');
                if (!res.ok) throw new Error('API Offline');
                const data = await res.json();
                setLogs(data.reverse()); // Latest logs at the bottom
                setError(false);
            } catch {
                setError(true);
            }
        };

        const interval = setInterval(fetchLogs, 2000);
        fetchLogs();
        setMounted(true);
        return () => clearInterval(interval);
    }, []);

    const handleScroll = () => {
        if (!scrollRef.current) return;
        const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
        // Si el usuario sube manualmente, desactivamos el autoScroll automático (pero el checkbox manda)
        const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
        if (!isNearBottom && autoScroll) {
            // No cambiamos el estado aquí para no confundir con el checkbox, 
            // pero lo usaremos en el useEffect de scroll
        }
    };

    useEffect(() => {
        if (autoScroll && scrollRef.current) {
            const { scrollHeight, clientHeight, scrollTop } = scrollRef.current;
            // Solo scrolleamos si estamos cerca del final o si acaba de activarse
            scrollRef.current.scrollTo({
                top: scrollHeight,
                behavior: 'smooth'
            });
        }
    }, [logs, autoScroll]);

    return (
        <div className="premium-card" style={{ height: '600px', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <div>
                    <h2 style={{ fontSize: '1.25rem' }}>Trazabilidad del Enjambre (Logs de Pensamiento)</h2>
                    <p style={{ fontSize: '0.7rem', color: 'var(--muted)', marginTop: '0.2rem' }}>Mostrando los últimos 2000 pensamientos del enjambre</p>
                </div>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', color: 'var(--muted)', cursor: 'pointer', background: 'rgba(255,255,255,0.05)', padding: '4px 8px', borderRadius: '4px', border: '1px solid var(--border)' }}>
                        <input 
                            type="checkbox" 
                            checked={autoScroll} 
                            onChange={(e) => setAutoScroll(e.target.checked)} 
                        />
                        Fijar al final (Auto-scroll)
                    </label>
                    <span className={`status-badge ${error ? 'status-error' : 'status-active'}`}>
                        {error ? 'API Offline' : 'Escuchando Agentes'}
                    </span>
                </div>
            </div>
            <div
                ref={scrollRef}
                onScroll={handleScroll}
                style={{
                    flex: 1,
                    overflowY: 'auto',
                    fontFamily: 'monospace',
                    fontSize: '0.8125rem',
                    background: '#050507',
                    padding: '1.25rem',
                    borderRadius: '8px',
                    border: '1px solid #1a1a20',
                    lineHeight: '1.6',
                    scrollBehavior: 'smooth'
                }}
            >
                {logs.map((log) => (
                    <div key={log.id} style={{ marginBottom: '1rem', borderLeft: '2px solid var(--primary)', paddingLeft: '1rem', animation: 'fadeIn 0.3s ease-out' }}>
                        <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '0.35rem', alignItems: 'center' }}>
                            <span style={{ color: 'var(--primary)', fontWeight: 700, fontSize: '0.75rem', letterSpacing: '0.05em' }}>{log.agent_name.toUpperCase()}</span>
                            <span style={{ color: 'var(--muted)', fontSize: '0.65rem', opacity: 0.6 }}>
                                [{mounted ? new Date(log.timestamp).toLocaleTimeString() : '...'}]
                            </span>
                            <span style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.1)' }}>#ID_{log.id}</span>
                        </div>
                        <div style={{ color: '#e4e4e7', fontSize: '0.85rem' }}>{log.thought}</div>
                    </div>
                ))}
                {!error && logs.length === 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--muted)' }}>
                        <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>🧠</div>
                        <p>Esperando pensamientos de los agentes...</p>
                    </div>
                )}
                {error && <div style={{ color: 'var(--danger)', fontSize: '0.75rem', textAlign: 'center', padding: '1rem' }}>Intentando restablecer conexión con el núcleo...</div>}
            </div>
            <style jsx>{`
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateX(-5px); }
                    to { opacity: 1; transform: translateX(0); }
                }
            `}</style>
        </div>
    );
}

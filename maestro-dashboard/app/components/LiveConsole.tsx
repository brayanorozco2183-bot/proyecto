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

    useEffect(() => {
        if (autoScroll && scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [logs, autoScroll]);

    const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
        const target = e.currentTarget;
        const isAtBottom = target.scrollHeight - target.scrollTop <= target.clientHeight + 50;
        setAutoScroll(isAtBottom);
    };

    return (
        <div className="premium-card" style={{ height: '500px', display: 'flex', flexDirection: 'column', position: 'relative' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <h2 style={{ fontSize: '1.25rem' }}>Trazabilidad del Enjambre (Logs de Pensamiento)</h2>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    {!autoScroll && (
                        <button 
                            onClick={() => setAutoScroll(true)}
                            style={{ background: 'var(--primary)', color: '#fff', border: 'none', padding: '2px 8px', borderRadius: '4px', fontSize: '0.7rem', cursor: 'pointer' }}
                        >
                            ⬇️ Reanudar Scroll
                        </button>
                    )}
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
                    padding: '1rem',
                    borderRadius: '8px',
                    border: '1px solid #1a1a20',
                    lineHeight: '1.4'
                }}
            >
                {logs.map((log) => (
                    <div key={log.id} style={{ marginBottom: '0.75rem', borderLeft: '2px solid var(--primary)', paddingLeft: '0.75rem' }}>
                        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.25rem' }}>
                            <span style={{ color: 'var(--primary)', fontWeight: 700 }}>{log.agent_name}</span>
                            <span style={{ color: 'var(--muted)', fontSize: '0.7rem' }}>
                                {mounted ? new Date(log.timestamp).toLocaleTimeString() : '...'}
                            </span>
                        </div>
                        <div style={{ color: '#d1d1d6' }}>{log.thought}</div>
                    </div>
                ))}
                {!error && logs.length === 0 && <div style={{ color: 'var(--muted)' }}>Esperando pensamientos de los agentes...</div>}
                {error && <div style={{ color: 'var(--danger)', fontSize: '0.75rem' }}>Intentando restablecer conexión con el núcleo...</div>}
            </div>
        </div>
    );
}

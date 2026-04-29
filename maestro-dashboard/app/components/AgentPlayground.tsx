'use client';
import { useState, useEffect, useRef } from 'react';

interface Agent {
    id: string;
    role: string;
    displayName: string;
    description: string;
}

interface Log {
    id: number;
    agent_name: string;
    thought: string;
    timestamp: string;
}

export default function AgentPlayground() {
    const [agents, setAgents] = useState<Agent[]>([]);
    const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
    const [input, setInput] = useState<string>('Haz un análisis de cerrajeros en Valencia y dime qué keywords son las más rentables');
    const [logs, setLogs] = useState<Log[]>([]);
    const [result, setResult] = useState<Record<string, unknown> | string | null>(null);
    const [loading, setLoading] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        fetch('http://localhost:8081/api/agents')
            .then(res => res.json())
            .then(data => {
                setAgents(data);
                if (data.length > 0) setSelectedAgent(data[0]);
            });
    }, []);

    const fetchLogs = (agentId: string, missionId?: string) => {
        // Buscar logs filtrando por agente y opcionalmente por misión/sesión
        let url = `http://localhost:8081/api/logs?agent=${agentId}`;
        if (missionId) url += `&mission_id=${missionId}`;

        fetch(url)
            .then(res => res.json())
            .then(setLogs);
    };

    const execute = async () => {
        if (!selectedAgent) return;

        // --- GENERACIÓN DE SESIÓN ÚNICA V2.2 ---
        const sessionId = `pg-v22-${Date.now()}`;
        // Mission ID tracking removed as it is unused in the UI

        setLoading(true);
        setResult(null);
        setLogs([]); // Limpiar logs previos para aislamiento total

        // Iniciar polling INMEDIATO para ver el pensamiento real según sucede
        const pollIntervals = [500, 1500, 3000, 5000, 8000, 12000, 20000];
        pollIntervals.forEach(ms => {
            setTimeout(() => fetchLogs(selectedAgent.id, sessionId), ms);
        });

        try {
            let processedInput: Record<string, unknown>;
            if (input.trim().startsWith('{')) {
                processedInput = JSON.parse(input);
            } else {
                processedInput = { command: input };
            }

            const res = await fetch('http://localhost:8081/api/agent/interact', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    role: selectedAgent.role,
                    input: processedInput,
                    sessionId: sessionId // Notificamos al servidor qué ID de sesión debe usar
                }),
            });
            const data = await res.json();
            setResult(data.result);

            // Un último fetch al terminar para asegurar todos los logs finales
            fetchLogs(selectedAgent.id, sessionId);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : String(err);
            setResult({ error: "Error en la comunicación: " + errorMessage });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [logs, result]);

    return (
        <div className="premium-card" style={{ gridColumn: 'span 2', background: 'linear-gradient(180deg, #111115 0%, #0a0a0c 100%)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
                <div>
                    <h2 style={{ fontSize: '1.5rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        🤖 Agent Playground
                        <span style={{ fontSize: '0.75rem', background: 'rgba(99, 102, 241, 0.2)', color: 'var(--primary)', padding: '2px 8px', borderRadius: '4px' }}>Humano V2</span>
                    </h2>
                    {selectedAgent && (
                        <p style={{ fontSize: '0.85rem', color: 'var(--muted)', marginTop: '4px' }}>
                            <strong>{selectedAgent.displayName}</strong>: {selectedAgent.description}
                        </p>
                    )}
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                    <select
                        value={selectedAgent?.role || ''}
                        onChange={(e) => {
                            const a = agents.find(ag => ag.role === e.target.value);
                            if (a) setSelectedAgent(a);
                        }}
                        style={{
                            background: '#1c1c21',
                            color: 'white',
                            border: '1px solid var(--border)',
                            padding: '0.5rem 1rem',
                            borderRadius: '8px',
                            cursor: 'pointer'
                        }}
                    >
                        {agents.map(a => <option key={a.id} value={a.role}>{a.displayName}</option>)}
                    </select>
                    <button
                        onClick={execute}
                        disabled={loading}
                        className={`status-badge ${loading ? 'status-pending' : 'status-active'}`}
                        style={{
                            cursor: loading ? 'not-allowed' : 'pointer',
                            border: 'none',
                            padding: '0.5rem 1.5rem',
                            fontWeight: '800',
                            transition: 'all 0.3s'
                        }}
                    >
                        {loading ? 'PROCESANDO...' : 'ENVIAR ORDEN'}
                    </button>
                </div>
            </div>

            <div className="playground-grid">
                <div style={{ position: 'relative' }}>
                    <label style={{ fontSize: '0.75rem', color: 'var(--muted)', marginBottom: '0.5rem', display: 'block' }}>
                        TU ORDEN (LENGUAJE NATURAL O JSON)
                    </label>
                    <textarea
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Escribe aquí lo que quieres que haga el agente..."
                        style={{
                            width: '100%',
                            height: '350px',
                            background: '#0a0a0c',
                            color: '#f0f0f2',
                            fontFamily: 'var(--font-sans)',
                            padding: '1.25rem',
                            border: '1px solid var(--border)',
                            borderRadius: '12px',
                            outline: 'none',
                            fontSize: '1rem',
                            lineHeight: '1.5',
                            resize: 'none',
                            boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.5)'
                        }}
                    />
                    <div style={{ position: 'absolute', bottom: '10px', right: '15px', fontSize: '0.65rem', opacity: 0.3 }}>
                        Soporta Smart-Interpret
                    </div>
                </div>

                <div>
                    <label style={{ fontSize: '0.75rem', color: 'var(--muted)', marginBottom: '0.5rem', display: 'block' }}>
                        ESTADO DE PENSAMIENTO Y RESULTADOS
                    </label>
                    <div
                        ref={scrollRef}
                        style={{
                            height: '350px',
                            background: '#000000',
                            padding: '1.25rem',
                            border: '1px solid var(--border)',
                            borderRadius: '12px',
                            overflowY: 'auto',
                            fontSize: '0.85rem',
                            fontFamily: 'var(--font-geist-mono)',
                            boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.5)'
                        }}
                    >
                        {logs.length === 0 && !result && !loading && (
                            <div style={{ color: 'var(--muted)', textAlign: 'center', marginTop: '100px' }}>
                                <p>El agente está en espera...</p>
                                <p style={{ fontSize: '0.7rem' }}>Dale una orden para despertar su inteligencia.</p>
                            </div>
                        )}

                        {logs.map(log => (
                            <div key={log.id} style={{ marginBottom: '0.75rem', borderLeft: '3px solid var(--primary)', paddingLeft: '12px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                                    <span style={{ color: 'var(--primary)', fontWeight: 'bold', fontSize: '0.7rem' }}>[{log.agent_name}]</span>
                                    <span style={{ fontSize: '0.6rem', opacity: 0.3 }}>{new Date(log.timestamp).toLocaleTimeString()}</span>
                                </div>
                                <div style={{ color: '#e2e8f0' }}>{log.thought}</div>
                            </div>
                        ))}

                        {result && (
                            <div style={{
                                marginTop: '20px',
                                borderTop: '2px dashed var(--border)',
                                paddingTop: '15px',
                                background: 'rgba(16, 185, 129, 0.05)',
                                borderRadius: '8px',
                                padding: '15px'
                            }}>
                                <span style={{ color: 'var(--accent)', fontWeight: 'bold', display: 'block', marginBottom: '10px' }}>
                                    ✅ RESULTADO DE LA MISIÓN:
                                </span>
                                <pre style={{ fontSize: '0.75rem', color: '#10b981', whiteSpace: 'pre-wrap', overflowX: 'auto' }}>
                                    {typeof result === 'string' ? result : JSON.stringify(result, null, 2)}
                                </pre>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

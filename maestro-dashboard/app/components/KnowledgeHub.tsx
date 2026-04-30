'use client';
import { useState, useEffect } from 'react';

interface KnowledgeItem {
    id: number;
    agent_id: string;
    category: string;
    content: string;
    created_at: string;
}

interface Agent {
    id: string;
    displayName: string;
}

interface ExemplarStats {
    agent_name: string;
    total: number;
}

export default function KnowledgeHub() {
    const [knowledge, setKnowledge] = useState<KnowledgeItem[]>([]);
    const [agents, setAgents] = useState<Agent[]>([]);
    const [exemplarStats, setExemplarStats] = useState<ExemplarStats[]>([]);
    const [selectedAgent, setSelectedAgent] = useState<string>('global');
    const [newRule, setNewRule] = useState('');
    const [category, setCategory] = useState('general');
    const [loading, setLoading] = useState(false);
    const [view, setView] = useState<'rules' | 'exemplars'>('rules');

    const refreshData = async () => {
        try {
            const [kRes, aRes, eRes] = await Promise.all([
                fetch('http://localhost:8081/api/agent/knowledge'),
                fetch('http://localhost:8081/api/agents'),
                fetch('http://localhost:8081/api/agent/exemplar-stats')
            ]);
            setKnowledge(await kRes.json());
            setAgents(await aRes.json());
            setExemplarStats(await eRes.json());
        } catch (err) {
            console.error('Error refreshing data:', err);
        }
    };

    useEffect(() => {
        refreshData();
        const interval = setInterval(refreshData, 30000);
        return () => clearInterval(interval);
    }, []);

    const addRule = async () => {
        if (!newRule.trim()) return;
        setLoading(true);
        try {
            await fetch('http://localhost:8081/api/agent/teach', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ agent_id: selectedAgent, category, content: newRule })
            });
            setNewRule('');
            refreshData();
        } finally {
            setLoading(false);
        }
    };

    const deleteRule = async (id: number) => {
        if (!confirm('¿Seguro que quieres eliminar esta norma?')) return;
        await fetch(`http://localhost:8081/api/agent/knowledge/${id}`, { method: 'DELETE' });
        refreshData();
    };

    const clearAllKnowledge = async () => {
        if (!confirm('🚨 ¿ESTÁS SEGURO? Esto borrará TODO el conocimiento manual. No afectará a los Exemplars Premium.')) return;
        setLoading(true);
        try {
            await fetch('http://localhost:8081/api/agent/knowledge-all', { method: 'DELETE' });
            refreshData();
        } finally {
            setLoading(false);
        }
    };

    const totalExemplars = exemplarStats.reduce((acc, curr) => acc + curr.total, 0);

    return (
        <div className="premium-card" style={{ background: 'linear-gradient(145deg, #09090b 0%, #111827 100%)', border: '1px solid rgba(56, 189, 248, 0.1)', minHeight: '600px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h2 style={{ fontSize: '1.5rem', margin: 0, display: 'flex', alignItems: 'center', gap: '12px' }}>
                    🧠 Nucleus Knowledge
                    <span style={{ fontSize: '0.7rem', background: 'var(--primary)', color: 'white', padding: '2px 10px', borderRadius: '12px', fontWeight: 'bold', textTransform: 'uppercase' }}>V8.0 AI</span>
                </h2>
                <div style={{ display: 'flex', gap: '0.5rem', background: 'rgba(0,0,0,0.3)', padding: '4px', borderRadius: '8px' }}>
                    <button 
                        onClick={() => setView('rules')}
                        style={{ padding: '6px 16px', borderRadius: '6px', border: 'none', background: view === 'rules' ? 'var(--primary)' : 'transparent', color: 'white', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600, transition: 'all 0.2s' }}
                    >
                        Normas Manuales
                    </button>
                    <button 
                        onClick={() => setView('exemplars')}
                        style={{ padding: '6px 16px', borderRadius: '6px', border: 'none', background: view === 'exemplars' ? 'var(--accent)' : 'transparent', color: view === 'exemplars' ? 'black' : 'white', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600, transition: 'all 0.2s' }}
                    >
                        Exemplars Premium
                    </button>
                </div>
            </div>

            {view === 'rules' ? (
                <div className="knowledge-hub-grid">
                    <div className="knowledge-hub-sidebar">
                        <div style={{ padding: '1.5rem', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                            <h3 style={{ fontSize: '1rem', marginBottom: '1.25rem', color: 'var(--primary)' }}>Inyectar Nueva Norma</h3>
                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ fontSize: '0.7rem', color: 'var(--muted)', display: 'block', marginBottom: '0.4rem', textTransform: 'uppercase' }}>Agente</label>
                                <select value={selectedAgent} onChange={(e) => setSelectedAgent(e.target.value)} style={{ width: '100%', padding: '0.75rem', background: '#09090b', border: '1px solid var(--border)', borderRadius: '8px', color: 'white' }}>
                                    <option value="global">🌍 Global (Todos)</option>
                                    {agents.map(a => <option key={a.id} value={a.id}>🤖 {a.displayName}</option>)}
                                </select>
                            </div>
                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ fontSize: '0.7rem', color: 'var(--muted)', display: 'block', marginBottom: '0.4rem', textTransform: 'uppercase' }}>Categoría</label>
                                <select value={category} onChange={(e) => setCategory(e.target.value)} style={{ width: '100%', padding: '0.75rem', background: '#09090b', border: '1px solid var(--border)', borderRadius: '8px', color: 'white' }}>
                                    <option value="forbidden_terms">🚫 Términos Prohibidos</option>
                                    <option value="brand_voice">🗣️ Tono de Marca</option>
                                    <option value="technical_rules">⚙️ Reglas Técnicas</option>
                                    <option value="general">📝 General</option>
                                </select>
                            </div>
                            <textarea value={newRule} onChange={(e) => setNewRule(e.target.value)} placeholder="Ej: No menciones nunca el precio por teléfono..." style={{ width: '100%', height: '100px', padding: '1rem', background: '#09090b', border: '1px solid var(--border)', borderRadius: '8px', color: 'white', resize: 'none', marginBottom: '1rem' }} />
                            <button onClick={addRule} disabled={loading} style={{ width: '100%', padding: '0.85rem', background: 'var(--primary)', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 700, cursor: 'pointer' }}>
                                {loading ? 'PROCESANDO...' : 'GRABAR EN NÚCLEO'}
                            </button>
                        </div>
                    </div>

                    <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h3 style={{ fontSize: '1rem', margin: 0 }}>Cerebro Actual: {knowledge.length} normas</h3>
                            {knowledge.length > 0 && <button onClick={clearAllKnowledge} style={{ background: 'transparent', color: '#ef4444', border: '1px solid #ef4444', padding: '4px 10px', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 700, cursor: 'pointer' }}>LIMPIAR TODO</button>}
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {knowledge.map(item => (
                                <div key={item.id} style={{ padding: '1.25rem', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', borderLeft: `4px solid ${item.agent_id === 'global' ? 'var(--accent)' : 'var(--primary)'}` }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                        <span style={{ fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--muted)' }}>{item.agent_id} • {item.category}</span>
                                        <button onClick={() => deleteRule(item.id)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '0.75rem' }}>Borrar</button>
                                    </div>
                                    <p style={{ fontSize: '0.9rem', margin: 0, color: '#e4e4e7', lineHeight: '1.5' }}>{item.content}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            ) : (
                <div style={{ animation: 'fadeIn 0.3s ease' }}>
                    <div style={{ background: 'rgba(16, 185, 129, 0.05)', border: '1px solid rgba(16, 185, 129, 0.2)', borderRadius: '12px', padding: '2rem', textAlign: 'center', marginBottom: '2rem' }}>
                        <div style={{ fontSize: '3rem', fontWeight: 900, color: 'var(--accent)' }}>{totalExemplars}</div>
                        <div style={{ fontSize: '0.9rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '2px', marginTop: '0.5rem' }}>Exemplars de Alta Fidelidad Activos</div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1.5rem' }}>
                        {exemplarStats.map((stat, i) => (
                            <div key={i} className="premium-card" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', padding: '1.5rem' }}>
                                <div style={{ fontSize: '0.7rem', color: 'var(--muted)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Agente</div>
                                <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'white', marginBottom: '1rem' }}>{stat.agent_name}</div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <div style={{ flex: 1, height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', overflow: 'hidden' }}>
                                        <div style={{ width: `${Math.min(100, (stat.total / 400) * 100)}%`, height: '100%', background: 'var(--accent)' }}></div>
                                    </div>
                                    <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>{stat.total}</span>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div style={{ marginTop: '2rem', padding: '1.5rem', background: '#09090b', borderRadius: '12px', border: '1px dashed rgba(255,255,255,0.1)' }}>
                        <h4 style={{ fontSize: '0.9rem', color: 'var(--accent)', marginBottom: '0.5rem' }}>🛡️ Protección de Aprendizaje V8.0</h4>
                        <p style={{ fontSize: '0.8rem', color: 'var(--muted)', margin: 0 }}>
                            Los Exemplars Premium son patrones de éxito "hard-coded" que el sistema utiliza como brújula semántica. 
                            A diferencia de las normas manuales, estos ejemplos proporcionan estructura, tono y precisión técnica que el sistema imita de forma autónoma.
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}

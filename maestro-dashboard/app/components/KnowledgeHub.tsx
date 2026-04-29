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

export default function KnowledgeHub() {
    const [knowledge, setKnowledge] = useState<KnowledgeItem[]>([]);
    const [agents, setAgents] = useState<Agent[]>([]);
    const [selectedAgent, setSelectedAgent] = useState<string>('global');
    const [newRule, setNewRule] = useState('');
    const [category, setCategory] = useState('general');
    const [loading, setLoading] = useState(false);

    const refreshData = async () => {
        const [kRes, aRes] = await Promise.all([
            fetch('http://localhost:8081/api/agent/knowledge'),
            fetch('http://localhost:8081/api/agents')
        ]);
        setKnowledge(await kRes.json());
        setAgents(await aRes.json());
    };

    useEffect(() => {
        refreshData();
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
        if (!confirm('🚨 ¿ESTÁS SEGURO? Esto borrará TODO el conocimiento de todos los agentes. Esta acción no se puede deshacer.')) return;
        if (!confirm('Confirmación secundaria: ¿Realmente quieres vaciar el cerebro del sistema?')) return;
        
        setLoading(true);
        try {
            await fetch('http://localhost:8081/api/agent/knowledge-all', { method: 'DELETE' });
            refreshData();
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="premium-card" style={{ background: 'linear-gradient(145deg, #0f172a 0%, #020617 100%)', border: '1px solid rgba(56, 189, 248, 0.1)' }}>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '12px' }}>
                🧠 Knowledge Hub
                <span style={{ fontSize: '0.7rem', background: 'var(--accent)', color: 'black', padding: '2px 8px', borderRadius: '12px', fontWeight: 'bold' }}>SISTEMA AUTÓNOMO</span>
            </h2>

            <div className="knowledge-hub-grid">
                {/* Panel de Creación */}
                <div className="knowledge-hub-sidebar">
                    <h3 style={{ fontSize: '1rem', marginBottom: '1rem', color: 'var(--primary)' }}>Nueva Norma / Guarda-rail</h3>

                    <div style={{ marginBottom: '1rem' }}>
                        <label style={{ fontSize: '0.75rem', color: 'var(--muted)', display: 'block', marginBottom: '0.5rem' }}>AGENTE DESTINO</label>
                        <select
                            value={selectedAgent}
                            onChange={(e) => setSelectedAgent(e.target.value)}
                            style={{ width: '100%', padding: '0.75rem', background: '#1e293b', border: '1px solid var(--border)', borderRadius: '8px', color: 'white' }}
                        >
                            <option value="global">🌍 Global (Todos los Agentes)</option>
                            {agents.map(a => <option key={a.id} value={a.id}>🤖 {a.displayName}</option>)}
                        </select>
                    </div>

                    <div style={{ marginBottom: '1rem' }}>
                        <label style={{ fontSize: '0.75rem', color: 'var(--muted)', display: 'block', marginBottom: '0.5rem' }}>CATEGORÍA</label>
                        <select
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                            style={{ width: '100%', padding: '0.75rem', background: '#1e293b', border: '1px solid var(--border)', borderRadius: '8px', color: 'white' }}
                        >
                            <option value="forbidden_terms">🚫 Términos Prohibidos</option>
                            <option value="brand_voice">🗣️ Tono de Marca</option>
                            <option value="technical_rules">⚙️ Reglas Técnicas SEO</option>
                            <option value="general">📝 General</option>
                        </select>
                    </div>

                    <div style={{ marginBottom: '1.5rem' }}>
                        <label style={{ fontSize: '0.75rem', color: 'var(--muted)', display: 'block', marginBottom: '0.5rem' }}>CONTENIDO DE LA NORMA</label>
                        <textarea
                            value={newRule}
                            onChange={(e) => setNewRule(e.target.value)}
                            placeholder="Ej: No menciones nunca el precio por teléfono..."
                            style={{ width: '100%', height: '120px', padding: '1rem', background: '#020617', border: '1px solid var(--border)', borderRadius: '8px', color: 'white', resize: 'none' }}
                        />
                    </div>

                    <button
                        onClick={addRule}
                        disabled={loading}
                        style={{ width: '100%', padding: '1rem', background: 'var(--primary)', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', transition: 'opacity 0.3s' }}
                    >
                        {loading ? 'GUARDANDO...' : 'GRABAR EN MEMORIA'}
                    </button>
                </div>

                {/* Lista de Normas */}
                <div style={{ maxHeight: '500px', overflowY: 'auto', paddingRight: '1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <h3 style={{ fontSize: '1rem', margin: 0 }}>Cerebro Actual: {knowledge.length} normas activas</h3>
                        {knowledge.length > 0 && (
                            <button
                                onClick={clearAllKnowledge}
                                disabled={loading}
                                style={{ background: '#ef4444', color: 'white', border: 'none', padding: '4px 12px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 'bold', cursor: 'pointer', opacity: loading ? 0.5 : 1 }}
                            >
                                {loading ? 'BORRANDO...' : 'BORRAR TODO'}
                            </button>
                        )}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {knowledge.map(item => (
                            <div key={item.id} style={{ padding: '1rem', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', borderLeft: `4px solid ${item.agent_id === 'global' ? 'var(--accent)' : 'var(--primary)'}`, position: 'relative' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                    <span style={{ fontSize: '0.65rem', fontWeight: 'bold', textTransform: 'uppercase', color: 'var(--muted)' }}>
                                        {item.agent_id === 'global' ? '🌍 Global' : `🤖 ${item.agent_id}`} • {item.category}
                                    </span>
                                    <button
                                        onClick={() => deleteRule(item.id)}
                                        style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '0.8rem' }}
                                    >
                                        Borrar
                                    </button>
                                </div>
                                <p style={{ fontSize: '0.9rem', lineHeight: '1.4', color: '#cbd5e1' }}>{item.content}</p>
                            </div>
                        ))}
                        {knowledge.length === 0 && <p style={{ color: 'var(--muted)', textAlign: 'center', marginTop: '40px' }}>No hay normas configuradas todavía.</p>}
                    </div>
                </div>
            </div>
        </div>
    );
}

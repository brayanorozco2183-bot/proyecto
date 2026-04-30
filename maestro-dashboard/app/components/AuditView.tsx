'use client';

import React, { useEffect, useState, useMemo } from 'react';

interface CompetitorMetric {
    url: string;
    title?: string;
    description?: string;
    wordCount: number;
    internalLinks: number;
    externalLinks: number;
    images?: { src: string; alt: string }[];
    h1s?: string[];
    h2s?: string[];
    h3s?: string[];
}

interface Draft {
    id: number;
    city: string;
    status: string;
    content_draft: string;
    competitor_metrics?: string;
    published_url?: string;
    quality_score?: number;
    entities?: string;
    keywords?: string;
}

export default function AuditView() {
    const [drafts, setDrafts] = useState<Draft[]>([]);
    const [selectedDraft, setSelectedDraft] = useState<Draft | null>(null);
    const [activeTab, setActiveTab] = useState<'content' | 'technical' | 'competitors'>('content');
    const [isRefreshing, setIsRefreshing] = useState(false);

    const fetchDrafts = async () => {
        setIsRefreshing(true);
        try {
            const res = await fetch('http://127.0.0.1:8081/api/missions');
            const data = await res.json();
            // Sort by ID desc just in case
            const sorted = data.sort((a: any, b: any) => b.id - a.id);
            setDrafts(sorted);
            if (selectedDraft) {
                const updated = sorted.find((d: Draft) => d.id === selectedDraft.id);
                if (updated) setSelectedDraft(updated);
            }
        } catch (err) {
            console.error('Error fetching drafts:', err);
        } finally {
            setIsRefreshing(false);
        }
    };

    useEffect(() => {
        fetchDrafts();
        const interval = setInterval(fetchDrafts, 10000);
        return () => clearInterval(interval);
    }, []);

    const getScoreColor = (score: number) => {
        if (score >= 90) return '#22c55e';
        if (score >= 75) return '#eab308';
        return '#ef4444';
    };

    const parseJson = (str?: string) => {
        if (!str) return [];
        try {
            return JSON.parse(str);
        } catch {
            return [];
        }
    };

    // LIVE DETECTION LOGIC
    const liveAudit = useMemo(() => {
        if (!selectedDraft?.content_draft) return null;
        const html = selectedDraft.content_draft.toLowerCase();
        
        return {
            noInstructionalLeak: !html.includes('instrucciones') && !html.includes('prompt') && !html.includes('output format'),
            noForbiddenClaims: !html.includes('iso 9001') && !html.includes('jda cerrajero') && !/1 año de garantía|6 meses de garantía/i.test(html),
            hasCity: html.includes(selectedDraft.city.toLowerCase()),
            hasH1: html.includes('<h1'),
            hasH2: html.includes('<h2'),
            wordCount: selectedDraft.content_draft.split(/\s+/).filter(Boolean).length,
            detectedEntities: [
                ...(html.includes('presupuesto') ? ['Presupuesto'] : []),
                ...(html.includes('urgencia') ? ['Urgencia 24h'] : []),
                ...(html.includes('profesional') ? ['Profesionalidad'] : []),
                ...(html.includes('garantía') ? ['Garantía'] : []),
                ...(html.includes('precio') ? ['Transparencia'] : []),
                ...(html.includes('desplazamiento') ? ['Desplazamiento'] : [])
            ]
        };
    }, [selectedDraft?.content_draft, selectedDraft?.city]);

    return (
        <div className="premium-card" style={{ padding: 0, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(9, 9, 11, 0.8)', backdropFilter: 'blur(16px)' }}>
            <div style={{ display: 'flex', height: '700px' }}>
                {/* Sidebar */}
                <div style={{ width: '280px', borderRight: '1px solid rgba(255,255,255,0.1)', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ padding: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <h2 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <span style={{ color: isRefreshing ? 'var(--primary)' : '#22c55e', transition: 'color 0.3s' }}>●</span> Auditoría
                            </h2>
                            <p style={{ fontSize: '0.75rem', color: 'var(--muted)', marginTop: '0.4rem' }}>V7.2 + Live Detection</p>
                        </div>
                        <button 
                            onClick={fetchDrafts} 
                            style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '1rem', color: 'var(--muted)' }}
                            title="Refrescar lista"
                        >
                            🔄
                        </button>
                    </div>
                    <div style={{ flex: 1, overflowY: 'auto', padding: '1rem' }}>
                        {drafts.map(d => (
                            <div
                                key={d.id}
                                onClick={() => setSelectedDraft(d)}
                                style={{
                                    padding: '0.85rem',
                                    background: selectedDraft?.id === d.id ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
                                    border: `1px solid ${selectedDraft?.id === d.id ? 'var(--primary)' : 'transparent'}`,
                                    borderRadius: '10px',
                                    marginBottom: '0.6rem',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s ease',
                                    position: 'relative'
                                }}
                            >
                                <div style={{ fontWeight: 600, fontSize: '0.9rem', color: selectedDraft?.id === d.id ? 'white' : '#a1a1aa' }}>{d.city}</div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.4rem' }}>
                                    <span style={{ fontSize: '0.7rem', color: d.status === 'PUBLISHED' ? '#22c55e' : 'var(--muted)', textTransform: 'uppercase' }}>{d.status}</span>
                                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: getScoreColor(d.quality_score || 0) }}>
                                        {d.quality_score || 0} pts
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Main Content */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#09090b' }}>
                    {selectedDraft ? (
                        <>
                            {/* Header Stats */}
                            <div style={{ padding: '1.25rem 2rem', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.02)' }}>
                                <div>
                                    <h3 style={{ fontSize: '1.25rem', margin: 0 }}>{selectedDraft.city}</h3>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--muted)', marginTop: '0.2rem' }}>ID Misión: {selectedDraft.id}</div>
                                </div>
                                <div style={{ display: 'flex', gap: '2rem' }}>
                                    <div style={{ textAlign: 'center' }}>
                                        <div style={{ fontSize: '0.7rem', color: 'var(--muted)', textTransform: 'uppercase' }}>Score SEO</div>
                                        <div style={{ fontSize: '1.5rem', fontWeight: 800, color: getScoreColor(selectedDraft.quality_score || 0) }}>
                                            {selectedDraft.quality_score || '--'}
                                        </div>
                                    </div>
                                    <div style={{ textAlign: 'center' }}>
                                        <div style={{ fontSize: '0.7rem', color: 'var(--muted)', textTransform: 'uppercase' }}>Palabras (Live)</div>
                                        <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>
                                            {liveAudit?.wordCount || 0}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Tabs */}
                            <div style={{ display: 'flex', gap: '1rem', padding: '0.5rem 2rem', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                {['content', 'technical', 'competitors'].map((t) => (
                                    <button
                                        key={t}
                                        onClick={() => setActiveTab(t as any)}
                                        style={{
                                            padding: '0.75rem 1rem',
                                            background: 'transparent',
                                            border: 'none',
                                            borderBottom: `2px solid ${activeTab === t ? 'var(--primary)' : 'transparent'}`,
                                            color: activeTab === t ? 'white' : 'var(--muted)',
                                            cursor: 'pointer',
                                            fontSize: '0.85rem',
                                            fontWeight: 600,
                                            transition: 'all 0.2s'
                                        }}
                                    >
                                        {t === 'content' ? '📝 Contenido' : t === 'technical' ? '⚙️ Auditoría Técnica' : '📊 Competencia'}
                                    </button>
                                ))}
                            </div>

                            {/* Tab Body */}
                            <div style={{ flex: 1, overflowY: 'auto', padding: '2rem' }}>
                                {activeTab === 'content' && (
                                    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
                                        <div style={{
                                            padding: '2rem',
                                            background: '#111',
                                            borderRadius: '12px',
                                            border: '1px solid rgba(255,255,255,0.05)',
                                            boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
                                            color: '#e4e4e7',
                                            lineHeight: '1.8',
                                            fontSize: '0.95rem',
                                            fontFamily: 'system-ui, -apple-system, sans-serif'
                                        }}>
                                            <div dangerouslySetInnerHTML={{ __html: selectedDraft.content_draft || '<p style="color:var(--muted)">Esperando contenido del agente...</p>' }} />
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'technical' && (
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                                        <div className="premium-card" style={{ background: 'rgba(255,255,255,0.02)' }}>
                                            <h4 style={{ fontSize: '0.9rem', marginBottom: '1.25rem', color: 'var(--primary)' }}>Detección de ADN (Entidades)</h4>
                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                                                {liveAudit?.detectedEntities.map((e, i) => (
                                                    <span key={i} style={{ padding: '4px 10px', background: 'rgba(99, 102, 241, 0.1)', border: '1px solid rgba(99, 102, 241, 0.3)', borderRadius: '6px', fontSize: '0.75rem', color: 'var(--primary)' }}>
                                                        {e}
                                                    </span>
                                                ))}
                                                {liveAudit?.detectedEntities.length === 0 && <p style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>Analizando semántica...</p>}
                                            </div>
                                        </div>
                                        <div className="premium-card" style={{ background: 'rgba(255,255,255,0.02)' }}>
                                            <h4 style={{ fontSize: '0.9rem', marginBottom: '1.25rem', color: '#22c55e' }}>Guardia Real de Sanitización</h4>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
                                                    <span style={{ color: liveAudit?.noInstructionalLeak ? '#22c55e' : '#ef4444' }}>{liveAudit?.noInstructionalLeak ? '✓' : '✗'}</span> Sin fugas de sistema
                                                </div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
                                                    <span style={{ color: liveAudit?.noForbiddenClaims ? '#22c55e' : '#ef4444' }}>{liveAudit?.noForbiddenClaims ? '✓' : '✗'}</span> Claims legítimos (No-ISO)
                                                </div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
                                                    <span style={{ color: liveAudit?.hasCity ? '#22c55e' : '#ef4444' }}>{liveAudit?.hasCity ? '✓' : '✗'}</span> Presencia de Ciudad: {selectedDraft.city}
                                                </div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
                                                    <span style={{ color: liveAudit?.hasH1 ? '#22c55e' : '#ef4444' }}>{liveAudit?.hasH1 ? '✓' : '✗'}</span> Estructura H1 Correcta
                                                </div>
                                            </div>
                                        </div>
                                        <div className="premium-card" style={{ gridColumn: 'span 2', background: 'rgba(255,255,255,0.02)' }}>
                                            <h4 style={{ fontSize: '0.9rem', marginBottom: '1.25rem' }}>Keywords Estratégicas (DB)</h4>
                                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
                                                {parseJson(selectedDraft.keywords).map((kw: any, i: number) => (
                                                    <div key={i} style={{ padding: '0.75rem', background: '#111', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                                        <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{kw.term || kw}</div>
                                                        <div style={{ fontSize: '0.7rem', color: 'var(--muted)', marginTop: '0.2rem' }}>Prioridad: Alta</div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'competitors' && (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                        {parseJson(selectedDraft.competitor_metrics).map((m: CompetitorMetric, i: number) => (
                                            <div key={i} style={{ padding: '1.5rem', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                                                    <div>
                                                        <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--primary)' }}>#{i + 1} {m.title || 'Competidor'}</div>
                                                        <div style={{ fontSize: '0.75rem', color: 'var(--muted)', marginTop: '0.25rem' }}>{m.url}</div>
                                                    </div>
                                                    <div style={{ display: 'flex', gap: '1rem' }}>
                                                        <div style={{ textAlign: 'center' }}>
                                                            <div style={{ fontSize: '0.6rem', color: 'var(--muted)' }}>WORDS</div>
                                                            <div style={{ fontWeight: 700 }}>{m.wordCount}</div>
                                                        </div>
                                                        <div style={{ textAlign: 'center' }}>
                                                            <div style={{ fontSize: '0.6rem', color: 'var(--muted)' }}>IMG</div>
                                                            <div style={{ fontWeight: 700 }}>{m.images?.length || 0}</div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </>
                    ) : (
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--muted)' }}>
                            <div style={{ fontSize: '4rem', marginBottom: '1rem', opacity: 0.1 }}>🧬</div>
                            <p>Selecciona una misión reciente para auditar su ADN SEO</p>
                            <button onClick={fetchDrafts} style={{ marginTop: '1rem', background: 'var(--primary)', color: 'white', border: 'none', padding: '0.5rem 1rem', borderRadius: '6px', cursor: 'pointer' }}>Actualizar Lista</button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

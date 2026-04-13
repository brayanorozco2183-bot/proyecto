'use client';

import React, { useEffect, useState } from 'react';

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
}

export default function AuditView() {
    const [drafts, setDrafts] = useState<Draft[]>([]);
    const [selectedDraft, setSelectedDraft] = useState<Draft | null>(null);

    const fetchDrafts = async () => {
        try {
            const res = await fetch('http://127.0.0.1:8081/api/missions');
            const data = await res.json();
            setDrafts(data);
        } catch (err) {
            console.error('Error fetching drafts:', err);
        }
    };

    useEffect(() => {
        let mounted = true;
        const load = async () => {
            if (mounted) await fetchDrafts();
        };
        load();
        const interval = setInterval(fetchDrafts, 5000);
        return () => {
            mounted = false;
            clearInterval(interval);
        };
    }, []);

    return (
        <div className="premium-card">
            <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem' }}>Vista de Auditoría (Pre-Publicación)</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1rem', height: '400px' }}>
                <div style={{ overflowY: 'auto', borderRight: '1px solid var(--border)', paddingRight: '0.5rem' }}>
                    {drafts.map(d => (
                        <div
                            key={d.id}
                            onClick={() => setSelectedDraft(d)}
                            style={{
                                padding: '0.75rem',
                                background: selectedDraft?.id === d.id ? 'var(--primary)' : '#18181b',
                                borderRadius: '8px',
                                marginBottom: '0.5rem',
                                cursor: 'pointer',
                                fontSize: '0.875rem'
                            }}
                        >
                            <div style={{ fontWeight: 600 }}>{d.city}</div>
                            <div style={{ fontSize: '0.75rem', opacity: 0.7 }}>Estado: {d.status}</div>
                        </div>
                    ))}
                    {drafts.length === 0 && <p style={{ fontSize: '0.875rem', color: 'var(--muted)' }}>No hay borradores generados.</p>}
                </div>
                <div style={{ overflowY: 'auto', padding: '1rem', background: '#050507', borderRadius: '8px' }}>
                    {selectedDraft ? (
                        <div>
                            <h3 style={{ fontSize: '1rem', marginBottom: '1rem', color: 'var(--primary)' }}>Borrador: {selectedDraft.city}</h3>

                            {selectedDraft.published_url && (() => {
                                const url = selectedDraft.published_url;
                                const isHttp = url.startsWith('http://') || url.startsWith('https://');
                                return (
                                    <div style={{ marginBottom: '1.5rem', padding: '1rem', background: 'rgba(56, 189, 248, 0.1)', border: '1px solid var(--accent)', borderRadius: '8px' }}>
                                        <h4 style={{ color: 'var(--accent)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <span>{isHttp ? '🌐' : '📁'}</span> {isHttp ? 'URL Publicada' : 'Carpeta Generada (Local)'}
                                        </h4>
                                        {isHttp ? (
                                            <a href={url} target="_blank" rel="noopener noreferrer" style={{ color: '#7dd3fc', textDecoration: 'underline', wordBreak: 'break-all', fontSize: '0.875rem' }}>
                                                {url}
                                            </a>
                                        ) : (
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                                                <code style={{ fontSize: '0.8rem', color: '#a5f3fc', wordBreak: 'break-all', background: 'rgba(0,0,0,0.3)', padding: '4px 8px', borderRadius: '4px', flex: 1 }}>
                                                    {url}
                                                </code>
                                                <button
                                                    onClick={() => navigator.clipboard.writeText(url)}
                                                    style={{ padding: '4px 10px', background: 'rgba(56,189,248,0.2)', border: '1px solid var(--accent)', borderRadius: '6px', color: 'var(--accent)', cursor: 'pointer', fontSize: '0.75rem', whiteSpace: 'nowrap' }}
                                                >
                                                    📋 Copiar ruta
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                );
                            })()}

                            {selectedDraft.competitor_metrics && selectedDraft.competitor_metrics.length > 5 && selectedDraft.competitor_metrics !== "[]" && (
                                <div style={{ marginBottom: '1.5rem', background: '#111113', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border)' }}>
                                    <h4 style={{ color: 'var(--primary)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <span>📊</span> Análisis Competitivo (X-Ray)
                                    </h4>
                                    {(() => {
                                        try {
                                            const metrics: CompetitorMetric[] = JSON.parse(selectedDraft.competitor_metrics);
                                            return metrics.map((m: CompetitorMetric, i: number) => (
                                                <div key={i} style={{ marginBottom: i === metrics.length - 1 ? '0' : '1rem', paddingBottom: i === metrics.length - 1 ? '0' : '1rem', borderBottom: i === metrics.length - 1 ? 'none' : '1px solid #222' }}>
                                                    <div style={{ fontWeight: 'bold' }}>#{i + 1} {m.title || m.url}</div>
                                                    <div style={{ fontSize: '0.75rem', opacity: 0.8, color: '#a1a1aa', marginTop: '0.25rem' }}>🔗 {m.url}</div>
                                                    <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem', fontSize: '0.8rem', color: '#e4e4e7' }}>
                                                        <span style={{ background: '#27272a', padding: '2px 6px', borderRadius: '4px' }}>📝 WordCount: <strong>{m.wordCount}</strong></span>
                                                        <span style={{ background: '#27272a', padding: '2px 6px', borderRadius: '4px' }}>⛓ In/Out: <strong>{m.internalLinks} / {m.externalLinks}</strong></span>
                                                        <span style={{ background: '#27272a', padding: '2px 6px', borderRadius: '4px' }}>🖼 Imágenes: <strong>{m.images?.length || 0}</strong></span>
                                                    </div>
                                                    {m.h1s && m.h1s.length > 0 && <div style={{ fontSize: '0.8rem', marginTop: '0.5rem', color: '#d1d1d6' }}><span style={{ color: 'var(--primary)' }}>H1:</span> {m.h1s.join(' | ')}</div>}
                                                    {m.h2s && m.h2s.length > 0 && <div style={{ fontSize: '0.8rem', marginTop: '0.2rem', color: '#d1d1d6' }}><span style={{ color: 'var(--primary)' }}>H2s:</span> {m.h2s.slice(0, 3).join(' | ')}</div>}
                                                </div>
                                            ));
                                        } catch {
                                            return <div style={{ color: 'red', fontSize: '0.8rem' }}>No se pudieron decodificar las métricas.</div>;
                                        }
                                    })()}
                                </div>
                            )}

                            <h4 style={{ color: 'var(--foreground)', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Contenido Generado</h4>
                            <div style={{
                                fontSize: '0.8125rem',
                                color: '#d1d1d6',
                                whiteSpace: 'pre-wrap',
                                fontFamily: 'serif',
                                lineHeight: '1.6',
                                background: '#111',
                                padding: '1rem',
                                borderRadius: '8px',
                                border: '1px dashed #333'
                            }}>
                                {selectedDraft.content_draft || 'Contenido en proceso de generación...'}
                            </div>
                        </div>
                    ) : (
                        <div style={{ textAlign: 'center', color: 'var(--muted)', marginTop: '5rem' }}>
                            Selecciona un borrador para auditar
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

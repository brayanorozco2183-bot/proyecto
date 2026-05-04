'use client';

import React, { useState, useEffect } from 'react';

interface Mission {
    id: number;
    mission_id: string;
    city: string;
    niche?: string;
    status: string;
    progress?: number;
    current_phase?: string;
}

const PHASES = [
    { id: 'research', label: 'Investigación SERP', icon: '🔍' },
    { id: 'geo', label: 'Geo-Inteligencia', icon: '📍' },
    { id: 'audit', label: 'Auditoría Competencia', icon: '📊' },
    { id: 'planning', label: 'Arquitectura SEO', icon: '📐' },
    { id: 'writing', label: 'Redacción Editorial', icon: '✍️' },
    { id: 'correction', label: 'Corrección Lingüística', icon: '✨' },
    { id: 'integrity', label: 'Integridad Técnica', icon: '🛡️' },
    { id: 'enrichment', label: 'Enriquecimiento LSI', icon: '💎' },
    { id: 'assembly', label: 'Ensamblaje HTML', icon: '🏗️' },
    { id: 'qa', label: 'Control de Calidad', icon: '✅' },
    { id: 'delivery', label: 'Despliegue Final', icon: '🚀' },
    { id: 'audit_post', label: 'Auditoría Post-Deploy', icon: '🔍' }
];

export default function MissionPhaseMonitor() {
    const [missions, setMissions] = useState<Mission[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchMissions = async () => {
        try {
            const res = await fetch('http://localhost:8081/api/missions');
            const data = await res.json();
            setMissions(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error("Failed to fetch missions", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMissions();
        const interval = setInterval(fetchMissions, 3000);
        return () => clearInterval(interval);
    }, []);

    const getPhaseIndex = (status: string) => {
        const s = status.toLowerCase();
        if (s.includes('research')) return 0;
        if (s.includes('geo')) return 1;
        if (s.includes('audit')) return 2;
        if (s.includes('planning')) return 3;
        if (s.includes('writing')) return 4;
        if (s.includes('correction')) return 5;
        if (s.includes('integrity')) return 6;
        if (s.includes('enrichment')) return 7;
        if (s.includes('assembly')) return 8;
        if (s.includes('qa') || s.includes('quality')) return 9;
        if (s.includes('delivery')) return 10;
        if (s.includes('published') || s.includes('completed') || s.includes('static_ready')) return 12;
        return -1;
    };

    if (loading && missions.length === 0) return <div className="premium-card">Cargando monitor de fases...</div>;

    const activeMission = missions.find(m => m.status !== 'COMPLETED' && m.status !== 'FAILED' && m.status !== 'PUBLISHED') || missions[0];

    if (!activeMission) return null;

    const currentIdx = getPhaseIndex(activeMission.status);

    return (
        <div className="premium-card" style={{ marginTop: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h2 style={{ fontSize: '1.25rem' }}>Monitoreo Maestro: {activeMission.niche ? `${activeMission.niche} en ${activeMission.city}` : activeMission.city}</h2>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                   <span className="status-badge status-active" style={{ fontSize: '0.75rem' }}>{activeMission.status}</span>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '12px' }}>
                {PHASES.map((phase, idx) => {
                    const isCompleted = idx < currentIdx;
                    const isActive = idx === currentIdx;
                    
                    return (
                        <div 
                            key={phase.id}
                            style={{
                                padding: '16px',
                                background: isActive ? 'rgba(139, 92, 246, 0.08)' : isCompleted ? 'rgba(16, 185, 129, 0.03)' : 'rgba(255,255,255,0.01)',
                                border: `1px solid ${isActive ? 'var(--primary)' : isCompleted ? 'rgba(16, 185, 129, 0.3)' : 'var(--border)'}`,
                                borderRadius: '12px',
                                opacity: isCompleted || isActive ? 1 : 0.3,
                                position: 'relative',
                                overflow: 'hidden',
                                transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                                boxShadow: isActive ? '0 0 20px rgba(139, 92, 246, 0.2)' : 'none'
                            }}
                        >
                            <div style={{ 
                                fontSize: '1.5rem', 
                                marginBottom: '8px', 
                                filter: isActive ? 'drop-shadow(0 0 8px var(--primary))' : 'none' 
                            }}>{phase.icon}</div>
                            
                            <div style={{ 
                                fontSize: '0.6rem', 
                                fontWeight: 800, 
                                color: isActive ? 'var(--primary)' : 'var(--muted)', 
                                textTransform: 'uppercase',
                                letterSpacing: '0.05em'
                            }}>Módulo {String(idx + 1).padStart(2, '0')}</div>
                            
                            <div style={{ 
                                fontSize: '0.8rem', 
                                fontWeight: 700,
                                color: isActive ? '#fff' : isCompleted ? 'var(--accent)' : 'inherit'
                            }}>{phase.label}</div>
                            
                            {isActive && (
                                <div style={{
                                    position: 'absolute',
                                    bottom: 0,
                                    left: 0,
                                    height: '3px',
                                    background: 'linear-gradient(90deg, transparent, var(--primary), transparent)',
                                    width: '100%',
                                    animation: 'progress-shimmer 2s infinite linear'
                                }} />
                            )}
                            
                            {isCompleted && (
                                <div style={{ 
                                    position: 'absolute', 
                                    top: '8px', 
                                    right: '8px', 
                                    fontSize: '0.75rem',
                                    background: 'var(--accent)',
                                    color: 'white',
                                    borderRadius: '50%',
                                    width: '16px',
                                    height: '16px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    boxShadow: '0 0 10px var(--accent-glow)'
                                }}>✓</div>
                            )}
                        </div>
                    );
                })}
            </div>
            
            <div style={{ marginTop: '1.5rem', padding: '1rem', background: '#09090b', borderRadius: '8px', borderLeft: '4px solid var(--primary)' }}>
                <p style={{ fontSize: '0.875rem', fontFamily: 'monospace', color: 'var(--accent)' }}>
                    {'>'} [SENTINEL]: {activeMission.status}... Procesando integridad de página en {activeMission.city}.
                </p>
            </div>
        </div>
    );
}

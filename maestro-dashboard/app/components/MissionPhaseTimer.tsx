'use client';

import React, { useState, useEffect } from 'react';

interface Mission {
    id: number;
    mission_id: string;
    city: string;
    status: string;
    last_pulse_at?: string;
}

const PHASES_ESTIMATES = [
    { id: 'research', label: 'Investigación SERP', estimate: 45, icon: '🔍' },
    { id: 'geo', label: 'Geo-Inteligencia', estimate: 30, icon: '📍' },
    { id: 'audit', label: 'Auditoría Competencia', estimate: 60, icon: '📊' },
    { id: 'planning', label: 'Arquitectura SEO', estimate: 40, icon: '📐' },
    { id: 'writing', label: 'Redacción Editorial', estimate: 120, icon: '✍️' },
    { id: 'correction', label: 'Corrección Lingüística', estimate: 60, icon: '✨' },
    { id: 'integrity', label: 'Integridad Técnica', estimate: 30, icon: '🛡️' },
    { id: 'enrichment', label: 'Enriquecimiento LSI', estimate: 60, icon: '💎' },
    { id: 'assembly', label: 'Ensamblaje HTML', estimate: 45, icon: '🏗️' },
    { id: 'qa', label: 'Control de Calidad', estimate: 30, icon: '✅' },
    { id: 'delivery', label: 'Despliegue Final', estimate: 45, icon: '🚀' },
    { id: 'audit_post', label: 'Auditoría Post-Deploy', estimate: 30, icon: '🔍' }
];

export default function MissionPhaseTimer() {
    const [missions, setMissions] = useState<Mission[]>([]);
    const [elapsedTime, setElapsedTime] = useState(0);
    const [currentPhaseId, setCurrentPhaseId] = useState<string | null>(null);
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

    const getPhaseId = (status: string) => {
        const s = status.toLowerCase();
        if (s.includes('research')) return 'research';
        if (s.includes('geo')) return 'geo';
        if (s.includes('audit')) return 'audit';
        if (s.includes('planning')) return 'planning';
        if (s.includes('writing')) return 'writing';
        if (s.includes('correction')) return 'correction';
        if (s.includes('integrity')) return 'integrity';
        if (s.includes('enrichment')) return 'enrichment';
        if (s.includes('assembly')) return 'assembly';
        if (s.includes('qa') || s.includes('quality')) return 'qa';
        if (s.includes('delivery')) return 'delivery';
        if (s.includes('published') || s.includes('completed')) return 'completed';
        return null;
    };

    const activeMission = missions.find(m => m.status !== 'COMPLETED' && m.status !== 'FAILED' && m.status !== 'PUBLISHED') || missions[0];

    useEffect(() => {
        if (!activeMission) return;
        const phaseId = getPhaseId(activeMission.status);
        
        if (phaseId !== currentPhaseId) {
            setCurrentPhaseId(phaseId);
            setElapsedTime(0);
        }
    }, [activeMission?.status]);

    useEffect(() => {
        const timer = setInterval(() => {
            if (currentPhaseId && currentPhaseId !== 'completed') {
                setElapsedTime(prev => prev + 1);
            }
        }, 1000);
        return () => clearInterval(timer);
    }, [currentPhaseId]);

    if (loading || !activeMission) return null;

    const currentIdx = PHASES_ESTIMATES.findIndex(p => p.id === currentPhaseId);
    
    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s.toString().padStart(2, '0')}`;
    };

    const totalEstimatedRemaining = PHASES_ESTIMATES
        .slice(currentIdx === -1 ? 0 : currentIdx)
        .reduce((acc, p) => acc + p.estimate, 0) - (currentIdx === -1 ? 0 : elapsedTime);

    return (
        <div className="premium-card" style={{ borderTop: '4px solid var(--primary)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1.5rem' }}>
                <div>
                    <h2 style={{ fontSize: '1.1rem', color: 'var(--primary)', marginBottom: '0.25rem' }}>Métrica Temporal de Misión</h2>
                    <p style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>Cálculo heurístico basado en carga de red</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '1.5rem', fontWeight: 800, fontFamily: 'monospace', color: 'var(--primary)' }}>
                        {formatTime(Math.max(0, totalEstimatedRemaining))}
                    </div>
                    <div style={{ fontSize: '0.6rem', color: 'var(--muted)', letterSpacing: '0.1em' }}>EST. TOTAL REMAINING</div>
                </div>
            </div>

            <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1.25rem', borderRadius: '12px', marginBottom: '1.5rem', border: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 700 }}>Fase Actual: {currentPhaseId === 'completed' ? 'FINALIZADO' : PHASES_ESTIMATES[currentIdx]?.label}</span>
                    <span style={{ fontSize: '1.2rem', fontWeight: 800, fontFamily: 'monospace', color: 'var(--accent)' }}>{formatTime(elapsedTime)}</span>
                </div>
                <div style={{ height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{ 
                        height: '100%', 
                        background: 'var(--accent)', 
                        width: `${Math.min(100, (elapsedTime / (PHASES_ESTIMATES[currentIdx]?.estimate || 1)) * 100)}%`,
                        transition: 'width 1s linear',
                        boxShadow: '0 0 10px var(--accent-glow)'
                    }} />
                </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {PHASES_ESTIMATES.map((phase, idx) => {
                    const isCompleted = idx < currentIdx;
                    const isActive = idx === currentIdx;
                    
                    return (
                        <div key={phase.id} style={{ 
                            display: 'flex', 
                            justifyContent: 'space-between', 
                            alignItems: 'center', 
                            padding: '8px 12px', 
                            background: isActive ? 'rgba(139, 92, 246, 0.05)' : 'transparent',
                            borderRadius: '8px',
                            opacity: isCompleted ? 0.5 : 1,
                            border: isActive ? '1px solid rgba(139, 92, 246, 0.2)' : '1px solid transparent'
                        }}>
                            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                <span style={{ fontSize: '1rem' }}>{phase.icon}</span>
                                <span style={{ fontSize: '0.75rem', fontWeight: isActive ? 700 : 400 }}>{phase.label}</span>
                            </div>
                            <div style={{ fontSize: '0.75rem', fontFamily: 'monospace', color: isActive ? 'var(--primary)' : 'var(--muted)' }}>
                                {isActive ? 'PROCESANDO...' : isCompleted ? 'DONE' : `~${phase.estimate}s`}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

'use client';

import { useState, useEffect } from 'react';

interface Mission {
    id: string;
    niche: string;
    status: string;
    city?: string;
}

interface CityData {
    city: string;
    status: string;
    quality_score: number;
}

export default function MissionPhaseMonitor() {
    const [activeMission, setActiveMission] = useState<Mission | null>(null);
    const [cities, setCities] = useState<CityData[]>([]);
    const [loading, setLoading] = useState(true);
    const [elapsedTime, setElapsedTime] = useState(0);

    const fetchData = async () => {
        try {
            const res = await fetch('http://localhost:8081/api/missions/active');
            const data = await res.json();
            if (data.mission) {
                setActiveMission(data.mission);
                const cityRes = await fetch(`http://localhost:8081/api/missions/${data.mission.id}/cities`);
                const cityData = await cityRes.json();
                setCities(cityData);
                
                // Calculate elapsed time from created_at
                const start = new Date(data.mission.created_at).getTime();
                const now = Date.now();
                setElapsedTime(Math.floor((now - start) / 1000));
            } else {
                setActiveMission(null);
                setCities([]);
                setElapsedTime(0);
            }
        } catch (err) {
            console.error('Error fetching mission status:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 5000);
        
        // Timer interval for smooth ticking
        const timerInterval = setInterval(() => {
            if (activeMission && activeMission.status === 'PROCESSING') {
                setElapsedTime(prev => prev + 1);
            }
        }, 1000);

        return () => {
            clearInterval(interval);
            clearInterval(timerInterval);
        };
    }, [activeMission?.id, activeMission?.status]);

    if (!activeMission && !loading) {
        return (
            <div className="premium-card" style={{ textAlign: 'center', padding: '3rem', background: 'rgba(0,0,0,0.2)' }}>
                <p style={{ color: 'var(--muted)', margin: 0 }}>No hay misiones activas en este momento.</p>
                <p style={{ fontSize: '0.8rem', opacity: 0.5 }}>Lanza una misión desde el panel superior.</p>
            </div>
        );
    }

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const totalCities = cities.length;
    const completedCities = cities.filter(c => c.status === 'PUBLISHED' || c.status === 'STATIC_READY' || c.status === 'FAILED').length;
    
    // Estimate: 2 minutes (120s) per city average
    const estimatedTotalSeconds = totalCities * 135; 
    const remainingSeconds = Math.max(0, estimatedTotalSeconds - elapsedTime);

    const phases = [
        { id: 'PENDING', label: 'Iniciando', icon: '🚀' },
        { id: 'RESEARCHING', label: 'Investigación SERP', icon: '🔍' },
        { id: 'ANALYZED', label: 'Análisis Semántico', icon: '🧠' },
        { id: 'WRITING', label: 'Escritura IA', icon: '✍️' },
        { id: 'AUDITING', label: 'Auditoría EEAT', icon: '🛡️' },
        { id: 'PUBLISHED', label: 'Desplegado', icon: '✅' }
    ];

    const currentPhaseIndex = cities.length > 0 
        ? Math.max(...cities.map(c => {
            if (c.status === 'PUBLISHED' || c.status === 'STATIC_READY') return 5;
            if (c.status === 'AUDITING' || c.status === 'PIPELINE_RUNNING') return 4;
            if (c.status === 'WRITING') return 3;
            if (c.status === 'ANALYZED') return 2;
            if (c.status === 'RESEARCHING') return 1;
            return 0;
        }))
        : 0;

    return (
        <div className="premium-card" style={{ background: 'linear-gradient(180deg, rgba(15, 23, 42, 0.8) 0%, rgba(2, 6, 23, 0.9) 100%)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
                <div>
                    <h3 style={{ fontSize: '1.25rem', margin: 0 }}>Monitor de Fase en Tiempo Real</h3>
                    <p style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>
                        Misión: <span style={{ color: 'var(--primary)', fontWeight: 700 }}>{activeMission?.niche}</span> • Cluster: {totalCities} ciudades
                    </p>
                </div>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '0.65rem', color: 'var(--muted)', textTransform: 'uppercase' }}>Tiempo Transcurrido</div>
                        <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--primary)', fontFamily: 'monospace' }}>{formatTime(elapsedTime)}</div>
                    </div>
                    <div style={{ width: '1px', height: '30px', background: 'rgba(255,255,255,0.1)' }}></div>
                    <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '0.65rem', color: 'var(--muted)', textTransform: 'uppercase' }}>Estimado Restante</div>
                        <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--accent)', fontFamily: 'monospace' }}>
                            {completedCities === totalCities ? '0:00' : formatTime(remainingSeconds)}
                        </div>
                    </div>
                </div>
            </div>

            {/* Pipeline Visual */}
            <div style={{ display: 'flex', justifyContent: 'space-between', position: 'relative', marginBottom: '3rem', padding: '0 1rem' }}>
                <div style={{ position: 'absolute', top: '15px', left: '0', right: '0', height: '2px', background: 'rgba(255,255,255,0.1)', zIndex: 0 }}></div>
                <div style={{ position: 'absolute', top: '15px', left: '0', width: `${(currentPhaseIndex / (phases.length - 1)) * 100}%`, height: '2px', background: 'var(--primary)', zIndex: 0, transition: 'all 1s ease' }}></div>
                
                {phases.map((phase, idx) => (
                    <div key={phase.id} style={{ zIndex: 1, textAlign: 'center', width: '80px' }}>
                        <div style={{ 
                            width: '32px', 
                            height: '32px', 
                            borderRadius: '50%', 
                            background: idx <= currentPhaseIndex ? 'var(--primary)' : '#1e293b',
                            border: `2px solid ${idx <= currentPhaseIndex ? 'var(--primary)' : 'rgba(255,255,255,0.1)'}`,
                            margin: '0 auto 0.5rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '0.9rem',
                            transition: 'all 0.5s ease',
                            boxShadow: idx === currentPhaseIndex ? '0 0 15px var(--primary)' : 'none'
                        }}>
                            {idx < currentPhaseIndex ? '✓' : phase.icon}
                        </div>
                        <span style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', color: idx <= currentPhaseIndex ? 'white' : 'var(--muted)' }}>
                            {phase.label}
                        </span>
                    </div>
                ))}
            </div>

            {/* City Cluster Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '1rem' }}>
                {cities.map((city) => (
                    <div key={city.city} style={{ 
                        padding: '1rem', 
                        background: 'rgba(255,255,255,0.03)', 
                        borderRadius: '8px', 
                        border: '1px solid rgba(255,255,255,0.05)',
                        position: 'relative',
                        overflow: 'hidden'
                    }}>
                        <div style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.5rem' }}>{city.city}</div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--muted)', textTransform: 'uppercase' }}>{city.status}</div>
                        
                        {/* Status Bar */}
                        <div style={{ height: '3px', width: '100%', background: 'rgba(255,255,255,0.1)', marginTop: '0.5rem', borderRadius: '2px' }}>
                            <div style={{ 
                                height: '100%', 
                                width: city.status === 'PUBLISHED' || city.status === 'STATIC_READY' ? '100%' : 
                                       city.status === 'RESEARCHING' ? '30%' : 
                                       city.status === 'ANALYZED' ? '60%' : '10%',
                                background: city.status === 'FAILED' ? '#ef4444' : 'var(--accent)',
                                transition: 'all 1s ease'
                            }}></div>
                        </div>

                        {city.quality_score > 0 && (
                            <div style={{ position: 'absolute', top: '5px', right: '5px', fontSize: '0.6rem', background: 'var(--accent)', color: 'black', padding: '1px 4px', borderRadius: '4px', fontWeight: 800 }}>
                                {city.quality_score}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}

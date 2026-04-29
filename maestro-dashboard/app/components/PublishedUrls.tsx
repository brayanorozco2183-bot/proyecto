'use client';

import React, { useState, useEffect } from 'react';

interface PublishedTarget {
    city: string;
    status: string;
    published_url: string;
    domain_url?: string;
}

export default function PublishedUrls() {
    const [targets, setTargets] = useState<PublishedTarget[]>([]);
    const [loading, setLoading] = useState(true);
    const [collapsed, setCollapsed] = useState(false);
    const [deletingCity, setDeletingCity] = useState<string | null>(null);
    const [selectedCities, setSelectedCities] = useState<string[]>([]);
    const [batchActionLoading, setBatchActionLoading] = useState(false);

    const fetchPublishedUrls = async () => {
        try {
            const res = await fetch('http://localhost:8081/api/seo-master/published');
            if (!res.ok) {
                const text = await res.text();
                throw new Error(`Error HTTP: ${res.status} - ${text.substring(0, 50)}...`);
            }
            const result = await res.json();
            if (result.success) {
                setTargets(result.data);
            }
        } catch (error) {
            console.error('Error fetching published URLs:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteDomain = async (city: string) => {
        const confirmed = window.confirm(`¿Eliminar el dominio de "${city}" de la lista de producción? Esta acción no borra el sitio del servidor.`);
        if (!confirmed) return;

        setDeletingCity(city);
        try {
            const res = await fetch(`http://localhost:8081/api/seo-master/domain/${encodeURIComponent(city)}`, {
                method: 'DELETE',
            });
            const result = await res.json();
            if (result.success) {
                setTargets(prev => prev.filter(t => t.city !== city));
                setSelectedCities(prev => prev.filter(c => c !== city));
            } else {
                alert(`Error: ${result.error}`);
            }
        } catch (err) {
            console.error('Error deleting domain:', err);
            alert('No se pudo eliminar el dominio.');
        } finally {
            setDeletingCity(null);
        }
    };

    const handleBulkDelete = async () => {
        if (selectedCities.length === 0) return;
        const msg = selectedCities.length === targets.length 
            ? "¿Deseas eliminar ABSOLUTAMENTE TODOS los dominios de la lista de producción?" 
            : `¿Eliminar los ${selectedCities.length} dominios seleccionados?`;
        
        if (!window.confirm(msg)) return;
        if (selectedCities.length === targets.length && !window.confirm("⚠️ SEGUNDA CONFIRMACIÓN: Esta acción vaciará toda la tabla de producción. ¿Seguro?")) return;

        setBatchActionLoading(true);
        try {
            const res = await fetch('http://localhost:8081/api/seo-master/bulk-delete-domains', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ cities: selectedCities })
            });
            
            if (!res.ok) {
                const text = await res.text();
                throw new Error(`Servidor respondió con status ${res.status}. ${text.substring(0, 50)}`);
            }
            
            const result = await res.json();
            if (result.success) {
                setTargets(prev => prev.filter(t => !selectedCities.includes(t.city)));
                setSelectedCities([]);
            } else {
                alert(`Error API: ${result.error}`);
            }
        } catch (err) {
            const errorMsg = err instanceof Error ? err.message : String(err);
            console.error('Error in bulk delete:', err);
            alert(`No se pudo completar el borrado masivo: ${errorMsg}`);
        } finally {
            setBatchActionLoading(false);
        }
    };

    const toggleSelectAll = () => {
        if (selectedCities.length === targets.length) {
            setSelectedCities([]);
        } else {
            setSelectedCities(targets.map(t => t.city));
        }
    };

    const toggleCitySelection = (city: string) => {
        setSelectedCities(prev => 
            prev.includes(city) ? prev.filter(c => c !== city) : [...prev, city]
        );
    };

    useEffect(() => {
        fetchPublishedUrls();
        const interval = setInterval(fetchPublishedUrls, 30000);
        return () => clearInterval(interval);
    }, []);

    if (loading) return null;

    if (targets.length === 0) {
        return (
            <div className="premium-card" style={{ marginTop: '2rem', border: '1px solid rgba(255,255,255,0.05)' }}>
                <h3 style={{ fontSize: '1.2rem', marginBottom: '1rem', color: 'var(--muted)' }}>🌐 Dominios en Producción</h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--muted)', textAlign: 'center', padding: '2rem 0' }}>
                    Aún no hay páginas desplegadas en los dominios reales.
                </p>
            </div>
        );
    }

    return (
        <div className="premium-card" style={{ marginTop: '2rem' }}>
            {/* Header with collapse toggle */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <div
                    style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', userSelect: 'none' }}
                    onClick={() => setCollapsed(c => !c)}
                >
                    <h3 style={{ fontSize: '1.25rem', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontSize: '0.9rem', transition: 'transform 0.2s', display: 'inline-block', transform: collapsed ? 'rotate(-90deg)' : 'rotate(0deg)' }}>▼</span>
                        🌐 Dominios en Producción
                    </h3>
                    <span style={{ fontSize: '0.75rem', background: 'rgba(34, 197, 94, 0.1)', color: '#22c55e', padding: '4px 8px', borderRadius: '4px', fontWeight: 600 }}>
                        {targets.length} Activos
                    </span>
                </div>

                {!collapsed && (
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <button 
                            onClick={toggleSelectAll}
                            className="status-badge"
                            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)', cursor: 'pointer' }}
                        >
                            {selectedCities.length === targets.length ? 'Deseleccionar Todo' : 'Seleccionar Todo'}
                        </button>
                        {selectedCities.length > 0 && (
                            <button 
                                onClick={handleBulkDelete}
                                disabled={batchActionLoading}
                                style={{ 
                                    background: '#ef4444', 
                                    color: 'white', 
                                    border: 'none', 
                                    borderRadius: '6px', 
                                    padding: '6px 12px', 
                                    fontSize: '0.75rem', 
                                    fontWeight: 700, 
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '5px'
                                }}
                            >
                                {batchActionLoading ? 'Borrando...' : `🗑 Eliminar Seleccionados (${selectedCities.length})`}
                            </button>
                        )}
                    </div>
                )}
            </div>

            {/* Collapsible list */}
            {!collapsed && (
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                    gap: '1.5rem'
                }}>
                    {targets.map((target, idx) => (
                        <div
                            key={idx}
                            style={{
                                background: selectedCities.includes(target.city) ? 'rgba(59, 130, 246, 0.05)' : 'rgba(255,255,255,0.02)',
                                border: selectedCities.includes(target.city) ? '1px solid var(--accent)' : '1px solid var(--border)',
                                borderRadius: '12px',
                                padding: '1.25rem',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '1rem',
                                transition: 'all 0.2s ease',
                                position: 'relative',
                                overflow: 'hidden',
                                opacity: deletingCity === target.city ? 0.5 : 1
                            }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <input 
                                        type="checkbox"
                                        checked={selectedCities.includes(target.city)}
                                        onChange={() => toggleCitySelection(target.city)}
                                        style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                                    />
                                    <strong style={{ fontSize: '1.1rem', color: '#fff', letterSpacing: '0.01em' }}>
                                        {target.city.charAt(0).toUpperCase() + target.city.slice(1)}
                                    </strong>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#22c55e', display: 'inline-block', boxShadow: '0 0 8px #22c55e' }}></span>
                                        <span style={{ fontSize: '0.65rem', color: '#22c55e', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em' }}>ONLINE</span>
                                    </div>
                                    {/* Delete button (Individual) - Hidden when multiple are selected to prevent confusion, or kept as is */}
                                    {selectedCities.length <= 1 && (
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleDeleteDomain(target.city); }}
                                            disabled={deletingCity === target.city}
                                            style={{
                                                background: 'rgba(239, 68, 68, 0.1)',
                                                border: '1px solid rgba(239, 68, 68, 0.3)',
                                                color: '#ef4444',
                                                cursor: 'pointer',
                                                borderRadius: '6px',
                                                padding: '3px 8px',
                                                fontSize: '0.7rem',
                                                fontWeight: 700
                                            }}
                                        >
                                            {deletingCity === target.city ? '...' : '🗑'}
                                        </button>
                                    )}
                                </div>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                {/* Internet Link */}
                                {target.domain_url && (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                        <span style={{ fontSize: '0.65rem', color: 'var(--muted)', textTransform: 'uppercase', fontWeight: 600 }}>Dominio Real (Internet)</span>
                                        <a
                                            href={target.domain_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            onClick={(e) => e.stopPropagation()}
                                            style={{
                                                fontSize: '0.85rem',
                                                color: '#fff',
                                                textDecoration: 'none',
                                                wordBreak: 'break-all',
                                                background: 'rgba(229, 62, 62, 0.1)',
                                                padding: '0.65rem',
                                                borderRadius: '6px',
                                                border: '1px solid rgba(229, 62, 62, 0.2)',
                                                fontWeight: 600,
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '8px'
                                            }}
                                        >
                                            🚀 {target.domain_url.replace('https://', '')}
                                        </a>
                                    </div>
                                )}

                                {/* Local path */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                    <span style={{ fontSize: '0.65rem', color: 'var(--muted)', textTransform: 'uppercase', fontWeight: 600 }}>Ruta Local (PC)</span>
                                    <a
                                        href={target.published_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        onClick={(e) => e.stopPropagation()}
                                        style={{
                                            fontSize: '0.75rem',
                                            color: 'var(--accent)',
                                            textDecoration: 'none',
                                            wordBreak: 'break-all',
                                            background: 'rgba(0,0,0,0.2)',
                                            padding: '0.5rem',
                                            borderRadius: '6px',
                                            display: 'block',
                                            border: '1px dashed rgba(255,255,255,0.1)',
                                            opacity: 0.8
                                        }}
                                    >
                                        📂 {target.published_url.length > 45 ? '...' + target.published_url.slice(-42) : target.published_url}
                                    </a>
                                </div>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.65rem', marginTop: '0.25rem' }}>
                                <span style={{ color: 'var(--muted)' }}>Status: {target.status}</span>
                                <span style={{ color: 'var(--muted)' }}>Cluster: Cerrajeros</span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

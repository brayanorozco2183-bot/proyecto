'use client';

import React, { useEffect, useState } from 'react';

interface KeywordData {
    city: string;
    keywords: string[];
    intent: string;
}

export default function KeywordExplorer() {
    const [data, setData] = useState<KeywordData[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await fetch('http://127.0.0.1:8081/api/missions');
                const raw = await res.json();

                interface RawMission {
                    city: string;
                    keywords?: string | unknown[];
                }

                // Transformamos los datos de city_data para mostrar keywords con resiliencia total
                const formatted = raw.map((m: RawMission) => {
                    let kws: unknown[] = [];
                    try {
                        if (typeof m.keywords === 'string' && m.keywords.trim().startsWith('[')) {
                            kws = JSON.parse(m.keywords);
                        } else if (Array.isArray(m.keywords)) {
                            kws = m.keywords;
                        } else if (m.keywords && typeof m.keywords === 'object') {
                            kws = [m.keywords]; // Single object case
                        }
                    } catch (e) {
                        console.warn("[KeywordExplorer] Error parsing keywords for", m.city, e);
                        kws = [];
                    }

                    // Normalización agresiva: solo permitimos strings en el renderizado
                    const cleanKws = kws.map(k => {
                        if (!k) return '';
                        if (typeof k === 'string') return k;
                        if (typeof k === 'object' && k !== null) {
                            const kwObj = k as { kw?: string; keyword?: string; name?: string };
                            // Prioridad: .kw (nuestro estándar actual) -> .keyword -> .name -> primer valor string
                            return kwObj.kw || kwObj.keyword || kwObj.name || JSON.stringify(k).substring(0, 30);
                        }
                        return String(k);
                    }).filter(k => typeof k === 'string' && k.length > 0);

                    return {
                        city: m.city || 'Desconocida',
                        keywords: cleanKws,
                        intent: 'Local Transactional'
                    };
                }).filter((m: KeywordData) => m.keywords.length > 0);

                setData(formatted);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    return (
        <div className="premium-card" style={{ marginTop: '2rem' }}>
            <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem' }}>Keyword Intelligence (Capa de Análisis)</h2>
            <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
                    <thead>
                        <tr style={{ borderBottom: '1px solid var(--border)', color: 'var(--muted)' }}>
                            <th style={{ padding: '1rem' }}>Localidad</th>
                            <th style={{ padding: '1rem' }}>Keywords Estratégicas</th>
                            <th style={{ padding: '1rem' }}>Intención de Búsqueda</th>
                            <th style={{ padding: '1rem' }}>Potencial SEO</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.map((item, i) => (
                            <tr key={i} style={{ borderBottom: '1px solid #1a1a20' }}>
                                <td style={{ padding: '1rem', fontWeight: 600 }}>{item.city}</td>
                                <td style={{ padding: '1rem' }}>
                                    {item.keywords.map((kw, j) => (
                                        <span key={j} style={{ background: '#27272a', padding: '2px 8px', borderRadius: '4px', marginRight: '4px', fontSize: '0.75rem' }}>
                                            {kw}
                                        </span>
                                    ))}
                                </td>
                                <td style={{ padding: '1rem' }}>
                                    <span style={{ color: 'var(--accent)' }}>●</span> {item.intent}
                                </td>
                                <td style={{ padding: '1rem' }}>
                                    <div style={{ width: '100%', background: '#3f3f46', height: '6px', borderRadius: '3px' }}>
                                        <div style={{ width: '85%', background: 'var(--primary)', height: '100%', borderRadius: '3px' }}></div>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {data.length === 0 && !loading && (
                    <p style={{ textAlign: 'center', padding: '2rem', color: 'var(--muted)' }}>
                        Lanza una misión para ver el análisis de palabras clave aquí.
                    </p>
                )}
            </div>
        </div>
    );
}

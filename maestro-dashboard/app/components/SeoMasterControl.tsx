'use client';

import React, { useState, useEffect } from 'react';

interface Section {
    id: string;
    title: string;
    content: string;
    type: string;
    structured?: any;
}

export default function SeoMasterControl() {
    const [pages, setPages] = useState<string[]>([]);
    const [selectedPage, setSelectedPage] = useState<string>('');
    const [sections, setSections] = useState<Section[]>([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState('');
    const [errors, setErrors] = useState<string[]>([]);

    useEffect(() => {
        fetchPages();
    }, []);

    const fetchPages = async () => {
        try {
            const res = await fetch('http://localhost:8081/api/seo-master/pages');
            const data = await res.json();
            setPages(data);
        } catch (err) {
            console.error('Error fetching pages:', err);
        }
    };

    const loadPage = async (page: string) => {
        setSelectedPage(page);
        setLoading(true);
        setMessage('');
        setErrors([]);
        try {
            const res = await fetch(`http://localhost:8081/api/seo-master/page-content?page=${encodeURIComponent(page)}`);
            const data = await res.json();
            setSections(data.sections);
        } catch (err) {
            console.error('Error loading page:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleStructuredChange = (id: string, field: string, value: any, index?: number) => {
        setSections(prev => prev.map(s => {
            if (s.id !== id) return s;
            const newStructured = Array.isArray(s.structured) ? [...s.structured] : { ...s.structured };
            if (index !== undefined && Array.isArray(newStructured)) {
                newStructured[index] = { ...newStructured[index], [field]: value };
            } else {
                newStructured[field] = value;
            }
            return { ...s, structured: newStructured };
        }));
    };

    const handleSubItemChange = (id: string, field: string, index: number, value: any) => {
        setSections(prev => prev.map(s => {
            if (s.id !== id) return s;
            const newStructured = { ...s.structured };
            if (Array.isArray(newStructured[field])) {
                newStructured[field] = [...newStructured[field]];
                newStructured[field][index] = value;
            }
            return { ...s, structured: newStructured };
        }));
    };

    const handleAddItem = (id: string, newItem: any) => {
        setSections(prev => prev.map(s => {
            if (s.id !== id) return s;
            return { ...s, structured: [...(s.structured || []), newItem] };
        }));
    };

    const handleAddSubItem = (id: string, field: string, defaultValue: any) => {
        setSections(prev => prev.map(s => {
            if (s.id !== id) return s;
            const newStructured = { ...s.structured };
            newStructured[field] = [...(newStructured[field] || []), defaultValue];
            return { ...s, structured: newStructured };
        }));
    };

    const handleRemoveItem = (id: string, index: number) => {
        setSections(prev => prev.map(s => {
            if (s.id !== id) return s;
            const newStructured = [...(s.structured || [])];
            newStructured.splice(index, 1);
            return { ...s, structured: newStructured };
        }));
    };

    const handleRemoveSubItem = (id: string, field: string, index: number) => {
        setSections(prev => prev.map(s => {
            if (s.id !== id) return s;
            const newStructured = { ...s.structured };
            if (Array.isArray(newStructured[field])) {
                newStructured[field] = [...newStructured[field]];
                newStructured[field].splice(index, 1);
            }
            return { ...s, structured: newStructured };
        }));
    };

    const saveChanges = async () => {
        setSaving(true);
        setMessage('');
        setErrors([]);
        const updates: Record<string, any> = {};
        sections.forEach(s => {
            updates[s.id] = s.structured || s.content;
        });

        try {
            const res = await fetch('http://localhost:8081/api/seo-master/save-page', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ page: selectedPage, updates })
            });
            const data = await res.json();
            if (data.success) {
                setMessage('✅ Página guardada y validada correctamente.');
                loadPage(selectedPage);
            } else if (data.errors) {
                setErrors(data.errors);
            } else {
                setMessage('❌ Error: ' + (data.error || 'Desconocido'));
            }
        } catch (err) {
            setMessage('❌ Error de conexión con la API.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="premium-card" style={{ marginTop: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h2 style={{ fontSize: '1.5rem', color: 'var(--primary)' }}>SEO Master Control Center (v3 - 100% Visual)</h2>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <select
                        value={selectedPage}
                        onChange={(e) => loadPage(e.target.value)}
                        className="status-badge"
                        style={{ background: '#18181b', border: '1px solid var(--border)', cursor: 'pointer', padding: '0.5rem' }}
                    >
                        <option value="">Seleccionar página...</option>
                        {pages.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                    <button
                        onClick={saveChanges}
                        disabled={!selectedPage || saving}
                        className="nav-cta"
                        style={{ opacity: (!selectedPage || saving) ? 0.5 : 1, cursor: 'pointer', border: 'none' }}
                    >
                        {saving ? 'Validando...' : 'Aplicar Cambios'}
                    </button>
                </div>
            </div>

            {loading && <p style={{ color: 'var(--muted)' }}>Cargando componentes interactivos...</p>}

            {message && <div style={{ padding: '1rem', borderRadius: '8px', background: message.includes('✅') ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 44, 44, 0.1)', color: message.includes('✅') ? '#22c55e' : '#ef4444', marginBottom: '1.5rem' }}>{message}</div>}

            {errors.length > 0 && (
                <div style={{ padding: '1rem', borderRadius: '8px', background: 'rgba(239, 44, 44, 0.1)', color: '#ef4444', marginBottom: '1.5rem' }}>
                    <strong style={{ display: 'block', marginBottom: '0.5rem' }}>Errores de Validación SEO:</strong>
                    <ul style={{ paddingLeft: '1.5rem' }}>
                        {errors.map((err, i) => <li key={i}>{err}</li>)}
                    </ul>
                </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {sections.map(section => (
                    <div key={section.id} style={{ border: '1px solid var(--border)', borderRadius: '12px', padding: '1.5rem', background: 'rgba(255,255,255,0.02)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--primary)' }}>{section.title}</h3>
                            <span style={{ fontSize: '0.75rem', color: '#22c55e', background: 'rgba(34, 197, 94, 0.1)', padding: '2px 8px', borderRadius: '4px' }}>Edición Visual Activa</span>
                        </div>

                        {/* EXPERIENCE INTRO EDITOR */}
                        {section.id === 'experiencia-text' && section.structured && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                <div>
                                    <label style={{ fontSize: '0.8rem', color: 'var(--muted)', display: 'block', marginBottom: '0.5rem' }}>Texto Introductorio de Experiencia</label>
                                    <textarea
                                        value={section.structured.text}
                                        onChange={(e) => handleStructuredChange(section.id, 'text', e.target.value)}
                                        style={{ width: '100%', background: '#0a0a0a', border: '1px solid #27272a', padding: '0.75rem', borderRadius: '6px', color: 'white', minHeight: '120px', lineHeight: '1.6' }}
                                    />
                                </div>
                            </div>
                        )}
                        {section.id === 'hero' && section.structured && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                <div>
                                    <label style={{ fontSize: '0.8rem', color: 'var(--muted)', display: 'block', marginBottom: '0.5rem' }}>Título Principal (H1)</label>
                                    <input
                                        type="text"
                                        value={section.structured.title}
                                        onChange={(e) => handleStructuredChange(section.id, 'title', e.target.value)}
                                        style={{ width: '100%', background: '#0a0a0a', border: '1px solid #27272a', padding: '0.75rem', borderRadius: '6px', color: 'white', fontWeight: 700 }}
                                    />
                                </div>
                                <div>
                                    <label style={{ fontSize: '0.8rem', color: 'var(--muted)', display: 'block', marginBottom: '0.5rem' }}>Subtítulo Hero</label>
                                    <textarea
                                        value={section.structured.subtitle}
                                        onChange={(e) => handleStructuredChange(section.id, 'subtitle', e.target.value)}
                                        style={{ width: '100%', background: '#0a0a0a', border: '1px solid #27272a', padding: '0.75rem', borderRadius: '6px', color: 'white', minHeight: '80px' }}
                                    />
                                </div>
                            </div>
                        )}

                        {/* SERVICES GRID EDITOR */}
                        {section.id === 'servicios' && section.structured && (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1rem' }}>
                                {section.structured.map((item: any, idx: number) => (
                                    <div key={idx} style={{ background: '#0f0f12', border: '1px solid #27272a', padding: '1rem', borderRadius: '10px', position: 'relative' }}>
                                        <button
                                            onClick={() => handleRemoveItem(section.id, idx)}
                                            style={{ position: 'absolute', top: '0.5rem', right: '0.5rem', background: '#ef4444', color: 'white', border: 'none', borderRadius: '4px', padding: '4px 8px', cursor: 'pointer', fontSize: '0.7rem' }}
                                        >Borrar</button>
                                        <input
                                            placeholder="Emoji/Icono"
                                            value={item.icon}
                                            onChange={(e) => handleStructuredChange(section.id, 'icon', e.target.value, idx)}
                                            style={{ width: '100%', marginBottom: '0.5rem', background: 'transparent', border: 'none', fontSize: '1.5rem', textAlign: 'center' }}
                                        />
                                        <input
                                            placeholder="Nombre del Servicio"
                                            value={item.title}
                                            onChange={(e) => handleStructuredChange(section.id, 'title', e.target.value, idx)}
                                            style={{ width: '100%', marginBottom: '0.5rem', background: 'transparent', border: 'none', color: 'white', fontWeight: 700, textAlign: 'center' }}
                                        />
                                        <textarea
                                            placeholder="Descripción corta"
                                            value={item.desc}
                                            onChange={(e) => handleStructuredChange(section.id, 'desc', e.target.value, idx)}
                                            style={{ width: '100%', background: 'transparent', border: 'none', color: 'var(--muted)', fontSize: '0.85rem', minHeight: '60px', textAlign: 'center', resize: 'none' }}
                                        />
                                    </div>
                                ))}
                                <button
                                    onClick={() => handleAddItem(section.id, { icon: '🛠️', title: 'Nuevo Servicio', desc: 'Descripción aquí...' })}
                                    style={{ background: 'rgba(255,255,255,0.03)', border: '2px dashed #27272a', borderRadius: '10px', color: 'var(--muted)', cursor: 'pointer', minHeight: '150px' }}
                                >+ Añadir Nuevo Servicio</button>
                            </div>
                        )}

                        {/* TECHNICAL TABLE EDITOR */}
                        {section.id === 'tecnico' && section.structured && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr auto', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                    <div style={{ color: 'var(--muted)', fontSize: '0.8rem' }}>Etiqueta</div>
                                    <div style={{ color: 'var(--muted)', fontSize: '0.8rem' }}>Valor</div>
                                    <div></div>
                                </div>
                                {section.structured.map((item: any, idx: number) => (
                                    <div key={idx} style={{ display: 'grid', gridTemplateColumns: '1fr 2fr auto', gap: '0.5rem', alignItems: 'center' }}>
                                        <input
                                            value={item.label}
                                            onChange={(e) => handleStructuredChange(section.id, 'label', e.target.value, idx)}
                                            style={{ background: '#0a0a0a', border: '1px solid #27272a', padding: '0.5rem', borderRadius: '4px', color: 'white', fontWeight: 600 }}
                                        />
                                        <input
                                            value={item.value}
                                            onChange={(e) => handleStructuredChange(section.id, 'value', e.target.value, idx)}
                                            style={{ background: '#0a0a0a', border: '1px solid #27272a', padding: '0.5rem', borderRadius: '4px', color: 'var(--muted)' }}
                                        />
                                        <button
                                            onClick={() => handleRemoveItem(section.id, idx)}
                                            style={{ background: '#ef4444', color: 'white', border: 'none', borderRadius: '4px', width: '32px', height: '32px', cursor: 'pointer' }}
                                        >×</button>
                                    </div>
                                ))}
                                <button
                                    onClick={() => handleAddItem(section.id, { label: 'Nueva Propiedad', value: 'Dato...' })}
                                    className="status-badge"
                                    style={{ marginTop: '0.5rem', background: '#18181b', border: '1px solid var(--border)', cursor: 'pointer', padding: '0.5rem' }}
                                >+ Añadir Especificación</button>
                            </div>
                        )}

                        {/* FAQ EDITOR */}
                        {section.id === 'faq' && section.structured && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                {section.structured.map((item: any, idx: number) => (
                                    <div key={idx} style={{ background: '#0f0f12', border: '1px solid #27272a', padding: '1.25rem', borderRadius: '10px' }}>
                                        <div style={{ display: 'flex', gap: '1rem', alignItems: 'start' }}>
                                            <div style={{ flex: 1 }}>
                                                <input
                                                    placeholder="Escribe la pregunta aquí..."
                                                    value={item.question}
                                                    onChange={(e) => handleStructuredChange(section.id, 'question', e.target.value, idx)}
                                                    style={{ width: '100%', marginBottom: '0.75rem', background: '#0a0a0a', border: '1px solid #27272a', padding: '0.75rem', borderRadius: '6px', color: 'white', fontWeight: 600 }}
                                                />
                                                <textarea
                                                    placeholder="Escribe la respuesta..."
                                                    value={item.answer}
                                                    onChange={(e) => handleStructuredChange(section.id, 'answer', e.target.value, idx)}
                                                    style={{ width: '100%', background: '#0a0a0a', border: '1px solid #27272a', padding: '0.75rem', borderRadius: '6px', color: 'var(--muted)', minHeight: '80px' }}
                                                />
                                            </div>
                                            <button
                                                onClick={() => handleRemoveItem(section.id, idx)}
                                                style={{ background: '#ef4444', color: 'white', border: 'none', borderRadius: '6px', padding: '0.5rem 1rem', cursor: 'pointer' }}
                                            >Eliminar</button>
                                        </div>
                                    </div>
                                ))}
                                <button
                                    onClick={() => handleAddItem(section.id, { question: 'Nueva Pregunta FAQ', answer: 'Nueva Respuesta...' })}
                                    className="status-badge"
                                    style={{ background: '#18181b', border: '1px solid var(--border)', cursor: 'pointer', padding: '1rem' }}
                                >+ Añadir Nueva Pregunta al FAQ</button>
                            </div>
                        )}

                        {/* ABOUT SECTION EDITOR */}
                        {section.id === 'about' && section.structured && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                <div>
                                    <label style={{ fontSize: '0.8rem', color: 'var(--muted)', display: 'block', marginBottom: '0.5rem' }}>Historia / Quiénes Somos</label>
                                    <textarea
                                        value={section.structured.text || ''}
                                        onChange={(e) => handleStructuredChange(section.id, 'text', e.target.value)}
                                        style={{ width: '100%', background: '#0a0a0a', border: '1px solid #27272a', padding: '0.75rem', borderRadius: '6px', color: 'white', minHeight: '120px', lineHeight: '1.6' }}
                                    />
                                </div>

                                {section.structured.stats && (
                                    <div>
                                        <label style={{ fontSize: '0.8rem', color: 'var(--muted)', display: 'block', marginBottom: '1rem' }}>Estadísticas de Confianza</label>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                            {section.structured.stats.map((stat: any, sIdx: number) => (
                                                <div key={sIdx} style={{ background: '#0f0f12', border: '1px solid #27272a', padding: '1rem', borderRadius: '8px' }}>
                                                    <input
                                                        value={stat.value}
                                                        onChange={(e) => {
                                                            const newStats = [...section.structured.stats];
                                                            newStats[sIdx] = { ...stat, value: e.target.value };
                                                            handleStructuredChange(section.id, 'stats', newStats);
                                                        }}
                                                        style={{ width: '100%', background: 'transparent', border: 'none', color: 'var(--primary)', fontSize: '1.5rem', fontWeight: 700, textAlign: 'center', marginBottom: '0.25rem' }}
                                                    />
                                                    <input
                                                        value={stat.label}
                                                        onChange={(e) => {
                                                            const newStats = [...section.structured.stats];
                                                            newStats[sIdx] = { ...stat, label: e.target.value };
                                                            handleStructuredChange(section.id, 'stats', newStats);
                                                        }}
                                                        style={{ width: '100%', background: 'transparent', border: 'none', color: 'var(--muted)', fontSize: '0.8rem', textAlign: 'center' }}
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {section.structured.legal && (
                                    <div>
                                        <label style={{ fontSize: '0.8rem', color: 'var(--muted)', display: 'block', marginBottom: '0.5rem' }}>Datos Legales y Especialización</label>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                            <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '1rem', alignItems: 'center' }}>
                                                <span style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>CIF:</span>
                                                <input
                                                    value={section.structured.legal.cif || ''}
                                                    onChange={(e) => {
                                                        const newLegal = { ...section.structured.legal, cif: e.target.value };
                                                        handleStructuredChange(section.id, 'legal', newLegal);
                                                    }}
                                                    style={{ background: '#0a0a0a', border: '1px solid #27272a', padding: '0.5rem', borderRadius: '4px', color: 'white' }}
                                                />
                                            </div>
                                            <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '1rem', alignItems: 'center' }}>
                                                <span style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>Dirección:</span>
                                                <input
                                                    value={section.structured.legal.address || ''}
                                                    onChange={(e) => {
                                                        const newLegal = { ...section.structured.legal, address: e.target.value };
                                                        handleStructuredChange(section.id, 'legal', newLegal);
                                                    }}
                                                    style={{ background: '#0a0a0a', border: '1px solid #27272a', padding: '0.5rem', borderRadius: '4px', color: 'white' }}
                                                />
                                            </div>
                                            <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '1rem', alignItems: 'center' }}>
                                                <span style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>Especialidad:</span>
                                                <input
                                                    value={section.structured.legal.specialization || ''}
                                                    onChange={(e) => {
                                                        const newLegal = { ...section.structured.legal, specialization: e.target.value };
                                                        handleStructuredChange(section.id, 'legal', newLegal);
                                                    }}
                                                    style={{ background: '#0a0a0a', border: '1px solid #27272a', padding: '0.5rem', borderRadius: '4px', color: 'white' }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* SEO CONTENT BLOCKS EDITOR (v4 - Multi-type Blocks) */}
                        {section.id.startsWith('seo-') && section.structured && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                                <div>
                                    <label style={{ fontSize: '0.8rem', color: 'var(--muted)', display: 'block', marginBottom: '0.5rem' }}>Título de Sección (H2)</label>
                                    <input
                                        type="text"
                                        value={section.structured.title}
                                        onChange={(e) => handleStructuredChange(section.id, 'title', e.target.value)}
                                        style={{ width: '100%', background: '#0a0a0a', border: '1px solid #27272a', padding: '0.75rem', borderRadius: '6px', color: 'white', fontWeight: 600 }}
                                    />
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                    {section.structured.blocks?.map((block: any, bIdx: number) => (
                                        <div key={bIdx} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid #27272a', padding: '1rem', borderRadius: '8px', position: 'relative' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                                <span style={{ fontSize: '0.7rem', color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '1px' }}>{block.type}</span>
                                                <button
                                                    onClick={() => handleRemoveSubItem(section.id, 'blocks', bIdx)}
                                                    style={{ background: 'transparent', color: '#ef4444', border: 'none', cursor: 'pointer', fontSize: '0.75rem' }}
                                                >Eliminar Bloque</button>
                                            </div>

                                            {/* PARAGRAPH BLOCK */}
                                            {block.type === 'paragraph' && (
                                                <textarea
                                                    value={block.text}
                                                    onChange={(e) => {
                                                        const newBlocks = [...section.structured.blocks];
                                                        newBlocks[bIdx] = { ...block, text: e.target.value };
                                                        handleStructuredChange(section.id, 'blocks', newBlocks);
                                                    }}
                                                    style={{ width: '100%', background: '#0a0a0a', border: '1px solid #27272a', padding: '0.75rem', borderRadius: '6px', color: 'var(--muted)', minHeight: '80px' }}
                                                />
                                            )}

                                            {/* LIST BLOCK */}
                                            {block.type === 'list' && (
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                                    {block.items.map((item: string, iIdx: number) => (
                                                        <div key={iIdx} style={{ display: 'flex', gap: '0.5rem' }}>
                                                            <input
                                                                value={item}
                                                                onChange={(e) => {
                                                                    const newItems = [...block.items];
                                                                    newItems[iIdx] = e.target.value;
                                                                    const newBlocks = [...section.structured.blocks];
                                                                    newBlocks[bIdx] = { ...block, items: newItems };
                                                                    handleStructuredChange(section.id, 'blocks', newBlocks);
                                                                }}
                                                                style={{ flex: 1, background: '#0a0a0a', border: '1px solid #27272a', padding: '0.5rem', borderRadius: '4px', color: 'var(--muted)' }}
                                                            />
                                                            <button
                                                                onClick={() => {
                                                                    const newItems = [...block.items];
                                                                    newItems.splice(iIdx, 1);
                                                                    const newBlocks = [...section.structured.blocks];
                                                                    newBlocks[bIdx] = { ...block, items: newItems };
                                                                    handleStructuredChange(section.id, 'blocks', newBlocks);
                                                                }}
                                                                style={{ background: 'transparent', color: '#ef4444', border: 'none', cursor: 'pointer' }}
                                                            >×</button>
                                                        </div>
                                                    ))}
                                                    <button
                                                        onClick={() => {
                                                            const newBlocks = [...section.structured.blocks];
                                                            newBlocks[bIdx] = { ...block, items: [...block.items, 'Nuevo elemento...'] };
                                                            handleStructuredChange(section.id, 'blocks', newBlocks);
                                                        }}
                                                        style={{ background: 'transparent', color: 'var(--primary)', border: '1px dashed var(--primary)', borderRadius: '4px', padding: '0.25rem', cursor: 'pointer', fontSize: '0.75rem' }}
                                                    >+ Añadir Elemento</button>
                                                </div>
                                            )}

                                            {/* INTERVENTION BLOCK */}
                                            {block.type === 'intervention' && (
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                                    <input
                                                        placeholder="Título de Intervención"
                                                        value={block.title}
                                                        onChange={(e) => {
                                                            const newBlocks = [...section.structured.blocks];
                                                            newBlocks[bIdx] = { ...block, title: e.target.value };
                                                            handleStructuredChange(section.id, 'blocks', newBlocks);
                                                        }}
                                                        style={{ width: '100%', background: '#0a0a0a', border: '1px solid #27272a', padding: '0.5rem', borderRadius: '4px', color: 'white', fontWeight: 600 }}
                                                    />
                                                    <textarea
                                                        placeholder="Descripción"
                                                        value={block.description}
                                                        onChange={(e) => {
                                                            const newBlocks = [...section.structured.blocks];
                                                            newBlocks[bIdx] = { ...block, description: e.target.value };
                                                            handleStructuredChange(section.id, 'blocks', newBlocks);
                                                        }}
                                                        style={{ width: '100%', background: '#0a0a0a', border: '1px solid #27272a', padding: '0.5rem', borderRadius: '4px', color: 'var(--muted)', minHeight: '60px' }}
                                                    />
                                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                        {block.meta.map((m: string, mIdx: number) => (
                                                            <input
                                                                key={mIdx}
                                                                value={m}
                                                                onChange={(e) => {
                                                                    const newMeta = [...block.meta];
                                                                    newMeta[mIdx] = e.target.value;
                                                                    const newBlocks = [...section.structured.blocks];
                                                                    newBlocks[bIdx] = { ...block, meta: newMeta };
                                                                    handleStructuredChange(section.id, 'blocks', newBlocks);
                                                                }}
                                                                style={{ flex: 1, background: '#0f0f12', border: '1px solid #27272a', padding: '0.4rem', borderRadius: '4px', color: 'var(--primary)', fontSize: '0.75rem' }}
                                                            />
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ))}

                                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                                        <button
                                            onClick={() => handleAddSubItem(section.id, 'blocks', { type: 'paragraph', text: 'Nuevo párrafo...' })}
                                            className="status-badge" style={{ cursor: 'pointer', background: '#18181b', border: '1px solid var(--border)', flex: 1, fontSize: '0.75rem' }}
                                        >+ Párrafo</button>
                                        <button
                                            onClick={() => handleAddSubItem(section.id, 'blocks', { type: 'list', items: ['Nuevo punto...'] })}
                                            className="status-badge" style={{ cursor: 'pointer', background: '#18181b', border: '1px solid var(--border)', flex: 1, fontSize: '0.75rem' }}
                                        >+ Lista</button>
                                        <button
                                            onClick={() => handleAddSubItem(section.id, 'blocks', { type: 'intervention', title: 'Nueva intervención', description: 'Detalle...', meta: ['🕒 Hora', '📍 Lugar'] })}
                                            className="status-badge" style={{ cursor: 'pointer', background: '#18181b', border: '1px solid var(--border)', flex: 1, fontSize: '0.75rem' }}
                                        >+ Intervención</button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* NO FALLBACK NEEDED - EVERYTHING IS STRUCTURED NOW */}
                        {!section.structured && (
                            <div style={{ padding: '1rem', color: '#ef4444', background: 'rgba(239, 44, 44, 0.1)', borderRadius: '8px' }}>
                                Error: Esta sección no pudo ser mapeada a controles visuales.
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {!selectedPage && !loading && (
                <div style={{ textAlign: 'center', padding: '6rem', color: 'var(--muted)', border: '2px dashed var(--border)', borderRadius: '12px', background: 'rgba(255,255,255,0.01)' }}>
                    <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📂</div>
                    <p style={{ fontSize: '1.2rem', fontWeight: 500 }}>Control de Contenido SEO Maestro</p>
                    <p style={{ fontSize: '0.9rem' }}>Selecciona una página arriba para editar visualmente y sin código.</p>
                </div>
            )}
        </div>
    );
}

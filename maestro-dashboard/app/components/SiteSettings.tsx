'use client';

import React, { useState, useEffect } from 'react';

export default function SiteSettings() {
    const [settings, setSettings] = useState({
        site_url: '',
        auth_user: '',
        auth_pass: '',
        site_type: 'wordpress',
        ftp_host: '',
        ftp_user: '',
        ftp_pass: '',
        ftp_port: 22,
        ftp_path: ''
    });
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');

    useEffect(() => {
        fetch('http://localhost:8081/api/settings')
            .then(res => res.json())
            .then(data => {
                if (data.site_url || data.ftp_host) {
                    setSettings(prev => ({ ...prev, ...data }));
                }
            });
    }, []);

    const [testLoading, setTestLoading] = useState(false);
    const [testResult, setTestResult] = useState<{ success: boolean, message: string } | null>(null);

    const handleTestConnection = async () => {
        if (!settings.site_url) {
            setTestResult({ success: false, message: 'URL requerida para la prueba.' });
            return;
        }
        setTestLoading(true);
        setTestResult(null);
        try {
            const res = await fetch('http://localhost:8081/api/test-connection', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(settings)
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Fallo en la conexión');

            setTestResult({
                success: true,
                message: data.message
            });
        } catch (err) {
            const msg = err instanceof Error ? err.message : 'Fallo en la conexión';
            setTestResult({ success: false, message: `Error: ${msg}` });
        } finally {
            setTestLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await fetch('http://localhost:8081/api/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(settings)
            });
            if (res.ok) setMessage('Configuración guardada correctamente.');
        } catch {
            setMessage('Error al guardar la configuración.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="premium-card">
            <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>Configuración del Destino</h2>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

                {/* GLOBAL SECTOR: Platform & URL */}
                <section style={{ padding: '1rem', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', border: '1px solid var(--border)' }}>
                    <h3 style={{ fontSize: '0.9rem', marginBottom: '1rem', color: 'var(--primary)', fontWeight: 700 }}>1. Plataforma Base</h3>
                    <div className="form-grid">
                        <div>
                            <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--muted)', marginBottom: '0.5rem' }}>Tipo de Despliegue</label>
                            <select
                                value={settings.site_type}
                                onChange={(e) => setSettings({ ...settings, site_type: e.target.value })}
                                style={{ width: '100%', padding: '0.75rem', background: '#050507', border: '1px solid var(--border)', borderRadius: '8px', color: '#fff' }}
                            >
                                <option value="wordpress">WordPress REST API</option>
                                <option value="static">Static SEO Export (SFTP/FTP)</option>
                            </select>
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--muted)', marginBottom: '0.5rem' }}>URL Pública del Sitio</label>
                            <input
                                type="text"
                                value={settings.site_url}
                                onChange={(e) => setSettings({ ...settings, site_url: e.target.value })}
                                placeholder="https://tu-web.com"
                                style={{ width: '100%', padding: '0.75rem', background: '#050507', border: '1px solid var(--border)', borderRadius: '8px', color: '#fff' }}
                            />
                        </div>
                    </div>
                </section>

                {/* WORDPRESS SECTOR */}
                {settings.site_type === 'wordpress' && (
                    <section style={{ padding: '1rem', background: 'rgba(56, 189, 248, 0.05)', borderRadius: '12px', border: '1px solid rgba(56, 189, 248, 0.2)' }}>
                        <h3 style={{ fontSize: '0.9rem', marginBottom: '1rem', color: '#38bdf8', fontWeight: 700 }}>2. Credenciales WordPress</h3>
                        <div className="form-grid">
                            <div>
                                <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--muted)', marginBottom: '0.5rem' }}>Usuario WP</label>
                                <input
                                    type="text"
                                    value={settings.auth_user}
                                    onChange={(e) => setSettings({ ...settings, auth_user: e.target.value })}
                                    placeholder="admin"
                                    style={{ width: '100%', padding: '0.75rem', background: '#050507', border: '1px solid var(--border)', borderRadius: '8px', color: '#fff' }}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--muted)', marginBottom: '0.5rem' }}>Application Password</label>
                                <input
                                    type="password"
                                    value={settings.auth_pass}
                                    onChange={(e) => setSettings({ ...settings, auth_pass: e.target.value })}
                                    placeholder="xxxx xxxx xxxx xxxx"
                                    style={{ width: '100%', padding: '0.75rem', background: '#050507', border: '1px solid var(--border)', borderRadius: '8px', color: '#fff' }}
                                />
                            </div>
                        </div>
                    </section>
                )}

                {/* STATIC / FTP SECTOR */}
                {settings.site_type === 'static' && (
                    <section style={{ padding: '1rem', background: 'rgba(245, 158, 11, 0.05)', borderRadius: '12px', border: '1px solid rgba(245, 158, 11, 0.2)' }}>
                        <h3 style={{ fontSize: '0.9rem', marginBottom: '1rem', color: '#f59e0b', fontWeight: 700 }}>2. Configuración Auto-Despliegue (SFTP/FTP)</h3>
                        <div className="form-grid-uneven" style={{ marginBottom: '1rem' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--muted)', marginBottom: '0.5rem' }}>Servidor / Host IP</label>
                                <input
                                    type="text"
                                    value={settings.ftp_host}
                                    onChange={(e) => setSettings({ ...settings, ftp_host: e.target.value })}
                                    placeholder="ftp.tuservidor.com o IP"
                                    style={{ width: '100%', padding: '0.75rem', background: '#050507', border: '1px solid var(--border)', borderRadius: '8px', color: '#fff' }}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--muted)', marginBottom: '0.5rem' }}>Puerto</label>
                                <input
                                    type="number"
                                    value={settings.ftp_port}
                                    onChange={(e) => setSettings({ ...settings, ftp_port: parseInt(e.target.value) })}
                                    style={{ width: '100%', padding: '0.75rem', background: '#050507', border: '1px solid var(--border)', borderRadius: '8px', color: '#fff' }}
                                />
                            </div>
                        </div>
                        <div className="form-grid" style={{ marginBottom: '1rem' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--muted)', marginBottom: '0.5rem' }}>Usuario FTP</label>
                                <input
                                    type="text"
                                    value={settings.ftp_user}
                                    onChange={(e) => setSettings({ ...settings, ftp_user: e.target.value })}
                                    style={{ width: '100%', padding: '0.75rem', background: '#050507', border: '1px solid var(--border)', borderRadius: '8px', color: '#fff' }}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--muted)', marginBottom: '0.5rem' }}>Contraseña FTP</label>
                                <input
                                    type="password"
                                    value={settings.ftp_pass}
                                    onChange={(e) => setSettings({ ...settings, ftp_pass: e.target.value })}
                                    style={{ width: '100%', padding: '0.75rem', background: '#050507', border: '1px solid var(--border)', borderRadius: '8px', color: '#fff' }}
                                />
                            </div>
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--muted)', marginBottom: '0.5rem' }}>Ruta Remota (Path)</label>
                            <input
                                type="text"
                                value={settings.ftp_path}
                                onChange={(e) => setSettings({ ...settings, ftp_path: e.target.value })}
                                placeholder="/public_html o /var/www/html"
                                style={{ width: '100%', padding: '0.75rem', background: '#050507', border: '1px solid var(--border)', borderRadius: '8px', color: '#fff' }}
                            />
                        </div>
                    </section>
                )}

                <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                    <button
                        type="submit"
                        disabled={loading}
                        style={{
                            flex: 2,
                            padding: '1rem',
                            background: 'var(--primary)',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '8px',
                            fontWeight: 600,
                            cursor: loading ? 'not-allowed' : 'pointer',
                            boxShadow: '0 4px 12px rgba(0, 255, 157, 0.2)'
                        }}
                    >
                        {loading ? 'Guardando...' : '💾 Guardar Configuración Maestro'}
                    </button>
                    <button
                        type="button"
                        onClick={handleTestConnection}
                        disabled={testLoading}
                        style={{
                            flex: 1,
                            padding: '1rem',
                            background: '#27272a',
                            color: '#fff',
                            border: '1px solid var(--border)',
                            borderRadius: '8px',
                            fontWeight: 600,
                            cursor: testLoading ? 'not-allowed' : 'pointer'
                        }}
                    >
                        {testLoading ? 'Probando...' : '⚡ Test'}
                    </button>
                </div>

                {testResult && (
                    <div style={{
                        padding: '1rem',
                        background: testResult.success ? 'rgba(0, 255, 157, 0.1)' : 'rgba(255, 69, 107, 0.1)',
                        border: `1px solid ${testResult.success ? 'var(--accent)' : 'var(--danger)'}`,
                        borderRadius: '8px',
                        textAlign: 'center'
                    }}>
                        <p style={{ fontSize: '0.875rem', color: testResult.success ? 'var(--accent)' : 'var(--danger)', margin: 0 }}>
                            {testResult.success ? '✅ ' : '❌ '} {testResult.message}
                        </p>
                    </div>
                )}

                {message && <p style={{ fontSize: '0.875rem', color: 'var(--accent)', textAlign: 'center', fontWeight: 600 }}>{message}</p>}
            </form>
        </div>
    );
}

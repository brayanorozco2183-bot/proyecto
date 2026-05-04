'use client';

import React, { useState } from 'react';

export default function MissionControl() {
    const [niche, setNiche] = useState('');
    const [locations, setLocations] = useState('');
    const [command, setCommand] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [isListening, setIsListening] = useState(false);
    const [publishMode, setPublishMode] = useState<'draft' | 'publish'>('publish');
    const [siteType, setSiteType] = useState<'wordpress' | 'static'>('wordpress');
    const [isCluster, setIsCluster] = useState(false);
    const [scope, setScope] = useState<'neighborhoods' | 'municipalities' | 'auto'>('auto');

    // Credenciales específicas de la misión
    const [ftpHost, setFtpHost] = useState('');
    const [ftpUser, setFtpUser] = useState('');
    const [ftpPass, setFtpPass] = useState('');
    const [ftpPath, setFtpPath] = useState('');

    const [wpUrl, setWpUrl] = useState('');
    const [wpUser, setWpUser] = useState('');
    const [wpPass, setWpPass] = useState('');

    const speak = (text: string) => {
        if (typeof window === 'undefined' || !window.speechSynthesis) return;
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'es-ES';
        utterance.rate = 1.1;
        window.speechSynthesis.speak(utterance);
    };

    const startListening = () => {
        /* eslint-disable @typescript-eslint/no-explicit-any */
        const win = window as any;
        const SpeechRecognition = win.SpeechRecognition || win.webkitSpeechRecognition;
        /* eslint-enable @typescript-eslint/no-explicit-any */
        if (!SpeechRecognition) {
            alert("Navegador no compatible con voz.");
            return;
        }

        const recognition = new SpeechRecognition();
        recognition.lang = 'es-ES';
        recognition.onstart = () => setIsListening(true);
        recognition.onend = () => setIsListening(false);
        recognition.onresult = (event: { results: { [index: number]: { [index: number]: { transcript: string } } } }) => {
            const text = event.results[0][0].transcript;
            setCommand(text);
        };
        recognition.start();
    };

    const handleSubmit = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!command && !niche) return;

        setLoading(true);
        setMessage('');

        try {
            const payload = command || `Misión de ${niche} en ${locations}`;
            const finalCommand = publishMode === 'publish' ? payload + ' [PUBLISH_NOW]' : payload;
            // Preparar credenciales adicionales si se han rellenado
            const extraPayload: Record<string, unknown> = {};
            if (siteType === 'static' && ftpHost) {
                extraPayload.ftp_creds = { host: ftpHost, user: ftpUser, pass: ftpPass, port: 22, path: ftpPath };
            }
            if (siteType === 'wordpress' && wpUrl) {
                extraPayload.wp_creds = { site_url: wpUrl, auth_user: wpUser, auth_pass: wpPass };
            }

            const res = await fetch('http://localhost:8081/api/command', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    command: finalCommand,
                    publish_mode: publishMode,
                    site_type: siteType,
                    is_cluster: isCluster,
                    scope: scope,
                    ...extraPayload
                })
            });
            const data = await res.json();

            if (res.status === 503) {
                setMessage(`⚠️ SISTEMA OFFLINE: ${data.error}`);
                speak("Atención: El motor de misiones está fuera de línea.");
                return;
            }

            if (data.success) {
                setMessage(data.response || 'Misión lanzada con éxito.');
                speak(data.response || "Misión iniciada.");
                setNiche('');
                setLocations('');
                setCommand('');
            } else {
                throw new Error(data.error);
            }
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
            setMessage(`Error: ${errorMessage}`);
            speak("Error al procesar el comando.");
        } finally {
            setLoading(false);
        }
    };

    const handleStop = async () => {
        if (!window.confirm("⚠️ ¿Seguro que quieres detener todas las misiones en curso? Se abortará tras terminar la ciudad actual.")) return;
        try {
            const res = await fetch('http://localhost:8081/api/command/stop', { method: 'POST' });
            const data = await res.json();
            if (data.success) {
                setMessage(data.message);
                speak("Misiones preparadas para abortar.");
            } else {
                setMessage(`Error al detener: ${data.error}`);
            }
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : String(err);
            setMessage(`Error de conexión al detener: ${errorMessage}`);
        }
    };

    return (
        <div className="premium-card">
            <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>Voz del Orquestador (IA)</h2>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ marginBottom: '0.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                        <label style={{ fontSize: '0.875rem', color: 'var(--muted)' }}>Dime qué quieres hacer (Lenguaje Natural)</label>
                        <button
                            type="button"
                            onClick={startListening}
                            style={{
                                background: isListening ? 'var(--danger)' : 'transparent',
                                border: '1px solid var(--border)',
                                padding: '2px 8px',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                color: isListening ? '#fff' : 'var(--primary)',
                                fontSize: '0.75rem',
                                animation: isListening ? 'pulse 1.5s infinite' : 'none'
                            }}
                        >
                            {isListening ? '🛑 ESCUCHANDO...' : '🎤 HABLAR'}
                        </button>
                    </div>
                    <textarea
                        value={command}
                        onChange={(e) => setCommand(e.target.value)}
                        placeholder={`Ej: Necesito dentistas en Bilbao y Donostia...\nEj: Quiero posicionarme para abogados en Madrid`}
                        style={{
                            width: '100%',
                            height: '100px',
                            padding: '1rem',
                            background: 'rgba(0,0,0,0.3)',
                            border: `1px solid ${isListening ? 'var(--danger)' : 'rgba(255,255,255,0.1)'}`,
                            borderRadius: '12px',
                            color: '#fff',
                            resize: 'none',
                            fontSize: '0.9rem',
                            outline: 'none',
                            transition: 'all 0.3s ease',
                            boxShadow: isListening ? '0 0 15px rgba(239, 68, 68, 0.2)' : 'inset 0 2px 4px rgba(0,0,0,0.5)'
                        }}
                        onFocus={(e) => e.currentTarget.style.borderColor = 'var(--primary)'}
                        onBlur={(e) => e.currentTarget.style.borderColor = isListening ? 'var(--danger)' : 'rgba(255,255,255,0.1)'}
                    />
                </div>

                <div style={{ padding: '0.5rem', borderTop: '1px solid var(--border)', paddingTop: '1.5rem' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
                        <input
                            type="text"
                            value={niche}
                            onChange={(e) => setNiche(e.target.value)}
                            placeholder="Nicho (Ej: Reformas)"
                            style={{ padding: '0.75rem', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border)', borderRadius: '8px', color: '#fff', fontSize: '0.8rem', outline: 'none' }}
                        />
                        <input
                            type="text"
                            value={locations}
                            onChange={(e) => setLocations(e.target.value)}
                            placeholder="Ciudades"
                            style={{ padding: '0.75rem', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border)', borderRadius: '8px', color: '#fff', fontSize: '0.8rem', outline: 'none' }}
                        />
                    </div>

                    <div style={{ padding: '0.75rem', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', marginBottom: '1rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                            <label style={{ fontSize: '0.75rem', fontWeight: 700 }}>🚀 MODO CLÚSTER (DOMINACIÓN)</label>
                            <input
                                type="checkbox"
                                checked={isCluster}
                                onChange={(e) => setIsCluster(e.target.checked)}
                                style={{ transform: 'scale(1.2)', cursor: 'pointer' }}
                            />
                        </div>
                        {isCluster && (
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                {(['neighborhoods', 'municipalities', 'auto'] as const).map(s => (
                                    <button
                                        key={s}
                                        type="button"
                                        onClick={() => setScope(s)}
                                        style={{
                                            flex: 1,
                                            padding: '0.3rem',
                                            fontSize: '0.65rem',
                                            background: scope === s ? 'var(--accent)' : 'transparent',
                                            border: `1px solid ${scope === s ? 'var(--accent)' : 'var(--border)'}`,
                                            borderRadius: '4px',
                                            color: '#fff',
                                            cursor: 'pointer',
                                            fontWeight: scope === s ? 700 : 400
                                        }}
                                    >
                                        {s === 'neighborhoods' ? 'BARRIOS' : s === 'municipalities' ? 'MUNICIPIOS' : 'AUTO'}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
                        {(['draft', 'publish'] as const).map(mode => (
                            <button
                                key={mode}
                                type="button"
                                onClick={() => setPublishMode(mode)}
                                style={{
                                    flex: 1,
                                    padding: '0.4rem',
                                    background: publishMode === mode ? (mode === 'publish' ? 'var(--accent)' : '#555') : 'transparent',
                                    border: `1px solid ${publishMode === mode ? (mode === 'publish' ? 'var(--accent)' : '#555') : 'var(--border)'}`,
                                    borderRadius: '4px',
                                    color: '#fff',
                                    cursor: 'pointer',
                                    fontSize: '0.7rem',
                                    fontWeight: publishMode === mode ? 700 : 400
                                }}
                            >
                                {mode === 'publish' ? '🚀 PUBLICAR AHORA' : '📝 BORRADOR'}
                            </button>
                        ))}
                    </div>

                    <p style={{ fontSize: '0.7rem', color: 'var(--muted)', marginTop: '1rem', marginBottom: '0.5rem', textAlign: 'center' }}>Plataforma de Despliegue:</p>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        {(['wordpress', 'static'] as const).map(type => (
                            <button
                                key={type}
                                type="button"
                                onClick={() => setSiteType(type)}
                                style={{
                                    flex: 1,
                                    padding: '0.4rem',
                                    background: siteType === type ? 'var(--primary)' : 'transparent',
                                    border: `1px solid ${siteType === type ? 'var(--primary)' : 'var(--border)'}`,
                                    borderRadius: '4px',
                                    color: '#fff',
                                    cursor: 'pointer',
                                    fontSize: '0.7rem',
                                    fontWeight: siteType === type ? 700 : 400
                                }}
                            >
                                {type === 'wordpress' ? '🌐 WORDPRESS' : '🏙️ ESTÁTICO (NEXT)'}
                            </button>
                        ))}
                    </div>

                    {siteType === 'static' && (
                        <div style={{ marginTop: '1rem', padding: '1rem', background: 'rgba(245, 158, 11, 0.05)', borderRadius: '8px', border: '1px solid rgba(245, 158, 11, 0.2)' }}>
                            <h4 style={{ fontSize: '0.75rem', color: '#f59e0b', marginBottom: '0.75rem', fontWeight: 600 }}>Credenciales SFTP/FTP (Opcional - Sobrescribe Globales)</h4>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                                <input type="text" placeholder="Host (Ej: ftp.server.com)" value={ftpHost} onChange={e => setFtpHost(e.target.value)} style={{ padding: '0.5rem', background: '#050507', border: '1px solid var(--border)', borderRadius: '4px', color: '#fff', fontSize: '0.75rem' }} />
                                <input type="text" placeholder="Usuario FTP" value={ftpUser} onChange={e => setFtpUser(e.target.value)} style={{ padding: '0.5rem', background: '#050507', border: '1px solid var(--border)', borderRadius: '4px', color: '#fff', fontSize: '0.75rem' }} />
                                <input type="password" placeholder="Contraseña FTP" value={ftpPass} onChange={e => setFtpPass(e.target.value)} style={{ padding: '0.5rem', background: '#050507', border: '1px solid var(--border)', borderRadius: '4px', color: '#fff', fontSize: '0.75rem' }} />
                                <input type="text" placeholder="Ruta (Ej: /public_html)" value={ftpPath} onChange={e => setFtpPath(e.target.value)} style={{ padding: '0.5rem', background: '#050507', border: '1px solid var(--border)', borderRadius: '4px', color: '#fff', fontSize: '0.75rem' }} />
                            </div>
                        </div>
                    )}

                    {siteType === 'wordpress' && (
                        <div style={{ marginTop: '1rem', padding: '1rem', background: 'rgba(56, 189, 248, 0.05)', borderRadius: '8px', border: '1px solid rgba(56, 189, 248, 0.2)' }}>
                            <h4 style={{ fontSize: '0.75rem', color: '#38bdf8', marginBottom: '0.75rem', fontWeight: 600 }}>Credenciales WordPress (Opcional - Sobrescribe Globales)</h4>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '0.5rem' }}>
                                <input type="text" placeholder="URL Pública (Ej: https://miweb.com)" value={wpUrl} onChange={e => setWpUrl(e.target.value)} style={{ padding: '0.5rem', background: '#050507', border: '1px solid var(--border)', borderRadius: '4px', color: '#fff', fontSize: '0.75rem' }} />
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                                    <input type="text" placeholder="Usuario WP" value={wpUser} onChange={e => setWpUser(e.target.value)} style={{ padding: '0.5rem', background: '#050507', border: '1px solid var(--border)', borderRadius: '4px', color: '#fff', fontSize: '0.75rem' }} />
                                    <input type="password" placeholder="App Password" value={wpPass} onChange={e => setWpPass(e.target.value)} style={{ padding: '0.5rem', background: '#050507', border: '1px solid var(--border)', borderRadius: '4px', color: '#fff', fontSize: '0.75rem' }} />
                                </div>
                            </div>
                        </div>
                    )}

                </div>

                <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                    <button
                        disabled={loading}
                        type="submit"
                        style={{
                            flex: 2,
                            padding: '1rem',
                            background: message.includes('OFFLINE') ? 'var(--danger)' : 'var(--primary)',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '8px',
                            fontWeight: 600,
                            cursor: loading ? 'not-allowed' : 'pointer',
                            opacity: loading ? 0.7 : 1,
                            transition: 'all 0.3s ease'
                        }}
                    >
                        {loading ? 'Procesando...' : message.includes('OFFLINE') ? 'MAQUINARIA BLOQUEADA' : 'Lanzar Comando Maestro'}
                    </button>
                    <button
                        type="button"
                        onClick={handleStop}
                        style={{
                            flex: 1,
                            padding: '1rem',
                            background: 'transparent',
                            color: 'var(--danger)',
                            border: '1px solid var(--danger)',
                            borderRadius: '8px',
                            fontWeight: 600,
                            cursor: 'pointer',
                            transition: 'all 0.3s ease'
                        }}
                        onMouseOver={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'}
                        onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                        🛑 Detener
                    </button>
                </div>
                {message && (
                    <p style={{
                        fontSize: '0.8125rem',
                        color: message.includes('Error') || message.includes('OFFLINE') ? 'var(--danger)' : 'var(--accent)',
                        textAlign: 'center',
                        padding: '0.5rem',
                        background: 'rgba(0,0,0,0.2)',
                        borderRadius: '4px',
                        marginTop: '1rem'
                    }}>
                        {message}
                    </p>
                )}
            </form>
        </div>
    );
}

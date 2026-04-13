"use client";
import React, { useEffect, useState } from 'react';
import Image from 'next/image';

interface Asset {
    type: 'image_real' | 'video_script' | 'authority_strategy';
    path?: string;
    city: string;
    title?: string;
    status?: string;
}

/**
 * AssetsGallery - The Creative Vault.
 * Visualizes all generated images, scripts, and strategies.
 */
export default function AssetsGallery() {
    const [assets, setAssets] = useState<Asset[]>([]);

    useEffect(() => {
        const loadAssets = () => {
            const mockAssets: Asset[] = [
                { type: 'image_real', path: 'https://images.unsplash.com/photo-1581094794329-c8112a89af12', city: 'Madrid' },
                { type: 'video_script', city: 'Barcelona', title: 'Viral Plumbing Hook' },
                { type: 'authority_strategy', city: 'Valencia', status: 'Generated' }
            ];
            setAssets(mockAssets);
        };
        loadAssets();
    }, []);

    return (
        <div style={{ background: '#0e0e11', border: '1px solid var(--border)', borderRadius: '12px', padding: '1.5rem', marginTop: '1.5rem' }}>
            <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span style={{ fontSize: '1.5rem' }}>🎨</span> Galería de Activos Ultra
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
                {assets.map((asset, i) => (
                    <div key={i} style={{ background: '#16161a', borderRadius: '8px', overflow: 'hidden', border: '1px solid #27272a' }}>
                        {asset.type === 'image_real' && asset.path ? (
                            <Image
                                src={asset.path}
                                alt="Generated Asset"
                                width={300}
                                height={120}
                                style={{ width: '100%', height: '120px', objectFit: 'cover' }}
                            />
                        ) : (
                            <div style={{ height: '120px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#2563eb10', color: 'var(--primary)', fontSize: '2rem' }}>
                                {asset.type === 'video_script' ? '🎬' : '🔗'}
                            </div>
                        )}
                        <div style={{ padding: '0.75rem' }}>
                            <div style={{ fontSize: '0.75rem', color: 'var(--muted)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>{asset.type}</div>
                            <div style={{ fontSize: '0.875rem', fontWeight: 600 }}>{asset.city}</div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

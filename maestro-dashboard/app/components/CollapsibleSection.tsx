'use client';

import React, { useState } from 'react';

interface CollapsibleSectionProps {
    title: string;
    children: React.ReactNode;
    defaultOpen?: boolean;
    badge?: string;
}

export default function CollapsibleSection({ title, children, defaultOpen = true, badge }: CollapsibleSectionProps) {
    const [isOpen, setIsOpen] = useState(defaultOpen);

    return (
        <div style={{ 
            marginBottom: '1.5rem', 
            border: '1px solid rgba(255,255,255,0.05)', 
            borderRadius: '12px', 
            overflow: 'hidden',
            background: 'rgba(9, 9, 11, 0.4)',
            transition: 'all 0.3s ease'
        }}>
            <div 
                onClick={() => setIsOpen(!isOpen)}
                style={{ 
                    padding: '1.25rem 1.5rem', 
                    cursor: 'pointer', 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    background: 'rgba(255,255,255,0.02)',
                    userSelect: 'none'
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <span style={{ 
                        fontSize: '1rem', 
                        transform: isOpen ? 'rotate(90deg)' : 'rotate(0deg)', 
                        transition: 'transform 0.3s' 
                    }}>
                        ▶
                    </span>
                    <h2 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0, color: isOpen ? 'white' : 'var(--muted)' }}>
                        {title}
                    </h2>
                    {badge && (
                        <span style={{ fontSize: '0.65rem', background: 'var(--primary)', color: 'white', padding: '2px 8px', borderRadius: '10px', fontWeight: 800 }}>
                            {badge}
                        </span>
                    )}
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>
                    {isOpen ? 'Ocultar' : 'Expandir'}
                </div>
            </div>
            
            <div style={{ 
                maxHeight: isOpen ? '2000px' : '0px', 
                overflow: 'hidden', 
                transition: 'max-height 0.5s cubic-bezier(0, 1, 0, 1)',
                background: 'transparent'
            }}>
                <div style={{ padding: '1.5rem' }}>
                    {children}
                </div>
            </div>
        </div>
    );
}

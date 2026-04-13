export function assertNoTemplateLeaks(html: string): void {
    const unresolved = html.match(/\$\{[^}]+\}|\{{2,}[^{}]+\}{2,}|<%[^%]+%>/g);
    if (unresolved?.length) {
        throw new Error(`Template leaks detectados: ${[...new Set(unresolved)].join(', ')}`);
    }
}

export function assertNoDegenerateBodySignature(html: string): void {
    const bodyClassMatch = html.match(/<body[^>]*class="([^"]+)"/i);
    const bodyClass = bodyClassMatch?.[1] || '';

    const degenerateFlags = [
        'page-surface-flat',
        'system-grid',
        'skeleton-conversion',
        'strategy-proof-distributed',
        'strategy-cta-terminal',
        'cadence-alternating',
        'family-minimal_authority'
    ];

    const matched = degenerateFlags.filter((flag) => bodyClass.includes(flag));

    if (matched.length >= 6) {
        throw new Error(`Firma visual degenerada detectada en <body>: ${matched.join(', ')}`);
    }
}

export function assertNoRepeatedBoilerplate(html: string): void {
    const suspiciousFragments = [
        'Nuestro equipo de especialistas en nuestro equipo especializado',
        'La transparencia en los costes y la calidad de los materiales son los pilares de nuestro servicio de nuestro equipo especializado',
        'Atendemos de forma inmediata en todos los barrios',
        'herramientas avanzadas y repuestos homologados'
    ];

    const offenders = suspiciousFragments.filter((fragment) => html.includes(fragment));

    if (offenders.length > 0) {
        throw new Error(`Boilerplate repetitivo detectado: ${offenders.join(' | ')}`);
    }
}
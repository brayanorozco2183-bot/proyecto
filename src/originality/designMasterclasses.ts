import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { PageDesignDNA } from '../types/design.js';
import { pickSeeded } from '../utils/designSeed.js';

export interface DesignMasterclass {
    masterclass_id: string;
    title: string;
    niche_patterns: string[];
    dna: Partial<PageDesignDNA>;
    block_variants: Record<string, string>;
    art_direction_notes: string;
    tension_curve: string[];
    seed: Record<string, any>;
}

let cachedMasterclasses: DesignMasterclass[] = [];

export function loadMasterclasses(masterclassDir: string): DesignMasterclass[] {
    if (cachedMasterclasses.length > 0) return cachedMasterclasses;
    
    if (!existsSync(masterclassDir)) return [];

    try {
        const files = readdirSync(masterclassDir).filter(f => f.endsWith('.json'));
        const loaded: DesignMasterclass[] = [];

        for (const file of files) {
            const content = readFileSync(join(masterclassDir, file), 'utf8');
            const parsed = JSON.parse(content);
            
            // Sanitize to satisfy DesignMasterclass interface
            const sanitized: DesignMasterclass = {
                masterclass_id: parsed.masterclass_id || parsed.id || 'unknown',
                title: parsed.title || 'Untitled Masterclass',
                niche_patterns: Array.isArray(parsed.niche_patterns) ? parsed.niche_patterns : [],
                dna: parsed.dna || parsed.design_system_injection || {},
                block_variants: parsed.block_variants || parsed.block_blueprints || {},
                art_direction_notes: parsed.art_direction_notes || parsed.art_direction?.palette_name || '',
                tension_curve: Array.isArray(parsed.tension_curve) ? parsed.tension_curve : [],
                seed: parsed.seed || parsed.architecture || {}
            };
            
            loaded.push(sanitized);
        }

        cachedMasterclasses = loaded;
        return loaded;
    } catch (error) {
        console.error('[Masterclass] Error loading masterclasses:', error);
        return [];
    }
}

export function findMasterclassForNiche(niche: string, masterclasses: DesignMasterclass[] = [], seed?: string): DesignMasterclass | null {
    const lowNiche = String(niche || '').toLowerCase().trim();
    if (!lowNiche || !Array.isArray(masterclasses) || masterclasses.length === 0) return null;

    const candidates = masterclasses.filter(m => {
        const patterns = Array.isArray(m?.niche_patterns) ? m.niche_patterns : [];
        return patterns
            .map((p) => String(p || '').toLowerCase().trim())
            .filter(Boolean)
            .some((p) => lowNiche.includes(p));
    });

    if (candidates.length === 0) return null;
    if (candidates.length === 1 || !seed) return candidates[0];

    return pickSeeded(candidates, seed);
}

export function buildMasterclassDirective(masterclass: DesignMasterclass): string {
    const dna = masterclass.dna || {};
    const blockVariants = masterclass.block_variants || {};
    const tensionCurve = masterclass.tension_curve || [];
    const seed = masterclass.seed || {};

    return `
=== MASTERCLASS DE DISEÑO PREMIUM ACTIVADA: ${masterclass.title} ===
Esta página debe seguir una estrategia de diseño de ALTA FIDELIDAD basada en un ejemplar maestro de éxito.

DNA OBJETIVO:
- Personalidad: ${dna.personality || 'n/a'}
- Familia: ${dna.family || 'n/a'}
- Sistema Visual: ${dna.visualSystem || 'n/a'}
- Esqueleto: ${dna.pageSkeleton || 'n/a'}

VARIANTE DE BLOQUES PREFERIDAS:
${Object.entries(blockVariants).length > 0 
    ? Object.entries(blockVariants).map(([k, v]) => `- ${k}: ${v}`).join('\n')
    : 'No especificadas'}

NOTAS DE DIRECCIÓN DE ARTE:
${masterclass.art_direction_notes || 'Seguir estética premium estándar.'}

RITMO VISUAL (Tensión): ${tensionCurve.length > 0 ? tensionCurve.join(' -> ') : 'n/a'}
NIVEL DE ASIMETRÍA: ${seed.asymmetryLevel || '5'}/10
`;
}

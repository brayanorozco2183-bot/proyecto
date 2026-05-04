import { dbManager } from '../db/index.js';
import { StructuralFingerprint } from '../types/pipeline_v2.js';

export interface Fingerprint {
    pageType: string;
    family: string;
    heroTreatment: string;
    sectionCadence: string;
    surfaceStyle: string;
    blockVariantSequence: string[];
    structural?: StructuralFingerprint;
}

export async function recordFingerprint(fingerprint: Fingerprint) {
    const db = await dbManager.getDB();
    await db.run(`
        INSERT INTO fingerprints (page_type, family, hero_treatment, section_cadence, surface_style, block_sequence, structural_json)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [
        fingerprint.pageType,
        fingerprint.family,
        fingerprint.heroTreatment,
        fingerprint.sectionCadence,
        fingerprint.surfaceStyle,
        JSON.stringify(fingerprint.blockVariantSequence),
        fingerprint.structural ? JSON.stringify(fingerprint.structural) : null
    ]);
}

export async function getRecentFingerprints(limit: number = 15): Promise<Fingerprint[]> {
    try {
        const db = await dbManager.getDB();
        const rows = await db.all('SELECT * FROM fingerprints ORDER BY created_at DESC LIMIT ?', [limit]);
        return rows.map(row => ({
            pageType: row.page_type,
            family: row.family,
            heroTreatment: row.hero_treatment,
            sectionCadence: row.section_cadence,
            surfaceStyle: row.surface_style,
            blockVariantSequence: JSON.parse(row.block_sequence || '[]'),
            structural: row.structural_json ? JSON.parse(row.structural_json) : undefined
        }));
    } catch (e) {
        console.warn('[DesignMemory] Error loading fingerprints:', e);
        return [];
    }
}

export async function scoreRepetitionRisk(candidate: Fingerprint): Promise<number> {
    const recent = await getRecentFingerprints();
    let score = 0;

    for (const entry of recent) {
        // 1. Penalize repeating hero + family + cadence
        if (
            entry.heroTreatment === candidate.heroTreatment &&
            entry.family === candidate.family &&
            entry.sectionCadence === candidate.sectionCadence
        ) {
            score += 0.5;
        }

        // 2. Penalize repeating the same sequence of 3 blocks
        if (candidate.blockVariantSequence.length >= 3 && entry.blockVariantSequence.length >= 3) {
            const candidateSeq = candidate.blockVariantSequence.slice(0, 3).join('|');
            const entrySeq = entry.blockVariantSequence.slice(0, 3).join('|');
            if (candidateSeq === entrySeq) {
                score += 0.3;
            }
        }

        // 3. NEW: Penalize structural similarity (Structural Fingerprint)
        if (candidate.structural && entry.structural) {
            const s1 = candidate.structural;
            const s2 = entry.structural;

            // Check if block order is identical
            if (JSON.stringify(s1.order) === JSON.stringify(s2.order)) {
                score += 0.4;
            }

            // Check if visual shells pattern is identical
            if (JSON.stringify(s1.shells) === JSON.stringify(s2.shells)) {
                score += 0.3;
            }

            // Check if composition + cadence + hero combo matches
            if (s1.composition === s2.composition && s1.cadence === s2.cadence && s1.hero === s2.hero) {
                score += 0.2;
            }
        }
    }

    return score;
}

export async function getUnderusedFamilies(allFamilies: string[]): Promise<string[]> {
    const recent = await getRecentFingerprints(50);
    const counts: Record<string, number> = {};
    allFamilies.forEach(f => counts[f] = 0);
    
    recent.forEach(entry => {
        if (counts[entry.family] !== undefined) {
            counts[entry.family]++;
        }
    });

    return allFamilies.sort((a, b) => counts[a] - counts[b]);
}

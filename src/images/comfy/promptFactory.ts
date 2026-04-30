import { vault } from '../../tools/vault.js';
import { PageImageBrief, PageImageContext } from '../types.js';
import { appendLoRATriggerWords, selectLoRAsForImage } from './loraCatalog.js';

function buildStableSeed(input: string): number {
    let hash = 2166136261;
    for (let i = 0; i < input.length; i += 1) {
        hash ^= input.charCodeAt(i);
        hash = Math.imul(hash, 16777619);
    }
    return Math.abs(hash >>> 0);
}

function normalizeLabel(value?: string, fallback = ''): string {
    return String(value || fallback).trim();
}

function sanitizeSectionLabel(value?: string): string {
    return normalizeLabel(value, '')
        .replace(/^\W+|\W+$/g, '')
        .replace(/\s+/g, ' ');
}

function uniqueFragments(fragments: string[]): string[] {
    const seen = new Set<string>();

    return fragments
        .map(fragment => String(fragment || '').trim())
        .filter(Boolean)
        .filter(fragment => {
            const key = fragment.toLowerCase();
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
        });
}

function buildSecondaryLocalCue(city: string): string {
    return `subtle secondary location cues related to ${city}, never a skyline or wide cityscape`;
}

function buildComposedNegativePrompt(base?: string): string {
    const extraNegatives = [
        'wide aerial view',
        'skyline',
        'cityscape',
        'landscape panorama',
        'tourism photo',
        'empty street',
        'architectural overview',
        'distant subject',
        'tiny subject',
        'background as main focus',
        'generic office stock photo',
        'posed handshake',
        'illustration',
        'cgi',
        '3d render'
    ];

    return uniqueFragments([
        ...String(base || '')
            .split(',')
            .map(part => part.trim())
            .filter(Boolean),
        ...extraNegatives
    ]).join(', ');
}

function buildHeroPrompt(niche: string, city: string, h1?: string): string {
    const heading = sanitizeSectionLabel(h1);

    const fragments = uniqueFragments([
        'professional commercial photography',
        heading,
        `${niche}`,
        `real hands-on work related to ${niche}`,
        'the job itself is the main subject',
        'focus on action, process, craft, intervention or task execution',
        'tools, materials, equipment or key service objects clearly visible',
        'close-up or medium shot',
        'authentic professional environment',
        'human presence or clear evidence of ongoing work',
        'real materials, realistic textures, believable details',
        'natural light',
        'clean composition with visual breathing room for headline overlay',
        'high trust, premium but natural look',
        'avoid landmarks and broad city views',
        'no text, no logo, no watermark'
    ]);

    if (vault.COMFY_FORCE_LOCAL_REALISM) {
        fragments.splice(4, 0, buildSecondaryLocalCue(city));
    }

    return fragments.join(', ');
}

function buildEditorialPrompt(niche: string, city: string, section: string): string {
    const cleanSection = sanitizeSectionLabel(section);

    const fragments = uniqueFragments([
        'documentary style support image',
        `${niche}`,
        cleanSection,
        `specific task or service moment related to ${niche}`,
        'action-focused composition',
        'tools, materials, equipment or service objects clearly visible',
        'close-up or medium shot',
        'credible working detail, not a landscape',
        'authentic professional environment',
        'human, believable, commercially useful scene',
        'real materials and spatial detail',
        'clean editorial framing',
        'avoid emphasizing the city over the work itself',
        'no text, no logo, no watermark'
    ]);

    if (vault.COMFY_FORCE_LOCAL_REALISM) {
        fragments.splice(4, 0, buildSecondaryLocalCue(city));
    }

    return fragments.join(', ');
}

export function buildBriefForSlot(slot: string, sectionTitle: string | undefined, context: PageImageContext): PageImageBrief {
    const kind = slot === 'hero-default' ? 'hero' : 'editorial';
    // Resolución mínima premium: evita heroes pixelados en desktop.
    // Si el workflow externo fuerza otra resolución, finalizePageImages ajusta width/height al archivo real.
    const width = kind === 'hero' ? 1280 : 1024;
    const height = kind === 'hero' ? 896 : 768;
    const seed = buildStableSeed(`${context.pageId}|${slot}|${context.niche}|${context.city}|${sectionTitle || ''}`);
    const niche = normalizeLabel(context.niche, 'servicio local');
    const city = normalizeLabel(context.city, 'tu zona');
    const section = sanitizeSectionLabel(sectionTitle) || (kind === 'hero' ? normalizeLabel(context.h1, niche) : 'apoyo editorial del servicio');

    const loraSelection = selectLoRAsForImage({
        niche,
        slot,
        kind,
        sectionTitle: section
    });

    const basePrompt = kind === 'hero'
        ? buildHeroPrompt(niche, city, context.h1)
        : buildEditorialPrompt(niche, city, section);

    return {
        pageId: context.pageId,
        slot,
        kind,
        niche,
        city,
        businessName: context.businessName,
        prompt: appendLoRATriggerWords(basePrompt, loraSelection.loras),
        negativePrompt: buildComposedNegativePrompt(vault.COMFY_NEGATIVE_PROMPT),
        alt: kind === 'hero'
            ? `${niche} en ${city} · imagen principal del servicio`
            : `${niche} en ${city} · imagen editorial de apoyo`,
        caption: '',

        seed,
        width,
        height,
        sectionTitle: section || undefined,
        outputSlug: context.outputSlug,
        modelHints: {
            unet: vault.COMFY_UNET_MODEL,
            clip: vault.COMFY_CLIP_MODEL,
            t5: vault.COMFY_T5_MODEL,
            vae: vault.COMFY_VAE_MODEL
        },
        loras: loraSelection.loras,
        debug: {
            matchedLoRaKeys: loraSelection.matchedKeys,
            selectionNotes: loraSelection.notes
        }
    };
}

import { vault } from '../../tools/vault.js';
import { ImageSlot, PageImageLoRA } from '../types.js';

interface JsonLoRAEntry {
    name: string;
    strengthModel?: number;
    strengthClip?: number;
    triggerWords?: string[] | string;
    notes?: string;
    priority?: number;
    whenKinds?: string[] | string;
    whenSlots?: string[] | string;
    whenSectionIncludes?: string[] | string;
    whenNicheIncludes?: string[] | string;
    enabled?: boolean;
}

interface JsonLoRAConfig {
    [key: string]: JsonLoRAEntry | JsonLoRAEntry[];
}

interface SelectionInput {
    niche: string;
    slot: ImageSlot;
    kind: 'hero' | 'editorial';
    sectionTitle?: string;
}

interface SelectionResult {
    loras: PageImageLoRA[];
    matchedKeys: string[];
    notes: string[];
}

interface CandidateKey {
    key: string;
    score: number;
    reason: string;
}

interface RankedLoRA extends PageImageLoRA {
    _score: number;
    _priority: number;
    _sourceKey: string;
}

const NICHE_ALIASES: Record<string, string[]> = {
    locksmith: ['cerraj', 'cerradura', 'bombin', 'cilindro', 'llave', 'candado', 'cierrepuertas', 'locksmith', 'lock', 'key'],
    plumber: ['fontan', 'tuber', 'fuga', 'desatas', 'atasco', 'desague', 'grifo', 'cisterna', 'plumber', 'pipe', 'drain'],
    electrician: ['electric', 'enchufe', 'cuadro electrico', 'interruptor', 'iluminacion', 'electrician', 'wiring'],
    hvac: ['climat', 'aire acondicionado', 'caldera', 'termo', 'aeroterm', 'calefaccion', 'hvac', 'ac repair', 'heating'],
    painter: ['pintor', 'pintura', 'fachada', 'barniz', 'lacado', 'paint', 'painting'],
    cleaning: ['limpieza', 'limpiar', 'cleaning', 'cleaner', 'desinfeccion'],
    carpentry: ['carpint', 'madera', 'armario', 'puerta', 'wood', 'joinery', 'cabinet'],
    roofing: ['tejado', 'cubierta', 'impermeabil', 'roof', 'roofing', 'goteras'],
    gardening: ['jardin', 'cesped', 'podar', 'paisajismo', 'garden', 'gardening', 'lawn'],
    moving: ['mudanza', 'portes', 'traslado', 'moving', 'removal'],
    pest_control: ['plaga', 'fumig', 'cucaracha', 'chinche', 'rata', 'termita', 'pest', 'rodent'],
    solar: ['solar', 'placa solar', 'fotovolta', 'panel solar'],
    remodeling: ['reforma', 'albanil', 'albañil', 'obra', 'renovation', 'remodel'],
    glazing: ['cristal', 'cristaler', 'ventana', 'glass', 'glazing'],
    flooring: ['suelo', 'tarima', 'parquet', 'flooring', 'laminate']
};

const DEFAULT_MAX_PER_IMAGE = 2;
const DEFAULT_STRENGTH_MODEL = 0.75;
const DEFAULT_STRENGTH_CLIP = 0.75;
const MIN_STRENGTH = -4;
const MAX_STRENGTH = 4;

let cachedRulesRaw = '';
let cachedRules: JsonLoRAConfig = {};

function normalize(value: string): string {
    return String(value || '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9\s:_-]+/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

function slugify(value: string): string {
    return normalize(value).replace(/\s+/g, '-');
}

function tokenize(value: string): string[] {
    return normalize(value)
        .split(/[\s:_-]+/)
        .map(token => token.trim())
        .filter(Boolean);
}

function uniqueStrings(values: Array<string | undefined | null>): string[] {
    const seen = new Set<string>();
    const out: string[] = [];

    for (const raw of values) {
        const value = String(raw || '').trim();
        const key = normalize(value);
        if (!key || seen.has(key)) continue;
        seen.add(key);
        out.push(value);
    }

    return out;
}

function splitFlexibleList(value: unknown): string[] {
    if (Array.isArray(value)) {
        return uniqueStrings(value.map(item => String(item || '').trim()).filter(Boolean));
    }

    return uniqueStrings(
        String(value || '')
            .split(/[,\n;|]+/g)
            .map(item => item.trim())
            .filter(Boolean)
    );
}

function toFiniteNumber(value: unknown, fallback: number): number {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
}

function clamp(value: number, min: number, max: number): number {
    return Math.min(Math.max(value, min), max);
}

function isEnabledFlag(value: unknown, fallback = false): boolean {
    if (typeof value === 'boolean') return value;
    const text = normalize(String(value || ''));
    if (!text) return fallback;
    if (['1', 'true', 'yes', 'si', 'on'].includes(text)) return true;
    if (['0', 'false', 'no', 'off'].includes(text)) return false;
    return fallback;
}

function normalizeKeyVariants(value: string): string[] {
    const normalized = normalize(value);
    const slug = slugify(value);

    return uniqueStrings([
        normalized,
        slug
    ]);
}

function textIncludesNeedle(haystack: string, needle: string): boolean {
    const h = normalize(haystack);
    const n = normalize(needle);
    if (!h || !n) return false;

    if (h === n) return true;
    if (h.includes(n)) return true;

    const haystackTokens = new Set(tokenize(h));
    const needleTokens = tokenize(n);

    if (needleTokens.length === 1) {
        return haystackTokens.has(needleTokens[0]);
    }

    return needleTokens.every(token => haystackTokens.has(token));
}

function extractSlotKeys(slot: ImageSlot): string[] {
    const raw = slot as any;

    return uniqueStrings([
        raw?.id,
        raw?.key,
        raw?.slotId,
        raw?.name,
        raw?.type,
        raw?.role,
        raw?.kind,
        raw?.placement,
        raw?.variant
    ].flatMap(value => normalizeKeyVariants(String(value || ''))));
}

function normalizeRuleList(value: JsonLoRAEntry | JsonLoRAEntry[] | undefined): JsonLoRAEntry[] {
    if (!value) return [];
    return Array.isArray(value) ? value : [value];
}

function parseJsonRules(): JsonLoRAConfig {
    const raw = String(vault.COMFY_LORA_RULES_JSON || '').trim();

    if (!raw) {
        cachedRulesRaw = '';
        cachedRules = {};
        return {};
    }

    if (raw === cachedRulesRaw) {
        return cachedRules;
    }

    try {
        const parsed = JSON.parse(raw);
        cachedRulesRaw = raw;
        cachedRules = parsed && typeof parsed === 'object' ? parsed as JsonLoRAConfig : {};
        return cachedRules;
    } catch (error: any) {
        console.warn(`[LoRA Catalog] COMFY_LORA_RULES_JSON inválido: ${error.message}`);
        cachedRulesRaw = raw;
        cachedRules = {};
        return {};
    }
}

function buildCategoryMatches(niche: string, sectionTitle?: string): string[] {
    const text = normalize(`${niche} ${sectionTitle || ''}`);
    const scored = Object.entries(NICHE_ALIASES)
        .map(([key, aliases]) => {
            let score = 0;

            for (const alias of aliases) {
                const normalizedAlias = normalize(alias);
                if (!normalizedAlias) continue;

                if (text === normalizedAlias) {
                    score = Math.max(score, 120);
                    continue;
                }

                if (textIncludesNeedle(text, normalizedAlias)) {
                    score = Math.max(score, normalizedAlias.length >= 5 ? 95 : 70);
                }
            }

            return { key, score };
        })
        .filter(item => item.score > 0)
        .sort((a, b) => b.score - a.score || a.key.localeCompare(b.key));

    return scored.map(item => item.key);
}

function getConfiguredMaxPerImage(): number {
    const configured = toFiniteNumber(vault.COMFY_LORA_MAX_PER_IMAGE, DEFAULT_MAX_PER_IMAGE);
    return Math.max(1, Math.floor(configured));
}

function buildCandidateKeys(input: SelectionInput): CandidateKey[] {
    const niche = normalize(input.niche);
    const nicheSlug = slugify(input.niche);
    const section = normalize(input.sectionTitle || '');
    const sectionSlug = slugify(input.sectionTitle || '');
    const slotKeys = extractSlotKeys(input.slot);
    const categories = buildCategoryMatches(input.niche, input.sectionTitle);

    const candidates: CandidateKey[] = [];

    const push = (key: string, score: number, reason: string) => {
        const normalizedKey = normalize(key);
        if (!normalizedKey) return;
        candidates.push({ key: normalizedKey, score, reason });
    };

    for (const value of uniqueStrings([niche, nicheSlug])) {
        push(value, 100, 'niche exacto');
        push(`${value}:${input.kind}`, 115, 'niche + kind');
        push(`${input.kind}:${value}`, 114, 'kind + niche');
    }

    for (const category of categories) {
        push(category, 90, 'categoria inferida');
        push(`${category}:${input.kind}`, 110, 'categoria + kind');
        push(`${input.kind}:${category}`, 109, 'kind + categoria');
    }

    if (section) {
        for (const value of uniqueStrings([section, sectionSlug])) {
            push(`section:${value}`, 85, 'titulo de seccion');
            push(`${input.kind}:section:${value}`, 92, 'kind + titulo de seccion');
        }
    }

    for (const slotKey of slotKeys) {
        push(`slot:${slotKey}`, 95, 'slot');
        push(`${input.kind}:slot:${slotKey}`, 105, 'kind + slot');
        push(`slot:${slotKey}:${input.kind}`, 104, 'slot + kind');

        for (const category of categories) {
            push(`${category}:slot:${slotKey}`, 120, 'categoria + slot');
            push(`${category}:${input.kind}:slot:${slotKey}`, 130, 'categoria + kind + slot');
        }
    }

    push(`kind:${input.kind}`, 60, 'kind canonico');
    push(input.kind, 55, 'kind legacy');
    push(`${input.kind}-default`, 50, 'default por kind');
    push('all', 1, 'fallback global');

    const bestByKey = new Map<string, CandidateKey>();

    for (const candidate of candidates) {
        const existing = bestByKey.get(candidate.key);
        if (!existing || candidate.score > existing.score) {
            bestByKey.set(candidate.key, candidate);
        }
    }

    return Array.from(bestByKey.values())
        .sort((a, b) => b.score - a.score || a.key.localeCompare(b.key));
}

function ruleApplies(entry: JsonLoRAEntry, input: SelectionInput): boolean {
    if (entry.enabled === false) return false;

    const nicheText = normalize(input.niche);
    const sectionText = normalize(input.sectionTitle || '');
    const slotKeys = extractSlotKeys(input.slot);
    const slotKeySet = new Set(slotKeys.map(normalize));

    const whenKinds = splitFlexibleList(entry.whenKinds).map(normalize);
    if (whenKinds.length && !whenKinds.includes(normalize(input.kind))) {
        return false;
    }

    const whenSlots = splitFlexibleList(entry.whenSlots).map(normalize);
    if (whenSlots.length && !whenSlots.some(slot => slotKeySet.has(slot))) {
        return false;
    }

    const whenSectionIncludes = splitFlexibleList(entry.whenSectionIncludes);
    if (whenSectionIncludes.length && !whenSectionIncludes.some(value => textIncludesNeedle(sectionText, value))) {
        return false;
    }

    const whenNicheIncludes = splitFlexibleList(entry.whenNicheIncludes);
    if (whenNicheIncludes.length && !whenNicheIncludes.some(value => textIncludesNeedle(nicheText, value))) {
        return false;
    }

    return true;
}

function toRankedLoRA(entry: JsonLoRAEntry, matchKey: string, score: number): RankedLoRA | null {
    const name = String(entry?.name || '').trim();
    if (!name) return null;

    const strengthModel = clamp(
        toFiniteNumber(entry?.strengthModel, toFiniteNumber(vault.COMFY_LORA_DEFAULT_STRENGTH, DEFAULT_STRENGTH_MODEL)),
        MIN_STRENGTH,
        MAX_STRENGTH
    );

    const strengthClip = clamp(
        toFiniteNumber(entry?.strengthClip, toFiniteNumber(vault.COMFY_LORA_DEFAULT_CLIP_STRENGTH, DEFAULT_STRENGTH_CLIP)),
        MIN_STRENGTH,
        MAX_STRENGTH
    );

    const triggerWords = splitFlexibleList(entry?.triggerWords);
    const priority = Math.floor(toFiniteNumber(entry?.priority, 0));

    return {
        name,
        strengthModel,
        strengthClip,
        triggerWords,
        matchKey,
        notes: String(entry?.notes || '').trim() || undefined,
        _score: score,
        _priority: priority,
        _sourceKey: matchKey
    };
}

function mergeRankedLoRAs(items: RankedLoRA[]): RankedLoRA[] {
    const map = new Map<string, RankedLoRA>();

    const sorted = [...items].sort((a, b) =>
        b._score - a._score ||
        b._priority - a._priority ||
        a.name.localeCompare(b.name)
    );

    for (const item of sorted) {
        const dedupKey = normalize(item.name);
        const existing = map.get(dedupKey);

        if (!existing) {
            map.set(dedupKey, {
                ...item,
                triggerWords: uniqueStrings(item.triggerWords || [])
            });
            continue;
        }

        existing.triggerWords = uniqueStrings([
            ...(existing.triggerWords || []),
            ...(item.triggerWords || [])
        ]);

        existing.notes = uniqueStrings([
            existing.notes,
            item.notes
        ]).join(' | ') || undefined;
    }

    return Array.from(map.values()).sort((a, b) =>
        b._score - a._score ||
        b._priority - a._priority ||
        a.name.localeCompare(b.name)
    );
}

function stripInternalFields(items: RankedLoRA[]): PageImageLoRA[] {
    return items.map(item => ({
        name: item.name,
        strengthModel: item.strengthModel,
        strengthClip: item.strengthClip,
        triggerWords: uniqueStrings(item.triggerWords || []),
        matchKey: item.matchKey,
        notes: item.notes
    }));
}

export function appendLoRATriggerWords(prompt: string, loras: PageImageLoRA[]): string {
    const basePrompt = String(prompt || '').trim();
    const existingPromptNormalized = normalize(basePrompt);

    const triggerWords = uniqueStrings(
        loras.flatMap(lora => Array.isArray(lora.triggerWords) ? lora.triggerWords : [])
    ).filter(word => !textIncludesNeedle(existingPromptNormalized, word));

    if (!triggerWords.length) return basePrompt;
    return [basePrompt, ...triggerWords].filter(Boolean).join(', ');
}

export function selectLoRAsForImage(input: SelectionInput): SelectionResult {
    if (!isEnabledFlag(vault.COMFY_LORA_ENABLED, false)) {
        return {
            loras: [],
            matchedKeys: [],
            notes: ['LoRA desactivado por configuración.']
        };
    }

    const rules = parseJsonRules();
    const candidates = buildCandidateKeys(input);
    const matchedKeys: string[] = [];
    const notes: string[] = [];
    const ranked: RankedLoRA[] = [];

    for (const candidate of candidates) {
        const entries = normalizeRuleList(rules[candidate.key]);
        if (!entries.length) continue;

        const applicableEntries = entries.filter(entry => ruleApplies(entry, input));
        if (!applicableEntries.length) continue;

        matchedKeys.push(candidate.key);

        for (const entry of applicableEntries) {
            const rankedLoRA = toRankedLoRA(entry, candidate.key, candidate.score);
            if (rankedLoRA) ranked.push(rankedLoRA);
        }
    }

    const max = getConfiguredMaxPerImage();
    const merged = mergeRankedLoRAs(ranked);
    const selected = merged.slice(0, max);
    const publicLoRAs = stripInternalFields(selected);

    if (matchedKeys.length) {
        notes.push(`Keys aplicadas: ${uniqueStrings(matchedKeys).join(', ')}`);
    }

    if (publicLoRAs.length) {
        notes.push(
            `Se aplicarán ${publicLoRAs.length} LoRA(s): ${publicLoRAs
                .map(item => `${item.name} [m:${item.strengthModel}, c:${item.strengthClip}]`)
                .join(', ')}`
        );
    } else {
        notes.push('No hay reglas LoRA configuradas o aplicables para este nicho, slot y kind.');
    }

    return {
        loras: publicLoRAs,
        matchedKeys: uniqueStrings(matchedKeys),
        notes
    };
}
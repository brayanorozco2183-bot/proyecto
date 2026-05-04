import { ColorPalette, HSL, ArtDirection } from '../types.js';

/**
 * A simple seed-based PRNG using the sfc32 algorithm.
 */
export class Random {
    private a: number;
    private b: number;
    private c: number;
    private d: number;

    constructor(seed: string) {
        let h = 2166136261 >>> 0;
        for (let i = 0; i < seed.length; i++) {
            h = Math.imul(h ^ seed.charCodeAt(i), 16777619);
        }

        this.a = h >>> 0;
        this.b = (h ^ 0xdeadbeef) >>> 0;
        this.c = (h ^ 0x8badf00d) >>> 0;
        this.d = (h ^ 0xfacefeed) >>> 0;
    }

    next(): number {
        this.a >>>= 0; this.b >>>= 0; this.c >>>= 0; this.d >>>= 0;
        let t = (this.a + this.b | 0) + this.d | 0;
        this.d = this.d + 1 | 0;
        this.a = this.b ^ this.b >>> 9;
        this.b = this.c + (this.c << 3) | 0;
        this.c = (this.c << 21 | this.c >>> 11);
        this.c = this.c + t | 0;
        return (t >>> 0) / 4294967296;
    }

    between(min: number, max: number): number {
        return min + this.next() * (max - min);
    }

    pick<T>(array: T[]): T {
        return array[Math.floor(this.next() * array.length)];
    }
}

export interface RGBA {
    r: number;
    g: number;
    b: number;
}

export function hslToRgb(h: number, s: number, l: number): RGBA {
    h /= 360;
    s /= 100;
    l /= 100;
    let r, g, b;

    if (s === 0) {
        r = g = b = l; // achromatic
    } else {
        const hue2rgb = (p: number, q: number, t: number) => {
            if (t < 0) t += 1;
            if (t > 1) t -= 1;
            if (t < 1 / 6) return p + (q - p) * 6 * t;
            if (t < 1 / 2) return q;
            if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
            return p;
        };
        const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        const p = 2 * l - q;
        r = hue2rgb(p, q, h + 1 / 3);
        g = hue2rgb(p, q, h);
        b = hue2rgb(p, q, h - 1 / 3);
    }

    return {
        r: Math.round(r * 255),
        g: Math.round(g * 255),
        b: Math.round(b * 255)
    };
}

export function getLuminance({ r, g, b }: RGBA): number {
    const a = [r, g, b].map(v => {
        v /= 255;
        return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    });
    return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
}

export function getContrastRatio(rgb1: RGBA, rgb2: RGBA): number {
    const l1 = getLuminance(rgb1) + 0.05;
    const l2 = getLuminance(rgb2) + 0.05;
    return l1 > l2 ? l1 / l2 : l2 / l1;
}

export function generateHarmoniousPalette(rng: Random, artDirection: ArtDirection): ColorPalette {
    // 1. Pick Base Hue family based on Art Direction
    const baseHue = getBaseHueForDirection(rng, artDirection);

    // 2. Determine Dark Mode preference
    const isDark = artDirection === 'premium_split' || artDirection === 'editorial_dark' || rng.next() > 0.6;

    // 3. Set constraints based on Art Direction
    const constraints = getColorConstraints(artDirection, isDark);

    // 4. Generate Palette Roles
    const bg: HSL = {
        h: baseHue,
        s: constraints.bgS,
        l: constraints.bgL
    };

    const text: HSL = {
        h: baseHue,
        s: 5,
        l: isDark ? 95 : 5
    };

    const primary: HSL = {
        h: baseHue,
        s: constraints.primaryS,
        l: constraints.primaryL
    };

    const accentHue = (baseHue + constraints.accentOffset) % 360;
    const accent: HSL = {
        h: accentHue,
        s: constraints.accentS,
        l: constraints.accentL
    };

    const surfaceL = isDark ? bg.l + 5 : bg.l - 3;
    const borderL = isDark ? bg.l + 10 : bg.l - 8;

    // Heading colors with forced contrast
    const headingL = isDark ? 95 : 15;
    const headingAccentL = isDark ? primary.l + 10 : primary.l - 10;

    return {
        primary: `hsl(${Math.round(primary.h)}, ${Math.round(primary.s)}%, ${Math.round(primary.l)}%)`,
        secondary: `hsl(${Math.round(baseHue)}, ${Math.round(constraints.primaryS * 0.4)}%, ${isDark ? 30 : 80}%)`,
        accent: `hsl(${Math.round(accent.h)}, ${Math.round(accent.s)}%, ${Math.round(accent.l)}%)`,
        background: `hsl(${Math.round(bg.h)}, ${Math.round(bg.s)}%, ${Math.round(bg.l)}%)`,
        text: `hsl(${Math.round(text.h)}, ${Math.round(text.s)}%, ${Math.round(text.l)}%)`,
        surface: `hsl(${Math.round(bg.h)}, ${Math.round(bg.s + 2)}%, ${Math.round(surfaceL)}%)`,
        surfaceAlt: `hsl(${Math.round(bg.h)}, ${Math.round(bg.s + 4)}%, ${isDark ? bg.l + 3 : bg.l - 2}%)`,
        surfaceText: `hsl(${Math.round(text.h)}, ${Math.round(text.s)}%, ${Math.round(text.l)}%)`,
        border: `hsl(${Math.round(bg.h)}, ${Math.round(bg.s + 5)}%, ${Math.round(borderL)}%)`,
        muted: `hsl(${Math.round(baseHue)}, 5%, ${isDark ? 65 : 40}%)`,
        heading: `hsl(${Math.round(bg.h)}, ${Math.round(bg.s)}, ${headingL}%)`,
        headingAccent: `hsl(${Math.round(primary.h)}, ${Math.round(primary.s)}, ${Math.round(headingAccentL)}%)`
    };
}

function getBaseHueForDirection(rng: Random, direction: ArtDirection): number {
    switch (direction) {
        case 'premium_split':
        case 'authority_modern':
            return rng.pick([220, 240, 260, 20]); // Navy, Deep Purple, Gold/Bronze
        case 'technical_grid':
            return rng.pick([180, 210, 0, 140]); // Cyan, Blue, Red, Green
        case 'local_trust':
        case 'service_magazine':
            return rng.pick([30, 45, 120, 200]); // Orange, Yellow, Green, Friendly Blue
        case 'conversion_clean':
            return rng.pick([0, 210, 340]); // Red, Strong Blue, Magenta
        case 'editorial_dark':
            return rng.pick([0, 200, 40]); // Black/Grey, Cool Grey, Sepia
        case 'minimal_luxury':
        default:
            return rng.pick([200, 215, 230]); // Trust Blues
    }
}

function getColorConstraints(direction: ArtDirection, isDark: boolean) {
    const defaults = {
        bgS: isDark ? 8 : 2,
        bgL: isDark ? 6 : 98,
        primaryS: 60,
        primaryL: 50,
        accentS: 80,
        accentL: 55,
        accentOffset: 30
    };

    switch (direction as string) {
        case 'premium_split':
        case 'authority_modern':
            return { ...defaults, primaryS: 30, primaryL: isDark ? 40 : 30, accentS: 40, accentL: 60, accentOffset: 180 };
        case 'editorial_dark':
            return { ...defaults, bgS: 0, primaryS: 0, primaryL: 20, accentS: 90, accentL: 45, accentOffset: 0 };
        case 'technical_grid':
            return { ...defaults, bgS: 15, bgL: isDark ? 4 : 96, primaryS: 90, primaryL: 45, accentOffset: 90 };
        case 'conversion_clean':
            return { ...defaults, primaryS: 90, primaryL: 40, accentS: 100, accentL: 50, accentOffset: 120 };
        case 'local_trust':
        case 'service_magazine':
            return { ...defaults, bgL: isDark ? 10 : 97, primaryS: 70, primaryL: 45, accentOffset: 40 };
        default:
            return defaults;
    }
}

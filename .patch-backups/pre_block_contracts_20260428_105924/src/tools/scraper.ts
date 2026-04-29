import { BrowserContext, Page } from 'playwright';
import * as path from 'path';
import * as fs from 'fs';
import { exec } from 'child_process';

// Deep Trap for Playwright Internal Unhandled Rejections (CDP Session issues)
if (process.env.NODE_ENV !== 'test') {
    process.on('unhandledRejection', (reason: any) => {
        if (reason?.message?.includes('cdpSession.send') || reason?.message?.includes('Target page, context or browser has been closed')) {
            // Silently swallow internal CDP errors that Playwright fails to catch
            return;
        }
        console.error('[CRITICAL] Unhandled Rejection:', reason);
    });
}

// Moveremos las importaciones pesadas al interior para evitar bloqueos en el arranque de la API
let chromium: any;
let ghostCursor: any;

async function ensureScraperDeps() {
    if (chromium) return;
    const { chromium: chromiumExtra } = await import('playwright-extra');
    const { default: stealth } = await import('puppeteer-extra-plugin-stealth');
    const { createCursor } = await import('ghost-cursor');

    chromium = chromiumExtra;
    chromium.use((stealth as any)());
    ghostCursor = createCursor;
}

export interface LocalSearchResult {
    title: string;
    link: string;
    snippet: string;
    position: number;
}

export interface LocalBusinessData {
    name: string;
    rating?: number;
    reviews?: number;
    address?: string;
    phone?: string;
    website?: string;
    position?: number;
}

export interface CompetitorAudit {
    url: string;
    title: string;
    description: string;
    wordCount: number;
    h1s: string[];
    h2s: string[];
    h3s: string[];
    images: { src: string, alt: string }[];
    internalLinks: number;
    externalLinks: number;
}

function normalizeSerpUrl(raw: string): string | null {
    try {
        const url = new URL(String(raw || '').trim().replace(/[).,;]+$/, ''));
        url.hash = '';
        const pathname = url.pathname === '/' ? '' : url.pathname.replace(/\/+$/, '');
        return `${url.protocol}//${url.host}${pathname}${url.search}`;
    } catch {
        return null;
    }
}


const CITY_SIGNAL_LEXICON = [
    'madrid', 'barcelona', 'valencia', 'sevilla', 'zaragoza', 'malaga', 'murcia', 'alicante', 'bilbao', 'valladolid',
    'cordoba', 'granada', 'vigo', 'gijon', 'oviedo', 'santander', 'pamplona', 'toledo', 'getafe', 'mostoles', 'leganes'
];

function normalizeMissionToken(value: string): string {
    return String(value || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
}

function detectServiceFamily(value: string): string | null {
    const normalized = normalizeMissionToken(value);
    if (!normalized) return null;

    const families: Array<[string, RegExp]> = [
        ['cerrajeros', /cerraj|cerradur|bombin|cilindr|antibumping|llave|candado/],
        ['fontaneros', /fontan|plomer|desatas|tuber|fuga|grifo/],
        ['electricistas', /electric|cuadro-electrico|enchufe|cableado|iluminacion/],
        ['carpinteros', /carpint|ebanist|madera|armario|puerta-de-madera|tarima/],
        ['pintores', /pintor|pintura|barniz|lacado|fachada|decor/]
    ];

    for (const [family, pattern] of families) {
        if (pattern.test(normalized)) return family;
    }

    return null;
}

function hasForeignCitySignal(raw: string, city: string): boolean {
    const haystack = normalizeMissionToken(raw);
    const target = normalizeMissionToken(city);
    if (!haystack || !target) return false;

    return CITY_SIGNAL_LEXICON.some((candidate) => {
        if (candidate === target) return false;
        return haystack.includes(candidate);
    });
}

function filterMissionRelevantUrls(urls: string[], query: string, city: string): string[] {
    const intendedFamily = detectServiceFamily(query);

    return urls.filter((url) => {
        const normalized = normalizeSerpUrl(url);
        if (!normalized || isBannedSerpUrl(normalized)) return false;

        const urlFamily = detectServiceFamily(normalized);
        if (intendedFamily && urlFamily && intendedFamily !== urlFamily) {
            return false;
        }

        if (hasForeignCitySignal(normalized, city)) {
            return false;
        }

        return true;
    });
}

function isBannedSerpUrl(raw: string): boolean {
    const normalized = normalizeSerpUrl(raw);
    if (!normalized) return true;

    try {
        const hostname = new URL(normalized).hostname.toLowerCase();
        if (/(^|\.)google\./.test(hostname)) return true;
        if (/(^|\.)(schema\.org|w3\.org)$/.test(hostname)) return true;
        if (/(^|\.)(facebook\.com|twitter\.com|instagram\.com|linkedin\.com|youtube\.com|pinterest\.com)$/.test(hostname)) return true;
        if (/(^|\.)(gstatic\.com|googleusercontent\.com)$/.test(hostname)) return true;
        return false;
    } catch {
        return true;
    }
}

/**
 * SERPManager - The World-Class 'Military Grade' Stealth Engine (V6 - 2026 Behavioral AI).
 */
export class SERPManager {
    private async delay(min: number, max: number) {
        const ms = Math.floor(Math.random() * (max - min) + min);
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Aplica la fachada de Puppeteer a la página de Playwright
     */
    private applyPuppeteerFacade(page: Page) {
        const patchElement = (el: any) => {
            if (!el) return el;
            if (el.asElement) return el;
            el.asElement = () => el;
            el.remoteObject = () => ({ objectId: 'fake' });
            return el;
        };

        (page as any).browser = () => ({
            userAgent: async () => await page.evaluate(() => navigator.userAgent),
            version: async () => '120.0',
            isConnected: () => true
        });

        (page as any).target = () => ({
            _targetId: 'fake',
            _targetInfo: { browserName: 'chrome' }
        });

        const _orig$ = page.$;
        (page as any).$ = async (s: string) => patchElement(await _orig$.call(page, s));
        const _orig$$ = page.$$;
        (page as any).$$ = async (s: string) => {
            const res = await _orig$$.call(page, s);
            return res.map(el => patchElement(el));
        };

        (page as any)._client = () => ({
            send: async (method: string, params: any) => {
                if (method === 'Browser.getWindowForTarget') return { bounds: { width: 1280, height: 720 } };
                if (method === 'DOM.getContentQuads' || method === 'DOM.scrollIntoViewIfNeeded') {
                    return { quads: [[0, 0, 100, 0, 100, 100, 0, 100]] };
                }
                return {};
            }
        });
    }

    private async handleGoogleConsent(page: Page, cursor: any) {
        const selectors = [
            'button:has-text("Aceptar todo")',
            'button#L2AGLb',
            'button:has-text("Aceptar")',
            'div[role="none"] button:first-child',
            'button[aria-label="Aceptar todo"]'
        ];

        for (const s of selectors) {
            try {
                const btn = await page.$(s);
                if (btn && await btn.isVisible()) {
                    console.log(`[STEALTH] Consentimiento detectado (${s}). Despejando...`);
                    await (cursor as any).move(s);
                    await btn.click({ force: true });
                    await this.delay(2000, 4000);
                    return true;
                }
            } catch (e) { }
        }
        return false;
    }

    private async humanType(page: Page, selector: string, text: string) {
        await page.click(selector, { force: true });
        for (const char of text) {
            if (Math.random() < 0.03 && /[a-z]/i.test(char)) {
                const wrongChars = 'abcdefghijklmnopqrstuvwxyz';
                const wrongChar = wrongChars[Math.floor(Math.random() * wrongChars.length)];
                await page.keyboard.press(wrongChar);
                await this.delay(100, 250);
                await this.delay(200, 500);
                await page.keyboard.press('Backspace');
                await this.delay(150, 300);
            }
            await page.keyboard.press(char);
            await (Math.random() < 0.2 ? this.delay(150, 400) : this.delay(50, 120));
        }
    }

    private async warmupSession(page: Page, cursor: any) {
        console.log("🔥 [STEALTH] Calentando cookie y sesión con navegación errática...");
        try {
            await page.goto('https://es.wikipedia.org/wiki/Especial:Aleatoria', { waitUntil: 'domcontentloaded' });
            await this.delay(2000, 4000);
            await cursor.move({ x: Math.random() * 800 + 200, y: Math.random() * 600 + 200 });
            await page.mouse.wheel(0, 300 + Math.random() * 500);
            await this.delay(1500, 3000);
        } catch (e) {
            console.log("⚠️ [STEALTH] Warmup parcial.");
        }
    }

    private async createIncognitoContext(): Promise<{ browser: any, context: BrowserContext }> {
        let execPath = path.join(process.env.ProgramFiles || '', 'Google', 'Chrome', 'Application', 'chrome.exe');
        if (!fs.existsSync(execPath)) {
            execPath = path.join(process.env['ProgramFiles(x86)'] || '', 'Google', 'Chrome', 'Application', 'chrome.exe');
        }

        console.log(`[STEALTH] Lanzando motor Incógnito Puro (Aislado)...`);

        const browser = await chromium.launch({
            executablePath: fs.existsSync(execPath) ? execPath : undefined,
            headless: false,
            channel: 'chrome',
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-blink-features=AutomationControlled',
                '--incognito',
                '--start-maximized'
            ],
            ignoreDefaultArgs: ['--enable-automation']
        });

        const context = await browser.newContext({
            viewport: null,
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        });

        return { browser, context };
    }

    async scrapeUnifiedSERP(query: string, city: string): Promise<{ organic: LocalSearchResult[], localPack: LocalBusinessData[] }> {
        const fullQuery = `${query} ${city}`;
        console.log(`[STEALTH] Atraco Unificado SDI (PowerShell): ${fullQuery}`);

        return new Promise((resolve) => {
            const scriptPath = path.join(process.cwd(), 'src', 'tools', 'sdi_extraction.ps1');
            const psCommand = `powershell -ExecutionPolicy Bypass -File "${scriptPath}" -query "${query}" -city "${city}"`;
            const outputFile = path.join(process.env.TEMP || '', 'google_serp_results.txt');

            if (fs.existsSync(outputFile)) {
                try {
                    fs.unlinkSync(outputFile);
                } catch {
                    // ignore stale result cleanup errors
                }
            }

            exec(psCommand, async (error: any, stdout: string, stderr: string) => {

                if (fs.existsSync(outputFile)) {
                    const content = fs.readFileSync(outputFile, 'utf8');
                    const banned = ['w3.org', 'schema.org', 'facebook.com', 'twitter.com', 'instagram.com', 'linkedin.com', 'youtube.com', 'pinterest.com'];
                    const seen = new Set<string>();
                    const links = content.split('\n')
                        .map(l => l.trim())
                        .map(l => l.replace(/[).,;]+$/, ''))
                        .map(l => l.replace(/[?#].*$/, ''))
                        .map(l => l.replace(/\/+$/, ''))
                        .filter(l => {
                            if (!l.startsWith('http') || l.length <= 10) return false;
                            try {
                                const parsed = new URL(l);
                                const host = parsed.hostname.toLowerCase();
                                if (/(^|\.)google\.[a-z.]+$/i.test(host)) return false;
                                if (banned.some(domain => host === domain || host.endsWith(`.${domain}`))) return false;
                                const key = `${parsed.protocol}//${host}${parsed.pathname.replace(/\/+$/, '')}`;
                                if (seen.has(key)) return false;
                                seen.add(key);
                                return true;
                            } catch {
                                return false;
                            }
                        });

                    const missionSafeLinks = filterMissionRelevantUrls(links, fullQuery, city);
                    const selectedLinks = (missionSafeLinks.length ? missionSafeLinks : links).slice(0, 10);

                    if (missionSafeLinks.length !== links.length) {
                        console.log(`[STEALTH] Filtrado de relevancia aplicado. ${missionSafeLinks.length}/${links.length} enlaces compatibles con ${fullQuery}.`);
                    }

                    const organic: LocalSearchResult[] = selectedLinks.map((link, i) => ({
                        title: `Resultado SDI ${i + 1}`,
                        link: link,
                        snippet: 'Capturado vía Inyección de Teclas (SDI)',
                        position: i + 1
                    }));

                    // Nota: El método SDI actual se centra en links orgánicos. 
                    // El Local Pack requiere parseo específico del HTML capturado si se desea.
                    // Por ahora devolvemos lo orgánico para no bloquear el flujo.
                    console.log(`[STEALTH] SDI Finalizado. ${organic.length} enlaces capturados.`);
                    resolve({ organic, localPack: [] });
                } else {
                    console.error("[STEALTH] Fallo en SDI: No se generó el archivo de resultados.");
                    resolve({ organic: [], localPack: [] });
                }
            });
        });
    }

    async auditCompetitor(url: string): Promise<CompetitorAudit | null> {
        await ensureScraperDeps();
        let browser: any = null;
        let page: Page | null = null;
        
        try {
            const { browser: b, context } = await this.createIncognitoContext();
            browser = b;
            
            let isAborted = false;
            browser.on('disconnected', () => { isAborted = true; });

            page = await context.newPage();
            
            // Ultra-defensive page trapping
            (page as any).on('error', () => { isAborted = true; });
            page.on('crash', () => { isAborted = true; });

            console.log(`[STEALTH] Deep Audit (Incógnito): ${url}`);
            
            await page.route('**/*', r => {
                if (isAborted) return r.abort().catch(() => {});
                return ['media', 'font', 'other', 'stylesheet'].includes(r.request().resourceType()) 
                    ? r.abort().catch(() => {}) 
                    : r.continue().catch(() => {});
            });

            try {
                const cleanUrl = url.trim().replace(/[).,;]+$/, '');
                // Racing with a hard death timer to prevent CDP hang
                await Promise.race([
                    page.goto(cleanUrl, { waitUntil: 'domcontentloaded', timeout: 30000 }),
                    new Promise((_, reject) => setTimeout(() => reject(new Error('HARD_TIMEOUT')), 35000))
                ]);
            } catch (e: any) {
                console.warn(`[STEALTH] Navigation skip [${url}]: ${e.message}`);
                return null;
            }

            if (isAborted || !page) return null;

            const audit = await page.evaluate((u) => {
                try {
                    const h1s = Array.from(document.querySelectorAll('h1')).map(el => el.textContent?.trim() || '');
                    const wordCount = (document.body.innerText || '').split(/\s+/).length;
                    return {
                        url: u,
                        title: document.title,
                        description: document.querySelector('meta[name="description"]')?.getAttribute('content') || '',
                        wordCount,
                        h1s,
                        h2s: Array.from(document.querySelectorAll('h2')).map(el => el.textContent?.trim() || '').slice(0, 10),
                        h3s: Array.from(document.querySelectorAll('h3')).map(el => el.textContent?.trim() || '').slice(0, 10),
                        images: [],
                        internalLinks: 0,
                        externalLinks: 0
                    };
                } catch (e) { return null; }
            }, url).catch(() => null);

            return audit as CompetitorAudit;
        } catch (error: any) {
            console.warn(`[STEALTH] Audit loop protection triggered: ${error.message}`);
            return null;
        } finally {
            // Scavenger cleanup: Force closure with extreme prejudice
            if (browser) {
                try {
                    // We don't await this to avoid staying stuck in the loop if CDP is dead
                    browser.close().catch(() => {});
                    // Wait slightly for the signal to propagate locally
                    await new Promise(r => setTimeout(r, 500));
                } catch (e) {}
            }
        }
    }
}
export const serpManager = new SERPManager();



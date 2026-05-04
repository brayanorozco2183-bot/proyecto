import { chromium, Browser, BrowserContext, Page } from 'playwright';
import fs from 'fs/promises';
import path from 'path';

export interface UXValidationIssue {
    viewport: string;
    type: 'layout' | 'a11y' | 'visual';
    severity: 'error' | 'warning';
    message: string;
    selector?: string;
}

export interface UXValidationResult {
    passed: boolean;
    issues: UXValidationIssue[];
    screenshots: string[];
}

export class UXValidator {
    private static viewports = [
        { name: 'mobile-small', width: 360, height: 800 },
        { name: 'mobile-standard', width: 390, height: 844 },
        { name: 'tablet', width: 768, height: 1024 },
        { name: 'desktop-small', width: 1024, height: 1366 },
        { name: 'desktop-standard', width: 1440, height: 900 }
    ];

    static async validate(html: string, missionId: string): Promise<UXValidationResult> {
        const issues: UXValidationIssue[] = [];
        const screenshots: string[] = [];
        const outputDir = path.join(process.cwd(), 'output_sites', 'ux-audit', missionId);
        
        await fs.mkdir(outputDir, { recursive: true });

        const browser = await chromium.launch();
        
        try {
            for (const vp of this.viewports) {
                const context = await browser.newContext({
                    viewport: { width: vp.width, height: vp.height },
                    deviceScaleFactor: 1
                });
                const page = await context.newPage();
                await page.setContent(html);
                
                // Wait for any animations/lazy loading
                await page.waitForTimeout(500);

                const vpIssues = await this.auditViewport(page, vp.name);
                issues.push(...vpIssues);

                if (vpIssues.some(i => i.severity === 'error')) {
                    const scPath = path.join(outputDir, `fail-${vp.name}.png`);
                    await page.screenshot({ path: scPath, fullPage: true });
                    screenshots.push(scPath);
                } else if (vp.name === 'mobile-standard' || vp.name === 'desktop-standard') {
                    // Always take a sample for key viewports
                    const scPath = path.join(outputDir, `pass-${vp.name}.png`);
                    await page.screenshot({ path: scPath, fullPage: true });
                    screenshots.push(scPath);
                }

                await context.close();
            }
        } finally {
            await browser.close();
        }

        return {
            passed: !issues.some(i => i.severity === 'error'),
            issues,
            screenshots
        };
    }

    private static async auditViewport(page: Page, vpName: string): Promise<UXValidationIssue[]> {
        const issues: UXValidationIssue[] = [];

        // 1. Horizontal Overflow Check
        const hasOverflow = await page.evaluate(() => {
            return document.documentElement.scrollWidth > window.innerWidth;
        });
        if (hasOverflow) {
            issues.push({
                viewport: vpName,
                type: 'layout',
                severity: 'error',
                message: 'Horizontal scroll detected (layout breakage).'
            });
        }

        // 2. Main CTA Visibility Check (especially on mobile)
        if (vpName.startsWith('mobile')) {
            const ctaVisible = await page.evaluate(() => {
                const ctas = Array.from(document.querySelectorAll('a.cta-primary, .el-nav-cta, .cta-panel__action'));
                return ctas.some(cta => {
                    const rect = cta.getBoundingClientRect();
                    return rect.width > 0 && rect.height > 0 && rect.top < 5000; // Inside a reasonable area
                });
            });
            if (!ctaVisible) {
                issues.push({
                    viewport: vpName,
                    type: 'visual',
                    severity: 'error',
                    message: 'Primary CTA is not visible or missing on mobile.'
                });
            }
        }

        // 3. Min Font Size Check
        const smallText = await page.evaluate(() => {
            const elements = Array.from(document.querySelectorAll('p, span, li, a'));
            return elements.some(el => {
                const style = window.getComputedStyle(el);
                const size = parseFloat(style.fontSize);
                return size < 12; // Standard accessibility threshold
            });
        });
        if (smallText) {
            issues.push({
                viewport: vpName,
                type: 'a11y',
                severity: 'warning',
                message: 'Found text elements smaller than 12px.'
            });
        }

        // 4. Accessibility Audit (Headings & Alts)
        const a11yIssues = await page.evaluate(() => {
            const errors: string[] = [];
            // Alt tags
            const imgs = Array.from(document.querySelectorAll('img'));
            if (imgs.some(img => !img.alt)) errors.push('Missing alt attributes on images.');

            // Aria expanded on details
            const details = Array.from(document.querySelectorAll('details'));
            // Details doesn't strictly need aria-expanded but we can check summary for focusability
            const summaries = Array.from(document.querySelectorAll('summary'));
            if (summaries.some(s => s.getAttribute('tabindex') === '-1')) errors.push('Summary elements must be focusable.');

            return errors;
        });
        
        a11yIssues.forEach(msg => {
            issues.push({
                viewport: vpName,
                type: 'a11y',
                severity: msg.includes('alt') ? 'error' : 'warning',
                message: msg
            });
        });

        // 5. Table Adaptability
        if (vpName.startsWith('mobile')) {
            const tableBroken = await page.evaluate(() => {
                const tables = Array.from(document.querySelectorAll('table'));
                return tables.some(t => {
                    const parent = t.parentElement;
                    const style = parent ? window.getComputedStyle(parent) : null;
                    return t.scrollWidth > window.innerWidth && (!style || style.overflowX !== 'auto');
                });
            });
            if (tableBroken) {
                issues.push({
                    viewport: vpName,
                    type: 'layout',
                    severity: 'error',
                    message: 'Table causing horizontal overflow on mobile (not responsive).'
                });
            }
        }

        return issues;
    }
}
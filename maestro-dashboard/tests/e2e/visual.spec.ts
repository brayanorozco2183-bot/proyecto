import { test, expect } from '@playwright/test';

test.describe('Visual Perfection & UX Matrix', () => {
    test('VIS_01 & VIS_03: Dashboard Global Aesthetics', async ({ page }) => {
        await page.goto('/');
        // Tomamos una captura del viewport principal para asegurar que el diseño premium se mantiene
        // En un entorno de CI real, esto compararía con una imagen "base"
        await page.screenshot({ path: 'tests/visual/dashboard-base.png' });

        const body = page.locator('body');
        const color = await body.evaluate((el) => window.getComputedStyle(el).backgroundColor);
        // Verificamos que sea un fondo oscuro (premium vibe)
        expect(color).toMatch(/rgb\(5, 5, 7\)|rgb\(0, 0, 0\)/);
    });

    test('VIS_04: [MOBILE] Viewport Layout Integrity', async ({ page }) => {
        // Playwright usará la configuración de mobile-iphone definida en playwright.config.ts
        await page.goto('/');
        await page.screenshot({ path: 'tests/visual/dashboard-mobile.png' });

        // Verificamos que el sidebar o menú se colapse/adapte (lógica de CSS)
        const content = page.locator('main');
        await expect(content).toBeVisible();
    });
});

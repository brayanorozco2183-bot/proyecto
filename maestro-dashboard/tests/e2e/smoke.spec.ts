import { test, expect } from '@playwright/test';

test('E2E_01: Landing Page Smoke Test', async ({ page }) => {
    await page.goto('/');
    // Verificamos que el título o un elemento core esté presente
    await expect(page).toHaveTitle(/SEO Maestro/i);
    const heading = page.getByRole('heading', { level: 1 });
    await expect(heading).toBeVisible();
});

test('E2E_05: UI Theme Injection Check', async ({ page }) => {
    await page.goto('/');
    // Verificamos que no haya errores de hidratación visibles o clases rotas
    const body = page.locator('body');
    await expect(body).toHaveClass(/min-h-screen/);
});

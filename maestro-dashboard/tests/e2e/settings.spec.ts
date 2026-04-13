import { test, expect } from '@playwright/test';

test.describe('Site Settings & Connection', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/');
        // Navegar a ajustes si es necesario o esperar a que el componente cargue
    });

    test('E2E_03: Site Settings: End-to-End "Test Connection" Handshake', async ({ page }) => {
        // Localizamos los campos de configuración
        const wpUrl = page.locator('input[placeholder*="tu-web.com"]');
        const wpUser = page.locator('input[placeholder*="admin"]');
        const wpPass = page.locator('input[type="password"]');
        const testBtn = page.getByRole('button', { name: /Test Connection/i });

        // Llenamos datos de prueba (Inválidos para forzar error controlado o Válidos si hubiera mock)
        await wpUrl.fill('https://example.com');
        await wpUser.fill('testuser');
        await wpPass.fill('testpass');

        await testBtn.click();

        // Verificamos que aparezca el feedback (Cargando -> Error o Éxito)
        // Nota: Como no tenemos un WP real conectado, esperamos un error manejado profesionalmente
        await expect(page.locator('text=/Error|Falló|Invalid|Fallo/i')).toBeVisible({ timeout: 15000 });
    });

    test('E2E_06: [NEGATIVE] Handling Empty Connection Data', async ({ page }) => {
        const wpUrl = page.locator('input[placeholder*="tu-web.com"]');

        // Esperemos un momento para asegurar que la hidratación inicial (useEffect) ha ocurrido
        await page.waitForTimeout(1000);

        await wpUrl.fill(''); // Forzamos vacío
        const testBtn = page.getByRole('button', { name: /Test Connection/i });
        await testBtn.click();

        // Debería mostrar un aviso de campos requeridos o similar
        await expect(page.getByText(/URL requerida|Inválido/i)).toBeVisible({ timeout: 10000 });
    });
});

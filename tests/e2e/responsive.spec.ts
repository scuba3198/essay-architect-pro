import { test, expect } from '@playwright/test';

test.describe('Responsive Design', () => {
    test('Mobile Viewport (375x667)', async ({ page }) => {
        await page.setViewportSize({ width: 375, height: 667 });
        await page.goto('/');

        // Check hamburger menu
        await expect(page.locator('button').filter({ has: page.locator('svg.lucide-menu') })).toBeVisible();

        // Check hero heading font size or layout (visually)
        await expect(page).toHaveScreenshot('landing-mobile.png');
    });

    test('Tablet Viewport (768x1024)', async ({ page }) => {
        await page.setViewportSize({ width: 768, height: 1024 });
        await page.goto('/');

        // Header should likely show full nav or still hamburger depending on breakpoint
        // Let's just check visual consistency
        await expect(page).toHaveScreenshot('landing-tablet.png');
    });

    test('Wizard is responsive', async ({ page, isMobile }) => {
        await page.goto('/');
        await page.getByRole('button', { name: /Get Started/i }).click();

        if (isMobile) {
            // Mobile wizard layout checks
            await expect(page.getByText(/Step 1/i)).toBeVisible();
            await expect(page).toHaveScreenshot('wizard-mobile.png');
        } else {
            await expect(page).toHaveScreenshot('wizard-desktop.png');
        }
    });
});

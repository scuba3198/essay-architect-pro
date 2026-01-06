import { test, expect } from '@playwright/test';

test.describe('Landing Page', () => {
    test('should load the landing page successfully', async ({ page }) => {
        await page.goto('/');

        // Check title
        await expect(page).toHaveTitle(/Essay Architect Pro/);

        // Check main heading
        await expect(page.getByRole('heading', { name: /The Architectural Standard/i })).toBeVisible();

        // Check main CTA
        await expect(page.getByRole('button', { name: /Get Started/i })).toBeVisible();
    });

    test('should have a functional navigation menu on mobile', async ({ page, isMobile }) => {
        test.skip(!isMobile, 'Only for mobile');
        await page.goto('/');

        // Check hamburger menu
        const menuButton = page.locator('button').filter({ has: page.locator('svg.lucide-menu') });
        await expect(menuButton).toBeVisible();
        await menuButton.click();

        // Check if menu links are visible
        await expect(page.getByText(/About/i)).toBeVisible();
        await expect(page.getByText(/Pricing/i)).toBeVisible();
    });

    test('visual regression: landing page', async ({ page }) => {
        await page.goto('/');
        // Hide dynamic elements or wait for them if necessary
        await expect(page).toHaveScreenshot('landing-page.png', { fullPage: true });
    });
});

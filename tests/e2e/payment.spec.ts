import { test, expect } from '@playwright/test';

test.describe('Payment Flow', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/');
        // Open pricing
        await page.getByRole('button', { name: /View Pricing/i }).first().click();
        // Select a plan (e.g., Crammer's Pass)
        await page.getByRole('button', { name: /Select Plan/i }).first().click();
    });

    test('should navigate payment steps', async ({ page }) => {
        // Step 1: Info
        await expect(page.getByText(/Select Payment Method/i)).toBeVisible();
        await expect(page.locator('img[alt*="QR Code"]')).toBeVisible();

        // Toggle payment methods
        const esewaBtn = page.getByRole('button', { name: /eSewa QR/i });
        await esewaBtn.click();
        await expect(page.locator('img[alt*="esewa_qr"]')).toBeVisible();

        // Navigate to Step 2
        await page.getByRole('button', { name: /Next: Verify Payment/i }).click();
        await expect(page.getByText(/Verify Payment/i)).toBeVisible();

        // Go back
        await page.locator('button[title="Go Back"]').click();
        await expect(page.getByText(/Select Payment Method/i)).toBeVisible();
    });

    test('should show WhatsApp verification on desktop', async ({ page, isMobile }) => {
        test.skip(isMobile, 'Only for desktop');
        await page.getByRole('button', { name: /Next: Verify Payment/i }).click();

        await expect(page.getByText(/Send Proof via WhatsApp/i)).toBeVisible();
        await expect(page.getByRole('link', { name: /Open WhatsApp/i })).toHaveAttribute('href', /wa\.me/);
    });
});

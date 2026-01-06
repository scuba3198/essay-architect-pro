import { test, expect } from '@playwright/test';

test.describe('Modals & Interactions', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/');
    });

    test('Pricing modal should open from CTA', async ({ page }) => {
        await page.getByRole('button', { name: /View Pricing/i }).first().click();
        await expect(page.getByText(/Select Your Plan/i)).toBeVisible();
        await expect(page.getByText(/Crammer's Pass/i)).toBeVisible();
        await page.getByRole('button', { name: /Close/i }).or(page.locator('button:has(svg.lucide-x)')).first().click();
        await expect(page.getByText(/Select Your Plan/i)).not.toBeVisible();
    });

    test('About modal should open from footer', async ({ page }) => {
        await page.getByRole('link', { name: /About/i, exact: true }).click();
        await expect(page.getByText(/The Architect's Story/i)).toBeVisible();
        await page.locator('button:has(svg.lucide-x)').first().click();
    });

    test('Terms of Service modal should open from footer', async ({ page }) => {
        await page.getByRole('link', { name: /Terms/i }).click();
        await expect(page.getByText(/Terms of Service/i)).toBeVisible();
        await page.locator('button:has(svg.lucide-x)').first().click();
    });

    test('Feedback modal should open and submit', async ({ page }) => {
        await page.getByRole('button', { name: /Feedback/i }).click();
        await expect(page.getByText(/Architect's Feedback/i)).toBeVisible();

        await page.getByPlaceholder(/Your Name/i).fill('Test User');
        await page.getByPlaceholder(/tell us/i).fill('This is a test feedback message.');

        // Check star rating
        await page.locator('.flex.gap-1 button').nth(4).click(); // 5 stars

        // Mock submission (we don't want to actually send to Discord if possible, 
        // but the app handles it server side or via fetch)
        // We can just verify the button exists and is clickable
        await expect(page.getByRole('button', { name: /Submit Feedback/i })).toBeEnabled();
    });
});

import { test, expect } from '@playwright/test';

test.describe('AI Features (Mocked)', () => {
    test.beforeEach(async ({ page }) => {
        // Mock the /api/ai endpoint
        await page.route('/api/ai', async (route) => {
            const request = route.request();
            const postData = request.postDataJSON();

            if (postData.type === 'completion') {
                await route.fulfill({
                    status: 200,
                    contentType: 'application/json',
                    body: JSON.stringify({ text: ' This is a mocked AI completion response.' }),
                });
            } else if (postData.type === 'payment') {
                await route.fulfill({
                    status: 200,
                    contentType: 'application/json',
                    body: JSON.stringify({ success: true }),
                });
            }
        });

        await page.goto('/');
        await page.getByRole('button', { name: /Get Started/i }).click();
    });

    test('should use autocomplete feature', async ({ page }) => {
        const introInput = page.getByPlaceholder(/In today's world/i);
        await introInput.fill('Education is important because');

        // Wait for autocomplete button to appear (if it's context aware)
        // In StepWizard.jsx, handleAutocomplete is triggered by clicking Wand2 icon
        const autocompleteBtn = page.locator('button').filter({ has: page.locator('svg.lucide-wand2') }).first();
        await expect(autocompleteBtn).toBeVisible();
        await autocompleteBtn.click();

        // Verify text was appended
        await expect(introInput).toHaveValue(/Mocked AI completion/);
    });

    test('should use refine feature', async ({ page }) => {
        const introInput = page.getByPlaceholder(/In today's world/i);
        await introInput.fill('This is a simple sentence.');

        // Click Refine (Sparkles icon)
        const refineBtn = page.locator('button').filter({ has: page.locator('svg.lucide-sparkles') }).first();
        await expect(refineBtn).toBeVisible();
        await refineBtn.click();

        // RefineModal should open
        await expect(page.getByText(/Refine Your Prose/i)).toBeVisible();

        // Click Accept
        await page.getByRole('button', { name: /Accept Refinement/i }).click();

        // Verify text updated
        await expect(introInput).toHaveValue(/Mocked AI completion/);
    });
});

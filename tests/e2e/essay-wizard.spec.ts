import { test, expect } from '@playwright/test';

test.describe('Essay Wizard', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/');
        // Scroll to the wizard section if needed, or just find it
        await page.getByRole('button', { name: /Get Started/i }).click();
    });

    test('should complete the 4-step essay writing flow', async ({ page }) => {
        // Step 1: Introduction
        await expect(page.getByText(/Step 1: Introduction/i)).toBeVisible();
        await page.getByPlaceholder(/In today's world/i).fill('This is a test introduction for the essay architect.');
        await page.getByRole('button', { name: /Next/i }).click();

        // Step 2: Body Paragraph 1
        await expect(page.getByText(/Step 2: Body Paragraph 1/i)).toBeVisible();
        await page.getByPlaceholder(/Firstly,/i).fill('This is the first body paragraph of my test essay.');
        await page.getByRole('button', { name: /Next/i }).click();

        // Step 3: Body Paragraph 2
        await expect(page.getByText(/Step 3: Body Paragraph 2/i)).toBeVisible();
        await page.getByPlaceholder(/Secondly,/i).fill('This is the second body paragraph of my test essay.');
        await page.getByRole('button', { name: /Next/i }).click();

        // Step 4: Conclusion
        await expect(page.getByText(/Step 4: Conclusion/i)).toBeVisible();
        await page.getByPlaceholder(/In conclusion/i).fill('This is the test conclusion.');

        // Check word count
        const wordCount = page.locator('text=/Word Count:/');
        await expect(wordCount).toBeVisible();

        // Preview Section
        const preview = page.locator('section').filter({ hasText: /Preview/i });
        await expect(preview).toBeVisible();
        await expect(preview).toContainText('This is a test introduction');
    });

    test('should generate a random topic', async ({ page }) => {
        const topicInput = page.getByPlaceholder(/Enter your essay topic/i);
        const initialTopic = await topicInput.inputValue();

        await page.getByRole('button', { name: /Random Topic/i }).click();

        const newTopic = await topicInput.inputValue();
        expect(newTopic).not.toBe(initialTopic);
    });
});

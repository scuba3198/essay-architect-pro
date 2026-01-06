import { test as setup, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

const authFile = './playwright/.auth/user.json';

setup('authenticate', async ({ page }) => {
    // Ensure the directory exists
    const authDir = path.dirname(authFile);
    if (!fs.existsSync(authDir)) {
        fs.mkdirSync(authDir, { recursive: true });
    }

    // Navigation to the app
    await page.goto('/');

    // Wait for the page to load and find the login button in the header
    // Note: Using getByRole('button', { name: /Login/i }) can be ambiguous if modal is open or footer has it.
    // We want the one in the header.
    const headerLoginButton = page.locator('header').getByRole('button', { name: /Login/i });
    await headerLoginButton.click();

    // Wait for AuthModal to appear
    await expect(page.getByText(/welcome back/i)).toBeVisible();

    // Fill in credentials from environment variables
    await page.getByPlaceholder('name@example.com').fill(process.env.PLAYWRIGHT_TEST_USER || '');
    await page.getByPlaceholder('••••••••').fill(process.env.PLAYWRIGHT_TEST_PASS || '');

    // Click submit (the one that says exactly 'Login')
    await page.getByRole('button', { name: 'Login', exact: true }).click();

    // Wait for login to complete (modal closes or user name appears)
    await expect(page.getByText(/welcome back/i)).not.toBeVisible();

    // Save storage state for all tests
    await page.context().storageState({ path: authFile });
});

import { test, expect } from '@playwright/test';

test.describe('Session Management', () => {
    test('should persist session on refresh', async ({ page }) => {
        await page.goto('/');

        // If logged in, the login button should be replaced by User/Logout
        // In App.jsx, User section shows name or email
        const userMenu = page.locator('button').filter({ has: page.locator('svg.lucide-user') }).or(page.getByRole('button', { name: /Logout/i }));

        // Setup fixture ensures we are logged in for chromium/firefox/webkit projects
        await expect(userMenu).toBeVisible();

        await page.reload();
        await expect(userMenu).toBeVisible();
    });

    test('should logout successfully', async ({ page }) => {
        await page.goto('/');

        // Find logout button (might be hidden in a menu)
        const logoutBtn = page.getByRole('button', { name: /Logout/i });
        if (!(await logoutBtn.isVisible())) {
            // Try to click user icon first if it's a dropdown
            const userBtn = page.locator('button').filter({ has: page.locator('svg.lucide-user') });
            await userBtn.click();
        }

        await page.getByRole('button', { name: /Logout/i }).click();

        // Should see login button again
        await expect(page.getByRole('button', { name: /Login/i }).first()).toBeVisible();

        // Refresh should stay logged out
        await page.reload();
        await expect(page.getByRole('button', { name: /Login/i }).first()).toBeVisible();
    });
});

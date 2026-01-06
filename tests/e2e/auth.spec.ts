import { test, expect } from '@playwright/test';

// Reset storage state for auth tests to ensure we start logged out
test.use({ storageState: { cookies: [], origins: [] } });

test.describe('Authentication Flows', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/');
        // Use the header login button
        await page.locator('header').getByRole('button', { name: /Login/i }).click();
    });

    test('should toggle between Login and Sign Up', async ({ page }) => {
        await expect(page.getByText(/Welcome Back/i)).toBeVisible();

        await page.getByRole('button', { name: /Create Account/i }).click();
        await expect(page.getByText(/Create Account/i)).toBeVisible();
        await expect(page.getByText(/Start your architect journey/i)).toBeVisible();

        await page.getByRole('button', { name: /Log In Instead/i }).click();
        await expect(page.getByText(/Welcome Back/i)).toBeVisible();
    });

    test('should show error on invalid login', async ({ page }) => {
        await page.getByPlaceholder('name@example.com').fill('wrong@example.com');
        await page.getByPlaceholder('••••••••').fill('wrongpassword');
        await page.getByRole('button', { name: 'Login', exact: true }).click();

        // Exact error message depends on Supabase, but typically "Invalid login credentials"
        await expect(page.locator('div[class*="bg-red-50"]')).toBeVisible();
    });

    test('should open forgot password modal', async ({ page }) => {
        await page.getByRole('button', { name: /Forgot\?/i }).click();
        await expect(page.getByText(/Reset Password/i)).toBeVisible();
        await expect(page.getByText(/Enter your email to receive a reset link/i)).toBeVisible();

        await page.getByPlaceholder('name@example.com').fill('test@example.com');
        await expect(page.getByRole('button', { name: /Send Reset Link/i })).toBeVisible();
    });
});

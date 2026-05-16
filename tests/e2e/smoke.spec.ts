import { test, expect } from '@playwright/test';

test('landing page renders auth shell', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.brand h1')).toHaveText('BlackStack');
  await expect(page.locator('form[data-form="auth"]')).toBeVisible();
});

test('/healthz returns ok', async ({ request }) => {
  const res = await request.get('/healthz');
  expect(res.status()).toBe(200);
  const body = await res.json();
  expect(body.status).toBe('ok');
});

test('guest mode opens trainer chart preview', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: /continue as guest|try as guest/i }).first().click();
  await expect(page.getByText(/Basic Strategy Reference/i)).toBeVisible();
});

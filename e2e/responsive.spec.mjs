import { test, expect } from '@playwright/test';

// A real SQL/BFF login is required even for layout checks; no hardcoded UI session.
async function signIn(page) {
  await page.goto('/login');
  await page.locator('#username').fill('integration_admin');
  await page.locator('#password').fill('Hemo-Integration-Ci_2026!');
  await page.getByRole('button', { name: 'ورود', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'سامانه یکپارچه هموویژیلانس' })).toBeVisible();
}

test('Material shell and admission dashboard fit 390px mobile, drawer navigates', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await signIn(page);
  await expect(page.getByRole('button', { name: 'باز و بسته کردن منو' })).toBeVisible();
  await page.getByRole('button', { name: 'باز و بسته کردن منو' }).click();
  await expect(page.locator('mat-sidenav')).toBeVisible();
  await page.locator('mat-sidenav').getByRole('link', { name: /پذیرش/ }).click();
  await expect(page.getByRole('heading', { name: 'پذیرش و پرونده بیماران' })).toBeVisible();
  await expect(page.locator('mat-form-field')).toHaveCount(2);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 2);
  expect(overflow, 'mobile document must not scroll horizontally').toBeFalsy();
});

test('desktop Material workspace keeps docked nav and accessible form controls', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await signIn(page);
  await expect(page.locator('mat-sidenav')).toBeVisible();
  await expect(page.getByRole('button', { name: 'باز و بسته کردن منو' })).toHaveCount(0);
  await page.goto('/admission');
  const center = page.getByRole('combobox', { name: 'مرکز درمانی' });
  await expect(center).toBeVisible();
  await center.click();
  await page.getByRole('option', { name: 'Hospital A' }).click();
  await page.getByRole('combobox', { name: 'بخش', exact: true }).click();
  await page.getByRole('option', { name: 'ICU A' }).click();
  await expect(page.getByRole('link', { name: /ثبت پذیرش جدید/ })).toBeVisible();
});

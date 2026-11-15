import { test, expect } from '@playwright/test';

// Uses only the synthetic fixture installed by backend SQL integration CI.
// No real medical identities, secrets or clinical data are accessed.
test('ST-04 browser: login → admission → persisted reload → wristband → identity verification', async ({ page }) => {
  await page.goto('/login');
  await page.locator('#username').fill('integration_admin');
  await page.locator('#password').fill('Hemo-Integration-Ci_2026!');
  await page.getByRole('button', { name: 'ورود', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'سامانه یکپارچه هموویژیلانس' })).toBeVisible();

  await page.goto('/admission');
  await expect(page.getByRole('heading', { name: 'پذیرش و پرونده بیماران' })).toBeVisible();

  await page.getByRole('combobox', { name: 'مرکز درمانی' }).click();
  await page.getByRole('option', { name: 'Hospital A' }).click();
  await page.getByRole('combobox', { name: 'بخش', exact: true }).click();
  await page.getByRole('option', { name: 'ICU A' }).click();

  await page.getByRole('link', { name: /ثبت پذیرش جدید/ }).click();
  await expect(page.getByRole('heading', { name: 'پذیرش بیمار جدید' })).toBeVisible();

  await page.getByRole('checkbox', { name: 'بیمار مجهول‌الهویه' }).check();
  await page.locator('input[formControlName="firstName"]').fill('آزمون');
  await page.locator('input[formControlName="lastName"]').fill('مرورگر');
  await page.locator('input[formControlName="birthDateJalali"]').fill('۱۴۰۳/۰۱/۰۱');
  await page.getByRole('button', { name: 'ثبت بیمار و بستری' }).click();

  await expect(page).toHaveURL(/\/admission\/identity\/\d+\/\d+\/\d+/);
  const patientRoute = new URL(page.url());
  await expect(page.getByRole('heading', { name: 'پرونده بستری و کنترل هویت' })).toBeVisible();
  await expect(page.locator('.record-card').first()).toContainText('آزمون مرورگر');

  const firstIdentifier = (await page.locator('.record-card dl dd').nth(2).textContent())?.trim();
  expect(firstIdentifier).toMatch(/^UNK-/);

  await page.getByRole('button', { name: 'صدور بارکد مچ‌بند' }).click();
  const barcode = (await page.locator('#wristband span').textContent())?.trim();
  expect(barcode).toMatch(/^HEMO-/);

  await page.locator('input[formControlName="barcode"]').fill(barcode);
  await page.locator('input[formControlName="firstIdentifier"]').fill(firstIdentifier);
  await page.locator('input[formControlName="secondIdentifier"]').fill('آزمون مرورگر');
  await page.getByRole('checkbox', { name: 'کنترل‌های حضوری هویت انجام شده‌اند' }).check();
  await page.getByRole('button', { name: 'ثبت نتیجه تطبیق' }).click();
  await expect(page.getByRole('status')).toContainText('تطبیق هویت ثبت شد');

  await page.reload();
  await expect(page.locator('#wristband span')).toHaveText(barcode);
  await expect(page.locator('.record-card').first()).toContainText('آزمون مرورگر');

  const [, , , facilityId, departmentId] = patientRoute.pathname.split('/');
  await page.goto(`/admission/list?facilityId=${facilityId}&departmentId=${departmentId}`);
  await page.locator('input[aria-label="جست‌وجوی بیمار"]').fill('آزمون');
  await page.getByRole('button', { name: 'جست‌وجو' }).click();
  await expect(page.locator('tbody')).toContainText('آزمون مرورگر');
});

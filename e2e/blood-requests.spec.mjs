import { test, expect } from '@playwright/test';

async function login(page, userName, password) {
  await page.goto('/login');
  await page.locator('#username').fill(userName);
  await page.locator('#password').fill(password);
  await page.getByRole('button', { name: 'ورود', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'سامانه یکپارچه هموویژیلانس' })).toBeVisible();
}

async function selectScope(page) {
  await page.goto('/clinical/requests');
  await expect(page.getByRole('heading', { name: 'درخواست فرآورده خون' })).toBeVisible();
  await page.getByRole('combobox', { name: 'مرکز درمانی' }).click();
  await page.getByRole('option', { name: 'Hospital A' }).click();
  await page.getByRole('combobox', { name: 'بخش', exact: true }).click();
  await page.getByRole('option', { name: 'ICU A' }).click();
  await expect(page.getByText('کارتابل مشترک درخواست‌ها', { exact: true })).toBeVisible();
}

// Frontend workflow uses the same disposable SQL fixture as backend CI.
// No real clinical users or patients are involved.
test('ST-05 browser: nurse submission → separate doctor review', async ({ page }) => {
  await login(page, 'st05_nurse', 'Nurse-Ci_2026-Str0ng!');
  const facilities = await (await page.request.get('/api/v1/organization/facilities')).json();
  const facilityId = facilities.find(f => f.name === 'Hospital A').id;
  const departments = await (await page.request.get(
    `/api/v1/organization/facilities/${facilityId}/departments`)).json();
  const departmentId = departments.find(d => d.name === 'ICU A').id;
  const admissions = await (await page.request.get(
    `/api/v1/facilities/${facilityId}/departments/${departmentId}/admissions/`)).json();
  const encounterId = admissions.items.find(a => a.firstName === 'آرمان').encounterId;

  await selectScope(page);
  await page.getByRole('spinbutton', { name: 'شناسه بستری بیمار' }).fill(String(encounterId));
  await page.getByRole('combobox', { name: 'فرآورده' }).click();
  await page.getByRole('option', { name: 'گلبول قرمز متراکم', exact: true }).click();
  await page.getByRole('textbox', { name: 'اندیکاسیون / علت درخواست' })
    .fill('Synthetic hospital approval workflow E2E');
  await page.getByRole('button', { name: 'ثبت و ارسال برای پزشک' }).click();
  await expect(page.locator('.result')).toContainText('برای بررسی پزشک ثبت شد');
  const text = await page.locator('.result').textContent();
  const requestNo = text?.match(/REQ-[A-F0-9]{32}/)?.[0];
  expect(requestNo).toBeTruthy();

  await page.getByRole('button', { name: 'خروج از حساب' }).click();
  await expect(page).toHaveURL(/\/login/);
  await login(page, 'st05_doctor', 'Doctor-Ci_2026-Str0ng!');
  await selectScope(page);
  const row = page.locator('tr', { hasText: requestNo });
  await expect(row).toContainText('AwaitingDoctor');
  await row.getByRole('button', { name: 'بازبینی' }).click();
  await expect(page.getByText('تصمیم پزشک · ' + requestNo)).toBeVisible();
  await page.getByRole('button', { name: 'ثبت تصمیم پزشک' }).click();
  await expect(page.locator('.result')).toContainText('تصمیم برای ' + requestNo + ' ثبت شد');
  await expect(row).toContainText('Approved');
});

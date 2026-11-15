import { test, expect } from '@playwright/test';

// Real disposable SQL Server fixture supplies synthetic ST-08 Nurse and independent signoff.
// No production patient data or localStorage authentication.
test('ST-08 mobile: signed clinical transfusion displays immutable monitoring timeline', async ({page}) => {
  await page.setViewportSize({width:390,height:844});
  await page.goto('/login');
  await page.locator('#username').fill('st05_nurse');
  await page.locator('#password').fill('Nurse-Ci_2026-Str0ng!');
  await page.getByRole('button',{name:'ورود',exact:true}).click();
  await expect(page.getByRole('heading',{name:'سامانه یکپارچه هموویژیلانس'})).toBeVisible();
  await page.goto('/transfusions');
  await expect(page.getByRole('heading',{name:'تزریق و پایش فرآورده'})).toBeVisible();
  await page.getByRole('combobox',{name:'مرکز درمانی'}).click();
  await page.getByRole('option',{name:'Hospital A'}).click();
  await page.getByRole('combobox',{name:'بخش',exact:true}).click();
  await page.getByRole('option',{name:'ICU A'}).click();
  await expect(page.locator('table').first()).toContainText('Completed');
  await page.getByRole('button',{name:'پایش و اقدامات'}).first().click();
  await expect(page.getByText('ثبت‌شده',{exact:true}).first()).toBeVisible();
  await expect(page.locator('table').last()).toContainText('Baseline');
  await expect(page.locator('table').last()).toContainText('During');
  await expect(page.getByRole('button',{name:'ثبت علائم حیاتی'})).toHaveCount(0);
  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+2);
  expect(overflow,'mobile viewport must not overflow horizontally').toBeFalsy();
});

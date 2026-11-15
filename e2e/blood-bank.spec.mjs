import { test, expect } from '@playwright/test';

test('ST06 browser: bank specialist can see scoped stock and register an expiring unit', async ({page}) => {
  await page.setViewportSize({width:390,height:844});
  await page.goto('/login');
  await page.locator('#username').fill('st06_bank');
  await page.locator('#password').fill('Bank-Ci_2026-Str0ng!');
  await page.getByRole('button',{name:'ورود',exact:true}).click();
  await expect(page.getByRole('heading',{name:'سامانه یکپارچه هموویژیلانس'})).toBeVisible();
  await page.goto('/blood-bank');
  await expect(page.getByRole('heading',{name:'موجودی و آزمایش سازگاری'})).toBeVisible();
  await page.getByRole('combobox',{name:'مرکز درمانی'}).click();
  await page.getByRole('option',{name:'Hospital A'}).click();
  await expect(page.locator('table').first()).toContainText('ST06-BLOOD-001');
  await expect(page.locator('table').last()).toContainText('Final');
  await page.getByRole('textbox',{name:'کد یکتای واحد'}).fill('ST06-BROWSER-002');
  await page.getByRole('combobox',{name:'نوع فرآورده'}).click();
  await page.getByRole('option',{name:'گلبول قرمز متراکم'}).click();
  await page.getByRole('combobox',{name:'گروه خونی برچسب'}).click();
  await page.getByRole('option',{name:'O+'}).click();
  await page.getByRole('textbox',{name:'تاریخ انقضا شمسی'}).fill('۱۴۰۶/۰۱/۰۱');
  await page.getByRole('button',{name:'ثبت دریافت'}).click();
  await expect(page.getByRole('status')).toContainText('عملیات در پایگاه داده ثبت شد');
  await expect(page.locator('table').first()).toContainText('ST06-BROWSER-002');
  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+2);
  expect(overflow).toBeFalsy();
});

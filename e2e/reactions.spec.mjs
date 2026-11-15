import { test, expect } from '@playwright/test';

// ST09 database fixture creates a fully reviewed, closed synthetic event and RCA.
test('ST09 mobile: nurse can review persisted adverse event without diagnosis controls',async ({page})=>{
  await page.setViewportSize({width:390,height:844});
  await page.goto('/login');
  await page.locator('#username').fill('st05_nurse');
  await page.locator('#password').fill('Nurse-Ci_2026-Str0ng!');
  await page.getByRole('button',{name:'ورود',exact:true}).click();
  await expect(page.getByRole('heading',{name:'سامانه یکپارچه هموویژیلانس'})).toBeVisible();
  await page.goto('/reactions');
  await expect(page.getByRole('heading',{name:'واکنش‌های نامطلوب و پیگیری'})).toBeVisible();
  await page.getByRole('combobox',{name:'مرکز درمانی'}).click();
  await page.getByRole('option',{name:'Hospital A'}).click();
  await page.getByRole('combobox',{name:'بخش درمانی'}).click();
  await page.getByRole('option',{name:'ICU A'}).click();
  await expect(page.locator('table').first()).toContainText('Closed');
  await page.getByRole('button',{name:'بازکردن پرونده'}).first().click();
  await expect(page.getByText('Synthetic urticaria after completion')).toBeVisible();
  await expect(page.getByText(/ارزیابی‌ها: 1/)).toBeVisible();
  await expect(page.getByRole('button',{name:'تأیید نتیجه بررسی'})).toHaveCount(0);
  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+2);
  expect(overflow).toBeFalsy();
});

test('ST09: HV worklist includes independently verified RCA and event status',async ({page})=>{
  await page.goto('/login');
  await page.locator('#username').fill('st09_hv');
  await page.locator('#password').fill('HvFirst-Ci_2026-Str0ng!');
  const loginResult=page.waitForResponse(response =>
    response.url().includes('/api/v1/auth/login') &&
    response.request().method()==='POST');
  await page.getByRole('button',{name:'ورود',exact:true}).click();
  const signedIn=await loginResult;
  expect(signedIn.status(),'HV fixture login must complete before navigation').toBe(204);
  await expect(page.getByRole('heading',{name:'سامانه یکپارچه هموویژیلانس'})).toBeVisible();
  await page.goto('/reactions');
  await expect(page.getByRole('heading',{name:'واکنش‌های نامطلوب و پیگیری'})).toBeVisible();
  await page.getByRole('combobox',{name:'مرکز درمانی'}).click();
  await page.getByRole('option',{name:'Hospital A'}).click();
  await page.getByRole('combobox',{name:'بخش درمانی'}).click();
  await page.getByRole('option',{name:'ICU A'}).click();
  await expect(page.locator('table').first()).toContainText('Closed');
  await page.getByRole('button',{name:'بازکردن پرونده'}).first().click();
  await expect(page.getByRole('heading',{name:/RCA/})).toContainText('Closed');
  await expect(page.locator('table').last()).toContainText('Verified');
});

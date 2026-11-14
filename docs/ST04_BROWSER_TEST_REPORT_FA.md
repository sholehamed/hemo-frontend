# Hemo — نتیجه تست مرورگر واقعی ST-04
**تاریخ اجرا:** 2026-11-14
**آزمایش:** [GitHub Actions ST-04 Browser E2E](https://github.com/sholehamed/hemo-frontend/actions/workflows/admission-browser-e2e.yml)
**نتیجه تأییدشده:** Chromium Playwright **۱/۱ Passed**، Angular Production Build/Smoke سبز و SQL Server Baseline+API Integration سبز.

## سناریوی اجراشده
1. SQL Server 2022 موقت روی Runner اختصاصی GitHub ساخته شد و Baseline ۸۸ جدول نصب شد.
2. تست SQL Backend یک مدیر نمونه، دو مرکز و چند بخش و نقش‌های مورد نیاز را ایجاد کرد.
3. ASP.NET Core 10 و Angular 22 هم‌زمان در همان Runner شروع شدند.
4. Chromium با حساب کاملاً آزمایشی وارد شد و بخش پذیرش را باز کرد.
5. یک بیمار مجهول‌الهویه با نام ساختگی و تاریخ شمسی ثبت شد و API پاسخ واقعی داد.
6. صفحه بستری در Reload از SQL بازیابی شد؛ بارکد مچ‌بند صادر و نمایش داده شد.
7. کنترل دو شناسه و تیک تأیید انجام شد و وضعیت Verified از API دریافت شد.
8. پرونده پس از Reload در فهرست جست‌وجوشده پیدا شد.

## ایرادهایی که این تست پیدا کرد
- Runner `ubuntu-latest` به Ubuntu 26.04 تغییر کرده بود؛ Playwright 1.56 از آن پشتیبانی نمی‌کرد. Runner روی `ubuntu-24.04` ثابت شد.
- Angular Guard نقش‌ها قبل از پاسخ دریافت Session اجرا می‌شد و Refresh لینک مستقیم پذیرش را رد می‌کرد؛ همه Guardها اکنون به `AuthService.checkSession()` وابسته‌اند.

## مرز پذیرش
- این تست فقط یک مسیر خوش‌بینانه مرورگر را پوشش می‌دهد؛ سناریوهای دسترسی غیرمجاز و تداخل عملیات در SQL Integration Backend پوشش داده شده‌اند.
- سیاست بیمار مجهول‌الهویه، تعداد و نوع شناسه‌های قابل‌قبول، قالب بارکد فیزیکی و رویه رفع مغایرت نیازمند تأیید متخصص و SOP هستند.
- مرور امنیتی پیش از تولید، MFA/Lockout/Password first-change و PenTest هنوز باید انجام شود.

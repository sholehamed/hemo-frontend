# Hemo Frontend | راهنمای ادامه توسعه و اتصال به برنامه کل
**مرجع واحد نقشه راه:** [hemo-backend/docs/README.md](https://github.com/sholehamed/hemo-backend/blob/main/docs/README.md)

این فایل نقشه راه مجزا نیست. هر تغییر Frontend باید با همان شناسه مرحله/قابلیت که در Backend ثبت می‌شود انجام شود. تمام صفحات HTML بخشی از **یک اپلیکیشن Angular** با دیتابیس مشترک هستند.

## مستنداتی که قبل از اولین کد باید خوانده شوند
1. [وضعیت واقعی پروژه](https://github.com/sholehamed/hemo-backend/blob/main/docs/management/CURRENT_STATUS_FA.md).
2. [نقشه راه کامل](https://github.com/sholehamed/hemo-backend/blob/main/docs/management/ROADMAP_FA.md).
3. [دستورکار مرحله بعد](https://github.com/sholehamed/hemo-backend/blob/main/docs/management/NEXT_ITERATION_FA.md).
4. [جدول نگاشت دقیق ۶۲ صفحه](https://github.com/sholehamed/hemo-backend/blob/main/docs/management/FEATURE_TRACEABILITY_FA.md).
5. [چرخه توسعه و Merge](https://github.com/sholehamed/hemo-backend/blob/main/docs/management/EXECUTION_PLAYBOOK_FA.md).
6. [اسناد UI موجود](ADR-0001-frontend.md) و [قرارداد Session/CSRF](ADR-0002-frontend-auth.md).

## وضعیت کد Frontend
- ST-01: Angular 22 Standalone، responsive RTL، Shell، ۷ حوزه و route status، Build/test در CI: **Done**.
- ST-02A: فرم login، Session از API، logout، XSRF، area guards و نمایش منو از role grants: **Done**.
- ST-02B و ST-03: Error contract/interceptor، form components، profile/security/permission views: **Not started**.
- ST-04 تا ST-13: انتقال قابلیت‌های ۶۲ صفحه به Angular با API واقعی: **Not started**.
- **نکته:** هیچ صفحه بالینی یا داشبورد نمونه موجود را «عملیاتی» تلقی نکن؛ role filtering در UI جای Authorization سمت Backend نیست.

## قرارداد Frontend برای هر Feature
1. صفحه/فرایند را با `hemo-raw` تطبیق بده. اگر دو HTML کار یکسان دارند، canonical route مشخص شود؛ دو Component با داده تکراری نساز.
2. Domain DTO، route، permission و scope را در PR مرتبط Backend بخوان؛ API را با HttpClient و URL نسبی `/api/v1` مصرف کن.
3. از Angular Standalone، Signals برای state محلی، Reactive Forms برای فرم‌های عملیاتی و Observable برای درخواست‌های شبکه استفاده کن.
4. Persian RTL، keyboard accessibility، responsive، form validation، loading/error/empty و حفظ فیلدهای شرطی پروتوتایپ را تست کن.
5. جلالی و اعداد فارسی در UI؛ قرارداد API تاریخ UTC/ISO. هیچ رشته نمایشی جلالی بدون تبدیل معتبر در SQL ذخیره نشود.
6. هیچ داده بیمار، Token، Password یا PHI در localStorage ذخیره نشود؛ احراز هویت فقط با BFF cookie و CSRF.
7. فقط route guard کافی نیست. برای عملیات حساس، پاسخ 403 از API باید بدون افشای داده نمایش داده شود.
8. هر صفحه باید کار واقعی CRUD/Workflow را بعد از Refresh و Login حساب مجاز نشان بدهد؛ دکمه Toast بدون ذخیره واقعی «Done» نیست.
9. Playwright روی login، مجوز، خطای API و تعامل در فرایند با SQL آزمایشی تعریف شود.
10. در PR یادداشت کن: Stage/Feature ID، raw page(s)، route، API endpoints، permission، tests و screenshot بدون PHI.

## ترتیب تحویل UI همگام با Backend
| Stage | صفحات یا UI |
|---|---|
| ST-02B | خطا/ProblemDetails، فرم/جدول/جست‌وجو و API client مشترک |
| ST-03 | مدیریت کاربر و Grantهای مرکز/بخش، guard و حالات 401/403 |
| ST-04 | پذیرش، بیمار جدید، فهرست بیمار، تطبیق هویت |
| ST-05 | درخواست پرستار، کارتابل و تأیید پزشک، درخواست‌های بانک |
| ST-06 | بانک خون موجودی و Crossmatch، سرپرست موجودی/انقضا |
| ST-07 | تحویل، ارسال، ذوب، مرجوعی، ضایعات و انتقال |
| ST-08 | پایش تزریق و علائم حیاتی پرستار، پرونده و پایش پزشک |
| ST-09 | واکنش اولیه، نظر پزشک، پرونده HV |
| ST-10 | تجهیزات، کالیبراسیون، پایش دما و مدیریت رخداد |
| ST-11 | QC، RCA، ممیزی، آموزش و کمیته |
| ST-12 | HIS، ترخیص، آمار، داشبوردها و گزارش‌های رسمی |
| ST-13 | دسترس‌پذیری، Performance، E2E Browser، UAT و Release |

**ثبت وضعیت و تاریخچه فقط در مرجع Backend انجام می‌شود**؛ این فایل در صورت تغییر قرارداد Angular هم‌زمان به‌روز شود.

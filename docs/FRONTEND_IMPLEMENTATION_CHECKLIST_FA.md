# چک‌لیست فنی هر صفحه Angular (Hemo)

## پیش از PR
- [ ] شماره Stage/Feature ID، Owner و URL فایل اصلی در hemo-raw مشخص است.
- [ ] نسخه تکراری/جایگزین بررسی و canonical route انتخاب شده.
- [ ] DTO و Endpoint و Scope/Permission سمت Backend آماده است.
- [ ] وضعیت‌های empty/loading/error/invalid/forbidden/expired session طراحی شده‌اند.

## پیاده‌سازی
- [ ] Component مستقل و Lazy؛ route guard فقط UX، API authorization اصلی.
- [ ] ReactiveForms، validation شرطی، normalize Persian numerals و Jalali date adapter با UTC API.
- [ ] فرم‌های مرتبط از کامپوننت‌های مشترک استفاده می‌کنند؛ Data Service، state و cache مستقل از UI.
- [ ] پاسخ موفق فقط بعد از پاسخ تأییدشده API؛ optimistic UI نیازمند rollback.
- [ ] `HttpClient` URL نسبی و XSRF، credentials same-origin، بدون Token/PHI در storage.
- [ ] خطا/Loading/Retry و TraceId امن؛ پیام user-friendly و بدون افشای داده.
- [ ] Responsive, RTL, keyboard focus/ARIA, pagination/filter, printing/export طبق scope.
- [ ] داده بین نقش‌ها از Backend مشترک می‌آید، نه آرایه محلی در فایل.

## آزمون و اتمام
- [ ] Unit/smoke، Build production، API integration و Browser E2E متناسب با حساسیت.
- [ ] Test حساب دارای Permission، فاقد Permission، بخش دیگر و مرکز دیگر.
- [ ] Reload و back/forward و route directly linked تست شود.
- [ ] Screenshot بدون اطلاعات بیمار؛ شرح PR با لینک به جدول پوشش 62 صفحه.
- [ ] آخرین CI سبز، Merge و Main CI بازبینی، Journal در مرجع Backend به‌روزرسانی شود.

مرجع: [Hemo project docs](https://github.com/sholehamed/hemo-backend/blob/main/docs/README.md).

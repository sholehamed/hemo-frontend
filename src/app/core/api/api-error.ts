import { HttpErrorResponse } from '@angular/common/http';

export interface ApiFailure {
  readonly status: number;
  readonly code: 'unauthorized' | 'forbidden' | 'conflict' | 'validation' | 'network' | 'unknown';
  readonly message: string;
  readonly traceId: string | null;
}

export function toApiFailure(error: HttpErrorResponse): ApiFailure {
  const raw = error.error;
  const trace = raw && typeof raw === 'object' && typeof raw.traceId === 'string'
    ? raw.traceId : null;
  const traceId = trace && /^[a-zA-Z0-9.-]{1,128}$/.test(trace) ? trace : null;

  const descriptions: Record<number, [ApiFailure['code'], string]> = {
    0: ['network', 'ارتباط با سرور برقرار نشد.'],
    400: ['validation', 'اطلاعات ارسالی معتبر نیست.'],
    401: ['unauthorized', 'نشست شما معتبر نیست؛ دوباره وارد شوید.'],
    403: ['forbidden', 'شما مجوز انجام این عملیات را ندارید.'],
    409: ['conflict', 'اطلاعات تغییر کرده است؛ داده‌ها را دوباره دریافت کنید.'],
    422: ['validation', 'برخی فیلدهای فرم معتبر نیستند.']
  };
  const [code, message] = descriptions[error.status] ??
    ['unknown', 'در پردازش درخواست خطایی رخ داد.'];
  // Do not display server exception messages or PII from error.detail by default.
  return { status: error.status, code, message, traceId };
}

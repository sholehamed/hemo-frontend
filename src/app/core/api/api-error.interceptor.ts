import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';
import { toApiFailure } from './api-error';

// Convert HTTP errors to a known, PII-safe frontend contract.
export const apiErrorInterceptor: HttpInterceptorFn = (request, next) =>
  next(request).pipe(catchError(error =>
    throwError(() => error instanceof HttpErrorResponse ? toApiFailure(error) : error)));

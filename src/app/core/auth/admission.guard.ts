import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';

// Route guard is UX only. The API authorizes actual facility/department per request.
export const admissionGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  return auth.hasRole('ADMISSION') ? true : router.createUrlTree(['/']);
};

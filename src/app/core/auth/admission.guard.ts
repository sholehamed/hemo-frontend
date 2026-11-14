import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map } from 'rxjs';
import { AuthService } from './auth.service';

// Route guard is UX only. The API authorizes actual facility/department per request.
// Angular can evaluate sibling guards concurrently; resolve the server session here too.
export const admissionGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  return auth.checkSession().pipe(map(session => !session
    ? router.createUrlTree(['/login'])
    : auth.hasRole('ADMISSION') ? true : router.createUrlTree(['/'])));
};

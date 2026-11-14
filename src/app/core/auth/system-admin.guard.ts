import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map } from 'rxjs';
import { AuthService } from './auth.service';

export const systemAdminGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  return auth.checkSession().pipe(map(session => !session
    ? router.createUrlTree(['/login'])
    : auth.canManageSystem() ? true : router.createUrlTree(['/'])));
};

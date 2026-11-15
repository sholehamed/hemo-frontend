import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map } from 'rxjs';
import { AuthService } from './auth.service';

export const clinicalGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  return auth.checkSession().pipe(map(session => !session
    ? router.createUrlTree(['/login'])
    : ['NURSE','DOCTOR','BLOOD_TRANSFUSION_EXPERT','SUPERVISOR']
      .some(role => auth.hasRole(role)) ? true : router.createUrlTree(['/'])));
};

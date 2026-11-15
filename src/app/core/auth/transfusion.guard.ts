import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map } from 'rxjs';
import { AuthService } from './auth.service';

export const transfusionGuard: CanActivateFn = () => {
  const auth=inject(AuthService),router=inject(Router);
  return auth.checkSession().pipe(map(session=>!session
    ? router.createUrlTree(['/login'])
    : ['NURSE','DOCTOR','HV_MANAGER','SYSTEM_ADMIN'].some(role=>auth.hasRole(role))
      ? true : router.createUrlTree(['/'])));
};

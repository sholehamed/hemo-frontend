import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivateFn, Router } from '@angular/router';
import { map } from 'rxjs';
import { AuthService } from './auth.service';
import { findArea } from '../navigation/areas';

export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  return auth.checkSession().pipe(map(session =>
    session ? true : router.createUrlTree(['/login'])));
};

export const areaGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const area = findArea(route.paramMap.get('id'));
  if (!area) return router.createUrlTree(['/']);
  return auth.canShowArea(area.roleCode) ? true : router.createUrlTree(['/']);
};

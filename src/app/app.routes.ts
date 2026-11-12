import { Routes } from '@angular/router';
import { areaGuard, authGuard } from './core/auth/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    title: 'Hemo | ورود',
    loadComponent: () => import('./features/login/login.component')
      .then(m => m.LoginComponent)
  },
  {
    path: '',
    title: 'Hemo | نمای کلی',
    canActivate: [authGuard],
    loadComponent: () => import('./features/dashboard/dashboard.component')
      .then(m => m.DashboardComponent)
  },
  {
    path: 'areas/:id',
    title: 'Hemo | بخش‌های سامانه',
    canActivate: [authGuard, areaGuard],
    loadComponent: () => import('./features/area/area.component')
      .then(m => m.AreaComponent)
  },
  {
    path: 'system/status',
    title: 'Hemo | وضعیت API',
    loadComponent: () => import('./features/system-status/system-status.component')
      .then(m => m.SystemStatusComponent)
  },
  { path: '**', redirectTo: '' }
];

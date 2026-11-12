import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    title: 'Hemo | نمای کلی',
    loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent)
  },
  {
    path: 'areas/:id',
    title: 'Hemo | بخش‌های سامانه',
    loadComponent: () => import('./features/area/area.component').then(m => m.AreaComponent)
  },
  {
    path: 'system/status',
    title: 'Hemo | وضعیت API',
    loadComponent: () => import('./features/system-status/system-status.component').then(m => m.SystemStatusComponent)
  },
  { path: '**', redirectTo: '' }
];

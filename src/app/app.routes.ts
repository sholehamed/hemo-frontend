import { Routes } from '@angular/router';
import { areaGuard, authGuard } from './core/auth/auth.guard';
import { systemAdminGuard } from './core/auth/system-admin.guard';
import { admissionGuard } from './core/auth/admission.guard';
import { transfusionGuard } from './core/auth/transfusion.guard';
import { logisticsWorkspaceGuard } from './core/auth/logistics.guard';
import { bloodBankGuard } from './core/auth/blood-bank.guard';
import { clinicalGuard } from './core/auth/clinical.guard';

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
    path: 'clinical/requests',
    title: 'Hemo | درخواست خون و تأیید پزشک',
    canActivate: [authGuard, clinicalGuard],
    loadComponent: () => import('./features/clinical/blood-requests.component')
      .then(m => m.BloodRequestsComponent)
  },
  {
    path: 'blood-bank',
    title: 'Hemo | موجودی و سازگاری',
    canActivate: [authGuard,bloodBankGuard],
    loadComponent: () => import('./features/blood-bank/bank-workspace.component')
      .then(m => m.BankWorkspaceComponent)
  },
  {
    path: 'logistics',
    title: 'Hemo | صدور و لجستیک',
    canActivate: [authGuard,logisticsWorkspaceGuard],
    loadComponent: () => import('./features/logistics/logistics-workspace.component')
      .then(m => m.LogisticsWorkspaceComponent)
  },
  {
    path: 'transfusions',
    title: 'Hemo | تزریق و پایش',
    canActivate: [authGuard,transfusionGuard],
    loadComponent: () => import('./features/transfusion/transfusion-workspace.component')
      .then(m => m.TransfusionWorkspaceComponent)
  },
  {
    path: 'admin',
    title: 'Hemo | مدیریت سامانه',
    canActivate: [authGuard, systemAdminGuard],
    loadComponent: () => import('./features/admin/admin.component')
      .then(m => m.AdminComponent)
  },
  {
    path: 'admission',
    title: 'Hemo | پذیرش',
    canActivate: [authGuard, admissionGuard],
    loadComponent: () => import('./features/admission/admission-dashboard.component')
      .then(m => m.AdmissionDashboardComponent)
  },
  {
    path: 'admission/new',
    title: 'Hemo | پذیرش بیمار',
    canActivate: [authGuard, admissionGuard],
    loadComponent: () => import('./features/admission/admission-create.component')
      .then(m => m.AdmissionCreateComponent)
  },
  {
    path: 'admission/list',
    title: 'Hemo | پرونده‌های پذیرش',
    canActivate: [authGuard, admissionGuard],
    loadComponent: () => import('./features/admission/admission-list.component')
      .then(m => m.AdmissionListComponent)
  },
  {
    path: 'admission/identity/:facilityId/:departmentId/:encounterId',
    title: 'Hemo | تطبیق هویت',
    canActivate: [authGuard, admissionGuard],
    loadComponent: () => import('./features/admission/admission-identity.component')
      .then(m => m.AdmissionIdentityComponent)
  },
  {
    path: 'system/status',
    title: 'Hemo | وضعیت API',
    loadComponent: () => import('./features/system-status/system-status.component')
      .then(m => m.SystemStatusComponent)
  },
  { path: '**', redirectTo: '' }
];

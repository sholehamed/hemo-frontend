import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AdmissionsService } from '../../core/api/admissions.service';
import { OrgItem } from '../../core/api/administration.service';
import { ApiFailure } from '../../core/api/api-error';
import { RequestStateComponent } from '../../shared/components/request-state.component';

@Component({
  selector: 'app-admission-dashboard',
  standalone: true,
  imports: [FormsModule, RouterLink, RequestStateComponent],
  template: `
    <section class="heading">
      <p class="eyebrow">Hemo / Admission</p>
      <h1>پذیرش و پرونده بیماران</h1>
      <p class="muted">برای ثبت، جست‌وجو و بررسی هویت ابتدا مرکز و بخش مجاز را انتخاب کنید.</p>
    </section>
    <section class="form-card">
      <h2>محدوده کاری</h2>
      <div class="scope-grid">
        <label>مرکز درمانی
          <select name="facility" [(ngModel)]="facilityId" (ngModelChange)="facilityChanged()">
            <option [ngValue]="null">انتخاب مرکز</option>
            @for (facility of facilities(); track facility.id) {
              <option [ngValue]="facility.id">{{ facility.name }}</option>
            }
          </select>
        </label>
        <label>بخش
          <select name="department" [(ngModel)]="departmentId" (ngModelChange)="loadSummary()"
            [disabled]="!facilityId">
            <option [ngValue]="null">انتخاب بخش</option>
            @for (dept of departments(); track dept.id) {
              <option [ngValue]="dept.id">{{ dept.name }}</option>
            }
          </select>
        </label>
      </div>
      <app-request-state [loading]="busy()" [error]="error()" />
    </section>

    @if (facilityId !== null && departmentId !== null) {
      <div class="area-grid">
        <div class="form-card">
          <span class="stat-number">{{ admissionCount() }}</span>
          <h3>پرونده‌های قابل مشاهده در بخش</h3>
          <p class="muted">بر اساس اطلاعات ذخیره‌شده در SQL Server</p>
        </div>
        <a class="area-card" [routerLink]="['/admission/new']"
          [queryParams]="{facilityId,departmentId}">
          <span class="area-icon">✚</span><strong>ثبت پذیرش جدید</strong>
          <span class="muted">ثبت بیمار، بستری و محل قرارگیری</span>
        </a>
        <a class="area-card" [routerLink]="['/admission/list']"
          [queryParams]="{facilityId,departmentId}">
          <span class="area-icon">☷</span><strong>فهرست بیماران</strong>
          <span class="muted">جست‌وجو و مشاهده پرونده‌های همین بخش</span>
        </a>
      </div>
    }
    <p><a routerLink="/" class="text-link">بازگشت به نمای کلی</a></p>
  `,
  styles: [`
    .form-card{background:#fff;border:1px solid #e1e7ef;border-radius:14px;padding:22px;margin-bottom:20px}
    .scope-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:16px}
    label{display:grid;gap:7px;font-size:14px;font-weight:600}
    select{padding:10px;border:1px solid #cbd5e1;border-radius:8px;font:inherit;width:100%}
    .stat-number{font-size:38px;font-weight:bold;color:#177987}
  `]
})
export class AdmissionDashboardComponent implements OnInit {
  private readonly api = inject(AdmissionsService);
  readonly facilities = signal<OrgItem[]>([]);
  readonly departments = signal<OrgItem[]>([]);
  readonly admissionCount = signal(0);
  readonly busy = signal(false);
  readonly error = signal<string | null>(null);
  facilityId: number | null = null;
  departmentId: number | null = null;

  ngOnInit(): void {
    this.busy.set(true);
    this.api.facilities().subscribe({
      next: rows => { this.facilities.set(rows); this.busy.set(false); },
      error: (e: ApiFailure) => { this.error.set(e.message); this.busy.set(false); }
    });
  }

  facilityChanged(): void {
    this.departmentId = null; this.departments.set([]); this.admissionCount.set(0);
    if (this.facilityId === null) return;
    this.busy.set(true); this.error.set(null);
    this.api.departments(this.facilityId).subscribe({
      next: rows => { this.departments.set(rows); this.busy.set(false); },
      error: (e: ApiFailure) => { this.error.set(e.message); this.busy.set(false); }
    });
  }

  loadSummary(): void {
    if (this.facilityId === null || this.departmentId === null) return;
    this.busy.set(true);
    this.api.list(this.facilityId, this.departmentId, '', 1).subscribe({
      next: data => { this.admissionCount.set(data.total); this.busy.set(false); },
      error: (e: ApiFailure) => { this.error.set(e.message); this.busy.set(false); }
    });
  }
}

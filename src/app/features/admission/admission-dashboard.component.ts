import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
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
  imports: [FormsModule, RouterLink, RequestStateComponent, MatButtonModule,
    MatCardModule, MatFormFieldModule, MatSelectModule],
  template: `
    <section class="heading">
      <p class="eyebrow">HEMO / ADMISSION</p>
      <h1>پذیرش و پرونده بیماران</h1>
      <p class="muted">مرکز و بخش مجاز خود را انتخاب کنید تا آمار و عملیات همان محدوده نمایش داده شوند.</p>
    </section>

    <mat-card class="scope-card">
      <mat-card-header><mat-card-title>محدوده کاری</mat-card-title></mat-card-header>
      <mat-card-content>
        <div class="scope-grid">
          <mat-form-field appearance="outline">
            <mat-label>مرکز درمانی</mat-label>
            <mat-select name="facility" [(ngModel)]="facilityId"
              (ngModelChange)="facilityChanged()">
              <mat-option [value]="null">انتخاب مرکز</mat-option>
              @for (f of facilities(); track f.id) {
                <mat-option [value]="f.id">{{ f.name }}</mat-option>
              }
            </mat-select>
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>بخش</mat-label>
            <mat-select name="department" [(ngModel)]="departmentId"
              (ngModelChange)="loadSummary()" [disabled]="!facilityId">
              <mat-option [value]="null">انتخاب بخش</mat-option>
              @for (dept of departments(); track dept.id) {
                <mat-option [value]="dept.id">{{ dept.name }}</mat-option>
              }
            </mat-select>
          </mat-form-field>
        </div>
        <app-request-state [loading]="busy()" [error]="error()" />
      </mat-card-content>
    </mat-card>

    @if (facilityId !== null && departmentId !== null) {
      <div class="summary-grid">
        <mat-card class="metric-card">
          <mat-card-content>
            <span class="metric-kicker">پرونده‌های قابل مشاهده</span>
            <strong class="stat-number">{{ admissionCount() }}</strong>
            <span class="muted">بر اساس داده ذخیره‌شده در SQL Server</span>
          </mat-card-content>
        </mat-card>
        <mat-card class="shortcut">
          <mat-card-content>
            <span class="shortcut-icon">✚</span>
            <h3>ثبت بیمار جدید</h3><p class="muted">ایجاد پرونده و بستری در بخش انتخاب‌شده</p>
            <a mat-flat-button class="primary-button"
              [routerLink]="['/admission/new']"
              [queryParams]="{facilityId,departmentId}">ثبت پذیرش جدید</a>
          </mat-card-content>
        </mat-card>
        <mat-card class="shortcut">
          <mat-card-content>
            <span class="shortcut-icon">☷</span>
            <h3>پرونده‌های بیماران</h3><p class="muted">جست‌وجو، پیگیری و کنترل هویت</p>
            <a mat-stroked-button
              [routerLink]="['/admission/list']"
              [queryParams]="{facilityId,departmentId}">فهرست بیماران</a>
          </mat-card-content>
        </mat-card>
      </div>
    } @else {
      <mat-card class="empty-card"><mat-card-content>
        برای مشاهده عملیات پذیرش، ابتدا مرکز و بخش مجاز را انتخاب کنید.
      </mat-card-content></mat-card>
    }
    <p class="return"><a mat-button routerLink="/">بازگشت به نمای کلی</a></p>
  `,
  styles: [`
    .scope-card{margin-bottom:20px}
    mat-card-title{font-size:17px;font-weight:800}
    .scope-card mat-card-content{padding-top:19px!important}
    .scope-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(250px,100%),1fr));gap:17px}
    .summary-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(250px,100%),1fr));gap:16px}
    .metric-card{background:linear-gradient(135deg,#172235,#32435b)!important;color:#fff!important}
    .metric-card mat-card-content{display:flex;flex-direction:column;gap:8px}
    .metric-kicker{color:#d4deed;font-size:13px}
    .stat-number{font-size:clamp(35px,4vw,55px);line-height:1.3}
    .metric-card .muted{color:#bec9da}
    .shortcut mat-card-content{display:flex;flex-direction:column;align-items:start;gap:9px}
    .shortcut-icon{font-size:25px;color:#b91c35}
    .shortcut h3{margin:0}.shortcut p{margin:0 0 12px}
    .empty-card{background:#f8fafc!important;color:#64748b}
    .return{margin-top:17px}
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

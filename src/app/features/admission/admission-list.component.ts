import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatTableModule } from '@angular/material/table';
import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AdmissionPage, AdmissionsService } from '../../core/api/admissions.service';
import { ApiFailure } from '../../core/api/api-error';
import { RequestStateComponent } from '../../shared/components/request-state.component';
import { isoToJalali } from '../../shared/jalali-date';

@Component({
  selector: 'app-admission-list',
  standalone: true,
  imports: [FormsModule, RouterLink, RequestStateComponent, MatButtonModule,
    MatCardModule, MatFormFieldModule, MatInputModule, MatPaginatorModule, MatTableModule],
  template: `
    <section class="heading"><p class="eyebrow">ADMISSION / RECORDS</p>
      <h1>فهرست پرونده‌های بستری</h1>
      <p class="muted">فقط بیماران مرکز و بخش انتخاب‌شده، با مجوز جاری حساب شما.</p>
    </section>
    <mat-card class="filter-card">
      <mat-card-content>
        <div class="search-row">
          <mat-form-field appearance="outline">
            <mat-label>جست‌وجوی بیمار</mat-label>
            <input matInput [(ngModel)]="search" (keyup.enter)="reload(1)"
              aria-label="جست‌وجوی بیمار" placeholder="نام یا کد ملی" />
          </mat-form-field>
          <button mat-flat-button class="primary-button" (click)="reload(1)" type="button">
            جست‌وجو
          </button>
          <a mat-stroked-button [routerLink]="['/admission/new']"
            [queryParams]="{facilityId,departmentId}">ثبت پذیرش</a>
        </div>
      </mat-card-content>
    </mat-card>
    <app-request-state [loading]="busy()" [error]="error()"
      [empty]="!busy() && !error() && data()?.items?.length === 0"/>
    @if (data(); as list) {
      <mat-card class="results-card">
        <div class="table-scroll">
          <table mat-table [dataSource]="list.items" class="page-table">
            <ng-container matColumnDef="encounterId">
              <th mat-header-cell *matHeaderCellDef>شناسه بستری</th>
              <td mat-cell *matCellDef="let entry">{{ entry.encounterId }}</td>
            </ng-container>
            <ng-container matColumnDef="name">
              <th mat-header-cell *matHeaderCellDef>نام بیمار</th>
              <td mat-cell *matCellDef="let entry">{{ entry.firstName }} {{ entry.lastName }}</td>
            </ng-container>
            <ng-container matColumnDef="identifier">
              <th mat-header-cell *matHeaderCellDef>شناسه</th>
              <td mat-cell *matCellDef="let entry" dir="ltr">
                {{ entry.nationalId ?? entry.unknownIdentityCode }}
              </td>
            </ng-container>
            <ng-container matColumnDef="admittedAt">
              <th mat-header-cell *matHeaderCellDef>پذیرش</th>
              <td mat-cell *matCellDef="let entry">{{ jalali(entry.admittedAt) }}</td>
            </ng-container>
            <ng-container matColumnDef="status">
              <th mat-header-cell *matHeaderCellDef>وضعیت</th>
              <td mat-cell *matCellDef="let entry">
                <span class="status-pill">{{ entry.status }}</span>
              </td>
            </ng-container>
            <ng-container matColumnDef="actions">
              <th mat-header-cell *matHeaderCellDef>پرونده</th>
              <td mat-cell *matCellDef="let entry">
                <a mat-button [routerLink]="['/admission/identity',facilityId,departmentId,entry.encounterId]">
                  بررسی هویت
                </a>
              </td>
            </ng-container>
            <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
            <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
          </table>
        </div>
        <mat-paginator [length]="list.total" [pageSize]="list.pageSize"
          [pageIndex]="list.page - 1" [hidePageSize]="true"
          (page)="reload($event.pageIndex + 1)"
          aria-label="صفحه‌بندی پرونده‌های بیمار"></mat-paginator>
      </mat-card>
    }
    <div class="page-actions"><a mat-button routerLink="/admission">بازگشت به پذیرش</a></div>
  `,
  styles: [`
    .filter-card{margin-bottom:18px}
    .search-row{display:flex;align-items:start;flex-wrap:wrap;gap:10px}
    .search-row mat-form-field{flex:1 1 250px;max-width:620px}
    .search-row button,.search-row a{margin-top:5px;min-width:115px}
    .results-card{overflow:hidden}
    .table-scroll{overflow-x:auto}
    .page-table{width:100%;min-width:690px}
    th.mat-mdc-header-cell{text-align:right;font-weight:800;color:#334155;background:#f8fafc}
    td.mat-mdc-cell{font-size:13px}
    .status-pill{display:inline-flex;border-radius:50px;background:#e2f3ec;color:#216d50;padding:4px 10px}
    @media(max-width:650px){.search-row mat-form-field{flex-basis:100%}
      .search-row button,.search-row a{flex:1;margin-top:0}}
  `]
})
export class AdmissionListComponent implements OnInit {
  private readonly api = inject(AdmissionsService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  readonly data = signal<AdmissionPage | null>(null);
  readonly busy = signal(false);
  readonly error = signal<string | null>(null);
  readonly jalali = isoToJalali;
  readonly displayedColumns = ['encounterId', 'name', 'identifier', 'admittedAt', 'status', 'actions'];
  facilityId = 0; departmentId = 0; search = '';

  ngOnInit(): void {
    this.facilityId = Number(this.route.snapshot.queryParamMap.get('facilityId'));
    this.departmentId = Number(this.route.snapshot.queryParamMap.get('departmentId'));
    if (!Number.isSafeInteger(this.facilityId) || this.facilityId <= 0 ||
        !Number.isSafeInteger(this.departmentId) || this.departmentId <= 0) {
      void this.router.navigateByUrl('/admission'); return;
    }
    this.reload(1);
  }
  reload(page: number): void {
    this.busy.set(true); this.error.set(null); this.data.set(null);
    this.api.list(this.facilityId, this.departmentId, this.search, page).subscribe({
      next: value => { this.data.set(value); this.busy.set(false); },
      error: (e: ApiFailure) => { this.error.set(e.message); this.busy.set(false); }
    });
  }
}

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
  imports: [FormsModule, RouterLink, RequestStateComponent],
  template: `
    <section class="heading"><p class="eyebrow">Admission / Records</p>
      <h1>فهرست پرونده‌های بستری</h1>
      <p class="muted">فقط بیماران مرکز و بخش انتخاب‌شده در این فهرست نمایش داده می‌شوند.</p>
    </section>
    <div class="toolbar">
      <input [(ngModel)]="search" (keyup.enter)="reload(1)"
        aria-label="جست‌وجوی بیمار" placeholder="نام یا کد ملی" />
      <button class="primary-button" type="button" (click)="reload(1)">جست‌وجو</button>
      <a [routerLink]="['/admission/new']" [queryParams]="{facilityId,departmentId}"
        class="text-link">ثبت پذیرش</a>
    </div>
    <app-request-state [loading]="busy()" [error]="error()"
      [empty]="!busy() && !error() && data()?.items?.length === 0"/>
    @if (data(); as list) {
      <div class="table-scroll">
        <table><thead><tr>
          <th>شناسه بستری</th><th>نام بیمار</th><th>شناسه</th><th>پذیرش</th><th>وضعیت</th><th>پرونده</th>
        </tr></thead><tbody>
          @for (entry of list.items; track entry.encounterId) {
            <tr>
              <td>{{ entry.encounterId }}</td>
              <td>{{ entry.firstName }} {{ entry.lastName }}</td>
              <td>{{ entry.nationalId ?? entry.unknownIdentityCode }}</td>
              <td>{{ jalali(entry.admittedAt) }}</td>
              <td>{{ entry.status }}</td>
              <td><a [routerLink]="['/admission/identity',facilityId,departmentId,entry.encounterId]"
                class="text-link">بررسی هویت</a></td>
            </tr>
          }
        </tbody></table>
      </div>
      <p class="muted">مجموع: {{ list.total }} | صفحه {{ list.page }}</p>
      <div class="pager">
        <button type="button" [disabled]="list.page <= 1 || busy()" (click)="reload(list.page - 1)">قبلی</button>
        <button type="button" [disabled]="list.page * list.pageSize >= list.total || busy()"
          (click)="reload(list.page + 1)">بعدی</button>
      </div>
    }
    <p><a routerLink="/admission" class="text-link">بازگشت به پذیرش</a></p>
  `,
  styles: [`
    .toolbar{display:flex;flex-wrap:wrap;gap:10px;margin-bottom:18px;align-items:center}
    .toolbar input{padding:10px;border:1px solid #cbd5e1;border-radius:8px;min-width:220px;flex:1}
    .table-scroll{overflow-x:auto;background:#fff;border-radius:12px;border:1px solid #e2e8f0}
    table{border-collapse:collapse;width:100%}th,td{padding:13px;text-align:right;border-bottom:1px solid #e2e8f0;white-space:nowrap}
    .pager{display:flex;gap:10px}.pager button{border:1px solid #cbd5e1;background:#fff;border-radius:8px;padding:8px 16px}
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

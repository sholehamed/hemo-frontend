import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTableModule } from '@angular/material/table';
import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { AdministrationService, HemoRole, ManagedUser, OrgItem } from '../../core/api/administration.service';
import { ApiFailure } from '../../core/api/api-error';
import { RequestStateComponent } from '../../shared/components/request-state.component';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [FormsModule, RequestStateComponent, MatButtonModule,
    MatCardModule, MatFormFieldModule, MatInputModule, MatSelectModule,
    MatTabsModule, MatTableModule],
  template: `
    <section class="heading"><p class="eyebrow">SYSTEM / ADMINISTRATION</p>
      <h1>مدیریت سامانه</h1>
      <p class="muted">تعریف مرکز، بخش، تخت و حساب‌ها. تمام مجوزها در سرور بررسی می‌شوند.</p>
    </section>
    <app-request-state [loading]="busy()" [error]="error()" [traceId]="traceId()" />
    @if (message()) { <div class="notice" role="status">{{ message() }}</div> }
    <mat-tab-group mat-stretch-tabs="false" animationDuration="0ms" class="admin-tabs">
      <mat-tab label="مراکز و بخش‌ها">
        <div class="admin-grid">
          <mat-card>
            <mat-card-header><mat-card-title>ایجاد مرکز درمانی</mat-card-title></mat-card-header>
            <mat-card-content>
              <form (ngSubmit)="createFacility()" class="admin-form">
                <mat-form-field appearance="outline">
                  <mat-label>کد مرکز</mat-label>
                  <input matInput name="fcode" [(ngModel)]="facilityCode" required maxlength="30" />
                </mat-form-field>
                <mat-form-field appearance="outline">
                  <mat-label>نام مرکز</mat-label>
                  <input matInput name="fname" [(ngModel)]="facilityName" required maxlength="200" />
                </mat-form-field>
                <button mat-flat-button type="submit" class="primary-button" [disabled]="busy()">ایجاد مرکز</button>
              </form>
              <h3>مراکز موجود</h3>
              <div class="facility-list">
                @for (facility of facilities(); track facility.id) {
                  <div class="facility-row">
                    <strong>{{ facility.name }}</strong><span dir="ltr">{{ facility.code }}</span>
                  </div>
                } @empty { <p class="muted">مرکزی تعریف نشده است.</p> }
              </div>
            </mat-card-content>
          </mat-card>
          <mat-card>
            <mat-card-header><mat-card-title>بخش و تخت</mat-card-title></mat-card-header>
            <mat-card-content>
              <form (ngSubmit)="createDepartment()" class="admin-form">
                <mat-form-field appearance="outline">
                  <mat-label>مرکز درمانی</mat-label>
                  <mat-select name="df" [(ngModel)]="departmentFacility" required>
                    <mat-option [value]="null">انتخاب مرکز</mat-option>
                    @for (f of facilities(); track f.id) {
                      <mat-option [value]="f.id">{{ f.name }}</mat-option>
                    }
                  </mat-select>
                </mat-form-field>
                <mat-form-field appearance="outline">
                  <mat-label>کد بخش</mat-label>
                  <input matInput name="dc" [(ngModel)]="departmentCode" required maxlength="40" />
                </mat-form-field>
                <mat-form-field appearance="outline">
                  <mat-label>نام بخش</mat-label>
                  <input matInput name="dn" [(ngModel)]="departmentName" required maxlength="160" />
                </mat-form-field>
                <button mat-flat-button type="submit" class="primary-button"
                  [disabled]="busy() || departmentFacility === null">ثبت بخش</button>
              </form>
              <div class="subsection">
                <h3>ایجاد تخت</h3>
                <p class="muted">شناسه بخش را از اطلاعات مرکز دریافت کنید.</p>
                <form (ngSubmit)="createBed()" class="admin-form">
                  <mat-form-field appearance="outline">
                    <mat-label>شناسه بخش</mat-label>
                    <input matInput name="bedDept" type="number"
                      [(ngModel)]="bedDepartmentId" required min="1" />
                  </mat-form-field>
                  <mat-form-field appearance="outline">
                    <mat-label>کد تخت</mat-label>
                    <input matInput name="bedCode" [(ngModel)]="bedCode" required maxlength="30" />
                  </mat-form-field>
                  <button mat-flat-button type="submit" class="primary-button"
                    [disabled]="busy() || bedDepartmentId === null">ثبت تخت</button>
                </form>
              </div>
            </mat-card-content>
          </mat-card>
        </div>
      </mat-tab>
      <mat-tab label="کاربران و دسترسی‌ها">
        <div class="admin-grid">
          <mat-card>
            <mat-card-header><mat-card-title>ایجاد حساب کاربری</mat-card-title></mat-card-header>
            <mat-card-content>
              <form (ngSubmit)="createUser()" class="admin-form">
                <mat-form-field appearance="outline">
                  <mat-label>نام کاربری</mat-label>
                  <input matInput name="un" [(ngModel)]="userName" required autocomplete="off" />
                </mat-form-field>
                <mat-form-field appearance="outline">
                  <mat-label>نام نمایشی</mat-label>
                  <input matInput name="dn" [(ngModel)]="displayName" required />
                </mat-form-field>
                <mat-form-field appearance="outline">
                  <mat-label>رمز اولیه</mat-label>
                  <input matInput name="pw" type="password" [(ngModel)]="password"
                    required autocomplete="new-password" minlength="16" />
                  <mat-hint>حداقل ۱۶ نویسه همراه حروف، عدد و نماد</mat-hint>
                </mat-form-field>
                <button mat-flat-button class="primary-button" type="submit" [disabled]="busy()">ایجاد حساب</button>
              </form>
              <p class="muted">رمز اولیه ذخیره محلی نمی‌شود؛ فقط از کانال امن ارسال شود.</p>
            </mat-card-content>
          </mat-card>
          <mat-card>
            <mat-card-header><mat-card-title>تخصیص نقش</mat-card-title></mat-card-header>
            <mat-card-content>
              <form (ngSubmit)="grantRole()" class="admin-form">
                <mat-form-field appearance="outline">
                  <mat-label>کاربر</mat-label>
                  <mat-select name="grUser" [(ngModel)]="grantUser" required>
                    @for (u of users(); track u.id) {
                      <mat-option [value]="u.id">{{ u.displayName }}</mat-option>
                    }
                  </mat-select>
                </mat-form-field>
                <mat-form-field appearance="outline">
                  <mat-label>نقش</mat-label>
                  <mat-select name="grRole" [(ngModel)]="grantRoleId" required>
                    @for (r of roles(); track r.roleId) {
                      <mat-option [value]="r.roleId">{{ r.name }}</mat-option>
                    }
                  </mat-select>
                </mat-form-field>
                @if (!isSystemRole()) {
                  <mat-form-field appearance="outline">
                    <mat-label>مرکز مجاز</mat-label>
                    <mat-select name="grFacility" [(ngModel)]="grantFacility" required>
                      @for (f of facilities(); track f.id) {
                        <mat-option [value]="f.id">{{ f.name }}</mat-option>
                      }
                    </mat-select>
                  </mat-form-field>
                }
                <button mat-flat-button type="submit" class="primary-button"
                  [disabled]="busy() || grantUser === null || grantRoleId === null ||
                    (!isSystemRole() && grantFacility === null)">ثبت دسترسی</button>
              </form>
            </mat-card-content>
          </mat-card>
        </div>
        <mat-card class="users-card">
          <mat-card-header><mat-card-title>کاربران تعریف‌شده</mat-card-title></mat-card-header>
          <div class="table-scroll">
            <table mat-table [dataSource]="users()" class="page-table">
              <ng-container matColumnDef="userName">
                <th mat-header-cell *matHeaderCellDef>نام کاربری</th>
                <td mat-cell *matCellDef="let user">{{ user.userName }}</td>
              </ng-container>
              <ng-container matColumnDef="displayName">
                <th mat-header-cell *matHeaderCellDef>نام</th>
                <td mat-cell *matCellDef="let user">{{ user.displayName }}</td>
              </ng-container>
              <ng-container matColumnDef="status">
                <th mat-header-cell *matHeaderCellDef>وضعیت</th>
                <td mat-cell *matCellDef="let user">{{ user.isActive ? 'فعال' : 'غیرفعال' }}</td>
              </ng-container>
              <ng-container matColumnDef="actions">
                <th mat-header-cell *matHeaderCellDef>عملیات</th>
                <td mat-cell *matCellDef="let user">
                  <button mat-stroked-button type="button" [disabled]="busy() || !user.isActive"
                    (click)="deactivate(user)">غیرفعال کردن</button>
                </td>
              </ng-container>
              <tr mat-header-row *matHeaderRowDef="userColumns"></tr>
              <tr mat-row *matRowDef="let row; columns: userColumns;"></tr>
            </table>
          </div>
        </mat-card>
      </mat-tab>
    </mat-tab-group>
  `,
  styles: [`
    .admin-tabs{margin-top:15px}
    .admin-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(330px,100%),1fr));gap:18px;margin:19px 0}
    mat-card-title{font-weight:800;font-size:17px}
    mat-card-content{padding-top:17px!important}
    .admin-form{display:grid;grid-template-columns:1fr;gap:8px}
    .admin-form button{justify-self:start;min-width:140px}
    .facility-list{display:grid;gap:8px;max-height:220px;overflow:auto}
    .facility-row{display:flex;align-items:center;justify-content:space-between;gap:8px;
      border:1px solid #e2e8f0;border-radius:8px;padding:8px 12px;font-size:13px}
    .facility-row span{color:#64748b}
    .subsection{margin-top:20px;padding-top:15px;border-top:1px solid #e2e8f0}
    .users-card{margin:17px 0;overflow:hidden}
    .page-table{min-width:590px}
    th.mat-mdc-header-cell{text-align:right;font-weight:800;background:#f8fafc}
    @media(max-width:700px){.admin-grid{grid-template-columns:1fr}.admin-form button{justify-self:stretch;width:100%}}
  `]
})
export class AdminComponent implements OnInit {
  private readonly api = inject(AdministrationService);
  readonly busy = signal(false);
  readonly error = signal<string | null>(null);
  readonly traceId = signal<string | null>(null);
  readonly message = signal<string | null>(null);
  readonly facilities = signal<OrgItem[]>([]);
  readonly users = signal<ManagedUser[]>([]);
  readonly userColumns = ['userName', 'displayName', 'status', 'actions'];
  readonly roles = signal<HemoRole[]>([]);
  facilityCode = ''; facilityName = '';
  bedDepartmentId: number | null = null; bedCode = '';
  departmentCode = ''; departmentName = ''; departmentFacility: number | null = null;
  userName = ''; displayName = ''; password = '';
  grantUser: number | null = null; grantRoleId: number | null = null; grantFacility: number | null = null;

  ngOnInit(): void { this.refresh(); }

  isSystemRole(): boolean {
    return this.roles().find(x => x.roleId === this.grantRoleId)?.code === 'SYSTEM_ADMIN';
  }

  refresh(): void {
    this.busy.set(true);
    forkJoin({
      facilities: this.api.getFacilities(), users: this.api.listUsers(), roles: this.api.getRoles()
    }).subscribe({
      next: data => {
        this.facilities.set(data.facilities); this.users.set(data.users);
        this.roles.set(data.roles); this.busy.set(false);
      },
      error: (e: ApiFailure) => this.fail(e)
    });
  }

  createFacility(): void {
    this.run(() => this.api.addFacility(this.facilityCode.trim(), this.facilityName.trim()),
      () => { this.facilityCode = ''; this.facilityName = ''; });
  }
  createDepartment(): void {
    if (this.departmentFacility === null) return;
    this.run(() => this.api.addDepartment(this.departmentFacility!,
      this.departmentCode.trim(), this.departmentName.trim()),
      () => { this.departmentCode = ''; this.departmentName = ''; });
  }
  createBed(): void {
    if (this.bedDepartmentId === null) return;
    this.run(() => this.api.addBed(this.bedDepartmentId!, this.bedCode.trim()),
      () => { this.bedCode = ''; });
  }
  createUser(): void {
    const userName = this.userName.trim();
    const displayName = this.displayName.trim();
    const initialPassword = this.password;
    this.password = '';
    this.run(() => this.api.addUser(userName, displayName, initialPassword),
      () => { this.userName = ''; this.displayName = ''; });
  }
  grantRole(): void {
    if (this.grantUser === null || this.grantRoleId === null) return;
    this.run(() => this.api.grant(this.grantUser!, this.grantRoleId!,
      this.isSystemRole() ? null : this.grantFacility, null), () => {});
  }
  deactivate(user: ManagedUser): void {
    if (!window.confirm(`کاربر «${user.displayName}» غیرفعال شود؟`)) return;
    this.run(() => this.api.deactivate(user.id), () => {});
  }

  private run<T>(request: () => import('rxjs').Observable<T>, onSuccess: () => void): void {
    if (this.busy()) return;
    this.busy.set(true); this.error.set(null); this.message.set(null); this.traceId.set(null);
    request().subscribe({
      next: () => {
        onSuccess(); this.message.set('عملیات با موفقیت در پایگاه داده ثبت شد.');
        this.busy.set(false); this.refresh();
      },
      error: (e: ApiFailure) => this.fail(e)
    });
  }
  private fail(e: ApiFailure): void {
    this.error.set(e?.message ?? 'خطا در ارتباط با سرور');
    this.traceId.set(e?.traceId ?? null); this.busy.set(false);
  }
}

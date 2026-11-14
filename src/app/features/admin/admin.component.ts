import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { AdministrationService, HemoRole, ManagedUser, OrgItem } from '../../core/api/administration.service';
import { ApiFailure } from '../../core/api/api-error';
import { RequestStateComponent } from '../../shared/components/request-state.component';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [FormsModule, RequestStateComponent],
  template: `
    <section class="heading"><p class="eyebrow">System Administration</p>
      <h1>مدیریت مراکز و کاربران</h1>
      <p class="muted">دسترسی‌ها در Backend کنترل می‌شوند. ایجاد کاربر فقط توسط مدیر دارای مجوز انجام می‌شود.</p>
    </section>
    <app-request-state [loading]="busy()" [error]="error()" [traceId]="traceId()" />
    @if (message()) { <p class="notice" role="status">{{ message() }}</p> }

    <div class="admin-grid">
      <section class="form-card">
        <h2>مراکز درمانی</h2>
        <form (ngSubmit)="createFacility()">
          <label>کد مرکز <input name="fcode" [(ngModel)]="facilityCode" required maxlength="30" /></label>
          <label>نام مرکز <input name="fname" [(ngModel)]="facilityName" required maxlength="200" /></label>
          <button class="primary-button" [disabled]="busy()">ایجاد مرکز</button>
        </form>
        <ul>
          @for (facility of facilities(); track facility.id) {
            <li>{{ facility.name }} <small>({{ facility.code }})</small></li>
          }
        </ul>
        <h3>افزودن بخش</h3>
        <form (ngSubmit)="createDepartment()">
          <label>مرکز
            <select name="df" [(ngModel)]="departmentFacility" required>
              <option [ngValue]="null">انتخاب مرکز</option>
              @for (f of facilities(); track f.id) { <option [ngValue]="f.id">{{ f.name }}</option> }
            </select>
          </label>
          <label>کد بخش <input name="dc" [(ngModel)]="departmentCode" required maxlength="40" /></label>
          <label>نام بخش <input name="dn" [(ngModel)]="departmentName" required maxlength="160" /></label>
          <button class="primary-button" [disabled]="busy() || departmentFacility === null">ثبت بخش</button>
        </form>
      </section>

      <section class="form-card">
        <h2>ایجاد حساب کاربری</h2>
        <form (ngSubmit)="createUser()">
          <label>نام کاربری <input name="un" [(ngModel)]="userName" required autocomplete="off" /></label>
          <label>نام نمایشی <input name="dn" [(ngModel)]="displayName" required /></label>
          <label>رمز اولیه (حداقل ۱۶ کاراکتر با حروف، عدد و نماد)
            <input name="pw" type="password" [(ngModel)]="password" required autocomplete="new-password" minlength="16" />
          </label>
          <button class="primary-button" [disabled]="busy()">ساخت کاربر</button>
        </form>
        <p class="muted">رمز اولیه در حافظه مرورگر ذخیره نمی‌شود. آن را فقط از کانال امن به فرد مربوط تحویل دهید.</p>
        <h3>تخصیص نقش</h3>
        <form (ngSubmit)="grantRole()">
          <label>کاربر
            <select name="grUser" [(ngModel)]="grantUser" required>
              <option [ngValue]="null">انتخاب کاربر</option>
              @for (u of users(); track u.id) { <option [ngValue]="u.id">{{ u.displayName }}</option> }
            </select>
          </label>
          <label>نقش
            <select name="grRole" [(ngModel)]="grantRoleId" required>
              <option [ngValue]="null">انتخاب نقش</option>
              @for (r of roles(); track r.roleId) { <option [ngValue]="r.roleId">{{ r.name }}</option> }
            </select>
          </label>
          @if (!isSystemRole()) {
            <label>مرکز
              <select name="grFacility" [(ngModel)]="grantFacility" required>
                <option [ngValue]="null">انتخاب مرکز</option>
                @for (f of facilities(); track f.id) { <option [ngValue]="f.id">{{ f.name }}</option> }
              </select>
            </label>
          }
          <button class="primary-button" [disabled]="busy() || grantUser === null || grantRoleId === null ||
            (!isSystemRole() && grantFacility === null)">ثبت دسترسی</button>
        </form>
      </section>
    </div>

    <section class="form-card">
      <h2>کاربران موجود</h2>
      <table><thead><tr><th>نام کاربری</th><th>نام</th><th>وضعیت</th><th>عملیات</th></tr></thead>
        <tbody>
          @for (user of users(); track user.id) {
            <tr><td>{{ user.userName }}</td><td>{{ user.displayName }}</td>
              <td>{{ user.isActive ? 'فعال' : 'غیرفعال' }}</td>
              <td><button class="outline-button" type="button" [disabled]="busy() || !user.isActive"
                (click)="deactivate(user)">غیرفعال کردن</button></td>
            </tr>
          }
        </tbody>
      </table>
    </section>
  `,
  styles: [`
    .admin-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(290px,1fr));gap:20px}
    .form-card{background:#fff;border-radius:14px;padding:22px;border:1px solid #e2e8f0;margin-bottom:18px}
    h2{margin-top:0}.form-card form{display:grid;gap:12px;margin:15px 0}
    label{display:grid;gap:4px;font-size:13px;font-weight:600}
    input,select{padding:10px;border:1px solid #cbd5e1;border-radius:8px;width:100%;font:inherit}
    .outline-button{background:#fff;border:1px solid #9daabd;border-radius:7px;padding:6px 10px;cursor:pointer}
    .outline-button:disabled{opacity:.5;cursor:default}
    table{border-collapse:collapse;width:100%}td,th{padding:10px;text-align:right;border-bottom:1px solid #e2e8f0}
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
  readonly roles = signal<HemoRole[]>([]);
  facilityCode = ''; facilityName = '';
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

import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AdmissionView, AdmissionsService, IdentityVerificationView, WristbandView } from '../../core/api/admissions.service';
import { ApiFailure } from '../../core/api/api-error';
import { RequestStateComponent } from '../../shared/components/request-state.component';
import { isoToJalali, jalaliToIso } from '../../shared/jalali-date';

@Component({
  selector: 'app-admission-identity',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, RequestStateComponent],
  template: `
    <section class="heading"><p class="eyebrow">Admission / Identity</p>
      <h1>پرونده بستری و کنترل هویت</h1>
      <p class="muted">تطبیق هویت باید در کنار بیمار و با رعایت دستورالعمل مرکز انجام شود.</p>
    </section>
    <app-request-state [loading]="busy()" [error]="error()" [traceId]="traceId()"/>
    @if (record(); as patient) {
      <section class="record-card">
        <h2>اطلاعات بیمار</h2>
        <dl>
          <dt>شناسه بستری</dt><dd>{{ patient.encounterId }}</dd>
          <dt>نام</dt><dd>{{ patient.firstName }} {{ patient.lastName }}</dd>
          <dt>کد ملی/شناسه ناشناس</dt>
          <dd>{{ patient.nationalId ?? patient.unknownIdentityCode }}</dd>
          <dt>تاریخ تولد</dt><dd>{{ jalali(patient.birthDate) || 'ثبت نشده' }}</dd>
          <dt>تاریخ پذیرش</dt><dd>{{ jalali(patient.admittedAt) }}</dd>
          <dt>وضعیت</dt><dd>{{ patient.status }}</dd>
        </dl>
      </section>

      <section class="record-card">
        <h2>مچ‌بند و بارکد</h2>
        <p class="muted">بارکد توسط سرور صادر می‌شود. صدور به معنی موفقیت چاپ فیزیکی نیست.</p>
        @if (patient.activeBarcode; as barcode) {
          <div id="wristband" class="wristband" dir="ltr">
            <strong>HEMO</strong><span>{{ barcode }}</span>
            <small>{{ patient.firstName }} {{ patient.lastName }} · {{ patient.encounterId }}</small>
          </div>
          <button class="primary-button" type="button" (click)="printBand()">چاپ مچ‌بند</button>
        } @else {
          <button class="primary-button" type="button" [disabled]="busy()" (click)="issueBand()">
            صدور بارکد مچ‌بند
          </button>
        }
      </section>

      <section class="record-card">
        <h2>تطبیق دو شناسه بیمار</h2>
        <p class="muted">مقادیر را از مچ‌بند و فرایند تأیید هویت وارد کنید؛ سیستم مطابقت را با پرونده ثبت‌شده بررسی می‌کند.</p>
        <form [formGroup]="verifyForm" (ngSubmit)="verify()">
          <label>بارکد اسکن‌شده <input formControlName="barcode" required autocomplete="off" /></label>
          <label>شناسه اول (کد ملی یا شناسه ناشناس)
            <input formControlName="firstIdentifier" required autocomplete="off" />
          </label>
          <label>شناسه دوم (نام کامل بیمار)
            <input formControlName="secondIdentifier" required autocomplete="off" />
          </label>
          <label>دلیل مغایرت (در صورت وجود)
            <textarea formControlName="mismatchReason" maxlength="800" rows="2"></textarea>
          </label>
          <label class="check-label"><input type="checkbox" formControlName="checklistConfirmed" />
            کنترل‌های حضوری هویت انجام شده‌اند
          </label>
          <button class="primary-button" type="submit" [disabled]="busy() || !patient.activeBarcode">
            ثبت نتیجه تطبیق
          </button>
        </form>
        @if (verification(); as result) {
          <p class="notice" [class.mismatch]="result.status !== 'Verified'" role="status">
            {{ result.status === 'Verified' ? 'تطبیق هویت ثبت شد.' :
              'مغایرت هویتی ثبت شد؛ ادامه فرایند نیازمند بررسی مسئول مربوط است.' }}
          </p>
        }
      </section>

      <section class="record-card">
        <h2>اصلاح مشخصات عمومی</h2>
        <p class="muted">تغییرات با RowVersion کنترل می‌شوند؛ ویرایش هم‌زمان با خطای تعارض رد می‌شود.</p>
        <form [formGroup]="editForm" (ngSubmit)="updatePatient()">
          <label>نام <input formControlName="firstName" required /></label>
          <label>نام خانوادگی <input formControlName="lastName" required /></label>
          <label>نام پدر <input formControlName="fatherName" /></label>
          <label>تاریخ تولد شمسی <input formControlName="birthDateJalali" placeholder="۱۳۶۵/۰۲/۱۴" /></label>
          <label>جنسیت <select formControlName="sex">
            <option value="U">نامشخص</option><option value="M">مرد</option><option value="F">زن</option>
          </select></label>
          <label>شماره تماس <input formControlName="mobile" /></label>
          <button class="primary-button" type="submit" [disabled]="busy()">ذخیره اصلاحات</button>
        </form>
      </section>
      <p><a [routerLink]="['/admission/list']" [queryParams]="{facilityId,departmentId}"
        class="text-link">بازگشت به فهرست</a></p>
    }
  `,
  styles: [`
    .record-card{background:#fff;border:1px solid #e2e8f0;border-radius:14px;padding:22px;margin-bottom:18px}
    dl{display:grid;grid-template-columns:minmax(130px,180px) 1fr;gap:8px}
    dt{color:#64748b}dd{margin:0;font-weight:600;overflow-wrap:anywhere}
    form{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:14px}
    label{display:grid;gap:4px;font-weight:600;font-size:13px}
    input,select,textarea{padding:10px;border:1px solid #cbd5e1;border-radius:8px;font:inherit}
    .check-label{display:flex;flex-direction:row;align-items:center;gap:8px;grid-column:1/-1}
    .wristband{display:flex;gap:5px;flex-direction:column;border:2px dashed #64748b;
      border-radius:10px;padding:15px;margin:10px 0;width:max-content;max-width:100%;overflow-wrap:anywhere}
    .wristband span{font-family:monospace;letter-spacing:1px}
    .mismatch{background:#fff1f2;color:#a11a2b}
    @media print{.record-card:not(:has(#wristband)),.heading,button,a,footer,aside,header{display:none!important}
      .wristband{border:1px solid #000}}
  `]
})
export class AdmissionIdentityComponent implements OnInit {
  private readonly api = inject(AdmissionsService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  readonly record = signal<AdmissionView | null>(null);
  readonly verification = signal<IdentityVerificationView | null>(null);
  readonly busy = signal(false);
  readonly error = signal<string | null>(null);
  readonly traceId = signal<string | null>(null);
  readonly jalali = isoToJalali;
  facilityId = 0; departmentId = 0; encounterId = 0;
  readonly verifyForm = this.fb.nonNullable.group({
    barcode: '', firstIdentifier: '', secondIdentifier: '',
    mismatchReason: '', checklistConfirmed: false
  });
  readonly editForm = this.fb.nonNullable.group({
    firstName: '', lastName: '', fatherName: '', birthDateJalali: '', sex: 'U', mobile: ''
  });

  ngOnInit(): void {
    this.facilityId = Number(this.route.snapshot.paramMap.get('facilityId'));
    this.departmentId = Number(this.route.snapshot.paramMap.get('departmentId'));
    this.encounterId = Number(this.route.snapshot.paramMap.get('encounterId'));
    if ([this.facilityId, this.departmentId, this.encounterId]
        .some(id => !Number.isSafeInteger(id) || id <= 0)) {
      void this.router.navigateByUrl('/admission'); return;
    }
    this.reload();
  }

  reload(): void {
    this.busy.set(true); this.error.set(null); this.traceId.set(null);
    this.api.get(this.facilityId, this.departmentId, this.encounterId).subscribe({
      next: value => {
        this.record.set(value);
        this.editForm.patchValue({
          firstName: value.firstName, lastName: value.lastName,
          birthDateJalali: isoToJalali(value.birthDate), sex: value.sex
        });
        this.busy.set(false);
      },
      error: (e: ApiFailure) => this.fail(e)
    });
  }

  issueBand(): void {
    this.busy.set(true); this.error.set(null);
    this.api.issueBand(this.facilityId, this.departmentId, this.encounterId).subscribe({
      next: (_band: WristbandView) => this.reload(),
      error: (e: ApiFailure) => this.fail(e)
    });
  }

  printBand(): void { window.print(); }

  verify(): void {
    const v = this.verifyForm.getRawValue();
    if (!v.barcode.trim() || !v.firstIdentifier.trim() || !v.secondIdentifier.trim()) {
      this.error.set('هر دو شناسه و بارکد الزامی هستند.'); return;
    }
    this.busy.set(true); this.error.set(null); this.verification.set(null);
    this.api.verify(this.facilityId, this.departmentId, this.encounterId, {
      barcode: v.barcode.trim(), firstIdentifier: v.firstIdentifier.trim(),
      secondIdentifier: v.secondIdentifier.trim(),
      checklistConfirmed: v.checklistConfirmed,
      mismatchReason: v.mismatchReason.trim() || null
    }).subscribe({
      next: result => { this.verification.set(result); this.busy.set(false); },
      error: (e: ApiFailure) => this.fail(e)
    });
  }

  updatePatient(): void {
    const existing = this.record(); if (!existing) return;
    const v = this.editForm.getRawValue();
    if (!v.firstName.trim() || !v.lastName.trim()) {
      this.error.set('نام و نام خانوادگی نمی‌تواند خالی باشد.'); return;
    }
    const date = v.birthDateJalali.trim() ? jalaliToIso(v.birthDateJalali) : null;
    if (v.birthDateJalali.trim() && !date) {
      this.error.set('تاریخ شمسی معتبر نیست.'); return;
    }
    this.busy.set(true); this.error.set(null);
    this.api.update(this.facilityId, this.departmentId, this.encounterId, {
      firstName: v.firstName.trim(), lastName: v.lastName.trim(),
      fatherName: v.fatherName.trim() || null, birthDate: date,
      sex: v.sex, mobile: v.mobile.trim() || null,
      rowVersion: existing.patientRowVersion
    }).subscribe({
      next: () => this.reload(),
      error: (e: ApiFailure) => this.fail(e)
    });
  }

  private fail(e: ApiFailure): void {
    this.error.set(e.message ?? 'خطا در دریافت اطلاعات');
    this.traceId.set(e.traceId ?? null); this.busy.set(false);
  }
}

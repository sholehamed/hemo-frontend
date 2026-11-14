import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
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
  imports: [ReactiveFormsModule, RouterLink, RequestStateComponent,
    MatButtonModule, MatCardModule, MatCheckboxModule,
    MatFormFieldModule, MatInputModule, MatSelectModule],
  template: `
    <section class="heading"><p class="eyebrow">ADMISSION / IDENTITY</p>
      <h1>پرونده بستری و کنترل هویت</h1>
      <p class="muted">کنترل هویت در کنار بیمار و با رعایت دستورالعمل مصوب مرکز انجام شود.</p>
    </section>
    <app-request-state [loading]="busy()" [error]="error()" [traceId]="traceId()" />
    @if (record(); as patient) {
      <div class="identity-grid">
        <mat-card class="record-card">
          <mat-card-header><mat-card-title>اطلاعات بیمار</mat-card-title></mat-card-header>
          <mat-card-content>
            <dl>
              <dt>شناسه بستری</dt><dd>{{ patient.encounterId }}</dd>
              <dt>نام</dt><dd>{{ patient.firstName }} {{ patient.lastName }}</dd>
              <dt>کد ملی/شناسه ناشناس</dt>
              <dd dir="ltr">{{ patient.nationalId ?? patient.unknownIdentityCode }}</dd>
              <dt>تاریخ تولد</dt><dd>{{ jalali(patient.birthDate) || 'ثبت نشده' }}</dd>
              <dt>تاریخ پذیرش</dt><dd>{{ jalali(patient.admittedAt) }}</dd>
              <dt>وضعیت</dt><dd><span class="status-pill">{{ patient.status }}</span></dd>
            </dl>
          </mat-card-content>
        </mat-card>
        <mat-card class="record-card">
          <mat-card-header><mat-card-title>مچ‌بند و شناسه رهگیری</mat-card-title></mat-card-header>
          <mat-card-content>
            <p class="muted">صدور شناسه در سامانه، تضمین چاپ یا اسکن صحیح روی تجهیزات بیمارستانی نیست.</p>
            @if (patient.activeBarcode; as barcode) {
              <div id="wristband" class="wristband" dir="ltr">
                <strong>HEMO</strong><span>{{ barcode }}</span>
                <small>{{ patient.firstName }} {{ patient.lastName }} · {{ patient.encounterId }}</small>
              </div>
              <button mat-stroked-button type="button" (click)="printBand()">چاپ مچ‌بند</button>
            } @else {
              <button mat-flat-button class="primary-button" type="button" [disabled]="busy()"
                (click)="issueBand()">صدور بارکد مچ‌بند</button>
            }
          </mat-card-content>
        </mat-card>
      </div>

      <mat-card class="record-card verify-card">
        <mat-card-header><mat-card-title>تطبیق دو شناسه بیمار</mat-card-title></mat-card-header>
        <mat-card-content>
          <p class="muted">اسکن مچ‌بند و تطبیق شناسه‌ها را با اطلاعات حضوری بررسی کنید.</p>
          <form class="form-grid" [formGroup]="verifyForm" (ngSubmit)="verify()">
            <mat-form-field appearance="outline">
              <mat-label>بارکد اسکن‌شده</mat-label>
              <input matInput formControlName="barcode" required autocomplete="off" />
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>شناسه اول (کد ملی یا شناسه ناشناس)</mat-label>
              <input matInput formControlName="firstIdentifier" required autocomplete="off" />
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>شناسه دوم (نام کامل)</mat-label>
              <input matInput formControlName="secondIdentifier" required autocomplete="off" />
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>دلیل مغایرت</mat-label>
              <textarea matInput formControlName="mismatchReason" maxlength="800" rows="2"></textarea>
            </mat-form-field>
            <mat-checkbox class="full" formControlName="checklistConfirmed">
              کنترل‌های حضوری هویت انجام شده‌اند
            </mat-checkbox>
            <div class="page-actions full">
              <button mat-flat-button class="primary-button" type="submit"
                [disabled]="busy() || !patient.activeBarcode">ثبت نتیجه تطبیق</button>
            </div>
          </form>
          @if (verification(); as result) {
            <div class="result-banner" [class.mismatch]="result.status !== 'Verified'" role="status">
              {{ result.status === 'Verified' ? 'تطبیق هویت ثبت شد.' :
                'مغایرت هویتی ثبت شد؛ ادامه فرایند نیازمند بررسی مسئول مربوط است.' }}
            </div>
          }
        </mat-card-content>
      </mat-card>

      <mat-card class="record-card">
        <mat-card-header><mat-card-title>اصلاح مشخصات عمومی</mat-card-title></mat-card-header>
        <mat-card-content>
          <p class="muted">ویرایش هم‌زمان توسط RowVersion مدیریت می‌شود.</p>
          <form [formGroup]="editForm" (ngSubmit)="updatePatient()" class="form-grid">
            <mat-form-field appearance="outline">
              <mat-label>نام</mat-label><input matInput formControlName="firstName" required />
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>نام خانوادگی</mat-label><input matInput formControlName="lastName" required />
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>نام پدر</mat-label><input matInput formControlName="fatherName" />
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>تاریخ تولد شمسی</mat-label>
              <input matInput formControlName="birthDateJalali" placeholder="۱۳۶۵/۰۲/۱۴" />
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>جنسیت</mat-label>
              <mat-select formControlName="sex">
                <mat-option value="U">نامشخص</mat-option><mat-option value="M">مرد</mat-option>
                <mat-option value="F">زن</mat-option>
              </mat-select>
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>شماره تماس</mat-label>
              <input matInput formControlName="mobile" />
            </mat-form-field>
            <div class="full page-actions">
              <button mat-flat-button class="primary-button" type="submit"
                [disabled]="busy()">ذخیره اصلاحات</button>
            </div>
          </form>
        </mat-card-content>
      </mat-card>
      <div class="page-actions">
        <a mat-button [routerLink]="['/admission/list']"
          [queryParams]="{facilityId,departmentId}">بازگشت به فهرست</a>
      </div>
    }
  `,
  styles: [`
    .identity-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(340px,100%),1fr));gap:17px}
    .record-card{margin-bottom:18px;overflow:hidden}
    mat-card-title{font-size:18px;font-weight:800}
    mat-card-content{padding-top:18px!important}
    dl{display:grid;grid-template-columns:minmax(110px,165px) minmax(0,1fr);gap:10px;margin:0}
    dt{color:#64748b;font-size:12px}
    dd{margin:0;font-size:13px;font-weight:700;overflow-wrap:anywhere}
    .status-pill{background:#e1f2e9;color:#216d4a;padding:5px 10px;border-radius:20px}
    .wristband{display:flex;flex-direction:column;gap:6px;border:2px dashed #9aa7b9;
      border-radius:10px;padding:16px;margin:14px 0;max-width:100%;overflow-wrap:anywhere;background:#fafcff}
    .wristband span{font:700 14px monospace;letter-spacing:1px}
    .form-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(235px,100%),1fr));gap:11px 17px}
    .full{grid-column:1/-1}
    .result-banner{padding:14px 18px;background:#e3f5ea;border:1px solid #afdec1;
      color:#146b42;border-radius:10px;font-weight:700}
    .result-banner.mismatch{background:#fff1f2;border-color:#ffd0d4;color:#a11a2b}
    @media(max-width:620px){dl{grid-template-columns:1fr 1fr}.form-grid{grid-template-columns:1fr}}
    @media print{.heading,button,a,.verify-card{display:none!important}
      .record-card:not(:has(#wristband)){display:none!important}
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

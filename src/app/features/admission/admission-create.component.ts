import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AdmissionsService, CreateAdmission } from '../../core/api/admissions.service';
import { OrgItem } from '../../core/api/administration.service';
import { ApiFailure } from '../../core/api/api-error';
import { RequestStateComponent } from '../../shared/components/request-state.component';
import { jalaliToIso, normalizeDigits } from '../../shared/jalali-date';

@Component({
  selector: 'app-admission-create',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, RequestStateComponent,
    MatButtonModule, MatCardModule, MatCheckboxModule, MatFormFieldModule,
    MatInputModule, MatSelectModule],
  template: `
    <section class="heading">
      <p class="eyebrow">Admission / New patient</p>
      <h1>پذیرش بیمار جدید</h1>
      <p class="muted">تشکیل پرونده بیمار و ثبت بستری در پایگاه داده مرکز مجاز.</p>
    </section>
    <app-request-state [loading]="busy()" [error]="error()" [traceId]="traceId()" />
    <form [formGroup]="form" (ngSubmit)="submit()" class="admission-form">
      <mat-card class="form-section">
        <mat-card-header><mat-card-title><span class="step">۱</span> مشخصات بیمار</mat-card-title></mat-card-header>
        <mat-card-content>
          <mat-checkbox formControlName="isUnknown" color="primary">بیمار مجهول‌الهویه</mat-checkbox>
          <div class="form-grid">
            @if (!form.controls.isUnknown.value) {
              <mat-form-field appearance="outline">
                <mat-label>کد ملی</mat-label>
                <input matInput formControlName="nationalId" inputmode="numeric"
                  maxlength="10" placeholder="۰۰۱۲۳۴۵۶۷۸" />
                <mat-hint>۱۰ رقم، بدون خط تیره</mat-hint>
              </mat-form-field>
            } @else {
              <p class="muted unknown-info">شناسه ناشناس یکتا توسط سرور تولید خواهد شد.</p>
            }
            <mat-form-field appearance="outline">
              <mat-label>نام</mat-label><input matInput formControlName="firstName" maxlength="100" />
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>نام خانوادگی</mat-label><input matInput formControlName="lastName" maxlength="120" />
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>نام پدر</mat-label><input matInput formControlName="fatherName" maxlength="100" />
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>تاریخ تولد شمسی</mat-label>
              <input matInput formControlName="birthDateJalali" placeholder="۱۳۶۵/۰۲/۱۴" inputmode="numeric" />
              <mat-hint>سال/ماه/روز؛ به ISO تبدیل می‌شود</mat-hint>
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
              <input matInput formControlName="mobile" inputmode="tel" maxlength="30" />
            </mat-form-field>
          </div>
        </mat-card-content>
      </mat-card>

      <mat-card class="form-section">
        <mat-card-header><mat-card-title><span class="step">۲</span> اطلاعات بستری</mat-card-title></mat-card-header>
        <mat-card-content class="form-grid">
          <mat-form-field appearance="outline">
            <mat-label>نوع پذیرش</mat-label>
            <mat-select formControlName="admissionType">
              <mat-option value="Routine">عادی</mat-option>
              <mat-option value="Emergency">اورژانسی</mat-option>
              <mat-option value="Transfer">انتقالی</mat-option>
              <mat-option value="Other">سایر</mat-option>
            </mat-select>
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>تخت (اختیاری)</mat-label>
            <mat-select formControlName="bedId">
              <mat-option value="">بدون تخصیص تخت</mat-option>
              @for (bed of beds(); track bed.id) {
                <mat-option [value]="bed.id">{{ bed.code }}</mat-option>
              }
            </mat-select>
          </mat-form-field>
          <mat-form-field appearance="outline" class="full">
            <mat-label>توضیحات پذیرش</mat-label>
            <textarea matInput formControlName="admissionNote" rows="3" maxlength="1000"></textarea>
          </mat-form-field>
        </mat-card-content>
      </mat-card>
      <div class="page-actions">
        <button mat-flat-button class="primary-button" type="submit" [disabled]="busy()">
          {{ busy() ? 'در حال ثبت…' : 'ثبت بیمار و بستری' }}
        </button>
        <a mat-stroked-button routerLink="/admission">انصراف</a>
      </div>
    </form>
  `,
  styles: [`
    .admission-form{display:grid;gap:19px}
    .form-section{width:100%}
    mat-card-title{display:flex;align-items:center;gap:10px;font-size:17px;font-weight:800}
    mat-card-content{padding-top:20px!important}
    .step{display:grid;place-items:center;background:#b91c35;color:white;font-size:13px;
      width:28px;height:28px;border-radius:50%}
    .form-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(245px,100%),1fr));gap:8px 18px}
    mat-checkbox{display:block;margin:1px 0 20px}
    .unknown-info{align-self:center}
    .full{grid-column:1/-1}
    .page-actions{margin-bottom:20px}
    @media(max-width:650px){.form-grid{grid-template-columns:1fr}}
  `]
})
export class AdmissionCreateComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly api = inject(AdmissionsService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  readonly busy = signal(false);
  readonly error = signal<string | null>(null);
  readonly traceId = signal<string | null>(null);
  readonly beds = signal<OrgItem[]>([]);

  facilityId = 0;
  departmentId = 0;
  readonly form = this.fb.nonNullable.group({
    nationalId: '', isUnknown: false,
    firstName: ['', [Validators.maxLength(100)]],
    lastName: ['', [Validators.maxLength(120)]],
    fatherName: '', birthDateJalali: '', sex: 'U',
    mobile: '', admissionType: 'Routine', bedId: '', admissionNote: ''
  });

  ngOnInit(): void {
    this.facilityId = Number(this.route.snapshot.queryParamMap.get('facilityId'));
    this.departmentId = Number(this.route.snapshot.queryParamMap.get('departmentId'));
    if (!Number.isSafeInteger(this.facilityId) || this.facilityId <= 0 ||
        !Number.isSafeInteger(this.departmentId) || this.departmentId <= 0) {
      void this.router.navigateByUrl('/admission'); return;
    }
    this.api.beds(this.facilityId, this.departmentId).subscribe({
      next: items => this.beds.set(items),
      error: (e: ApiFailure) => this.error.set(e.message)
    });
  }

  submit(): void {
    if (this.busy()) return;
    const value = this.form.getRawValue();
    const national = normalizeDigits(value.nationalId.trim());
    if (!value.isUnknown && !/^\d{10}$/.test(national)) {
      this.error.set('کد ملی باید دقیقاً ۱۰ رقم باشد.'); return;
    }
    if (!value.isUnknown && (!value.firstName.trim() || !value.lastName.trim())) {
      this.error.set('نام و نام خانوادگی الزامی است.'); return;
    }
    const isoDate = value.birthDateJalali.trim()
      ? jalaliToIso(value.birthDateJalali) : null;
    if (value.birthDateJalali.trim() && !isoDate) {
      this.error.set('تاریخ شمسی معتبر نیست.'); return;
    }
    if (this.form.invalid) { this.error.set('اطلاعات فرم معتبر نیست.'); return; }

    const payload: CreateAdmission = {
      nationalId: value.isUnknown ? null : national,
      isUnknown: value.isUnknown,
      firstName: value.firstName.trim(), lastName: value.lastName.trim(),
      fatherName: value.fatherName.trim() || null,
      birthDate: isoDate, sex: value.sex,
      mobile: value.mobile.trim() || null,
      admissionType: value.admissionType,
      bedId: value.bedId ? Number(value.bedId) : null,
      admissionNote: value.admissionNote.trim() || null
    };
    this.busy.set(true); this.error.set(null); this.traceId.set(null);
    this.api.create(this.facilityId, this.departmentId, payload).subscribe({
      next: created => {
        this.busy.set(false);
        void this.router.navigate(['/admission/identity',
          this.facilityId, this.departmentId, created.encounterId]);
      },
      error: (e: ApiFailure) => {
        this.error.set(e.message); this.traceId.set(e.traceId); this.busy.set(false);
      }
    });
  }
}

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
  imports: [ReactiveFormsModule, RouterLink, RequestStateComponent],
  template: `
    <section class="heading">
      <p class="eyebrow">Admission / New</p>
      <h1>پذیرش بیمار جدید</h1>
      <p class="muted">اطلاعات این فرم در SQL Server ثبت می‌شود. شماره HIS بدون اتصال واقعی ساخته نخواهد شد.</p>
    </section>
    <app-request-state [loading]="busy()" [error]="error()" [traceId]="traceId()" />
    <form [formGroup]="form" (ngSubmit)="submit()" class="admission-form">
      <fieldset><legend>مشخصات بیمار</legend>
        <label class="check-label">
          <input type="checkbox" formControlName="isUnknown" />
          بیمار مجهول‌الهویه
        </label>
        @if (!form.controls.isUnknown.value) {
          <label>کد ملی <input formControlName="nationalId" inputmode="numeric"
            maxlength="10" placeholder="۰۰۱۲۳۴۵۶۷۸" /></label>
        } @else {
          <p class="muted">سیستم شناسه ناشناس یکتا صادر می‌کند؛ نیازی به کد ملی نیست.</p>
        }
        <label>نام <input formControlName="firstName" maxlength="100" placeholder="نام" /></label>
        <label>نام خانوادگی <input formControlName="lastName" maxlength="120" placeholder="نام خانوادگی" /></label>
        <label>نام پدر <input formControlName="fatherName" maxlength="100" /></label>
        <label>تاریخ تولد شمسی
          <input formControlName="birthDateJalali" placeholder="۱۳۶۵/۰۲/۱۴" inputmode="numeric" />
        </label>
        <label>جنسیت
          <select formControlName="sex">
            <option value="U">نامشخص</option><option value="M">مرد</option><option value="F">زن</option>
          </select>
        </label>
        <label>شماره تماس <input formControlName="mobile" inputmode="tel" maxlength="30" /></label>
      </fieldset>
      <fieldset><legend>مشخصات بستری</legend>
        <label>نوع پذیرش
          <select formControlName="admissionType">
            <option value="Routine">عادی</option>
            <option value="Emergency">اورژانسی</option>
            <option value="Transfer">انتقالی</option>
            <option value="Other">سایر</option>
          </select>
        </label>
        <label>تخت (اختیاری)
          <select formControlName="bedId">
            <option value="">بدون تخصیص تخت</option>
            @for (bed of beds(); track bed.id) {
              <option [value]="bed.id">{{ bed.code }}</option>
            }
          </select>
        </label>
        <label class="full">توضیحات پذیرش
          <textarea formControlName="admissionNote" rows="3" maxlength="1000"></textarea>
        </label>
      </fieldset>
      <div class="buttons">
        <button class="primary-button" type="submit" [disabled]="busy()">
          {{ busy() ? 'در حال ثبت…' : 'ثبت بیمار و بستری' }}
        </button>
        <a routerLink="/admission" class="text-link">انصراف</a>
      </div>
    </form>
  `,
  styles: [`
    .admission-form{background:#fff;border:1px solid #e2e8f0;border-radius:14px;padding:24px}
    fieldset{border:0;margin:0 0 24px;padding:0;display:grid;
      grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:14px}
    legend{font-weight:bold;font-size:19px;margin-bottom:14px}
    label{font-weight:600;font-size:13px;display:flex;flex-direction:column;gap:5px}
    input,select,textarea{padding:10px 12px;border:1px solid #ccd7e1;border-radius:8px;font:inherit;width:100%}
    .check-label{flex-direction:row;align-items:center;gap:8px;grid-column:1/-1}
    .check-label input{width:auto}.full{grid-column:1/-1}.buttons{display:flex;align-items:center;gap:18px}
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

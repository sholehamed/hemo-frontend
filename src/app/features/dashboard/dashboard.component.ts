import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { HEMO_AREAS } from '../../core/navigation/areas';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [RouterLink],
  template: `
    <section class="heading">
      <p class="eyebrow">Hemo · Stage 2A</p>
      <h1>سامانه یکپارچه هموویژیلانس</h1>
      <p class="muted">خوش آمدید {{ auth.session()?.displayName }}. حوزه‌های زیر براساس نقش‌های حساب شما نمایش داده می‌شوند.</p>
    </section>
    <section class="notice" role="status">
      <strong>وضعیت توسعه</strong>
      <span>احراز هویت و نقش‌های پایگاه داده به سرویس متصل شده‌اند. ثبت بیمار و فرایندهای بالینی هنوز فعال نیستند.</span>
    </section>
    <h2>حوزه‌های سامانه</h2>
    <div class="area-grid">
      @for (area of visibleAreas(); track area.id) {
        <a class="area-card" [routerLink]="['/areas', area.id]">
          <span class="area-icon" aria-hidden="true">{{ area.icon }}</span>
          <strong>{{ area.title }}</strong>
          <span class="muted">{{ area.subtitle }}</span>
          <span class="link-hint">مشاهده ساختار ←</span>
        </a>
      } @empty {
        <div class="notice">نقش فعالی برای این حساب وجود ندارد. از مدیر سامانه درخواست دسترسی کنید.</div>
      }
    </div>
  `
})
export class DashboardComponent {
  readonly auth = inject(AuthService);
  readonly visibleAreas = computed(() => HEMO_AREAS
    .filter(area => this.auth.canShowArea(area.roleCode)));
}

import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { HEMO_AREAS } from '../../core/navigation/areas';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [RouterLink],
  template: `
    <section class="heading">
      <p class="eyebrow">Hemo · Stage 1</p>
      <h1>سامانه یکپارچه هموویژیلانس</h1>
      <p class="muted">زیرساخت مستقل Angular و ASP.NET Core ایجاد شده است. عملیات بالینی و احراز هویت هنوز فعال نیستند.</p>
    </section>
    <section class="notice" role="status">
      <strong>وضعیت توسعه</strong>
      <span>این محیط فقط پوسته و مسیریابی اولیه است؛ ثبت بیمار، درخواست خون، تأیید، یا صدور فرآورده انجام نمی‌دهد.</span>
    </section>
    <h2>حوزه‌های سامانه</h2>
    <div class="area-grid">
      @for (area of areas; track area.id) {
        <a class="area-card" [routerLink]="['/areas', area.id]">
          <span class="area-icon" aria-hidden="true">{{ area.icon }}</span>
          <strong>{{ area.title }}</strong>
          <span class="muted">{{ area.subtitle }}</span>
          <span class="link-hint">مشاهده ساختار ←</span>
        </a>
      }
    </div>
  `
})
export class DashboardComponent {
  readonly areas = HEMO_AREAS;
}

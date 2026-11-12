import { Component, computed, inject } from '@angular/core';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import { findArea } from '../../core/navigation/areas';

@Component({
  selector: 'app-area',
  standalone: true,
  imports: [RouterLink],
  template: `
    @if (area(); as selectedArea) {
      <section class="heading">
        <p class="eyebrow">{{ selectedArea.icon }} · {{ selectedArea.title }}</p>
        <h1>{{ selectedArea.title }}</h1>
        <p class="muted">{{ selectedArea.subtitle }}</p>
      </section>
      <div class="notice">
        <strong>این بخش هنوز عملیاتی نشده است.</strong>
        <span>صفحات پروتوتایپ Hemo-raw در جریان‌های بعدی به کامپوننت‌های Angular و APIهای واقعی متصل خواهند شد.</span>
      </div>
    } @else {
      <h1>بخش یافت نشد</h1>
    }
    <p><a class="text-link" routerLink="/">بازگشت به نمای کلی</a></p>
  `
})
export class AreaComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly id = toSignal(this.route.paramMap.pipe(map(params => params.get('id'))));
  readonly area = computed(() => findArea(this.id() ?? null));
}

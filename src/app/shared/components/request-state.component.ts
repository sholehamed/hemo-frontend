import { Component, input } from '@angular/core';

@Component({
  selector: 'app-request-state',
  standalone: true,
  template: `
    @if (loading()) {
      <div class="request-state" role="status">در حال دریافت اطلاعات…</div>
    } @else if (error()) {
      <div class="request-state failure" role="alert">
        <span>{{ error() }}</span>
        @if (traceId()) { <small dir="ltr">Trace: {{ traceId() }}</small> }
      </div>
    } @else if (empty()) {
      <div class="request-state">اطلاعاتی برای نمایش وجود ندارد.</div>
    }
  `,
  styles: [`
    .request-state{padding:16px;border-radius:12px;background:#f5f7fa;color:#445467}
    .failure{background:#fff2f3;color:#9b2535;display:flex;flex-direction:column}
    small{font-size:11px}
  `]
})
export class RequestStateComponent {
  readonly loading = input(false);
  readonly empty = input(false);
  readonly error = input<string | null>(null);
  readonly traceId = input<string | null>(null);
}

import { Component, input } from '@angular/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'app-request-state', standalone: true,
  imports: [MatProgressSpinnerModule, MatCardModule],
  template: `
    @if (loading()) {
      <div class="state loading" role="status">
        <mat-spinner [diameter]="24" aria-label="در حال دریافت اطلاعات" />
        در حال دریافت اطلاعات…
      </div>
    } @else if (error()) {
      <mat-card class="state failure" role="alert">
        <mat-card-content>
          <strong>{{ error() }}</strong>
          @if (traceId()) { <small dir="ltr">Trace: {{ traceId() }}</small> }
        </mat-card-content>
      </mat-card>
    } @else if (empty()) {
      <div class="state empty">اطلاعاتی برای نمایش وجود ندارد.</div>
    }
  `,
  styles: [`
    .state{display:flex;align-items:center;gap:12px;border-radius:12px;padding:14px;margin:11px 0}
    .loading,.empty{background:#f5f7fa;color:#52647c}
    .failure{background:#fff2f3!important;color:#a5243a!important;border:1px solid #f9cbd1!important}
    .failure mat-card-content{display:flex;flex-direction:column;gap:7px;padding:8px!important}
    small{font-size:11px}
  `]
})
export class RequestStateComponent {
  readonly loading = input(false);
  readonly empty = input(false);
  readonly error = input<string | null>(null);
  readonly traceId = input<string | null>(null);
}

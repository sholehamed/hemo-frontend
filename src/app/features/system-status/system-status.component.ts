import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { SystemStatus, SystemStatusService } from '../../core/api/system-status.service';

@Component({
  selector: 'app-system-status',
  standalone: true,
  template: `
    <section class="heading">
      <p class="eyebrow">System</p>
      <h1>وضعیت اتصال API</h1>
      <p class="muted">این بررسی، وضعیت API را نشان می‌دهد؛ سلامت SQL Server در مسیر جداگانه /health/ready ارزیابی می‌شود.</p>
    </section>
    <button type="button" class="primary-button" (click)="refresh()">بررسی مجدد اتصال</button>
    @if (busy()) {
      <p role="status" class="notice">در حال بررسی ارتباط با API…</p>
    } @else if (error()) {
      <div class="notice error" role="alert">
        <strong>ارتباط با API برقرار نشد.</strong>
        <span>{{ error() }}</span>
      </div>
    } @else if (status(); as current) {
      <dl class="status-card">
        <dt>سرویس</dt><dd>{{ current.service }}</dd>
        <dt>وضعیت</dt><dd>{{ current.status }}</dd>
        <dt>زمان UTC</dt><dd>{{ current.utcTime }}</dd>
        <dt>شناسه رهگیری</dt><dd><code dir="ltr">{{ current.traceId }}</code></dd>
      </dl>
    }
  `
})
export class SystemStatusComponent implements OnInit {
  private readonly statusService = inject(SystemStatusService);
  private readonly destroyRef = inject(DestroyRef);
  readonly status = signal<SystemStatus | null>(null);
  readonly busy = signal(false);
  readonly error = signal<string | null>(null);

  ngOnInit(): void { this.refresh(); }

  refresh(): void {
    this.busy.set(true);
    this.error.set(null);
    this.status.set(null);
    this.statusService.getStatus()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: value => {
          this.status.set(value);
          this.busy.set(false);
        },
        error: () => {
          this.error.set('Backend را روی پورت 5080 اجرا کنید و تنظیمات Proxy را بررسی کنید.');
          this.busy.set(false);
        }
      });
  }
}

import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, RouterLink],
  template: `
    <section class="login-wrap">
      <div class="login-card">
        <p class="eyebrow">Hemo / حساب کاربری</p>
        <h1>ورود به سامانه هموویژیلانس</h1>
        <p class="muted">ورود با حساب کاربری معتبر تعریف‌شده در پایگاه داده Hemo</p>
        <form (ngSubmit)="submit()">
          <label for="username">نام کاربری</label>
          <input id="username" name="userName" [(ngModel)]="userName"
            required autocomplete="username" maxlength="100" />
          <label for="password">رمز عبور</label>
          <input id="password" type="password" name="password"
            [(ngModel)]="password" required autocomplete="current-password" />
          @if (error()) {
            <p class="form-error" role="alert">{{ error() }}</p>
          }
          <button class="primary-button submit" type="submit" [disabled]="busy()">
            {{ busy() ? 'در حال بررسی…' : 'ورود' }}
          </button>
        </form>
        <p class="muted help">برای ایجاد حساب یا بازیابی دسترسی با مدیر سامانه تماس بگیرید.</p>
        <a routerLink="/system/status" class="text-link">بررسی وضعیت اتصال سرویس</a>
      </div>
    </section>
  `,
  styles: [`
    .login-wrap{min-height:64vh;display:grid;place-items:center}
    .login-card{width:min(420px,100%);background:#fff;border:1px solid #e2e8f0;border-radius:18px;padding:32px;box-shadow:0 14px 60px #1a324313}
    h1{font-size:24px;margin:6px 0}
    form{display:flex;flex-direction:column;gap:9px;margin-top:26px}
    label{font-size:14px;font-weight:bold}
    input{padding:11px 13px;border:1px solid #cbd5e1;border-radius:9px;font:inherit;margin-bottom:8px}
    input:focus{border-color:#317d85;outline:2px solid #a8d8db}
    .submit{margin-top:8px}.help{margin-top:20px}.form-error{color:#b42334;font-size:13px}
  `]
})
export class LoginComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  userName = '';
  password = '';
  readonly busy = signal(false);
  readonly error = signal<string | null>(null);

  submit(): void {
    if (!this.userName.trim() || !this.password || this.busy()) return;
    this.busy.set(true);
    this.error.set(null);

    this.auth.login(this.userName.trim(), this.password).pipe(
      finalize(() => {
        this.password = '';
        this.busy.set(false);
      })
    ).subscribe({
      next: () => void this.router.navigateByUrl('/'),
      error: () => this.error.set('ورود ناموفق بود. اطلاعات حساب و ارتباط با سرویس را بررسی کنید.')
    });
  }
}

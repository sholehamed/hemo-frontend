import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, RouterLink, MatButtonModule, MatCardModule,
    MatFormFieldModule, MatInputModule, MatProgressSpinnerModule],
  template: `
    <div class="login-layout">
      <section class="welcome-panel">
        <div class="welcome-mark" aria-hidden="true">🩸</div>
        <p class="eyebrow">HEMO · CLINICAL WORKSPACE</p>
        <h2>اطلاعات دقیق، در دسترس افراد مجاز</h2>
        <p>ورود یکپارچه به فضای کاری پذیرش، پرستاری، پزشکان و بانک خون با مجوزهای تعیین‌شده برای هر بخش.</p>
        <div class="security-item">🔐 احراز هویت سمت سرور</div>
        <div class="security-item">🏥 دسترسی محدود به مرکز و بخش</div>
        <div class="security-item">⌁ رهگیری عملیات ثبت‌شده</div>
      </section>
      <mat-card class="login-card">
        <mat-card-content>
          <p class="eyebrow">ورود به حساب کاربری</p>
          <h1>به Hemo خوش آمدید</h1>
          <p class="muted">برای دسترسی به سامانه، اطلاعات حساب خود را وارد کنید.</p>
          <form (ngSubmit)="submit()" autocomplete="on">
            <mat-form-field appearance="outline">
              <mat-label>نام کاربری</mat-label>
              <input matInput id="username" name="userName" [(ngModel)]="userName"
                required autocomplete="username" maxlength="100" />
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>رمز عبور</mat-label>
              <input matInput id="password" type="password" name="password"
                [(ngModel)]="password" required autocomplete="current-password" />
            </mat-form-field>
            @if (error()) { <p class="form-error" role="alert">{{ error() }}</p> }
            <button mat-flat-button class="primary-button submit" type="submit"
              [disabled]="busy()">
              @if (busy()) {
                <mat-spinner [diameter]="18" aria-label="در حال بررسی"></mat-spinner>
                در حال بررسی…
              } @else { ورود }
            </button>
          </form>
          <p class="muted help">برای دریافت حساب یا بازیابی دسترسی، با مدیر سامانه تماس بگیرید.</p>
          <a routerLink="/system/status" class="text-link">وضعیت اتصال سرویس</a>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .login-layout{min-height:calc(100dvh - 190px);display:grid;grid-template-columns:1fr 1fr;align-items:center;gap:clamp(25px,6vw,95px)}
    .welcome-panel{padding:28px 16px}.welcome-panel h2{font-size:clamp(28px,3vw,43px);font-weight:900;line-height:1.5;margin:20px 0}
    .welcome-panel p:not(.eyebrow){color:#63738b;font-size:15px;max-width:500px}
    .welcome-mark{display:grid;place-items:center;width:72px;height:72px;border-radius:20px;font-size:33px;background:#fee1e9}
    .security-item{margin-top:17px;padding:11px 16px;border-right:3px solid #b91c35;background:#fff;border-radius:8px;font-size:13px;color:#334155;max-width:400px}
    .login-card{width:min(460px,100%);justify-self:center}
    .login-card mat-card-content{padding:clamp(24px,4vw,40px)!important}
    h1{font-size:29px;margin:5px 0}.login-card form{display:grid;gap:10px;margin:26px 0 0}
    .submit{width:100%;min-height:48px;display:flex;align-items:center;justify-content:center;gap:12px}
    .help{margin-top:22px;font-size:12px}.form-error{color:#a51c33;margin:0;font-size:13px}
    @media(max-width:950px){.login-layout{grid-template-columns:1fr;gap:14px}.welcome-panel{display:none}.login-card{width:min(460px,100%);margin:30px 0}}
    @media(max-width:470px){.login-layout{min-height:60dvh}.login-card mat-card-content{padding:20px!important}h1{font-size:24px}}
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
      finalize(() => { this.password = ''; this.busy.set(false); })
    ).subscribe({
      next: () => void this.router.navigateByUrl('/'),
      error: () => this.error.set('ورود ناموفق بود. اطلاعات حساب و ارتباط سرویس را بررسی کنید.')
    });
  }
}

import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { AuthService } from '../../core/auth/auth.service';
import { HEMO_AREAS } from '../../core/navigation/areas';

@Component({
  selector: 'app-dashboard', standalone: true,
  imports: [RouterLink, MatCardModule, MatButtonModule],
  template: `
    <section class="heading">
      <p class="eyebrow">HEMO / WORKSPACE</p>
      <h1>سامانه یکپارچه هموویژیلانس</h1>
      <p class="muted">خوش آمدید {{ auth.session()?.displayName }}. حوزه‌های زیر براساس نقش‌های حساب شما نمایش داده می‌شوند.</p>
    </section>
    <mat-card class="welcome-card">
      <mat-card-content>
        <div class="welcome-content">
          <span aria-hidden="true" class="welcome-icon">✚</span>
          <div><strong>فضای کاری شما آماده است</strong>
            <p>برای مشاهده اطلاعات و انجام عملیات، حوزه مجاز خود را انتخاب کنید.</p>
          </div>
        </div>
      </mat-card-content>
    </mat-card>
    <h2 class="section-title">حوزه‌های سامانه</h2>
    <div class="area-grid">
      @for (area of visibleAreas(); track area.id) {
        <mat-card class="area-card">
          <a class="area-card-link"
            [routerLink]="area.id === 'admission' ? ['/admission'] : ['blood-bank','supervisor'].includes(area.id) ? ['/blood-bank'] : ['nursing','doctor'].includes(area.id) ? ['/clinical/requests'] : ['/areas', area.id]">
            <span class="area-icon" aria-hidden="true">{{ area.icon }}</span>
            <strong>{{ area.title }}</strong>
            <span class="muted">{{ area.subtitle }}</span>
            <span class="link-hint">ورود به بخش ←</span>
          </a>
        </mat-card>
      } @empty {
        <mat-card><mat-card-content>نقش فعالی برای این حساب ثبت نشده است. از مدیر سامانه دسترسی بخواهید.</mat-card-content></mat-card>
      }
    </div>
  `,
  styles: [`
    .welcome-card{margin-bottom:30px;background:linear-gradient(112deg,#172235,#334259)!important;color:#fff!important}
    .welcome-content{display:flex;align-items:center;gap:18px;padding:7px 0}
    .welcome-icon{display:grid;place-items:center;border-radius:14px;background:#b91c35;width:54px;height:54px;flex:none;font-size:28px}
    .welcome-content strong{font-size:19px}.welcome-content p{font-size:13px;opacity:.78;margin:4px 0 0}
    .area-card{padding:0!important;min-height:170px}.area-card-link{display:flex;flex-direction:column;gap:8px;text-decoration:none;color:inherit;padding:24px;height:100%;min-height:167px}
    .area-card-link:hover{color:#b91c35}.area-card strong{font-size:17px}
    @media(max-width:760px){.welcome-content{align-items:start}.welcome-icon{width:43px;height:43px}.area-card-link{min-height:125px;padding:18px}}
  `]
})
export class DashboardComponent {
  readonly auth = inject(AuthService);
  readonly visibleAreas = computed(() =>
    HEMO_AREAS.filter(area => this.auth.canShowArea(area.roleCode)));
}

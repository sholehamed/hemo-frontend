import { Component, HostListener, computed, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatListModule } from '@angular/material/list';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { AuthService } from './core/auth/auth.service';
import { HEMO_AREAS } from './core/navigation/areas';

@Component({
  selector: 'app-root', standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, MatSidenavModule,
    MatToolbarModule, MatListModule, MatButtonModule, MatDividerModule],
  templateUrl: './app.component.html', styleUrl: './app.component.css'
})
export class AppComponent {
  readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  readonly compact = signal(typeof window !== 'undefined' && window.innerWidth <= 900);
  readonly menuOpen = signal(false);
  readonly loggingOut = signal(false);
  readonly visibleAreas = computed(() => HEMO_AREAS.filter(area => this.auth.canShowArea(area.roleCode)));
  readonly currentYear = new Date().getFullYear();
  @HostListener('window:resize') resize(): void {
    this.compact.set(window.innerWidth <= 900);
    if (!this.compact()) this.closeMenu();
  }
  toggleMenu(): void { this.menuOpen.update(v => !v); }
  closeMenu(): void { this.menuOpen.set(false); }
  logout(): void {
    if (this.loggingOut()) return;
    this.loggingOut.set(true);
    this.auth.logout().subscribe({
      next: () => { this.closeMenu(); this.loggingOut.set(false); void this.router.navigateByUrl('/login'); },
      error: () => { this.loggingOut.set(false); window.alert('خروج ناموفق بود. اتصال را بررسی کنید.'); }
    });
  }
}

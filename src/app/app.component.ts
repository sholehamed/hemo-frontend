import { Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from './core/auth/auth.service';
import { HEMO_AREAS } from './core/navigation/areas';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  readonly menuOpen = signal(false);
  readonly loggingOut = signal(false);
  readonly visibleAreas = computed(() => HEMO_AREAS
    .filter(area => this.auth.canShowArea(area.roleCode)));
  readonly currentYear = new Date().getFullYear();

  toggleMenu(): void { this.menuOpen.update(open => !open); }
  closeMenu(): void { this.menuOpen.set(false); }

  logout(): void {
    if (this.loggingOut()) return;
    this.loggingOut.set(true);
    this.auth.logout().subscribe({
      next: () => {
        this.closeMenu();
        this.loggingOut.set(false);
        void this.router.navigateByUrl('/login');
      },
      error: () => {
        this.loggingOut.set(false);
        // Never pretend logout succeeded if the server rejected the request.
        window.alert('خروج ناموفق بود. اتصال را بررسی کرده و دوباره تلاش کنید.');
      }
    });
  }
}

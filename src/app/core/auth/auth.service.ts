import { computed, inject, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, map, Observable, of, switchMap, tap } from 'rxjs';

export interface RoleGrant {
  readonly roleCode: string;
  readonly facilityId: number | null;
  readonly departmentId: number | null;
  readonly permissions: readonly string[];
}

export interface HemoSession {
  readonly userId: number;
  readonly userName: string;
  readonly displayName: string;
  readonly grants: readonly RoleGrant[];
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  readonly session = signal<HemoSession | null>(null);
  readonly initialized = signal(false);
  readonly isSignedIn = computed(() => this.session() !== null);

  // Refresh from the server on a cold page load; the browser never stores a token.
  checkSession(): Observable<HemoSession | null> {
    if (this.initialized()) return of(this.session());
    return this.http.get<HemoSession>('/api/v1/auth/session').pipe(
      tap(session => {
        this.session.set(session);
        this.initialized.set(true);
      }),
      catchError(() => {
        this.session.set(null);
        this.initialized.set(true);
        return of(null);
      })
    );
  }

  login(userName: string, password: string): Observable<HemoSession> {
    return this.http.get<void>('/api/v1/auth/csrf').pipe(
      switchMap(() => this.http.post<void>('/api/v1/auth/login', { userName, password })),
      switchMap(() => this.http.get<HemoSession>('/api/v1/auth/session')),
      tap(session => {
        this.session.set(session);
        this.initialized.set(true);
      })
    );
  }

  logout(): Observable<void> {
    return this.http.get<void>('/api/v1/auth/csrf').pipe(
      switchMap(() => this.http.post<void>('/api/v1/auth/logout', {})),
      tap(() => {
        this.session.set(null);
        this.initialized.set(true);
      })
    );
  }

  hasRole(role: string): boolean {
    const grants = this.session()?.grants ?? [];
    return grants.some(grant => grant.roleCode === 'SYSTEM_ADMIN' ||
      grant.roleCode === role);
  }

  // Navigation only; all real clinical API calls require server-side authorization.
  canShowArea(role: string): boolean { return this.hasRole(role); }
}

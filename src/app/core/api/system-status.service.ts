import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

export interface SystemStatus {
  readonly service: string;
  readonly status: string;
  readonly utcTime: string;
  readonly traceId: string;
}

@Injectable({ providedIn: 'root' })
export class SystemStatusService {
  private readonly http = inject(HttpClient);

  getStatus(): Observable<SystemStatus> {
    // Relative URL works with Angular dev proxy and same-origin reverse proxies.
    return this.http.get<SystemStatus>('/api/v1/system/status');
  }
}

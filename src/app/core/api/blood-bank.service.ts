import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

export interface BloodGroupOption { readonly id: number; readonly code: string; }
export interface InventoryUnit {
  readonly id: number; readonly unitCode: string; readonly productTypeId: number;
  readonly bloodGroupId: number; readonly facilityId: number; readonly expiryDate: string;
  readonly status: string; readonly isQuarantined: boolean; readonly rowVersion: string;
}
export interface BankWorkItem {
  readonly reservationId: number; readonly requestId: number; readonly unitId: number;
  readonly unitCode: string; readonly reservationStatus: string;
  readonly crossmatchId: number | null; readonly crossmatchStatus: string | null;
  readonly compatibilityResult: string | null; readonly crossmatchVersion: string | null;
}
export interface CrossmatchView {
  readonly id: number; readonly unitId: number; readonly requestItemId: number;
  readonly status: string; readonly compatibilityResult: string;
  readonly performedBy: number; readonly approvedBy: number | null; readonly rowVersion: string;
}

@Injectable({ providedIn: 'root' })
export class BloodBankService {
  private readonly http = inject(HttpClient);
  private root(facility: number): string { return `/api/v1/facilities/${facility}/blood-bank`; }
  units(facility: number): Observable<InventoryUnit[]> {
    return this.http.get<InventoryUnit[]>(this.root(facility) + '/units');
  }
  groups(facility: number): Observable<BloodGroupOption[]> {
    return this.http.get<BloodGroupOption[]>(this.root(facility) + '/blood-groups');
  }
  work(facility: number): Observable<BankWorkItem[]> {
    return this.http.get<BankWorkItem[]>(this.root(facility) + '/worklist');
  }
  receive(facility: number, payload: {
    unitCode: string; productTypeId: number; bloodGroupId: number;
    expiryDate: string; storageLocation: string | null;
  }): Observable<InventoryUnit> {
    return this.http.post<InventoryUnit>(this.root(facility) + '/units', payload);
  }
  reserve(facility: number, unitId: number, requestId: number): Observable<number> {
    return this.http.post<number>(this.root(facility) + '/reservations', { unitId, requestId });
  }
  crossmatch(facility: number, reservationId: number, compatibilityResult: string,
    testCode: string, testResult: string, comments: string | null): Observable<CrossmatchView> {
    return this.http.post<CrossmatchView>(this.root(facility) + '/crossmatches',
      { reservationId, compatibilityResult, testCode, testResult, comments });
  }
  finalize(facility: number, id: number, rowVersion: string): Observable<CrossmatchView> {
    return this.http.post<CrossmatchView>(`${this.root(facility)}/crossmatches/${id}/finalize`,
      { rowVersion });
  }
}

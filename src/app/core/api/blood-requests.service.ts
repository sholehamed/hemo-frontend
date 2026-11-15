import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

export interface ProductTypeOption { readonly id: number; readonly code: string; readonly name: string; }
export interface BloodRequestView {
  readonly bloodRequestId: number; readonly requestNo: string; readonly encounterId: number;
  readonly facilityId: number; readonly departmentId: number; readonly productTypeId: number;
  readonly productCode: string; readonly quantity: number; readonly priority: string;
  readonly status: string; readonly indication: string; readonly diagnosis: string | null;
  readonly requestedByUserId: number; readonly requestedAt: string; readonly rowVersion: string;
}
export interface BloodRequestPage {
  readonly items: readonly BloodRequestView[];
  readonly page: number; readonly pageSize: number; readonly total: number;
}
export interface NewBloodRequest {
  encounterId: number; productTypeId: number; quantity: number; priority: string;
  indication: string; diagnosis: string | null; specialRequirements: string | null;
  hemoglobin: number | null; previousReaction: boolean | null;
}
export interface ReviewBloodRequest {
  decision: 'Approved' | 'Rejected' | 'Returned'; reason: string | null; rowVersion: string;
}
@Injectable({ providedIn: 'root' })
export class BloodRequestsService {
  private readonly http = inject(HttpClient);
  private base(facility: number, department: number): string {
    return `/api/v1/facilities/${facility}/departments/${department}/blood-requests`;
  }
  products(f: number, d: number): Observable<ProductTypeOption[]> {
    return this.http.get<ProductTypeOption[]>(this.base(f,d) + '/products');
  }
  list(f: number, d: number, page = 1, status = ''): Observable<BloodRequestPage> {
    const params = new HttpParams().set('page',page).set('status',status);
    return this.http.get<BloodRequestPage>(this.base(f,d)+'/', { params });
  }
  get(f: number, d: number, id: number): Observable<BloodRequestView> {
    return this.http.get<BloodRequestView>(`${this.base(f,d)}/${id}`);
  }
  submit(f: number,d: number,data: NewBloodRequest): Observable<BloodRequestView> {
    return this.http.post<BloodRequestView>(this.base(f,d)+'/',data);
  }
  review(f: number,d: number,id: number,data:ReviewBloodRequest): Observable<BloodRequestView> {
    return this.http.post<BloodRequestView>(`${this.base(f,d)}/${id}/review`,data);
  }
}

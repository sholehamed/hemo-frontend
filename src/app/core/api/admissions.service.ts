import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { OrgItem } from './administration.service';

export interface AdmissionView {
  readonly encounterId: number; readonly patientId: number;
  readonly facilityId: number; readonly departmentId: number;
  readonly bedId: number | null; readonly firstName: string; readonly lastName: string;
  readonly nationalId: string | null; readonly unknownIdentityCode: string | null;
  readonly isUnknown: boolean; readonly birthDate: string | null;
  readonly sex: string; readonly admissionType: string; readonly status: string;
  readonly admittedAt: string; readonly patientRowVersion: string;
  readonly activeBarcode: string | null;
}
export interface AdmissionPage {
  readonly items: readonly AdmissionView[];
  readonly page: number; readonly pageSize: number; readonly total: number;
}
export interface CreateAdmission {
  nationalId: string | null; isUnknown: boolean; firstName: string; lastName: string;
  fatherName: string | null; birthDate: string | null; sex: string; mobile: string | null;
  admissionType: string; bedId: number | null; admissionNote: string | null;
}
export interface UpdatePatient {
  firstName: string; lastName: string; fatherName: string | null; birthDate: string | null;
  sex: string; mobile: string | null; rowVersion: string;
}
export interface WristbandView { wristbandId: number; barcode: string; issuedAt: string; status: string; }
export interface IdentityVerificationView {
  id: number; encounterId: number; status: string; wristbandMatched: boolean; verifiedAt: string;
}

@Injectable({ providedIn: 'root' })
export class AdmissionsService {
  private readonly http = inject(HttpClient);
  private root(facility: number, department: number): string {
    return `/api/v1/facilities/${facility}/departments/${department}/admissions`;
  }

  facilities(): Observable<OrgItem[]> {
    return this.http.get<OrgItem[]>('/api/v1/organization/facilities');
  }
  departments(facility: number): Observable<OrgItem[]> {
    return this.http.get<OrgItem[]>(`/api/v1/organization/facilities/${facility}/departments`);
  }
  list(facility: number, department: number, search: string, page = 1): Observable<AdmissionPage> {
    const params = new HttpParams().set('page', page).set('search', search);
    return this.http.get<AdmissionPage>(this.root(facility, department) + '/', { params });
  }
  get(facility: number, department: number, encounterId: number): Observable<AdmissionView> {
    return this.http.get<AdmissionView>(`${this.root(facility, department)}/${encounterId}`);
  }
  create(facility: number, department: number, request: CreateAdmission): Observable<AdmissionView> {
    return this.http.post<AdmissionView>(this.root(facility, department) + '/', request);
  }
  update(facility: number, department: number, encounterId: number, request: UpdatePatient):
      Observable<AdmissionView> {
    return this.http.put<AdmissionView>(
      `${this.root(facility, department)}/${encounterId}/patient`, request);
  }
  issueBand(facility: number, department: number, encounterId: number): Observable<WristbandView> {
    return this.http.post<WristbandView>(
      `${this.root(facility, department)}/${encounterId}/wristbands`, {});
  }
  verify(facility: number, department: number, encounterId: number,
      request: {barcode: string;firstIdentifier: string;secondIdentifier: string;
        checklistConfirmed: boolean;mismatchReason: string | null}): Observable<IdentityVerificationView> {
    return this.http.post<IdentityVerificationView>(
      `${this.root(facility, department)}/${encounterId}/identity-verifications`, request);
  }
}

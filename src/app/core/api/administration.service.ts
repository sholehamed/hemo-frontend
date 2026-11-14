import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

export interface OrgItem { readonly id: number; readonly code: string; readonly name: string; readonly parentId: number | null; }
export interface ManagedUser { readonly id: number; readonly userName: string; readonly displayName: string; readonly isActive: boolean; }
export interface HemoRole { readonly roleId: number; readonly code: string; readonly name: string; }

@Injectable({ providedIn: 'root' })
export class AdministrationService {
  private readonly http = inject(HttpClient);
  private readonly org = '/api/v1/admin/organization';
  private readonly users = '/api/v1/admin/users';

  getFacilities(): Observable<OrgItem[]> { return this.http.get<OrgItem[]>(this.org + '/facilities'); }
  addFacility(code: string, name: string): Observable<OrgItem> {
    return this.http.post<OrgItem>(this.org + '/facilities', { code, name });
  }
  addDepartment(facilityId: number, code: string, name: string): Observable<OrgItem> {
    return this.http.post<OrgItem>(this.org + '/departments', { facilityId, code, name, parentDepartmentId: null });
  }
  addBed(departmentId: number, bedCode: string): Observable<OrgItem> {
    return this.http.post<OrgItem>(this.org + '/beds', { departmentId, bedCode });
  }
  listUsers(): Observable<ManagedUser[]> { return this.http.get<ManagedUser[]>(this.users + '/'); }
  getRoles(): Observable<HemoRole[]> { return this.http.get<HemoRole[]>(this.users + '/roles'); }
  addUser(userName: string, displayName: string, initialPassword: string): Observable<ManagedUser> {
    return this.http.post<ManagedUser>(this.users + '/', { userName, displayName, initialPassword });
  }
  grant(userId: number, roleId: number, facilityId: number | null, departmentId: number | null): Observable<{userRoleId: number}> {
    return this.http.post<{userRoleId: number}>(`${this.users}/${userId}/grants`,
      { roleId, facilityId, departmentId });
  }
  deactivate(userId: number): Observable<void> {
    return this.http.post<void>(`${this.users}/${userId}/deactivate`, {});
  }
}

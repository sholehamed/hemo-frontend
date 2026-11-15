import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

export interface IssueView {
  readonly id: number; readonly unitId: number; readonly unitCode: string;
  readonly requestId: number; readonly departmentId: number; readonly status: string;
  readonly issuedAt: string; readonly rowVersion: string;
}
export interface DispatchView {
  readonly id: number; readonly issueId: number; readonly status: string;
  readonly dispatchNo: string;
}
export interface ReturnView {
  readonly id: number; readonly issueId: number; readonly status: string;
  readonly decision: string | null; readonly rowVersion: string;
}

@Injectable({ providedIn: 'root' })
export class LogisticsService {
  private readonly http=inject(HttpClient);
  private bank(f: number): string { return `/api/v1/facilities/${f}/logistics`; }
  private ward(f: number,d: number): string {
    return `/api/v1/facilities/${f}/departments/${d}/logistics`;
  }
  list(f:number,d:number):Observable<IssueView[]> {
    return this.http.get<IssueView[]>(this.ward(f,d)+'/issues');
  }
  returns(f:number):Observable<ReturnView[]> {
    return this.http.get<ReturnView[]>(this.bank(f)+'/returns');
  }
  issue(f:number,unitId:number,requestId:number,departmentId:number,conditionNote:string|null):
      Observable<IssueView> {
    return this.http.post<IssueView>(this.bank(f)+'/issues',
      {unitId,requestId,departmentId,conditionNote});
  }
  dispatch(f:number,issueId:number,containerType:string,temperatureAtExitC:number|null,
    note:string|null):Observable<DispatchView> {
    return this.http.post<DispatchView>(this.bank(f)+'/dispatches',
      {issueId,containerType,temperatureAtExitC,note});
  }
  receive(f:number,d:number,issueId:number,rowVersion:string,conditionNote:string|null):
      Observable<IssueView> {
    return this.http.post<IssueView>(
      `${this.ward(f,d)}/issues/${issueId}/receive`,{rowVersion,conditionNote});
  }
  returnUnit(f:number,d:number,issueId:number,returnedByUserId:number,reasonCode:string,
    conditionCode:string|null,temperatureC:number|null,notes:string|null):Observable<ReturnView> {
    return this.http.post<ReturnView>(`${this.ward(f,d)}/issues/${issueId}/return`,
      {returnedByUserId,reasonCode,conditionCode,temperatureC,notes});
  }
  reviewReturn(f:number,returnId:number,decision:string,rowVersion:string,note:string|null):
      Observable<ReturnView> {
    return this.http.post<ReturnView>(`${this.bank(f)}/returns/${returnId}/review`,
      {decision,rowVersion,note});
  }
}

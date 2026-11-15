import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

export interface TransfusionView {
  readonly id:number;readonly encounterId:number;readonly bloodRequestItemId:number;
  readonly unitId:number;readonly issueId:number|null;readonly status:string;
  readonly startedAt:string|null;readonly endedAt:string|null;readonly stopReason:string|null;
  readonly rowVersion:string;readonly checklistComplete:boolean;readonly baselineRecorded:boolean;
  readonly signedOff:boolean;
}
export interface VitalView {
  readonly id:number;readonly transfusionId:number;readonly observedAt:string;
  readonly timepointCode:string;readonly systolicBp:number|null;readonly diastolicBp:number|null;
  readonly heartRate:number|null;readonly temperatureC:number|null;readonly spo2:number|null;
  readonly respiratoryRate:number|null;readonly alertFlag:boolean;readonly clinicalNote:string|null;
}
export interface TransfusionDetails {
  readonly transfusion:TransfusionView;readonly observations:readonly VitalView[];
  readonly actions:readonly string[];
}
export interface VitalInput {
  timepointCode:string;observedAt:string;systolicBp:number|null;diastolicBp:number|null;
  heartRate:number|null;temperatureC:number|null;spo2:number|null;
  respiratoryRate:number|null;urineOutputMl:number|null;alertFlag:boolean;clinicalNote:string|null;
}
export interface ChecklistInput {
  patientIdentityMatched:boolean;unitIdentityMatched:boolean;bloodGroupChecked:boolean;
  compatibilityChecked:boolean;expiryChecked:boolean;baselineVitalChecked:boolean;note:string|null;
}

@Injectable({providedIn:'root'})
export class TransfusionService {
  private readonly http=inject(HttpClient);
  private root(f:number,d:number):string {
    return `/api/v1/facilities/${f}/departments/${d}/transfusions`;
  }
  list(f:number,d:number):Observable<TransfusionView[]> {
    return this.http.get<TransfusionView[]>(this.root(f,d)+'/');
  }
  get(f:number,d:number,id:number):Observable<TransfusionDetails> {
    return this.http.get<TransfusionDetails>(`${this.root(f,d)}/${id}`);
  }
  prepare(f:number,d:number,issueId:number):Observable<TransfusionView> {
    return this.http.post<TransfusionView>(this.root(f,d)+'/',{issueId});
  }
  checklist(f:number,d:number,id:number,data:ChecklistInput):Observable<TransfusionView> {
    return this.http.post<TransfusionView>(`${this.root(f,d)}/${id}/checklist`,data);
  }
  vital(f:number,d:number,id:number,data:VitalInput):Observable<VitalView> {
    return this.http.post<VitalView>(`${this.root(f,d)}/${id}/vitals`,data);
  }
  transition(f:number,d:number,id:number,action:'start'|'stop'|'complete',
    rowVersion:string,reason:string|null):Observable<TransfusionView> {
    return this.http.post<TransfusionView>(`${this.root(f,d)}/${id}/${action}`,
      {rowVersion,reason});
  }
  signoff(f:number,d:number,id:number,rowVersion:string,comment:string|null):Observable<TransfusionView> {
    return this.http.post<TransfusionView>(`${this.root(f,d)}/${id}/signoff`,
      {rowVersion,comment});
  }
}

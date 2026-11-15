import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

export interface ReactionView {
  readonly id:number; readonly transfusionId:number; readonly encounterId:number;
  readonly eventNo:string; readonly status:string; readonly detectedAt:string;
  readonly transfusionStopped:boolean; readonly symptomsSummary:string|null;
  readonly rowVersion:string; readonly assessed:boolean; readonly investigated:boolean;
  readonly rcaId:number|null;
}
export interface ActionView {
  readonly id:number;readonly rcaId:number;readonly title:string;readonly status:string;
  readonly assignedToUserId:number;readonly rowVersion:string;
}
export interface RcaView {
  readonly id:number;readonly eventId:number;readonly status:string;
  readonly caseNo:string;readonly rowVersion:string;
}
export interface RcaDetails {
  readonly case:RcaView;readonly causes:readonly string[];readonly actions:readonly ActionView[];
}
export interface ReactionDetails {
  readonly event:ReactionView;readonly symptoms:readonly string[];
  readonly assessments:readonly string[];readonly investigations:readonly string[];
  readonly actions:readonly ActionView[];
}
export interface ReactionReport {
  transfusionId:number;detectedAt:string;transfusionStopped:boolean;
  symptomsSummary:string;immediateActions:string;narrative:string|null;
  symptomCodes:string[];
}
export interface PhysicianAssessment {
  diagnosisText:string;severityGrade:number|null;causality:string|null;
  interventions:string|null;recommendations:string|null;outcome:string|null;
  nationalReportRequired:boolean;rowVersion:string;
}
@Injectable({providedIn:'root'})
export class ReactionService {
  private readonly http=inject(HttpClient);
  private ward(f:number,d:number):string {
    return `/api/v1/facilities/${f}/departments/${d}/reactions`;
  }
  private hv(f:number):string{return `/api/v1/facilities/${f}/hemovigilance`;}
  list(f:number,d:number):Observable<ReactionView[]> {
    return this.http.get<ReactionView[]>(this.ward(f,d)+'/');
  }
  get(f:number,d:number,id:number):Observable<ReactionDetails> {
    return this.http.get<ReactionDetails>(`${this.ward(f,d)}/${id}`);
  }
  report(f:number,d:number,input:ReactionReport):Observable<ReactionView> {
    return this.http.post<ReactionView>(this.ward(f,d)+'/',input);
  }
  assess(f:number,d:number,id:number,input:PhysicianAssessment):Observable<ReactionView> {
    return this.http.post<ReactionView>(`${this.ward(f,d)}/${id}/assess`,input);
  }
  investigate(f:number,id:number,type:string,resultText:string,rowVersion:string):
      Observable<ReactionView>{
    return this.http.post<ReactionView>(`${this.hv(f)}/reactions/${id}/investigations`,
      {type,resultText,rowVersion});
  }
  review(f:number,id:number,decision:'Confirmed'|'Closed',rowVersion:string,
    reason:string):Observable<ReactionView>{
    return this.http.post<ReactionView>(`${this.hv(f)}/reactions/${id}/review`,
      {decision,rowVersion,reason});
  }
  rca(f:number,id:number):Observable<RcaDetails>{
    return this.http.get<RcaDetails>(`${this.hv(f)}/rca/${id}`);
  }
  openRca(f:number,eventId:number):Observable<RcaView>{
    return this.http.post<RcaView>(`${this.hv(f)}/reactions/${eventId}/rca`,{});
  }
  addCause(f:number,rcaId:number,causeType:string,description:string,
    isRootCause:boolean):Observable<RcaView>{
    return this.http.post<RcaView>(`${this.hv(f)}/rca/${rcaId}/causes`,
      {causeType,description,isRootCause});
  }
  assignAction(f:number,rcaId:number,title:string,description:string|null,
    assignedToUserId:number,dueAt:string|null):Observable<ActionView>{
    return this.http.post<ActionView>(`${this.hv(f)}/rca/${rcaId}/actions`,
      {title,description,assignedToUserId,dueAt});
  }
  completeAction(f:number,id:number,rowVersion:string):Observable<ActionView>{
    return this.http.post<ActionView>(`${this.hv(f)}/actions/${id}/complete`,
      {rowVersion,note:null});
  }
  verifyAction(f:number,id:number,rowVersion:string):Observable<ActionView>{
    return this.http.post<ActionView>(`${this.hv(f)}/actions/${id}/verify`,
      {rowVersion,note:null});
  }
  closeRca(f:number,id:number,rowVersion:string,rootCauseSummary:string):Observable<RcaView>{
    return this.http.post<RcaView>(`${this.hv(f)}/rca/${id}/close`,
      {rowVersion,rootCauseSummary});
  }
}

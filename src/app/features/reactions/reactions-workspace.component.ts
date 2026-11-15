import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Observable } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { AdmissionsService } from '../../core/api/admissions.service';
import { OrgItem } from '../../core/api/administration.service';
import { TransfusionService, TransfusionView } from '../../core/api/transfusion.service';
import { ReactionService, ReactionView, ReactionDetails, RcaDetails,
  ActionView, ReactionReport, PhysicianAssessment } from '../../core/api/reaction.service';
import { AuthService } from '../../core/auth/auth.service';
import { ApiFailure } from '../../core/api/api-error';
import { RequestStateComponent } from '../../shared/components/request-state.component';
import { isoToJalali } from '../../shared/jalali-date';

@Component({
  selector:'app-reactions-workspace', standalone:true,
  imports:[FormsModule,RouterLink,MatButtonModule,MatCardModule,MatCheckboxModule,
    MatFormFieldModule,MatInputModule,MatSelectModule,MatTableModule,RequestStateComponent],
  template:`
    <section class="heading">
      <p class="eyebrow">HEMO / HEMOVIGILANCE</p>
      <h1>واکنش‌های نامطلوب و پیگیری</h1>
      <p class="muted">در مواجهه با واکنش حین تزریق، اقدامات فوری باید در کنار تخت انجام و توقف فیزیکی در پرونده تزریق ثبت شود. ثبت این فرم جایگزین مراقبت بالینی یا اطلاع‌رسانی فوری نیست.</p>
    </section>
    <app-request-state [loading]="busy()" [error]="error()"/>
    @if(message()){<p class="notice" role="status">{{message()}}</p>}
    <mat-card class="panel"><mat-card-content class="fields">
      <mat-form-field appearance="outline">
        <mat-label>مرکز درمانی</mat-label>
        <mat-select name="facility" [(ngModel)]="facilityId" (ngModelChange)="onFacility()">
          @for(f of facilities();track f.id){<mat-option [value]="f.id">{{f.name}}</mat-option>}
        </mat-select>
      </mat-form-field>
      <mat-form-field appearance="outline">
        <mat-label>بخش درمانی</mat-label>
        <mat-select name="department" [(ngModel)]="departmentId"
          [disabled]="facilityId===null" (ngModelChange)="reload()">
          @for(d of departments();track d.id){<mat-option [value]="d.id">{{d.name}}</mat-option>}
        </mat-select>
      </mat-form-field>
    </mat-card-content></mat-card>

    @if(facilityId!==null&&departmentId!==null){
      @if(can('reaction.report')){
        <mat-card class="panel">
          <mat-card-header><mat-card-title>ثبت گزارش مشاهده جدید</mat-card-title></mat-card-header>
          <mat-card-content>
            <p class="muted">یک پرونده تزریق واقعی انتخاب کنید. تزریق در وضعیت «در حال انجام» باید ابتدا در مسیر تزریق متوقف شود.</p>
            <form class="fields" (ngSubmit)="report()">
              <mat-form-field appearance="outline">
                <mat-label>پرونده تزریق</mat-label>
                <mat-select name="transfusion" required [(ngModel)]="transfusionId">
                  @for(t of transfusions();track t.id){
                    @if(t.status==='Stopped'||t.status==='Completed'){
                      <mat-option [value]="t.id">
                        تزریق {{t.id}} · بستری {{t.encounterId}} · {{t.status}}
                      </mat-option>
                    }
                  }
                </mat-select>
              </mat-form-field>
              <mat-form-field appearance="outline">
                <mat-label>کدهای علائم (با ویرگول جدا کنید)</mat-label>
                <input matInput name="symptomCodes" [(ngModel)]="symptomCodes"
                  required maxlength="220" placeholder="RASH,FEVER"/>
              </mat-form-field>
              <mat-form-field appearance="outline" class="wide">
                <mat-label>شرح علائم مشاهده‌شده</mat-label>
                <textarea matInput name="symptoms" required [(ngModel)]="symptoms"
                  rows="2" maxlength="1800"></textarea>
              </mat-form-field>
              <mat-form-field appearance="outline" class="wide">
                <mat-label>اقدامات فوری انجام‌شده</mat-label>
                <textarea matInput name="immediateActions" required [(ngModel)]="immediateActions"
                  rows="2" maxlength="1800"></textarea>
              </mat-form-field>
              <mat-checkbox name="transfusionStopped" [(ngModel)]="transfusionStopped" class="wide">
                اگر تزریق به‌دلیل واکنش متوقف شد، توقف فیزیکی و ثبت آن در پرونده تأیید می‌شود
              </mat-checkbox>
              <div class="wide actions">
                <button mat-flat-button class="primary-button"
                  [disabled]="busy()||!transfusionId||symptoms.trim().length<3||!immediateActions.trim()||!symptomCodes.trim()">
                  ثبت گزارش برای ارزیابی پزشک
                </button>
                <a mat-button routerLink="/transfusions">رفتن به تزریق و پایش</a>
              </div>
            </form>
          </mat-card-content>
        </mat-card>
      }
      <mat-card class="panel">
        <mat-card-header><mat-card-title>کارتابل گزارش‌های واکنش</mat-card-title></mat-card-header>
        <mat-card-content class="scroll">
          <table mat-table [dataSource]="reactions()" class="listing">
            <ng-container matColumnDef="no"><th mat-header-cell *matHeaderCellDef>شماره گزارش</th>
              <td mat-cell *matCellDef="let r">{{r.eventNo}}</td></ng-container>
            <ng-container matColumnDef="encounter"><th mat-header-cell *matHeaderCellDef>بستری / تزریق</th>
              <td mat-cell *matCellDef="let r">{{r.encounterId}} / {{r.transfusionId}}</td></ng-container>
            <ng-container matColumnDef="detected"><th mat-header-cell *matHeaderCellDef>زمان</th>
              <td mat-cell *matCellDef="let r">{{jalali(r.detectedAt)}}</td></ng-container>
            <ng-container matColumnDef="status"><th mat-header-cell *matHeaderCellDef>وضعیت</th>
              <td mat-cell *matCellDef="let r">{{r.status}}</td></ng-container>
            <ng-container matColumnDef="action"><th mat-header-cell *matHeaderCellDef>بررسی</th>
              <td mat-cell *matCellDef="let r">
                <button mat-button type="button" (click)="select(r.id)">بازکردن پرونده</button>
              </td></ng-container>
            <tr mat-header-row *matHeaderRowDef="columns"></tr>
            <tr mat-row *matRowDef="let row;columns:columns"></tr>
          </table>
        </mat-card-content>
      </mat-card>

      @if(selected();as d){
        <mat-card class="panel selected">
          <mat-card-header><mat-card-title>{{d.event.eventNo}} · {{d.event.status}}</mat-card-title></mat-card-header>
          <mat-card-content>
            <p><strong>شرح:</strong> {{d.event.symptomsSummary}}</p>
            <p class="muted">علائم: {{d.symptoms.join('، ')}} · ارزیابی‌ها: {{d.assessments.length}} · بررسی‌ها: {{d.investigations.length}}</p>

            @if(can('reaction.diagnose')&&d.event.status==='Reported'){
              <form class="subform" (ngSubmit)="assess()">
                <h3>ارزیابی مستقل پزشک</h3>
                <div class="fields">
                  <mat-form-field appearance="outline" class="wide">
                    <mat-label>ارزیابی/تشخیص ثبت‌شده توسط پزشک</mat-label>
                    <textarea matInput name="diagnosis" [(ngModel)]="diagnosis" rows="2"
                      required maxlength="1500"></textarea>
                  </mat-form-field>
                  <mat-form-field appearance="outline">
                    <mat-label>درجه شدت (با تشخیص پزشک)</mat-label>
                    <mat-select name="severity" [(ngModel)]="severity">
                      <mat-option [value]="null">مشخص نشده</mat-option>
                      @for(n of grades;track n){<mat-option [value]="n">{{n}}</mat-option>}
                    </mat-select>
                  </mat-form-field>
                  <mat-form-field appearance="outline">
                    <mat-label>ارزیابی علیت (متن پزشک)</mat-label>
                    <input matInput name="causality" [(ngModel)]="causality" maxlength="35"/>
                  </mat-form-field>
                  <mat-form-field appearance="outline" class="wide">
                    <mat-label>توصیه/اقدام پزشک</mat-label>
                    <textarea matInput name="recommendations" [(ngModel)]="recommendations"
                      rows="2" maxlength="1400"></textarea>
                  </mat-form-field>
                  <mat-checkbox class="wide" name="nationalReport" [(ngModel)]="nationalReportRequired">
                    به تشخیص پزشک، بررسی ضرورت گزارش‌دهی ملی لازم است (ارسال خودکار انجام نمی‌شود)
                  </mat-checkbox>
                  <div class="actions wide">
                    <button mat-flat-button class="primary-button" [disabled]="busy()||!diagnosis.trim()">
                      ثبت ارزیابی پزشک
                    </button>
                  </div>
                </div>
              </form>
            }

            @if(can('rca.manage')){
              @if(d.event.status==='DoctorReview'||d.event.status==='Investigation'){
                <form class="subform" (ngSubmit)="investigate()">
                  <h3>ثبت شواهد بررسی هموویژیلانس</h3>
                  <div class="fields">
                    <mat-form-field appearance="outline">
                      <mat-label>نوع بررسی</mat-label>
                      <input matInput name="investigationType" [(ngModel)]="investigationType"
                        required maxlength="50"/>
                    </mat-form-field>
                    <mat-form-field appearance="outline" class="wide">
                      <mat-label>یافته‌های مستند</mat-label>
                      <textarea matInput name="investigationResult" [(ngModel)]="investigationResult"
                        required rows="2" maxlength="2000"></textarea>
                    </mat-form-field>
                    <div class="actions wide">
                      <button mat-flat-button class="primary-button"
                        [disabled]="busy()||!investigationType.trim()||!investigationResult.trim()">
                        ثبت شواهد و پیگیری
                      </button>
                    </div>
                  </div>
                </form>
              }
              @if(d.event.status==='Investigation'||d.event.status==='Confirmed'){
                <div class="subform">
                  <h3>تصمیم مسئول هموویژیلانس</h3>
                  <mat-form-field appearance="outline" class="wide">
                    <mat-label>توضیح مستند تصمیم</mat-label>
                    <textarea matInput name="reviewReason" [(ngModel)]="reviewReason"
                      rows="2" maxlength="1000"></textarea>
                  </mat-form-field>
                  <div class="actions">
                    @if(d.event.status==='Investigation'){
                      <button mat-stroked-button type="button"
                        [disabled]="busy()||!reviewReason.trim()" (click)="review('Confirmed')">
                        تأیید نتیجه بررسی
                      </button>
                    }
                    @if(d.event.status==='Confirmed'){
                      <button mat-stroked-button type="button"
                        [disabled]="busy()||!reviewReason.trim()" (click)="review('Closed')">
                        بستن گزارش پس از تکمیل پیگیری
                      </button>
                    }
                  </div>
                </div>
              }
              @if(d.event.assessed && d.event.rcaId===null &&
                (d.event.status==='Investigation'||d.event.status==='Confirmed')){
                <button mat-flat-button class="primary-button" type="button" (click)="openRca()"
                  [disabled]="busy()">ایجاد پرونده تحلیل علت ریشه‌ای (RCA)</button>
              }
              @if(rca();as r){
                <div class="subform">
                  <h3>RCA — {{r.case.caseNo}} · {{r.case.status}}</h3>
                  <p class="muted">علل مستند: {{r.causes.join('، ')||'هنوز ثبت نشده است'}}</p>
                  @if(r.case.status==='Open'||r.case.status==='Analyzing'){
                    <form class="fields" (ngSubmit)="addCause()">
                      <mat-form-field appearance="outline">
                        <mat-label>نوع علت</mat-label>
                        <input matInput name="causeType" [(ngModel)]="causeType" maxlength="50" required/>
                      </mat-form-field>
                      <mat-form-field appearance="outline">
                        <mat-label>توضیح علت</mat-label>
                        <input matInput name="causeDescription" [(ngModel)]="causeDescription"
                          maxlength="1200" required/>
                      </mat-form-field>
                      <mat-checkbox name="rootCause" [(ngModel)]="isRootCause" class="wide">
                        این مورد به‌عنوان علت ریشه‌ای توسط بررسی‌کننده ثبت شده است
                      </mat-checkbox>
                      <div class="actions wide">
                        <button mat-stroked-button [disabled]="busy()||!causeType.trim()||!causeDescription.trim()">
                          افزودن علت
                        </button>
                      </div>
                    </form>
                  }
                  @if(r.case.status==='Analyzing'||r.case.status==='ActionPending'){
                    <form class="fields" (ngSubmit)="assignAction()">
                      <mat-form-field appearance="outline">
                        <mat-label>عنوان اقدام اصلاحی</mat-label>
                        <input matInput name="actionTitle" [(ngModel)]="actionTitle"
                          required maxlength="250"/>
                      </mat-form-field>
                      <mat-form-field appearance="outline">
                        <mat-label>شناسه مسئول دارای مجوز RCA</mat-label>
                        <input matInput name="assignedActor" type="number" min="1"
                          [(ngModel)]="assignedActor" required/>
                      </mat-form-field>
                      <mat-form-field appearance="outline" class="wide">
                        <mat-label>توضیحات اقدام</mat-label>
                        <input matInput name="actionDescription" [(ngModel)]="actionDescription"
                          maxlength="2000"/>
                      </mat-form-field>
                      <div class="actions wide">
                        <button mat-stroked-button [disabled]="busy()||!actionTitle.trim()||!assignedActor">
                          واگذاری اقدام اصلاحی
                        </button>
                      </div>
                    </form>
                  }
                  <div class="scroll">
                    <table mat-table [dataSource]="r.actions" class="listing">
                      <ng-container matColumnDef="title"><th mat-header-cell *matHeaderCellDef>اقدام</th>
                        <td mat-cell *matCellDef="let a">{{a.title}}</td></ng-container>
                      <ng-container matColumnDef="actor"><th mat-header-cell *matHeaderCellDef>مسئول</th>
                        <td mat-cell *matCellDef="let a">{{a.assignedToUserId}}</td></ng-container>
                      <ng-container matColumnDef="status"><th mat-header-cell *matHeaderCellDef>وضعیت</th>
                        <td mat-cell *matCellDef="let a">{{a.status}}</td></ng-container>
                      <ng-container matColumnDef="actions"><th mat-header-cell *matHeaderCellDef>ثبت</th>
                        <td mat-cell *matCellDef="let a">
                          @if(a.status==='Open'||a.status==='InProgress'){
                            <button mat-button type="button" (click)="changeAction(a,'complete')">ثبت انجام</button>
                          }
                          @if(a.status==='Completed'){
                            <button mat-button type="button" (click)="changeAction(a,'verify')">تأیید مستقل</button>
                          }
                        </td></ng-container>
                      <tr mat-header-row *matHeaderRowDef="actionColumns"></tr>
                      <tr mat-row *matRowDef="let row;columns:actionColumns"></tr>
                    </table>
                  </div>
                  @if(r.case.status==='ActionPending'){
                    <mat-form-field appearance="outline" class="wide">
                      <mat-label>خلاصه علت ریشه‌ای برای اختتام</mat-label>
                      <textarea matInput name="closureSummary" [(ngModel)]="closureSummary"
                        rows="2" maxlength="5000"></textarea>
                    </mat-form-field>
                    <div class="actions">
                      <button mat-flat-button class="primary-button" type="button"
                        [disabled]="busy()||!closureSummary.trim()" (click)="closeRca()">
                        اختتام مستقل RCA (پس از راستی‌آزمایی تمام اقدامات)
                      </button>
                    </div>
                  }
                </div>
              }
            }
          </mat-card-content>
        </mat-card>
      }
      <div class="page-actions">
        <button mat-stroked-button type="button" (click)="reload()">بارگذاری مجدد</button>
        <a mat-button routerLink="/transfusions">تزریق و پایش</a>
      </div>
    }
  `,
  styles:[`
    .panel{margin-bottom:18px;overflow:hidden}
    mat-card-title{font-size:17px;font-weight:800}
    mat-card-header{margin-bottom:12px}
    .fields{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(235px,100%),1fr));gap:10px 14px}
    .wide{grid-column:1/-1}
    .scroll{max-width:100%;overflow-x:auto}
    .listing{width:100%;min-width:675px}
    th.mat-mdc-header-cell{text-align:right;background:#f7f9fc;font-weight:800}
    .actions{display:flex;gap:9px;flex-wrap:wrap;align-items:center;margin:12px 0}
    .selected{border-right:4px solid #b91c35!important}
    .subform{margin:20px 0;border:1px solid #e3e8f0;border-radius:14px;padding:18px}
    .subform h3{font-size:16px;margin:0 0 13px}
    @media(max-width:650px){.fields{grid-template-columns:1fr}.subform{padding:12px}.actions button{flex:1}}
  `]
})
export class ReactionsWorkspaceComponent implements OnInit {
  private readonly admission=inject(AdmissionsService);
  private readonly transfusionApi=inject(TransfusionService);
  private readonly api=inject(ReactionService);
  private readonly auth=inject(AuthService);
  readonly facilities=signal<OrgItem[]>([]);
  readonly departments=signal<OrgItem[]>([]);
  readonly transfusions=signal<TransfusionView[]>([]);
  readonly reactions=signal<ReactionView[]>([]);
  readonly selected=signal<ReactionDetails|null>(null);
  readonly rca=signal<RcaDetails|null>(null);
  readonly busy=signal(false);
  readonly error=signal<string|null>(null);
  readonly message=signal<string|null>(null);
  readonly columns=['no','encounter','detected','status','action'];
  readonly actionColumns=['title','actor','status','actions'];
  readonly grades=[0,1,2,3,4];
  readonly jalali=isoToJalali;
  facilityId:number|null=null;departmentId:number|null=null;
  transfusionId:number|null=null;transfusionStopped=false;symptoms='';
  symptomCodes='';immediateActions='';diagnosis='';severity:number|null=null;
  causality='';recommendations='';nationalReportRequired=false;
  investigationType='LabFollowUp';investigationResult='';reviewReason='';
  causeType='Process';causeDescription='';isRootCause=false;
  actionTitle='';actionDescription='';assignedActor:number|null=null;closureSummary='';

  ngOnInit():void {this.admission.facilities().subscribe({
    next:r=>this.facilities.set(r),error:(e:ApiFailure)=>this.fail(e)
  });}
  can(permission:string):boolean {
    return (this.auth.session()?.grants??[]).some(g=>g.permissions.includes(permission)&&
      (g.roleCode==='SYSTEM_ADMIN' ||
        (g.facilityId===this.facilityId&&
          (g.departmentId===null||g.departmentId===this.departmentId))));
  }
  onFacility():void {
    this.departmentId=null;this.departments.set([]);
    this.selected.set(null);this.rca.set(null);this.reactions.set([]);
    if(this.facilityId===null)return;
    this.admission.departments(this.facilityId).subscribe({
      next:r=>this.departments.set(r),error:(e:ApiFailure)=>this.fail(e)
    });
  }
  reload():void {
    if(this.facilityId===null||this.departmentId===null)return;
    const f=this.facilityId,d=this.departmentId;
    this.error.set(null);this.busy.set(true);
    this.api.list(f,d).subscribe({
      next:r=>{this.reactions.set(r);this.busy.set(false);},
      error:(e:ApiFailure)=>this.fail(e)
    });
    if(this.can('reaction.report'))this.transfusionApi.list(f,d).subscribe({
      next:r=>this.transfusions.set(r),error:(e:ApiFailure)=>this.fail(e)
    });
  }
  select(id:number):void {
    if(this.facilityId===null||this.departmentId===null)return;
    this.busy.set(true);this.error.set(null);
    this.api.get(this.facilityId,this.departmentId,id).subscribe({
      next:r=>{this.selected.set(r);this.busy.set(false);
        if(r.event.rcaId!==null)this.loadRca(r.event.rcaId);else this.rca.set(null);},
      error:(e:ApiFailure)=>this.fail(e)
    });
  }
  private loadRca(id:number):void {
    if(this.facilityId===null||!this.can('rca.manage')){this.rca.set(null);return;}
    this.api.rca(this.facilityId,id).subscribe({
      next:r=>this.rca.set(r),error:(e:ApiFailure)=>this.fail(e)
    });
  }
  private current():ReactionView|null{return this.selected()?.event??null;}
  report():void {
    if(this.facilityId===null||this.departmentId===null||!this.transfusionId)return;
    const chosen=this.transfusions().find(x=>x.id===this.transfusionId);
    if(!chosen||!['Stopped','Completed'].includes(chosen.status))return;
    if(chosen.status==='Stopped'&&!this.transfusionStopped){
      this.error.set('ثبت واکنش روی تزریق متوقف‌شده نیازمند تأیید توقف فیزیکی است.');return;
    }
    const codes=this.symptomCodes.toUpperCase().split(',')
      .map(x=>x.trim()).filter(Boolean);
    if(!codes.length||codes.length>10||codes.some(x=>!/^[A-Z0-9_-]{1,80}$/.test(x))){
      this.error.set('کد علائم باید با ویرگول جدا شود و شامل حروف لاتین بزرگ، عدد، خط تیره یا زیرخط باشد.');
      return;
    }
    const input:ReactionReport={transfusionId:chosen.id,
      detectedAt:new Date().toISOString(),transfusionStopped:this.transfusionStopped,
      symptomsSummary:this.symptoms.trim(),immediateActions:this.immediateActions.trim(),
      narrative:null,symptomCodes:codes};
    this.execute(this.api.report(this.facilityId,this.departmentId,input),r=>{
      this.symptoms='';this.immediateActions='';this.symptomCodes='';
      this.transfusionId=null;this.transfusionStopped=false;this.select(r.id);
    });
  }
  assess():void {
    const event=this.current();
    if(!event||this.facilityId===null||this.departmentId===null||!this.diagnosis.trim())return;
    const input:PhysicianAssessment={diagnosisText:this.diagnosis.trim(),
      severityGrade:this.severity,causality:this.causality.trim()||null,
      interventions:null,recommendations:this.recommendations.trim()||null,outcome:null,
      nationalReportRequired:this.nationalReportRequired,rowVersion:event.rowVersion};
    this.execute(this.api.assess(this.facilityId,this.departmentId,event.id,input),
      ()=>this.select(event.id));
  }
  investigate():void {
    const event=this.current();
    if(!event||this.facilityId===null||!this.investigationType.trim()||
      !this.investigationResult.trim())return;
    this.execute(this.api.investigate(this.facilityId,event.id,
      this.investigationType.trim(),this.investigationResult.trim(),event.rowVersion),
      ()=>{this.investigationResult='';this.select(event.id);});
  }
  review(decision:'Confirmed'|'Closed'):void{
    const event=this.current();
    if(!event||this.facilityId===null||!this.reviewReason.trim())return;
    if(!window.confirm('بررسی حرفه‌ای و مستندات پرونده کامل شده است؟'))return;
    this.execute(this.api.review(this.facilityId,event.id,decision,event.rowVersion,
      this.reviewReason.trim()),()=>{this.reviewReason='';this.select(event.id);});
  }
  openRca():void{
    const event=this.current();
    if(!event||this.facilityId===null)return;
    this.execute(this.api.openRca(this.facilityId,event.id),()=>this.select(event.id));
  }
  addCause():void {
    const r=this.rca();
    if(!r||this.facilityId===null||!this.causeType.trim()||!this.causeDescription.trim())return;
    this.execute(this.api.addCause(this.facilityId,r.case.id,this.causeType.trim(),
      this.causeDescription.trim(),this.isRootCause),()=>{
        this.causeDescription='';this.loadRca(r.case.id);
      });
  }
  assignAction():void {
    const r=this.rca();
    if(!r||this.facilityId===null||!this.assignedActor||!this.actionTitle.trim())return;
    this.execute(this.api.assignAction(this.facilityId,r.case.id,this.actionTitle.trim(),
      this.actionDescription.trim()||null,this.assignedActor,null),()=>{
        this.actionTitle='';this.actionDescription='';this.loadRca(r.case.id);
      });
  }
  changeAction(action:ActionView,operation:'complete'|'verify'):void{
    const r=this.rca();
    if(!r||this.facilityId===null)return;
    const req=operation==='complete'
      ? this.api.completeAction(this.facilityId,action.id,action.rowVersion)
      : this.api.verifyAction(this.facilityId,action.id,action.rowVersion);
    this.execute(req,()=>this.loadRca(r.case.id));
  }
  closeRca():void{
    const r=this.rca();
    if(!r||this.facilityId===null||!this.closureSummary.trim()||
      !window.confirm('تمام اقدامات به‌صورت مستقل راستی‌آزمایی شده‌اند؟'))return;
    this.execute(this.api.closeRca(this.facilityId,r.case.id,r.case.rowVersion,
      this.closureSummary.trim()),()=>this.loadRca(r.case.id));
  }
  private execute<T>(request:Observable<T>,success:(result:T)=>void):void{
    if(this.busy())return;
    this.busy.set(true);this.error.set(null);this.message.set(null);
    request.subscribe({next:r=>{this.busy.set(false);
      this.message.set('عملیات با موفقیت در پایگاه داده ثبت شد.');
      success(r);this.reload();},
      error:(e:ApiFailure)=>this.fail(e)});
  }
  private fail(e:ApiFailure):void{
    this.error.set(e?.message??'خطا در ارتباط با سرور');
    this.busy.set(false);
  }
}

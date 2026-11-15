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
import { OrgItem } from '../../core/api/administration.service';
import { AdmissionsService } from '../../core/api/admissions.service';
import { IssueView, LogisticsService } from '../../core/api/logistics.service';
import { TransfusionService, TransfusionView, TransfusionDetails,
  ChecklistInput, VitalInput } from '../../core/api/transfusion.service';
import { AuthService } from '../../core/auth/auth.service';
import { ApiFailure } from '../../core/api/api-error';
import { RequestStateComponent } from '../../shared/components/request-state.component';
import { isoToJalali } from '../../shared/jalali-date';

@Component({
  selector:'app-transfusion-workspace',standalone:true,
  imports:[FormsModule,RouterLink,MatButtonModule,MatCardModule,MatCheckboxModule,
    MatFormFieldModule,MatInputModule,MatSelectModule,MatTableModule,RequestStateComponent],
  template:`
    <section class="heading">
      <p class="eyebrow">HEMO / TRANSFUSION</p>
      <h1>تزریق و پایش فرآورده</h1>
      <p class="muted">کنترل‌های هویت، مچ‌بند و فرآورده باید حضوری و طبق دستورالعمل بیمارستان انجام شوند. این سامانه هیچ آستانه پزشکی را به‌طور خودکار تأیید نمی‌کند.</p>
    </section>
    <app-request-state [loading]="busy()" [error]="error()"/>
    @if(message()){<div class="notice" role="status">{{message()}}</div>}
    <mat-card class="panel">
      <mat-card-content class="fields">
        <mat-form-field appearance="outline">
          <mat-label>مرکز درمانی</mat-label>
          <mat-select name="facility" [(ngModel)]="facilityId" (ngModelChange)="onFacility()">
            @for(f of facilities();track f.id){<mat-option [value]="f.id">{{f.name}}</mat-option>}
          </mat-select>
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>بخش</mat-label>
          <mat-select name="department" [(ngModel)]="departmentId"
            (ngModelChange)="reload()" [disabled]="facilityId===null">
            @for(d of departments();track d.id){<mat-option [value]="d.id">{{d.name}}</mat-option>}
          </mat-select>
        </mat-form-field>
      </mat-card-content>
    </mat-card>
    @if(facilityId!==null&&departmentId!==null){
      @if(can('transfusion.start')){
        <mat-card class="panel">
          <mat-card-header><mat-card-title>آماده‌سازی تزریق از واحد تحویل‌شده</mat-card-title></mat-card-header>
          <mat-card-content>
            <p class="muted">فقط واحد تحویل‌شده به همین بخش، با درخواست تأییدشده و آزمایش سازگاری بازبینی‌شده پذیرفته می‌شود.</p>
            <form class="fields" (ngSubmit)="prepare()">
              <mat-form-field appearance="outline">
                <mat-label>شناسه تحویل واحد</mat-label>
                <mat-select name="issue" [(ngModel)]="issueId" required>
                  @for(i of issues();track i.id){
                    @if(i.status==='Received'){
                      <mat-option [value]="i.id">{{i.unitCode}} · تحویل {{i.id}} · درخواست {{i.requestId}}</mat-option>
                    }
                  }
                </mat-select>
              </mat-form-field>
              <div class="actions"><button mat-flat-button class="primary-button"
                [disabled]="busy()||!issueId">آماده‌سازی پرونده تزریق</button></div>
            </form>
          </mat-card-content>
        </mat-card>
      }

      <mat-card class="panel">
        <mat-card-header><mat-card-title>پرونده‌های تزریق بخش</mat-card-title></mat-card-header>
        <mat-card-content class="table-scroll">
          <table mat-table [dataSource]="items()" class="page-table">
            <ng-container matColumnDef="id"><th mat-header-cell *matHeaderCellDef>شناسه تزریق</th>
              <td mat-cell *matCellDef="let t">{{t.id}}</td></ng-container>
            <ng-container matColumnDef="encounter"><th mat-header-cell *matHeaderCellDef>بستری</th>
              <td mat-cell *matCellDef="let t">{{t.encounterId}}</td></ng-container>
            <ng-container matColumnDef="unit"><th mat-header-cell *matHeaderCellDef>واحد</th>
              <td mat-cell *matCellDef="let t">{{t.unitId}}</td></ng-container>
            <ng-container matColumnDef="status"><th mat-header-cell *matHeaderCellDef>وضعیت</th>
              <td mat-cell *matCellDef="let t"><span class="state">{{t.status}}</span></td></ng-container>
            <ng-container matColumnDef="actions"><th mat-header-cell *matHeaderCellDef>پرونده</th>
              <td mat-cell *matCellDef="let t"><button mat-button type="button"
                (click)="select(t.id)">پایش و اقدامات</button></td></ng-container>
            <tr mat-header-row *matHeaderRowDef="columns"></tr>
            <tr mat-row *matRowDef="let row;columns:columns"></tr>
          </table>
        </mat-card-content>
      </mat-card>

      @if(selected();as detail){
        <mat-card class="panel focused">
          <mat-card-header>
            <mat-card-title>پرونده تزریق شماره {{detail.transfusion.id}}</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <p class="muted">بستری {{detail.transfusion.encounterId}} · واحد {{detail.transfusion.unitId}}
              · وضعیت {{detail.transfusion.status}}</p>
            <div class="status-grid">
              <span [class.done]="detail.transfusion.baselineRecorded">علائم پایه:
                {{detail.transfusion.baselineRecorded?'ثبت‌شده':'ثبت‌نشده'}}</span>
              <span [class.done]="detail.transfusion.checklistComplete">چک‌لیست:
                {{detail.transfusion.checklistComplete?'تأیید شده':'ناقص'}}</span>
              <span [class.done]="detail.transfusion.signedOff">امضا:
                {{detail.transfusion.signedOff?'ثبت‌شده':'ثبت‌نشده'}}</span>
            </div>
            @if(can('transfusion.monitor') && !detail.transfusion.signedOff &&
              (detail.transfusion.status==='Planned'||detail.transfusion.status==='InProgress')){
              <form class="vital" (ngSubmit)="recordVital()">
                <h3>ثبت علائم حیاتی</h3>
                <p class="muted">زمان ثبت توسط سرور و زمان مشاهده به UTC ارسال می‌شود. هشدار تنها در صورت انتخاب صریح کاربر ثبت خواهد شد.</p>
                <div class="fields">
                  <mat-form-field appearance="outline"><mat-label>نقطه زمانی</mat-label>
                    <mat-select name="timepoint" [(ngModel)]="timepoint">
                      @if(detail.transfusion.status==='Planned'){
                        <mat-option value="Baseline">پیش از تزریق</mat-option>
                      } @else {
                        <mat-option value="During">حین تزریق</mat-option>
                        <mat-option value="End">پایان دوره</mat-option>
                        <mat-option value="FollowUp">پیگیری</mat-option>
                      }
                    </mat-select>
                  </mat-form-field>
                  <mat-form-field appearance="outline"><mat-label>فشار سیستولیک</mat-label>
                    <input matInput type="number" name="sbp" [(ngModel)]="sbp" min="0" max="350"/></mat-form-field>
                  <mat-form-field appearance="outline"><mat-label>فشار دیاستولیک</mat-label>
                    <input matInput type="number" name="dbp" [(ngModel)]="dbp" min="0" max="250"/></mat-form-field>
                  <mat-form-field appearance="outline"><mat-label>ضربان قلب</mat-label>
                    <input matInput type="number" name="heartRate" [(ngModel)]="heartRate" min="0" max="300"/></mat-form-field>
                  <mat-form-field appearance="outline"><mat-label>دمای بدن (°C)</mat-label>
                    <input matInput type="number" name="temp" [(ngModel)]="temp" min="20" max="45" step=".1"/></mat-form-field>
                  <mat-form-field appearance="outline"><mat-label>SpO₂ (%)</mat-label>
                    <input matInput type="number" name="spo2" [(ngModel)]="spo2" min="0" max="100"/></mat-form-field>
                  <mat-form-field appearance="outline"><mat-label>تعداد تنفس</mat-label>
                    <input matInput type="number" name="resp" [(ngModel)]="resp" min="0" max="100"/></mat-form-field>
                  <mat-form-field appearance="outline"><mat-label>توضیح بالینی</mat-label>
                    <textarea matInput name="clinicalNote" [(ngModel)]="clinicalNote" rows="2" maxlength="1200"></textarea>
                  </mat-form-field>
                  <mat-checkbox name="alert" [(ngModel)]="alertFlag" class="wide">
                    مشاهده نگران‌کننده توسط ثبت‌کننده علامت‌گذاری شد
                  </mat-checkbox>
                  <div class="actions wide">
                    <button mat-flat-button class="primary-button" [disabled]="busy()||!timepoint">
                      ثبت علائم حیاتی
                    </button>
                  </div>
                </div>
              </form>
            }
            @if(can('transfusion.start') && detail.transfusion.status==='Planned' &&
              detail.transfusion.baselineRecorded&&!detail.transfusion.checklistComplete){
              <form (ngSubmit)="submitChecklist()" class="checklist">
                <h3>چک‌لیست پیش از شروع</h3>
                <p class="muted">همه موارد فقط بعد از بررسی فیزیکی توسط فرد مجاز علامت زده شوند.</p>
                <mat-checkbox name="patientIdentityMatched" [(ngModel)]="check.patientIdentityMatched">هویت بیمار و مچ‌بند مطابقت دارد</mat-checkbox>
                <mat-checkbox name="unitIdentityMatched" [(ngModel)]="check.unitIdentityMatched">واحد و شناسه فرآورده مطابقت دارد</mat-checkbox>
                <mat-checkbox name="bloodGroupChecked" [(ngModel)]="check.bloodGroupChecked">گروه خونی برچسب بررسی شد</mat-checkbox>
                <mat-checkbox name="compatibilityChecked" [(ngModel)]="check.compatibilityChecked">سند Crossmatch بررسی شد</mat-checkbox>
                <mat-checkbox name="expiryChecked" [(ngModel)]="check.expiryChecked">تاریخ انقضا بررسی شد</mat-checkbox>
                <mat-checkbox name="baselineVitalChecked" [(ngModel)]="check.baselineVitalChecked">علائم پایه ثبت و بررسی شد</mat-checkbox>
                <div class="actions"><button mat-flat-button class="primary-button"
                  [disabled]="busy()||!allChecked()">ثبت تأیید چک‌لیست</button></div>
              </form>
            }
            <div class="actions">
              @if(can('transfusion.start') && detail.transfusion.status==='Planned' &&
                detail.transfusion.checklistComplete && detail.transfusion.baselineRecorded){
                <button mat-flat-button class="primary-button" type="button" [disabled]="busy()"
                  (click)="transition('start')">ثبت شروع تزریق</button>
              }
              @if(detail.transfusion.status==='InProgress'&&can('transfusion.monitor')){
                <mat-form-field appearance="outline">
                  <mat-label>علت توقف</mat-label><input matInput name="stopReason"
                    [(ngModel)]="stopReason" maxlength="1500"/>
                </mat-form-field>
                <button mat-stroked-button type="button" [disabled]="busy()||!stopReason.trim()"
                  (click)="transition('stop')">توقف تزریق</button>
              }
              @if(detail.transfusion.status==='InProgress'&&can('transfusion.complete')){
                <button mat-flat-button class="primary-button" type="button" [disabled]="busy()"
                  (click)="transition('complete')">ثبت پایان تزریق</button>
              }
              @if((detail.transfusion.status==='Completed'||detail.transfusion.status==='Stopped')
                &&!detail.transfusion.signedOff&&can('transfusion.complete')){
                <button mat-stroked-button type="button" [disabled]="busy()"
                  (click)="signoff()">امضای مستقل پرونده</button>
              }
              <button mat-button type="button" (click)="select(detail.transfusion.id)">بازیابی پرونده</button>
            </div>
            <h3>تاریخچه علائم</h3>
            <div class="table-scroll">
              <table mat-table [dataSource]="detail.observations" class="page-table">
                <ng-container matColumnDef="observed"><th mat-header-cell *matHeaderCellDef>زمان</th>
                  <td mat-cell *matCellDef="let v">{{jalali(v.observedAt)}}</td></ng-container>
                <ng-container matColumnDef="code"><th mat-header-cell *matHeaderCellDef>نقطه</th>
                  <td mat-cell *matCellDef="let v">{{v.timepointCode}}</td></ng-container>
                <ng-container matColumnDef="pulse"><th mat-header-cell *matHeaderCellDef>نبض</th>
                  <td mat-cell *matCellDef="let v">{{v.heartRate??'—'}}</td></ng-container>
                <ng-container matColumnDef="temp"><th mat-header-cell *matHeaderCellDef>دما</th>
                  <td mat-cell *matCellDef="let v">{{v.temperatureC??'—'}}</td></ng-container>
                <ng-container matColumnDef="flag"><th mat-header-cell *matHeaderCellDef>مشاهده</th>
                  <td mat-cell *matCellDef="let v">{{v.alertFlag?'علامت‌گذاری‌شده':'—'}}</td></ng-container>
                <tr mat-header-row *matHeaderRowDef="vitalColumns"></tr>
                <tr mat-row *matRowDef="let row;columns:vitalColumns"></tr>
              </table>
            </div>
            <p class="muted">رویدادهای ثبت‌شده: {{detail.actions.join(' · ')}}</p>
          </mat-card-content>
        </mat-card>
      }
      <div class="page-actions">
        <button mat-stroked-button type="button" (click)="reload()">بارگذاری مجدد</button>
        <a mat-button routerLink="/logistics">تحویل و لجستیک</a>
      </div>
    }
  `,
  styles:[`
    mat-card{margin-bottom:18px;overflow:hidden}
    mat-card-title{font-size:17px;font-weight:800}
    mat-card-header{margin-bottom:12px}
    .fields{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(215px,100%),1fr));gap:10px 15px}
    .wide{grid-column:1/-1}
    .table-scroll{max-width:100%;overflow-x:auto}
    table{width:100%;min-width:670px}
    th.mat-mdc-header-cell{text-align:right;background:#f7f9fc;font-weight:800}
    .actions{display:flex;align-items:center;flex-wrap:wrap;gap:12px;margin:15px 0}
    .actions mat-form-field{min-width:240px;flex:1 1 220px}
    .focused{border-right:4px solid #b91c35!important}
    .status-grid{display:flex;flex-wrap:wrap;gap:10px;margin:16px 0}
    .status-grid span{background:#fff1f3;padding:8px 12px;border-radius:9px;color:#ab253b}
    .status-grid span.done{background:#e8f6ee;color:#1f784c}
    .vital,.checklist{border:1px solid #e2e8f0;border-radius:13px;padding:18px;margin-top:18px}
    .checklist{display:grid;gap:10px}
    .state{background:#eff4fc;padding:5px 11px;border-radius:15px}
    @media(max-width:700px){.fields{grid-template-columns:1fr}.actions>button{flex:1}}
  `]
})
export class TransfusionWorkspaceComponent implements OnInit {
  private readonly admission=inject(AdmissionsService);
  private readonly logistics=inject(LogisticsService);
  private readonly api=inject(TransfusionService);
  private readonly auth=inject(AuthService);
  readonly facilities=signal<OrgItem[]>([]);
  readonly departments=signal<OrgItem[]>([]);
  readonly issues=signal<IssueView[]>([]);
  readonly items=signal<TransfusionView[]>([]);
  readonly selected=signal<TransfusionDetails|null>(null);
  readonly busy=signal(false);
  readonly error=signal<string|null>(null);
  readonly message=signal<string|null>(null);
  readonly columns=['id','encounter','unit','status','actions'];
  readonly vitalColumns=['observed','code','pulse','temp','flag'];
  readonly jalali=isoToJalali;
  facilityId:number|null=null;departmentId:number|null=null;issueId:number|null=null;
  timepoint='Baseline';sbp:number|null=null;dbp:number|null=null;heartRate:number|null=null;
  temp:number|null=null;spo2:number|null=null;resp:number|null=null;
  clinicalNote='';alertFlag=false;stopReason='';
  check:ChecklistInput={patientIdentityMatched:false,unitIdentityMatched:false,
    bloodGroupChecked:false,compatibilityChecked:false,expiryChecked:false,
    baselineVitalChecked:false,note:null};

  ngOnInit():void {this.admission.facilities().subscribe({
    next:rows=>this.facilities.set(rows),error:(e:ApiFailure)=>this.fail(e)
  });}
  can(permission:string):boolean {
    return (this.auth.session()?.grants??[]).some(g=>
      g.permissions.includes(permission) &&
      (g.roleCode==='SYSTEM_ADMIN' ||
        (g.facilityId===this.facilityId &&
          (g.departmentId===null||g.departmentId===this.departmentId))));
  }
  onFacility():void{
    this.departmentId=null;this.departments.set([]);this.issues.set([]);
    this.items.set([]);this.selected.set(null);
    if(this.facilityId===null)return;
    this.admission.departments(this.facilityId).subscribe({
      next:r=>this.departments.set(r),error:(e:ApiFailure)=>this.fail(e)
    });
  }
  reload():void{
    this.selected.set(null);this.items.set([]);this.issues.set([]);
    if(this.facilityId===null||this.departmentId===null)return;
    const f=this.facilityId,d=this.departmentId;
    this.busy.set(true);this.error.set(null);
    this.api.list(f,d).subscribe({
      next:r=>{this.items.set(r);this.busy.set(false);},
      error:(e:ApiFailure)=>this.fail(e)
    });
    if(this.can('transfusion.start'))this.logistics.list(f,d).subscribe({
      next:r=>this.issues.set(r),error:(e:ApiFailure)=>this.fail(e)
    });
  }
  select(id:number):void{
    if(this.facilityId===null||this.departmentId===null)return;
    this.busy.set(true);this.error.set(null);
    this.api.get(this.facilityId,this.departmentId,id).subscribe({
      next:r=>{this.selected.set(r);this.timepoint=r.transfusion.status==='Planned'
        ? 'Baseline':'During';this.busy.set(false);},
      error:(e:ApiFailure)=>this.fail(e)
    });
  }
  prepare():void{
    if(this.facilityId===null||this.departmentId===null||!this.issueId)return;
    const f=this.facilityId,d=this.departmentId;
    this.run(this.api.prepare(f,d,this.issueId),result=>{
      this.issueId=null;this.reload();this.select(result.id);
    });
  }
  allChecked():boolean{
    return this.check.patientIdentityMatched&&this.check.unitIdentityMatched&&
      this.check.bloodGroupChecked&&this.check.compatibilityChecked&&
      this.check.expiryChecked&&this.check.baselineVitalChecked;
  }
  submitChecklist():void{
    const t=this.selected()?.transfusion;
    if(!t||this.facilityId===null||this.departmentId===null||!this.allChecked())return;
    this.run(this.api.checklist(this.facilityId,this.departmentId,t.id,this.check),()=>{
      this.select(t.id);
    });
  }
  recordVital():void{
    const t=this.selected()?.transfusion;
    if(!t||this.facilityId===null||this.departmentId===null)return;
    const data:VitalInput={timepointCode:this.timepoint,observedAt:new Date().toISOString(),
      systolicBp:this.sbp,diastolicBp:this.dbp,heartRate:this.heartRate,
      temperatureC:this.temp,spo2:this.spo2,respiratoryRate:this.resp,
      urineOutputMl:null,alertFlag:this.alertFlag,clinicalNote:this.clinicalNote.trim()||null};
    this.run(this.api.vital(this.facilityId,this.departmentId,t.id,data),()=>{
      this.clinicalNote='';this.alertFlag=false;this.select(t.id);
    });
  }
  transition(action:'start'|'stop'|'complete'):void {
    const t=this.selected()?.transfusion;
    if(!t||this.facilityId===null||this.departmentId===null)return;
    if(action==='stop'&&!this.stopReason.trim())return;
    if(!window.confirm(action==='start'
      ? 'همه کنترل‌های پیش از تزریق حضوری انجام شد؟'
      : action==='stop'?'توقف واقعی فرآورده و اقدامات مراقبتی ثبت شده‌اند؟'
      :'فرایند تزریق واقعاً پایان یافته است؟'))return;
    this.run(this.api.transition(this.facilityId,this.departmentId,t.id,action,
      t.rowVersion,action==='stop'?this.stopReason.trim():null),()=>{
      this.stopReason='';this.select(t.id);
    });
  }
  signoff():void{
    const t=this.selected()?.transfusion;
    if(!t||this.facilityId===null||this.departmentId===null||
       !window.confirm('فقط بازبین مستقل مجاز است پرونده را امضا کند.'))return;
    this.run(this.api.signoff(this.facilityId,this.departmentId,t.id,t.rowVersion,null),
      ()=>this.select(t.id));
  }
  private run<T>(req:Observable<T>,success:(result:T)=>void):void{
    if(this.busy())return;
    this.busy.set(true);this.error.set(null);this.message.set(null);
    req.subscribe({next:result=>{this.message.set('عملیات ثبت شد.');this.busy.set(false);
      success(result);},error:(e:ApiFailure)=>this.fail(e)});
  }
  private fail(e:ApiFailure):void{this.error.set(e?.message??'خطای سرویس');
    this.busy.set(false);}
}

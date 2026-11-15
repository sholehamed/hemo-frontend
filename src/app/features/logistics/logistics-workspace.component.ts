import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Observable } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { AdmissionsService } from '../../core/api/admissions.service';
import { OrgItem } from '../../core/api/administration.service';
import { BloodBankService, BankWorkItem } from '../../core/api/blood-bank.service';
import { LogisticsService, IssueView, ReturnView } from '../../core/api/logistics.service';
import { AuthService } from '../../core/auth/auth.service';
import { ApiFailure } from '../../core/api/api-error';
import { RequestStateComponent } from '../../shared/components/request-state.component';
import { isoToJalali } from '../../shared/jalali-date';

@Component({
  selector:'app-logistics-workspace',standalone:true,
  imports:[FormsModule,RouterLink,MatButtonModule,MatCardModule,MatFormFieldModule,
    MatInputModule,MatSelectModule,MatTableModule,RequestStateComponent],
  template:`
    <section class="heading">
      <p class="eyebrow">BLOOD BANK / LOGISTICS</p>
      <h1>صدور، حمل و تحویل فرآورده</h1>
      <p class="muted">صدور فقط برای درخواست تأییدشده و Crossmatch نهایی سازگار مجاز است؛ برگشت واحد تا بررسی مستقل در قرنطینه باقی می‌ماند.</p>
    </section>
    <app-request-state [loading]="busy()" [error]="error()" />
    @if (message()) { <p class="notice" role="status">{{ message() }}</p> }
    <mat-card class="scope">
      <mat-card-content class="grid">
        <mat-form-field appearance="outline">
          <mat-label>مرکز درمانی</mat-label>
          <mat-select name="facility" [(ngModel)]="facilityId" (ngModelChange)="onFacility()">
            @for(f of facilities();track f.id){<mat-option [value]="f.id">{{ f.name }}</mat-option>}
          </mat-select>
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>بخش دریافت‌کننده</mat-label>
          <mat-select name="department" [(ngModel)]="departmentId"
            (ngModelChange)="reload()" [disabled]="!facilityId">
            @for(d of departments();track d.id){<mat-option [value]="d.id">{{ d.name }}</mat-option>}
          </mat-select>
        </mat-form-field>
      </mat-card-content>
    </mat-card>
    @if (facilityId!==null && departmentId!==null) {
      @if (can('issue.create')) {
        <mat-card class="scope">
          <mat-card-header><mat-card-title>صدور واحد دارای سازگاری تأییدشده</mat-card-title></mat-card-header>
          <mat-card-content>
            <p class="muted">واحد و درخواست حتماً متعلق به همین مرکز و بخش بوده و با بررسی نهایی آزمایشگاه کنترل می‌شوند.</p>
            <form class="grid" (ngSubmit)="issue()">
              <mat-form-field appearance="outline">
                <mat-label>واحد آماده صدور</mat-label>
                <mat-select name="approvedUnit" [(ngModel)]="selectedUnit" required>
                  @for(item of bankWork();track item.reservationId){
                    @if(item.crossmatchStatus==='Final' && item.compatibilityResult==='Compatible'){
                      <mat-option [value]="item.unitId">
                        {{ item.unitCode }} · درخواست {{ item.requestId }}
                      </mat-option>
                    }
                  }
                </mat-select>
              </mat-form-field>
              <mat-form-field appearance="outline">
                <mat-label>یادداشت شرایط تحویل</mat-label>
                <input matInput name="issueNote" [(ngModel)]="issueNote" maxlength="1000" />
              </mat-form-field>
              <div class="actions">
                <button mat-flat-button class="primary-button" [disabled]="busy() || !selectedUnit">صدور واحد</button>
              </div>
            </form>
          </mat-card-content>
        </mat-card>
      }
      <mat-card class="scope">
        <mat-card-header><mat-card-title>تحویل واحدها به بخش</mat-card-title></mat-card-header>
        <mat-card-content class="table-scroll">
          <table mat-table [dataSource]="issues()" class="page-table">
            <ng-container matColumnDef="code"><th mat-header-cell *matHeaderCellDef>کد واحد</th>
              <td mat-cell *matCellDef="let i">{{ i.unitCode }}</td></ng-container>
            <ng-container matColumnDef="request"><th mat-header-cell *matHeaderCellDef>درخواست</th>
              <td mat-cell *matCellDef="let i">{{ i.requestId }}</td></ng-container>
            <ng-container matColumnDef="date"><th mat-header-cell *matHeaderCellDef>تاریخ</th>
              <td mat-cell *matCellDef="let i">{{ jalali(i.issuedAt) }}</td></ng-container>
            <ng-container matColumnDef="status"><th mat-header-cell *matHeaderCellDef>وضعیت</th>
              <td mat-cell *matCellDef="let i">{{ i.status }}</td></ng-container>
            <ng-container matColumnDef="action"><th mat-header-cell *matHeaderCellDef>عملیات</th>
              <td mat-cell *matCellDef="let i">
                @if(can('dispatch.manage') && i.status==='Issued'){
                  <button mat-button type="button" (click)="dispatchIssueId=i.id">ثبت حمل</button>
                }
                @if(can('issue.receive') && (i.status==='Issued'||i.status==='InTransit')){
                  <button mat-button type="button" (click)="receive(i)">تأیید دریافت</button>
                }
                @if(can('return.manage') && i.status==='Received' && i.receivedByUserId){
                  <button mat-button type="button" (click)="selectReturn(i)">ثبت برگشت</button>
                }
              </td></ng-container>
            <tr mat-header-row *matHeaderRowDef="issueColumns"></tr>
            <tr mat-row *matRowDef="let row;columns:issueColumns;"></tr>
          </table>
        </mat-card-content>
      </mat-card>
      @if (dispatchIssueId!==null) {
        <mat-card class="action-card">
          <mat-card-header><mat-card-title>ثبت شرایط ارسال · شماره {{ dispatchIssueId }}</mat-card-title></mat-card-header>
          <mat-card-content>
            <form class="grid" (ngSubmit)="dispatch()">
              <mat-form-field appearance="outline">
                <mat-label>نوع محفظه</mat-label>
                <input matInput name="container" [(ngModel)]="containerType" required maxlength="80" />
              </mat-form-field>
              <mat-form-field appearance="outline">
                <mat-label>دمای هنگام خروج (°C)</mat-label>
                <input matInput name="temperature" type="number"
                  [(ngModel)]="exitTemp" step="0.1" />
              </mat-form-field>
              <mat-form-field appearance="outline">
                <mat-label>توضیحات حمل</mat-label>
                <input matInput name="dispatchNote" [(ngModel)]="dispatchNote" maxlength="1200" />
              </mat-form-field>
              <div class="actions">
                <button mat-flat-button class="primary-button" [disabled]="busy() || !containerType.trim()">ثبت ارسال</button>
                <button mat-button type="button" (click)="dispatchIssueId=null">انصراف</button>
              </div>
            </form>
          </mat-card-content>
        </mat-card>
      }
      @if (selectedReturnIssue();as issue) {
        <mat-card class="action-card">
          <mat-card-header><mat-card-title>بازگشت واحد {{ issue.unitCode }} به بانک خون</mat-card-title></mat-card-header>
          <mat-card-content>
            <p class="muted">ثبت برگشت صرفاً پس از دریافت فیزیکی توسط کارشناس بانک خون؛ واحد مستقیم به موجودی قابل استفاده برنمی‌گردد.</p>
            <form (ngSubmit)="returnUnit()" class="grid">
              <mat-form-field appearance="outline">
                <mat-label>کد علت برگشت</mat-label>
                <input matInput name="reason" [(ngModel)]="returnReason" required maxlength="60" />
              </mat-form-field>
              <mat-form-field appearance="outline">
                <mat-label>وضعیت بسته</mat-label>
                <input matInput name="condition" [(ngModel)]="returnCondition" maxlength="40" />
              </mat-form-field>
              <mat-form-field appearance="outline">
                <mat-label>دمای هنگام تحویل (°C)</mat-label>
                <input matInput name="returnTemp" [(ngModel)]="returnTemp" type="number" step=".1" />
              </mat-form-field>
              <div class="actions">
                <button mat-flat-button class="primary-button" [disabled]="busy() || !returnReason.trim()">ثبت برگشت به قرنطینه</button>
                <button mat-button type="button" (click)="selectedReturnIssue.set(null)">انصراف</button>
              </div>
            </form>
          </mat-card-content>
        </mat-card>
      }
      @if(can('return.manage')) {
        <mat-card class="scope">
          <mat-card-header><mat-card-title>بازبینی مستقل برگشت‌ها</mat-card-title></mat-card-header>
          <mat-card-content class="table-scroll">
            <table mat-table [dataSource]="returns()" class="page-table">
              <ng-container matColumnDef="id"><th mat-header-cell *matHeaderCellDef>برگشت</th>
                <td mat-cell *matCellDef="let r">{{ r.id }}</td></ng-container>
              <ng-container matColumnDef="issue"><th mat-header-cell *matHeaderCellDef>صدور</th>
                <td mat-cell *matCellDef="let r">{{ r.issueId }}</td></ng-container>
              <ng-container matColumnDef="status"><th mat-header-cell *matHeaderCellDef>وضعیت</th>
                <td mat-cell *matCellDef="let r">{{ r.status }} {{ r.decision ?? '' }}</td></ng-container>
              <ng-container matColumnDef="review"><th mat-header-cell *matHeaderCellDef>بررسی</th>
                <td mat-cell *matCellDef="let r">
                  @if(r.status==='Pending') {
                    <button mat-button type="button" (click)="reviewReturn(r,'Quarantine')">تأیید قرنطینه</button>
                    <button mat-button type="button" (click)="reviewReturn(r,'Waste')">ثبت امحا</button>
                  }
                </td></ng-container>
              <tr mat-header-row *matHeaderRowDef="returnColumns"></tr>
              <tr mat-row *matRowDef="let row;columns:returnColumns;"></tr>
            </table>
          </mat-card-content>
        </mat-card>
      }
      <div class="page-actions">
        <button mat-stroked-button type="button" (click)="reload()">به‌روزرسانی</button>
        <a mat-button routerLink="/blood-bank">بازگشت به بانک خون</a>
      </div>
    }
  `,
  styles:[`
    mat-card{margin-bottom:18px;overflow:hidden}
    mat-card-title{font-size:17px;font-weight:800}
    .grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(230px,100%),1fr));gap:9px 14px}
    .table-scroll{max-width:100%;overflow-x:auto}
    .page-table{width:100%;min-width:680px}
    th.mat-mdc-header-cell{text-align:right;font-weight:700;background:#f7f9fc}
    .actions{display:flex;gap:8px;align-items:center;flex-wrap:wrap}
    .action-card{border-right:4px solid #b91c35!important}
    @media(max-width:680px){.grid{grid-template-columns:1fr}}
  `]
})
export class LogisticsWorkspaceComponent implements OnInit {
  private readonly api=inject(LogisticsService);
  private readonly bank=inject(BloodBankService);
  private readonly admission=inject(AdmissionsService);
  private readonly auth=inject(AuthService);
  readonly facilities=signal<OrgItem[]>([]);
  readonly departments=signal<OrgItem[]>([]);
  readonly issues=signal<IssueView[]>([]);
  readonly returns=signal<ReturnView[]>([]);
  readonly bankWork=signal<BankWorkItem[]>([]);
  readonly busy=signal(false);
  readonly error=signal<string|null>(null);
  readonly message=signal<string|null>(null);
  readonly selectedReturnIssue=signal<IssueView|null>(null);
  readonly issueColumns=['code','request','date','status','action'];
  readonly returnColumns=['id','issue','status','review'];
  readonly jalali=isoToJalali;
  facilityId:number|null=null;departmentId:number|null=null;selectedUnit:number|null=null;
  issueNote='';dispatchIssueId:number|null=null;containerType='';exitTemp:number|null=null;
  dispatchNote='';returnReason='';returnCondition='';returnTemp:number|null=null;

  ngOnInit():void { this.admission.facilities().subscribe({
    next:rows=>this.facilities.set(rows),error:(e:ApiFailure)=>this.fail(e)
  });}
  can(permission:string):boolean {
    return (this.auth.session()?.grants??[]).some(g=>
      g.permissions.includes(permission) &&
      (g.roleCode==='SYSTEM_ADMIN' ||
        (g.facilityId===this.facilityId &&
          (g.departmentId===null || g.departmentId===this.departmentId))));
  }
  onFacility():void {
    this.departmentId=null;this.issues.set([]);this.departments.set([]);this.returns.set([]);
    if(this.facilityId===null)return;
    this.admission.departments(this.facilityId).subscribe({
      next:rows=>this.departments.set(rows),error:(e:ApiFailure)=>this.fail(e)
    });
  }
  reload():void {
    if(this.facilityId===null||this.departmentId===null)return;
    const f=this.facilityId,d=this.departmentId;
    this.busy.set(true);this.error.set(null);
    this.api.list(f,d).subscribe({
      next:rows=>{this.issues.set(rows);this.busy.set(false);},
      error:(e:ApiFailure)=>this.fail(e)
    });
    if(this.can('issue.create'))this.bank.work(f).subscribe({
      next:rows=>this.bankWork.set(rows),
      error:(e:ApiFailure)=>this.fail(e)
    });
    if(this.can('return.manage'))this.api.returns(f).subscribe({
      next:rows=>this.returns.set(rows),
      error:(e:ApiFailure)=>this.fail(e)
    });
  }
  issue():void {
    const w=this.bankWork().find(x=>x.unitId===this.selectedUnit);
    if(!w||this.facilityId===null||this.departmentId===null)return;
    this.run(this.api.issue(this.facilityId,w.unitId,w.requestId,this.departmentId,
      this.issueNote.trim()||null),()=>{this.selectedUnit=null;this.issueNote='';});
  }
  dispatch():void {
    if(this.facilityId===null||this.dispatchIssueId===null)return;
    this.run(this.api.dispatch(this.facilityId,this.dispatchIssueId,
      this.containerType.trim(),this.exitTemp,this.dispatchNote.trim()||null),
      ()=>{this.dispatchIssueId=null;this.containerType='';this.dispatchNote='';});
  }
  receive(issue:IssueView):void {
    if(this.facilityId===null||this.departmentId===null)return;
    if(!window.confirm('واحد به‌صورت فیزیکی دریافت و با اطلاعات درخواست بررسی شده است؟'))return;
    this.run(this.api.receive(this.facilityId,this.departmentId,issue.id,
      issue.rowVersion,'Receipt confirmation recorded'),()=>{});
  }
  selectReturn(issue:IssueView):void { this.selectedReturnIssue.set(issue); }
  returnUnit():void {
    const issue=this.selectedReturnIssue();
    if(!issue||!issue.receivedByUserId||this.facilityId===null||this.departmentId===null)return;
    this.run(this.api.returnUnit(this.facilityId,this.departmentId,issue.id,
      issue.receivedByUserId,this.returnReason.trim(),this.returnCondition.trim()||null,
      this.returnTemp,null),()=>{this.selectedReturnIssue.set(null);this.returnReason='';});
  }
  reviewReturn(ret:ReturnView,decision:string):void {
    if(this.facilityId===null||!window.confirm('بازبینی مستقل و بررسی فیزیکی انجام شده است؟'))return;
    this.run(this.api.reviewReturn(this.facilityId,ret.id,decision,ret.rowVersion,
      'Review recorded by authorized supervisor'),()=>{});
  }
  private run<T>(request:Observable<T>,success:()=>void):void {
    if(this.busy())return;
    this.busy.set(true);this.error.set(null);this.message.set(null);
    request.subscribe({
      next:()=>{success();this.message.set('عملیات در پایگاه داده ثبت شد.');this.reload();},
      error:(e:ApiFailure)=>this.fail(e)
    });
  }
  private fail(e:ApiFailure):void { this.error.set(e?.message??'خطا در ارتباط با سرور');this.busy.set(false); }
}

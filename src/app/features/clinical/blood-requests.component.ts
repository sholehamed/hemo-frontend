import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { OrgItem } from '../../core/api/administration.service';
import { AdmissionsService } from '../../core/api/admissions.service';
import { BloodRequestPage, BloodRequestView, BloodRequestsService,
  ProductTypeOption } from '../../core/api/blood-requests.service';
import { AuthService } from '../../core/auth/auth.service';
import { ApiFailure } from '../../core/api/api-error';
import { RequestStateComponent } from '../../shared/components/request-state.component';
import { isoToJalali } from '../../shared/jalali-date';

@Component({
 selector:'app-blood-requests', standalone:true,
 imports:[FormsModule, RouterLink, MatButtonModule, MatCardModule,MatFormFieldModule,
   MatInputModule, MatSelectModule,MatTableModule,MatPaginatorModule, RequestStateComponent],
 template:`
  <section class="heading">
    <p class="eyebrow">HEMO / CLINICAL REQUESTS</p>
    <h1>درخواست فرآورده خون</h1>
    <p class="muted">درخواست‌ها برای هر بیمار و بستری یک شناسه مشترک دارند. تأیید پزشک، مجوز صدور یا تأیید سازگاری واحد خون نیست.</p>
  </section>
  <app-request-state [loading]="busy()" [error]="error()" [traceId]="traceId()" />
  @if (message()) { <div role="status" class="result">{{ message() }}</div> }
  <mat-card class="scope">
    <mat-card-header><mat-card-title>محدوده کاری</mat-card-title></mat-card-header>
    <mat-card-content class="form-grid">
      <mat-form-field appearance="outline">
        <mat-label>مرکز درمانی</mat-label>
        <mat-select name="facility" [(ngModel)]="facilityId" (ngModelChange)="onFacility()">
          @for(f of facilities();track f.id){<mat-option [value]="f.id">{{f.name}}</mat-option>}
        </mat-select>
      </mat-form-field>
      <mat-form-field appearance="outline">
        <mat-label>بخش</mat-label>
        <mat-select name="department" [(ngModel)]="departmentId"
          (ngModelChange)="onDepartment()" [disabled]="facilityId===null">
          @for(d of departments();track d.id){<mat-option [value]="d.id">{{d.name}}</mat-option>}
        </mat-select>
      </mat-form-field>
    </mat-card-content>
  </mat-card>

  @if(facilityId!==null&&departmentId!==null){
    @if(canCreate()){
      <mat-card class="work-card">
        <mat-card-header><mat-card-title>ثبت درخواست جدید</mat-card-title></mat-card-header>
        <mat-card-content>
          <form (ngSubmit)="submit()" class="form-grid">
            <mat-form-field appearance="outline">
              <mat-label>شناسه بستری بیمار</mat-label>
              <input matInput name="encounterId" type="number" min="1"
                required [(ngModel)]="encounterId" />
              <mat-hint>فقط بیمار تأیید هویت‌شده همان بخش</mat-hint>
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>فرآورده</mat-label>
              <mat-select name="productId" [(ngModel)]="productTypeId" required>
                @for(p of products();track p.id){<mat-option [value]="p.id">{{p.name}}</mat-option>}
              </mat-select>
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>تعداد واحد</mat-label>
              <input matInput name="quantity" type="number" min="0.001" step="0.001"
                [(ngModel)]="quantity" required />
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>اولویت</mat-label>
              <mat-select name="priority" [(ngModel)]="priority">
                <mat-option value="Routine">عادی</mat-option>
                <mat-option value="Urgent">فوری</mat-option>
                <mat-option value="Emergency">اورژانسی (نیازمند SOP)</mat-option>
              </mat-select>
            </mat-form-field>
            <mat-form-field appearance="outline" class="full">
              <mat-label>اندیکاسیون / علت درخواست</mat-label>
              <textarea matInput name="indication" [(ngModel)]="indication"
                required rows="2" maxlength="2000"></textarea>
            </mat-form-field>
            <mat-form-field appearance="outline" class="full">
              <mat-label>تشخیص (اختیاری)</mat-label>
              <textarea matInput name="diagnosis" [(ngModel)]="diagnosis"
                rows="2" maxlength="1000"></textarea>
            </mat-form-field>
            <div class="full">
              <button mat-flat-button class="primary-button" [disabled]="busy() ||
                !encounterId || !productTypeId || quantity<=0 || indication.trim().length<3">
                ثبت و ارسال برای پزشک
              </button>
            </div>
          </form>
        </mat-card-content>
      </mat-card>
    }
    <mat-card class="work-card">
      <mat-card-header><mat-card-title>کارتابل مشترک درخواست‌ها</mat-card-title></mat-card-header>
      <mat-card-content>
        <div class="filter">
          <mat-form-field appearance="outline">
            <mat-label>وضعیت</mat-label>
            <mat-select name="status" [(ngModel)]="statusFilter" (ngModelChange)="refresh(1)">
              <mat-option value="">همه درخواست‌ها</mat-option>
              <mat-option value="AwaitingDoctor">منتظر پزشک</mat-option>
              <mat-option value="Approved">تأیید شده</mat-option>
              <mat-option value="Rejected">رد شده</mat-option>
              <mat-option value="Draft">بازگشت برای اصلاح</mat-option>
            </mat-select>
          </mat-form-field>
          <button mat-stroked-button type="button" (click)="refresh(1)">بارگذاری مجدد</button>
        </div>
      </mat-card-content>
      @if(page();as result){
        <div class="table-scroll">
          <table mat-table [dataSource]="result.items">
            <ng-container matColumnDef="requestNo">
              <th mat-header-cell *matHeaderCellDef>شماره درخواست</th>
              <td mat-cell *matCellDef="let row">{{row.requestNo}}</td>
            </ng-container>
            <ng-container matColumnDef="encounter">
              <th mat-header-cell *matHeaderCellDef>بستری</th>
              <td mat-cell *matCellDef="let row">{{row.encounterId}}</td>
            </ng-container>
            <ng-container matColumnDef="product">
              <th mat-header-cell *matHeaderCellDef>فرآورده / تعداد</th>
              <td mat-cell *matCellDef="let row">{{row.productCode}} · {{row.quantity}}</td>
            </ng-container>
            <ng-container matColumnDef="date">
              <th mat-header-cell *matHeaderCellDef>تاریخ</th>
              <td mat-cell *matCellDef="let row">{{jalali(row.requestedAt)}}</td>
            </ng-container>
            <ng-container matColumnDef="status">
              <th mat-header-cell *matHeaderCellDef>وضعیت</th>
              <td mat-cell *matCellDef="let row">{{row.status}}</td>
            </ng-container>
            <ng-container matColumnDef="action">
              <th mat-header-cell *matHeaderCellDef>عملیات</th>
              <td mat-cell *matCellDef="let row">
                @if(canApprove()&&row.status==='AwaitingDoctor'){
                  <button mat-button type="button" (click)="selectReview(row)">بازبینی</button>
                } @else { <span class="muted">—</span> }
              </td>
            </ng-container>
            <tr mat-header-row *matHeaderRowDef="columns"></tr>
            <tr mat-row *matRowDef="let row; columns:columns"></tr>
          </table>
        </div>
        <mat-paginator [pageSize]="result.pageSize" [pageIndex]="result.page-1"
          [length]="result.total" [hidePageSize]="true"
          (page)="refresh($event.pageIndex+1)" aria-label="صفحه‌بندی درخواست‌ها"></mat-paginator>
      }
      <app-request-state [empty]="!busy()&&!error()&&page()?.items?.length===0"/>
    </mat-card>
    @if(selected();as current){
      <mat-card class="work-card review">
        <mat-card-header>
          <mat-card-title>تصمیم پزشک · {{current.requestNo}}</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <p><strong>علت درخواست:</strong> {{current.indication}}</p>
          <p class="muted">بازبینی مستقل و تأیید حرفه‌ای توسط پزشک واجد مجوز الزامی است.</p>
          <div class="form-grid">
            <mat-form-field appearance="outline">
              <mat-label>تصمیم</mat-label>
              <mat-select name="decision" [(ngModel)]="decision">
                <mat-option value="Approved">تأیید</mat-option>
                <mat-option value="Rejected">رد درخواست</mat-option>
                <mat-option value="Returned">بازگشت جهت اصلاح</mat-option>
              </mat-select>
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>توضیح تصمیم</mat-label>
              <textarea matInput name="reason" [(ngModel)]="reason" rows="3"
                maxlength="1500"></textarea>
            </mat-form-field>
          </div>
          <div class="page-actions">
            <button mat-flat-button class="primary-button" type="button"
              [disabled]="busy()||(decision!=='Approved'&&!reason.trim())"
              (click)="review()">ثبت تصمیم پزشک</button>
            <button mat-button type="button" (click)="selected.set(null)">انصراف</button>
          </div>
        </mat-card-content>
      </mat-card>
    }
  }
  <p><a mat-button routerLink="/">بازگشت به نمای کلی</a></p>
 `,
 styles:[`
   .scope,.work-card{margin-bottom:18px;overflow:hidden}
   mat-card-header{margin-bottom:15px}mat-card-title{font-size:18px;font-weight:800}
   .form-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(245px,100%),1fr));gap:13px}
   .full{grid-column:1/-1}.filter{display:flex;align-items:center;gap:12px;flex-wrap:wrap}
   .filter mat-form-field{width:min(280px,100%)}
   .table-scroll{max-width:100%;overflow-x:auto}table{width:100%;min-width:670px}
   th.mat-mdc-header-cell{text-align:right;font-weight:700;background:#f7f9fc}
   .result{padding:14px 18px;background:#e2f3e9;color:#16533c;border-radius:10px;margin:13px 0}
   .review{border-right:4px solid #b91c35}
   @media(max-width:650px){.form-grid{grid-template-columns:1fr}.filter>*{flex:1 1 100%}}
 `]
})
export class BloodRequestsComponent implements OnInit {
 private readonly admission = inject(AdmissionsService);
 private readonly api = inject(BloodRequestsService);
 private readonly auth = inject(AuthService);
 readonly busy = signal(false);
 readonly error = signal<string|null>(null);
 readonly traceId = signal<string|null>(null);
 readonly message = signal<string|null>(null);
 readonly facilities = signal<OrgItem[]>([]);
 readonly departments = signal<OrgItem[]>([]);
 readonly products = signal<ProductTypeOption[]>([]);
 readonly page = signal<BloodRequestPage|null>(null);
 readonly selected = signal<BloodRequestView|null>(null);
 readonly columns = ['requestNo','encounter','product','date','status','action'];
 readonly jalali = isoToJalali;
 facilityId: number|null = null;
 departmentId: number|null = null;
 encounterId: number|null = null;
 productTypeId: number|null = null;
 quantity = 1;
 priority = 'Routine';
 indication = '';
 diagnosis = '';
 statusFilter = '';
 decision: 'Approved'|'Rejected'|'Returned' = 'Approved';
 reason = '';
 canCreate(): boolean { return this.auth.hasRole('NURSE') || this.auth.hasRole('DOCTOR'); }
 canApprove(): boolean { return this.auth.hasRole('DOCTOR'); }
 ngOnInit(): void {
   this.busy.set(true);
   this.admission.facilities().subscribe({
     next: list => { this.facilities.set(list); this.busy.set(false); },
     error: e => this.fail(e)
   });
 }
 onFacility(): void {
   this.departmentId = null; this.departments.set([]);this.page.set(null);this.products.set([]);
   if(this.facilityId===null)return;
   this.busy.set(true);
   this.admission.departments(this.facilityId).subscribe({
     next: list=>{this.departments.set(list);this.busy.set(false);},
     error:e=>this.fail(e)
   });
 }
 onDepartment():void {
   this.selected.set(null);this.page.set(null);this.products.set([]);
   if(this.facilityId===null||this.departmentId===null)return;
   this.busy.set(true);this.error.set(null);
   forkJoin({
     products:this.api.products(this.facilityId,this.departmentId),
     requests:this.api.list(this.facilityId,this.departmentId,1)
   }).subscribe({
     next:v=>{this.products.set(v.products);this.page.set(v.requests);this.busy.set(false);},
     error:e=>this.fail(e)
   });
 }
 refresh(page:number):void {
   if(this.facilityId===null||this.departmentId===null)return;
   this.busy.set(true);this.error.set(null);
   this.api.list(this.facilityId,this.departmentId,page,this.statusFilter).subscribe({
     next:v=>{this.page.set(v);this.busy.set(false);},
     error:e=>this.fail(e)
   });
 }
 submit():void {
   if(this.busy()||this.facilityId===null||this.departmentId===null||
     !this.encounterId||!this.productTypeId||this.quantity<=0)return;
   this.busy.set(true);this.error.set(null);this.message.set(null);
   this.api.submit(this.facilityId,this.departmentId,{
     encounterId:this.encounterId,productTypeId:this.productTypeId,quantity:this.quantity,
     priority:this.priority,indication:this.indication.trim(),diagnosis:this.diagnosis.trim()||null,
     specialRequirements:null,hemoglobin:null,previousReaction:null
   }).subscribe({
     next:r=>{
       this.encounterId=null;this.indication='';this.diagnosis='';
       this.message.set('درخواست '+r.requestNo+' برای بررسی پزشک ثبت شد.');
       this.busy.set(false);this.refresh(1);
     },
     error:e=>this.fail(e)
   });
 }
 selectReview(request:BloodRequestView):void{
   this.selected.set(request);this.decision='Approved';this.reason='';
 }
 review():void {
   if(this.busy()||!this.selected()||this.facilityId===null||this.departmentId===null)return;
   this.busy.set(true);this.error.set(null);this.message.set(null);
   const request=this.selected()!;
   this.api.review(this.facilityId,this.departmentId,request.bloodRequestId,{
     decision:this.decision,reason:this.reason.trim()||null,rowVersion:request.rowVersion
   }).subscribe({
     next:r=>{this.selected.set(null);this.message.set('تصمیم برای '+r.requestNo+' ثبت شد.');
       this.busy.set(false);this.refresh(this.page()?.page??1);},
     error:e=>this.fail(e)
   });
 }
 private fail(e:ApiFailure):void{
   this.error.set(e?.message??'خطا در دریافت اطلاعات.');
   this.traceId.set(e?.traceId??null);this.busy.set(false);
 }
}

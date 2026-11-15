import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { forkJoin, Observable } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { AdmissionsService } from '../../core/api/admissions.service';
import { BloodRequestsService, ProductTypeOption } from '../../core/api/blood-requests.service';
import { OrgItem } from '../../core/api/administration.service';
import { BankWorkItem, BloodBankService, BloodGroupOption, InventoryUnit } from '../../core/api/blood-bank.service';
import { AuthService } from '../../core/auth/auth.service';
import { ApiFailure } from '../../core/api/api-error';
import { RequestStateComponent } from '../../shared/components/request-state.component';
import { jalaliToIso, isoToJalali } from '../../shared/jalali-date';

@Component({
  selector: 'app-bank-workspace', standalone: true,
  imports: [FormsModule, RouterLink, MatButtonModule, MatCardModule, MatFormFieldModule,
    MatInputModule, MatSelectModule, MatTableModule, RequestStateComponent],
  template: `
    <section class="heading">
      <p class="eyebrow">BLOOD BANK / INVENTORY</p>
      <h1>موجودی و آزمایش سازگاری</h1>
      <p class="muted">همه اقدامات به مرکز مجاز محدودند. نتیجه سازگاری فقط بر اساس آزمایش ثبت‌شده و تأیید مستقل نهایی می‌شود.</p>
    </section>
    <app-request-state [loading]="busy()" [error]="error()" />
    @if (message()) { <div class="notice" role="status">{{ message() }}</div> }
    <mat-card>
      <mat-card-content>
        <mat-form-field appearance="outline">
          <mat-label>مرکز درمانی</mat-label>
          <mat-select name="bankFacility" [(ngModel)]="facilityId" (ngModelChange)="load()">
            @for (f of facilities(); track f.id) { <mat-option [value]="f.id">{{ f.name }}</mat-option> }
          </mat-select>
        </mat-form-field>
      </mat-card-content>
    </mat-card>
    @if (facilityId !== null) {
      <div class="bank-grid">
        <mat-card>
          <mat-card-header><mat-card-title>ثبت واحد دریافتی</mat-card-title></mat-card-header>
          <mat-card-content>
            <form (ngSubmit)="receive()" class="form-grid">
              <mat-form-field appearance="outline">
                <mat-label>کد یکتای واحد</mat-label>
                <input matInput name="unitCode" [(ngModel)]="unitCode" required maxlength="80" />
              </mat-form-field>
              <mat-form-field appearance="outline">
                <mat-label>نوع فرآورده</mat-label>
                <mat-select name="product" [(ngModel)]="productId" required>
                  @for (p of products(); track p.id) { <mat-option [value]="p.id">{{ p.name }}</mat-option> }
                </mat-select>
              </mat-form-field>
              <mat-form-field appearance="outline">
                <mat-label>گروه خونی برچسب</mat-label>
                <mat-select name="bloodGroup" [(ngModel)]="groupId" required>
                  @for (g of groups(); track g.id) { <mat-option [value]="g.id">{{ g.code }}</mat-option> }
                </mat-select>
              </mat-form-field>
              <mat-form-field appearance="outline">
                <mat-label>تاریخ انقضا شمسی</mat-label>
                <input matInput name="expiry" [(ngModel)]="expiryJalali" required placeholder="۱۴۰۵/۰۹/۰۱" />
              </mat-form-field>
              <mat-form-field appearance="outline">
                <mat-label>محل نگهداری</mat-label>
                <input matInput name="storage" [(ngModel)]="storageLocation" maxlength="120" />
              </mat-form-field>
              <div class="actions">
                <button mat-flat-button class="primary-button" [disabled]="busy() || !productId || !groupId || !unitCode.trim()">
                  ثبت دریافت
                </button>
              </div>
            </form>
          </mat-card-content>
        </mat-card>
        <mat-card>
          <mat-card-header><mat-card-title>رزرو برای درخواست تأییدشده</mat-card-title></mat-card-header>
          <mat-card-content>
            <form (ngSubmit)="reserve()" class="form-grid">
              <mat-form-field appearance="outline">
                <mat-label>واحد خون</mat-label>
                <mat-select name="reserveUnit" [(ngModel)]="reserveUnitId" required>
                  @for (u of units(); track u.id) {
                    @if (u.status === 'Available' && !u.isQuarantined) {
                      <mat-option [value]="u.id">{{ u.unitCode }} · {{ expiryText(u.expiryDate) }}</mat-option>
                    }
                  }
                </mat-select>
              </mat-form-field>
              <mat-form-field appearance="outline">
                <mat-label>شناسه درخواست پزشک</mat-label>
                <input matInput type="number" name="reserveRequest"
                  [(ngModel)]="reserveRequestId" min="1" required />
              </mat-form-field>
              <div class="actions"><button mat-flat-button class="primary-button"
                [disabled]="busy() || !reserveUnitId || !reserveRequestId">ثبت رزرو</button></div>
            </form>
          </mat-card-content>
        </mat-card>
      </div>

      <mat-card class="table-card">
        <mat-card-header><mat-card-title>موجودی مرکز</mat-card-title></mat-card-header>
        <mat-card-content class="table-scroll">
          <table mat-table [dataSource]="units()" class="page-table">
            <ng-container matColumnDef="code"><th mat-header-cell *matHeaderCellDef>کد واحد</th>
              <td mat-cell *matCellDef="let u">{{ u.unitCode }}</td></ng-container>
            <ng-container matColumnDef="group"><th mat-header-cell *matHeaderCellDef>گروه خونی</th>
              <td mat-cell *matCellDef="let u">{{ groupName(u.bloodGroupId) }}</td></ng-container>
            <ng-container matColumnDef="expiry"><th mat-header-cell *matHeaderCellDef>انقضا</th>
              <td mat-cell *matCellDef="let u">{{ expiryText(u.expiryDate) }}</td></ng-container>
            <ng-container matColumnDef="status"><th mat-header-cell *matHeaderCellDef>وضعیت</th>
              <td mat-cell *matCellDef="let u">{{ u.status }}</td></ng-container>
            <tr mat-header-row *matHeaderRowDef="unitColumns"></tr>
            <tr mat-row *matRowDef="let row; columns: unitColumns;"></tr>
          </table>
        </mat-card-content>
      </mat-card>

      <mat-card class="table-card">
        <mat-card-header><mat-card-title>رزروها و نتایج Crossmatch</mat-card-title></mat-card-header>
        <mat-card-content class="table-scroll">
          <table mat-table [dataSource]="work()" class="page-table">
            <ng-container matColumnDef="request"><th mat-header-cell *matHeaderCellDef>درخواست</th>
              <td mat-cell *matCellDef="let row">{{ row.requestId }}</td></ng-container>
            <ng-container matColumnDef="unit"><th mat-header-cell *matHeaderCellDef>واحد</th>
              <td mat-cell *matCellDef="let row">{{ row.unitCode }}</td></ng-container>
            <ng-container matColumnDef="crossmatch"><th mat-header-cell *matHeaderCellDef>نتیجه</th>
              <td mat-cell *matCellDef="let row">
                {{ row.crossmatchStatus ?? 'ثبت‌نشده' }} {{ row.compatibilityResult ?? '' }}
              </td></ng-container>
            <ng-container matColumnDef="actions"><th mat-header-cell *matHeaderCellDef>عملیات</th>
              <td mat-cell *matCellDef="let row">
                @if (!row.crossmatchId) {
                  <button mat-button type="button" (click)="selectedReservation.set(row.reservationId)">
                    ثبت آزمایش
                  </button>
                }
                @if (row.crossmatchStatus === 'PendingReview' && canFinalize()) {
                  <button mat-button type="button" (click)="finalize(row)">بازبینی مستقل</button>
                }
              </td></ng-container>
            <tr mat-header-row *matHeaderRowDef="workColumns"></tr>
            <tr mat-row *matRowDef="let row; columns: workColumns;"></tr>
          </table>
        </mat-card-content>
      </mat-card>
      @if (selectedReservation() !== null) {
        <mat-card class="lab-card">
          <mat-card-header><mat-card-title>ثبت نتیجه آزمایش · رزرو {{ selectedReservation() }}</mat-card-title></mat-card-header>
          <mat-card-content>
            <p class="muted">نتیجه را کارشناس از آزمایش معتبر وارد می‌کند؛ سامانه سازگاری را حدس نمی‌زند.</p>
            <form (ngSubmit)="recordCrossmatch()" class="form-grid">
              <mat-form-field appearance="outline">
                <mat-label>کد آزمون</mat-label><input matInput name="testCode" [(ngModel)]="testCode" required />
              </mat-form-field>
              <mat-form-field appearance="outline">
                <mat-label>نتیجه آزمایش</mat-label>
                <input matInput name="testResult" [(ngModel)]="testResult" required />
              </mat-form-field>
              <mat-form-field appearance="outline">
                <mat-label>نظر ثبت‌شده آزمایشگاه</mat-label>
                <mat-select name="compatibilityResult" [(ngModel)]="compatibilityResult">
                  <mat-option value="Compatible">سازگار</mat-option>
                  <mat-option value="Incompatible">ناسازگار</mat-option>
                  <mat-option value="Discrepancy">نیازمند بررسی مغایرت</mat-option>
                  <mat-option value="NotApplicable">غیرقابل اعمال</mat-option>
                </mat-select>
              </mat-form-field>
              <mat-form-field appearance="outline">
                <mat-label>یادداشت</mat-label>
                <input matInput name="labNote" [(ngModel)]="labNote" maxlength="1500" />
              </mat-form-field>
              <div class="actions">
                <button mat-flat-button class="primary-button"
                  [disabled]="busy() || !testCode.trim() || !testResult.trim()">ثبت برای بازبینی</button>
                <button mat-button type="button" (click)="selectedReservation.set(null)">انصراف</button>
              </div>
            </form>
          </mat-card-content>
        </mat-card>
      }
      <div class="page-actions">
        <button mat-stroked-button type="button" (click)="refresh()">به‌روزرسانی فهرست‌ها</button>
        <a mat-button routerLink="/logistics">صدور و لجستیک</a>
        <a mat-button routerLink="/clinical/requests">بازگشت به درخواست‌های خون</a>
      </div>
    }
  `,
  styles: [`
    mat-card{margin-bottom:18px;overflow:hidden}
    mat-card-header{margin-bottom:12px}mat-card-title{font-weight:800;font-size:17px}
    .bank-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(340px,100%),1fr));gap:18px}
    .form-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(220px,100%),1fr));gap:10px 17px}
    .actions{display:flex;gap:8px;flex-wrap:wrap;align-items:center}
    .table-scroll{overflow-x:auto}.page-table{width:100%;min-width:620px}
    th.mat-mdc-header-cell{text-align:right;font-weight:700;background:#f7f9fc}
    .lab-card{border-right:4px solid #b91c35!important}
    @media(max-width:700px){.bank-grid,.form-grid{grid-template-columns:1fr}}
  `]
})
export class BankWorkspaceComponent implements OnInit {
  private readonly api=inject(BloodBankService);
  private readonly admission=inject(AdmissionsService);
  private readonly requests=inject(BloodRequestsService);
  private readonly auth=inject(AuthService);
  readonly busy=signal(false);
  readonly error=signal<string|null>(null);
  readonly message=signal<string|null>(null);
  readonly facilities=signal<OrgItem[]>([]);
  readonly units=signal<InventoryUnit[]>([]);
  readonly groups=signal<BloodGroupOption[]>([]);
  readonly products=signal<ProductTypeOption[]>([]);
  readonly work=signal<BankWorkItem[]>([]);
  readonly selectedReservation=signal<number|null>(null);
  readonly unitColumns=['code','group','expiry','status'];
  readonly workColumns=['request','unit','crossmatch','actions'];
  readonly expiryText=isoToJalali;
  facilityId:number|null=null;
  unitCode='';productId:number|null=null;groupId:number|null=null;
  expiryJalali='';storageLocation='';
  reserveUnitId:number|null=null;reserveRequestId:number|null=null;
  testCode='';testResult='';compatibilityResult='Compatible';labNote='';

  ngOnInit():void {
    this.admission.facilities().subscribe({
      next:values=>this.facilities.set(values),
      error:(e:ApiFailure)=>this.fail(e)
    });
  }
  canFinalize():boolean {
    return (this.auth.session()?.grants??[]).some(g=>
      g.permissions.includes('crossmatch.approve') &&
      (g.facilityId===this.facilityId || g.roleCode==='SYSTEM_ADMIN'));
  }
  groupName(id:number):string { return this.groups().find(x=>x.id===id)?.code??String(id); }

  load():void {
    this.work.set([]);this.units.set([]);this.products.set([]);
    this.groups.set([]);this.error.set(null);this.selectedReservation.set(null);
    if(this.facilityId===null)return;
    const f=this.facilityId;this.busy.set(true);
    forkJoin({stock:this.api.units(f),groups:this.api.groups(f),
      work:this.api.work(f),departments:this.admission.departments(f)}).subscribe({
        next:data=>{
          this.units.set(data.stock);this.groups.set(data.groups);this.work.set(data.work);
          this.busy.set(false);
          if(data.departments.length) {
            this.requests.products(f,data.departments[0].id).subscribe({
              next:items=>this.products.set(items),error:(e:ApiFailure)=>this.fail(e)
            });
          }
        },error:(e:ApiFailure)=>this.fail(e)
    });
  }
  refresh():void { this.load(); }
  receive():void {
    if(this.facilityId===null||this.productId===null||this.groupId===null)return;
    const date=jalaliToIso(this.expiryJalali);
    if(!date){this.error.set('تاریخ شمسی انقضا نامعتبر است.');return;}
    this.run(this.api.receive(this.facilityId,{unitCode:this.unitCode.trim(),
      productTypeId:this.productId,bloodGroupId:this.groupId,expiryDate:date,
      storageLocation:this.storageLocation.trim()||null}),()=>{
      this.unitCode='';this.expiryJalali='';
    });
  }
  reserve():void {
    if(this.facilityId===null||!this.reserveUnitId||!this.reserveRequestId)return;
    this.run(this.api.reserve(this.facilityId,this.reserveUnitId,this.reserveRequestId),()=>{
      this.reserveUnitId=null;this.reserveRequestId=null;
    });
  }
  recordCrossmatch():void {
    if(this.facilityId===null||this.selectedReservation()===null)return;
    this.run(this.api.crossmatch(this.facilityId,this.selectedReservation()!,
      this.compatibilityResult,this.testCode.trim(),this.testResult.trim(),this.labNote.trim()||null),()=>{
      this.selectedReservation.set(null);this.testCode='';this.testResult='';this.labNote='';
    });
  }
  finalize(row:BankWorkItem):void {
    if(this.facilityId===null||!row.crossmatchId||!row.crossmatchVersion)return;
    if(!window.confirm('بازبینی مستقل نتیجه آزمایش انجام شده و نتیجه آزمایشگاه مورد تأیید است؟'))return;
    this.run(this.api.finalize(this.facilityId,row.crossmatchId,row.crossmatchVersion),()=>{});
  }
  private run<T>(request:Observable<T>, success:()=>void):void {
    if(this.busy())return;
    this.busy.set(true);this.error.set(null);this.message.set(null);
    request.subscribe({
      next:()=>{success();this.message.set('عملیات در پایگاه داده ثبت شد.');this.load();},
      error:(e:ApiFailure)=>this.fail(e)
    });
  }
  private fail(e:ApiFailure):void {
    this.error.set(e?.message??'خطای ارتباط با سرور');
    this.busy.set(false);
  }
}

export interface HemoArea {
  readonly id: string;
  readonly title: string;
  readonly subtitle: string;
  readonly icon: string;
  readonly roleCode: string;
}

export const HEMO_AREAS: readonly HemoArea[] = [
  { id: 'admission', title: 'پذیرش', subtitle: 'پذیرش، هویت و ترخیص بیمار', icon: '📋', roleCode: 'ADMISSION' },
  { id: 'nursing', title: 'پرستاری', subtitle: 'درخواست و پایش تزریق', icon: '🩺', roleCode: 'NURSE' },
  { id: 'doctor', title: 'پزشک', subtitle: 'تأیید، پایش و تشخیص واکنش', icon: '👨‍⚕️', roleCode: 'DOCTOR' },
  { id: 'blood-bank', title: 'بانک خون', subtitle: 'موجودی، کراس‌مچ و تحویل', icon: '🩸', roleCode: 'BLOOD_TRANSFUSION_EXPERT' },
  { id: 'supervisor', title: 'سوپروایزر', subtitle: 'توزیع، زنجیره سرما و QC', icon: '🧪', roleCode: 'SUPERVISOR' },
  { id: 'equipment', title: 'تجهیزات', subtitle: 'سرویس، دما و کالیبراسیون', icon: '🔧', roleCode: 'BIOMED_ENGINEER' },
  { id: 'hemovigilance', title: 'هموویژیلانس', subtitle: 'واکنش‌ها، RCA، ممیزی و آموزش', icon: '📊', roleCode: 'HV_MANAGER' }
] as const;

export function findArea(id: string | null): HemoArea | undefined {
  return HEMO_AREAS.find(area => area.id === id);
}

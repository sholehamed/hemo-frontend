export interface HemoArea {
  readonly id: string;
  readonly title: string;
  readonly subtitle: string;
  readonly icon: string;
}

export const HEMO_AREAS: readonly HemoArea[] = [
  { id: 'admission', title: 'پذیرش', subtitle: 'پذیرش، هویت و ترخیص بیمار', icon: '📋' },
  { id: 'nursing', title: 'پرستاری', subtitle: 'درخواست و پایش تزریق', icon: '🩺' },
  { id: 'doctor', title: 'پزشک', subtitle: 'تأیید، پایش و تشخیص واکنش', icon: '👨‍⚕️' },
  { id: 'blood-bank', title: 'بانک خون', subtitle: 'موجودی، کراس‌مچ و تحویل', icon: '🩸' },
  { id: 'supervisor', title: 'سوپروایزر', subtitle: 'توزیع، زنجیره سرما و QC', icon: '🧪' },
  { id: 'equipment', title: 'تجهیزات', subtitle: 'سرویس، دما و کالیبراسیون', icon: '🔧' },
  { id: 'hemovigilance', title: 'هموویژیلانس', subtitle: 'واکنش‌ها، RCA، ممیزی و آموزش', icon: '📊' }
] as const;

export function findArea(id: string | null): HemoArea | undefined {
  return HEMO_AREAS.find(area => area.id === id);
}

import { SelectItem } from '../types';

export const KABUPATEN_LIST: SelectItem[] = [
  { title: '01 - Jembrana', value: '5101' },
  { title: '02 - Tabanan', value: '5102' },
  { title: '03 - Badung', value: '5103' },
  { title: '04 - Gianyar', value: '5104' },
  { title: '05 - Klungkung', value: '5105' },
  { title: '06 - Bangli', value: '5106' },
  { title: '07 - Karangasem', value: '5107' },
  { title: '08 - Buleleng', value: '5108' },
  { title: '71 - Denpasar', value: '5171' },
];

export interface QuickPreset {
  title: string;
  subtitle: string;
  kab: string;
  kec: string;
  desa: string;
  sls: string;
  subsls?: string;
}

export const QUICK_PRESETS: QuickPreset[] = [
  {
    title: 'Gilimanuk - Penginuman',
    subtitle: 'Kab. Jembrana',
    kab: '5101',
    kec: '5101010',
    desa: '5101010001',
    sls: '51010100010001',
  },
  {
    title: 'Sanur Kauh - Penopasan',
    subtitle: 'Kota Denpasar',
    kab: '5171',
    kec: '5171010',
    desa: '5171010003',
    sls: '51710100030001',
  },
  {
    title: 'Kuta - Pering',
    subtitle: 'Kab. Badung',
    kab: '5103',
    kec: '5103010',
    desa: '5103010002',
    sls: '51030100020001',
  }
];

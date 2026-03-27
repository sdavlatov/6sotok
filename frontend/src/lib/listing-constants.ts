import { Zap, Flame, Droplets, Waves, Route, ShieldCheck, Scissors } from 'lucide-react';

// Единый список категорий — используется на главной и в каталоге
export const LAND_CATEGORIES = ['ИЖС', 'МЖС', 'ЛПХ', 'Коммерция', 'Сельхоз', 'Дача'];

export const UTILITIES = [
  { key: 'hasElectricity', icon: Zap,      label: 'Свет',        active: 'border-amber-300 bg-amber-50 text-amber-700' },
  { key: 'hasGas',         icon: Flame,    label: 'Газ',         active: 'border-blue-300 bg-blue-50 text-blue-700' },
  { key: 'hasWater',       icon: Droplets, label: 'Вода',        active: 'border-cyan-300 bg-cyan-50 text-cyan-700' },
  { key: 'hasSewer',       icon: Waves,    label: 'Канализация', active: 'border-slate-300 bg-slate-50 text-slate-700' },
  { key: 'hasRoadAccess',  icon: Route,    label: 'Дорога',      active: 'border-stone-300 bg-stone-100 text-stone-700' },
] as const;

export const LEGAL_FILTERS = [
  { key: 'isPledged',   icon: ShieldCheck, label: 'Без залога',    active: 'border-green-300 bg-green-50 text-green-700' },
  { key: 'isOnRedLine', icon: ShieldCheck, label: 'Без кр. линии', active: 'border-red-300 bg-red-50 text-red-700' },
  { key: 'isDivisible', icon: Scissors,    label: 'Делимый',       active: 'border-purple-300 bg-purple-50 text-purple-700' },
] as const;

export type FilterKey = 'hasElectricity' | 'hasGas' | 'hasWater' | 'hasSewer' | 'hasRoadAccess' | 'isPledged' | 'isOnRedLine' | 'isDivisible';

import type { LandType } from '@/types/listing';

// ── Utility dot colors (design system spec) ──────────────────────────────────
export const UTILITY_DOTS = [
  { key: 'hasElectricity', label: 'Свет',    color: '#F4B400' },
  { key: 'hasGas',         label: 'Газ',      color: '#E97B27' },
  { key: 'hasWater',       label: 'Вода',     color: '#2196F3' },
  { key: 'hasRoadAccess',  label: 'Дорога',   color: '#9E9E9E' },
  { key: 'hasStateAct',    label: 'Акт',      color: '#066F36' },
] as const;

// ── Land-type → plot placeholder class ───────────────────────────────────────
export function plotClass(landType?: LandType | string | null): string {
  switch (landType) {
    case 'ИЖС':
    case 'МЖС':         return 'plot-ijs';
    case 'Сельхоз':
    case 'КХ':          return 'plot-soil';
    case 'ЛПХ':         return 'plot-water';
    case 'Дача':        return 'plot-grass';
    case 'Промбаза':
    case 'Коммерция':   return 'plot-rock';
    case 'Рекреация':   return 'plot-alpine';
    default:            return 'plot-ijs';
  }
}

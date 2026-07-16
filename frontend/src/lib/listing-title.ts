/**
 * Автогенерация заголовка объявления — правило продукта (заполняем МЫ, не клиент).
 *
 * Старое правило `{тип} · {площадь} сот · {локация}` было длинным и дублировало
 * строку «тип · локация», которая и так показывается в карточке.
 *
 * Новое: компактный описательный заголовок «{рельеф}{площадь} соток{особенность}»,
 * например: «Ровный 6 соток с актом», «12 соток у воды», «Угловой 18 соток с видом на горы».
 * Одна самая заметная особенность (по приоритету), без повтора города — город показывает
 * отдельная строка «тип · локация».
 */

export interface TitleFields {
  landType?: string;
  purpose?: string;
  area?: number;
  reliefType?: string;
  plotShape?: string;
  hasStateAct?: boolean;
  hasElectricity?: boolean;
  hasWater?: boolean;
  hasGas?: boolean;
  hasSewer?: boolean;
  buildingArea?: number;
  locationType?: string[];
}

function pluralSotka(n: number): string {
  const m10 = n % 10, m100 = n % 100;
  if (m10 === 1 && m100 !== 11) return 'сотка';
  if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return 'сотки';
  return 'соток';
}

function fmtArea(area: number): string {
  // «6 соток», «18.4 сотки»
  const rounded = Math.round(area);
  const num = Number.isInteger(area) ? String(area) : area.toFixed(1).replace(/\.0$/, '');
  return `${num} ${pluralSotka(rounded)}`;
}

export function generateTitle(f: TitleFields): string {
  if (!f.area || f.area <= 0) {
    // без площади — деградируем к типу/назначению
    return f.landType || f.purpose || 'Земельный участок';
  }

  // префикс по форме / рельефу (одно слово)
  let prefix = '';
  const shape = (f.plotShape || '').toLowerCase();
  if (shape.includes('угл')) prefix = 'Угловой ';
  else if (f.reliefType === 'Ровный') prefix = 'Ровный ';

  // одна особенность по приоритету
  const lt = f.locationType || [];
  let feat = '';
  if (lt.includes('water')) feat = ' у воды';
  else if (lt.includes('foothills')) feat = ' с видом на горы';
  else if (f.buildingArea && f.buildingArea > 0) feat = ' с домом';
  else if (f.hasElectricity && f.hasWater && f.hasGas) feat = ' со всеми коммуникациями';
  else if (f.hasStateAct) feat = ' с актом';
  else if (f.landType === 'ИЖС' || f.purpose === 'ИЖС') feat = ' под ИЖС';
  else if (lt.includes('highway')) feat = ' у трассы';

  return `${prefix}${fmtArea(f.area)}${feat}`.trim();
}

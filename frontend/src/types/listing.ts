export type LandType = 'ИЖС' | 'Дача' | 'Коммерция' | 'Сельхоз';
export type Purpose = 'ИЖС' | 'ЛПХ' | 'Коммерция' | 'Сельхоз';
export type OwnershipType = 'Частная собственность' | 'Аренда';
export type ReliefType = 'Ровный' | 'Под уклон';

export interface ListingSeller {
  name: string;
  phone: string;
  isAgency: boolean;
  registerDate: string;
  avatar?: string;
  hasWhatsApp?: boolean;
}

export interface Listing {
  id: string;
  slug: string;
  title: string;
  price: number;
  area: number; // in sotok
  landType: LandType;
  location: string;
  image: string; // main
  images?: string[]; // gallery
  communications: string[]; // badges
  description?: string;
  seller?: ListingSeller;
  createdAt: string;

  // Юридические параметры
  cadastralNumber?: string;
  isPledged?: boolean;
  hasEncumbrances?: boolean;
  hasStateAct?: boolean;
  ownershipType?: OwnershipType;
  isDivisible?: boolean;
  isOnRedLine?: boolean;
  landCategory?: string;

  // Коммуникации (строгие флаги)
  hasElectricity?: boolean;
  hasGas?: boolean;
  hasWater?: boolean;
  hasSewer?: boolean;
  hasRoadAccess?: boolean;

  // Геометрия участка
  reliefType?: ReliefType;
  plotShape?: string;
  frontWidth?: number; // meters
  depth?: number; // meters

  // Градостроительные параметры
  purpose?: Purpose;
  canChangePurpose?: boolean;

  isNegotiable?: boolean;
  locationType?: string[];

  // Координаты для карты
  lat?: number;
  lng?: number;
}

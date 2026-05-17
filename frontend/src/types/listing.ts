export type LandType = 'ИЖС' | 'Дача' | 'Коммерция' | 'Сельхоз' | 'МЖС' | 'ЛПХ' | 'КХ' | 'Промбаза' | 'Рекреация';
export type DealType = 'sale' | 'rent';
export type Purpose = 'ИЖС' | 'ЛПХ' | 'Коммерция' | 'Сельхоз';
export type OwnershipType = 'Частная собственность' | 'Аренда';
export type ReliefType = 'Ровный' | 'Под уклон';
export type ListingCategory = 'land' | 'business';
export type BusinessType = 'cafe' | 'shop' | 'office' | 'warehouse' | 'production' | 'service' | 'hotel' | 'land' | 'other';

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
  images?: string[]; // gallery (photos only)
  videos?: string[]; // gallery (videos only)
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
  plotBoundary?: string; // JSON array of {lat,lng}
  frontWidth?: number;
  depth?: number;
  isNegotiable?: boolean;

  // Градостроительные параметры
  purpose?: Purpose;
  canChangePurpose?: boolean;

  dealType?: DealType;
  views?: number;
  locationType?: string[];
  listingCategory?: ListingCategory;
  businessType?: BusinessType;
  buildingArea?: number;
  address?: string;

  // Бизнес: характеристики объекта
  floor?: number;
  totalFloors?: number;
  ceilingHeight?: number;
  yearBuilt?: number;
  condition?: 'renovated' | 'good' | 'needs_repair' | 'shell';
  electricPower?: number;
  hasParking?: boolean;
  hasSeparateEntrance?: boolean;
  isOperational?: boolean;
  isTenanted?: boolean;
  monthlyRevenue?: number;
  paybackMonths?: number;

  // Координаты для карты
  lat?: number;
  lng?: number;
}

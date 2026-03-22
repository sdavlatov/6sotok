export type LandType = 'ИЖС' | 'Дача' | 'Коммерция' | 'Сельхоз';

export interface ListingSeller {
  name: string;
  phone: string;
  isAgency: boolean;
  registerDate: string;
  avatar?: string;
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
}

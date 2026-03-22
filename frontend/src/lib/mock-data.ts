import { Listing } from '@/types/listing';

export const mockListings: Listing[] = [
  {
    id: '1',
    slug: 'uchastok-igs-almaty-10-sotok',
    title: 'Участок ИЖС правильной формы в элитном районе',
    price: 15000000,
    area: 10,
    landType: 'ИЖС',
    location: 'Алматы, Медеуский район',
    image: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?q=80&w=1000&auto=format&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1500382017468-9049fed747ef?q=80&w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1629196914548-5214f2e2c2e5?q=80&w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1444858291040-58f756a3bdd6?q=80&w=1000&auto=format&fit=crop'
    ],
    communications: ['Свет', 'Вода', 'Газ', 'Септик', 'Интернет оптика'],
    description: 'Продается ровный участок прямоугольной формы 10 соток в экологически чистом и элитном районе Алматы. Идеально под строительство капитального загородного дома. \n\nВсе коммуникации проходят строго по границе участка (подземный газопровод, оптоволокно, городская канализация). Асфальтированный подъезд, солидное соседство, шлагбаум на въезде в улицу. До центра города 15 минут езды без пробок. Документы кристально чистые, не в залоге, ИЖС.',
    seller: {
      name: 'Best Realty KZ',
      phone: '+7 701 123 45 67',
      isAgency: true,
      registerDate: '2021 года'
    },
    createdAt: new Date().toISOString(),
  },
  {
    id: '2',
    slug: 'dacha-kaskelen-6-sotok',
    title: 'Дачный участок с плодоносящим садом и шикарным видом',
    price: 4500000,
    area: 6,
    landType: 'Дача',
    location: 'Алматинская обл, Каскелен',
    image: 'https://images.unsplash.com/photo-1524338198850-8b2fa59a8c08?q=80&w=1000&auto=format&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1524338198850-8b2fa59a8c08?q=80&w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1592688008801-6c1e592cff82?q=80&w=1000&auto=format&fit=crop'
    ],
    communications: ['Свет', 'Поливная вода (по расписанию)', 'Скважина на 30м'],
    description: 'Продается дача с потрясающим панорамным видом на предгорья Алатау. Размер участка 6 соток. На участке уже растут 15 плодоносящих яблонь (сорт Апорт, Лимонка), орех и вишня.\n\nСвет заведен, вода поливная + есть своя скважина для круглогодичного обеспечения. Скромный дачный домик под снос или временное проживание строителей. Место тихое и спокойное.',
    seller: {
      name: 'Анна',
      phone: '+7 775 987 65 43',
      isAgency: false,
      registerDate: '2023 года'
    },
    createdAt: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: '3',
    slug: 'commerce-astana-50-sotok',
    title: 'Участок вдоль трассы под строительство СТО и Автомойки',
    price: 120000000,
    area: 50,
    landType: 'Коммерция',
    location: 'Астана, Есильский район',
    image: 'https://images.unsplash.com/photo-1513584684374-8bab748fbf90?q=80&w=1000&auto=format&fit=crop',
    images: [ 'https://images.unsplash.com/photo-1513584684374-8bab748fbf90?q=80&w=1000&auto=format&fit=crop' ],
    communications: ['Центральная вода', 'Свет 380В', 'Канализация', 'Широкополосный интернет'],
    description: 'Коммерческий участок 50 соток вдоль оживленной трассы.\nЦелевое назначение - Обслуживание автотранспорта (СТО, мойка, торговля автозапчастями). Огромный автомобильный трафик. Есть согласованный проект въездной и выездной группы. Городские коммуникации уже подведены.',
    seller: {
      name: 'CommercialInvest',
      phone: '+7 707 555 11 22',
      isAgency: true,
      registerDate: '2019 года'
    },
    createdAt: new Date(Date.now() - 172800000).toISOString(),
  },
  {
    id: '4',
    slug: 'selhoz-shymkent-500-sotok',
    title: 'Земля крестьянского хозяйства для посевов',
    price: 25000000,
    area: 500,
    landType: 'Сельхоз',
    location: 'Туркестанская обл, Сайрамский район',
    image: 'https://images.unsplash.com/photo-1500076656116-558758c991c1?q=80&w=1000&auto=format&fit=crop',
    images: [ 'https://images.unsplash.com/photo-1500076656116-558758c991c1?q=80&w=1000&auto=format&fit=crop' ],
    communications: ['Скважина', 'Электричество Трансформатор (100кВт)'],
    description: 'Массив площадью 5 Гектар (500 соток) для ведения сельского хозяйства. Земля отдохнувшая, последние 2 года засеивалась люцерной. Имеется большой запас воды (насосная скважина, дебит отличный), стоит собственный ТП.\nГотово для фермера.',
    seller: {
      name: 'Ерлан',
      phone: '+7 747 111 00 99',
      isAgency: false,
      registerDate: '2024 года'
    },
    createdAt: new Date(Date.now() - 259200000).toISOString(),
  }
];

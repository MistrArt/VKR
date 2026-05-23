import { MockItem } from './mockData';

const DISTRICTS = ['Центральный', 'Октябрьский', 'Ленинский', 'Чкаловский', 'ВИЗ', 'Академический', 'Уралмаш'];

// Rich gallery images from Unsplash to offer real galleries
const PLACE_IMAGES = [
  "https://images.unsplash.com/photo-1563906267088-b029e7101114?q=80&w=800",
  "https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=800",
  "https://images.unsplash.com/photo-1527631746610-bca00a040d60?q=80&w=800"
];

const REST_IMAGES = [
  "https://images.unsplash.com/photo-1552566626-52f8b828add9?q=80&w=800",
  "https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=800",
  "https://images.unsplash.com/photo-1514933651103-005eec06c04b?q=80&w=800"
];

const EXCURSION_IMAGES = [
  "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?q=80&w=800",
  "https://images.unsplash.com/photo-1501785888041-af3ef285b470?q=80&w=800",
  "https://images.unsplash.com/photo-1488646953014-85cb44e25828?q=80&w=800"
];

export function enrichItem(item: MockItem): MockItem {
  const enriched = { ...item };

  // 1. District association (with central focus)
  if (!enriched.district) {
    if (['1', '3', '4', '5', '6', '14', '15', '18'].includes(enriched.id)) {
      enriched.district = 'Центральный';
    } else if (['2', '13'].includes(enriched.id)) {
      enriched.district = 'Ленинский';
    } else if (['7', '8', '9', '11', '17'].includes(enriched.id)) {
      enriched.district = 'Октябрьский';
    } else if (['10'].includes(enriched.id)) {
      enriched.district = 'Чкаловский';
    } else if (['12'].includes(enriched.id)) {
      enriched.district = 'ВИЗ';
    } else if (['16'].includes(enriched.id)) {
      enriched.district = 'Октябрьский';
    } else {
      const hash = enriched.title.length % DISTRICTS.length;
      enriched.district = DISTRICTS[hash];
    }
  }

  // 2. Realistic Addresses in Yekaterinburg
  if (!enriched.location) {
    if (enriched.id === '1') enriched.location = `${enriched.district} район, р. Исеть, просп. Ленина`;
    else if (enriched.id === '2') enriched.location = `${enriched.district} район, ул. Бориса Ельцина, 3`;
    else if (enriched.id === '3') enriched.location = `${enriched.district} район, ул. Царская, 10`;
    else if (enriched.id === '4') enriched.location = `${enriched.district} район, Площадь 1905 года, 2`;
    else if (enriched.id === '5') enriched.location = `${enriched.district} район, ул. Попова, 5`;
    else if (enriched.id === '7') enriched.location = `${enriched.district} район, ул. Толмачева, 23`;
    else if (enriched.id === '8') enriched.location = `${enriched.district} район, просп. Ленина, 69`;
    else if (enriched.id === '9') enriched.location = `${enriched.district} район, ул. Малышева, 51`;
    else if (enriched.id === '10') enriched.location = `${enriched.district} район, ул. 8 Марта, 149`;
    else if (enriched.id === '11') enriched.location = `${enriched.district} район, ул. Мамина-Сибиряка, 12`;
    else if (enriched.id === '12') enriched.location = `${enriched.district} район, ул. Мира, 19`;
    else if (enriched.id === '13') enriched.location = `${enriched.district} район, ул. 8 Марта, 46`;
    else if (enriched.id === '14') enriched.location = `${enriched.district} район, ул. Вайнера, 11`;
    else if (enriched.id === '15') enriched.location = `${enriched.district} район, ул. Ленина, 69/10`;
    else if (enriched.id === '16') enriched.location = `${enriched.district} район, лесопарк Шарташские каменные палатки`;
    else if (enriched.id === '17') enriched.location = `${enriched.district} район, ул. Чернышевского, 14`;
    else if (enriched.id === '18') enriched.location = `${enriched.district} район, ул. Воеводина, 5`;
    else enriched.location = `${enriched.district} район, ул. Малышева, ${10 + (enriched.id.charCodeAt(0) % 90)}`;
  }

  // 3. Reviews & ratings count
  if (!enriched.reviewsCount) {
    enriched.reviewsCount = 15 + (enriched.id.charCodeAt(0) * 11) % 185;
  }

  // 4. Working schedule
  if (enriched.isOpenNow === undefined) {
    // True for even lengths, keeps state dynamic
    enriched.isOpenNow = (enriched.title.length % 2 === 0);
  }

  if (!enriched.workingHours) {
    if (enriched.category === 'restaurants') {
      enriched.workingHours = 'Ежедневно 12:00 – 00:00';
    } else if (enriched.category === 'places') {
      if (['2', '15', '18'].includes(enriched.id)) {
        enriched.workingHours = 'Вт-Вс 10:00 – 21:00, Пн – выходной';
      } else {
        enriched.workingHours = 'Ежедневно 09:00 – 22:00';
      }
    } else {
      enriched.workingHours = 'По записи / расписанию';
    }
  }

  // 5. Contacts phone/website
  if (!enriched.contacts) {
    enriched.contacts = {
      phone: `+7 (343) 293-${10 + (enriched.title.length % 89)}-${40 + (enriched.id.charCodeAt(0) % 55)}`,
      website: enriched.id === '2' ? 'https://yeltsin.ru' : 
               enriched.id === '9' ? 'https://visotsky-ekb.ru' : 
               'https://ural-visitekb.ru'
    };
  }

  // 6. Photo gallery 
  if (!enriched.images) {
    const galleryBase = enriched.category === 'places' ? PLACE_IMAGES : 
                        enriched.category === 'restaurants' ? REST_IMAGES : 
                        EXCURSION_IMAGES;
    enriched.images = [enriched.image, galleryBase[0], galleryBase[1], galleryBase[2]];
  }

  // 7. Age suitability
  if (!enriched.suitableFor) {
    const categoriesList = [
      ['С детьми', 'Для молодёжи', 'Универсально'],
      ['С детьми', 'Для пожилых', 'Универсально'],
      ['Для молодёжи', 'Универсально'],
      ['Для пожилых', 'Универсально']
    ];
    enriched.suitableFor = categoriesList[enriched.title.length % categoriesList.length];
  }

  // 8. Expanded multiline description
  if (!enriched.fullDescription) {
    enriched.fullDescription = `${enriched.description} Объект является известной точкой притяжения, предлагающей комфортные условия и увлекательный уральский колорит. Отлично подходит как для индивидуальных ценителей качественного контента, так и для весёлых дружеских или семейных поездок.`;
  }

  // Category specific properties
  if (enriched.category === 'places') {
    if (!enriched.theme) {
      const themes = [
        ['История и культура', 'Архитектура'],
        ['Природа и парки'],
        ['Уличное искусство и граффити'],
        ['Советское наследие'],
        ['Промышленный туризм']
      ];
      enriched.theme = themes[enriched.title.length % themes.length];
    }
    if (!enriched.recommendTime) {
      const times = ['до 30 мин', '30–60 мин', '1–2 часа', 'более 2 часов'];
      enriched.recommendTime = times[enriched.title.length % times.length];
    }
  }

  if (enriched.category === 'restaurants') {
    if (!enriched.cuisines) {
      const cuisinesList = [
        ['Русская', 'Европейская'],
        ['Грузинская', 'Азиатская'],
        ['Итальянская', 'Смешанная'],
        ['Японская', 'Вегетарианская']
      ];
      enriched.cuisines = cuisinesList[enriched.title.length % cuisinesList.length];
    }
    if (!enriched.averageCheck) {
      enriched.averageCheck = enriched.price || (800 + (enriched.title.length % 5) * 600);
    }
    if (!enriched.menu) {
      enriched.menu = [
        { name: 'Уральские пельмени ручной лепки', price: 460 },
        { name: 'Борщ с копченой грудинкой и гренками', price: 380 },
        { name: 'Черемуховый торт по старинному рецепту', price: 290 },
        { name: 'Лесной чай с травами и ягодами', price: 190 }
      ];
    }
    if (!enriched.features) {
      const featuresOptions = ['Wi-Fi', 'Живая музыка', 'Видовая терраса / панорамный вид', 'Летняя веранда', 'Подходит для детей'];
      enriched.features = [
        featuresOptions[enriched.title.length % featuresOptions.length],
        featuresOptions[(enriched.title.length + 2) % featuresOptions.length]
      ];
    }
  }

  if (enriched.category === 'excursions') {
    if (!enriched.tourOperator) {
      enriched.tourOperator = enriched.id === '5' ? 'Урал-Арт Студия (гид Анна)' : 'Екатеринбургское бюро экскурсий (гид Алексей)';
    }
    if (!enriched.duration) {
      const durations = ['1–2 часа', '3–4 часа', '5–8 часов', 'полный день'];
      enriched.duration = durations[enriched.title.length % durations.length];
    }
    if (!enriched.dates) {
      enriched.dates = ['Ближайшие: 26, 30, 31 мая в 12:00', 'Будние: Вт, Чт в 19:00', 'Выходные: Сб, Вс в 11:00'];
    }
    if (enriched.freeSlots === undefined) {
      enriched.freeSlots = 5 + (enriched.title.length % 12);
    }
    if (!enriched.routePoints) {
      enriched.routePoints = ['Точка сбора', 'Историческая часть', 'Панорамная локация', 'Финальная точка маршрута'];
    }
    if (!enriched.included) {
      enriched.included = ['Услуги гида-исследователя', 'Входные билеты', 'Радиогид на русском языке', 'Мини-путеводитель'];
    }
    if (!enriched.language) {
      enriched.language = (enriched.title.length % 3 === 0) ? 'Русский, Английский' : 'Русский';
    }
    if (!enriched.limitations) {
      enriched.limitations = 'Без ограничений по здоровью, пеший ход около 3 км';
    }
  }

  // 9. Standard verified user reviews
  if (!enriched.reviews) {
    enriched.reviews = [
      {
        author: "Евгений Рогов",
        rating: Math.floor(enriched.rating),
        text: "Очень понравилось! Идеально спланированная локация и комфортный персонал. Обязательно порекомендую всем друзьям и вернусь сюда снова летом.",
        date: "12.05.2026",
        avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=150"
      },
      {
        author: "Елена Савельева",
        rating: 5,
        text: "Шикарное место, оставляет только самые яркие эмоции! Все продумано до мелочей. Рекомендую уделить посещению достаточно времени.",
        date: "08.05.2026",
        avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=150"
      }
    ];
  }

  return enriched;
}

// db/seed.ts
import { db } from './index';
import {
  products, productCards, productMedia,
  accessoriesData, partsData,
  pricing, fulfillment, moderation,
} from './schema';

async function seed() {
  console.log('Seeding database...');

  // --- 5 Accessories ---

  // 1. Floor mats
  const [mat] = await db.insert(products).values({
    sku: 'ACC-001',
    barcode: '4607812345001',
    productProfile: 'accessories',
    nameRu: 'Автомобильные коврики в салон',
    nameUz: 'Avtomobil salon gilamchalari',
  }).returning();

  await db.insert(productCards).values({
    productId: mat.id,
    titleRu: 'Коврики автомобильные в салон универсальные ЭВА',
    titleUz: 'Universal EVA avtomobil salon gilamchalari',
    descriptionRu: 'Высококачественные коврики из ЭВА материала. Защищают пол от грязи и влаги. Легко моются.',
    descriptionUz: 'EVA materialidan tayyorlangan yuqori sifatli gilamchalar. Polni kir va namlikdan himoya qiladi.',
    shortDescRu: 'ЭВА коврики для салона автомобиля',
    shortDescUz: 'Avtomobil saloni uchun EVA gilamchalar',
    propertiesRu: JSON.stringify(['Материал: ЭВА', 'Тип: универсальные', 'Цвет: черный']),
    propertiesUz: JSON.stringify(['Material: EVA', 'Turi: universal', 'Rangi: qora']),
    filterProperties: JSON.stringify([{ name_ru: 'Материал', value_ru: 'ЭВА', name_uz: 'Material', value_uz: 'EVA' }]),
    brand: 'AutoStyle',
    vatPct: 0,
    weightKg: 1.2,
    dimLengthCm: 60,
    dimWidthCm: 40,
    dimHeightCm: 3,
  });

  await db.insert(productMedia).values([
    { productId: mat.id, url: 'https://picsum.photos/seed/mat1/1080/1440', mediaType: 'photo', widthPx: 1080, heightPx: 1440, sizeBytes: 1500000, isPrimary: true, orderIndex: 0, isCompliant: true },
    { productId: mat.id, url: 'https://picsum.photos/seed/mat2/1080/1440', mediaType: 'photo', widthPx: 1080, heightPx: 1440, sizeBytes: 1400000, isPrimary: false, orderIndex: 1, isCompliant: true },
    { productId: mat.id, url: 'https://picsum.photos/seed/mat3/1080/1440', mediaType: 'photo', widthPx: 1080, heightPx: 1440, sizeBytes: 1300000, isPrimary: false, orderIndex: 2, isCompliant: true },
  ]);

  await db.insert(accessoriesData).values({
    productId: mat.id,
    universalFit: true,
    useCaseRu: 'Защита напольного покрытия от грязи, влаги и износа',
    useCaseUz: 'Polni kir, namlik va aşınmadan himoya qilish',
    materialRu: 'ЭВА (этиленвинилацетат)',
    materialUz: 'EVA (etilen-vinil asetat)',
    colorOptions: JSON.stringify(['Черный', 'Серый', 'Бежевый']),
  });

  await db.insert(pricing).values({ productId: mat.id, costPrice: 45000, sellingPrice: 89000, marginPct: 49.4, competitorPrice: 95000 });
  await db.insert(fulfillment).values({ productId: mat.id, scheme: 'FBO', stockQuantity: 45, fboTurnoverDays: 32 });
  await db.insert(moderation).values({ productId: mat.id, status: 'on_sale' });

  // 2. Car polish
  const [polish] = await db.insert(products).values({
    sku: 'ACC-002',
    barcode: '4607812345002',
    productProfile: 'accessories',
    nameRu: 'Полироль для кузова автомобиля',
    nameUz: 'Avtomobil kuzovi uchun polrol',
  }).returning();

  await db.insert(productCards).values({
    productId: polish.id,
    titleRu: 'Полироль для кузова защитная с карнаубским воском 500мл',
    titleUz: 'Karnuba mumli himoya polroli, kuzov uchun 500ml',
    descriptionRu: 'Защитная полироль с натуральным карнаубским воском. Создаёт защитный слой на 3 месяца.',
    descriptionUz: 'Tabiiy karnuba mumi bilan himoya polroli. 3 oyga himoya qatlami yaratadi.',
    shortDescRu: 'Полироль с воском 500мл',
    shortDescUz: 'Mumli polrol 500ml',
    propertiesRu: JSON.stringify(['Объём: 500 мл', 'Тип: защитная', 'Состав: карнаубский воск']),
    propertiesUz: JSON.stringify(['Hajmi: 500 ml', 'Turi: himoya', 'Tarkibi: karnuba mumi']),
    filterProperties: JSON.stringify([{ name_ru: 'Объём', value_ru: '500 мл' }]),
    brand: 'ChemPro',
    vatPct: 10,
    weightKg: 0.55,
    dimLengthCm: 8,
    dimWidthCm: 8,
    dimHeightCm: 20,
  });

  await db.insert(productMedia).values([
    { productId: polish.id, url: 'https://picsum.photos/seed/pol1/1080/1440', mediaType: 'photo', widthPx: 1080, heightPx: 1440, sizeBytes: 1200000, isPrimary: true, orderIndex: 0, isCompliant: true },
    { productId: polish.id, url: 'https://picsum.photos/seed/pol2/1080/1440', mediaType: 'photo', widthPx: 1080, heightPx: 1440, sizeBytes: 1100000, isPrimary: false, orderIndex: 1, isCompliant: true },
    { productId: polish.id, url: 'https://picsum.photos/seed/pol3/1080/1440', mediaType: 'photo', widthPx: 1080, heightPx: 1440, sizeBytes: 1000000, isPrimary: false, orderIndex: 2, isCompliant: true },
  ]);

  await db.insert(accessoriesData).values({
    productId: polish.id,
    useCaseRu: 'Полировка и защита лакокрасочного покрытия кузова',
    useCaseUz: 'Kuzov bo\'yoqli qoplamani sayqallash va himoya qilish',
    materialRu: 'Карнаубский воск, силиконы',
    volumeMl: 500,
    applicationMethodRu: 'Нанести на чистую поверхность, растереть круговыми движениями, полировать после высыхания',
    applicationMethodUz: 'Toza yuzaga surting, doira harakatlar bilan ishlang, qurigach sayqalang',
  });

  await db.insert(pricing).values({ productId: polish.id, costPrice: 22000, sellingPrice: 49000, marginPct: 55.1, competitorPrice: 52000 });
  await db.insert(fulfillment).values({ productId: polish.id, scheme: 'FBO', stockQuantity: 120, fboTurnoverDays: 18 });
  await db.insert(moderation).values({ productId: polish.id, status: 'on_sale' });

  // 3. Seat cover — incomplete card (for testing low score)
  const [cover] = await db.insert(products).values({
    sku: 'ACC-003',
    barcode: '4607812345003',
    productProfile: 'accessories',
    nameRu: 'Чехлы на сиденья',
    nameUz: 'O\'rindiq qoplamalari',
  }).returning();

  await db.insert(productCards).values({
    productId: cover.id,
    titleRu: 'Чехлы на сиденья автомобиля',
    titleUz: 'Avtomobil o\'rindig\'i qoplamalari',
    brand: 'AutoCover',
  });

  await db.insert(productMedia).values([
    { productId: cover.id, url: 'https://picsum.photos/seed/cov1/1080/1440', mediaType: 'photo', widthPx: 1080, heightPx: 1440, sizeBytes: 1000000, isPrimary: true, orderIndex: 0, isCompliant: true },
  ]);

  await db.insert(pricing).values({ productId: cover.id, sellingPrice: 120000 });
  await db.insert(fulfillment).values({ productId: cover.id, scheme: 'FBS', stockQuantity: 8 });
  await db.insert(moderation).values({ productId: cover.id, status: 'draft' });

  // 4. Dash cam
  const [cam] = await db.insert(products).values({
    sku: 'ACC-004',
    barcode: '4607812345004',
    productProfile: 'accessories',
    nameRu: 'Видеорегистратор автомобильный',
    nameUz: 'Avtomobil videokamerasi',
  }).returning();

  await db.insert(productCards).values({
    productId: cam.id,
    titleRu: 'Видеорегистратор Full HD 1080P с ночным видением',
    titleUz: 'Tungi ko\'rishli Full HD 1080P avtoregistrator',
    descriptionRu: 'Компактный видеорегистратор с матрицей Sony. Угол обзора 170°. Поддержка карт до 128ГБ.',
    descriptionUz: 'Sony matritsali ixcham videoregistrator. Ko\'rish burchagi 170°. 128GB kartalarni qo\'llab-quvvatlaydi.',
    shortDescRu: 'Видеорегистратор Full HD с ночным видением',
    shortDescUz: 'Tungi ko\'rishli Full HD videoregistrator',
    propertiesRu: JSON.stringify(['Разрешение: Full HD 1080P', 'Угол обзора: 170°', 'Ночное видение: есть']),
    propertiesUz: JSON.stringify(['Ruxsat: Full HD 1080P', 'Ko\'rish burchagi: 170°', 'Tungi ko\'rish: bor']),
    filterProperties: JSON.stringify([{ name_ru: 'Разрешение', value_ru: 'Full HD' }]),
    brand: 'DriveCam',
    vatPct: 20,
    weightKg: 0.09,
    dimLengthCm: 7,
    dimWidthCm: 5,
    dimHeightCm: 3,
  });

  await db.insert(productMedia).values([
    { productId: cam.id, url: 'https://picsum.photos/seed/cam1/1080/1440', mediaType: 'photo', widthPx: 1080, heightPx: 1440, sizeBytes: 900000, isPrimary: true, orderIndex: 0, isCompliant: true },
    { productId: cam.id, url: 'https://picsum.photos/seed/cam2/1080/1440', mediaType: 'photo', widthPx: 1080, heightPx: 1440, sizeBytes: 850000, isPrimary: false, orderIndex: 1, isCompliant: true },
    { productId: cam.id, url: 'https://picsum.photos/seed/cam3/1080/1440', mediaType: 'photo', widthPx: 1080, heightPx: 1440, sizeBytes: 800000, isPrimary: false, orderIndex: 2, isCompliant: true },
    { productId: cam.id, url: 'https://picsum.photos/seed/camv/mp4', mediaType: 'video', sizeBytes: 4000000, isPrimary: false, orderIndex: 3, isCompliant: true },
  ]);

  await db.insert(accessoriesData).values({
    productId: cam.id,
    useCaseRu: 'Фиксация дорожной обстановки, доказательная база при ДТП',
    useCaseUz: 'Yo\'l vaziyatini qayd etish, yo\'l-transport hodisasida dalil bazasi',
  });

  await db.insert(pricing).values({ productId: cam.id, costPrice: 180000, sellingPrice: 349000, marginPct: 48.4, competitorPrice: 380000 });
  await db.insert(fulfillment).values({ productId: cam.id, scheme: 'FBO', stockQuantity: 22, fboTurnoverDays: 48 });
  await db.insert(moderation).values({ productId: cam.id, status: 'on_sale' });

  // 5. Car air freshener
  const [fresh] = await db.insert(products).values({
    sku: 'ACC-005',
    barcode: '4607812345005',
    productProfile: 'accessories',
    nameRu: 'Ароматизатор для автомобиля',
    nameUz: 'Avtomobil uchun xushbo\'y',
  }).returning();

  await db.insert(productCards).values({
    productId: fresh.id,
    titleRu: 'Ароматизатор подвесной для автомобиля "Кофе" 5мл',
    titleUz: 'Avtomobil uchun osilma xushbo\'y "Qahva" 5ml',
    descriptionRu: 'Натуральный аромат кофе. Нейтрализует запахи. Срок действия 30 дней.',
    descriptionUz: 'Tabiiy qahva aromati. Hidlarni zararsizlantiradi. Amal qilish muddati 30 kun.',
    shortDescRu: 'Подвесной ароматизатор кофе',
    shortDescUz: 'Osilma qahva xushbo\'yi',
    propertiesRu: JSON.stringify(['Аромат: Кофе', 'Объём: 5 мл', 'Срок действия: 30 дней']),
    propertiesUz: JSON.stringify(['Hidlar: Qahva', 'Hajmi: 5 ml', 'Amal muddati: 30 kun']),
    filterProperties: JSON.stringify([{ name_ru: 'Аромат', value_ru: 'Кофе' }]),
    brand: 'AromaAuto',
    vatPct: 0,
    weightKg: 0.02,
    dimLengthCm: 5,
    dimWidthCm: 2,
    dimHeightCm: 10,
  });

  await db.insert(productMedia).values([
    { productId: fresh.id, url: 'https://picsum.photos/seed/fr1/1080/1440', mediaType: 'photo', widthPx: 1080, heightPx: 1440, sizeBytes: 700000, isPrimary: true, orderIndex: 0, isCompliant: true },
    { productId: fresh.id, url: 'https://picsum.photos/seed/fr2/1080/1440', mediaType: 'photo', widthPx: 1080, heightPx: 1440, sizeBytes: 650000, isPrimary: false, orderIndex: 1, isCompliant: true },
    { productId: fresh.id, url: 'https://picsum.photos/seed/fr3/1080/1440', mediaType: 'photo', widthPx: 1080, heightPx: 1440, sizeBytes: 600000, isPrimary: false, orderIndex: 2, isCompliant: true },
  ]);

  await db.insert(accessoriesData).values({
    productId: fresh.id,
    useCaseRu: 'Ароматизация салона автомобиля, устранение неприятных запахов',
    useCaseUz: 'Avtomobil salonini xushbo\'ylash, yoqimsiz hidlarni bartaraf etish',
    volumeMl: 5,
  });

  await db.insert(pricing).values({ productId: fresh.id, costPrice: 3500, sellingPrice: 9900, marginPct: 64.6, competitorPrice: 11000 });
  await db.insert(fulfillment).values({ productId: fresh.id, scheme: 'FBO', stockQuantity: 300, fboTurnoverDays: 12 });
  await db.insert(moderation).values({ productId: fresh.id, status: 'on_sale' });

  // --- 2 Parts ---

  // 6. Oil filter
  const [oilFilter] = await db.insert(products).values({
    sku: 'PRT-001',
    barcode: '4607812346001',
    productProfile: 'parts',
    nameRu: 'Фильтр масляный',
    nameUz: 'Moy filtri',
  }).returning();

  await db.insert(productCards).values({
    productId: oilFilter.id,
    titleRu: 'Фильтр масляный для Toyota Camry / Corolla / RAV4 2.0-2.5',
    titleUz: 'Toyota Camry / Corolla / RAV4 2.0-2.5 uchun moy filtri',
    descriptionRu: 'Масляный фильтр для двигателей Toyota серии AR/AZ. Высокоэффективный фильтрующий элемент. Гарантия 1 год.',
    descriptionUz: 'Toyota AR/AZ seriyali dvigatellari uchun moy filtri. Yuqori samarali filtrlovchi element. Kafolat 1 yil.',
    shortDescRu: 'Масляный фильтр Toyota 2.0-2.5',
    shortDescUz: 'Toyota 2.0-2.5 moy filtri',
    propertiesRu: JSON.stringify(['Тип: масляный', 'Резьба: M20×1.5', 'Высота: 65 мм']),
    propertiesUz: JSON.stringify(['Turi: moy', 'Rezba: M20×1.5', 'Balandligi: 65 mm']),
    filterProperties: JSON.stringify([{ name_ru: 'Тип', value_ru: 'Масляный' }, { name_ru: 'Марка', value_ru: 'Toyota' }]),
    brand: 'Toyota OEM',
    vatPct: 0,
    weightKg: 0.15,
    dimLengthCm: 7,
    dimWidthCm: 7,
    dimHeightCm: 6.5,
  });

  await db.insert(productMedia).values([
    { productId: oilFilter.id, url: 'https://picsum.photos/seed/of1/1080/1440', mediaType: 'photo', widthPx: 1080, heightPx: 1440, sizeBytes: 800000, isPrimary: true, orderIndex: 0, isCompliant: true },
    { productId: oilFilter.id, url: 'https://picsum.photos/seed/of2/1080/1440', mediaType: 'photo', widthPx: 1080, heightPx: 1440, sizeBytes: 750000, isPrimary: false, orderIndex: 1, isCompliant: true },
    { productId: oilFilter.id, url: 'https://picsum.photos/seed/of3/1080/1440', mediaType: 'photo', widthPx: 1080, heightPx: 1440, sizeBytes: 700000, isPrimary: false, orderIndex: 2, isCompliant: true },
  ]);

  await db.insert(partsData).values({
    productId: oilFilter.id,
    oemNumber: '90915-YZZD4',
    crossReferences: JSON.stringify(['90915-YZZD3', 'W68/1', 'OC459']),
    compatibleModels: JSON.stringify([
      { make: 'Toyota', model: 'Camry', year_from: 2017, year_to: 2024, engine: '2.5 AR-FE' },
      { make: 'Toyota', model: 'Corolla', year_from: 2019, year_to: 2024, engine: '2.0 M20A' },
      { make: 'Toyota', model: 'RAV4', year_from: 2018, year_to: 2024, engine: '2.5 A25A' },
    ]),
    positionRu: 'Двигатель, снизу',
    positionUz: 'Dvigatel, pastdan',
    partLengthMm: 70,
    partWidthMm: 70,
    partHeightMm: 65,
    partWeightG: 150,
    warrantyMonths: 12,
    materialSpec: 'Стальной корпус, целлюлозный фильтрующий элемент',
  });

  await db.insert(pricing).values({ productId: oilFilter.id, costPrice: 18000, sellingPrice: 38000, marginPct: 52.6, competitorPrice: 42000 });
  await db.insert(fulfillment).values({ productId: oilFilter.id, scheme: 'FBO', stockQuantity: 85, fboTurnoverDays: 22 });
  await db.insert(moderation).values({ productId: oilFilter.id, status: 'on_sale' });

  // 7. Brake pads — partially filled (low score)
  const [brakes] = await db.insert(products).values({
    sku: 'PRT-002',
    barcode: '4607812346002',
    productProfile: 'parts',
    nameRu: 'Тормозные колодки передние',
    nameUz: 'Old tormoz kolodkalari',
  }).returning();

  await db.insert(productCards).values({
    productId: brakes.id,
    titleRu: 'Колодки тормозные передние для Chevrolet Nexia / Lacetti',
    titleUz: 'Chevrolet Nexia / Lacetti uchun old tormoz kolodkalari',
    propertiesRu: JSON.stringify(['Позиция: передние', 'Тип: дисковые']),
    propertiesUz: JSON.stringify(['Pozitsiya: old', 'Turi: disk']),
    brand: 'Brembo',
    vatPct: 0,
  });

  await db.insert(productMedia).values([
    { productId: brakes.id, url: 'https://picsum.photos/seed/bp1/1080/1440', mediaType: 'photo', widthPx: 1080, heightPx: 1440, sizeBytes: 900000, isPrimary: true, orderIndex: 0, isCompliant: true },
    { productId: brakes.id, url: 'https://picsum.photos/seed/bp2/800/600', mediaType: 'photo', widthPx: 800, heightPx: 600, sizeBytes: 500000, isPrimary: false, orderIndex: 1, isCompliant: false, complianceNotes: 'Resolution too low, wrong aspect ratio' },
  ]);

  await db.insert(partsData).values({
    productId: brakes.id,
    compatibleModels: JSON.stringify([
      { make: 'Chevrolet', model: 'Nexia', year_from: 2020, year_to: 2024, engine: '1.5' },
      { make: 'Chevrolet', model: 'Lacetti', year_from: 2004, year_to: 2013, engine: '1.6' },
    ]),
    positionRu: 'Передние',
    positionUz: 'Old',
  });

  await db.insert(pricing).values({ productId: brakes.id, sellingPrice: 75000 });
  await db.insert(fulfillment).values({ productId: brakes.id, scheme: 'FBS', stockQuantity: 12 });
  await db.insert(moderation).values({ productId: brakes.id, status: 'draft' });

  console.log('Seed complete: 5 accessories + 2 parts');
}

seed().catch(console.error);

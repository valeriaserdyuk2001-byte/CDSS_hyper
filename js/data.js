export const DRUG_CLASSES = {
  ACEI: 'ИАПФ',
  ARB: 'БРА',
  CCB: 'БКК',
  DIURETIC: 'Диуретики',
  BETA: 'ББ',
  ARNI: 'АРНИ',
  MRA: 'АМКР',
  I1A: 'АИР',
  AAB: 'ААБ',
};

export const CLASS_HELP = {
  ACEI: 'Ингибиторы ангиотензинпревращающего фермента',
  ARB: 'Блокаторы рецепторов ангиотензина I',
  CCB: 'Блокаторы кальциевых каналов',
  DIURETIC: 'Тиазидные и тиазидоподобные диуретики; также могут включать петлевые диуретики',
  BETA: 'Бета-адреноблокаторы',
  ARNI: 'Ангиотензиновых рецепторов и неприлизина ингибиторы',
  MRA: 'Антагонисты минералокортикоидных рецепторов',
  I1A: 'Агонисты имидазолиновых рецепторов',
  AAB: 'Альфа-адреноблокаторы',
};

export const DRUGS = [
  { classKey: 'ACEI', subclass: '', inn: 'Лизиноприл', min: '5 мг 1 р/д', opt: '10 мг 1 р/д', max: '20 мг 1 р/д' },
  { classKey: 'ACEI', subclass: '', inn: 'Периндоприл', min: '1–2 мг 1 р/д', opt: '2–4 мг 1 р/д', max: '8 мг 1 р/д' },
  { classKey: 'ACEI', subclass: '', inn: 'Рамиприл', min: '10 мг 2 р/д', opt: '10 мг 3 р/д', max: '20 мг 3 р/д' },
  { classKey: 'ACEI', subclass: '', inn: 'Эналаприл', min: '2,5 мг 1–2 р/д', opt: '10 мг 2 р/д', max: '20 мг 2 р/д' },
  { classKey: 'ACEI', subclass: '', inn: 'Фозиноприл', min: '2,5 мг 1 р/д', opt: '5 мг 1 р/д', max: '10 мг 1 р/д' },

  { classKey: 'ARB', subclass: '', inn: 'Лозартан', min: '25 мг 1–2 р/д', opt: '25 мг 1–2 р/д', max: '50 мг 1–2 р/д' },
  { classKey: 'ARB', subclass: '', inn: 'Телмисартан', min: '20 мг 1 р/д', opt: '40 мг 1 р/д', max: '80 мг 1 р/д' },
  { classKey: 'ARB', subclass: '', inn: 'Валсартан', min: '80 мг 1 р/д', opt: '80 мг 2 р/д', max: '160 мг 2 р/д' },
  { classKey: 'ARB', subclass: '', inn: 'Кандесартан', min: '8 мг 1 р/д', opt: '16 мг 1 р/д', max: '32 мг 1 р/д' },
  { classKey: 'ARB', subclass: '', inn: 'Азилсартан', min: '20 мг 1 р/д', opt: '40 мг 1 р/д', max: '80 мг 1 р/д' },

  { classKey: 'CCB_DHP', subclass: 'Дигидропиридиновые БКК', inn: 'Амлодипин', min: '2,5 мг 1 р/д', opt: '5 мг 1 р/д', max: '10 мг 1 р/д' },
  { classKey: 'CCB_DHP', subclass: 'Дигидропиридиновые БКК', inn: 'Лерканидипин', min: '5–10 мг 1 р/д', opt: '10 мг 1 р/д', max: '20 мг 1 р/д' },
  { classKey: 'CCB_DHP', subclass: 'Дигидропиридиновые БКК', inn: 'Нифедипин', min: '10 мг 2 р/д', opt: '10 мг 3 р/д', max: '20 мг 3 р/д' },
  { classKey: 'CCB_DHP', subclass: 'Дигидропиридиновые БКК', inn: 'Фелодипин', min: '5 мг 1 р/д', opt: '10 мг 1 р/д', max: '20 мг 1 р/д' },
  { classKey: 'CCB_NDHP', subclass: 'Недигидропиридиновые БКК', inn: 'Верапамил', min: 'индивидуально', opt: 'индивидуально', max: 'индивидуально' },
  { classKey: 'CCB_NDHP', subclass: 'Недигидропиридиновые БКК', inn: 'Дилтиазем', min: 'индивидуально', opt: 'индивидуально', max: 'индивидуально' },

  { classKey: 'THIAZIDE', subclass: 'Т/ТП диуретики', inn: 'Гидрохлоротиазид', min: '12,5 мг 1 р/д', opt: '25 мг 1 р/д', max: '50 мг 1 р/д' },
  { classKey: 'THIAZIDE', subclass: 'Т/ТП диуретики', inn: 'Индапамид', min: '2,5 мг 1 р/д', opt: '2,5 мг 1 р/д', max: '2,5 мг 1 р/д' },
  { classKey: 'LOOP', subclass: 'Петлевые диуретики', inn: 'Фуросемид', min: '20 мг 1 р/д', opt: '40 мг 1 р/д', max: '40 мг 4 р/д' },
  { classKey: 'LOOP', subclass: 'Петлевые диуретики', inn: 'Торасемид', min: '5 мг 1 р/д', opt: '10 мг 1 р/д', max: '100–200 мг 1 р/д' },

  { classKey: 'MRA', subclass: '', inn: 'Спиронолактон', min: '25 мг 1 р/д', opt: '50 мг 1 р/д', max: '100 мг 3 р/д' },
  { classKey: 'MRA', subclass: '', inn: 'Эплеренон', min: '25 мг 1 р/д', opt: '50 мг 1 р/д', max: '50 мг 1 р/д' },

  { classKey: 'BETA', subclass: 'β-блокаторы', inn: 'Соталол', min: '80 мг 2 р/д', opt: '160 мг 2 р/д', max: '160 мг 3 р/д' },
  { classKey: 'BETA', subclass: 'β-блокаторы', inn: 'Небиволол', min: '2,5 мг 1 р/д', opt: '5 мг 1 р/д', max: '10 мг 1 р/д' },
  { classKey: 'BETA', subclass: 'β-блокаторы', inn: 'Бисопролол', min: '2,5 мг 1 р/д', opt: '5 мг 1 р/д', max: '10 мг 1 р/д' },
  { classKey: 'BETA', subclass: 'β-блокаторы', inn: 'Метопролол', min: '12,5 мг 1–2 р/д', opt: '25–50 мг 2–3 р/д', max: '100 мг 2 р/д' },

  { classKey: 'AAB', subclass: '', inn: 'Карведилол', min: '6,25 мг 2 р/д', opt: '12,5–25 мг 2 р/д', max: '25 мг 2 р/д' },
  { classKey: 'I1A', subclass: '', inn: 'Моксонидин', min: '0,2 мг 1 р/д', opt: '0,4 мг 1 р/д', max: '0,6 мг/сут' },
  { classKey: 'ARNI', subclass: '', inn: 'Валсартан + сакубитрил', min: 'индивидуально', opt: 'индивидуально', max: 'индивидуально' },
];

export const CHA2_STROKE_RISK = {
  0: '0',
  1: '1,3',
  2: '2,2',
  3: '3,2',
  4: '4,0',
  5: '6,7',
  6: '9,8',
  7: '9,6',
  8: '6,7',
  9: '15,2',
};

export const SCORE_THRESHOLDS = {
  lt50: { low: 1, moderateMax: 2.5, highMin: 7.5 },
  age50to69: { low: 1, moderateMax: 5, highMin: 10 },
  age70plus: { low: 1, moderateMax: 7.5, highMin: 15 },
};
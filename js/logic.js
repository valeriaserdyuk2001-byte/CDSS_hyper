import { DRUGS, DRUG_CLASSES, CHA2_STROKE_RISK, SCORE_THRESHOLDS } from './data.js';

export function calculateBpCategory(sbp, dbp) {
  if (!sbp || !dbp) return '';
  if (sbp > 140 && dbp < 90) return 'Изолированная систолическая гипертензия';
  if (sbp < 140 && dbp >= 90) return 'Изолированная диастолическая гипертензия';
  if (sbp > 180 || dbp > 110) return 'АГ 3-й степени';
  if ((sbp >= 160 && sbp <= 179) || (dbp >= 100 && dbp <= 109)) return 'АГ 2-й степени';
  if ((sbp >= 140 && sbp <= 159) || (dbp >= 90 && dbp <= 99)) return 'АГ 1-й степени';
  if ((sbp >= 130 && sbp <= 139) || (dbp >= 85 && dbp <= 89)) return 'Высокое нормальное';
  if ((sbp >= 120 && sbp <= 129) || (dbp >= 80 && dbp <= 84)) return 'Нормальное';
  if (sbp < 120 && dbp < 80) return 'Оптимальное';
  return 'Нормальное';
}

export function normalizeDegreeLabel(category) {
  if (category.includes('1-й')) return '1';
  if (category.includes('2-й')) return '2';
  if (category.includes('3-й')) return '3';
  return '';
}

export function autoRiskFactors(age, sex) {
  return {
    sexRisk: sex === 'male',
    ageRisk: (sex === 'male' && age > 55) || (sex === 'female' && age > 65),
    earlyMenopauseVisible: sex === 'female',
  };
}

export function calculateStage(data) {
  if (data.stageMode !== 'auto') return data.stageManual || '';
  const associated = data.stageCalc.associated.filter(Boolean).length > 0;
  const organ = data.stageCalc.organFlags.filter(Boolean).length > 0;
  const ckd = data.stageCalc.ckd || 'none';
  if (associated || ckd === 'c4' || ckd === 'c5') return 'III';
  if (organ || ckd === 'c3' || data.stageCalc.diabetes) return 'II';
  return 'I';
}

export function calculateRisk(data) {
  if (data.riskMode !== 'auto') return data.riskManual || '';
  if (data.riskAutoMethod === 'score2') return calculateScore2Risk(data.age, Number(data.score2Value));
  return calculateClinicalRisk(data);
}

export function calculateScore2Risk(age, score) {
  if (!Number.isFinite(score) || !age) return '';
  const group = age < 50 ? SCORE_THRESHOLDS.lt50 : age < 70 ? SCORE_THRESHOLDS.age50to69 : SCORE_THRESHOLDS.age70plus;
  if (score < group.low) return 'низкий';
  if (score < group.moderateMax) return 'умеренный';
  if (score >= group.highMin) return 'высокий';
  return 'умеренный';
}

export function calculateClinicalRisk(data) {
  const c = data.clinicalRisk;
  let level = '';
  const setLevel = (v) => {
    const order = ['', 'низкий', 'умеренный', 'высокий', 'очень высокий', 'экстремальный'];
    if (order.indexOf(v) > order.indexOf(level)) level = v;
  };

  if (c.extremeCvdCombo) setLevel('экстремальный');

  if (c.documentedAscvd || c.imagingPlaque || (c.dm && (c.dmTargetOrganDamage || c.moreThan3RiskFactors || (c.dmType === 'type1' && c.dmDuration > 20))) || c.ckdSeverity === 'severe') {
    setLevel('очень высокий');
  }

  if (c.majorRiskFactors || c.familialHypercholNoRf || (c.dm && !c.dmTargetOrganDamage && (c.dmDuration >= 10 || c.majorRiskFactors)) || c.ckdSeverity === 'moderate') {
    setLevel('высокий');
  }

  if (c.dm && ((c.dmType === 'type1' && data.age < 35) || (c.dmType === 'type2' && data.age < 50)) && c.dmDuration < 10 && !c.dmTargetOrganDamage && !c.majorRiskFactors && !c.moreThan3RiskFactors) {
    setLevel('умеренный');
  }

  return level;
}

export function calculateFrailtyResult(answers = []) {
  const sum = answers.filter(Boolean).length;
  if (sum <= 2) return { score: sum, text: 'Нет старческой астении' };
  if (sum <= 4) return { score: sum, text: 'Вероятная преастения' };
  return { score: sum, text: 'Вероятная старческая астения, требуется прием врача-гериатра' };
}

export function calculateCha2(data) {
  const age = data.age || 0;
  let score = 0;
  score += data.cha2.stroke ? 2 : 0;
  score += age >= 75 ? 2 : 0;
  score += data.cha2.htn ? 1 : 0;
  score += data.cha2.dm ? 1 : 0;
  score += data.cha2.hf ? 1 : 0;
  score += data.cha2.vascular ? 1 : 0;
  score += age >= 65 && age <= 74 ? 1 : 0;
  score += data.sex === 'female' ? 1 : 0;
  return { score, annualRisk: CHA2_STROKE_RISK[score] || 'н/д' };
}

function determineScenario(data) {
  const extra = data.extra;
  if (extra.pregnancy) return 'Лечение АГ при беременности';
  if (extra.oncoTherapy) return 'Лечение АГ на фоне противоопухолевой терапии';
  if (extra.ckd === 'c1_3_gte30' || extra.ckd === 'c4_5_lt30') return 'Лечение АГ при ХБП';
  if (extra.ihd === 'angina_yes' || extra.ihd === 'angina_no') return 'Лечение АГ при ИБС';
  if (extra.af === 'hr_ge_80' || extra.af === 'hr_lt_80') return 'Лечение АГ при ФП';
  return 'Стандартное лечение АГ I-II стадии';
}

function getBaseDoseLevel(data) {
  const frailtyScore = data.frailtyResult?.score ?? 0;
  if (data.age > 65 || frailtyScore >= 5) return 'min';
  return 'opt';
}

function lowIntensityStandardStart(data) {
  const targetGapSbp = Math.max(0, (data.sbp || 0) - (data.age >= 65 ? 139 : 129));
  const targetGapDbp = Math.max(0, (data.dbp || 0) - 79);
  const frailtyScore = data.frailtyResult?.score ?? 0;
  return (targetGapSbp < 20 || targetGapDbp < 10) && (data.risk === 'низкий' || data.age > 80 || frailtyScore >= 5);
}

function scenarioSteps(scenario, data) {
  const dose = getBaseDoseLevel(data);
  const lowStandard = lowIntensityStandardStart(data);
  const commonTiming = 'Каждый шаг терапии 2–4 недели для достижения целевого АД за 3 месяца';
  const byScenario = {
    'Стандартное лечение АГ I-II стадии': [
      {
        name: 'Стартовая терапия (1 шаг)',
        pattern: lowStandard ? ['ACEI|ARB|DIURETIC|CCB_DHP|BETA'] : ['ACEI|ARB', 'CCB|DIURETIC'],
        dose: lowStandard ? 'min' : dose,
        text: lowStandard
          ? 'ИАПФ или БРА или диуретик или длительно действующий БКК или ББ'
          : 'ИАПФ или БРА + БКК или диуретик',
      },
      {
        name: '2 шаг',
        pattern: ['ACEI|ARB', 'CCB', 'DIURETIC'],
        dose: 'opt',
        text: 'ИАПФ или БРА + БКК + диуретик',
      },
      {
        name: '3 шаг',
        pattern: ['ACEI|ARB', 'CCB', 'DIURETIC', 'MRA|BETA|I1A|AAB'],
        dose: 'opt',
        altDose: 'max',
        warning: 'При переносимости',
        text: 'ИАПФ или БРА + БКК + диуретик + АМКР или ББ или АИР или ААБ',
      },
    ],
    'Лечение АГ при ХБП': data.extra.ckd === 'c4_5_lt30' ? [
      { name: 'Стартовая терапия (1 шаг)', pattern: ['ACEI|ARB', 'CCB|LOOP'], dose, text: 'ИАПФ или БРА + БКК или петлевой диуретик' },
      { name: '2 шаг', pattern: ['ACEI|ARB', 'CCB|LOOP', 'CCB|LOOP'], dose: 'opt', altDose: 'max', warning: 'При переносимости', text: 'ИАПФ или БРА + БКК или петлевой диуретик; при необходимости добавить третий компонент' },
      { name: '3 шаг', pattern: ['ACEI|ARB', 'CCB', 'LOOP', 'THIAZIDE|BETA|AAB|I1A'], dose: 'opt', altDose: 'max', warning: 'При переносимости', text: 'ИАПФ или БРА + БКК + петлевой диуретик + Т/ТП диуретик или ББ или ААБ или АИР' },
    ] : [
      { name: 'Стартовая терапия (1 шаг)', pattern: ['ACEI|ARB', 'CCB|THIAZIDE'], dose, text: 'ИАПФ или БРА + БКК или Т/ТП диуретик' },
      { name: '2 шаг', pattern: ['ACEI|ARB', 'CCB|THIAZIDE', 'CCB|THIAZIDE'], dose: 'opt', altDose: 'max', warning: 'При переносимости', text: 'ИАПФ или БРА + БКК или Т/ТП диуретик; при необходимости добавить третий компонент' },
      { name: '3 шаг', pattern: ['ACEI|ARB', 'CCB', 'THIAZIDE', 'MRA|BETA|AAB|I1A'], dose: 'opt', altDose: 'max', warning: 'При переносимости', text: 'ИАПФ или БРА + БКК + Т/ТП диуретик + АМКР или ББ или ААБ или АИР' },
    ],
    'Лечение АГ при ИБС': data.extra.ihd === 'angina_yes' ? [
      { name: 'Стартовая терапия (1 шаг)', pattern: ['ACEI|ARB', 'BETA'], dose, text: 'ИАПФ или БРА + ББ' },
      { name: '2 шаг', pattern: ['ACEI|ARB', 'BETA', 'CCB_DHP'], dose: 'opt', altDose: 'max', warning: 'При переносимости', text: 'ИАПФ или БРА + ББ + дигидропиридиновые БКК' },
      { name: '3 шаг', pattern: ['ACEI|ARB', 'BETA', 'CCB_DHP', 'MRA|DIURETIC|AAB|I1A'], dose: 'opt', altDose: 'max', warning: 'При переносимости', text: 'ИАПФ или БРА + ББ + дигидропиридиновые БКК + АМКР или диуретик или ААБ или АИР' },
    ] : [
      { name: 'Стартовая терапия (1 шаг)', pattern: ['ACEI|ARB', 'BETA'], dose, text: 'ИАПФ или БРА + ББ' },
      { name: '2 шаг', pattern: ['ACEI|ARB', 'BETA', 'CCB_DHP|THIAZIDE'], dose: 'opt', altDose: 'max', warning: 'При переносимости', text: 'ИАПФ или БРА + ББ + дигидропиридиновые БКК или Т/ТП диуретик' },
      { name: '3 шаг', pattern: ['ACEI|ARB', 'BETA', 'CCB_DHP|THIAZIDE', 'MRA|DIURETIC|AAB|I1A'], dose: 'opt', altDose: 'max', warning: 'При переносимости', text: 'ИАПФ или БРА + ББ + дигидропиридиновые БКК или Т/ТП диуретик + АМКР или диуретик или ААБ или АИР' },
    ],
    'Лечение АГ при ФП': data.extra.af === 'hr_ge_80' ? [
      { name: 'Стартовая терапия (1 шаг)', pattern: ['ACEI|ARB', 'BETA'], dose, text: 'ИАПФ или БРА + ББ' },
      { name: '2 шаг', pattern: ['ACEI|ARB', 'BETA', 'CCB_DHP|THIAZIDE'], dose: 'opt', altDose: 'max', warning: 'При переносимости', text: 'ИАПФ или БРА + ББ + дигидропиридиновые БКК или Т/ТП диуретик' },
      { name: '3 шаг', pattern: ['ACEI|ARB', 'BETA', 'CCB_DHP', 'THIAZIDE', 'MRA|DIURETIC|AAB|I1A'], dose: 'opt', altDose: 'max', warning: 'При переносимости', text: 'ИАПФ или БРА + ББ + дигидропиридиновые БКК + Т/ТП диуретики + АМКР или диуретик или ААБ или АИР' },
    ] : [
      { name: 'Стартовая терапия (1 шаг)', pattern: ['ACEI|ARB', 'CCB_DHP|THIAZIDE'], dose, text: 'ИАПФ или БРА + дигидропиридиновые БКК или Т/ТП диуретик' },
      { name: '2 шаг', pattern: ['ACEI|ARB', 'CCB_DHP|THIAZIDE', 'CCB_DHP|THIAZIDE'], dose: 'opt', altDose: 'max', warning: 'При переносимости', text: 'ИАПФ или БРА + дигидропиридиновые БКК или Т/ТП диуретик; при необходимости добавить третий компонент' },
      { name: '3 шаг', pattern: ['ACEI|ARB', 'CCB_DHP', 'THIAZIDE'], dose: 'max', warning: 'При переносимости', text: 'ИАПФ или БРА + дигидропиридиновые БКК + Т/ТП диуретики' },
    ],
    'Лечение АГ при беременности': [
      { name: 'Стартовая терапия (1 шаг)', directText: 'Метилдопа per os или нифедипин с замедленным высвобождением: 20–40 мг 2 раза в сутки внутрь, не разжевывая, или 30–60 мг 1 раз в сутки; максимальная суточная доза 120 мг' },
      { name: '2 шаг', directText: 'Бисопролол или метопролол' },
    ],
    'Лечение АГ на фоне противоопухолевой терапии': [
      { name: 'Стартовая терапия (1 шаг)', pattern: ['ACEI|ARB', 'CCB_DHP'], dose, text: 'ИАПФ или БРА + дигидропиридиновые БКК' },
      { name: '2 шаг', pattern: ['ACEI|ARB', 'CCB_DHP', 'MRA|BETA|DIURETIC'], dose: 'opt', altDose: 'max', warning: 'При переносимости', text: 'ИАПФ или БРА + дигидропиридиновые БКК + АМКР или ББ или диуретик' },
    ],
  };
  return { steps: byScenario[scenario] || byScenario['Стандартное лечение АГ I-II стадии'], commonTiming };
}

function classesForToken(token) {
  const map = {
    ACEI: ['ACEI'],
    ARB: ['ARB'],
    CCB: ['CCB_DHP', 'CCB_NDHP'],
    CCB_DHP: ['CCB_DHP'],
    DIURETIC: ['THIAZIDE', 'LOOP'],
    THIAZIDE: ['THIAZIDE'],
    LOOP: ['LOOP'],
    BETA: ['BETA'],
    ARNI: ['ARNI'],
    MRA: ['MRA'],
    I1A: ['I1A'],
    AAB: ['AAB'],
  };
  return map[token] || [];
}

function pickDrugExamples(step, exclusions = []) {
  if (step.directText) return [];
  const used = new Set();
  const examples = [];
  step.pattern.forEach((segment) => {
    const choices = segment.split('|').flatMap(classesForToken).filter((c) => !exclusions.includes(c));
    const drug = DRUGS.find((d) => choices.includes(d.classKey));
    if (drug && !used.has(drug.inn)) {
      used.add(drug.inn);
      examples.push({
        classKey: drug.classKey,
        inn: drug.inn,
        dose: step.dose === 'min' ? drug.min : step.dose === 'max' ? drug.max : drug.opt,
      });
    }
  });
  return examples;
}

function inferStepIndex(scenario, data) {
  const current = data.currentTherapyClasses || [];
  if (data.therapyMode !== 'adjust') return 0;
  if (!data.targetNotAchieved) return 0;
  if (current.length >= 4) return 2;
  if (current.length >= 3) return 2;
  if (current.length >= 2) return 1;
  return 0;
}

function formatCurrentTherapy(classes = []) {
  const labels = classes.map((k) => DRUG_CLASSES[k] || k);
  return labels.join(', ');
}

function targetBp(age) {
  return {
    sbp: age >= 65 ? '130–139 мм рт. ст. при переносимости' : 'менее 130, но не менее 120 мм рт. ст.',
    dbp: 'менее 80 мм рт. ст., но не ниже 70 мм рт. ст.',
  };
}

function riskLdlTarget(risk) {
  const map = {
    'низкий': 'Назначение статинов для достижения целевого ХС ЛПНП 3,0 ммоль/л и менее',
    'умеренный': 'Назначение статинов для достижения целевого ХС ЛПНП 2,6 ммоль/л и менее',
    'высокий': 'Назначение статинов для достижения целевого ХС ЛПНП 1,8 ммоль/л и менее или его снижение на 50% и более от исходного',
    'очень высокий': 'Назначение статинов для достижения целевого ХС ЛПНП 1,4 ммоль/л и менее',
    'экстремальный': 'Назначение статинов для достижения целевого ХС ЛПНП 1,0 ммоль/л и менее или его снижение на 50% и более от исходного',
  };
  return map[risk] || '';
}

function buildAdditionalInfo(data, step) {
  const recommendations = [];
  const warnings = [];
  const additionalTherapy = [];
  const exclusions = [];

  if (data.extra.hf === 'hfrEF') {
    recommendations.push('Рекомендуется назначение иАПФ или АРНИ, ББ или АМКР для снижения риска смерти и госпитализации из-за СН');
    recommendations.push('Рекомендуется назначение амлодипина в дополнение к комбинации при недостаточной эффективности АГТ');
    recommendations.push('Не рекомендуется назначение дилтиазема и верапамила из-за отрицательного инотропного действия и риска ухудшения ХСН');
    exclusions.push('I1A', 'AAB', 'CCB_NDHP');
  }
  if (data.extra.hf === 'hfmrEF') {
    recommendations.push('Рекомендуется назначение амлодипина в дополнение к комбинации при недостаточной эффективности АГТ');
    recommendations.push('Рекомендуется назначение диуретиков при признаках задержки жидкости с целью улучшения клинической симптоматики ХСН');
    recommendations.push('Рекомендуется рассмотреть возможность приема АРНИ с целью снижения риска госпитализации и смерти из-за ХСН');
    recommendations.push('Рекомендуется рассмотреть возможность приема дапаглифлозина или эмпаглифлозина с целью снижения риска госпитализации из-за ХСН');
  }
  if (data.extra.hf === 'hfPEF') {
    recommendations.push('Рекомендуется назначение амлодипина в дополнение к комбинации при недостаточной эффективности АГТ');
    recommendations.push('Рекомендуется рассмотреть возможность приема дапаглифлозина или эмпаглифлозина с целью снижения риска госпитализации из-за ХСН');
    recommendations.push('Рекомендуется рассмотреть возможность приема АРНИ с целью снижения риска госпитализации и смерти из-за ХСН');
  }
  if (data.extra.copdAsthma) {
    exclusions.push('BETA');
    recommendations.push('Рекомендовано отдавать предпочтение БРА из-за кашля на иАПФ');
    recommendations.push('Использовать диуретики с осторожностью из-за риска развития гипокалиемии на фоне приема β2-агонистов');
  }
  if (data.extra.osa) {
    recommendations.push('Рекомендовано снижение веса у пациентов с ожирением, отказ от курения, назначение транквилизаторов и снотворных препаратов, а также проведение мероприятий для обеспечения свободного носового дыхания');
    recommendations.push('Рекомендована CPAP-терапия');
  }
  if (data.extra.ed && !step.text?.includes('ААБ')) {
    additionalTherapy.push('Ингибиторы фосфодиэстеразы-5');
  }

  const ldl = riskLdlTarget(data.risk);
  if (ldl) additionalTherapy.push(ldl);

  if (data.extra.coc) {
    recommendations.push('Провести оценку рисков и преимуществ приема КОК, а также наличие сопутствующих факторов сердечно-сосудистого риска с целью улучшения контроля АД');
  }
  if (data.extra.menopauseTherapy) {
    recommendations.push('Прием менопаузальной гормональной терапии не противопоказан при условии контроля АД с помощью АГТ');
  }
  if (data.extra.oncoTherapy === 'not_started' && ((data.sbp || 0) >= 180 || (data.dbp || 0) >= 110)) {
    warnings.push('Начинать противоопухолевую терапию не рекомендуется до стабилизации АД');
  }
  if (data.extra.pregnancy) {
    warnings.push('ИАПФ, БРА, АМКР, БКК противопоказаны при беременности');
  }

  return { recommendations, warnings, additionalTherapy, exclusions };
}

export function evaluatePatient(data) {
  const bpCategory = calculateBpCategory(Number(data.sbp), Number(data.dbp));
  const degree = normalizeDegreeLabel(bpCategory);
  const stage = calculateStage(data);
  const risk = calculateRisk(data);
  const scenario = determineScenario({ ...data, stage, risk });
  const { steps, commonTiming } = scenarioSteps(scenario, { ...data, stage, risk });
  const initialStepIndex = inferStepIndex(scenario, data);
  const additional = buildAdditionalInfo({ ...data, stage, risk }, steps[Math.min(initialStepIndex, steps.length - 1)]);
  const evaluatedSteps = steps.map((step) => ({
    ...step,
    examples: pickDrugExamples(step, additional.exclusions),
  }));

  return {
    ...data,
    bpCategory,
    degree,
    stage,
    risk,
    scenario,
    therapy: {
      typeLabel: data.therapyMode === 'start' ? 'Старт терапии' : 'Корректировка терапии',
      currentTherapyLabel: formatCurrentTherapy(data.currentTherapyClasses),
      steps: evaluatedSteps,
      stepIndex: Math.min(initialStepIndex, evaluatedSteps.length - 1),
      timing: commonTiming,
    },
    target: targetBp(data.age),
    additional,
  };
}
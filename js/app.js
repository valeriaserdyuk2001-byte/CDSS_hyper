import { CLASS_HELP, DRUG_CLASSES } from './data.js';
import { autoRiskFactors, calculateBpCategory, calculateFrailtyResult, calculateCha2, evaluatePatient } from './logic.js';

const STORAGE_KEY = 'ahDecisionSupportState';
const RESULT_KEY = 'ahDecisionSupportResult';

function qs(sel, root = document) { return root.querySelector(sel); }
function qsa(sel, root = document) { return [...root.querySelectorAll(sel)]; }

function show(el, visible = true) {
  if (!el) return;
  el.hidden = !visible;
}

function renderRiskFactorAutoLabels() {
  const age = Number(qs('#age')?.value || 0);
  const sex = qs('input[name="sex"]:checked')?.value;
  const auto = autoRiskFactors(age, sex);
  const sexWrap = qs('#rf-sex-auto');
  const ageWrap = qs('#rf-age-auto');
  const menopauseWrap = qs('#rf-early-menopause-wrap');
  show(sexWrap, auto.sexRisk);
  show(ageWrap, auto.ageRisk);
  show(menopauseWrap, auto.earlyMenopauseVisible);
  const sexCb = qs('#rf-sex-auto-cb');
  const ageCb = qs('#rf-age-auto-cb');
  if (sexCb) sexCb.checked = auto.sexRisk;
  if (ageCb) ageCb.checked = auto.ageRisk;
}

function updateBpCategory() {
  const sbp = Number(qs('#sbp').value || 0);
  const dbp = Number(qs('#dbp').value || 0);
  const category = calculateBpCategory(sbp, dbp);
  const out = qs('#bp-category-output');
  out.textContent = category ? `Степень/категория АД: ${category}` : 'Степень/категория АД будет определена автоматически';
}

function syncStageVisibility() {
  const stageMode = qs('#stage-mode').value;
  show(qs('#stage-calc-block'), stageMode === 'auto');
}

function syncRiskVisibility() {
  const riskMode = qs('#risk-mode').value;
  show(qs('#risk-calc-block'), riskMode === 'auto');
  const method = qs('input[name="riskAutoMethod"]:checked')?.value;
  show(qs('#score2-block'), riskMode === 'auto' && method === 'score2');
  show(qs('#clinical-risk-block'), riskMode === 'auto' && method === 'clinical');
}

function updateScoreImage() {
  const age = Number(qs('#age').value || 0);
  const img = qs('#score2-image');
  const caption = qs('#score2-caption');
  if (age >= 70) {
    img.src = './assets/score2_70_plus.svg';
    caption.textContent = 'Показана схема SCORE2 / SCORE2-OP для возраста 70+';
  } else {
    img.src = './assets/score2_40_69.svg';
    caption.textContent = 'Показана схема SCORE2 для возраста 40–69 лет';
  }
}

function syncClinicalRiskSubsections() {
  const dm = qs('#cr-dm').checked;
  const ckd = qs('#cr-ckd').checked;
  const major = qs('#cr-major-risk').checked;
  show(qs('#cr-dm-sub'), dm);
  show(qs('#cr-ckd-sub'), ckd);
  show(qs('#cr-major-sub'), major);
}

function syncAdditionalVisibility() {
  const sex = qs('input[name="sex"]:checked')?.value;
  const age = Number(qs('#age').value || 0);
  show(qs('#extra-ed-wrap'), sex === 'male');
  show(qs('#drug-coc-wrap'), sex === 'female');
  show(qs('#drug-mht-wrap'), sex === 'female');

  show(qs('#extra-ckd-sub'), qs('#extra-ckd').checked);
  show(qs('#extra-ihd-sub'), qs('#extra-ihd').checked);
  show(qs('#extra-hf-sub'), qs('#extra-hf').checked);
  show(qs('#extra-af-sub'), qs('#extra-af').checked);
  show(qs('#extra-onco-sub'), qs('#drug-onco').checked);

  show(qs('#frailty-toggle-wrap'), age >= 60);
  show(qs('#cha2-toggle-wrap'), qs('#extra-af').checked);

  const pregnant = qs('#extra-pregnancy').checked;
  const sbp = Number(qs('#sbp').value || 0);
  const dbp = Number(qs('#dbp').value || 0);
  show(qs('#pregnancy-warning-inline'), pregnant && (sbp >= 160 || dbp >= 110));
}

function syncTherapyVisibility() {
  const mode = qs('input[name="therapyMode"]:checked')?.value;
  show(qs('#correction-block'), mode === 'adjust');
}

function buildCurrentTherapyChips() {
  const container = qs('#therapy-class-chips');
  if (!container) return;
  container.innerHTML = '';
  Object.entries(DRUG_CLASSES).forEach(([key, label]) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'chip';
    button.dataset.key = key;
    button.title = CLASS_HELP[key] || '';
    button.innerHTML = `<span>${label}</span><small>${CLASS_HELP[key] || ''}</small>`;
    button.addEventListener('click', () => button.classList.toggle('active'));
    container.appendChild(button);
  });
}

function collectSelectedTherapyClasses() {
  return qsa('#therapy-class-chips .chip.active').map((el) => el.dataset.key);
}

function getCheckboxValues(name) {
  return qsa(`input[name="${name}"]:checked`).map((el) => el.value);
}

function collectData() {
  const age = Number(qs('#age').value || 0);
  const sex = qs('input[name="sex"]:checked')?.value || '';
  const sbp = Number(qs('#sbp').value || 0);
  const dbp = Number(qs('#dbp').value || 0);

  const stageMode = qs('#stage-mode').value;
  const stageManual = stageMode === 'manual' ? qs('#stage-manual').value : '';
  const stageCalc = {
    diabetes: qs('#stage-diabetes').checked,
    ckd: qs('#stage-ckd').value,
    organFlags: getCheckboxValues('stageOrgan'),
    associated: getCheckboxValues('stageAssoc'),
    riskFactors: getCheckboxValues('stageRiskFactor'),
  };

  const riskMode = qs('#risk-mode').value;
  const riskManual = riskMode === 'manual' ? qs('#risk-manual').value : '';
  const riskAutoMethod = qs('input[name="riskAutoMethod"]:checked')?.value || 'score2';
  const score2Value = qs('#score2-value').value;
  const clinicalRisk = {
    dm: qs('#cr-dm').checked,
    dmType: qs('#cr-dm-type').value,
    dmDuration: Number(qs('#cr-dm-duration').value || 0),
    dmTargetOrganDamage: qs('#cr-dm-tod').checked,
    ckdSeverity: qs('#cr-ckd-level').value,
    familialHypercholNoRf: qs('#cr-familial').checked,
    majorRiskFactors: qs('#cr-major-risk').checked && (qs('#cr-major-chol').checked || qs('#cr-major-bp').checked || qs('#cr-major-3rf').checked),
    moreThan3RiskFactors: qs('#cr-major-3rf').checked,
    documentedAscvd: qs('#cr-documented').checked,
    imagingPlaque: qs('#cr-imaging').checked,
    extremeCvdCombo: qs('#cr-extreme').checked && (qs('#cr-dm').checked || qs('#cr-familial').checked),
  };

  const frailtyAnswers = qsa('.frailty-question input[type="checkbox"]').map((el) => el.checked);
  const frailtyCalculated = qs('#frailty-score')?.dataset.calculated === '1';
  const frailtyResult = frailtyCalculated ? calculateFrailtyResult(frailtyAnswers) : null;

  const cha2 = {
    stroke: qs('#cha2-stroke').checked,
    htn: qs('#cha2-htn').checked,
    dm: qs('#cha2-dm').checked,
    hf: qs('#cha2-hf').checked,
    vascular: qs('#cha2-vascular').checked,
  };
  const cha2Calculated = qs('#cha2-result')?.dataset.calculated === '1';
  const cha2Result = cha2Calculated ? calculateCha2({ age, sex, cha2 }) : null;

  return {
    age,
    sex,
    sbp,
    dbp,
    stageMode,
    stageManual,
    stageCalc,
    riskMode,
    riskManual,
    riskAutoMethod,
    score2Value,
    clinicalRisk,
    extra: {
      dm: qs('#extra-dm').checked,
      ckd: qs('input[name="extraCkdOption"]:checked')?.value || '',
      ihd: qs('input[name="extraIhdOption"]:checked')?.value || '',
      hf: qs('input[name="extraHfOption"]:checked')?.value || '',
      af: qs('input[name="extraAfOption"]:checked')?.value || '',
      cerebrovascular: qs('#extra-cerebro').checked,
      pad: qs('#extra-pad').checked,
      copdAsthma: qs('#extra-copd').checked,
      osa: qs('#extra-osa').checked,
      resistant: qs('#extra-resistant').checked,
      pregnancy: qs('#extra-pregnancy').checked,
      ed: qs('#extra-ed').checked,
      coc: qs('#drug-coc').checked,
      menopauseTherapy: qs('#drug-mht').checked,
      oncoTherapy: qs('input[name="drugOncoOption"]:checked')?.value || '',
    },
    frailtyResult,
    cha2,
    cha2Result,
    therapyMode: qs('input[name="therapyMode"]:checked')?.value || 'start',
    currentTherapyClasses: collectSelectedTherapyClasses(),
    targetNotAchieved: qs('#target-not-achieved')?.checked || false,
  };
}

function saveAndGoToResults() {
  const data = collectData();
  const result = evaluatePatient(data);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  localStorage.setItem(RESULT_KEY, JSON.stringify(result));
  window.location.href = './result.html';
}

function bindIndexPage() {
  buildCurrentTherapyChips();

  ['#age', '#sbp', '#dbp'].forEach((sel) => qs(sel).addEventListener('input', () => {
    renderRiskFactorAutoLabels();
    updateBpCategory();
    updateScoreImage();
    syncAdditionalVisibility();
    syncAutoCha2();
  }));
  qsa('input[name="sex"]').forEach((el) => el.addEventListener('change', () => {
    renderRiskFactorAutoLabels();
    syncAdditionalVisibility();
    syncAutoCha2();
  }));

  qs('#stage-mode').addEventListener('change', syncStageVisibility);
  qs('#risk-mode').addEventListener('change', syncRiskVisibility);
  qsa('input[name="riskAutoMethod"]').forEach((el) => el.addEventListener('change', syncRiskVisibility));
  ['#cr-dm', '#cr-ckd', '#cr-major-risk'].forEach((sel) => qs(sel).addEventListener('change', syncClinicalRiskSubsections));

  ['#extra-ckd', '#extra-ihd', '#extra-hf', '#extra-af', '#drug-onco', '#extra-pregnancy', '#extra-ed', '#drug-coc', '#drug-mht', '#extra-dm', '#extra-cerebro', '#extra-pad', '#extra-copd', '#extra-osa', '#extra-resistant'].forEach((sel) => {
    const el = qs(sel);
    if (el) el.addEventListener('change', syncAdditionalVisibility);
  });
  qsa('input[name="therapyMode"]').forEach((el) => el.addEventListener('change', syncTherapyVisibility));

  qs('#frailty-toggle').addEventListener('click', () => {
    const panel = qs('#frailty-panel');
    show(panel, panel.hidden);
  });
  qs('#frailty-calc-btn').addEventListener('click', () => {
    const answers = qsa('.frailty-question input[type="checkbox"]').map((el) => el.checked);
    const result = calculateFrailtyResult(answers);
    const out = qs('#frailty-score');
    out.dataset.calculated = '1';
    out.textContent = `${result.score} балл(ов): ${result.text}`;
  });
  qs('#frailty-reset-btn').addEventListener('click', () => {
    qsa('.frailty-question input[type="checkbox"]').forEach((el) => el.checked = false);
    const out = qs('#frailty-score');
    out.dataset.calculated = '0';
    out.textContent = '';
    show(qs('#frailty-panel'), false);
  });

  qs('#cha2-toggle').addEventListener('click', () => {
    const panel = qs('#cha2-panel');
    show(panel, panel.hidden);
  });
  qs('#cha2-calc-btn').addEventListener('click', () => {
    const data = collectData();
    const result = calculateCha2(data);
    const out = qs('#cha2-result');
    out.dataset.calculated = '1';
    out.textContent = `Ожидаемая частота инсультов за год — ${result.annualRisk}% (сумма баллов: ${result.score})`;
  });
  qs('#cha2-reset-btn').addEventListener('click', () => {
    qsa('#cha2-panel input[type="checkbox"]:not([data-auto="1"])').forEach((el) => el.checked = false);
    const out = qs('#cha2-result');
    out.dataset.calculated = '0';
    out.textContent = '';
    show(qs('#cha2-panel'), false);
    syncAutoCha2();
  });

  qs('#submit-btn').addEventListener('click', saveAndGoToResults);

  renderRiskFactorAutoLabels();
  updateBpCategory();
  syncStageVisibility();
  syncRiskVisibility();
  syncClinicalRiskSubsections();
  syncAdditionalVisibility();
  syncTherapyVisibility();
  updateScoreImage();
  syncAutoCha2();
}

function syncAutoCha2() {
  const age = Number(qs('#age').value || 0);
  const sex = qs('input[name="sex"]:checked')?.value || '';
  const age75 = qs('#cha2-age75');
  const age6574 = qs('#cha2-age6574');
  const female = qs('#cha2-female');
  if (age75) age75.checked = age >= 75;
  if (age6574) age6574.checked = age >= 65 && age <= 74;
  if (female) female.checked = sex === 'female';
}

function restoreIndexData() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return;
  try {
    const data = JSON.parse(raw);
    qs('#age').value = data.age || '';
    qs(`#sex-${data.sex}`)?.click();
    qs('#sbp').value = data.sbp || '';
    qs('#dbp').value = data.dbp || '';
    qs('#stage-mode').value = data.stageMode || 'manual';
    qs('#stage-manual').value = data.stageManual || 'I';
    qs('#stage-diabetes').checked = !!data.stageCalc?.diabetes;
    qs('#stage-ckd').value = data.stageCalc?.ckd || 'none';

    qsa('input[name="stageOrgan"]').forEach((el) => el.checked = (data.stageCalc?.organFlags || []).includes(el.value));
    qsa('input[name="stageAssoc"]').forEach((el) => el.checked = (data.stageCalc?.associated || []).includes(el.value));
    qsa('input[name="stageRiskFactor"]').forEach((el) => el.checked = (data.stageCalc?.riskFactors || []).includes(el.value));

    qs('#risk-mode').value = data.riskMode || 'manual';
    qs('#risk-manual').value = data.riskManual || 'умеренный';
    qs(`input[name="riskAutoMethod"][value="${data.riskAutoMethod || 'score2'}"]`)?.click();
    qs('#score2-value').value = data.score2Value || '';

    qs('#cr-dm').checked = !!data.clinicalRisk?.dm;
    qs('#cr-dm-type').value = data.clinicalRisk?.dmType || 'type2';
    qs('#cr-dm-duration').value = data.clinicalRisk?.dmDuration || '';
    qs('#cr-dm-tod').checked = !!data.clinicalRisk?.dmTargetOrganDamage;
    qs('#cr-ckd').checked = (data.clinicalRisk?.ckdSeverity || '') !== '';
    qs('#cr-ckd-level').value = data.clinicalRisk?.ckdSeverity || 'moderate';
    qs('#cr-familial').checked = !!data.clinicalRisk?.familialHypercholNoRf;
    qs('#cr-major-risk').checked = !!data.clinicalRisk?.majorRiskFactors;
    qs('#cr-major-3rf').checked = !!data.clinicalRisk?.moreThan3RiskFactors;
    qs('#cr-documented').checked = !!data.clinicalRisk?.documentedAscvd;
    qs('#cr-imaging').checked = !!data.clinicalRisk?.imagingPlaque;
    qs('#cr-extreme').checked = !!data.clinicalRisk?.extremeCvdCombo;

    const extra = data.extra || {};
    ['dm','cerebrovascular','pad','copdAsthma','osa','resistant','pregnancy','ed','coc','menopauseTherapy'].forEach((key) => {
      const map = {
        dm:'#extra-dm', cerebrovascular:'#extra-cerebro', pad:'#extra-pad', copdAsthma:'#extra-copd', osa:'#extra-osa', resistant:'#extra-resistant', pregnancy:'#extra-pregnancy', ed:'#extra-ed', coc:'#drug-coc', menopauseTherapy:'#drug-mht'
      };
      if (qs(map[key])) qs(map[key]).checked = !!extra[key];
    });
    qs('#extra-ckd').checked = !!extra.ckd;
    qs('#extra-ihd').checked = !!extra.ihd;
    qs('#extra-hf').checked = !!extra.hf;
    qs('#extra-af').checked = !!extra.af;
    qs('#drug-onco').checked = !!extra.oncoTherapy;
    qs(`input[name="extraCkdOption"][value="${extra.ckd}"]`)?.click();
    qs(`input[name="extraIhdOption"][value="${extra.ihd}"]`)?.click();
    qs(`input[name="extraHfOption"][value="${extra.hf}"]`)?.click();
    qs(`input[name="extraAfOption"][value="${extra.af}"]`)?.click();
    qs(`input[name="drugOncoOption"][value="${extra.oncoTherapy}"]`)?.click();

    qs(`input[name="therapyMode"][value="${data.therapyMode || 'start'}"]`)?.click();
    qsa('#therapy-class-chips .chip').forEach((chip) => chip.classList.toggle('active', (data.currentTherapyClasses || []).includes(chip.dataset.key)));
    if (qs('#target-not-achieved')) qs('#target-not-achieved').checked = !!data.targetNotAchieved;
  } catch (e) {
    console.error(e);
  }
}

function renderExamples(examples) {
  if (!examples?.length) return '<div class="muted">Примеры препаратов не требуются для этого шага.</div>';
  return `<ul class="drug-list">${examples.map((x) => `<li><strong>${x.inn}</strong> — ${x.dose}</li>`).join('')}</ul>`;
}

function renderResultPage() {
  const raw = localStorage.getItem(RESULT_KEY);
  if (!raw) {
    qs('#result-root').innerHTML = '<div class="card"><p>Нет сохранённых данных. Вернитесь на первую страницу и заполните форму.</p><a class="button" href="./index.html">Вернуться</a></div>';
    return;
  }
  const result = JSON.parse(raw);
  let currentIndex = result.therapy.stepIndex || 0;

  const rerender = () => {
    const step = result.therapy.steps[currentIndex];
    const diagnosisText = result.degree
      ? `Диагноз АГ ${result.degree}-й степени, стадия ${result.stage}, риск ${result.risk}`
      : `Значения артериального давления соответствуют ${result.bpCategory.toLowerCase()} значениям, стадия ${result.stage}, риск ${result.risk}`;

    const recommendations = result.additional.recommendations;
    const warnings = [...result.additional.warnings, ...(step.warning ? [step.warning] : [])];
    const additionalTherapy = result.additional.additionalTherapy;

    qs('#result-root').innerHTML = `
      <section class="card">
        <h1>Результаты</h1>
        <div class="summary-line"><strong>Возраст / пол / АД:</strong> ${result.age} лет / ${result.sex === 'male' ? 'мужской' : 'женский'} / ${result.sbp}/${result.dbp} мм рт. ст.</div>
        <div class="summary-line"><strong>Диагноз:</strong> ${diagnosisText}</div>
        <div class="summary-line"><strong>Целевой уровень АД:</strong> САД ${result.target.sbp}; ДАД ${result.target.dbp}</div>
      </section>

      <section class="card">
        <h2>Рекомендуемая медикаментозная терапия</h2>
        ${['Нормальное','Высокое нормальное','Оптимальное'].includes(result.bpCategory) ? '<p><strong>Показаний для медикаментозной терапии нет.</strong></p>' : `
          <div class="summary-line"><strong>Вид терапии:</strong> ${result.therapy.typeLabel}</div>
          ${result.therapy.typeLabel === 'Корректировка терапии' ? `<div class="summary-line"><strong>Принимаемые препараты:</strong> ${result.therapy.currentTherapyLabel || 'не указаны'}</div>` : ''}
          <div class="summary-line"><strong>Клинический сценарий:</strong> ${result.scenario}</div>
          <div class="summary-line"><strong>Шаг терапии:</strong> ${step.name}</div>
          <div class="summary-line"><strong>Основная рекомендованная терапия:</strong> ${step.directText || step.text}</div>
          <div class="summary-line"><strong>Срок шага:</strong> ${result.therapy.timing}</div>
          <div class="summary-block"><strong>Примеры препаратов:</strong>${renderExamples(step.examples)}</div>
          <div class="nav-buttons">
            <button class="button secondary" id="prev-step" ${currentIndex === 0 ? 'disabled' : ''}>Предыдущий шаг терапии</button>
            <button class="button secondary" id="next-step" ${currentIndex >= result.therapy.steps.length - 1 ? 'disabled' : ''}>Следующий шаг терапии</button>
          </div>
        `}
      </section>

      <section class="card">
        <h2>Дополнительная информация по лечению</h2>
        ${recommendations.length ? `<div class="summary-block"><strong>Рекомендации:</strong><ul>${recommendations.map((x) => `<li>${x}</li>`).join('')}</ul></div>` : ''}
        ${warnings.length ? `<div class="summary-block warning"><strong>Предупреждение:</strong><ul>${warnings.map((x) => `<li>${x}</li>`).join('')}</ul></div>` : ''}
        ${additionalTherapy.length ? `<div class="summary-block"><strong>Дополнительная терапия:</strong><ul>${additionalTherapy.map((x) => `<li>${x}</li>`).join('')}</ul></div>` : ''}
        ${result.cha2Result ? `<div class="summary-block"><strong>CHA2DS2-VASc:</strong> ${result.cha2Result.score} балл(ов), ожидаемая частота инсультов за год — ${result.cha2Result.annualRisk}%</div>` : ''}
        ${result.frailtyResult ? `<div class="summary-block"><strong>Опросник старческой астении:</strong> ${result.frailtyResult.score} балл(ов), ${result.frailtyResult.text}</div>` : ''}
      </section>

      <div class="actions-row">
        <a class="button secondary" href="./index.html">Вернуться к форме</a>
      </div>
    `;

    qs('#prev-step')?.addEventListener('click', () => { if (currentIndex > 0) { currentIndex -= 1; rerender(); } });
    qs('#next-step')?.addEventListener('click', () => { if (currentIndex < result.therapy.steps.length - 1) { currentIndex += 1; rerender(); } });
  };

  rerender();
}

function init() {
  if (document.body.dataset.page === 'index') {
    bindIndexPage();
    restoreIndexData();
    renderRiskFactorAutoLabels();
    updateBpCategory();
    syncStageVisibility();
    syncRiskVisibility();
    syncClinicalRiskSubsections();
    syncAdditionalVisibility();
    syncTherapyVisibility();
    updateScoreImage();
  }
  if (document.body.dataset.page === 'result') {
    renderResultPage();
  }
}

document.addEventListener('DOMContentLoaded', init);
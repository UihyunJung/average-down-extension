import { getDefaultLanguage, setLanguage, getLanguage, applyI18n, t } from './i18n.js';
import {
  currencyConfig,
  calculateWater,
  calculateSliderMax,
  calculateReverse,
  scenarioPresets,
  sanitizeInput,
  formatCurrency,
  formatNumber,
  formatRate,
} from './calculator.js';
import { loadState, debouncedSave, flushPendingSave, saveState } from './storage.js';
import { checkPremium, openCheckout, restorePurchase, refreshStatus } from './subscription.js';

// State
let currency = 'USD';
let avgPrice = '';
let currentPrice = '';
let quantity = '';
let additionalQuantity = 0;
let targetAvg = '';
let isPremium = false;
let planType = null;
let expiresAt = null;
let subStatus = null;

// DOM refs
let els = {};

function getEl(id) {
  return document.getElementById(id);
}

function cacheElements() {
  els = {
    langSelect: getEl('lang-select'),
    btnReset: getEl('btn-reset'),
    inputAvgPrice: getEl('input-avg-price'),
    inputCurrentPrice: getEl('input-current-price'),
    inputQuantity: getEl('input-quantity'),
    unitAvgPrice: getEl('unit-avg-price'),
    unitCurrentPrice: getEl('unit-current-price'),
    unitQuantity: getEl('unit-quantity'),
    sliderSection: getEl('slider-section'),
    slider: getEl('slider'),
    sliderInput: getEl('slider-input'),
    sliderMax: getEl('slider-max'),
    resultsSection: getEl('results-section'),
    rateBefore: getEl('rate-before'),
    rateAfter: getEl('rate-after'),
    newAvgValue: getEl('new-avg-value'),
    totalShares: getEl('total-shares'),
    totalInvestment: getEl('total-investment'),
    additionalInvestment: getEl('additional-investment'),
    currencySelect: getEl('currency-select'),
    statusBadge: getEl('btn-status-badge'),
    upgradePanel: getEl('upgrade-panel'),
    btnMonthly: getEl('btn-monthly'),
    btnAnnual: getEl('btn-annual'),
    inputHint: getEl('input-hint'),
    upgradeMessage: getEl('upgrade-message'),
    btnVerify: getEl('btn-verify'),
    btnRestoreLink: getEl('btn-restore-link'),
    restoreSection: getEl('restore-section'),
    restoreEmail: getEl('restore-email'),
    btnRestoreConfirm: getEl('btn-restore-confirm'),
    btnRestoreCancel: getEl('btn-restore-cancel'),
    syncNotice: getEl('sync-notice'),
    proPanel: getEl('pro-panel'),
    proPanelText: getEl('pro-panel-text'),
    reverseSection: getEl('reverse-section'),
    inputTargetAvg: getEl('input-target-avg'),
    unitTargetAvg: getEl('unit-target-avg'),
    reverseShares: getEl('reverse-shares'),
    reverseInvestment: getEl('reverse-investment'),
    reverseHint: getEl('reverse-hint'),
    simulatorSection: getEl('simulator-section'),
    scenarioTable: getEl('scenario-table'),
    scenarioDesc: getEl('scenario-desc'),
    scenarioLockedMsg: getEl('scenario-locked-msg'),
    scenarioCells: {
      bear: { price: getEl('scenario-price-bear'), avg: getEl('scenario-avg-bear'), rate: getEl('scenario-rate-bear') },
      moderate: { price: getEl('scenario-price-moderate'), avg: getEl('scenario-avg-moderate'), rate: getEl('scenario-rate-moderate') },
      bull: { price: getEl('scenario-price-bull'), avg: getEl('scenario-avg-bull'), rate: getEl('scenario-rate-bull') },
    },
  };
}

function parseNum(str) {
  return Number(str.replace(/[^0-9.]/g, '')) || 0;
}

function isValid() {
  return parseNum(avgPrice) > 0 && parseNum(currentPrice) > 0 && parseNum(quantity) > 0;
}

function getSliderMax() {
  if (!isValid()) return 100;
  return calculateSliderMax(parseNum(avgPrice), parseNum(currentPrice), parseNum(quantity));
}

function getCurrentState() {
  return {
    avgPrice,
    currentPrice,
    quantity,
    additionalQuantity,
    targetAvg,
    currency,
    language: getLanguage(),
  };
}

function scheduleSave() {
  debouncedSave(getCurrentState());
}

function immediateSave() {
  saveState(getCurrentState());
}

function resetSlider() {
  additionalQuantity = 0;
  els.slider.value = 0;
  els.sliderInput.value = '';
}

function resetInputs() {
  avgPrice = '';
  currentPrice = '';
  quantity = '';
  targetAvg = '';
  resetSlider();
  els.inputAvgPrice.value = '';
  els.inputCurrentPrice.value = '';
  els.inputQuantity.value = '';
  els.inputTargetAvg.value = '';
}

function updatePremiumUI() {
  updateCurrencyDropdown();
  if (isPremium) {
    let label = t('pro');
    if (planType === 'month') label = t('monthlyLabel');
    else if (planType === 'year') label = t('annualLabel');

    let badgeText = '✓ ' + label;
    let dateStr = '';
    if (expiresAt) {
      const d = new Date(expiresAt);
      if (!isNaN(d.getTime())) {
        dateStr = (d.getUTCMonth() + 1) + '/' + d.getUTCDate();
        const suffix = subStatus === 'canceled' ? t('expires') : t('renews');
        badgeText += ' · ' + dateStr + ' ' + suffix;
      }
    }
    els.statusBadge.textContent = badgeText;
    els.statusBadge.className = 'status-badge status-pro';
    els.upgradePanel.classList.remove('visible');

    if (subStatus === 'canceled' && dateStr) {
      els.proPanelText.textContent = t('canceledNotice').replace('{date}', dateStr);
    } else {
      els.proPanelText.textContent = t('autoRenewNotice');
    }
  } else {
    els.statusBadge.textContent = t('free');
    els.statusBadge.className = 'status-badge status-free';
    els.proPanel.classList.remove('visible');
  }
}

function toggleUpgradePanel() {
  if (isPremium) {
    els.proPanel.classList.toggle('visible');
  } else {
    els.upgradePanel.classList.toggle('visible');
  }
}

function getErrorMessage() {
  if (!navigator.onLine) return t('offlineError');
  return t('networkError');
}

function showSyncNotice(failed) {
  if (failed) {
    els.syncNotice.textContent = t('syncFailed');
    els.syncNotice.classList.add('visible');
    setTimeout(() => els.syncNotice.classList.remove('visible'), 5000);
  } else {
    els.syncNotice.classList.remove('visible');
  }
}

function updateReverseUI() {
  const valid = isValid();
  els.reverseSection.classList.toggle('visible', valid);
  if (!valid) { els.reverseHint.textContent = ''; return; }

  const target = parseNum(targetAvg);
  if (!target) {
    els.reverseShares.textContent = '—';
    els.reverseInvestment.textContent = '—';
    els.reverseHint.textContent = '';
    return;
  }

  const result = calculateReverse(parseNum(avgPrice), parseNum(currentPrice), parseNum(quantity), target);
  if (result) {
    els.reverseShares.textContent = formatNumber(result.requiredShares, (currencyConfig[currency] || currencyConfig.USD).locale) + ' ' + t('shares');
    els.reverseInvestment.textContent = formatCurrency(result.additionalInvestment, currency);
    els.reverseHint.textContent = '';
  } else {
    els.reverseShares.textContent = '—';
    els.reverseInvestment.textContent = '—';
    if (target >= parseNum(avgPrice)) els.reverseHint.textContent = t('reverseAlready');
    else if (target <= parseNum(currentPrice)) els.reverseHint.textContent = t('reverseImpossible');
    else els.reverseHint.textContent = t('reverseInvalid');
  }
}

function updateSimulatorUI() {
  const valid = isValid();
  els.simulatorSection.classList.toggle('visible', valid);
  if (!valid) return;

  els.scenarioDesc.classList.toggle('visible', isPremium);
  els.scenarioTable.classList.toggle('visible', isPremium);
  els.scenarioLockedMsg.classList.toggle('visible', !isPremium);

  if (isPremium) renderScenarios();
}

function renderScenarios() {
  const avg = parseNum(avgPrice);
  const cur = parseNum(currentPrice);
  const qty = parseNum(quantity);

  scenarioPresets.forEach(preset => {
    const cells = els.scenarioCells[preset.key];
    const scenarioPrice = cur * (1 + preset.change);
    const result = calculateWater(avg, scenarioPrice, qty, additionalQuantity);

    cells.price.textContent = formatCurrency(scenarioPrice, currency);
    cells.avg.textContent = formatCurrency(result.newAveragePrice, currency);
    cells.rate.textContent = formatRate(result.afterReturnRate);
    cells.rate.className = 'scenario-rate ' + (result.afterReturnRate >= 0 ? 'positive' : 'negative');
  });
}

function updateUI() {
  const valid = isValid();
  const sliderMax = getSliderMax();

  els.sliderSection.classList.toggle('visible', valid);
  els.resultsSection.classList.toggle('visible', valid);
  updateReverseUI();
  updateSimulatorUI();

  if (!valid) return;

  els.slider.max = sliderMax;
  els.sliderMax.textContent = formatNumber(sliderMax) + ' ' + t('shares');

  if (additionalQuantity > sliderMax) {
    additionalQuantity = sliderMax;
    els.sliderInput.value = additionalQuantity || '';
  }
  els.slider.value = additionalQuantity;

  const result = calculateWater(
    parseNum(avgPrice),
    parseNum(currentPrice),
    parseNum(quantity),
    additionalQuantity
  );

  const beforePositive = result.beforeReturnRate >= 0;
  const afterPositive = result.afterReturnRate >= 0;

  els.rateBefore.textContent = (beforePositive ? '▲ ' : '▼ ') + formatRate(result.beforeReturnRate);
  els.rateBefore.className = 'rate-value ' + (beforePositive ? 'positive' : 'negative');

  els.rateAfter.textContent = (afterPositive ? '▲ ' : '▼ ') + formatRate(result.afterReturnRate);
  els.rateAfter.className = 'rate-value ' + (afterPositive ? 'positive' : 'negative');

  const config = currencyConfig[currency] || currencyConfig.USD;
  els.newAvgValue.textContent = formatCurrency(result.newAveragePrice, currency);
  els.totalShares.textContent = formatNumber(result.totalQuantity, config.locale) + ' ' + t('shares');
  els.totalInvestment.textContent = formatCurrency(result.totalInvestment, currency);
  els.additionalInvestment.textContent = formatCurrency(result.additionalInvestment, currency);
}

function bindInputEvents() {
  els.inputAvgPrice.addEventListener('input', (e) => {
    avgPrice = sanitizeInput(e.target.value, currency);
    e.target.value = avgPrice;
    resetSlider();
    updateUI();
    scheduleSave();
  });

  els.inputCurrentPrice.addEventListener('input', (e) => {
    currentPrice = sanitizeInput(e.target.value, currency);
    e.target.value = currentPrice;
    resetSlider();
    updateUI();
    scheduleSave();
  });

  els.inputQuantity.addEventListener('input', (e) => {
    quantity = e.target.value.replace(/[^0-9]/g, '').replace(/^0+(?=\d)/, '');
    e.target.value = quantity;
    resetSlider();
    updateUI();
    scheduleSave();
  });

  els.slider.addEventListener('input', (e) => {
    additionalQuantity = Number(e.target.value);
    els.sliderInput.value = additionalQuantity || '';
    updateUI();
    scheduleSave();
  });

  els.sliderInput.addEventListener('input', (e) => {
    const val = Number(e.target.value.replace(/[^0-9]/g, '')) || 0;
    const max = getSliderMax();
    additionalQuantity = Math.min(val, max);
    els.slider.value = additionalQuantity;
    updateUI();
    scheduleSave();
  });

  els.inputTargetAvg.addEventListener('input', (e) => {
    targetAvg = sanitizeInput(e.target.value, currency);
    e.target.value = targetAvg;
    updateReverseUI();
    scheduleSave();
  });

  els.btnReset.addEventListener('click', () => {
    resetInputs();
    updateUI();
    immediateSave();
  });

  els.langSelect.addEventListener('change', (e) => {
    setLanguage(e.target.value);
    applyI18n();
    updatePremiumUI();
    updateCurrencyUI();
    updateUI();
    // 동적 메시지 초기화 (언어 변경 시 구 언어 텍스트 잔류 방지)
    els.upgradeMessage.textContent = '';
    immediateSave();
  });

  // Currency
  els.currencySelect.addEventListener('change', (e) => {
    const newCurrency = e.target.value;
    const config = currencyConfig[newCurrency] || currencyConfig.USD;

    if (config.premium && !isPremium) {
      els.currencySelect.value = currency;
      els.upgradePanel.classList.add('visible');
      return;
    }

    els.upgradePanel.classList.remove('visible');
    currency = newCurrency;
    resetInputs();
    updateCurrencyUI();
    updateUI();
    immediateSave();
  });

  // Plan buttons → open checkout
  async function handleCheckout(plan) {
    try {
      await openCheckout(plan);
    } catch {
      els.upgradeMessage.textContent = t('checkoutError');
      els.upgradeMessage.className = 'restore-message error';
    }
  }
  els.btnMonthly.addEventListener('click', () => handleCheckout('monthly'));
  els.btnAnnual.addEventListener('click', () => handleCheckout('annual'));

  // Verify purchase
  els.btnVerify.addEventListener('click', async (e) => {
    e.preventDefault();
    els.upgradeMessage.textContent = '';
    els.restoreSection.classList.remove('visible');
    els.btnVerify.textContent = t('verifying');
    try {
      const result = await refreshStatus();
      isPremium = result.premium;
      planType = result.planType;
      expiresAt = result.expiresAt;
      subStatus = result.status;
      updatePremiumUI();
      updateUI();
      if (result.premium) {
        els.upgradeMessage.textContent = t('restoreSuccess');
        els.upgradeMessage.className = 'restore-message success';
      } else {
        els.upgradeMessage.textContent = t('verifyNotFound');
        els.upgradeMessage.className = 'restore-message error';
      }
    } catch {
      els.upgradeMessage.textContent = getErrorMessage();
      els.upgradeMessage.className = 'restore-message error';
    }
    els.btnVerify.textContent = t('verifyPurchase');
  });

  // Badge click → toggle upgrade panel
  els.statusBadge.addEventListener('click', () => {
    toggleUpgradePanel();
  });

  // Restore purchase link
  els.btnRestoreLink.addEventListener('click', () => {
    els.upgradeMessage.textContent = '';
    els.restoreSection.classList.add('visible');
    els.restoreEmail.focus();
  });

  // Restore confirm
  els.btnRestoreConfirm.addEventListener('click', async () => {
    const email = els.restoreEmail.value.trim();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      els.upgradeMessage.textContent = t('invalidEmail');
      els.upgradeMessage.className = 'restore-message error';
      return;
    }

    els.btnRestoreConfirm.disabled = true;
    els.upgradeMessage.textContent = t('verifying');
    els.upgradeMessage.className = 'restore-message';

    try {
      const result = await restorePurchase(email);
      if (result.restored) {
        isPremium = true;
        updatePremiumUI();
        updateUI();
        els.upgradeMessage.textContent = t('restoreSuccess');
        els.upgradeMessage.className = 'restore-message success';
      } else {
        const reason = result.reason === 'cooldown' ? t('cooldownMessage') : t('restoreFail');
        els.upgradeMessage.textContent = reason;
        els.upgradeMessage.className = 'restore-message error';
      }
    } catch {
      els.upgradeMessage.textContent = getErrorMessage();
      els.upgradeMessage.className = 'restore-message error';
    }
    els.btnRestoreConfirm.disabled = false;
  });

  // Restore cancel
  els.btnRestoreCancel.addEventListener('click', () => {
    els.restoreSection.classList.remove('visible');
    els.upgradeMessage.textContent = '';
  });

  // Storage change listener — background updates premium
  chrome.storage.onChanged.addListener((changes) => {
    if (changes.avgdown_premium) {
      isPremium = changes.avgdown_premium.newValue === true;
    }
    if (changes.avgdown_plan_type) {
      planType = changes.avgdown_plan_type.newValue || null;
    }
    if (changes.avgdown_expires_at) {
      expiresAt = changes.avgdown_expires_at.newValue || null;
    }
    if (changes.avgdown_sub_status) {
      subStatus = changes.avgdown_sub_status.newValue || null;
    }
    if (changes.avgdown_premium || changes.avgdown_plan_type || changes.avgdown_expires_at || changes.avgdown_sub_status) {
      updatePremiumUI();
      updateUI();
    }
    if (changes.avgdown_sync_failed) {
      showSyncNotice(changes.avgdown_sync_failed.newValue === true);
    }
  });

  // Flush on popup close
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      flushPendingSave(getCurrentState());
    }
  });
  window.addEventListener('pagehide', () => {
    flushPendingSave(getCurrentState());
  });

  // Keyboard: Enter moves to next field
  const fields = [els.inputAvgPrice, els.inputCurrentPrice, els.inputQuantity];
  fields.forEach((field, i) => {
    field.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && i < fields.length - 1) {
        e.preventDefault();
        fields[i + 1].focus();
      }
    });
  });
}

function updateCurrencyDropdown() {
  const options = els.currencySelect.options;
  for (const opt of options) {
    const config = currencyConfig[opt.value] || currencyConfig.USD;
    if (config.premium && !isPremium) {
      opt.textContent = `${opt.value} (${config.symbol}) 🔒`;
    } else {
      opt.textContent = `${opt.value} (${config.symbol})`;
    }
  }
}

function updateCurrencyUI() {
  const config = currencyConfig[currency] || currencyConfig.USD;
  els.unitAvgPrice.textContent = config.symbol;
  els.unitCurrentPrice.textContent = config.symbol;
  els.inputAvgPrice.placeholder = config.placeholder;
  els.inputCurrentPrice.placeholder = currency === 'KRW' ? '40000' : currency === 'JPY' ? '12000' : config.placeholder;

  const mode = config.decimals === 0 ? 'numeric' : 'decimal';
  els.inputAvgPrice.inputMode = mode;
  els.inputCurrentPrice.inputMode = mode;

  els.inputHint.classList.toggle('visible', config.decimals > 0);

  els.unitTargetAvg.textContent = config.symbol;
  els.inputTargetAvg.placeholder = currency === 'KRW' ? '40000' : currency === 'JPY' ? '12000' : config.placeholder;
  els.inputTargetAvg.inputMode = mode;
}

async function init() {
  cacheElements();

  // Restore saved state
  const saved = await loadState();
  if (saved) {
    avgPrice = typeof saved.avgPrice === 'string' ? saved.avgPrice : '';
    currentPrice = typeof saved.currentPrice === 'string' ? saved.currentPrice : '';
    quantity = typeof saved.quantity === 'string' ? saved.quantity : '';
    additionalQuantity = typeof saved.additionalQuantity === 'number' ? saved.additionalQuantity : 0;
    currency = typeof saved.currency === 'string' && currencyConfig[saved.currency] ? saved.currency : 'USD';

    targetAvg = typeof saved.targetAvg === 'string' ? saved.targetAvg : '';

    els.inputAvgPrice.value = avgPrice;
    els.inputCurrentPrice.value = currentPrice;
    els.inputQuantity.value = quantity;
    els.slider.value = additionalQuantity;
    els.sliderInput.value = additionalQuantity || '';
    els.inputTargetAvg.value = targetAvg;
  }

  // Premium check from chrome.storage (cached by background)
  isPremium = await checkPremium();

  // 저장된 구독 정보 읽기
  const subInfo = await chrome.storage.local.get(['avgdown_plan_type', 'avgdown_expires_at', 'avgdown_sub_status']);
  planType = subInfo.avgdown_plan_type || null;
  expiresAt = subInfo.avgdown_expires_at || null;
  subStatus = subInfo.avgdown_sub_status || null;

  // 팝업 열 때마다 백그라운드에 즉시 상태 체크 요청 (결제 후 자동 반영)
  refreshStatus().then((result) => {
    if (result.premium !== isPremium || result.planType !== planType || result.expiresAt !== expiresAt || result.status !== subStatus) {
      isPremium = result.premium;
      planType = result.planType;
      expiresAt = result.expiresAt;
      subStatus = result.status;
      updatePremiumUI();
      updateUI();
    }
  }).catch(() => {});

  // Check sync status
  const { avgdown_sync_failed } = await chrome.storage.local.get('avgdown_sync_failed');
  showSyncNotice(avgdown_sync_failed === true);

  // Verify saved currency is accessible
  if (currencyConfig[currency]?.premium && !isPremium) {
    currency = 'USD';
  }
  els.currencySelect.value = currency;

  // Language (updatePremiumUI보다 먼저 설정 — 뱃지 텍스트가 올바른 언어로 렌더되도록)
  const lang = saved?.language || getDefaultLanguage();
  setLanguage(lang);
  els.langSelect.value = lang;

  // Apply
  applyI18n();
  updatePremiumUI();
  updateCurrencyUI();
  updateUI();
  bindInputEvents();
}

document.addEventListener('DOMContentLoaded', init);

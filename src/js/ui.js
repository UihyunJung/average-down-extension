import { getDefaultLanguage, setLanguage, getLanguage, applyI18n, t } from './i18n.js';
import {
  currencyConfig,
  calculateWater,
  calculateSliderMax,
  sanitizeInput,
  formatCurrency,
  formatNumber,
  formatRate,
} from './calculator.js';
import { loadState, debouncedSave, flushPendingSave, saveState } from './storage.js';
// TODO: Re-enable when ExtensionPay Stripe Connect supports South Korea
// import { checkPremium, openPaymentPage, onPaidStatusChange } from './subscription.js';

// State
let currency = 'USD';
let avgPrice = '';
let currentPrice = '';
let quantity = '';
let additionalQuantity = 0;
let isPremium = false;

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
    upgradeBanner: getEl('upgrade-banner'),
    inputHint: getEl('input-hint'),
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
  resetSlider();
  els.inputAvgPrice.value = '';
  els.inputCurrentPrice.value = '';
  els.inputQuantity.value = '';
}

function showUpgradeBanner() {
  els.upgradeBanner.classList.add('visible');
}

function hideUpgradeBanner() {
  els.upgradeBanner.classList.remove('visible');
}

function updateUI() {
  const valid = isValid();
  const sliderMax = getSliderMax();

  // Toggle visibility
  els.sliderSection.classList.toggle('visible', valid);
  els.resultsSection.classList.toggle('visible', valid);

  if (!valid) return;

  // Update slider max
  els.slider.max = sliderMax;
  els.sliderMax.textContent = formatNumber(sliderMax) + ' ' + t('shares');

  // Clamp additional quantity
  if (additionalQuantity > sliderMax) {
    additionalQuantity = sliderMax;
    els.slider.value = additionalQuantity;
    els.sliderInput.value = additionalQuantity || '';
  }

  // Calculate
  const result = calculateWater(
    parseNum(avgPrice),
    parseNum(currentPrice),
    parseNum(quantity),
    additionalQuantity
  );

  // Render return rates
  const beforePositive = result.beforeReturnRate >= 0;
  const afterPositive = result.afterReturnRate >= 0;

  els.rateBefore.textContent = (beforePositive ? '▲ ' : '▼ ') + formatRate(result.beforeReturnRate);
  els.rateBefore.className = 'rate-value ' + (beforePositive ? 'positive' : 'negative');

  els.rateAfter.textContent = (afterPositive ? '▲ ' : '▼ ') + formatRate(result.afterReturnRate);
  els.rateAfter.className = 'rate-value ' + (afterPositive ? 'positive' : 'negative');

  // Render results
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

  // Slider
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

  // Reset
  els.btnReset.addEventListener('click', () => {
    resetInputs();
    updateUI();
    immediateSave();
  });

  // Language
  els.langSelect.addEventListener('change', (e) => {
    setLanguage(e.target.value);
    applyI18n();
    updateCurrencyUI();
    updateUI();
    immediateSave();
  });

  // Currency
  els.currencySelect.addEventListener('change', (e) => {
    const newCurrency = e.target.value;
    const config = currencyConfig[newCurrency] || currencyConfig.USD;

    if (config.premium && !isPremium) {
      els.currencySelect.value = currency;
      showUpgradeBanner();
      return;
    }

    hideUpgradeBanner();
    currency = newCurrency;
    resetInputs();
    updateCurrencyUI();
    updateUI();
    immediateSave();
  });

  // TODO: Re-enable when ExtensionPay Stripe Connect supports South Korea
  // els.upgradeBanner.addEventListener('click', () => { openPaymentPage(); });

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
  hideUpgradeBanner();
}

function updateCurrencyUI() {
  const config = currencyConfig[currency] || currencyConfig.USD;
  els.unitAvgPrice.textContent = config.symbol;
  els.unitCurrentPrice.textContent = config.symbol;
  els.inputAvgPrice.placeholder = config.placeholder;
  els.inputCurrentPrice.placeholder = currency === 'KRW' ? '40000' : currency === 'JPY' ? '12000' : config.placeholder;

  // Sync inputMode with currency decimals
  const mode = config.decimals === 0 ? 'numeric' : 'decimal';
  els.inputAvgPrice.inputMode = mode;
  els.inputCurrentPrice.inputMode = mode;

  // Show inputHint only for decimal currencies
  els.inputHint.classList.toggle('visible', config.decimals > 0);
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

    els.inputAvgPrice.value = avgPrice;
    els.inputCurrentPrice.value = currentPrice;
    els.inputQuantity.value = quantity;
    els.slider.value = additionalQuantity;
    els.sliderInput.value = additionalQuantity || '';
  }

  // TODO: Re-enable when ExtensionPay Stripe Connect supports South Korea
  // isPremium = await checkPremium();
  // onPaidStatusChange(() => { isPremium = true; updateCurrencyDropdown(); hideUpgradeBanner(); });

  // Verify saved currency is accessible (free version: USD only)
  if (currencyConfig[currency]?.premium && !isPremium) {
    currency = 'USD';
  }
  els.currencySelect.value = currency;
  updateCurrencyDropdown();

  // Language (from saved state or browser default)
  const lang = saved?.language || getDefaultLanguage();
  setLanguage(lang);
  els.langSelect.value = lang;

  // Apply
  applyI18n();
  updateCurrencyUI();
  updateUI();
  bindInputEvents();
}

document.addEventListener('DOMContentLoaded', init);

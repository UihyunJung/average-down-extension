import en from '../i18n/en.json';
import ko from '../i18n/ko.json';
import ja from '../i18n/ja.json';
import zhCN from '../i18n/zh-CN.json';
import zhTW from '../i18n/zh-TW.json';
import de from '../i18n/de.json';
import es from '../i18n/es.json';
import pt from '../i18n/pt.json';

const translations = { en, ko, ja, 'zh-CN': zhCN, 'zh-TW': zhTW, de, es, pt };
const supportedLanguages = ['en', 'ko', 'ja', 'zh-CN', 'zh-TW', 'de', 'es', 'pt'];

let currentLang = 'en';

export function getDefaultLanguage() {
  const lang = navigator.language;
  if (lang.startsWith('ko')) return 'ko';
  if (lang.startsWith('ja')) return 'ja';
  if (lang === 'zh-TW' || lang === 'zh-Hant') return 'zh-TW';
  if (lang.startsWith('zh')) return 'zh-CN';
  if (lang.startsWith('de')) return 'de';
  if (lang.startsWith('es')) return 'es';
  if (lang.startsWith('pt')) return 'pt';
  return 'en';
}

export function setLanguage(lang) {
  if (supportedLanguages.includes(lang)) {
    currentLang = lang;
  }
}

export function getLanguage() {
  return currentLang;
}

export function getSupportedLanguages() {
  return supportedLanguages;
}

export function t(key) {
  const result = translations[currentLang]?.[key] ?? translations.en[key];
  if (result === undefined) {
    if (import.meta.env.DEV) console.warn(`Missing i18n key: "${key}"`);
    return key;
  }
  return result;
}

export function applyI18n() {
  document.querySelectorAll('[data-i18n]').forEach((el) => {
    const key = el.getAttribute('data-i18n');
    el.textContent = t(key);
  });
  document.querySelectorAll('[data-i18n-placeholder]').forEach((el) => {
    const key = el.getAttribute('data-i18n-placeholder');
    el.placeholder = t(key);
  });
  document.querySelectorAll('[data-i18n-aria]').forEach((el) => {
    const key = el.getAttribute('data-i18n-aria');
    el.setAttribute('aria-label', t(key));
  });
}

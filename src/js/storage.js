const STORAGE_KEY = 'avgdown_state';

let pendingSave = null;

function getStorage() {
  return typeof chrome !== 'undefined' && chrome.storage
    ? chrome.storage.local
    : null;
}

export async function loadState() {
  const storage = getStorage();
  if (!storage) {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (err) {
      console.warn('Failed to load from localStorage:', err);
      return null;
    }
  }

  return new Promise((resolve) => {
    storage.get(STORAGE_KEY, (data) => {
      resolve(data[STORAGE_KEY] || null);
    });
  });
}

export function saveState(state) {
  const storage = getStorage();
  if (!storage) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    return;
  }
  storage.set({ [STORAGE_KEY]: state });
}

export function debouncedSave(state, delay = 300) {
  if (pendingSave) clearTimeout(pendingSave);
  pendingSave = setTimeout(() => {
    saveState(state);
    pendingSave = null;
  }, delay);
}

export function flushPendingSave(state) {
  if (pendingSave) {
    clearTimeout(pendingSave);
    pendingSave = null;
    saveState(state);
  }
}

const PORTFOLIO_KEY = 'avgdown_portfolio';

export async function loadPortfolio() {
  const storage = getStorage();
  let data;
  if (!storage) {
    try {
      const raw = localStorage.getItem(PORTFOLIO_KEY);
      data = raw ? JSON.parse(raw) : [];
    } catch {
      data = [];
    }
  } else {
    data = await new Promise((resolve) => {
      storage.get(PORTFOLIO_KEY, (result) => {
        resolve(result[PORTFOLIO_KEY] || []);
      });
    });
  }

  if (!Array.isArray(data)) return [];
  return data.map(item => ({
    id: item.id || Date.now().toString(36),
    name: String(item.name || ''),
    avgPrice: String(item.avgPrice || ''),
    currentPrice: String(item.currentPrice || ''),
    quantity: String(item.quantity || ''),
    targetAvg: String(item.targetAvg ?? ''),
    currency: String(item.currency || 'USD'),
    savedAt: item.savedAt || new Date().toISOString(),
  }));
}

export function savePortfolio(portfolio) {
  const storage = getStorage();
  if (!storage) {
    localStorage.setItem(PORTFOLIO_KEY, JSON.stringify(portfolio));
    return;
  }
  storage.set({ [PORTFOLIO_KEY]: portfolio });
}

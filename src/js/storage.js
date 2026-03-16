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

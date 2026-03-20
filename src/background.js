import { API_BASE } from './js/config.js';

// === onInstalled: install ID 생성 + 알람 생성 + 즉시 체크 ===
chrome.runtime.onInstalled.addListener(async () => {
  const { avgdown_install_id } = await chrome.storage.local.get('avgdown_install_id');
  if (!avgdown_install_id) {
    await chrome.storage.local.set({
      avgdown_install_id: crypto.randomUUID(),
      avgdown_premium: false,
    });
  }
  chrome.alarms.create('check-premium', { periodInMinutes: 30 });
  await checkStatus();
});

// === onStartup: 브라우저 시작 시 즉시 체크 ===
chrome.runtime.onStartup.addListener(async () => {
  await checkStatus();
});

// === onAlarm: 30분 주기 체크 ===
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'check-premium') checkStatus();
});

// === 메시지 리스너: 팝업에서 즉시 상태 확인 요청 ===
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === 'check-status') {
    checkStatus().then(async () => {
      const { avgdown_premium } = await chrome.storage.local.get('avgdown_premium');
      sendResponse({ premium: avgdown_premium });
    });
    return true; // 비동기 응답 허용
  }
});

// === 상태 체크 함수 ===
async function checkStatus() {
  try {
    const { avgdown_install_id } = await chrome.storage.local.get('avgdown_install_id');
    if (!avgdown_install_id) return;
    const res = await fetch(`${API_BASE}/api/status?id=${avgdown_install_id}`);
    if (!res.ok) throw new Error('API error');
    const { premium } = await res.json();
    await chrome.storage.local.set({ avgdown_premium: premium, avgdown_sync_failed: false });
  } catch {
    await chrome.storage.local.set({ avgdown_sync_failed: true });
  }
}

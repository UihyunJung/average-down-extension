import { API_BASE } from './js/config.js';

// === onInstalled: install ID 생성 + 알람 생성 + 즉시 체크 ===
chrome.runtime.onInstalled.addListener(async () => {
  const { avgdown_install_id } = await chrome.storage.local.get('avgdown_install_id');
  if (!avgdown_install_id) {
    await chrome.storage.local.set({
      avgdown_install_id: crypto.randomUUID(),
      avgdown_premium: false,
      avgdown_plan_type: null,
      avgdown_expires_at: null,
      avgdown_sub_status: null,
    });
  }
  chrome.alarms.create('check-premium', { periodInMinutes: 30 });
  await checkStatus(true);
});

// === onStartup: 브라우저 시작 시 즉시 체크 ===
chrome.runtime.onStartup.addListener(async () => {
  await checkStatus(true);
});

// === onAlarm: 30분 주기 체크 ===
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'check-premium') checkStatus(true);
});

// === 메시지 리스너: 팝업에서 즉시 상태 확인 요청 ===
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === 'check-status') {
    checkStatus(msg.force === true).then(async () => {
      const { avgdown_premium, avgdown_plan_type, avgdown_expires_at, avgdown_sub_status } =
        await chrome.storage.local.get(['avgdown_premium', 'avgdown_plan_type', 'avgdown_expires_at', 'avgdown_sub_status']);
      sendResponse({ premium: avgdown_premium, planType: avgdown_plan_type, expiresAt: avgdown_expires_at, status: avgdown_sub_status });
    });
    return true; // 비동기 응답 허용
  }
});

// === 상태 체크 함수 (5분 캐시) ===
let lastCheckTime = 0;
const CHECK_CACHE_TTL = 5 * 60 * 1000;

async function checkStatus(force = false) {
  const now = Date.now();
  if (!force && now - lastCheckTime < CHECK_CACHE_TTL) return;
  lastCheckTime = now;
  try {
    const { avgdown_install_id } = await chrome.storage.local.get('avgdown_install_id');
    if (!avgdown_install_id) return;
    const res = await fetch(`${API_BASE}/api/status?id=${avgdown_install_id}`);
    if (!res.ok) throw new Error('API error');
    const { premium, planType, expiresAt, status } = await res.json();
    await chrome.storage.local.set({
      avgdown_premium: premium,
      avgdown_plan_type: planType,
      avgdown_expires_at: expiresAt,
      avgdown_sub_status: status,
      avgdown_sync_failed: false,
    });
  } catch {
    await chrome.storage.local.set({ avgdown_sync_failed: true });
  }
}

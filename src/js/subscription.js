import { API_BASE } from './config.js';

// chrome.storage에서 캐시된 프리미엄 상태 읽기
export async function checkPremium() {
  const { avgdown_premium } = await chrome.storage.local.get('avgdown_premium');
  return avgdown_premium === true;
}

// chrome.storage에서 install ID 읽기
export async function getInstallId() {
  const { avgdown_install_id } = await chrome.storage.local.get('avgdown_install_id');
  return avgdown_install_id || null;
}

// 체크아웃 URL 생성 → 새 탭에서 열기
export async function openCheckout(plan = 'monthly') {
  const installId = await getInstallId();
  if (!installId) throw new Error('Install ID not found');

  const res = await fetch(`${API_BASE}/api/create-checkout`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ installId, plan, app: 'avgdown' }),
  });

  if (!res.ok) throw new Error('Failed to create checkout');

  const data = await res.json();
  if (data.checkoutUrl) {
    chrome.tabs.create({ url: data.checkoutUrl });
  } else {
    throw new Error('No checkout URL returned');
  }
}

// 이메일로 구매 복원
export async function restorePurchase(email) {
  const installId = await getInstallId();
  if (!installId) return { restored: false, reason: 'no_install_id' };

  const res = await fetch(`${API_BASE}/api/restore`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: email.toLowerCase().trim(), newInstallId: installId }),
  });

  if (!res.ok) {
    if (res.status === 429) return { restored: false, reason: 'cooldown' };
    return { restored: false, reason: 'api_error' };
  }

  const data = await res.json();
  if (data.restored) {
    await refreshStatus();
  }
  return data;
}

// background에 즉시 상태 체크 요청 (결제 직후 사용)
export async function refreshStatus() {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage({ type: 'check-status' }, (response) => {
      resolve(response?.premium ?? false);
    });
  });
}

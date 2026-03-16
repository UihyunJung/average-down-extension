import ExtPay from 'extpay';

const extpay = ExtPay('kbhacjdeljmcmapfphelhifpjhihnekg');

export async function checkPremium() {
  try {
    const user = await extpay.getUser();
    return user.paid;
  } catch (err) {
    console.warn('Failed to check subscription:', err);
    return false;
  }
}

export function openPaymentPage() {
  extpay.openPaymentPage();
}

export function onPaidStatusChange(callback) {
  extpay.onPaid.addListener(callback);
}

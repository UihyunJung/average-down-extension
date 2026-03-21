export const currencyConfig = {
  USD: { symbol: '$', placeholder: '150.00', decimals: 2, locale: 'en-US', premium: false },
  KRW: { symbol: '₩', placeholder: '50000', decimals: 0, locale: 'ko-KR', premium: true },
  JPY: { symbol: '¥', placeholder: '15000', decimals: 0, locale: 'ja-JP', premium: true },
  EUR: { symbol: '€', placeholder: '140.00', decimals: 2, locale: 'de-DE', premium: true },
  GBP: { symbol: '£', placeholder: '120.00', decimals: 2, locale: 'en-GB', premium: true },
  CNY: { symbol: '¥', placeholder: '1000.00', decimals: 2, locale: 'zh-CN', premium: true },
  INR: { symbol: '₹', placeholder: '5000.00', decimals: 2, locale: 'en-IN', premium: true },
};

export function calculateWater(avgPrice, currentPrice, quantity, additionalQty) {
  const totalQuantity = quantity + additionalQty;
  const totalInvestment = avgPrice * quantity + currentPrice * additionalQty;
  const additionalInvestment = currentPrice * additionalQty;
  const newAveragePrice = totalQuantity > 0 ? totalInvestment / totalQuantity : 0;
  const beforeReturnRate = avgPrice > 0 ? ((currentPrice - avgPrice) / avgPrice) * 100 : 0;
  const afterReturnRate = newAveragePrice > 0 ? ((currentPrice - newAveragePrice) / newAveragePrice) * 100 : 0;

  return {
    newAveragePrice,
    totalQuantity,
    totalInvestment,
    additionalInvestment,
    beforeReturnRate,
    afterReturnRate,
  };
}

export function calculateSliderMax(avgPrice, currentPrice, quantity) {
  if (avgPrice === currentPrice) return 100;

  const returnRatio = (currentPrice - avgPrice) / avgPrice;
  if (Math.abs(returnRatio) <= 0.01) return Math.max(quantity, 100);

  const targetRate = returnRatio > 0 ? 0.01 : -0.01;
  const maxQty = Math.ceil(
    quantity * (currentPrice - avgPrice * (1 + targetRate)) / (targetRate * currentPrice)
  );

  if (!isFinite(maxQty) || isNaN(maxQty)) return Math.max(quantity, 100);
  return Math.max(Math.min(maxQty, 1000000), 1);
}

export function sanitizeInput(value, currency) {
  const config = currencyConfig[currency] || currencyConfig.USD;
  let cleaned = value.replace(/\s/g, '');

  if (config.decimals === 0) {
    // Integer currencies (KRW, JPY): strip everything except digits
    cleaned = cleaned.replace(/[^0-9]/g, '');
    return cleaned.replace(/^0+(?=\d)/, '');
  }

  // Decimal currencies (USD, EUR, GBP): intelligent comma handling
  if (cleaned.includes(',') && cleaned.includes('.')) {
    // Both present: comma is thousand separator → strip commas
    cleaned = cleaned.replace(/,/g, '');
  } else if (cleaned.includes(',')) {
    const commaCount = (cleaned.match(/,/g) || []).length;
    if (commaCount === 1) {
      // Single comma, no period → treat as decimal separator
      cleaned = cleaned.replace(',', '.');
    } else {
      // Multiple commas → thousand separators → strip
      cleaned = cleaned.replace(/,/g, '');
    }
  }

  // Keep only digits and period
  cleaned = cleaned.replace(/[^0-9.]/g, '');

  // Handle multiple periods: keep only first
  const parts = cleaned.split('.');
  const intPart = (parts[0] || '').replace(/^0+(?=\d)/, '') || parts[0];
  if (parts.length <= 1) return intPart;

  const decPart = parts.slice(1).join('').slice(0, config.decimals);
  return `${intPart}.${decPart}`;
}

export function formatCurrency(value, currency) {
  const config = currencyConfig[currency] || currencyConfig.USD;
  try {
    return new Intl.NumberFormat(config.locale, {
      style: 'currency',
      currency,
      minimumFractionDigits: config.decimals,
      maximumFractionDigits: config.decimals,
    }).format(value);
  } catch {
    return `${config.symbol}${value.toFixed(config.decimals)}`;
  }
}

export function formatNumber(value, locale = 'en-US') {
  try {
    return Math.round(value).toLocaleString(locale);
  } catch {
    return String(Math.round(value));
  }
}

export function formatRate(value) {
  return value >= 0 ? `+${value.toFixed(2)}%` : `${value.toFixed(2)}%`;
}

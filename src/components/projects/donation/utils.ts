export function formatCurrency(amount: number): string {
  return `₴${amount.toLocaleString('uk-UA')}`;
}

// 紧凑金额：≥1M → "1.2M ₴"，≥1K → "850K ₴"，否则全量数字 + 符号后缀
export function formatCompactAmount(amount: number, currency: string): string {
  const symbol = currency === 'UAH' ? '₴' : currency;
  if (amount >= 1_000_000) {
    const m = amount / 1_000_000;
    return `${m % 1 === 0 ? m.toFixed(0) : m.toFixed(1)}M ${symbol}`;
  }
  if (amount >= 1_000) {
    const k = amount / 1_000;
    return `${k % 1 === 0 ? k.toFixed(0) : k.toFixed(1)}K ${symbol}`;
  }
  return `${amount.toLocaleString('en-US')} ${symbol}`;
}

// Stripe buy button — publishable key 是公开值，可以直接放在前端 bundle
export const STRIPE_BUY_BUTTON_ID = 'buy_btn_1TMbgmG9LnRczdGMXXd5jvOV';
export const STRIPE_PUBLISHABLE_KEY =
  'pk_live_51MuwqQG9LnRczdGMOiaXL3lFvyGgzcTZuyhnqWFTUKg51EJ2SwIro9A79zSjGVi2hq0mFx5eiN9FFC5NdFNVwrri00OVgHW6xp';

export type DonationView = 'method' | 'stripe';
export type DonationDirection = 'forward' | 'backward';

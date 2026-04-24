export function formatCurrency(amount: number): string {
  return `₴${amount.toLocaleString('uk-UA')}`;
}

// Stripe buy button — publishable key 是公开值，可以直接放在前端 bundle
export const STRIPE_BUY_BUTTON_ID = 'buy_btn_1TMbgmG9LnRczdGMXXd5jvOV';
export const STRIPE_PUBLISHABLE_KEY =
  'pk_live_51MuwqQG9LnRczdGMOiaXL3lFvyGgzcTZuyhnqWFTUKg51EJ2SwIro9A79zSjGVi2hq0mFx5eiN9FFC5NdFNVwrri00OVgHW6xp';

export type DonationView = 'method' | 'stripe';
export type DonationDirection = 'forward' | 'backward';

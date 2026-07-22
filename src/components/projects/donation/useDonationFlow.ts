'use client';

import { useState } from 'react';
import { type DonationView, type DonationDirection } from './utils';
import { track } from '@/lib/fbpixel';

// 捐赠 panel 的视图状态机：method → stripe，支持 back
export function useDonationFlow() {
  const [view, setView] = useState<DonationView>('method');
  const [direction, setDirection] = useState<DonationDirection>('forward');

  function goToStripe() {
    track('InitiateCheckout', { payment_method: 'stripe' });
    setDirection('forward');
    setView('stripe');
  }

  function back() {
    setDirection('backward');
    setView('method');
  }

  const animationClass =
    direction === 'forward' ? 'animate-panel-forward' : 'animate-panel-backward';

  return { view, animationClass, goToStripe, back };
}

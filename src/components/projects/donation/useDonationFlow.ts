'use client';

import { useState } from 'react';
import { type DonationView, type DonationDirection } from './utils';

// 捐赠 panel 的多视图状态机：amount → method → stripe，支持 back
export function useDonationFlow() {
  const [selectedAmount, setSelectedAmount] = useState<number | null>(500);
  const [customAmount, setCustomAmount] = useState('');
  const [isCustom, setIsCustom] = useState(false);
  const [view, setView] = useState<DonationView>('amount');
  const [direction, setDirection] = useState<DonationDirection>('forward');
  const [error, setError] = useState('');

  const currentAmount = isCustom
    ? parseFloat(customAmount) || 0
    : selectedAmount || 0;

  function quickSelect(amount: number) {
    setSelectedAmount(amount);
    setIsCustom(false);
    setCustomAmount('');
  }

  function customInput(value: string) {
    const cleaned = value.replace(/[^\d]/g, '');
    setCustomAmount(cleaned);
    setIsCustom(true);
    setSelectedAmount(null);
  }

  function customFocus() {
    setIsCustom(true);
    setSelectedAmount(null);
  }

  function goToMethod() {
    if (currentAmount <= 0) return;
    setError('');
    setDirection('forward');
    setView('method');
  }

  function goToStripe() {
    if (currentAmount <= 0) return;
    setError('');
    setDirection('forward');
    setView('stripe');
  }

  function back() {
    setDirection('backward');
    setError('');
    setView((v) => (v === 'stripe' ? 'method' : 'amount'));
  }

  const animationClass =
    direction === 'forward' ? 'animate-panel-forward' : 'animate-panel-backward';

  return {
    selectedAmount,
    customAmount,
    isCustom,
    view,
    error,
    currentAmount,
    animationClass,
    quickSelect,
    customInput,
    customFocus,
    goToMethod,
    goToStripe,
    back,
  };
}

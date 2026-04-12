'use server';

import { getStripe } from '@/lib/stripe';
import { getProject } from '@/lib/data';
import { PROJECTS } from '@/data/projects';
import { type Locale } from '@/i18n/config';

export async function createCheckoutSession(
  projectId: number,
  amount: number,
  locale: string
): Promise<{ url: string } | { error: string }> {
  // 校验项目 ID
  const validIds: readonly number[] = PROJECTS;
  if (!validIds.includes(projectId)) {
    return { error: 'Invalid project' };
  }

  // 校验金额（UAH，正整数，≥1）
  if (!Number.isInteger(amount) || amount < 1 || amount > 999999) {
    return { error: 'Invalid amount' };
  }

  const typedLocale: Locale = locale === 'en' ? 'en' : 'ua';

  try {
    const project = await getProject(projectId);
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

    const stripe = getStripe();
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [
        {
          price_data: {
            currency: 'uah',
            unit_amount: amount * 100, // UAH → копійки
            product_data: {
              name: project.title[typedLocale],
            },
          },
          quantity: 1,
        },
      ],
      metadata: { project_id: String(projectId) },
      payment_intent_data: {
        metadata: { project_id: String(projectId) },
      },
      success_url: `${siteUrl}/${typedLocale}/donation-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl}/${typedLocale}/projects?id=${projectId}`,
    });

    if (!session.url) {
      return { error: 'Failed to create checkout session' };
    }

    return { url: session.url };
  } catch {
    return { error: 'Payment service unavailable' };
  }
}

import type { DetailedHTMLProps, HTMLAttributes } from 'react';

// 让 TS 识别 <stripe-buy-button> 自定义元素
declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      'stripe-buy-button': DetailedHTMLProps<
        HTMLAttributes<HTMLElement> & {
          'buy-button-id': string;
          'publishable-key': string;
        },
        HTMLElement
      >;
    }
  }
}

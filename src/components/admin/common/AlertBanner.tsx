// admin 后台通用提示条；前缀位置 margin（mb-4 / mt-3 等）由调用方通过 className 传入。
// 故意只暴露最小 surface：variant + className + children，不接 ARIA role / icon 等
// 是为了与原内联 div 完全等价（避免静默引入新行为）。

interface Props {
  variant: 'error' | 'success';
  className?: string;
  children: React.ReactNode;
}

const VARIANT_CLS: Record<Props['variant'], string> = {
  error: 'border-red-200 bg-red-50 text-red-700',
  success: 'border-green-200 bg-green-50 text-green-700',
};

export default function AlertBanner({ variant, className, children }: Props) {
  const cls = ['rounded-md border p-3 text-sm', VARIANT_CLS[variant], className]
    .filter(Boolean)
    .join(' ');
  return <div className={cls}>{children}</div>;
}

/**
 * 表单页的轻量 UI 原子 —— 克制的 clinical 风格，双栏布局里的右栏内容。
 * 仅供 partnership / request-assistance 两张表单使用。
 */
import { cn } from '@/lib/utils';

/* 输入基础样式：淡 hairline 底线 + 透明底，focus 底线变深 */
const inputBase =
  'w-full rounded-md border border-ukraine-blue-100/80 bg-white/70 px-3 py-2 text-[14.5px] leading-tight text-ukraine-blue-900 placeholder:text-ukraine-blue-400/60 outline-none transition focus:border-ukraine-blue-400 focus:bg-white focus:ring-2 focus:ring-ukraine-blue-100 disabled:cursor-not-allowed disabled:opacity-60';

export function FieldLabel({
  htmlFor,
  children,
  required,
}: {
  htmlFor?: string;
  children: React.ReactNode;
  required?: boolean;
}) {
  return (
    <label
      htmlFor={htmlFor}
      className="mb-1 block text-[12.5px] font-medium text-ukraine-blue-800"
    >
      {children}
      {required && (
        <span className="ml-0.5 text-warm-500" aria-hidden="true">
          *
        </span>
      )}
    </label>
  );
}

export function TextInput({
  invalid,
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { invalid?: boolean }) {
  return (
    <input
      {...props}
      className={cn(
        inputBase,
        invalid && 'border-warm-500 focus:border-warm-500 focus:ring-warm-500/15',
        className,
      )}
    />
  );
}

export function TextArea({
  invalid,
  className,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { invalid?: boolean }) {
  return (
    <textarea
      {...props}
      className={cn(
        inputBase,
        'resize-none leading-snug',
        invalid && 'border-warm-500 focus:border-warm-500 focus:ring-warm-500/15',
        className,
      )}
    />
  );
}

export function SelectInput({
  invalid,
  className,
  children,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement> & { invalid?: boolean }) {
  return (
    <select
      {...props}
      className={cn(
        inputBase,
        'cursor-pointer appearance-none bg-[url("data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2210%22 height=%226%22 viewBox=%220 0 10 6%22><path fill=%22none%22 stroke=%22%23006cb2%22 stroke-width=%221.5%22 d=%22M1 1l4 4 4-4%22/></svg>")] bg-[length:10px_6px] bg-[right_12px_center] bg-no-repeat pr-9',
        invalid && 'border-warm-500 focus:border-warm-500 focus:ring-warm-500/15',
        className,
      )}
    >
      {children}
    </select>
  );
}

/* Chip 单选 —— 横向 flex-wrap，选中状态蓝底白字 */
export function ChipRadioGroup({
  name,
  value,
  onChange,
  options,
  invalid,
}: {
  name: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  invalid?: boolean;
}) {
  return (
    <div
      role="radiogroup"
      className={cn(
        'flex flex-wrap gap-1.5',
        invalid && 'rounded outline outline-1 outline-warm-500/50 outline-offset-4',
      )}
    >
      {options.map((opt) => {
        const active = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(opt.value)}
            className={cn(
              'rounded-full border px-3 py-1.5 text-[13px] leading-tight transition',
              active
                ? 'border-ukraine-blue-500 bg-ukraine-blue-500 font-medium text-white'
                : 'border-ukraine-blue-200 bg-white/70 text-ukraine-blue-800 hover:border-ukraine-blue-400 hover:bg-white',
            )}
          >
            {opt.label}
          </button>
        );
      })}
      <input type="hidden" name={name} value={value} />
    </div>
  );
}

/* Chip 多选 */
export function ChipCheckboxGroup({
  name,
  values,
  onChange,
  options,
  invalid,
}: {
  name: string;
  values: string[];
  onChange: (v: string[]) => void;
  options: { value: string; label: string }[];
  invalid?: boolean;
}) {
  function toggle(v: string) {
    if (values.includes(v)) onChange(values.filter((x) => x !== v));
    else onChange([...values, v]);
  }
  return (
    <div
      className={cn(
        'flex flex-wrap gap-1.5',
        invalid && 'rounded outline outline-1 outline-warm-500/50 outline-offset-4',
      )}
    >
      {options.map((opt) => {
        const active = values.includes(opt.value);
        return (
          <button
            key={opt.value}
            type="button"
            role="checkbox"
            aria-checked={active}
            onClick={() => toggle(opt.value)}
            className={cn(
              'rounded-full border px-3 py-1.5 text-[13px] leading-tight transition',
              active
                ? 'border-ukraine-blue-500 bg-ukraine-blue-500 font-medium text-white'
                : 'border-ukraine-blue-200 bg-white/70 text-ukraine-blue-800 hover:border-ukraine-blue-400 hover:bg-white',
            )}
          >
            {opt.label}
          </button>
        );
      })}
      {values.map((v) => (
        <input key={v} type="hidden" name={name} value={v} />
      ))}
    </div>
  );
}

/* 同意项 —— 极简一行 */
export function ConsentCheckbox({
  id,
  name,
  checked,
  onChange,
  label,
  invalid,
}: {
  id: string;
  name: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  label: React.ReactNode;
  invalid?: boolean;
}) {
  return (
    <label
      htmlFor={id}
      className={cn(
        'group flex cursor-pointer items-start gap-2 text-[12.5px] leading-snug text-ukraine-blue-700 transition',
        invalid && 'text-warm-500',
      )}
    >
      <span
        className={cn(
          'relative mt-[2px] flex h-4 w-4 shrink-0 items-center justify-center rounded-[3px] border transition',
          checked
            ? 'border-ukraine-blue-500 bg-ukraine-blue-500'
            : invalid
              ? 'border-warm-500'
              : 'border-ukraine-blue-300 bg-white group-hover:border-ukraine-blue-500',
        )}
      >
        <input
          id={id}
          name={name}
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="absolute inset-0 opacity-0"
        />
        {checked && (
          <svg
            viewBox="0 0 10 8"
            className="h-2.5 w-2.5 text-white"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M1 4l2.5 2.5L9 1" />
          </svg>
        )}
      </span>
      <span>{label}</span>
    </label>
  );
}

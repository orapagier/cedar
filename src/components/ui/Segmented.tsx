import React from 'react';

export interface SegmentedOption<T extends string> {
  value: T;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  activeClass?: string;
}

interface SegmentedProps<T extends string> {
  options: SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
  size?: 'sm' | 'md';
  className?: string;
  ariaLabel?: string;
}

export function Segmented<T extends string>({
  options,
  value,
  onChange,
  size = 'md',
  className = '',
  ariaLabel,
}: SegmentedProps<T>) {
  const sizing = size === 'sm' ? 'px-2.5 py-1.5 text-[11px] rounded-lg' : 'px-3 py-2.5 text-xs rounded-xl';

  return (
    <div role="tablist" aria-label={ariaLabel} className={`flex flex-wrap gap-1.5 ${className}`}>
      {options.map(option => {
        const Icon = option.icon;
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(option.value)}
            className={`flex-1 basis-32 min-w-0 min-h-touch flex items-center justify-center gap-1.5 text-center font-semibold transition-all active:scale-[0.98] ${sizing} ${
              active ? option.activeClass || 'bg-slate-100 text-slate-900' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            {Icon && <Icon className="w-4 h-4 shrink-0" />}
            <span className="whitespace-nowrap">{option.label}</span>
          </button>
        );
      })}
    </div>
  );
}

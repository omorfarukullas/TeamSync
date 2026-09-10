'use client';

import { AvailabilityStatus } from '@/lib/types';
import { STATUS_CONFIG } from '@/lib/constants';

interface StatusSelectorProps {
  value?: AvailabilityStatus | null;
  onChange?: (status: AvailabilityStatus) => void;
  disabled?: boolean;
  readOnly?: boolean;
  size?: 'sm' | 'md';
  fullWidth?: boolean;
}

export default function StatusSelector({
  value,
  onChange,
  disabled = false,
  readOnly = false,
  size = 'md',
  fullWidth = false,
}: StatusSelectorProps) {
  const options: AvailabilityStatus[] = ['available', 'not_available', 'maybe'];

  // Read-only presentation (e.g. viewing another member's row)
  if (readOnly) {
    if (!value) {
      return (
        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 text-slate-400 border border-slate-200 ${fullWidth ? 'w-full justify-center py-2' : ''}`}>
          — Not Set
        </span>
      );
    }

    const config = STATUS_CONFIG[value];
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold border shadow-sm ${config.bgClass} ${config.textClass} ${config.borderClass} ${fullWidth ? 'w-full justify-center py-2' : ''}`}
      >
        <span>{config.emoji}</span>
        <span>{config.label}</span>
      </span>
    );
  }

  // Interactive 3-option button selector
  return (
    <div className={`items-center gap-1.5 p-1 bg-white/80 backdrop-blur-sm rounded-xl border border-slate-200/80 shadow-sm ${fullWidth ? 'flex w-full' : 'inline-flex'}`}>
      {options.map((status) => {
        const isSelected = value === status;
        const config = STATUS_CONFIG[status];

        return (
          <button
            key={status}
            type="button"
            disabled={disabled}
            onClick={() => onChange && onChange(status)}
            className={`flex items-center justify-center gap-1.5 rounded-xl font-bold transition-all duration-150 ease-out active:scale-90 active:opacity-90 select-none ${
              fullWidth
                ? 'flex-1 py-2.5 px-1.5 text-xs min-h-[44px]'
                : size === 'sm'
                ? 'px-2 py-1 text-xs'
                : 'px-3 py-1.5 text-xs sm:text-sm'
            } ${
              isSelected
                ? `${config.bgClass} ${config.textClass} border-2 ${config.borderClass} shadow-xs scale-[1.02] ring-2 ring-navy-600/10`
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/90 hover:scale-[1.02] border border-transparent'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            <span className="text-sm transition-transform duration-150 group-active:scale-110">{config.emoji}</span>
            <span className={fullWidth ? 'inline text-[11px] sm:text-xs leading-none' : 'hidden sm:inline'}>
              {config.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}


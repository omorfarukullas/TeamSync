'use client';

import { AvailabilityStatus } from '@/lib/types';
import { STATUS_CONFIG } from '@/lib/constants';

interface StatusSelectorProps {
  value?: AvailabilityStatus | null;
  onChange?: (status: AvailabilityStatus) => void;
  disabled?: boolean;
  readOnly?: boolean;
  size?: 'sm' | 'md';
}

export default function StatusSelector({
  value,
  onChange,
  disabled = false,
  readOnly = false,
  size = 'md',
}: StatusSelectorProps) {
  const options: AvailabilityStatus[] = ['available', 'not_available', 'maybe'];

  // Read-only presentation (e.g. viewing another member's row)
  if (readOnly) {
    if (!value) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 text-slate-400 border border-slate-200">
          — Not Set
        </span>
      );
    }

    const config = STATUS_CONFIG[value];
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold border shadow-sm ${config.bgClass} ${config.textClass} ${config.borderClass}`}
      >
        <span>{config.emoji}</span>
        <span>{config.label}</span>
      </span>
    );
  }

  // Interactive 3-option button selector
  return (
    <div className="inline-flex items-center gap-1.5 p-1 bg-white/70 backdrop-blur-sm rounded-xl border border-slate-200/80 shadow-sm">
      {options.map((status) => {
        const isSelected = value === status;
        const config = STATUS_CONFIG[status];

        return (
          <button
            key={status}
            type="button"
            disabled={disabled}
            onClick={() => onChange && onChange(status)}
            className={`flex items-center gap-1.5 rounded-lg font-bold transition-all ${
              size === 'sm' ? 'px-2 py-1 text-xs' : 'px-2.5 py-1.5 text-xs sm:text-sm'
            } ${
              isSelected
                ? `${config.bgClass} ${config.textClass} border-2 ${config.borderClass} shadow-sm scale-[1.02]`
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 border border-transparent'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            <span>{config.emoji}</span>
            <span className="hidden sm:inline">{config.label}</span>
          </button>
        );
      })}
    </div>
  );
}

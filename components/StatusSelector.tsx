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
        <span className={`inline-flex items-center justify-center gap-1 px-2.5 py-1 text-xs font-mono text-[#737373] bg-[#F5F5F5] border border-[#E5E5E5] ${fullWidth ? 'w-full py-2' : ''}`}>
          &mdash; NOT SET
        </span>
      );
    }

    const config = STATUS_CONFIG[value];
    return (
      <span
        className={`inline-flex items-center justify-center gap-1.5 px-3 py-1 text-xs font-mono font-bold border ${config.bgClass} ${config.textClass} ${config.borderClass} ${fullWidth ? 'w-full py-2' : ''}`}
      >
        <span>{config.emoji}</span>
        <span className="uppercase">{config.label}</span>
      </span>
    );
  }

  // Interactive 3-option button selector
  return (
    <div className={`items-center gap-1 p-0.5 bg-white border border-black ${fullWidth ? 'flex w-full' : 'inline-flex'}`}>
      {options.map((status) => {
        const isSelected = value === status;
        const config = STATUS_CONFIG[status];

        return (
          <button
            key={status}
            type="button"
            disabled={disabled}
            onClick={() => onChange && onChange(status)}
            className={`flex items-center justify-center gap-1.5 font-mono uppercase tracking-wider transition-invert select-none ${
              fullWidth
                ? 'flex-1 py-2 px-1 text-xs min-h-[40px]'
                : size === 'sm'
                ? 'px-2 py-1 text-[11px]'
                : 'px-2.5 py-1.5 text-xs'
            } ${
              isSelected
                ? `${config.bgClass} ${config.textClass} border-2 ${config.borderClass} font-bold`
                : 'text-black hover:bg-[#F5F5F5] border border-transparent font-medium'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            <span className="text-sm">{config.emoji}</span>
            <span className={fullWidth ? 'inline text-[11px] leading-none' : 'hidden sm:inline'}>
              {config.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}



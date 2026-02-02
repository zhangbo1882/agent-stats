import * as React from 'react';
import { cn } from '@/lib/utils';

export interface SwitchProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'type'> {
  label?: string;
  description?: string;
  onChange?: (checked: boolean) => void;
}

const Switch = React.forwardRef<HTMLInputElement, SwitchProps>(
  ({ className, label, description, id, checked, onChange, disabled, ...props }, ref) => {
    const switchId = id || `switch-${Math.random().toString(36).substr(2, 9)}`;

    return (
      <div className={cn('flex items-center gap-3', label && 'py-2', className)}>
        <button
          type="button"
          role="switch"
          aria-checked={checked}
          aria-labelledby={label ? switchId : undefined}
          disabled={disabled}
          onClick={() => {
            if (!disabled && onChange) {
              onChange(!checked);
            }
          }}
          className={cn(
            'relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50',
            checked ? 'bg-primary' : 'bg-input'
          )}
        >
          <span
            className={cn(
              'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out',
              checked ? 'translate-x-5' : 'translate-x-0'
            )}
          />
        </button>
        {(label || description) && (
          <div className="flex flex-col gap-0.5">
            {label && (
              <label
                id={switchId}
                className={cn(
                  'text-sm font-medium leading-none cursor-pointer',
                  disabled && 'cursor-not-allowed opacity-70'
                )}
              >
                {label}
              </label>
            )}
            {description && (
              <p className="text-sm text-muted-foreground">{description}</p>
            )}
          </div>
        )}
      </div>
    );
  }
);
Switch.displayName = 'Switch';

export { Switch };

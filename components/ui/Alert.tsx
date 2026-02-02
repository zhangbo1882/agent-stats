'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { X, AlertCircle, CheckCircle, AlertTriangle, Info } from 'lucide-react';

export type AlertVariant = 'success' | 'error' | 'warning' | 'info';

export interface AlertProps {
  variant?: AlertVariant;
  title?: string;
  children?: React.ReactNode;
  onClose?: () => void;
  autoClose?: boolean;
  autoCloseDelay?: number;
  className?: string;
}

const variantConfig = {
  success: {
    container: 'bg-green-50 border-green-200 text-green-800 dark:bg-green-950 dark:border-green-800 dark:text-green-200',
    icon: CheckCircle,
  },
  error: {
    container: 'bg-red-50 border-red-200 text-red-800 dark:bg-red-950 dark:border-red-800 dark:text-red-200',
    icon: AlertCircle,
  },
  warning: {
    container: 'bg-yellow-50 border-yellow-200 text-yellow-800 dark:bg-yellow-950 dark:border-yellow-800 dark:text-yellow-200',
    icon: AlertTriangle,
  },
  info: {
    container: 'bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-950 dark:border-blue-800 dark:text-blue-200',
    icon: Info,
  },
};

export function Alert({
  variant = 'info',
  title,
  children,
  onClose,
  autoClose = false,
  autoCloseDelay = 5000,
  className,
}: AlertProps) {
  const [isVisible, setIsVisible] = React.useState(true);
  const config = variantConfig[variant];
  const Icon = config.icon;

  React.useEffect(() => {
    if (autoClose && isVisible) {
      const timer = setTimeout(() => {
        handleClose();
      }, autoCloseDelay);
      return () => clearTimeout(timer);
    }
  }, [autoClose, autoCloseDelay, isVisible]);

  const handleClose = () => {
    setIsVisible(false);
    onClose?.();
  };

  if (!isVisible) return null;

  return (
    <div
      className={cn(
        'relative flex items-start gap-3 rounded-lg border p-4',
        config.container,
        'transition-all duration-200',
        className
      )}
      role="alert"
    >
      <Icon className="h-5 w-5 shrink-0 mt-0.5" />
      <div className="flex-1">
        {title && <p className="font-semibold mb-1">{title}</p>}
        {children && <div className="text-sm">{children}</div>}
      </div>
      {onClose && (
        <button
          type="button"
          onClick={handleClose}
          className="shrink-0 opacity-70 hover:opacity-100 transition-opacity"
          aria-label="Close alert"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}

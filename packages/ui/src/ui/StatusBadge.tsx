import React from 'react';
import { cn } from '../lib/utils';

interface StatusBadgeProps {
  status: 'success' | 'warning' | 'error' | 'info' | 'neutral' | 'pending';
  label?: string;
  withDot?: boolean;
  withPulse?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function StatusBadge({
  status,
  label,
  withDot = false,
  withPulse = false,
  size = 'md',
  className
}: StatusBadgeProps) {
  const statusConfig = {
    success: {
      bg: 'bg-emerald-100',
      text: 'text-emerald-700',
      dot: 'bg-emerald-500',
      border: 'border-emerald-200',
      label: 'Success'
    },
    warning: {
      bg: 'bg-amber-100',
      text: 'text-amber-700',
      dot: 'bg-amber-500',
      border: 'border-amber-200',
      label: 'Warning'
    },
    error: {
      bg: 'bg-red-100',
      text: 'text-red-700',
      dot: 'bg-red-500',
      border: 'border-red-200',
      label: 'Error'
    },
    info: {
      bg: 'bg-blue-100',
      text: 'text-blue-700',
      dot: 'bg-blue-500',
      border: 'border-blue-200',
      label: 'Info'
    },
    neutral: {
      bg: 'bg-slate-100',
      text: 'text-slate-700',
      dot: 'bg-slate-500',
      border: 'border-slate-200',
      label: 'Neutral'
    },
    pending: {
      bg: 'bg-purple-100',
      text: 'text-purple-700',
      dot: 'bg-purple-500',
      border: 'border-purple-200',
      label: 'Pending'
    }
  };

  const config = statusConfig[status];
  const displayLabel = label || config.label;

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-sm',
    lg: 'px-3 py-1.5 text-base'
  };

  return (
    <span className={cn(
      'inline-flex items-center gap-1.5 rounded-full border font-medium transition-all',
      config.bg,
      config.text,
      config.border,
      sizeClasses[size],
      className
    )}>
      {withDot && (
        <span className="relative flex h-2 w-2">
          {withPulse && (
            <span className={cn(
              'animate-ping absolute inline-flex h-full w-full rounded-full opacity-75',
              config.dot
            )}></span>
          )}
          <span className={cn(
            'relative inline-flex rounded-full h-2 w-2',
            config.dot
          )}></span>
        </span>
      )}
      {displayLabel}
    </span>
  );
}

interface StatusDotProps {
  status: 'success' | 'warning' | 'error' | 'info';
  withPulse?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function StatusDot({ status, withPulse = true, size = 'md', className }: StatusDotProps) {
  const sizeClasses = {
    sm: 'w-2 h-2',
    md: 'w-3 h-3',
    lg: 'w-4 h-4'
  };

  return (
    <span className={cn('inline-block relative', className)}>
      <span className={cn(
        'status-dot',
        status,
        sizeClasses[size],
        !withPulse && '[&::before]:hidden'
      )}></span>
    </span>
  );
}


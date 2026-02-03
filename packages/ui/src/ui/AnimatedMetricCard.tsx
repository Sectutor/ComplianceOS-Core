import React, { useEffect, useState } from 'react';
import { cn } from '../lib/utils';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface AnimatedMetricCardProps {
  title: string;
  value: number | string;
  previousValue?: number;
  format?: (value: number) => string;
  trend?: 'up' | 'down' | 'neutral';
  trendLabel?: string;
  icon?: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info';
  className?: string;
  delay?: number;
}

export function AnimatedMetricCard({
  title,
  value,
  previousValue,
  format = (v) => v.toString(),
  trend,
  trendLabel,
  icon,
  variant = 'default',
  className,
  delay = 0
}: AnimatedMetricCardProps) {
  const [displayValue, setDisplayValue] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  const numericValue = typeof value === 'number' ? value : parseFloat(value.toString()) || 0;

  // Animate count-up effect
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  useEffect(() => {
    if (!isVisible || typeof value !== 'number') return;

    const duration = 1000; // 1 second
    const steps = 30;
    const increment = numericValue / steps;
    let current = 0;

    const timer = setInterval(() => {
      current += increment;
      if (current >= numericValue) {
        setDisplayValue(numericValue);
        clearInterval(timer);
      } else {
        setDisplayValue(Math.floor(current));
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [value, isVisible, numericValue]);

  // Calculate trend percentage
  const trendPercentage = previousValue && typeof value === 'number'
    ? ((value - previousValue) / previousValue * 100).toFixed(1)
    : null;

  const autoTrend = trendPercentage
    ? parseFloat(trendPercentage) > 0 ? 'up' : parseFloat(trendPercentage) < 0 ? 'down' : 'neutral'
    : trend;

  const variantStyles = {
    default: 'border-slate-200 hover:border-blue-300',
    success: 'border-emerald-200 hover:border-emerald-300 bg-emerald-50/30',
    warning: 'border-amber-200 hover:border-amber-300 bg-amber-50/30',
    error: 'border-red-200 hover:border-red-300 bg-red-50/30',
    info: 'border-blue-200 hover:border-blue-300 bg-blue-50/30'
  };

  const trendStyles = {
    up: 'text-emerald-600 bg-emerald-50',
    down: 'text-red-600 bg-red-50',
    neutral: 'text-slate-600 bg-slate-50'
  };

  return (
    <div
      className={cn(
        'rounded-lg border-2 p-5 transition-all duration-300 hover-lift',
        'animate-slide-up',
        variantStyles[variant],
        className
      )}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-muted-foreground mb-1">{title}</p>
          <div className="flex items-baseline gap-2">
            <h3 className={cn(
              'text-3xl font-bold tracking-tight transition-all duration-300',
              isVisible && 'metric-value'
            )}>
              {typeof value === 'number' ? format(displayValue) : value}
            </h3>
            {(autoTrend || trendLabel) && (
              <div className={cn(
                'flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium',
                autoTrend && trendStyles[autoTrend]
              )}>
                {autoTrend === 'up' && <TrendingUp className="w-3 h-3" />}
                {autoTrend === 'down' && <TrendingDown className="w-3 h-3" />}
                {autoTrend === 'neutral' && <Minus className="w-3 h-3" />}
                <span>{trendLabel || (trendPercentage ? `${trendPercentage}%` : '')}</span>
              </div>
            )}
          </div>
        </div>
        {icon && (
          <div className={cn(
            'p-3 rounded-lg transition-all duration-300',
            variant === 'success' && 'bg-emerald-100 text-emerald-600',
            variant === 'warning' && 'bg-amber-100 text-amber-600',
            variant === 'error' && 'bg-red-100 text-red-600',
            variant === 'info' && 'bg-blue-100 text-blue-600',
            variant === 'default' && 'bg-slate-100 text-slate-600'
          )}>
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}


import React from 'react';
import { cn } from '../lib/utils';

interface ProgressIndicatorProps {
  steps: {
    label: string;
    description?: string;
    status: 'complete' | 'current' | 'upcoming';
  }[];
  variant?: 'horizontal' | 'vertical';
  className?: string;
}

export function ProgressIndicator({ steps, variant = 'horizontal', className }: ProgressIndicatorProps) {
  const isHorizontal = variant === 'horizontal';

  return (
    <div className={cn(
      'flex',
      isHorizontal ? 'flex-row items-center' : 'flex-col',
      className
    )}>
      {steps.map((step, index) => {
        const isLast = index === steps.length - 1;
        const isComplete = step.status === 'complete';
        const isCurrent = step.status === 'current';

        return (
          <React.Fragment key={index}>
            <div className={cn(
              'flex items-center transition-all duration-300',
              isHorizontal ? 'flex-col' : 'flex-row gap-3'
            )}>
              {/* Step Circle */}
              <div className="relative flex flex-col items-center">
                <div className={cn(
                  'flex items-center justify-center rounded-full border-2 transition-all duration-300',
                  isHorizontal ? 'w-10 h-10' : 'w-8 h-8',
                  isComplete && 'bg-emerald-500 border-emerald-500 text-white scale-110',
                  isCurrent && 'bg-blue-500 border-blue-500 text-white animate-pulse-glow',
                  !isComplete && !isCurrent && 'bg-white border-slate-300 text-slate-400'
                )}>
                  {isComplete ? (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <span className="text-sm font-semibold">{index + 1}</span>
                  )}
                </div>

                {/* Label */}
                {isHorizontal && (
                  <div className="mt-2 text-center">
                    <p className={cn(
                      'text-sm font-medium transition-colors',
                      isCurrent && 'text-blue-600 font-semibold',
                      isComplete && 'text-emerald-600',
                      !isComplete && !isCurrent && 'text-slate-500'
                    )}>
                      {step.label}
                    </p>
                    {step.description && (
                      <p className="text-xs text-muted-foreground mt-1">{step.description}</p>
                    )}
                  </div>
                )}
              </div>

              {/* Label for vertical */}
              {!isHorizontal && (
                <div>
                  <p className={cn(
                    'text-sm font-medium transition-colors',
                    isCurrent && 'text-blue-600 font-semibold',
                    isComplete && 'text-emerald-600',
                    !isComplete && !isCurrent && 'text-slate-500'
                  )}>
                    {step.label}
                  </p>
                  {step.description && (
                    <p className="text-xs text-muted-foreground">{step.description}</p>
                  )}
                </div>
              )}
            </div>

            {/* Connector Line */}
            {!isLast && (
              <div className={cn(
                'transition-all duration-300',
                isHorizontal ? 'flex-1 h-0.5 mx-2' : 'w-0.5 h-12 ml-4',
                isComplete ? 'bg-emerald-500' : 'bg-slate-200'
              )} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}


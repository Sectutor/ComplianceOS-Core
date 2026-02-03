import React from 'react';
import { cn } from '../lib/utils';

interface StepWizardProps {
  steps: {
    title: string;
    description?: string;
    content: React.ReactNode;
  }[];
  currentStep: number;
  onStepChange?: (step: number) => void;
  className?: string;
}

export function StepWizard({ steps, currentStep, onStepChange, className }: StepWizardProps) {
  const currentContent = steps[currentStep];

  return (
    <div className={cn('space-y-6', className)}>
      {/* Progress Bar */}
      <div className="relative">
        <div className="progress-bar">
          <div
            className="progress-bar-fill"
            style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
          />
        </div>
        <div className="flex justify-between mt-2 text-xs text-muted-foreground">
          <span>Step {currentStep + 1} of {steps.length}</span>
          <span>{Math.round(((currentStep + 1) / steps.length) * 100)}% Complete</span>
        </div>
      </div>

      {/* Steps Navigation */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-2">
        {steps.map((step, index) => {
          const isComplete = index < currentStep;
          const isCurrent = index === currentStep;
          const isUpcoming = index > currentStep;

          return (
            <button
              key={index}
              onClick={() => onStepChange?.(index)}
              disabled={isUpcoming}
              className={cn(
                'p-3 rounded-lg border-2 text-left transition-all duration-200',
                isCurrent && 'border-blue-500 bg-blue-50 shadow-sm scale-105',
                isComplete && 'border-emerald-500 bg-emerald-50 hover:bg-emerald-100 cursor-pointer',
                isUpcoming && 'border-slate-200 bg-slate-50 cursor-not-allowed opacity-50'
              )}
            >
              <div className="flex items-center gap-2">
                <div className={cn(
                  'flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold',
                  isCurrent && 'bg-blue-500 text-white',
                  isComplete && 'bg-emerald-500 text-white',
                  isUpcoming && 'bg-slate-300 text-slate-500'
                )}>
                  {isComplete ? '✓' : index + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={cn(
                    'text-sm font-medium truncate',
                    isCurrent && 'text-blue-700',
                    isComplete && 'text-emerald-700',
                    isUpcoming && 'text-slate-500'
                  )}>
                    {step.title}
                  </p>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Current Step Content */}
      <div className="animate-fade-in">
        <div className="mb-4">
          <h2 className="text-2xl font-bold text-foreground">{currentContent.title}</h2>
          {currentContent.description && (
            <p className="text-muted-foreground mt-1">{currentContent.description}</p>
          )}
        </div>
        <div className="animate-slide-up">
          {currentContent.content}
        </div>
      </div>
    </div>
  );
}


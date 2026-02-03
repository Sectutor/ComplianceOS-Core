import React from 'react';
import { LucideIcon } from 'lucide-react';
import { Button } from './button';

interface EmptyStateProps {
    icon: LucideIcon;
    title: string;
    description: string;
    action?: {
        label: string;
        onClick: () => void;
    };
    className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ icon: Icon, title, description, action, className }) => {
    return (
        <div className={`flex flex-col items-center justify-center text-center p-8 bg-slate-50/50 rounded-xl border-2 border-dashed border-slate-200 transition-all hover:bg-slate-50 ${className}`}>
            <div className="p-4 rounded-full bg-white shadow-md mb-4 animate-in zoom-in duration-500">
                <Icon className="w-10 h-10 text-slate-400" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 leading-tight">{title}</h3>
            <p className="text-sm text-slate-500 mt-2 max-w-[240px] mx-auto lining-nums">{description}</p>
            {action && (
                <Button
                    variant="outline"
                    className="mt-6 bg-white hover:bg-slate-50 border-slate-200 shadow-sm transition-all hover:scale-105 active:scale-95 px-6"
                    onClick={action.onClick}
                >
                    {action.label}
                </Button>
            )}
        </div>
    );
};


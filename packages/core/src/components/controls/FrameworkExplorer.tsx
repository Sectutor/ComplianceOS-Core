import React from 'react';
import { ScrollArea, ScrollBar } from '@complianceos/ui/ui/scroll-area';
import { cn } from '@/lib/utils';
import { Layers, Shield, Globe, Lock, FileText, CreditCard, Activity, Database, Box } from 'lucide-react';

interface FrameworkExplorerProps {
    currentFramework: string;
    onSelect: (framework: string) => void;
    counts?: Record<string, number>;
    frameworks?: string[];
}

const FRAMEWORK_CONFIG: Record<string, any> = {
    'all': { label: 'All Controls', icon: Layers, color: 'text-slate-600', bg: 'bg-slate-100', accent: 'border-slate-500' },
    'ISO 27001': { label: 'ISO 27001', icon: Globe, color: 'text-blue-600', bg: 'bg-blue-100', accent: 'border-blue-500' },
    'SOC 2': { label: 'SOC 2 Type II', icon: Shield, color: 'text-indigo-600', bg: 'bg-indigo-100', accent: 'border-indigo-500' },
    'NIST 800-53': { label: 'NIST 800-53', icon: Lock, color: 'text-red-600', bg: 'bg-red-100', accent: 'border-red-500' },
    'HIPAA': { label: 'HIPAA', icon: Activity, color: 'text-emerald-600', bg: 'bg-emerald-100', accent: 'border-emerald-500' },
    'GDPR': { label: 'GDPR', icon: Database, color: 'text-purple-600', bg: 'bg-purple-100', accent: 'border-purple-500' },
    'PCI DSS': { label: 'PCI DSS', icon: CreditCard, color: 'text-amber-600', bg: 'bg-amber-100', accent: 'border-amber-500' },
    'NIST CSF': { label: 'NIST CSF', icon: Shield, color: 'text-sky-600', bg: 'bg-sky-100', accent: 'border-sky-500' },
};

const DEFAULT_CONFIG = { label: 'Framework', icon: Box, color: 'text-slate-600', bg: 'bg-slate-50', accent: 'border-slate-400' };

export function FrameworkExplorer({ currentFramework, onSelect, counts, frameworks = [] }: FrameworkExplorerProps) {
    // Combine 'all' with unique frameworks from props, ensuring no duplicates if 'all' is passed
    const displayFrameworks = ['all', ...frameworks.filter(f => f !== 'all')];

    return (
        <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold tracking-tight">Framework Explorer</h2>
                <span className="text-xs text-muted-foreground">Select a framework to filter controls</span>
            </div>

            <ScrollArea className="w-full whitespace-nowrap pb-4">
                <div className="flex w-max space-x-4 p-1">
                    {displayFrameworks.map((fwId) => {
                        // Handle the 'all' case specifically if it comes from the list
                        const id = fwId === 'all' ? 'all' : fwId;
                        const config = FRAMEWORK_CONFIG[id] || { ...DEFAULT_CONFIG, label: id };
                        const isSelected = currentFramework === id || (currentFramework === '' && id === 'all');

                        // Allow exact match or fallback to config
                        const Label = config.label || id;
                        const Icon = config.icon || Box;

                        return (
                            <button
                                key={id}
                                onClick={() => onSelect(id === 'all' ? '' : id)}
                                className={cn(
                                    "group relative flex flex-col items-start p-4 h-32 w-48 rounded-xl border transition-all duration-200 ease-in-out hover:shadow-md text-left",
                                    isSelected
                                        ? `bg-white shadow-md ring-2 ring-primary ring-offset-2 ${config.accent || 'border-slate-500'}`
                                        : "bg-white/50 hover:bg-white border-transparent hover:border-slate-200"
                                )}
                            >
                                <div className={cn("p-2 rounded-lg mb-3 transition-colors", config.bg || 'bg-slate-100', isSelected ? "bg-opacity-100" : "bg-opacity-50 group-hover:bg-opacity-100")}>
                                    <Icon className={cn("w-5 h-5", config.color || 'text-slate-600')} />
                                </div>
                                <div className="mt-auto">
                                    <span className={cn("text-sm font-bold block truncate w-full", isSelected ? "text-slate-900" : "text-slate-600 group-hover:text-slate-900")}>
                                        {Label}
                                    </span>
                                    <span className="text-xs text-muted-foreground mt-0.5 block">
                                        {counts?.[id] ? `${counts[id]} Controls` : 'View Library'}
                                    </span>
                                </div>
                            </button>
                        );
                    })}
                </div>
                <ScrollBar orientation="horizontal" />
            </ScrollArea>
        </div>
    );
}

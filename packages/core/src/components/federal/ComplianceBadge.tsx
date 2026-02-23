import React from 'react';
import { Badge } from "@complianceos/ui/ui/badge";
import { cn } from "@/lib/utils";

type ComplianceStatus = 'Compliant' | 'Partial' | 'Non-Compliant' | 'Not Started' | 'Authorized' | 'In-Process' | 'Ready' | 'Draft';

interface ComplianceBadgeProps {
    status: string;
    className?: string;
}

const STATUS_STYLES: Record<string, { className: string; label: string }> = {
    'Compliant': { className: 'bg-emerald-500 text-white border-none', label: 'Compliant' },
    'Partial': { className: 'bg-amber-500 text-white border-none', label: 'Partial' },
    'Non-Compliant': { className: 'bg-rose-500 text-white border-none', label: 'Non-Compliant' },
    'Not Started': { className: 'bg-slate-50 text-slate-400 border-slate-200', label: 'Not Started' },
    'Authorized': { className: 'bg-emerald-500 text-white border-none font-bold', label: 'Authorized' },
    'In-Process': { className: 'bg-blue-500 text-white border-none font-bold', label: 'In-Process' },
    'Ready': { className: 'bg-indigo-500 text-white border-none font-bold', label: 'Ready' },
    'Draft': { className: 'border-slate-200 text-slate-500', label: 'Draft' },
};

export function ComplianceBadge({ status, className }: ComplianceBadgeProps) {
    const style = STATUS_STYLES[status];

    if (!style) {
        return <Badge variant="outline" className={cn(className)}>{status || 'Unknown'}</Badge>;
    }

    return (
        <Badge className={cn(style.className, className)}>
            {style.label}
        </Badge>
    );
}

// Impact level color utility (used across FedRAMP pages)
export function getImpactColor(level?: string) {
    switch (level) {
        case 'High': return 'bg-rose-100 text-rose-700 border-rose-200';
        case 'Moderate': return 'bg-amber-100 text-amber-700 border-amber-200';
        case 'Low': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
        case 'LI-SaaS': return 'bg-blue-100 text-blue-700 border-blue-200';
        default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
}

// Loading skeleton for control grids
export function ControlGridSkeleton({ count = 6 }: { count?: number }) {
    return (
        <div className="grid grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3 gap-4">
            {Array.from({ length: count }).map((_, i) => (
                <div key={i} className="animate-pulse bg-white rounded-3xl border border-slate-100 p-5 space-y-3">
                    <div className="flex items-center gap-3">
                        <div className="h-6 w-16 bg-slate-200 rounded-lg" />
                        <div className="h-5 w-20 bg-slate-100 rounded-full" />
                    </div>
                    <div className="h-4 w-3/4 bg-slate-100 rounded" />
                    <div className="space-y-2">
                        <div className="h-3 w-full bg-slate-50 rounded" />
                        <div className="h-3 w-5/6 bg-slate-50 rounded" />
                    </div>
                </div>
            ))}
        </div>
    );
}

// Card grid skeleton for package-style pages
export function CardGridSkeleton({ count = 3, cols = "md:grid-cols-3" }: { count?: number; cols?: string }) {
    return (
        <div className={`grid grid-cols-1 ${cols} gap-6`}>
            {Array.from({ length: count }).map((_, i) => (
                <div key={i} className="animate-pulse rounded-3xl overflow-hidden">
                    <div className="h-2 bg-slate-200 rounded-t-3xl" />
                    <div className="bg-white p-6 space-y-4">
                        <div className="flex justify-between">
                            <div className="h-10 w-10 bg-slate-100 rounded-2xl" />
                            <div className="h-5 w-20 bg-slate-100 rounded-full" />
                        </div>
                        <div className="h-6 w-3/4 bg-slate-200 rounded" />
                        <div className="h-4 w-1/2 bg-slate-100 rounded" />
                        <div className="pt-4 border-t border-slate-50 space-y-2">
                            <div className="h-2 w-full bg-slate-100 rounded-full" />
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}

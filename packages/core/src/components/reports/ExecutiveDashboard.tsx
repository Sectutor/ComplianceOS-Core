import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@complianceos/ui";
import { trpc } from '@/lib/trpc';
import { CheckCircle2, AlertCircle, Clock } from "lucide-react";

interface ExecutiveDashboardProps {
    clientId: number;
}

export const ExecutiveDashboard = ({ clientId }: ExecutiveDashboardProps) => {
    // Simplified metrics for Core
    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-slate-500 flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                        Implemented Controls
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">--</div>
                    <p className="text-xs text-slate-400 mt-1">Basic status overview</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-slate-500 flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-amber-500" />
                        Gaps Identified
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">--</div>
                    <p className="text-xs text-slate-400 mt-1">Requires manual review</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-slate-500 flex items-center gap-2">
                        <Clock className="w-4 h-4 text-blue-500" />
                        Pending Evidence
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">--</div>
                    <p className="text-xs text-slate-400 mt-1">Items in triage</p>
                </CardContent>
            </Card>
        </div>
    );
};

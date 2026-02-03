
import React from 'react';
import { UnifiedPDCAView } from './UnifiedPDCAView';
import { Alert, AlertDescription, AlertTitle } from "@complianceos/ui/ui/alert";
import { Info } from "lucide-react";

interface FrameworkViewRouterProps {
    planId: number;
    frameworkName: string;
    tasks: any[];
    phases: any[];
    isLoading: boolean;
    frameworkId?: number;
}

export const FrameworkViewRouter = ({ planId, frameworkName, tasks, phases, isLoading, frameworkId }: FrameworkViewRouterProps) => {

    // Return the unified PDCA view for all frameworks
    // This provides a consistent lifecycle visualization (Plan-Do-Check-Act)
    // while adapting content (clauses/articles) based on the frameworkId
    return (
        <UnifiedPDCAView
            planId={planId}
            frameworkName={frameworkName}
            tasks={tasks}
            phases={phases}
            isLoading={isLoading}
            frameworkId={frameworkId}
        />
    );
};

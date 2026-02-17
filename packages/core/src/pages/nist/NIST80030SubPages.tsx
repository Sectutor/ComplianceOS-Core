
import React from 'react';
import NIST80030Layout from "./NIST80030Layout";
import {
    ShieldAlert,
    BarChart3,
    Construction,
    Search,
    AlertTriangle,
    Plus,
    Target
} from "lucide-react";
import { Button } from "@complianceos/ui/ui/button";
import { Card, CardContent } from "@complianceos/ui/ui/card";

const PlaceholderContent = ({ title, icon: Icon, description }: any) => (
    <NIST80030Layout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-8 max-w-2xl mx-auto">
            <div className="relative">
                <div className="w-24 h-24 bg-indigo-100 rounded-3xl flex items-center justify-center text-indigo-600 shadow-xl relative z-10">
                    <Icon className="w-12 h-12" />
                </div>
                <div className="absolute -top-2 -right-2 w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center text-amber-600 shadow-lg z-20 animate-bounce">
                    <Construction className="w-6 h-6" />
                </div>
                <div className="absolute top-0 left-0 w-24 h-24 bg-indigo-400/20 rounded-3xl blur-2xl -z-10 animate-pulse" />
            </div>

            <div className="space-y-4">
                <h1 className="text-4xl font-black tracking-tight text-slate-900">{title}</h1>
                <p className="text-lg text-slate-600 leading-relaxed">
                    {description}
                </p>
            </div>

            <Card className="w-full border-2 border-dashed border-indigo-200 bg-indigo-50/30">
                <CardContent className="p-8 space-y-4">
                    <h3 className="font-bold text-indigo-900 flex items-center justify-center gap-2">
                        <Target className="w-5 h-5" />
                        800-30 Workflow
                    </h3>
                    <div className="h-3 w-full bg-slate-200 rounded-full overflow-hidden">
                        <div className="h-full w-2/3 bg-indigo-500 rounded-full" />
                    </div>
                    <p className="text-sm text-indigo-700 font-medium">
                        This specialized view is being operationalized. Core risk data is synchronized with the main Risk Register.
                    </p>
                </CardContent>
            </Card>

            <div className="flex gap-4">
                <Button className="bg-indigo-600 hover:bg-indigo-700 rounded-xl px-8">
                    <Plus className="w-4 h-4 mr-2" />
                    Configure Methodology
                </Button>
            </div>
        </div>
    </NIST80030Layout>
);

export const NIST80030ThreatModeling = () => (
    <PlaceholderContent
        title="Threat Modeling"
        icon={ShieldAlert}
        description="Identify and characterize threat sources (adversarial, accidental, structural, environmental) and threat events."
    />
);

export const NIST80030ImpactAnalysis = () => (
    <PlaceholderContent
        title="Impact Analysis"
        icon={BarChart3}
        description="Determine the magnitude of harm that could result from the unauthorized disclosure, modification, or destruction of information."
    />
);

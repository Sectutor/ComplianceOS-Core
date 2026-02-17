
import React from 'react';
import NIST80037Layout from "./NIST80037Layout";
import {
    Settings,
    ShieldCheck,
    Lock,
    ClipboardList,
    FileCheck,
    Eye,
    Play,
    Zap,
    Construction,
    Target,
    ArrowRight,
    Search
} from "lucide-react";
import { Button } from "@complianceos/ui/ui/button";
import { Card, CardContent } from "@complianceos/ui/ui/card";

const PlaceholderContent = ({ title, icon: Icon, description, stepNumber }: any) => (
    <NIST80037Layout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-8 max-w-2xl mx-auto">
            <div className="relative">
                <div className="w-24 h-24 bg-emerald-100 rounded-3xl flex items-center justify-center text-emerald-600 shadow-xl relative z-10">
                    <Icon className="w-12 h-12" />
                </div>
                <div className="absolute -top-2 -right-2 w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center text-amber-600 shadow-lg z-20 animate-bounce">
                    <Construction className="w-6 h-6" />
                </div>
                <div className="absolute top-0 left-0 w-24 h-24 bg-emerald-400/20 rounded-3xl blur-2xl -z-10 animate-pulse" />
            </div>

            <div className="space-y-4">
                <div className="flex items-center justify-center gap-2">
                    <span className="bg-emerald-600 text-white px-3 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest">Step {stepNumber}</span>
                </div>
                <h1 className="text-4xl font-black tracking-tight text-slate-900">{title}</h1>
                <p className="text-lg text-slate-600 leading-relaxed font-medium">
                    {description}
                </p>
            </div>

            <Card className="w-full border-2 border-dashed border-emerald-200 bg-emerald-50/30 rounded-[2.5rem]">
                <CardContent className="p-10 space-y-6">
                    <div className="flex items-center justify-between">
                        <h3 className="font-black text-emerald-900 flex items-center gap-2 uppercase tracking-widest text-xs">
                            <Zap className="w-4 h-4" />
                            RMF Operational Efficiency
                        </h3>
                        <span className="text-xs font-bold text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-md">AI ENHANCED</span>
                    </div>
                    <div className="space-y-3">
                        <div className="h-3 w-full bg-slate-200 rounded-full overflow-hidden">
                            <div className="h-full w-1/4 bg-emerald-500 rounded-full" />
                        </div>
                        <div className="flex justify-between text-[10px] font-black text-slate-400 uppercase tracking-[0.1em]">
                            <span>Strategy Formulation</span>
                            <span>Execution</span>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <div className="flex gap-4">
                <Button className="bg-emerald-600 hover:bg-emerald-700 rounded-[1.5rem] px-10 h-14 shadow-xl shadow-emerald-200/50 font-black text-lg group">
                    Begin {title}
                    <ArrowRight className="ml-3 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Button>
            </div>
        </div>
    </NIST80037Layout>
);

export const NIST80037Prepare = () => (
    <PlaceholderContent
        title="Organization Preparation"
        icon={Play}
        description="Establish a risk management strategy and organization-wide risk assessment to guide system-level RMF activities."
        stepNumber="0"
    />
);

export const NIST80037Categorize = () => (
    <PlaceholderContent
        title="System Categorization"
        icon={Settings}
        description="Categorize the system and information processed based on analysis of the impact of loss of confidentiality, integrity, and availability."
        stepNumber="1"
    />
);

export const NIST80037Select = () => (
    <PlaceholderContent
        title="Control Selection"
        icon={ShieldCheck}
        description="Select an initial set of controls and tailor them as needed to reduce risk to an acceptable level."
        stepNumber="2"
    />
);

export const NIST80037Implement = () => (
    <PlaceholderContent
        title="Control Implementation"
        icon={Lock}
        description="Implement the security and privacy controls in the system and organization and describe how they are employed."
        stepNumber="3"
    />
);

export const NIST80037Assess = () => (
    <PlaceholderContent
        title="Control Assessment"
        icon={ClipboardList}
        description="Assess the controls to determine if they are implemented correctly, operating as intended, and producing the desired outcome."
        stepNumber="4"
    />
);

export const NIST80037Authorize = () => (
    <PlaceholderContent
        title="System Authorization"
        icon={FileCheck}
        description="Provide a determination of risk to organizational operations and assets, individuals, and other organizations to authorize system operation."
        stepNumber="5"
    />
);

export const NIST80037Monitor = () => (
    <PlaceholderContent
        title="Continuous Monitoring"
        icon={Eye}
        description="Monitor the system and its associated controls on an ongoing basis to maintain an acceptable level of risk."
        stepNumber="6"
    />
);

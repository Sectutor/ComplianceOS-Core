import React from "react";
import { Checkbox } from "@complianceos/ui/ui/checkbox";
import { Label } from "@complianceos/ui/ui/label";
import { cn } from "@/lib/utils";
import { READINESS_STANDARDS } from "@/data/readiness-standards";
import { FileText, Shield, Network, Users, Lock, ScrollText, PlayCircle, FileCheck } from "lucide-react";

interface WizardStepProps {
    data: any;
    onChange: (d: any) => void;
    standardId?: string;
}

const DEFAULT_DOC_ITEMS = [
    { id: "Information Security Policy", label: "InfoSec Policy", icon: Shield, desc: "High-level security rules." },
    { id: "Asset Inventory / Register", label: "Asset Inventory", icon: ScrollText, desc: "List of devices & software." },
    { id: "Risk Methodology / Register", label: "Risk Register", icon: FileText, desc: "Identified threats & risks." },
    { id: "Network Diagrams", label: "Network Diagrams", icon: Network, desc: "Visual map of architecture." },
    { id: "HR Onboarding Process", label: "HR Onboarding", icon: Users, desc: "New hire checklists." },
    { id: "Incident Response Plan", label: "Incident Response", icon: PlayCircle, desc: "Steps for handling breaches." },
    { id: "Business Continuity Plan", label: "Business Continuity", icon: PlayCircle, desc: "Disaster recovery plans." },
    { id: "Vendor / Supplier List", label: "Vendor List", icon: Users, desc: "Third-party service providers." },
    { id: "Access Control Policy", label: "Access Control", icon: Lock, desc: "Rules for system access." }
];

export function WizardStep3_Docs({ data, onChange, standardId }: WizardStepProps) {
    const standardConfig = standardId ? READINESS_STANDARDS[standardId] : null;
    const customDocs = standardConfig?.steps.documentation?.items;

    const items = customDocs ? customDocs.map(d => ({
        ...d,
        icon: FileCheck, // Use FileCheck as a dynamic icon for custom docs
    })) : DEFAULT_DOC_ITEMS;

    const toggleItem = (item: string) => {
        const current = data?.existingDocs || [];
        const updated = current.includes(item)
            ? current.filter((i: string) => i !== item)
            : [...current, item];
        onChange({ ...data, existingDocs: updated });
    };

    return (
        <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500 fade-in">
            <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-4 flex gap-3 text-emerald-900 mb-6">
                <FileText className="h-5 w-5 shrink-0 text-emerald-600 mt-0.5" />
                <div className="text-sm">
                    <p className="font-semibold mb-1">Don't start from scratch</p>
                    <p className="opacity-90 leading-relaxed">Check off what you already have. We'll help you organize it later. Even drafts or partial documents count.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {items.map((item) => {
                    const Icon = item.icon;
                    const isChecked = data?.existingDocs?.includes(item.id);

                    return (
                        <div
                            key={item.id}
                            onClick={() => toggleItem(item.id)}
                            className={cn(
                                "cursor-pointer relative p-4 rounded-xl border transition-all duration-200 group flex flex-col gap-3 hover:shadow-md",
                                isChecked
                                    ? "bg-indigo-50/50 border-indigo-200 ring-1 ring-indigo-500/20"
                                    : "bg-white border-slate-200 hover:border-indigo-300"
                            )}
                        >
                            <div className="flex items-start justify-between">
                                <div className={cn(
                                    "p-2 rounded-lg transition-colors",
                                    isChecked ? "bg-indigo-100 text-indigo-700" : "bg-slate-50 text-slate-500 group-hover:bg-slate-100"
                                )}>
                                    <Icon className="h-5 w-5" />
                                </div>
                                <Checkbox
                                    id={item.id}
                                    checked={isChecked}
                                    onCheckedChange={() => toggleItem(item.id)}
                                    className={cn("data-[state=checked]:bg-indigo-600 data-[state=checked]:border-indigo-600")}
                                />
                            </div>

                            <div>
                                <Label htmlFor={item.id} className="cursor-pointer font-semibold text-slate-800 block mb-1">
                                    {item.label}
                                </Label>
                                <p className="text-xs text-slate-500 leading-snug">
                                    {item.desc}
                                </p>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

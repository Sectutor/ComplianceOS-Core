import React from "react";
import { Label } from "@complianceos/ui/ui/label";
import { Input } from "@complianceos/ui/ui/input";
import { cn } from "@/lib/utils";
import { READINESS_STANDARDS } from "@/data/readiness-standards";
import { Crown, Terminal, Users, Scale, ShoppingCart, UserCircle2, UserCheck } from "lucide-react";

interface WizardStepProps {
    data: any;
    onChange: (d: any) => void;
    standardId?: string;
}

export function WizardStep2_Stakeholders({ data, onChange, standardId }: WizardStepProps) {
    const standardConfig = standardId ? READINESS_STANDARDS[standardId] : null;
    const customRoles = standardConfig?.steps.stakeholders.roles;

    const defaultRoles = [
        {
            id: "Leadership / Sponsor",
            label: "Leadership / Sponsor",
            icon: Crown,
            description: "Sign-off authority for budget & risk acceptance.",
            color: "text-amber-600",
            bg: "bg-amber-50"
        },
        {
            id: "IT / Engineering",
            label: "IT / Engineering",
            icon: Terminal,
            description: "Implements technical controls & manages infrastructure.",
            color: "text-blue-600",
            bg: "bg-blue-50"
        },
        {
            id: "HR",
            label: "Human Resources",
            icon: Users,
            description: "Manages onboarding, background checks & training.",
            color: "text-rose-600",
            bg: "bg-rose-50"
        },
        {
            id: "Legal / Compliance",
            label: "Legal / Compliance",
            icon: Scale,
            description: "Reviews contracts, policies & regulatory obligations.",
            color: "text-indigo-600",
            bg: "bg-indigo-50"
        },
        {
            id: "Procurement",
            label: "Procurement",
            icon: ShoppingCart,
            description: "Manages vendor risk & software supply chain.",
            color: "text-emerald-600",
            bg: "bg-emerald-50"
        }
    ];

    const roles = customRoles ? customRoles.map(r => ({
        ...r,
        icon: UserCheck, // Default icon for custom roles for now
        color: "text-indigo-600",
        bg: "bg-indigo-50"
    })) : defaultRoles;

    const updateRole = (role: string, name: string) => {
        onChange({ ...data, [role]: name });
    };

    return (
        <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500 fade-in">
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 flex gap-3 text-slate-600 mb-6">
                <UserCircle2 className="h-5 w-5 shrink-0 text-slate-500 mt-0.5" />
                <div className="text-sm">
                    <p className="font-semibold text-slate-800 mb-1">Audit Team Assembly</p>
                    <p className="opacity-90 leading-relaxed">Auditors will want to speak with these specific owners. Assigning them early ensures accountability.</p>
                </div>
            </div>

            <div className="grid gap-4">
                {roles.map((role) => {
                    const Icon = role.icon;
                    return (
                        <div key={role.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:border-indigo-200 hover:shadow-md transition-all group flex items-start sm:items-center gap-4 flex-col sm:flex-row">
                            <div className={cn("p-3 rounded-lg shrink-0 transition-colors group-hover:scale-110 duration-300", role.bg, role.color)}>
                                <Icon className="h-5 w-5" />
                            </div>

                            <div className="flex-1 w-full grid gap-1.5">
                                <Label className="text-base font-semibold text-slate-800">{role.label}</Label>
                                <p className="text-xs text-slate-400 font-medium">{role.description}</p>
                            </div>

                            <div className="w-full sm:w-[50%]">
                                <Input
                                    placeholder={`Name or email...`}
                                    value={data?.[role.id] || ""}
                                    onChange={(e) => updateRole(role.id, e.target.value)}
                                    className="bg-slate-50 border-slate-200 focus-visible:ring-indigo-500"
                                />
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

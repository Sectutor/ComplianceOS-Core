import React from "react";
import { Input } from "@complianceos/ui/ui/input";
import { Label } from "@complianceos/ui/ui/label";
import { Textarea } from "@complianceos/ui/ui/textarea";
import { Building2, Globe, Ban, Server, Info, Activity } from "lucide-react";
import { cn } from "@/lib/utils";

import { READINESS_STANDARDS } from "@/data/readiness-standards";
import { Checkbox } from "@complianceos/ui/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@complianceos/ui/ui/radio-group";

interface WizardStepProps {
    data: any;
    onChange: (d: any) => void;
    standardId: string;
}

export function WizardStep1_Scope({ data, onChange, standardId }: WizardStepProps) {
    const config = READINESS_STANDARDS[standardId] || READINESS_STANDARDS["ISO27001"];
    const { hints, extraFields } = config.steps.scope;

    const handleExtraFieldChange = (fieldId: string, value: any) => {
        onChange({ ...data, [fieldId]: value });
    };

    return (
        <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500 fade-in">
            {/* Intro / Context */}
            <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-4 flex gap-3 text-indigo-900 mb-6">
                <Info className="h-5 w-5 shrink-0 text-indigo-600 mt-0.5" />
                <div className="text-sm">
                    <p className="font-semibold mb-1">Why this matters</p>
                    <p className="opacity-90 leading-relaxed">Defining your scope accurately prevents "scope creep" during the audit. Be specific about what is <span className="font-semibold">in</span> and what is <span className="font-semibold">out</span>.</p>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                {/* Org Boundaries */}
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow group">
                    <div className="flex items-center gap-2 mb-3">
                        <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg group-hover:bg-indigo-100 transition-colors">
                            <Building2 className="h-4 w-4" />
                        </div>
                        <Label className="text-base font-semibold text-slate-800 cursor-pointer">Organizational Boundaries</Label>
                    </div>
                    <Textarea
                        placeholder="e.g., Entire Organization, Product Engineering Unit..."
                        value={data?.orgBoundaries || ""}
                        onChange={(e) => onChange({ ...data, orgBoundaries: e.target.value })}
                        className="min-h-[100px] bg-slate-50 border-slate-200 focus-visible:ring-indigo-500 resize-none text-sm"
                    />
                    <p className="text-[11px] text-slate-400 mt-2 font-medium">{hints.orgBoundaries}</p>
                </div>

                {/* Dynamic Extra Fields (e.g., SOC 2 TSC, HIPAA Entity Type) */}
                {extraFields?.map((field, idx) => (
                    <div key={idx} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow group md:col-span-2">
                        <div className="flex items-center gap-2 mb-4">
                            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                                <Activity className="h-4 w-4" />
                            </div>
                            <Label className="text-base font-semibold text-slate-800">{field.label}</Label>
                        </div>

                        {/* Wrapper for different field types */}
                        <div className="pl-1">
                            {field.type === "soc2_tsc" && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {field.options?.map((opt) => (
                                        <div key={opt.value} className="flex items-start space-x-3 p-3 rounded-lg border border-slate-100 bg-slate-50/50 hover:bg-white hover:border-indigo-200 transition-all cursor-pointer"
                                            onClick={() => {
                                                const current = data.soc2_tsc || [];
                                                const newValue = current.includes(opt.value)
                                                    ? current.filter((v: string) => v !== opt.value)
                                                    : [...current, opt.value];
                                                handleExtraFieldChange("soc2_tsc", newValue);
                                            }}
                                        >
                                            <Checkbox
                                                checked={(data.soc2_tsc || []).includes(opt.value)}
                                                onCheckedChange={() => { }} // Handling click on parent div
                                                className="mt-0.5"
                                            />
                                            <div className="space-y-1">
                                                <Label className="text-sm font-semibold text-slate-700 cursor-pointer">{opt.label}</Label>
                                                <p className="text-xs text-slate-500 leading-snug">{opt.description}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {field.type === "hipaa_entity_type" && (
                                <RadioGroup
                                    value={data.hipaa_entity_type}
                                    onValueChange={(val) => handleExtraFieldChange("hipaa_entity_type", val)}
                                    className="grid grid-cols-1 sm:grid-cols-2 gap-4"
                                >
                                    {field.options?.map((opt) => (
                                        <div key={opt.value} className={cn(
                                            "flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all",
                                            data.hipaa_entity_type === opt.value
                                                ? "bg-indigo-50 border-indigo-200 shadow-sm"
                                                : "bg-white border-slate-200 hover:border-slate-300"
                                        )}>
                                            <RadioGroupItem value={opt.value} id={opt.value} />
                                            <div>
                                                <Label htmlFor={opt.value} className="font-semibold text-slate-700 cursor-pointer">{opt.label}</Label>
                                                <p className="text-xs text-slate-500 mt-0.5">{opt.description}</p>
                                            </div>
                                        </div>
                                    ))}
                                </RadioGroup>
                            )}

                            {(field.type === "nist_tier" || field.type === "gdpr_role") && (
                                <RadioGroup
                                    value={data[field.type]}
                                    onValueChange={(val) => handleExtraFieldChange(field.type, val)}
                                    className="space-y-3"
                                >
                                    {field.options?.map((opt) => (
                                        <div key={opt.value} className="flex items-center space-x-2">
                                            <RadioGroupItem value={opt.value} id={opt.value} />
                                            <Label htmlFor={opt.value} className="font-medium text-slate-700">{opt.label} <span className="text-slate-400 text-xs font-normal">- {opt.description}</span></Label>
                                        </div>
                                    ))}
                                </RadioGroup>
                            )}
                        </div>
                    </div>
                ))}

                {/* Locations */}
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow group">
                    <div className="flex items-center gap-2 mb-3">
                        <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg group-hover:bg-indigo-100 transition-colors">
                            <Globe className="h-4 w-4" />
                        </div>
                        <Label className="text-base font-semibold text-slate-800 cursor-pointer">Physical Locations</Label>
                    </div>
                    <Textarea
                        placeholder="e.g., HQ in London, Data Center in Dublin..."
                        value={data?.locations || ""}
                        onChange={(e) => onChange({ ...data, locations: e.target.value })}
                        className="min-h-[100px] bg-slate-50 border-slate-200 focus-visible:ring-indigo-500 resize-none text-sm"
                    />
                    <p className="text-[11px] text-slate-400 mt-2 font-medium">{hints.locations}</p>
                </div>

                {/* Technologies */}
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow group md:col-span-2">
                    <div className="flex items-center gap-2 mb-3">
                        <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg group-hover:bg-indigo-100 transition-colors">
                            <Server className="h-4 w-4" />
                        </div>
                        <Label className="text-base font-semibold text-slate-800 cursor-pointer">Key Technologies / Cloud Environments</Label>
                    </div>
                    <Textarea
                        placeholder="e.g., AWS Production Account (123456789), Azure AD, Google Workspace..."
                        value={data?.technologies || ""}
                        onChange={(e) => onChange({ ...data, technologies: e.target.value })}
                        className="min-h-[80px] bg-slate-50 border-slate-200 focus-visible:ring-indigo-500 resize-none text-sm"
                    />
                    <p className="text-[11px] text-slate-400 mt-2 font-medium">{hints.technologies}</p>
                </div>

                {/* Out of Scope */}
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow group md:col-span-2 opacity-90">
                    <div className="flex items-center gap-2 mb-3">
                        <div className="p-2 bg-rose-50 text-rose-600 rounded-lg group-hover:bg-rose-100 transition-colors">
                            <Ban className="h-4 w-4" />
                        </div>
                        <Label className="text-base font-semibold text-slate-800 cursor-pointer">Out of Scope</Label>
                    </div>
                    <Textarea
                        placeholder="e.g., Marketing Website, Guest Wi-Fi, Test Environments..."
                        value={data?.outOfScope || ""}
                        onChange={(e) => onChange({ ...data, outOfScope: e.target.value })}
                        className="min-h-[80px] bg-slate-50 border-slate-200 focus-visible:ring-indigo-500 resize-none text-sm"
                    />
                    <p className="text-[11px] text-slate-400 mt-2 font-medium">Clearly list what is excluded to avoid auditor confusion.</p>
                </div>
            </div>
        </div>
    );
}

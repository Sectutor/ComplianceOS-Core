import React from "react";
import { RadioGroup, RadioGroupItem } from "@complianceos/ui/ui/radio-group";
import { Label } from "@complianceos/ui/ui/label";
import { Check, Target, Gauge, Flag, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";

interface WizardStepProps {
    data: any;
    onChange: (d: any) => void;
}

export function WizardStep5_Expectations({ data, onChange }: WizardStepProps) {
    return (
        <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500 fade-in">
            <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center p-3 bg-indigo-50 text-indigo-600 rounded-full mb-4">
                    <Target className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-bold text-slate-900">What is your primary goal?</h3>
                <p className="text-slate-500 mt-2 max-w-lg mx-auto">This helps us calibrate the strictness of our recommendations.</p>
            </div>

            <RadioGroup
                value={data?.goal || "gap_scan"}
                onValueChange={(val) => onChange({ ...data, goal: val })}
                className="grid gap-4"
            >
                <label
                    className={cn(
                        "relative flex items-start gap-4 p-6 rounded-xl border-2 transition-all cursor-pointer hover:shadow-md",
                        data?.goal === "gap_scan"
                            ? "border-indigo-600 bg-indigo-50/30 ring-1 ring-indigo-600/20"
                            : "border-slate-200 bg-white hover:border-indigo-200"
                    )}
                >
                    <div className={cn(
                        "p-3 rounded-lg shrink-0 transition-colors",
                        data?.goal === "gap_scan" ? "bg-indigo-100 text-indigo-700" : "bg-slate-100 text-slate-500"
                    )}>
                        <Gauge className="h-6 w-6" />
                    </div>

                    <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                            <Label className="text-lg font-bold text-slate-900 cursor-pointer">Gap Scan Only</Label>
                            {data?.goal === "gap_scan" && <Check className="h-5 w-5 text-indigo-600" />}
                        </div>
                        <p className="text-sm text-slate-500 leading-relaxed mb-3">
                            "We just want to know where we stand."
                        </p>
                        <ul className="text-xs text-slate-600 space-y-1">
                            <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-slate-400" />Quick identification of missing controls</li>
                            <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-slate-400" />No evidence collection required</li>
                        </ul>
                    </div>
                    <RadioGroupItem value="gap_scan" id="gap_scan" className="sr-only" />
                </label>

                <label
                    className={cn(
                        "relative flex items-start gap-4 p-6 rounded-xl border-2 transition-all cursor-pointer hover:shadow-md",
                        data?.goal === "audit_ready"
                            ? "border-indigo-600 bg-indigo-50/30 ring-1 ring-indigo-600/20"
                            : "border-slate-200 bg-white hover:border-indigo-200"
                    )}
                >
                    <div className={cn(
                        "p-3 rounded-lg shrink-0 transition-colors",
                        data?.goal === "audit_ready" ? "bg-indigo-100 text-indigo-700" : "bg-slate-100 text-slate-500"
                    )}>
                        <Trophy className="h-6 w-6" />
                    </div>

                    <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                            <Label className="text-lg font-bold text-slate-900 cursor-pointer">Audit Ready (6 Months)</Label>
                            {data?.goal === "audit_ready" && <Check className="h-5 w-5 text-indigo-600" />}
                        </div>
                        <p className="text-sm text-slate-500 leading-relaxed mb-3">
                            "We want to pass an audit."
                        </p>
                        <ul className="text-xs text-slate-600 space-y-1">
                            <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-slate-400" />Detailed remediation roadmap</li>
                            <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-slate-400" />Full evidence collection & review</li>
                        </ul>
                    </div>
                    <RadioGroupItem value="audit_ready" id="audit_ready" className="sr-only" />
                </label>
            </RadioGroup>
        </div>
    );
}

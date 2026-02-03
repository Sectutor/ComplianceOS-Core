import React from "react";
import { Textarea } from "@complianceos/ui/ui/textarea";
import { Label } from "@complianceos/ui/ui/label";
import { Input } from "@complianceos/ui/ui/input";
import { Briefcase, Building, Scale, Users2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface WizardStepProps {
    data: any;
    onChange: (d: any) => void;
}

export function WizardStep4_Context({ data, onChange }: WizardStepProps) {
    return (
        <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500 fade-in">
            <div className="bg-amber-50 border border-amber-100 rounded-lg p-4 flex gap-3 text-amber-900 mb-6">
                <Building className="h-5 w-5 shrink-0 text-amber-600 mt-0.5" />
                <div className="text-sm">
                    <p className="font-semibold mb-1">Business Context Matters</p>
                    <p className="opacity-90 leading-relaxed">Security isn't one-size-fits-all. A fintech company needs different controls than a marketing agency. Help us tailor the roadmap.</p>
                </div>
            </div>

            <div className="grid gap-6">
                <div className="group relative bg-white p-1 transition-all rounded-xl focus-within:ring-2 focus-within:ring-indigo-100">
                    <div className="absolute top-4 left-4 p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                        <Briefcase className="h-5 w-5" />
                    </div>
                    <div className="pl-16 pt-2 pr-4 pb-4">
                        <Label className="text-base font-semibold text-slate-800">Business Model Description</Label>
                        <p className="text-xs text-slate-500 mb-3">How do you make money? What data is critical to your success?</p>
                        <Textarea
                            placeholder="e.g. B2B SaaS platform for HR management. We process sensitive employee data and host it on AWS..."
                            value={data?.businessModel || ""}
                            onChange={(e) => onChange({ ...data, businessModel: e.target.value })}
                            className="min-h-[100px] resize-none border-slate-200 bg-slate-50/50 focus:bg-white transition-colors"
                        />
                    </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                    <div className="group relative bg-white p-1 transition-all rounded-xl focus-within:ring-2 focus-within:ring-indigo-100">
                        <div className="absolute top-4 left-4 p-2 bg-rose-50 text-rose-600 rounded-lg">
                            <Scale className="h-5 w-5" />
                        </div>
                        <div className="pl-16 pt-2 pr-4 pb-4">
                            <Label className="text-base font-semibold text-slate-800">Key Regulations</Label>
                            <p className="text-xs text-slate-500 mb-3">Any specific laws you must follow?</p>
                            <Input
                                placeholder="e.g. GDPR, HIPAA, CCPA..."
                                value={data?.regulations || ""}
                                onChange={(e) => onChange({ ...data, regulations: e.target.value })}
                                className="border-slate-200 bg-slate-50/50 focus:bg-white transition-colors"
                            />
                        </div>
                    </div>

                    <div className="group relative bg-white p-1 transition-all rounded-xl focus-within:ring-2 focus-within:ring-indigo-100">
                        <div className="absolute top-4 left-4 p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                            <Users2 className="h-5 w-5" />
                        </div>
                        <div className="pl-16 pt-2 pr-4 pb-4">
                            <Label className="text-base font-semibold text-slate-800">Interested Parties</Label>
                            <p className="text-xs text-slate-500 mb-3">Who is asking for this security?</p>
                            <Input
                                placeholder="e.g. Enterprise Customers, Investors..."
                                value={data?.parties || ""}
                                onChange={(e) => onChange({ ...data, parties: e.target.value })}
                                className="border-slate-200 bg-slate-50/50 focus:bg-white transition-colors"
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}


import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@complianceos/ui/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@complianceos/ui/ui/accordion";
import { Info } from "lucide-react";

export function PersonalizationReference() {
    return (
        <Card className="bg-blue-50/30 border-blue-100 shadow-sm">
            <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium uppercase tracking-wider text-blue-600 flex items-center gap-2">
                    <Info className="h-4 w-4" />
                    Personalization Guide
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <p className="text-xs text-slate-600 leading-relaxed">
                    Use double curly braces (e.g., <code>{`{{userName}}`}</code>) to insert dynamic data into your email templates.
                </p>

                <Accordion type="single" collapsible className="w-full">
                    <AccordionItem value="user" className="border-blue-100">
                        <AccordionTrigger className="text-[11px] py-2 font-semibold text-slate-700 hover:no-underline">User Information</AccordionTrigger>
                        <AccordionContent>
                            <div className="grid grid-cols-1 gap-1.5 pt-1">
                                <div className="flex flex-col gap-0.5 p-1.5 border rounded bg-white">
                                    <code className="text-indigo-600 font-bold text-[10px]">{`{{userName}}`}</code>
                                    <span className="text-[9px] text-slate-500">Full name of the recipient</span>
                                </div>
                                <div className="flex flex-col gap-0.5 p-1.5 border rounded bg-white">
                                    <code className="text-indigo-600 font-bold text-[10px]">{`{{firstName}}`}</code>
                                    <span className="text-[9px] text-slate-500">First name only</span>
                                </div>
                                <div className="flex flex-col gap-0.5 p-1.5 border rounded bg-white">
                                    <code className="text-indigo-600 font-bold text-[10px]">{`{{email}}`}</code>
                                    <span className="text-[9px] text-slate-500">Recipient email address</span>
                                </div>
                                <div className="flex flex-col gap-0.5 p-1.5 border rounded bg-white">
                                    <code className="text-indigo-600 font-bold text-[10px]">{`{{managerName}}`}</code>
                                    <span className="text-[9px] text-slate-500">Assigned manager name</span>
                                </div>
                            </div>
                        </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="app" className="border-blue-100">
                        <AccordionTrigger className="text-[11px] py-2 font-semibold text-slate-700 hover:no-underline">App & Company</AccordionTrigger>
                        <AccordionContent>
                            <div className="grid grid-cols-1 gap-1.5 pt-1">
                                <div className="flex flex-col gap-0.5 p-1.5 border rounded bg-white">
                                    <code className="text-indigo-600 font-bold text-[10px]">{`{{appName}}`}</code>
                                    <span className="text-[9px] text-slate-500">Product name (ComplianceOS)</span>
                                </div>
                                <div className="flex flex-col gap-0.5 p-1.5 border rounded bg-white">
                                    <code className="text-indigo-600 font-bold text-[10px]">{`{{companyName}}`}</code>
                                    <span className="text-[9px] text-slate-500">Client's organization name</span>
                                </div>
                                <div className="flex flex-col gap-0.5 p-1.5 border rounded bg-white">
                                    <code className="text-indigo-600 font-bold text-[10px]">{`{{magicLink}}`}</code>
                                    <span className="text-[9px] text-slate-500">Secure login/access URL</span>
                                </div>
                                <div className="flex flex-col gap-0.5 p-1.5 border rounded bg-white">
                                    <code className="text-indigo-600 font-bold text-[10px]">{`{{supportEmail}}`}</code>
                                    <span className="text-[9px] text-slate-500">System contact address</span>
                                </div>
                            </div>
                        </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="compliance" className="border-blue-100 last:border-b-0">
                        <AccordionTrigger className="text-[11px] py-2 font-semibold text-slate-700 hover:no-underline">Compliance & Timing</AccordionTrigger>
                        <AccordionContent>
                            <div className="grid grid-cols-1 gap-1.5 pt-1">
                                <div className="flex flex-col gap-0.5 p-1.5 border rounded bg-white">
                                    <code className="text-indigo-600 font-bold text-[10px]">{`{{frameworkName}}`}</code>
                                    <span className="text-[9px] text-slate-500">SOC2, ISO 27001, etc.</span>
                                </div>
                                <div className="flex flex-col gap-0.5 p-1.5 border rounded bg-white">
                                    <code className="text-indigo-600 font-bold text-[10px]">{`{{complianceScore}}`}</code>
                                    <span className="text-[9px] text-slate-500">Current readiness %</span>
                                </div>
                                <div className="flex flex-col gap-0.5 p-1.5 border rounded bg-white">
                                    <code className="text-indigo-600 font-bold text-[10px]">{`{{dueDate}}`}</code>
                                    <span className="text-[9px] text-slate-500">Target completion date</span>
                                </div>
                                <div className="flex flex-col gap-0.5 p-1.5 border rounded bg-white">
                                    <code className="text-indigo-600 font-bold text-[10px]">{`{{daysRemaining}}`}</code>
                                    <span className="text-[9px] text-slate-500">Countdown to deadline</span>
                                </div>
                            </div>
                        </AccordionContent>
                    </AccordionItem>
                </Accordion>
            </CardContent>
        </Card>
    );
}

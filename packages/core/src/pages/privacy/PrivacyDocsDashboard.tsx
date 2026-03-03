import React from 'react';
import { useClientContext } from "@/contexts/ClientContext";
import { PrivacyLayout } from "./PrivacyLayout";
import { Button } from "@complianceos/ui/ui/button";
import { Plus, FileText, Shield, Globe, Lock, Loader2 } from "lucide-react";
import { trpc } from '@/lib/trpc';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@complianceos/ui/ui/card";
import { Badge } from "@complianceos/ui/ui/badge";
import { useLocation } from "wouter";
import { toast } from "sonner";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@complianceos/ui/ui/table";
import { PageGuide } from "@/components/PageGuide";
import { cn } from "@/lib/utils";

export default function PrivacyDocsDashboard() {
    const { selectedClientId } = useClientContext();
    const clientId = selectedClientId || 0;
    const [location, setLocation] = useLocation();

    const { data: policies, isLoading } = trpc.clientPolicies.list.useQuery({
        clientId,
        module: 'privacy'
    }, { enabled: !!clientId });

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900">Privacy Documentation</h1>
                    <p className="text-slate-500 text-lg">Manage your privacy policies, notices, and procedural documents.</p>
                </div>
                <div className="flex items-center gap-3">
                    <PageGuide
                        title="Privacy Documentation"
                        description="Build and maintain your full library of GDPR-required privacy documents and notices."
                        rationale="GDPR Articles 13 & 14 mandate data subjects be informed about data processing. A documented policy library is not just good governance—it is a legal requirement with fines up to 4% of global annual turnover."
                        howToUse={[
                            {
                                step: "Check Coverage",
                                description: "Review the recommended document cards at the top to see which mandatory policies you already have.",
                                targetId: "privacy-docs-recommended"
                            },
                            {
                                step: "Add Document",
                                description: "Create a new privacy policy, notice, or procedure from the policy builder.",
                                targetId: "privacy-docs-add-btn"
                            },
                            {
                                step: "Manage Library",
                                description: "View, edit, and version-control all your privacy documents in the table registry.",
                                targetId: "privacy-docs-table"
                            }
                        ]}
                        scenarios={[
                            {
                                title: "GDPR Accountability Evidence",
                                example: "A Data Protection Authority requests evidence of your privacy program. Export your complete document registry as proof of Article 5(2) accountability principles.",
                                auditTip: "Auditors check for 'Currency'. Ensure all policies show a review date within the last 12 months and a named owner/DPO who approved the document."
                            },
                            {
                                title: "New Product Launch",
                                example: "Your team is launching a new feature that collects user location data. Add a new privacy notice specific to that feature, linking it to the corresponding ROPA entry.",
                                auditTip: "GDPR requires purpose limitation. Each document must clearly state the lawful basis and purpose for processing the data it covers."
                            }
                        ]}
                        integrations={[
                            { name: "ROPA", description: "Privacy documents are linked to their corresponding ROPA processing activities." },
                            { name: "Governance", description: "Document approval status feeds into your overall compliance maturity score." }
                        ]}
                    />
                    <Button
                        id="privacy-docs-add-btn"
                        onClick={() => setLocation(`/clients/${clientId}/policies/new?module=privacy`)}
                        className="bg-[#3ABEF9] hover:bg-[#1C4D8D] text-white font-bold h-11 px-6 rounded-xl shadow-lg shadow-sky-100 transition-all active:scale-95"
                    >
                        <Plus className="mr-2 h-5 w-5" /> Add Document
                    </Button>
                </div>
            </div>

            {isLoading ? (
                <div className="flex flex-col items-center justify-center p-24 space-y-4">
                    <Loader2 className="h-12 w-12 animate-spin text-[#3ABEF9]" />
                    <p className="text-slate-400 font-medium animate-pulse">Retrieving policy library...</p>
                </div>
            ) : (
                <div className="space-y-10">
                    {/* Recommended Docs Cards */}
                    <div id="privacy-docs-recommended" className="grid gap-6 md:grid-cols-3">
                        <Card className="border-none shadow-xl shadow-slate-200/50 rounded-2xl bg-white overflow-hidden ring-1 ring-slate-200/50 hover:-translate-y-1 transition-all">
                            <CardHeader className="pb-4">
                                <div className="flex justify-between items-start">
                                    <div className="h-10 w-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                                        <Shield className="h-5 w-5" />
                                    </div>
                                    {policies?.some(p => p.name.toLowerCase().includes("privacy policy")) && (
                                        <Badge className="bg-emerald-100 text-emerald-700 border-none font-bold text-[10px] uppercase">Detected</Badge>
                                    )}
                                </div>
                                <CardTitle className="text-xl font-bold mt-4 text-slate-900">Privacy Policy</CardTitle>
                                <CardDescription className="text-slate-500">Public-facing notice explaining data handling practices.</CardDescription>
                            </CardHeader>
                        </Card>
                        <Card className="border-none shadow-xl shadow-slate-200/50 rounded-2xl bg-white overflow-hidden ring-1 ring-slate-200/50 hover:-translate-y-1 transition-all">
                            <CardHeader className="pb-4">
                                <div className="flex justify-between items-start">
                                    <div className="h-10 w-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                                        <Globe className="h-5 w-5" />
                                    </div>
                                    {policies?.some(p => p.name.toLowerCase().includes("cookie")) && (
                                        <Badge className="bg-emerald-100 text-emerald-700 border-none font-bold text-[10px] uppercase">Detected</Badge>
                                    )}
                                </div>
                                <CardTitle className="text-xl font-bold mt-4 text-slate-900">Cookie Policy</CardTitle>
                                <CardDescription className="text-slate-500">Transparency about tracking and cookie technologies.</CardDescription>
                            </CardHeader>
                        </Card>
                        <Card className="border-none shadow-xl shadow-slate-200/50 rounded-2xl bg-white overflow-hidden ring-1 ring-slate-200/50 hover:-translate-y-1 transition-all">
                            <CardHeader className="pb-4">
                                <div className="flex justify-between items-start">
                                    <div className="h-10 w-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
                                        <Lock className="h-5 w-5" />
                                    </div>
                                    {policies?.some(p => p.name.toLowerCase().includes("retention")) && (
                                        <Badge className="bg-emerald-100 text-emerald-700 border-none font-bold text-[10px] uppercase">Detected</Badge>
                                    )}
                                </div>
                                <CardTitle className="text-xl font-bold mt-4 text-slate-900">Data Retention</CardTitle>
                                <CardDescription className="text-slate-500">Rules defining storage limits for user data.</CardDescription>
                            </CardHeader>
                        </Card>
                    </div>

                    {/* Registry */}
                    <div id="privacy-docs-table" className="rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-200/50 overflow-hidden">
                        <Table>
                            <TableHeader className="bg-slate-50/50">
                                <TableRow className="hover:bg-transparent border-0">
                                    <TableHead className="font-bold text-slate-700 h-14">Document Name</TableHead>
                                    <TableHead className="font-bold text-slate-700 h-14">Status</TableHead>
                                    <TableHead className="font-bold text-slate-700 h-14">Version</TableHead>
                                    <TableHead className="font-bold text-slate-700 h-14">Last Updated</TableHead>
                                    <TableHead className="text-right font-bold text-slate-700 h-14 px-6">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {policies && policies.length > 0 ? (
                                    policies.map((policy, idx) => (
                                        <TableRow
                                            key={policy.id}
                                            className="hover:bg-slate-50/80 transition-colors group border-b border-slate-100 last:border-0"
                                            style={{ animationDelay: `${idx * 50}ms` }}
                                        >
                                            <TableCell className="py-5 font-bold text-slate-900">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-10 w-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:text-[#3ABEF9] transition-colors">
                                                        <FileText className="h-5 w-5" />
                                                    </div>
                                                    {policy.name}
                                                </div>
                                            </TableCell>
                                            <TableCell className="py-5">
                                                <Badge className={cn(
                                                    "border-none font-bold uppercase text-[10px] tracking-wider px-2.5 py-1",
                                                    policy.status === 'approved' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'
                                                )}>
                                                    {policy.status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="py-5 text-slate-500 font-medium font-mono text-xs">v{policy.version}</TableCell>
                                            <TableCell className="py-5 text-slate-500 font-medium tabular-nums">{new Date(policy.updatedAt).toLocaleDateString()}</TableCell>
                                            <TableCell className="text-right py-5 px-6 gap-2 flex justify-end">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="text-[#3ABEF9] hover:text-[#1C4D8D] hover:bg-sky-50 font-bold rounded-lg transition-all"
                                                    onClick={() => setLocation(`/clients/${clientId}/policies/${policy.id}`)}
                                                >
                                                    View / Edit
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={5} className="h-72 text-center text-slate-400">
                                            <div className="flex flex-col items-center justify-center space-y-4">
                                                <div className="p-6 bg-slate-50 rounded-2xl">
                                                    <FileText className="h-12 w-12 text-slate-300" />
                                                </div>
                                                <div className="space-y-1">
                                                    <p className="font-bold text-slate-900 text-lg">No documents found</p>
                                                    <p className="max-w-xs mx-auto">Start by creating mandatory privacy documents to build your compliance library.</p>
                                                </div>
                                                <Button
                                                    variant="outline"
                                                    onClick={() => setLocation(`/clients/${clientId}/policies/new?module=privacy`)}
                                                    className="border-slate-200 hover:bg-slate-50 font-bold rounded-xl"
                                                >
                                                    Initialize Document Library
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </div>
            )}
        </div>
    );
}

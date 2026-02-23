import React, { useState } from 'react';
import NIST80037Layout from "./NIST80037Layout";
import { Breadcrumb } from "@/components/Breadcrumb";
import { useParams } from "wouter";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@complianceos/ui/ui/card";
import { Button } from "@complianceos/ui/ui/button";
import { Badge } from "@complianceos/ui/ui/badge";
import { Input } from "@complianceos/ui/ui/input";
import { Search, FileText, Upload, FolderOpen, Loader2 } from "lucide-react";
import { useNistSystemId } from "./useNistSystem";

export default function NIST80037Artifacts() {
    const { id } = useParams<{ id: string }>();
    const clientId = parseInt(id || "0");
    const [searchQuery, setSearchQuery] = useState("");
    const systemId = useNistSystemId();

    // Fetch evidence for this system/client
    const { data: evidence, isLoading } = trpc.evidence.list.useQuery(
        { clientId, systemId: systemId || undefined },
        { enabled: !!clientId }
    );

    // Filter evidence based on search
    const filteredEvidence = evidence?.filter(e =>
        !searchQuery ||
        e.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.description?.toLowerCase().includes(searchQuery.toLowerCase())
    ) || [];

    return (
        <NIST80037Layout>
            <div className="space-y-8 w-full pb-20">
                <Breadcrumb
                    items={[
                        { label: "Dashboard", href: `/dashboard` },
                        { label: "NIST Hub", href: `/clients/${clientId}/nist` },
                        { label: "RMF System Posture", href: `/clients/${clientId}/nist/rmf` },
                        { label: "Evidence & Artifacts" },
                    ]}
                />

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 flex items-center gap-3">
                            <FolderOpen className="w-8 h-8 text-emerald-600" />
                            Evidence & Artifacts
                        </h1>
                        <p className="text-slate-500 mt-2 font-medium">
                            Manage evidence artifacts for your RMF authorization package.
                        </p>
                    </div>
                    <div className="flex gap-3">
                        <Button variant="outline" className="gap-2">
                            <Upload className="w-4 h-4" />
                            Upload Artifact
                        </Button>
                        <Button className="bg-emerald-600 hover:bg-emerald-700 gap-2">
                            <FileText className="w-4 h-4" />
                            Generate Package
                        </Button>
                    </div>
                </div>

                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                    <div className="relative max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input
                            placeholder="Search artifacts by name or description..."
                            className="pl-10 bg-slate-50"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                {isLoading ? (
                    <div className="flex items-center justify-center py-20">
                        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
                    </div>
                ) : filteredEvidence.length === 0 ? (
                    <Card className="border-dashed border-2 border-slate-200">
                        <CardContent className="flex flex-col items-center justify-center py-16">
                            <FolderOpen className="h-16 w-16 text-slate-200 mb-4" />
                            <h3 className="text-xl font-bold text-slate-900 mb-2">No Evidence Artifacts Found</h3>
                            <p className="text-slate-500 text-center max-w-md mb-6">
                                Upload evidence artifacts to build your RMF authorization package. Evidence can include policies, procedures, screenshots, and configuration documentation.
                            </p>
                            <Button className="bg-emerald-600 hover:bg-emerald-700">
                                <Upload className="w-4 h-4 mr-2" />
                                Upload First Artifact
                            </Button>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid gap-4">
                        {filteredEvidence.map((item: any) => (
                            <Card key={item.id} className="hover:shadow-md transition-shadow">
                                <CardContent className="p-4 flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="p-3 bg-emerald-50 rounded-lg">
                                            <FileText className="w-5 h-5 text-emerald-600" />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-slate-900">{item.title || item.evidenceId}</h4>
                                            <p className="text-sm text-slate-500">{item.description || 'No description'}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <Badge variant={item.status === 'verified' ? 'default' : 'outline'} className="bg-emerald-50 text-emerald-700">
                                            {item.status || 'pending'}
                                        </Badge>
                                        <Button variant="ghost" size="sm">View</Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </NIST80037Layout>
    );
}

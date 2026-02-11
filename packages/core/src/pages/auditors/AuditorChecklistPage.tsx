
import React, { useState } from "react";
import { useParams } from "wouter";
import { trpc } from "@/lib/trpc";
import {
    Download,
    ShieldCheck,
    FileCheck,
    Search,
    AlertCircle,
    CheckCircle2,
    Loader2
} from "lucide-react"; // Using accessible icons
import { Button } from "@complianceos/ui/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@complianceos/ui/ui/card";
import { Badge } from "@complianceos/ui/ui/badge";
import { Input } from "@complianceos/ui/ui/input";
import { toast } from "sonner";
import { Separator } from "@complianceos/ui/ui/separator";

// Mock data for UI development if backend is not fully ready
// In real app, these would come from trpc queries
const FRAMEWORKS = ["ISO 27001", "SOC 2", "GDPR", "HIPAA"];

export default function AuditorChecklistPage() {
    const params = useParams();
    const clientId = parseInt(params.id || "0");
    const [selectedFramework, setSelectedFramework] = useState("ISO 27001");
    const [searchQuery, setSearchQuery] = useState("");

    // Fetch Client Details & Scope via Auditor Procedure
    const { data: scopeData, isLoading: isLoadingScope } = trpc.auditors.getScope.useQuery({ clientId });
    const client = scopeData?.client;
    const stats = scopeData?.stats;

    // Fetch Evidence (Read-Only access for auditors)
    // Note: Auditors might need a specific evidence list procedure too, but for now we reuse evidence.list
    const { data: evidenceList, isLoading: isLoadingEvidence } = trpc.evidence.list.useQuery({
        clientId,
        framework: selectedFramework
    });

    const isLoading = isLoadingScope || isLoadingEvidence;

    // Pack Mutation
    const packMutation = trpc.evidence.pack.useMutation({
        onSuccess: (data) => {
            toast.success("Evidence Pack Generated", {
                description: `Ready for download: ${data.filename}`
            });
            // Trigger download
            window.open(data.url, '_blank');
        },
        onError: (err) => {
            toast.error("Failed to generate pack", { description: err.message });
        }
    });

    const handleDownloadPack = () => {
        packMutation.mutate({ clientId, framework: selectedFramework });
    };

    if (isLoading) {
        return (
            <div className="flex h-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="h-12 w-12 animate-spin text-primary" />
                    <p className="text-muted-foreground animate-pulse">Loading Auditor Workspace...</p>
                </div>
            </div>
        );
    }

    // Filter evidence
    const filteredEvidence = evidenceList?.filter(item =>
        item.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.controlId?.toLowerCase().includes(searchQuery.toLowerCase())
    ) || [];

    const groupedByControl = filteredEvidence.reduce((acc, item) => {
        const key = item.controlId || "Unmapped";
        if (!acc[key]) acc[key] = [];
        acc[key].push(item);
        return acc;
    }, {} as Record<string, typeof filteredEvidence>);

    return (
        <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950">
            {/* Header */}
            <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                <div className="container flex h-16 items-center justify-between py-4">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                            <ShieldCheck className="h-6 w-6" />
                        </div>
                        <div>
                            <h1 className="text-lg font-semibold tracking-tight">Auditor Workspace</h1>
                            <p className="text-xs text-muted-foreground">
                                Read-Only Access • {client?.name || `Client #${clientId}`}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        {stats && (
                            <div className="flex gap-2 mr-4 hidden md:flex items-center">
                                <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-200 h-8 px-3">
                                    {stats.complianceScore}% Compliant
                                </Badge>
                                <Badge variant="secondary" className="bg-green-50 text-green-700 border-green-200 h-8 px-3">
                                    {stats.evidenceStatus.verified} Verified Proofs
                                </Badge>
                            </div>
                        )}
                        <Button
                            onClick={handleDownloadPack}
                            disabled={packMutation.isPending}
                            className="gap-2 shadow-lg shadow-primary/20 transition-all hover:shadow-primary/40"
                        >
                            {packMutation.isPending ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <Download className="h-4 w-4" />
                            )}
                            Download Evidence Pack
                        </Button>
                    </div>
                </div>
            </header>

            <main className="container py-8">
                <div className="grid gap-6">
                    {/* Controls & Frameworks */}
                    <div className="flex flex-col gap-6 md:flex-row">

                        {/* Sidebar / Framework Selector */}
                        <Card className="h-fit w-full md:w-64 shrink-0 border-none shadow-sm bg-transparent">
                            <div className="mb-4">
                                <h2 className="mb-2 px-2 text-sm font-semibold text-muted-foreground uppercase tracking-wider">Frameworks</h2>
                                <nav className="flex flex-col space-y-1">
                                    {FRAMEWORKS.map(fw => (
                                        <button
                                            key={fw}
                                            onClick={() => setSelectedFramework(fw)}
                                            className={`flex items-center justify-between rounded-md px-3 py-2 text-sm font-medium transition-colors ${selectedFramework === fw
                                                ? "bg-primary text-primary-foreground shadow-md"
                                                : "text-muted-foreground hover:bg-slate-200/50 dark:hover:bg-slate-800/50"
                                                }`}
                                        >
                                            {fw}
                                            {selectedFramework === fw && <CheckCircle2 className="h-4 w-4" />}
                                        </button>
                                    ))}
                                </nav>
                            </div>

                            <Separator className="my-4" />

                            <div className="px-2">
                                <div className="rounded-lg border bg-card p-4 text-card-foreground shadow-sm">
                                    <div className="flex items-center gap-2 text-sm font-semibold">
                                        <AlertCircle className="h-4 w-4 text-blue-500" />
                                        Audit Instructions
                                    </div>
                                    <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
                                        This workspace provides a scoped view of the client's compliance posture.
                                        Use the "Download Evidence Pack" button to get a verified archive of all evidence.
                                    </p>
                                </div>
                            </div>
                        </Card>

                        {/* Main Content */}
                        <div className="flex-1 space-y-6">

                            {/* Search & Stats */}
                            <div className="flex items-center justify-between gap-4">
                                <div className="relative flex-1 max-w-md">
                                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Search controls or evidence..."
                                        className="pl-9 bg-background border-slate-200 dark:border-slate-800"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                    />
                                </div>
                                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                    <span>{filteredEvidence.length} Evidence Items</span>
                                    <Separator orientation="vertical" className="h-4" />
                                    <span>{Object.keys(groupedByControl).length} Controls Covered</span>
                                </div>
                            </div>

                            {/* Controls List */}
                            <div className="space-y-4">
                                {Object.keys(groupedByControl).length === 0 ? (
                                    <Card className="flex flex-col items-center justify-center p-12 text-center border-dashed">
                                        <div className="rounded-full bg-slate-100 p-4 dark:bg-slate-800 mb-4">
                                            <FileCheck className="h-8 w-8 text-slate-400" />
                                        </div>
                                        <h3 className="text-lg font-semibold">No Evidence Found</h3>
                                        <p className="text-sm text-muted-foreground max-w-sm mt-2">
                                            There is no evidence mapped to {selectedFramework} controls yet, or your search query returned no results.
                                        </p>
                                    </Card>
                                ) : (
                                    Object.entries(groupedByControl).map(([controlId, items]) => (
                                        <Card key={controlId} className="overflow-hidden transition-all hover:shadow-md border-l-4 border-l-primary/50">
                                            <div className="border-b bg-slate-50/50 px-6 py-3 dark:bg-slate-900/50 flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <Badge variant="secondary" className="font-mono bg-slate-200 dark:bg-slate-800">{controlId}</Badge>
                                                    <span className="text-sm font-medium text-muted-foreground">Mapped Items: {items.length}</span>
                                                </div>
                                                <Badge variant={items.some(i => i.status === 'verified') ? 'default' : 'outline'}>
                                                    {items.some(i => i.status === 'verified') ? 'Verified' : 'Pending Review'}
                                                </Badge>
                                            </div>
                                            <CardContent className="p-0">
                                                <ul className="divide-y">
                                                    {items.map(evidence => (
                                                        <li key={evidence.id} className="flex items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-slate-900/20 transition-colors">
                                                            <div className="flex items-start gap-3">
                                                                <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded bg-blue-50 text-blue-600 dark:bg-blue-950/30 dark:text-blue-400">
                                                                    <FileCheck className="h-4 w-4" />
                                                                </div>
                                                                <div>
                                                                    <p className="text-sm font-medium leading-none">{evidence.description || "Untitled Evidence"}</p>
                                                                    <p className="mt-1 text-xs text-muted-foreground line-clamp-1">
                                                                        Source: {evidence.source || "Manual Upload"} • {new Date(evidence.createdAt).toLocaleDateString()}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                            <Button variant="ghost" size="sm" className="h-8 text-xs">
                                                                View
                                                            </Button>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </CardContent>
                                        </Card>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}

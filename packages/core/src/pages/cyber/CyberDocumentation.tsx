
import { useState } from "react";
import CyberLayout from "./CyberLayout";
import { Button } from "@complianceos/ui/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@complianceos/ui/ui/card";
import { Plus, FileText, Search, ShieldCheck, Link2, ExternalLink, FolderOpen, AlertTriangle, FileCheck, Building2 } from "lucide-react";
import { Input } from "@complianceos/ui/ui/input";
import { trpc } from "@/lib/trpc";
import { useClientContext } from "@/contexts/ClientContext";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@complianceos/ui/ui/table";
import { Badge } from "@complianceos/ui/ui/badge";
import { Skeleton } from "@complianceos/ui/ui/skeleton";
import { EnhancedDialog } from "@complianceos/ui/ui/enhanced-dialog";
import { useLocation } from "wouter";
import { PageGuide } from "@/components/PageGuide";

// Define the linked evidence sources
const linkedEvidenceSources = [
    {
        id: 'bcp',
        title: 'Business Continuity Plans',
        description: 'BIA, Recovery Plans, and BCM documentation',
        icon: Building2,
        path: '/business-continuity',
        color: 'text-blue-600 bg-blue-50'
    },
    {
        id: 'policies',
        title: 'Security Policies',
        description: 'Information Security, Access Control, and other policies',
        icon: FileCheck,
        path: '/client-policies',
        color: 'text-green-600 bg-green-50'
    },
    {
        id: 'risks',
        title: 'Risk Management',
        description: 'Risk assessments, mitigations, and treatment plans',
        icon: AlertTriangle,
        path: '/risks',
        color: 'text-orange-600 bg-orange-50'
    },
    {
        id: 'controls',
        title: 'Control Framework',
        description: 'Implemented controls and their evidence',
        icon: ShieldCheck,
        path: '/client-controls',
        color: 'text-purple-600 bg-purple-50'
    }
];

export default function CyberDocumentation() {
    const { selectedClientId } = useClientContext();
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [, setLocation] = useLocation();

    // Fetch cyber policies
    const { data: policies, isLoading, refetch } = trpc.clientPolicies.list.useQuery(
        { clientId: selectedClientId || 0, module: 'cyber' },
        { enabled: !!selectedClientId }
    );

    const createMutation = trpc.clientPolicies.create.useMutation({
        onSuccess: () => {
            setIsCreateOpen(false);
            refetch();
        }
    });

    const handleCreate = (e: React.FormEvent) => {
        e.preventDefault();
        const form = e.target as HTMLFormElement;
        const name = (form.elements.namedItem('name') as HTMLInputElement).value;
        if (!selectedClientId) return;

        createMutation.mutate({
            clientId: selectedClientId,
            name,
            module: 'cyber',
            status: 'draft',
            content: '# New NIS2 Policy\n\nDraft content...'
        });
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="animate-slide-down">
                <PageGuide
                    title="Documentation & Evidence"
                    description="Repository for NIS2 required policies and linked evidence."
                    rationale="Demonstrable compliance requires organized, accessible documentation of policies and evidence."
                    howToUse={[
                        { step: "Create", description: "Draft and approve NIS2-specific policies." },
                        { step: "Link", description: "Connect evidence from other modules (Risks, BCP, Controls)." },
                        { step: "Review", description: "Ensure all documentation is up-to-date and approved." }
                    ]}
                />
            </div>

            {/* Linked Evidence Sources */}
            <Card className="border-none shadow-xl shadow-slate-200/50 rounded-2xl bg-white overflow-hidden ring-1 ring-slate-200/50">
                <CardHeader className="bg-slate-50/50 border-b border-slate-100 p-6">
                    <CardTitle className="flex items-center gap-2 text-xl font-bold text-slate-900">
                        <Link2 className="h-5 w-5 text-[#3ABEF9]" />
                        Linked Evidence Sources
                    </CardTitle>
                    <CardDescription className="text-slate-500">
                        NIS2 compliance draws on documentation from multiple areas. Click to view related evidence.
                    </CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {linkedEvidenceSources.map((source) => {
                            const Icon = source.icon;
                            return (
                                <Card
                                    key={source.id}
                                    className="cursor-pointer group hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 border-slate-100 bg-white rounded-2xl overflow-hidden ring-1 ring-slate-200/50"
                                    onClick={() => setLocation(source.path)}
                                >
                                    <CardContent className="p-6">
                                        <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${source.color} mb-4 group-hover:scale-110 transition-transform`}>
                                            <Icon className="h-6 w-6" />
                                        </div>
                                        <h3 className="font-bold text-slate-900 group-hover:text-[#3ABEF9] transition-colors">{source.title}</h3>
                                        <p className="text-sm text-slate-500 mt-2 line-clamp-2">{source.description}</p>
                                        <div className="flex items-center gap-2 mt-4 text-xs font-bold text-[#3ABEF9] uppercase tracking-wider opacity-0 group-hover:opacity-100 transition-opacity">
                                            <ExternalLink className="h-3 w-3" />
                                            View Documents
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                </CardContent>
            </Card>

            {/* NIS2 Specific Documents */}
            <Card className="border-none shadow-xl shadow-slate-200/50 rounded-2xl bg-white overflow-hidden ring-1 ring-slate-200/50">
                <CardHeader className="bg-slate-50/50 border-b border-slate-100 p-6">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div className="space-y-1">
                            <CardTitle className="flex items-center gap-2 text-xl font-bold text-slate-900">
                                <FolderOpen className="h-5 w-5 text-[#3ABEF9]" />
                                NIS2 Specific Documents
                            </CardTitle>
                            <CardDescription className="text-slate-500">
                                Policies and procedures specifically created for NIS2 compliance.
                            </CardDescription>
                        </div>
                        <Button
                            onClick={() => setIsCreateOpen(true)}
                            className="bg-[#3ABEF9] hover:bg-[#1C4D8D] text-white font-bold h-11 px-6 rounded-xl shadow-lg shadow-sky-100 transition-all active:scale-95"
                        >
                            <Plus className="mr-2 h-5 w-5" /> Create Document
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="p-6 border-b border-slate-100">
                        <div className="relative w-full max-w-sm">
                            <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                            <Input
                                placeholder="Filter registry..."
                                className="pl-10 h-10 rounded-xl border-slate-200 focus:border-[#3ABEF9] focus:ring-[#3ABEF9]/20"
                            />
                        </div>
                    </div>

                    {isLoading ? (
                        <div className="p-12 space-y-4">
                            <Skeleton className="h-12 w-full rounded-xl" />
                            <Skeleton className="h-12 w-full rounded-xl" />
                            <Skeleton className="h-12 w-full rounded-xl" />
                        </div>
                    ) : policies && policies.length > 0 ? (
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader className="bg-slate-50/50">
                                    <TableRow className="hover:bg-transparent border-0">
                                        <TableHead className="font-bold text-slate-700 h-14 pl-6">Document Name</TableHead>
                                        <TableHead className="font-bold text-slate-700 h-14">Status</TableHead>
                                        <TableHead className="font-bold text-slate-700 h-14">Last Updated</TableHead>
                                        <TableHead className="text-right font-bold text-slate-700 h-14 pr-6">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {policies.map((doc: any, idx: number) => (
                                        <TableRow
                                            key={doc.id}
                                            className="hover:bg-slate-50/80 transition-colors group border-b border-slate-100 last:border-0"
                                            style={{ animationDelay: `${idx * 50}ms` }}
                                        >
                                            <TableCell className="py-5 font-bold text-slate-900 pl-6">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-9 w-9 rounded-lg bg-sky-50 flex items-center justify-center text-[#3ABEF9] border border-sky-100">
                                                        <FileText className="h-5 w-5" />
                                                    </div>
                                                    {doc.name}
                                                </div>
                                            </TableCell>
                                            <TableCell className="py-5">
                                                <Badge className={cn(
                                                    "border-none font-bold uppercase text-[10px] tracking-wider px-2.5 py-1",
                                                    doc.status === 'approved' ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"
                                                )}>
                                                    {doc.status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="py-5 text-slate-500 font-medium">
                                                {new Date(doc.updatedAt || new Date()).toLocaleDateString()}
                                            </TableCell>
                                            <TableCell className="text-right py-5 pr-6">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="text-[#3ABEF9] hover:text-[#1C4D8D] hover:bg-sky-50 font-bold rounded-lg transition-all"
                                                    onClick={() => setLocation(`/clients/${selectedClientId}/policies/${doc.id}`)}
                                                >
                                                    Edit Content
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    ) : (
                        <div className="py-24 text-center space-y-4">
                            <div className="mx-auto h-20 w-20 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-200">
                                <ShieldCheck className="h-10 w-10" />
                            </div>
                            <div className="space-y-1">
                                <h3 className="text-xl font-bold text-slate-900">Repository Empty</h3>
                                <p className="text-slate-500 max-w-sm mx-auto">Start by creating mandatory NIS2 policies such as the Information Security Policy.</p>
                            </div>
                            <Button
                                onClick={() => setIsCreateOpen(true)}
                                className="bg-[#3ABEF9] hover:bg-[#1C4D8D] text-white font-bold h-11 px-6 rounded-xl shadow-lg shadow-sky-100 mt-4"
                            >
                                <Plus className="mr-2 h-5 w-5" /> Initialize Repository
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>

            <EnhancedDialog
                open={isCreateOpen}
                onOpenChange={setIsCreateOpen}
                title="Create NIS2 Document"
                description="Add a new policy or evidence document to the repository."
            >
                <form onSubmit={handleCreate} className="space-y-6 pt-4">
                    <div className="space-y-2.5">
                        <label className="text-sm font-bold text-slate-700">Document Identifier / Name</label>
                        <Input
                            name="name"
                            placeholder="e.g. Incident Response Policy v1.0"
                            required
                            className="h-12 rounded-xl border-slate-200 focus:border-[#3ABEF9] focus:ring-[#3ABEF9]/20"
                        />
                    </div>
                    <div className="flex justify-end gap-3 pt-4">
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={() => setIsCreateOpen(false)}
                            className="font-bold text-slate-500 h-11 px-6 rounded-xl"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={createMutation.isLoading}
                            className="bg-[#3ABEF9] hover:bg-[#1C4D8D] text-white font-bold h-11 px-8 rounded-xl"
                        >
                            Create Document
                        </Button>
                    </div>
                </form>
            </EnhancedDialog>
        </div>
    );
}

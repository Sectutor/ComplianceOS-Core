
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
        <CyberLayout>
            <div className="space-y-8">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Documentation & Evidence</h1>
                    <p className="text-muted-foreground mt-1">Repository for NIS2 required policies and linked evidence from across your compliance program.</p>
                </div>

                {/* Linked Evidence Sources */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Link2 className="h-5 w-5" />
                            Linked Evidence Sources
                        </CardTitle>
                        <CardDescription>
                            NIS2 compliance draws on documentation from multiple areas. Click to view related evidence.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            {linkedEvidenceSources.map((source) => {
                                const Icon = source.icon;
                                return (
                                    <Card
                                        key={source.id}
                                        className="cursor-pointer hover:shadow-md transition-shadow border-2 hover:border-primary/30"
                                        onClick={() => setLocation(source.path)}
                                    >
                                        <CardContent className="p-4">
                                            <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${source.color} mb-3`}>
                                                <Icon className="h-5 w-5" />
                                            </div>
                                            <h3 className="font-semibold text-sm">{source.title}</h3>
                                            <p className="text-xs text-muted-foreground mt-1">{source.description}</p>
                                            <div className="flex items-center gap-1 mt-3 text-xs text-primary">
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
                <Card>
                    <CardHeader>
                        <div className="flex justify-between items-center">
                            <div>
                                <CardTitle className="flex items-center gap-2">
                                    <FolderOpen className="h-5 w-5" />
                                    NIS2 Specific Documents
                                </CardTitle>
                                <CardDescription>
                                    Policies and procedures specifically created for NIS2 compliance.
                                </CardDescription>
                            </div>
                            <Button onClick={() => setIsCreateOpen(true)}>
                                <Plus className="mr-2 h-4 w-4" /> Create Document
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="flex justify-between items-center mb-4">
                            <div className="relative w-72">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input placeholder="Search documents..." className="pl-8" />
                            </div>
                        </div>

                        {isLoading ? (
                            <div className="space-y-2">
                                <Skeleton className="h-12 w-full" />
                                <Skeleton className="h-12 w-full" />
                                <Skeleton className="h-12 w-full" />
                            </div>
                        ) : policies && policies.length > 0 ? (
                            <div className="border rounded-md">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Document Name</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead>Last Updated</TableHead>
                                            <TableHead className="text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {policies.map((doc: any) => (
                                            <TableRow key={doc.id}>
                                                <TableCell className="font-medium">
                                                    <div className="flex items-center gap-2">
                                                        <FileText className="h-4 w-4 text-blue-500" />
                                                        {doc.name}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant={doc.status === 'approved' ? 'default' : 'outline'}>{doc.status}</Badge>
                                                </TableCell>
                                                <TableCell className="text-muted-foreground text-sm">
                                                    {new Date(doc.updatedAt || new Date()).toLocaleDateString()}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => setLocation(`/clients/${selectedClientId}/policies/${doc.id}`)}
                                                    >
                                                        Edit
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        ) : (
                            <div className="border-dashed border-2 rounded-lg py-12">
                                <div className="flex flex-col items-center justify-center text-center">
                                    <div className="h-12 w-12 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                                        <ShieldCheck className="h-6 w-6 text-slate-400" />
                                    </div>
                                    <h3 className="font-semibold text-lg">No NIS2 Documents Yet</h3>
                                    <p className="text-muted-foreground max-w-sm mb-6 mt-2">
                                        Start by creating key NIS2 policies such as the Information Security Policy or Incident Response Plan.
                                    </p>
                                    <Button onClick={() => setIsCreateOpen(true)}>Create First Document</Button>
                                </div>
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
                    <form onSubmit={handleCreate} className="space-y-4 py-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Document Name</label>
                            <Input name="name" placeholder="e.g. Incident Response Plan" required />
                        </div>
                        <div className="flex justify-end gap-2 pt-4">
                            <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
                            <Button type="submit" disabled={createMutation.isLoading}>Create</Button>
                        </div>
                    </form>
                </EnhancedDialog>
            </div>
        </CyberLayout>
    );
}

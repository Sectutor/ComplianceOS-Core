
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@complianceos/ui/ui/card";
import { Button } from "@complianceos/ui/ui/button";
import { Badge } from "@complianceos/ui/ui/badge";
import { Shield, Settings, Upload, Loader2, Trash2 } from "lucide-react";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@complianceos/ui/ui/alert-dialog";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { FrameworkImportDialog } from "@/components/settings/FrameworkImportDialog";
import { ControlMappingsAdmin } from "@/components/settings/ControlMappingsAdmin";
import { CustomFrameworkImportWizard } from "@/components/settings/CustomFrameworkImportWizard";

interface FrameworksSettingsTabProps {
    clientId: number;
}

export function FrameworksSettingsTab({ clientId }: FrameworksSettingsTabProps) {
    const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
    const [isCustomImportWizardOpen, setIsCustomImportWizardOpen] = useState(false);
    const [frameworkToDelete, setFrameworkToDelete] = useState<any>(null);

    const { data: frameworks, isLoading: frameworksLoading, refetch: refetchFrameworks } = trpc.frameworks.list.useQuery({ clientId });

    const deleteFrameworkMutation = trpc.frameworks.delete.useMutation({
        onSuccess: () => {
            toast.success("Framework deleted successfully");
            setFrameworkToDelete(null);
            refetchFrameworks();
        },
        onError: (err) => toast.error("Failed to delete: " + err.message)
    });

    // Library Data
    const { data: libraryFrameworks, isLoading: libraryLoading, refetch: refetchLibrary } = trpc.frameworkImport.listFrameworks.useQuery({ clientId });
    const deleteLibraryFrameworkMutation = trpc.frameworkImport.deleteFramework.useMutation({
        onSuccess: () => {
            toast.success("Framework removed from library");
            refetchLibrary();
        },
        onError: (err) => toast.error(err.message)
    });

    return (
        <div className="space-y-6">
            {/* Info Alert for Downloads */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-900 flex items-start gap-3">
                <div className="min-w-5 pt-0.5"><Settings className="h-5 w-5 text-blue-600" /></div>
                <div>
                    <h4 className="font-semibold mb-1">Where to get the official framework files?</h4>
                    <ul className="list-disc pl-4 space-y-1 mb-2">
                        <li>
                            <strong>PCI DSS v4.0:</strong> Download the "PCI DSS v4.0" Excel file from the <a href="https://docs-library.pcisecuritystandards.org/" target="_blank" rel="noopener noreferrer" className="underline hover:text-blue-700 font-medium">PCI-SSC Document Library</a>.
                        </li>
                        <li>
                            <strong>CIS Controls v8.1:</strong> Download the Excel file from the <a href="https://www.cisecurity.org/controls/cis-controls-list" target="_blank" rel="noopener noreferrer" className="underline hover:text-blue-700 font-medium">official CIS website</a>.
                        </li>
                        <li>
                            <strong>CSA CCM v4:</strong> Download the "CCM v4.0.x" Excel file from the <a href="https://cloudsecurityalliance.org/artifacts/cloud-controls-matrix-v4" target="_blank" rel="noopener noreferrer" className="underline hover:text-blue-700 font-medium">Cloud Security Alliance website</a>.
                        </li>
                    </ul>
                    <p className="text-xs text-blue-700">Please ensure you download the official Excel (.xlsx) versions.</p>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div className="space-y-1">
                            <CardTitle className="flex items-center gap-2">
                                <Shield className="h-5 w-5 text-primary" />
                                Compliance Frameworks
                            </CardTitle>
                            <CardDescription>
                                Manage the compliance frameworks active for this organization. You can import licensed frameworks regarding PCI DSS, CIS, and CCM here.
                            </CardDescription>
                        </div>
                        <Button onClick={() => setIsImportDialogOpen(true)}>
                            <Upload className="h-4 w-4 mr-2" />
                            Import Framework
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    {frameworksLoading ? (
                        <div className="flex justify-center p-8">
                            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                        </div>
                    ) : frameworks?.length === 0 ? (
                        <div className="text-center py-12 border-2 border-dashed rounded-lg bg-muted/10">
                            <Shield className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                            <h3 className="text-lg font-medium">No Custom Frameworks</h3>
                            <p className="text-muted-foreground max-w-sm mx-auto mt-1 mb-4">
                                You haven't imported any client-specific frameworks yet. Import PCI DSS, CIS, or CCM to get started.
                            </p>
                            <Button variant="outline" onClick={() => setIsImportDialogOpen(true)}>
                                Import Framework
                            </Button>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {frameworks?.map((fw: any) => (
                                <div key={fw.id} className="flex items-center justify-between p-4 border rounded-lg bg-card hover:bg-muted/50 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-xs">
                                            {fw.name.substring(0, 3).toUpperCase()}
                                        </div>
                                        <div>
                                            <h4 className="font-semibold">{fw.name} <span className="text-xs font-normal text-muted-foreground">({fw.scope})</span></h4>
                                            <p className="text-xs text-muted-foreground">
                                                {fw.controlCount} controls • Imported: {new Date(fw.importedAt).toLocaleDateString()}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Active</Badge>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="text-muted-foreground hover:text-destructive"
                                            onClick={() => setFrameworkToDelete(fw)}
                                            disabled={deleteFrameworkMutation.isPending}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            <AlertDialog open={!!frameworkToDelete} onOpenChange={(open) => !open && setFrameworkToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Framework?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete <b>{frameworkToDelete?.name}</b>?
                            This will remove all associated controls and mappings. This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            className="bg-red-600 hover:bg-red-700"
                            onClick={() => {
                                if (frameworkToDelete) {
                                    deleteFrameworkMutation.mutate({ frameworkName: frameworkToDelete.name, clientId });
                                }
                            }}
                            disabled={deleteFrameworkMutation.isPending}
                        >
                            {deleteFrameworkMutation.isPending ? "Deleting..." : "Delete"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <div className="pt-8 border-t border-slate-200">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-slate-900">Framework Library (Reference)</h3>
                    <Button variant="outline" onClick={() => setIsCustomImportWizardOpen(true)}>
                        <Upload className="h-4 w-4 mr-2" />
                        Import to Library
                    </Button>
                </div>

                <Card className="mb-8">
                    <CardHeader>
                        <CardTitle>Imported Frameworks</CardTitle>
                        <CardDescription>
                            These frameworks are available for mapping and gap analysis but are not active controls.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {libraryLoading ? (
                            <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>
                        ) : libraryFrameworks?.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">
                                No frameworks in library. Import one to get started.
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {libraryFrameworks?.map((fw: any) => (
                                    <div key={fw.id} className="flex items-center justify-between p-4 border rounded-lg bg-card hover:bg-muted/50 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-xs">
                                                {fw.name.substring(0, 3).toUpperCase()}
                                            </div>
                                            <div>
                                                <h4 className="font-semibold">{fw.name} <span className="text-xs font-normal text-muted-foreground">v{fw.version}</span></h4>
                                                <p className="text-xs text-muted-foreground">
                                                    {fw.controlCount} controls • Imported: {new Date(fw.importedAt).toLocaleDateString()}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Badge variant="outline" className="bg-slate-100 text-slate-700 border-slate-200">Reference</Badge>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="text-muted-foreground hover:text-red-600"
                                                onClick={() => deleteLibraryFrameworkMutation.mutate({ frameworkId: fw.id })}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                <h3 className="text-lg font-semibold mb-4 text-slate-900">Advanced Harmonization</h3>
                <ControlMappingsAdmin clientId={clientId} />
            </div>

            <FrameworkImportDialog
                open={isImportDialogOpen}
                onOpenChange={setIsImportDialogOpen}
                clientId={clientId}
                onSuccess={() => refetchFrameworks()}
            />

            <CustomFrameworkImportWizard
                open={isCustomImportWizardOpen}
                onOpenChange={setIsCustomImportWizardOpen}
                clientId={clientId}
                onSuccess={() => refetchLibrary()}
            />
        </div>
    );
}

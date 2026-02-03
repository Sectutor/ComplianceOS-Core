
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@complianceos/ui/ui/dialog";
import { Button } from "@complianceos/ui/ui/button";
import { trpc } from "@/lib/trpc";
import { Loader2, Search, Link as LinkIcon, Unlink } from "lucide-react";
import { Input } from "@complianceos/ui/ui/input";
import { ScrollArea } from "@complianceos/ui/ui/scroll-area";
import { Badge } from "@complianceos/ui/ui/badge";
import { toast } from "sonner";

interface ControlMappingDialogProps {
    frameworkControlId: number;
    frameworkControlCode: string;
    currentMappingId?: number; // clientControlId if mapped
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
}

export function ControlMappingDialog({
    frameworkControlId,
    frameworkControlCode,
    currentMappingId,
    isOpen,
    onOpenChange,
    onSuccess
}: ControlMappingDialogProps) {
    const [search, setSearch] = useState("");
    const [selectedControlId, setSelectedControlId] = useState<number | null>(currentMappingId || null);

    const utils = trpc.useContext();

    // Fetch all client controls (optimized in real app to search server-side)
    const { data: controls, isLoading } = trpc.clientControls.list.useQuery();

    const mapMutation = trpc.frameworkImports.mapControl.useMutation({
        onSuccess: () => {
            toast.success("Control mapped successfully");
            utils.frameworkImports.getFrameworkControls.invalidate();
            utils.frameworkImports.getDashboardStats.invalidate();
            onSuccess();
            onOpenChange(false);
        },
        onError: (err: any) => toast.error(`Failed to map: ${err.message}`)
    });

    const unmapMutation = trpc.frameworkImports.unmapControl.useMutation({
        onSuccess: () => {
            toast.success("Control unmapped");
            utils.frameworkImports.getFrameworkControls.invalidate();
            utils.frameworkImports.getDashboardStats.invalidate();
            onSuccess();
            onOpenChange(false);
        },
        onError: (err: any) => toast.error(`Failed to unmap: ${err.message}`)
    });

    const filteredControls = controls?.filter(c =>
        c.controlId.toLowerCase().includes(search.toLowerCase()) ||
        c.name.toLowerCase().includes(search.toLowerCase())
    ) || [];

    const handleSave = () => {
        if (!selectedControlId) return;
        mapMutation.mutate({
            frameworkControlId,
            clientControlId: selectedControlId
        });
    };

    const handleUnmap = () => {
        if (confirm("Are you sure you want to remove this mapping?")) {
            unmapMutation.mutate({ frameworkControlId });
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Map Control: {frameworkControlCode}</DialogTitle>
                    <DialogDescription>
                        Link this imported control to your master control library.
                        Status will automatically sync from the master control.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <div className="flex items-center gap-2 border px-3 py-2 rounded-md">
                        <Search className="h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search master controls..."
                            className="border-0 focus-visible:ring-0 p-0 h-auto"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>

                    <ScrollArea className="h-[300px] border rounded-md p-2">
                        {isLoading ? (
                            <div className="flex flex-col items-center justify-center h-full gap-2 text-muted-foreground">
                                <Loader2 className="h-6 w-6 animate-spin" />
                                <p>Loading controls...</p>
                            </div>
                        ) : filteredControls.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">
                                No controls found matching "{search}"
                            </div>
                        ) : (
                            <div className="space-y-1">
                                {filteredControls.map((control) => (
                                    <div
                                        key={control.id}
                                        className={`flex items-start gap-3 p-3 rounded-md cursor-pointer transition-colors ${selectedControlId === control.id
                                            ? "bg-primary/10 border-primary/20 border"
                                            : "hover:bg-muted border border-transparent"
                                            }`}
                                        onClick={() => setSelectedControlId(control.id)}
                                    >
                                        <div className={`mt-1 h-4 w-4 rounded-full border flex items-center justify-center ${selectedControlId === control.id ? "border-primary bg-primary" : "border-muted-foreground"
                                            }`}>
                                            {selectedControlId === control.id && <div className="h-2 w-2 rounded-full bg-white" />}
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-baseline justify-between">
                                                <h4 className="font-medium text-sm">{control.controlId}</h4>
                                                <Badge variant="outline" className="text-[10px]">{control.status}</Badge>
                                            </div>
                                            <p className="text-sm font-medium">{control.name}</p>
                                            <p className="text-xs text-muted-foreground line-clamp-1">{control.description}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </ScrollArea>
                </div>

                <DialogFooter className="flex justify-between sm:justify-between items-center w-full">
                    <div>
                        {currentMappingId && (
                            <Button variant="destructive" size="sm" onClick={handleUnmap} disabled={unmapMutation.isLoading}>
                                <Unlink className="h-4 w-4 mr-2" />
                                Unmap
                            </Button>
                        )}
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                        <Button onClick={handleSave} disabled={!selectedControlId || mapMutation.isLoading}>
                            {mapMutation.isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                            Save Mapping
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

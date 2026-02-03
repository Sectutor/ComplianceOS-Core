import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@complianceos/ui/ui/dialog";
import { Button } from "@complianceos/ui/ui/button";
import { Label } from "@complianceos/ui/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@complianceos/ui/ui/select";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@complianceos/ui/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@complianceos/ui/ui/popover";
import { Check, ChevronsUpDown, FileText, Paperclip, Shield, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

interface LinkComplianceDialogProps {
    isOpen: boolean;
    onClose: () => void;
    clientId: number;
    regulationId: string;
    articleId: string;
    onSuccess: () => void;
}

type LinkType = 'policy' | 'evidence' | 'control';

export function LinkComplianceDialog({ isOpen, onClose, clientId, regulationId, articleId, onSuccess }: LinkComplianceDialogProps) {
    const [linkType, setLinkType] = useState<LinkType>('policy');
    const [selectedItemId, setSelectedItemId] = useState<number | null>(null);
    const [openCombobox, setOpenCombobox] = useState(false);

    const utils = trpc.useUtils();

    // Data Queries
    const { data: policies, isLoading: isLoadingPolicies } = trpc.clientPolicies.list.useQuery(
        { clientId },
        { enabled: isOpen && linkType === 'policy' }
    );

    const { data: evidence, isLoading: isLoadingEvidence } = trpc.evidence.list.useQuery(
        { clientId },
        { enabled: isOpen && linkType === 'evidence' }
    );

    const { data: controls, isLoading: isLoadingControls } = trpc.clientControls.list.useQuery(
        { clientId },
        { enabled: isOpen && linkType === 'control' }
    );

    // Mutation
    const linkMutation = trpc.regulations.mapToArticle.useMutation({
        onSuccess: () => {
            toast.success(`Successfully linked ${linkType} to article`);
            utils.regulations.getArticleLinks.invalidate({ clientId, regulationId, articleId });
            onSuccess();
            handleClose();
        },
        onError: (error) => {
            toast.error(`Failed to link: ${error.message}`);
        }
    });

    const handleClose = () => {
        setSelectedItemId(null);
        setLinkType('policy');
        onClose();
    };

    const handleSave = () => {
        if (!selectedItemId) return;

        linkMutation.mutate({
            clientId,
            regulationId,
            articleId,
            mappedType: linkType,
            mappedId: selectedItemId
        });
    };

    const getItems = () => {
        if (linkType === 'policy') return policies?.map((p: any) => ({ id: p.id, label: p.name, icon: FileText })) || [];
        if (linkType === 'evidence') return evidence?.map((e: any) => ({ id: e.id, label: e.title || e.description || e.evidenceId, icon: Paperclip })) || [];
        if (linkType === 'control') return controls?.map((c: any) => ({ id: c.id, label: `${c.controlId}: ${c.title || 'Untitled Control'}`, icon: Shield })) || [];
        return [];
    };

    const items = getItems();
    const isLoading = isLoadingPolicies || isLoadingEvidence || isLoadingControls;
    const selectedItemLabel = items.find(i => i.id === selectedItemId)?.label;

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Link Compliance Item</DialogTitle>
                    <DialogDescription>
                        Associate a policy, evidence, or control with Regulation {regulationId} Article {articleId}.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label>Item Type</Label>
                        <Select value={linkType} onValueChange={(val) => { setLinkType(val as LinkType); setSelectedItemId(null); }}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="policy">Policy</SelectItem>
                                <SelectItem value="evidence">Evidence</SelectItem>
                                <SelectItem value="control">Control</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label>Select Item</Label>
                        <Popover open={openCombobox} onOpenChange={setOpenCombobox}>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    role="combobox"
                                    aria-expanded={openCombobox}
                                    className="w-full justify-between"
                                    disabled={isLoading}
                                >
                                    {selectedItemId ? (
                                        <div className="flex items-center gap-2 truncate">
                                            {/* @ts-ignore - icon dynamic render */}
                                            {linkType === 'policy' && <FileText className="h-4 w-4 shrink-0 opacity-50" />}
                                            {linkType === 'evidence' && <Paperclip className="h-4 w-4 shrink-0 opacity-50" />}
                                            {linkType === 'control' && <Shield className="h-4 w-4 shrink-0 opacity-50" />}
                                            <span className="truncate">{selectedItemLabel}</span>
                                        </div>
                                    ) : (
                                        <span className="text-muted-foreground">{isLoading ? "Loading..." : "Select item..."}</span>
                                    )}
                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[400px] p-0">
                                <Command>
                                    <CommandInput placeholder={`Search ${linkType}...`} />
                                    <CommandList>
                                        <CommandEmpty>No {linkType} found.</CommandEmpty>
                                        <CommandGroup>
                                            {items.map((item) => (
                                                <CommandItem
                                                    key={item.id}
                                                    value={item.id.toString() + " " + item.label} // Hack for search
                                                    onSelect={() => {
                                                        setSelectedItemId(item.id);
                                                        setOpenCombobox(false);
                                                    }}
                                                >
                                                    <Check
                                                        className={cn(
                                                            "mr-2 h-4 w-4",
                                                            selectedItemId === item.id ? "opacity-100" : "opacity-0"
                                                        )}
                                                    />
                                                    <item.icon className="mr-2 h-4 w-4 opacity-50" />
                                                    <span className="truncate">{item.label}</span>
                                                </CommandItem>
                                            ))}
                                        </CommandGroup>
                                    </CommandList>
                                </Command>
                            </PopoverContent>
                        </Popover>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={handleClose}>Cancel</Button>
                    <Button onClick={handleSave} disabled={!selectedItemId || linkMutation.isLoading}>
                        {linkMutation.isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Link Item
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

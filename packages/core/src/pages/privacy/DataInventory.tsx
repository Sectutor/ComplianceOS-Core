
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@complianceos/ui/ui/card";
import { Button } from "@complianceos/ui/ui/button";
import { Input } from "@complianceos/ui/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@complianceos/ui/ui/table";
import { Badge } from "@complianceos/ui/ui/badge";
import { trpc } from "@/lib/trpc";
import { Database, Search, ArrowLeft, Filter, Save, Trash2 } from "lucide-react";
import { useLocation } from "wouter";
import { Breadcrumb } from "@/components/Breadcrumb";
import { useClientContext } from "@/contexts/ClientContext";
import { useState } from "react";
import { PageGuide } from "@/components/PageGuide";
import { toast } from "sonner";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@complianceos/ui/ui/alert-dialog";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@complianceos/ui/ui/sheet";
import { Label } from "@complianceos/ui/ui/label";
import { Switch } from "@complianceos/ui/ui/switch";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@complianceos/ui/ui/select";
import { ScrollArea } from "@complianceos/ui/ui/scroll-area";

export default function DataInventory() {
    const [, setLocation] = useLocation();
    const { selectedClientId } = useClientContext();
    const [searchTerm, setSearchTerm] = useState("");

    // Fetch ALL assets, we will filter for privacy ones or allow adding privacy flag
    // Currently relying on existing assets.list
    const { data: allAssets, isLoading } = trpc.assets.list.useQuery({
        clientId: selectedClientId || 0
    }, {
        enabled: !!selectedClientId
    });

    // We can also fetch just the inventory if we want, but letting user "tag" assets is better
    // const { data: inventory } = trpc.privacy.getInventory.useQuery();

    const utils = trpc.useContext();

    const updatePrivacyMutation = trpc.privacy.updateAssetPrivacy.useMutation({
        onSuccess: () => {
            toast.success("Asset privacy details updated");
            utils.assets.list.invalidate();
        },
        onError: (err) => {
            toast.error("Failed to update: " + err.message);
        }
    });

    const deleteAssetMutation = trpc.assets.delete.useMutation({
        onSuccess: () => {
            toast.success("Asset deleted successfully");
            utils.assets.list.invalidate();
        },
        onError: (err) => {
            toast.error("Failed to delete asset: " + err.message);
        }
    });

    const filteredAssets = allAssets?.filter(asset =>
        asset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        asset.isPersonalData
    ) || [];

    return (
        <div className="space-y-6 h-full flex flex-col">
            <Breadcrumb
                items={[
                    { label: "Dashboard", href: "/dashboard" },
                    { label: "Privacy", href: `/clients/${selectedClientId}/privacy` },
                    { label: "Data Inventory" },
                ]}
            />

            <div className="flex items-center justify-between animate-slide-down">
                <PageGuide
                    title="Data Inventory"
                    description="Catalog of all data assets and processing activities."
                    rationale="Foundation for privacy compliance (RoPA) and security controls."
                    howToUse={[
                        { step: "Inventory", description: "Add and categorize data assets." },
                        { step: "Classify", description: "Set sensitivity (Public, Internal, Confidential)." },
                        { step: "Link", description: "Associate assets with vendors and processing activities." }
                    ]}
                />
            </div>

            <Card className="flex-1 flex flex-col">
                <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Database className="h-5 w-5 text-blue-500" />
                            Asset Inventory
                        </CardTitle>
                        <div className="flex gap-2">
                            <div className="relative w-64">
                                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search assets..."
                                    className="pl-8"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                            <Button variant="outline">
                                <Filter className="h-4 w-4 mr-2" />
                                Filter PII Only
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="flex-1 p-0">
                    <div className="rounded-md border border-x-0 border-b-0 h-[600px] overflow-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Asset Name</TableHead>
                                    <TableHead>Type</TableHead>
                                    <TableHead>PII Status</TableHead>
                                    <TableHead>Sensitivity</TableHead>
                                    <TableHead>Format</TableHead>
                                    <TableHead>Owner</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="text-center py-8">Loading assets...</TableCell>
                                    </TableRow>
                                ) : filteredAssets.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No assets found</TableCell>
                                    </TableRow>
                                ) : (
                                    filteredAssets.map((asset) => (
                                        <InventoryRow
                                            key={asset.id}
                                            asset={asset}
                                            onUpdate={(data) => updatePrivacyMutation.mutateAsync({ ...data, clientId: selectedClientId as number })}
                                            onDelete={(id) => deleteAssetMutation.mutateAsync({ id, clientId: selectedClientId as number })}
                                        />
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

function InventoryRow({ asset, onUpdate, onDelete }: { asset: any, onUpdate: (data: any) => Promise<any>, onDelete: (id: number) => Promise<any> }) {
    const [isOpen, setIsOpen] = useState(false);
    const [isPersonalData, setIsPersonalData] = useState(asset.isPersonalData || false);
    const [sensitivity, setSensitivity] = useState(asset.dataSensitivity || "Internal");
    const [format, setFormat] = useState(asset.dataFormat || "Digital");
    const [dataOwner, setDataOwner] = useState(asset.dataOwner || asset.owner || "");
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);

    const handleSave = async () => {
        setSaving(true);
        try {
            await onUpdate({
                assetId: asset.id,
                isPersonalData,
                dataSensitivity: sensitivity,
                dataFormat: format,
                dataOwner: dataOwner
            });
            setIsOpen(false);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        setDeleting(true);
        try {
            await onDelete(asset.id);
        } finally {
            setDeleting(false);
        }
    };

    return (
        <TableRow>
            <TableCell className="font-medium">{asset.name}</TableCell>
            <TableCell>{asset.type}</TableCell>
            <TableCell>
                {asset.isPersonalData ? (
                    <Badge variant="default" className="bg-blue-100 text-blue-700 hover:bg-blue-100">Contains PII</Badge>
                ) : (
                    <Badge variant="outline" className="text-muted-foreground">No PII</Badge>
                )}
            </TableCell>
            <TableCell>
                {asset.dataSensitivity && (
                    <Badge variant="outline" className={
                        asset.dataSensitivity === 'Restricted' ? 'border-red-200 bg-red-50 text-red-700' :
                            asset.dataSensitivity === 'Confidential' ? 'border-orange-200 bg-orange-50 text-orange-700' :
                                'border-slate-200 bg-slate-50 text-slate-700'
                    }>
                        {asset.dataSensitivity}
                    </Badge>
                )}
            </TableCell>
            <TableCell>{asset.dataFormat}</TableCell>
            <TableCell>{asset.dataOwner || asset.owner || "-"}</TableCell>
            <TableCell className="text-right flex items-center justify-end gap-2">
                <Sheet open={isOpen} onOpenChange={setIsOpen}>
                    <SheetTrigger asChild>
                        <Button variant="ghost" size="sm">Edit Details</Button>
                    </SheetTrigger>
                    <SheetContent className="w-[400px] sm:w-[540px]">
                        <SheetHeader>
                            <SheetTitle>Edit Privacy Details</SheetTitle>
                            <SheetDescription>
                                Classify {asset.name} usage of personal data.
                            </SheetDescription>
                        </SheetHeader>
                        <ScrollArea className="h-[calc(100vh-200px)] mt-6 pr-4">
                            <div className="space-y-6">
                                <div className="flex items-center justify-between space-x-2 border p-4 rounded-lg">
                                    <Label htmlFor="pii-mode" className="flex flex-col space-y-1">
                                        <span>Contains Personal Data?</span>
                                        <span className="font-normal text-xs text-muted-foreground">
                                            Does this asset store, process, or transmit PII/PHI?
                                        </span>
                                    </Label>
                                    <Switch id="pii-mode" checked={isPersonalData} onCheckedChange={setIsPersonalData} />
                                </div>

                                {isPersonalData && (
                                    <div className="space-y-4 animate-in fade-in slide-in-from-top-4 duration-300">
                                        <div className="space-y-2">
                                            <Label>Data Sensitivity</Label>
                                            <Select value={sensitivity} onValueChange={setSensitivity}>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select sensitivity" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="Public">Public</SelectItem>
                                                    <SelectItem value="Internal">Internal</SelectItem>
                                                    <SelectItem value="Confidential">Confidential</SelectItem>
                                                    <SelectItem value="Restricted">Restricted (High Risk)</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="space-y-2">
                                            <Label>Data Format</Label>
                                            <Select value={format} onValueChange={setFormat}>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select format" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="Digital">Digital</SelectItem>
                                                    <SelectItem value="Physical">Physical (Paper, Drives)</SelectItem>
                                                    <SelectItem value="Hybrid">Hybrid</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="space-y-2">
                                            <Label>Data Owner</Label>
                                            <Input
                                                value={dataOwner}
                                                onChange={(e) => setDataOwner(e.target.value)}
                                                placeholder="Who is responsible for this data?"
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>
                        </ScrollArea>
                        <div className="mt-8 flex justify-end">
                            <Button onClick={handleSave} disabled={saving}>
                                {saving ? "Saving..." : "Save Changes"}
                            </Button>
                        </div>
                    </SheetContent>
                </Sheet>

                <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-700 hover:bg-red-50">
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Delete Asset</AlertDialogTitle>
                            <AlertDialogDescription>
                                Are you sure you want to delete <strong>{asset.name}</strong>? This action cannot be undone and will remove it from your inventory.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={handleDelete} disabled={deleting} className="bg-red-600 hover:bg-red-700">
                                {deleting ? "Deleting..." : "Delete"}
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </TableCell>
        </TableRow>
    );
}

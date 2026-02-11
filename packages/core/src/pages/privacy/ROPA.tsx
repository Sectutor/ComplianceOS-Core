
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@complianceos/ui/ui/card";
import { Button } from "@complianceos/ui/ui/button";
import { trpc } from "@/lib/trpc";
import { FileText, Plus, Database, ArrowRight, Trash2 } from "lucide-react";
import { useLocation } from "wouter";
import { Breadcrumb } from "@/components/Breadcrumb";
import { useClientContext } from "@/contexts/ClientContext";
import { useState } from "react";
import { toast } from "sonner";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@complianceos/ui/ui/sheet";
import { Label } from "@complianceos/ui/ui/label";
import { Input } from "@complianceos/ui/ui/input";
import { Textarea } from "@complianceos/ui/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@complianceos/ui/ui/select";
import { ScrollArea } from "@complianceos/ui/ui/scroll-area";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@complianceos/ui/ui/accordion";
import { PageGuide } from "@/components/PageGuide";

export default function ROPA() {
    const [, setLocation] = useLocation();
    const { selectedClientId } = useClientContext();

    // Fetch Business Processes to group ROPA by
    const { data: processes, isLoading } = trpc.businessContinuity.processes.list.useQuery({
        clientId: selectedClientId || 0
    }, { enabled: !!selectedClientId });

    return (
        <div className="space-y-6 h-full flex flex-col">
            <Breadcrumb
                items={[
                    { label: "Dashboard", href: "/dashboard" },
                    { label: "Privacy", href: `/clients/${selectedClientId}/privacy` },
                    { label: "ROPA" },
                ]}
            />

            <div className="flex items-center justify-between animate-slide-down">
                <PageGuide
                    title="Record of Processing Activities"
                    description="Maintain a comprehensive inventory of personal data processing activities."
                    rationale="GDPR Article 30 requires maintaining a record of processing activities under your responsibility."
                    howToUse={[
                        { step: "Map", description: "Identify business processes and associate them with data flows." },
                        { step: "Classify", description: "Detail data elements, subjects, legal basis, and retention periods." },
                        { step: "Maintain", description: "Regularly review and update records to reflect operational changes." }
                    ]}
                />
            </div>

            <Card className="flex-1">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5 text-purple-500" />
                        Processing Activities
                    </CardTitle>
                    <CardDescription>
                        Select a business process to view or add data flows.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="py-8 text-center text-muted-foreground">Loading processes...</div>
                    ) : !processes || processes.length === 0 ? (
                        <div className="py-12 text-center text-muted-foreground border-2 border-dashed rounded-lg">
                            <p>No business processes found.</p>
                            <Button variant="link" onClick={() => setLocation(`/clients/${selectedClientId}/business-continuity/processes`)}>
                                Create a process first
                            </Button>
                        </div>
                    ) : (
                        <Accordion type="single" collapsible className="w-full">
                            {processes.map((process, idx) => (
                                <ProcessROPARow key={process.id} process={process} value={`item-${idx}`} />
                            ))}
                        </Accordion>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

function ProcessROPARow({ process, value }: { process: any, value: string }) {
    const { selectedClientId } = useClientContext();
    const [sheetOpen, setSheetOpen] = useState(false);
    const { data: flows, refetch } = trpc.privacy.getProcessDataFlows.useQuery(
        { processId: process.id },
        { enabled: false } // Lazy load when accordion opens? Or use trpc batching? Let's enabling on view.
    );

    // Re-enable query when this component mounts, or just enabled: true if lightweight
    // Ideally we fetch when accordion opens, but for simplicity let's fetch.
    const utils = trpc.useUtils();

    // Fetch assets for dropdown
    const { data: assets } = trpc.assets.list.useQuery({
        clientId: selectedClientId || 0
    }, { enabled: !!selectedClientId });

    const createFlowMutation = trpc.privacy.addProcessDataFlow.useMutation({
        onSuccess: () => {
            toast.success("Data flow added");
            refetch();
            setSheetOpen(false);
        }
    });

    const deleteFlowMutation = trpc.privacy.deleteProcessDataFlow.useMutation({
        onSuccess: () => {
            toast.success("Data flow removed");
            refetch();
        }
    });

    // We need to trigger refetch when accordion opens
    // simplified: just enable the query
    // In real app, optimize. 

    return (
        <AccordionItem value={value}>
            <AccordionTrigger onClick={() => refetch()} className="hover:bg-slate-50 px-4 rounded-md">
                <div className="flex items-center gap-4 text-left">
                    <div className="flex flex-col">
                        <span className="font-medium text-sm">{process.name}</span>
                        <span className="font-normal text-xs text-muted-foreground">{process.department || "No Dept"}</span>
                    </div>
                </div>
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4 pt-2">
                <div className="space-y-4">
                    <div className="flex justify-between items-center">
                        <h4 className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">Data Flows</h4>
                        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
                            <SheetTrigger asChild>
                                <Button size="sm" variant="outline" className="h-8">
                                    <Plus className="h-3 w-3 mr-1" /> Add Data Flow
                                </Button>
                            </SheetTrigger>
                            <SheetContent className="w-[400px] sm:w-[600px] sm:max-w-[600px]">
                                <SheetHeader>
                                    <SheetTitle>Add Data Flow</SheetTitle>
                                    <SheetDescription>
                                        Map a data asset or data element to <strong>{process.name}</strong>.
                                    </SheetDescription>
                                </SheetHeader>
                                <AddFlowForm
                                    processId={process.id}
                                    assets={assets || []}
                                    onSubmit={(data) => createFlowMutation.mutate({ ...data, clientId: selectedClientId as number })}
                                    loading={createFlowMutation.isPending}
                                />
                            </SheetContent>
                        </Sheet>
                    </div>

                    {!flows || flows.length === 0 ? (
                        <div className="text-center py-6 bg-slate-50 rounded-md border border-dashed">
                            <p className="text-sm text-muted-foreground">No data flows mapped to this process yet.</p>
                        </div>
                    ) : (
                        <div className="grid gap-3">
                            {flows.map(({ flow, assetName }) => (
                                <div key={flow.id} className="group flex items-start justify-between p-3 border rounded-lg bg-white shadow-sm hover:border-purple-200 transition-colors">
                                    <div className="grid gap-1">
                                        <div className="flex items-center gap-2">
                                            <Database className="h-4 w-4 text-blue-500" />
                                            <span className="font-medium text-sm">
                                                {assetName || flow.dataElements || "Unspecified Data"}
                                            </span>
                                            <Badge variant="secondary" className="text-[10px] h-5">{flow.interactionType || "Use"}</Badge>
                                        </div>
                                        <div className="text-xs text-muted-foreground pl-6 grid grid-cols-2 gap-x-8 gap-y-1 mt-1">
                                            <p><span className="font-semibold">Legal Basis:</span> {flow.legalBasis || "-"}</p>
                                            <p><span className="font-semibold">Subjects:</span> {flow.dataSubjectType || "-"}</p>
                                            <p><span className="font-semibold">Retention:</span> {flow.retentionPeriod || "-"}</p>
                                            <p><span className="font-semibold">Transfer:</span> {flow.isCrossBorder ? `Yes (${flow.transferMechanism})` : "No"}</p>
                                        </div>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-muted-foreground hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                        onClick={() => confirm("Delete this flow?") && deleteFlowMutation.mutate({ flowId: flow.id, clientId: selectedClientId as number })}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </AccordionContent>
        </AccordionItem>
    );
}

function AddFlowForm({ processId, assets, onSubmit, loading }: any) {
    const [formData, setFormData] = useState({
        processId,
        assetId: null as number | null,
        dataElements: "",
        interactionType: "Collection",
        legalBasis: "Legitimate Interests",
        purpose: "",
        dataSubjectType: "Employees",
        recipients: "Internal Only",
        isCrossBorder: false,
        transferMechanism: "",
        retentionPeriod: "Indefinite",
        disposalMethod: "Deletion"
    });

    const handleSubmit = () => {
        onSubmit(formData);
    };

    return (
        <ScrollArea className="h-[calc(100vh-140px)] pr-4 mt-6">
            <div className="grid gap-5">
                <div className="grid gap-2">
                    <Label>Associated Asset (Optional)</Label>
                    <Select
                        onValueChange={(val) => setFormData({ ...formData, assetId: parseInt(val), dataElements: "" })}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Select a data asset..." />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="0">-- No Specific Asset --</SelectItem>
                            {assets.map((a: any) => (
                                <SelectItem key={a.id} value={a.id.toString()}>{a.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {!formData.assetId && (
                    <div className="grid gap-2">
                        <Label>Data Elements Description</Label>
                        <Textarea
                            placeholder="e.g. Names, Email Addresses, IP Addresses"
                            value={formData.dataElements}
                            onChange={e => setFormData({ ...formData, dataElements: e.target.value })}
                        />
                    </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                        <Label>Interaction Type</Label>
                        <Select value={formData.interactionType} onValueChange={v => setFormData({ ...formData, interactionType: v })}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Collection">Collection</SelectItem>
                                <SelectItem value="Storage">Storage</SelectItem>
                                <SelectItem value="Transmission">Transmission</SelectItem>
                                <SelectItem value="Use">Use</SelectItem>
                                <SelectItem value="Deletion">Deletion</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid gap-2">
                        <Label>Legal Basis</Label>
                        <Select value={formData.legalBasis} onValueChange={v => setFormData({ ...formData, legalBasis: v })}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Consent">Consent</SelectItem>
                                <SelectItem value="Contract">Contract</SelectItem>
                                <SelectItem value="Legal Obligation">Legal Obligation</SelectItem>
                                <SelectItem value="Vital Interests">Vital Interests</SelectItem>
                                <SelectItem value="Public Task">Public Task</SelectItem>
                                <SelectItem value="Legitimate Interests">Legitimate Interests</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <div className="grid gap-2">
                    <Label>Purpose of Processing</Label>
                    <Textarea
                        placeholder="Why is this data being processed?"
                        value={formData.purpose}
                        onChange={e => setFormData({ ...formData, purpose: e.target.value })}
                    />
                </div>

                <div className="grid gap-2">
                    <Label>Data Subjects</Label>
                    <Input
                        value={formData.dataSubjectType}
                        onChange={e => setFormData({ ...formData, dataSubjectType: e.target.value })}
                        placeholder="e.g. Employees, Customers, Patients"
                    />
                </div>

                <div className="grid gap-2">
                    <Label>Retention Period</Label>
                    <Input
                        value={formData.retentionPeriod}
                        onChange={e => setFormData({ ...formData, retentionPeriod: e.target.value })}
                        placeholder="e.g. 7 years, Duration of employment"
                    />
                </div>

                <div className="flex items-center space-x-2 my-2">
                    <input
                        type="checkbox"
                        id="xcross"
                        checked={formData.isCrossBorder}
                        onChange={e => setFormData({ ...formData, isCrossBorder: e.target.checked })}
                        className="rounded border-gray-300"
                    />
                    <Label htmlFor="xcross">Cross-Border Transfer?</Label>
                </div>

                {formData.isCrossBorder && (
                    <div className="grid gap-2">
                        <Label>Transfer Mechanism</Label>
                        <Input
                            value={formData.transferMechanism}
                            onChange={e => setFormData({ ...formData, transferMechanism: e.target.value })}
                            placeholder="e.g. SCCs, Adequacy Decision"
                        />
                    </div>
                )}

                <Button className="mt-4" onClick={handleSubmit} disabled={loading}>
                    {loading ? "Adding..." : "Add Data Flow"}
                </Button>
            </div>
        </ScrollArea>
    );
}

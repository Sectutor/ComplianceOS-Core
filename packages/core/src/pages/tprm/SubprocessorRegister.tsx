
import React, { useState } from "react";
import { useParams, Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@complianceos/ui/ui/card";
import { Button } from "@complianceos/ui/ui/button";
import { Input } from "@complianceos/ui/ui/input";
import { Badge } from "@complianceos/ui/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@complianceos/ui/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@complianceos/ui/ui/tabs";
import { Loader2, Search, ShieldCheck, Globe, RefreshCcw, Share2, Layers, AlertTriangle, FileText, CheckCircle } from "lucide-react";
import { EnhancedDialog } from "@complianceos/ui/ui/enhanced-dialog";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { StatusBadge } from "@complianceos/ui/ui/StatusBadge";
import { format } from "date-fns";
import { PageGuide } from "@/components/PageGuide";

export default function SubprocessorRegister() {
    const { id } = useParams<{ id: string }>();
    const clientId = parseInt(id || "0");
    const [activeTab, setActiveTab] = useState("governance");
    const [searchTerm, setSearchTerm] = useState("");
    const [analyzingId, setAnalyzingId] = useState<number | null>(null);

    // Queries
    const { data: subprocessors, isLoading, refetch } = trpc.subprocessors.list.useQuery({ clientId }, { enabled: !!clientId });
    const { data: treeData, isLoading: isTreeLoading } = trpc.subprocessors.getMap.useQuery({ clientId }, { enabled: !!clientId && activeTab === 'map' });

    // Mutations
    const analyzeMutation = trpc.subprocessors.analyze.useMutation({
        onSuccess: (data) => {
            toast.success("Analysis complete! Trust score and clauses updated.");
            setAnalyzingId(null);
            refetch();
        },
        onError: (err) => {
            toast.error("Analysis failed: " + err.message);
            setAnalyzingId(null);
        }
    });

    const handleAnalyze = (vendorId: number, website: string) => {
        if (!website) return toast.error("Vendor has no website to analyze.");
        setAnalyzingId(vendorId);
        analyzeMutation.mutate({ vendorId, url: website });
    };

    const SubprocessorTreeItem = ({ item, level = 0 }: { item: any, level?: number }) => {
        const hasChildren = item.children && item.children.length > 0;
        return (
            <div className="border-l border-slate-200 ml-4 pl-4 py-2">
                <div className="flex items-center gap-2">
                    <Layers className={cn("w-4 h-4 text-slate-400", level === 0 ? "text-indigo-500" : "")} />
                    <span className="font-medium text-sm">{item.name}</span>
                    {item.dataLocation && <Badge variant="outline" className="text-[10px] h-5">{item.dataLocation}</Badge>}
                </div>
                {hasChildren && (
                    <div className="mt-2">
                        {item.children.map((child: any, idx: number) => (
                            <SubprocessorTreeItem key={idx} item={{ ...child, children: [] }} level={level + 1} />
                        ))}
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="space-y-6 page-transition">
            <div className="flex justify-between items-start animate-slide-down">

                <PageGuide
                    title="Subprocessor Governance"
                    description="Manage GDPR Article 28 compliance and chain of trust in your supply chain."
                    rationale="Maintain visibility into 'fourth-party' data risks to ensure full regulatory compliance."
                    howToUse={[
                        { step: "Inventory", description: "Maintain a list of all active sub-processors." },
                        { step: "Analyze", description: "Verify transfer mechanisms and data locations." },
                        { step: "Map", description: "Visualize the chain of trust and data flows." }
                    ]}
                />
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => window.open(`/api/public/subprocessors/${clientId}`, '_blank')}>
                        <Share2 className="w-4 h-4 mr-2" />
                        Public Export
                    </Button>
                    <Button onClick={() => refetch()}>
                        <RefreshCcw className="w-4 h-4 mr-2" />
                        Refresh Registry
                    </Button>
                </div>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList>
                    <TabsTrigger value="governance">Registry & Analysis</TabsTrigger>
                    <TabsTrigger value="map">Chain of Trust Map</TabsTrigger>
                </TabsList>

                <TabsContent value="governance" className="space-y-4 pt-4">
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle>Approved Subprocessors</CardTitle>
                            <CardDescription>Vendors authorized to process personal data.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Vendor</TableHead>
                                        <TableHead>Data Location</TableHead>
                                        <TableHead>Transfer Mechanism</TableHead>
                                        <TableHead>DPA Status</TableHead>
                                        <TableHead>Last Audit</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {isLoading ? (
                                        <TableRow>
                                            <TableCell colSpan={6} className="text-center py-8">
                                                <Loader2 className="h-6 w-6 animate-spin mx-auto text-indigo-500" />
                                            </TableCell>
                                        </TableRow>
                                    ) : subprocessors?.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                                No subprocessors found. Mark vendors as subprocessors in the Vendor Inventory.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        subprocessors?.map((sub: any) => (
                                            <TableRow key={sub.id}>
                                                <TableCell>
                                                    <div className="font-medium text-slate-900">{sub.name}</div>
                                                    <div className="text-xs text-muted-foreground flex items-center gap-1">
                                                        {sub.website ? <Globe className="w-3 h-3" /> : null}
                                                        {sub.website || "No website"}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    {sub.dataLocation ? (
                                                        <div className="flex items-center gap-1.5">
                                                            <span className="text-xs">{sub.dataLocation}</span>
                                                        </div>
                                                    ) : <span className="text-muted-foreground text-xs">-</span>}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="secondary" className="font-normal text-xs">
                                                        {sub.transferMechanism || "Unspecified"}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    {sub.dpaAnalysis ? (
                                                        <div className="flex flex-col gap-1">
                                                            <Badge className="bg-green-50 text-green-700 border-green-200 w-fit">Verified</Badge>
                                                            <span className="text-[10px] text-muted-foreground">
                                                                {(sub.dpaAnalysis as any).verificationDate ? format(new Date((sub.dpaAnalysis as any).verificationDate), 'MMM d, yyyy') : 'Recently'}
                                                            </span>
                                                        </div>
                                                    ) : (
                                                        <Badge variant="outline" className="text-amber-600 bg-amber-50">Missing DPA</Badge>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    {sub.lastTrustCenterChange ? (
                                                        <div className="text-xs">
                                                            {format(new Date(sub.lastTrustCenterChange), 'MMM d, yyyy')}
                                                        </div>
                                                    ) : <span className="text-xs text-muted-foreground">Never</span>}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        className="text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50"
                                                        onClick={() => handleAnalyze(sub.id, sub.website)}
                                                        disabled={analyzingId === sub.id}
                                                    >
                                                        {analyzingId === sub.id ? (
                                                            <Loader2 className="w-3 h-3 animate-spin mr-1" />
                                                        ) : (
                                                            <ShieldCheck className="w-3 h-3 mr-1" />
                                                        )}
                                                        {analyzingId === sub.id ? "Scanning..." : "Analyze"}
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="map" className="space-y-4 pt-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Subprocessing Chain</CardTitle>
                            <CardDescription>Visualization of recursive sub-processors (The "Fourth Party" Risk).</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {isTreeLoading ? (
                                <div className="flex justify-center py-12">
                                    <Loader2 className="h-8 w-8 animate-spin text-slate-300" />
                                </div>
                            ) : (
                                <div className="pl-2">
                                    {treeData?.length === 0 && <div className="text-muted-foreground p-4">No data available for mapping.</div>}
                                    {treeData?.map((node: any) => (
                                        <div key={node.id} className="mb-4">
                                            <div className="flex items-center gap-2 mb-2 p-2 bg-slate-50 rounded border border-slate-100 table w-full">
                                                <div className="h-8 w-8 bg-indigo-100 text-indigo-600 rounded flex items-center justify-center font-bold text-xs shrink-0">
                                                    {node.name.substring(0, 2).toUpperCase()}
                                                </div>
                                                <div>
                                                    <div className="font-semibold text-sm">{node.name}</div>
                                                    <div className="text-xs text-muted-foreground">{node.dataLocation || "Unknown Location"}</div>
                                                </div>
                                            </div>
                                            {/* Render Children */}
                                            {(node.children && node.children.length > 0) ? (
                                                <div className="ml-4 border-l-2 border-indigo-100 pl-4 py-2 space-y-2">
                                                    {node.children.map((child: string | any, i: number) => (
                                                        <div key={i} className="flex items-center gap-2 text-sm text-slate-600 bg-white p-2 rounded border border-slate-100 shadow-sm">
                                                            <span className="w-2 h-2 rounded-full bg-slate-300" />
                                                            {typeof child === 'string' ? child : child.name}
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="ml-8 text-xs text-muted-foreground italic py-1">No disclosed sub-processors</div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}

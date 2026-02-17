import React, { useState } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useClientContext } from "@/contexts/ClientContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@complianceos/ui/ui/card";
import { Button } from "@complianceos/ui/ui/button";
import { Badge } from "@complianceos/ui/ui/badge";
import { Progress } from "@complianceos/ui/ui/progress";
import {
    FileText,
    CheckCircle2,
    Circle,
    AlertCircle,
    ExternalLink,
    Upload,
    MoreHorizontal,
    Filter,
    Search,
    FileCheck
} from "lucide-react";
import { Input } from "@complianceos/ui/ui/input";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@complianceos/ui/ui/table";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@complianceos/ui/ui/dropdown-menu";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from "@complianceos/ui/ui/sheet";
import { Label } from "@complianceos/ui/ui/label";
import {
    Clock,
    User,
    History,
    MessageSquare,
    ChevronRight,
    Download,
    Eye,
    Save
} from "lucide-react";
import { Separator } from "@complianceos/ui/ui/separator";

interface DocumentItem {
    id: string;
    clause: string;
    title: string;
    description: string;
    status: "not_started" | "draft" | "review" | "approved";
    owner: string;
    lastUpdated?: string;
    version?: string;
}

const MANDATORY_DOCUMENTS: DocumentItem[] = [
    {
        id: "doc-1",
        clause: "4.3",
        title: "Scope of the ISMS",
        description: "Document defining the boundaries and applicability of the ISMS.",
        status: "approved",
        owner: "CISO",
        lastUpdated: "2024-05-15",
        version: "1.0"
    },
    {
        id: "doc-2",
        clause: "5.2",
        title: "Information Security Policy",
        description: "High-level policy regarding information security objectives.",
        status: "review",
        owner: "Leadership",
        lastUpdated: "2024-06-01",
        version: "0.9"
    },
    {
        id: "doc-3",
        clause: "6.1.2",
        title: "Risk Assessment Methodology",
        description: "Process for identifying, analyzing, and evaluating information security risks.",
        status: "approved",
        owner: "Risk Manager",
        lastUpdated: "2024-05-20",
        version: "1.0"
    },
    {
        id: "doc-4",
        clause: "6.1.3",
        title: "Statement of Applicability (SoA)",
        description: "List of Annex A controls and their inclusion/exclusion justification.",
        status: "draft",
        owner: "CISO",
        lastUpdated: "2024-06-10",
        version: "0.5"
    },
    {
        id: "doc-5",
        clause: "6.1.3",
        title: "Risk Treatment Plan",
        description: "Plan for modifying risks to acceptable levels.",
        status: "not_started",
        owner: "Risk Manager",
    },
    {
        id: "doc-6",
        clause: "6.2",
        title: "Information Security Objectives",
        description: "Measurable security goals consistent with the policy.",
        status: "not_started",
        owner: "Leadership",
    },
    {
        id: "doc-7",
        clause: "7.2",
        title: "Evidence of Competence",
        description: "Records of education, training, skills, and experience.",
        status: "draft",
        owner: "HR Director",
        lastUpdated: "2024-06-05",
        version: "0.1"
    },
    {
        id: "doc-8",
        clause: "8.1",
        title: "Operational Planning & Control",
        description: "Procedures to ensure processes are carried out as planned.",
        status: "not_started",
        owner: "Ops Manager",
    },
    {
        id: "doc-9",
        clause: "9.2",
        title: "Internal Audit Program",
        description: "Schedule and scope of internal audits.",
        status: "not_started",
        owner: "Internal Auditor",
    },
    {
        id: "doc-10",
        clause: "9.3",
        title: "Management Review Minutes",
        description: "Records of management reviews of the ISMS.",
        status: "not_started",
        owner: "Leadership",
    },
    {
        id: "doc-11",
        clause: "10.1",
        title: "Nonconformity & Corrective Action",
        description: "Procedure for handling nonconformities and corrective actions.",
        status: "not_started",
        owner: "Compliance Mgr",
    }
];

import { ISOLayout } from "./ISOLayout";

export default function ISODocumentTracker({ params }: { params?: { id: string } }) {
    const { selectedClientId } = useClientContext();
    const clientId = parseInt(params?.id || selectedClientId?.toString() || "0");
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedDoc, setSelectedDoc] = useState<DocumentItem | null>(null);

    // Status Badge Helper
    const getStatusBadge = (status: string) => {
        switch (status) {
            case "approved":
                return <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100">Approved</Badge>;
            case "review":
                return <Badge className="bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100">In Review</Badge>;
            case "draft":
                return <Badge className="bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100">Draft</Badge>;
            default:
                return <Badge variant="outline" className="text-slate-500 border-slate-200">Not Started</Badge>;
        }
    };

    const filteredDocs = MANDATORY_DOCUMENTS.filter(doc =>
        doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.clause.includes(searchQuery)
    );

    const handleOpenDocument = (doc: DocumentItem) => {
        setSelectedDoc(doc);
        toast.info(`Opening ${doc.title}`, {
            description: `Loading document for clause ${doc.clause}`,
        });
    };

    const completionPercentage = Math.round(
        (MANDATORY_DOCUMENTS.filter(d => d.status === "approved").length / MANDATORY_DOCUMENTS.length) * 100
    );

    return (
        <ISOLayout clientId={clientId}>
            <div className="p-8 space-y-8 animate-in fade-in duration-500">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="space-y-2">
                        <h1 className="text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-3">
                            <FileCheck className="h-8 w-8 text-indigo-600" />
                            Mandatory Document Tracker
                        </h1>
                        <p className="text-lg text-slate-500 max-w-3xl">
                            Track the status of documented information required explicitly by ISO 27001:2022.
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant="outline" className="border-slate-200">
                            <ExternalLink className="mr-2 h-4 w-4" /> Export Requirements
                        </Button>
                    </div>
                </div>

                {/* Progress Overview */}
                <Card className="bg-white border-slate-200 shadow-sm">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-4">
                            <div className="space-y-1">
                                <h3 className="font-semibold text-slate-900">Readiness Progress</h3>
                                <p className="text-sm text-slate-500">{completionPercentage}% of mandatory documents are approved</p>
                            </div>
                            <span className="text-2xl font-bold text-indigo-600">{completionPercentage}%</span>
                        </div>
                        <Progress value={completionPercentage} className="h-3" />
                        <div className="grid grid-cols-4 gap-4 mt-6 pt-6 border-t border-slate-100">
                            <div className="text-center">
                                <p className="text-2xl font-bold text-slate-900">{MANDATORY_DOCUMENTS.length}</p>
                                <p className="text-xs text-slate-500 uppercase font-bold mt-1">Required</p>
                            </div>
                            <div className="text-center">
                                <p className="text-2xl font-bold text-emerald-600">
                                    {MANDATORY_DOCUMENTS.filter(d => d.status === "approved").length}
                                </p>
                                <p className="text-xs text-slate-500 uppercase font-bold mt-1">Approved</p>
                            </div>
                            <div className="text-center">
                                <p className="text-2xl font-bold text-amber-600">
                                    {MANDATORY_DOCUMENTS.filter(d => d.status === "review").length}
                                </p>
                                <p className="text-xs text-slate-500 uppercase font-bold mt-1">In Review</p>
                            </div>
                            <div className="text-center">
                                <p className="text-2xl font-bold text-slate-400">
                                    {MANDATORY_DOCUMENTS.filter(d => d.status === "not_started").length}
                                </p>
                                <p className="text-xs text-slate-500 uppercase font-bold mt-1">Missing</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Documents Table Component */}
                <Card className="bg-white border-slate-200 shadow-sm">
                    <CardHeader className="border-b border-slate-100 bg-slate-50/50">
                        <div className="flex items-center justify-between">
                            <div className="relative max-w-sm w-full">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                <Input
                                    placeholder="Search documents or clauses..."
                                    className="pl-10 bg-white"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                            <Button variant="outline" size="sm" className="gap-2">
                                <Filter className="h-4 w-4" /> Filter
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[100px]">ISO Clause</TableHead>
                                    <TableHead>Document Title</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Owner</TableHead>
                                    <TableHead>Last Updated</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredDocs.map((doc) => (
                                    <TableRow
                                        key={doc.id}
                                        className="group hover:bg-slate-50/50 cursor-pointer select-none"
                                        onDoubleClick={() => handleOpenDocument(doc)}
                                    >
                                        <TableCell className="font-mono text-xs font-medium text-slate-500">
                                            {doc.clause}
                                        </TableCell>
                                        <TableCell>
                                            <div className="space-y-1">
                                                <p className="font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors">
                                                    {doc.title}
                                                </p>
                                                <p className="text-xs text-slate-500 line-clamp-1">{doc.description}</p>
                                            </div>
                                        </TableCell>
                                        <TableCell>{getStatusBadge(doc.status)}</TableCell>
                                        <TableCell className="text-sm text-slate-600">
                                            <div className="flex items-center gap-2">
                                                <div className="h-6 w-6 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-500">
                                                    {doc.owner.charAt(0)}
                                                </div>
                                                {doc.owner}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-sm text-slate-500">
                                            {doc.lastUpdated ? (
                                                <div className="flex flex-col">
                                                    <span>{doc.lastUpdated}</span>
                                                    <span className="text-[10px] text-slate-400">v{doc.version}</span>
                                                </div>
                                            ) : (
                                                <span className="text-slate-400">-</span>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                                        <MoreHorizontal className="h-4 w-4 text-slate-400" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem onClick={() => handleOpenDocument(doc)}>
                                                        <FileText className="mr-2 h-4 w-4" /> View Document
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem>
                                                        <Upload className="mr-2 h-4 w-4" /> Upload New Version
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem className="text-rose-600">
                                                        <AlertCircle className="mr-2 h-4 w-4" /> Flag as Missing
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>

            {/* Document Details Sheet */}
            <Sheet open={!!selectedDoc} onOpenChange={(open) => !open && setSelectedDoc(null)}>
                <SheetContent className="sm:max-w-xl md:max-w-2xl overflow-y-auto">
                    <SheetHeader className="pb-6 border-b">
                        <div className="flex items-center gap-2 mb-2">
                            <span className="font-mono text-xs font-bold px-2 py-1 bg-indigo-50 text-indigo-600 rounded">
                                ISO 27001 Clause {selectedDoc?.clause}
                            </span>
                            {selectedDoc && getStatusBadge(selectedDoc.status)}
                        </div>
                        <SheetTitle className="text-2xl font-bold text-slate-900">
                            {selectedDoc?.title}
                        </SheetTitle>
                        <SheetDescription className="text-slate-500 pt-2">
                            {selectedDoc?.description}
                        </SheetDescription>
                    </SheetHeader>

                    <div className="py-8 space-y-8">
                        {/* Status & Ownership */}
                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Document Owner</Label>
                                <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-xl border border-slate-100">
                                    <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center text-xs font-bold text-indigo-600">
                                        {selectedDoc?.owner.charAt(0)}
                                    </div>
                                    <span className="font-medium text-slate-700">{selectedDoc?.owner}</span>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Last Revision</Label>
                                <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-xl border border-slate-100">
                                    <Clock className="h-4 w-4 text-slate-400" />
                                    <span className="font-medium text-slate-700">{selectedDoc?.lastUpdated || "N/A"}</span>
                                    {selectedDoc?.version && (
                                        <Badge variant="outline" className="ml-auto text-[10px]">v{selectedDoc.version}</Badge>
                                    )}
                                </div>
                            </div>
                        </div>

                        <Separator />

                        {/* Document Content / Placeholder */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h4 className="font-bold text-slate-900 flex items-center gap-2">
                                    <FileText className="h-4 w-4 text-indigo-600" /> Document Content
                                </h4>
                                <Button size="sm" variant="ghost" className="text-indigo-600 gap-2">
                                    <Download className="h-4 w-4" /> Download PDF
                                </Button>
                            </div>

                            <div className="p-6 rounded-2xl bg-slate-900 text-slate-300 font-mono text-sm leading-relaxed border border-slate-800 shadow-inner min-h-[300px]">
                                <div className="flex gap-4">
                                    <span className="text-slate-600">01</span>
                                    <span># {selectedDoc?.title}</span>
                                </div>
                                <div className="flex gap-4">
                                    <span className="text-slate-600">02</span>
                                    <span className="text-slate-500">// ISO 27001:{selectedDoc?.clause} requirements compliant</span>
                                </div>
                                <div className="flex gap-4">
                                    <span className="text-slate-600">03</span>
                                    <span></span>
                                </div>
                                <div className="flex gap-4">
                                    <span className="text-slate-600">04</span>
                                    <span className="text-indigo-400">POLICY_SCOPE</span> = "{selectedDoc?.description}"
                                </div>
                                <div className="flex gap-4">
                                    <span className="text-slate-600">05</span>
                                    <span></span>
                                </div>
                                <div className="flex gap-4">
                                    <span className="text-slate-600">06</span>
                                    <span className="text-emerald-400">DOCUMENT_INFO</span> = [
                                </div>
                                <div className="flex gap-4">
                                    <span className="text-slate-600">07</span>
                                    <span>  OWNER: 0x{selectedDoc?.owner.toUpperCase().replace(/\s/g, '_')},</span>
                                </div>
                                <div className="flex gap-4">
                                    <span className="text-slate-600">08</span>
                                    <span>  STATUS: <span className="text-amber-400">{selectedDoc?.status.toUpperCase()}</span>,</span>
                                </div>
                                <div className="flex gap-4">
                                    <span className="text-slate-600">09</span>
                                    <span>  VERSION: {selectedDoc?.version || "0.0.1"}</span>
                                </div>
                                <div className="flex gap-4">
                                    <span className="text-slate-600">10</span>
                                    <span className="text-emerald-400">]</span>
                                </div>
                            </div>
                        </div>

                        <Separator />

                        {/* Recent Activity */}
                        <div className="space-y-4">
                            <h4 className="font-bold text-slate-900 flex items-center gap-2">
                                <History className="h-4 w-4 text-indigo-600" /> Audit History
                            </h4>
                            <div className="space-y-4">
                                {[
                                    { user: "Jane CISO", action: "Approved version 1.0", date: "2 days ago", icon: CheckCircle2, color: "text-emerald-500" },
                                    { user: "System AI", action: "Policy alignment check passed", date: "3 days ago", icon: Eye, color: "text-blue-500" },
                                    { user: "Mike Ops", action: "Modified draft", date: "5 days ago", icon: Save, color: "text-slate-400" },
                                ].map((activity, i) => (
                                    <div key={i} className="flex items-start gap-3">
                                        <div className={cn("p-2 rounded-full bg-slate-50", activity.color)}>
                                            <activity.icon className="h-3 w-3" />
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-xs font-bold text-slate-700">{activity.user}</p>
                                            <p className="text-xs text-slate-500">{activity.action}</p>
                                        </div>
                                        <span className="text-[10px] text-slate-400">{activity.date}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="sticky bottom-0 bg-white border-t p-6 -mx-6 flex items-center justify-between">
                        <Button variant="outline" className="gap-2" onClick={() => setSelectedDoc(null)}>
                            Close Viewer
                        </Button>
                        <div className="flex items-center gap-2">
                            <Button variant="outline" className="gap-2">
                                <MessageSquare className="h-4 w-4" /> Add Comment
                            </Button>
                            <Button className="bg-indigo-600 hover:bg-indigo-700 gap-2">
                                Edit Document
                            </Button>
                        </div>
                    </div>
                </SheetContent>
            </Sheet>
        </ISOLayout>
    );
}

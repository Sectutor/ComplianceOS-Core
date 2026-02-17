import React, { useState } from "react";
import { ISOLayout } from "./ISOLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@complianceos/ui/ui/card";
import { Button } from "@complianceos/ui/ui/button";
import { Badge } from "@complianceos/ui/ui/badge";
import { Progress } from "@complianceos/ui/ui/progress";
import {
    CalendarDays,
    CheckCircle2,
    Clock,
    AlertCircle,
    FileText,
    Plus,
    MoreHorizontal,
    Search,
    Filter,
    BarChart3,
    ArrowRight
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@complianceos/ui/ui/tabs";

interface Audit {
    id: string;
    title: string;
    type: "Internal" | "External" | "Supplier";
    scope: string;
    auditor: string;
    plannedDate: string;
    status: "planned" | "in_progress" | "completed" | "delayed";
    findings: number;
}

const AUDITS: Audit[] = [
    {
        id: "AUD-2025-001",
        title: "Annual ISO 27001 Internal Audit",
        type: "Internal",
        scope: "Full ISMS Scope (All Clauses & Annex A)",
        auditor: "Jane Doe (Lead Auditor)",
        plannedDate: "2025-05-15",
        status: "planned",
        findings: 0
    },
    {
        id: "AUD-2025-002",
        title: "Physical Security Review - HQ",
        type: "Internal",
        scope: "HQ Office - Physical Access Controls",
        auditor: "John Smith",
        plannedDate: "2025-03-10",
        status: "in_progress",
        findings: 2
    },
    {
        id: "AUD-2024-003",
        title: "Stage 1 Certification Audit",
        type: "External",
        scope: "Governance & Documentation Review",
        auditor: "ExtCert Body",
        plannedDate: "2024-11-20",
        status: "completed",
        findings: 3
    },
    {
        id: "AUD-2025-004",
        title: "AWS Cloud Infrastructure Review",
        type: "Internal",
        scope: "Cloud Security & Access Control",
        auditor: "Tech Risk Team",
        plannedDate: "2025-04-01",
        status: "planned",
        findings: 0
    }
];

import { useRoute, useLocation, useParams } from "wouter";

export default function ISOAuditManager() {
    const params = useParams<{ id: string }>();
    const clientId = parseInt(params.id || "0");
    const [activeTab, setActiveTab] = useState("schedule");
    const [searchQuery, setSearchQuery] = useState("");

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "completed":
                return <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200">Completed</Badge>;
            case "in_progress":
                return <Badge className="bg-blue-50 text-blue-700 border-blue-200 animate-pulse">In Progress</Badge>;
            case "planned":
                return <Badge variant="outline" className="text-slate-500 border-slate-200 bg-slate-50">Planned</Badge>;
            case "delayed":
                return <Badge className="bg-rose-50 text-rose-700 border-rose-200">Delayed</Badge>;
            default:
                return null;
        }
    };

    const getTypeBadge = (type: string) => {
        switch (type) {
            case "Internal":
                return <Badge variant="outline" className="text-indigo-600 border-indigo-200 bg-indigo-50">Internal</Badge>;
            case "External":
                return <Badge variant="outline" className="text-amber-600 border-amber-200 bg-amber-50">External</Badge>;
            case "Supplier":
                return <Badge variant="outline" className="text-slate-600 border-slate-200 bg-slate-50">Supplier</Badge>;
            default:
                return null;
        }
    };

    const filteredAudits = AUDITS.filter(audit =>
        audit.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        audit.auditor.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <ISOLayout clientId={clientId}>
            <div className="p-8 space-y-8 animate-in fade-in duration-500">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="space-y-2">
                        <h1 className="text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-3">
                            <Clock className="h-8 w-8 text-indigo-600" />
                            Internal Audit Manager
                        </h1>
                        <p className="text-lg text-slate-500 max-w-3xl">
                            Plan, establish, implement, and maintain an audit program (ISO 27001 Clause 9.2).
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <Button variant="outline" className="border-slate-200">
                            <BarChart3 className="mr-2 h-4 w-4" /> Audit Report
                        </Button>
                        <Button className="bg-indigo-600 hover:bg-indigo-700 shadow-sm">
                            <Plus className="mr-2 h-4 w-4" /> Schedule Audit
                        </Button>
                    </div>
                </div>

                {/* KPI Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <Card className="border-none shadow-sm bg-indigo-600 text-white">
                        <CardContent className="p-6">
                            <p className="text-indigo-100 font-medium text-sm uppercase tracking-wider">Upcoming Audits</p>
                            <div className="mt-2 flex items-baseline gap-2">
                                <span className="text-4xl font-bold">3</span>
                                <span className="text-sm text-indigo-200">planned</span>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="border-none shadow-sm bg-white">
                        <CardContent className="p-6">
                            <p className="text-slate-500 font-medium text-sm uppercase tracking-wider">Open Findings</p>
                            <div className="mt-2 flex items-baseline gap-2">
                                <span className="text-4xl font-bold text-slate-900">5</span>
                                <span className="text-sm text-rose-600 font-medium flex items-center">
                                    <AlertCircle className="h-3 w-3 mr-1" /> Needs Action
                                </span>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="border-none shadow-sm bg-white">
                        <CardContent className="p-6">
                            <p className="text-slate-500 font-medium text-sm uppercase tracking-wider">Avg. Completion Time</p>
                            <div className="mt-2 flex items-baseline gap-2">
                                <span className="text-4xl font-bold text-slate-900">14</span>
                                <span className="text-sm text-slate-400">days</span>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="border-none shadow-sm bg-white">
                        <CardContent className="p-6">
                            <p className="text-slate-500 font-medium text-sm uppercase tracking-wider">Audit Coverage</p>
                            <div className="mt-2 flex flex-col gap-2">
                                <div className="flex items-baseline gap-2">
                                    <span className="text-4xl font-bold text-slate-900">65%</span>
                                    <span className="text-sm text-slate-400">of SoA reviewed</span>
                                </div>
                                <Progress value={65} className="h-1.5" />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="bg-white border p-1 h-12 w-full md:w-auto justify-start mb-6">
                        <TabsTrigger value="schedule" className="data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-700 h-10 px-6">
                            <CalendarDays className="mr-2 h-4 w-4" /> Audit Schedule
                        </TabsTrigger>
                        <TabsTrigger value="findings" className="data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-700 h-10 px-6">
                            <AlertCircle className="mr-2 h-4 w-4" /> Non-Conformities
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="schedule" className="space-y-6">
                        <Card className="bg-white border-slate-200 shadow-sm overflow-hidden">
                            <CardHeader className="border-b border-slate-100 bg-slate-50/50 p-6">
                                <div className="flex items-center justify-between">
                                    <div className="space-y-1">
                                        <CardTitle className="text-lg">Audit Program 2024-2025</CardTitle>
                                        <CardDescription>
                                            Manage your internal and external audit lifecycle.
                                        </CardDescription>
                                    </div>
                                    <div className="relative max-w-sm w-full">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                        <Input
                                            placeholder="Search audits..."
                                            className="pl-10 bg-white"
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                        />
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="p-0">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="bg-slate-50/50">
                                            <TableHead className="w-[120px]">Audit ID</TableHead>
                                            <TableHead>Audit Title & Scope</TableHead>
                                            <TableHead>Type</TableHead>
                                            <TableHead>Auditor</TableHead>
                                            <TableHead>Planned Date</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead className="text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filteredAudits.map((audit) => (
                                            <TableRow key={audit.id} className="group hover:bg-slate-50/50 cursor-pointer">
                                                <TableCell className="font-mono text-xs font-medium text-slate-500">
                                                    {audit.id}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="space-y-1">
                                                        <p className="font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors">
                                                            {audit.title}
                                                        </p>
                                                        <p className="text-xs text-slate-500 line-clamp-1">{audit.scope}</p>
                                                    </div>
                                                </TableCell>
                                                <TableCell>{getTypeBadge(audit.type)}</TableCell>
                                                <TableCell className="text-sm text-slate-600">
                                                    <div className="flex items-center gap-2">
                                                        <div className="h-6 w-6 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-500">
                                                            {audit.auditor.charAt(0)}
                                                        </div>
                                                        {audit.auditor}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-sm text-slate-600">
                                                    {new Date(audit.plannedDate).toLocaleDateString()}
                                                </TableCell>
                                                <TableCell>{getStatusBadge(audit.status)}</TableCell>
                                                <TableCell className="text-right">
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                                                <MoreHorizontal className="h-4 w-4 text-slate-400" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end">
                                                            <DropdownMenuItem>
                                                                <FileText className="mr-2 h-4 w-4" /> View Plan
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem>
                                                                <CheckCircle2 className="mr-2 h-4 w-4" /> Start Audit
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
                    </TabsContent>

                    <TabsContent value="findings">
                        <Card className="bg-white border-slate-200">
                            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                                <div className="p-4 bg-slate-50 rounded-full mb-4">
                                    <CheckCircle2 className="h-12 w-12 text-slate-300" />
                                </div>
                                <h3 className="text-lg font-semibold text-slate-900">No Open Non-Conformities</h3>
                                <p className="text-slate-500 max-w-sm mt-2">
                                    Great job! All audit findings and non-conformities have been addressed or none have been raised yet.
                                </p>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </ISOLayout>
    );
}

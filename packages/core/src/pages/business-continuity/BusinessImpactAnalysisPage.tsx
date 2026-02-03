
import React, { useState } from 'react';
import { useParams, Link, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@complianceos/ui/ui/card";
import { Button } from "@complianceos/ui/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@complianceos/ui/ui/tabs";
import { Plus, FileText, ArrowRight, BookOpen, AlertCircle, ArrowLeft, Shield } from "lucide-react";
import { Breadcrumb } from "@/components/Breadcrumb";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@complianceos/ui/ui/table";
import { Badge } from "@complianceos/ui/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@complianceos/ui/ui/dialog";
import { Input } from "@complianceos/ui/ui/input";
import { Label } from "@complianceos/ui/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@complianceos/ui/ui/select";
import { toast } from "sonner";

import DashboardLayout from "@/components/DashboardLayout";

export default function BusinessImpactAnalysisPage() {
    const params = useParams();
    const clientId = parseInt(params.id || "0");
    const [isNewOpen, setIsNewOpen] = useState(false);

    // Form State
    const [newTitle, setNewTitle] = useState("");
    const [selectedProcessId, setSelectedProcessId] = useState<string>("");

    const [_, setLocation] = useLocation();

    const { data: bias, refetch } = trpc.businessContinuity.bia.list.useQuery({ clientId });
    const { data: processes } = trpc.businessContinuity.processes.list.useQuery({ clientId });

    const createBIA = trpc.businessContinuity.bia.create.useMutation({
        onSuccess: (newBia) => {
            toast.success("BIA created successfully");
            setIsNewOpen(false);
            setNewTitle("");
            setSelectedProcessId("");
            // Redirect to the BIA Editor (Wizard)
            if (newBia && newBia.id) {
                setLocation(`/clients/${clientId}/business-continuity/bia/${newBia.id}`);
            } else {
                refetch();
            }
        },
        onError: (err) => {
            toast.error("Failed to create BIA: " + err.message);
        }
    });

    const handleCreate = () => {
        if (!newTitle || !selectedProcessId) {
            toast.error("Please fill in all required fields");
            return;
        }
        createBIA.mutate({
            clientId,
            processId: parseInt(selectedProcessId),
            title: newTitle,
        });
    };

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div className="mb-2">
                    <Breadcrumb
                        items={[
                            { label: "Clients", href: "/clients" },
                            { label: "Business Continuity", href: `/clients/${clientId}/business-continuity` },
                            { label: "Impact Analysis", href: `/clients/${clientId}/business-continuity/bia` },
                        ]}
                    />
                    <Button
                        variant="ghost"
                        size="sm"
                        className="mt-2 -ml-3 text-muted-foreground hover:text-foreground"
                        onClick={() => setLocation(`/clients/${clientId}/business-continuity`)}
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to BC Dashboard
                    </Button>
                </div>
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Business Impact Analysis</h1>
                        <p className="text-muted-foreground mt-2">
                            Identify critical business functions and the potential impact of their disruption.
                        </p>
                    </div>
                </div>

                <Card className="bg-slate-50 border-slate-200">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-lg font-semibold flex items-center gap-2">
                            <Shield className="h-5 w-5 text-[#1C4D8D]" />
                            Getting Started with Business Impact Analysis
                        </CardTitle>
                        <CardDescription>
                            Follow these steps to conduct a professional BIA that aligns with ISO 22301 standards.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div className="flex flex-col gap-1 p-3 rounded-lg bg-white border border-slate-100 shadow-sm">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground bg-slate-100 px-2 py-0.5 rounded w-fit mb-1">Step 1</span>
                                <span className="font-semibold text-sm">Define Processes</span>
                                <p className="text-xs text-muted-foreground mb-2">Create an inventory of your critical business functions first.</p>
                                <Link href={`/clients/${clientId}/business-continuity/processes`}>
                                    <Button variant="link" className="p-0 h-auto text-xs text-[#1C4D8D] font-semibold justify-start hover:no-underline">
                                        Open Process Registry <ArrowRight className="ml-1 h-3 w-3" />
                                    </Button>
                                </Link>
                            </div>
                            <div className="flex flex-col gap-1 p-3 rounded-lg bg-white border border-slate-100 shadow-sm">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground bg-slate-100 px-2 py-0.5 rounded w-fit mb-1">Step 2</span>
                                <span className="font-semibold text-sm">Start New BIA</span>
                                <p className="text-xs text-muted-foreground mb-2">Click \"New BIA\" below and select a process to analyze.</p>
                                <Button variant="link" className="p-0 h-auto text-xs text-[#1C4D8D] font-semibold justify-start hover:no-underline" onClick={() => setIsNewOpen(true)}>
                                    Create BIA Now <ArrowRight className="ml-1 h-3 w-3" />
                                </Button>
                            </div>
                            <div className="flex flex-col gap-1 p-3 rounded-lg bg-white border border-slate-100 shadow-sm opacity-60">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground bg-slate-100 px-2 py-0.5 rounded w-fit mb-1">Step 3</span>
                                <span className="font-semibold text-sm">Assess Impacts</span>
                                <p className="text-xs text-muted-foreground mb-2">Evaluate operational and financial impacts over time.</p>
                            </div>
                            <div className="flex flex-col gap-1 p-3 rounded-lg bg-white border border-slate-100 shadow-sm opacity-60">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground bg-slate-100 px-2 py-0.5 rounded w-fit mb-1">Step 4</span>
                                <span className="font-semibold text-sm">Set Objectives</span>
                                <p className="text-xs text-muted-foreground mb-2">Determine RTO, RPO, and MTPD for the process.</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Tabs defaultValue="assessments" className="space-y-4">
                    <TabsList>
                        <TabsTrigger value="methodology">Methodology</TabsTrigger>
                        <TabsTrigger value="assessments">Assessments</TabsTrigger>
                    </TabsList>

                    <TabsContent value="methodology">
                        <Card>
                            <CardHeader>
                                <CardTitle>BIA Methodology</CardTitle>
                                <CardDescription>
                                    Our approach to Business Impact Analysis aligns with ISO 22301 standards.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="grid gap-6 md:grid-cols-3">
                                    <div className="space-y-2">
                                        <h3 className="font-semibold flex items-center gap-2">
                                            <BookOpen className="h-5 w-5 text-blue-500" />
                                            1. Identification
                                        </h3>
                                        <p className="text-sm text-muted-foreground">
                                            Identify critical business activities, processes, and the resources they depend on (people, technology, facilities).
                                        </p>
                                    </div>
                                    <div className="space-y-2">
                                        <h3 className="font-semibold flex items-center gap-2">
                                            <AlertCircle className="h-5 w-5 text-orange-500" />
                                            2. Impact Assessment
                                        </h3>
                                        <p className="text-sm text-muted-foreground">
                                            Evaluate the potential operational and financial impacts of a disruption over time (e.g., 4 hours, 24 hours).
                                        </p>
                                    </div>
                                    <div className="space-y-2">
                                        <h3 className="font-semibold flex items-center gap-2">
                                            <FileText className="h-5 w-5 text-green-500" />
                                            3. Recovery Objectives
                                        </h3>
                                        <p className="text-sm text-muted-foreground">
                                            Define Recovery Time Objectives (RTO) and Recovery Point Objectives (RPO) for each critical activity.
                                        </p>
                                    </div>
                                </div>

                                <div className="bg-muted/50 p-4 rounded-lg">
                                    <h3 className="font-semibold mb-2">Key Definitions</h3>
                                    <ul className="list-disc pl-5 space-y-1 text-sm">
                                        <li><strong>RTO (Recovery Time Objective):</strong> The targeted duration of time and a service level within which a business process must be restored after a disaster.</li>
                                        <li><strong>RPO (Recovery Point Objective):</strong> The maximum targeted period in which data might be lost from an IT service due to a major incident.</li>
                                        <li><strong>MTPD (Max Tolerable Period of Disruption):</strong> The maximum amount of time that a process can be down before the organization suffers irreparable harm.</li>
                                    </ul>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="assessments">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between">
                                <div>
                                    <CardTitle>BIA Assessments</CardTitle>
                                    <CardDescription>Manage your Business Impact Analyses.</CardDescription>
                                </div>
                                <Dialog open={isNewOpen} onOpenChange={setIsNewOpen}>
                                    <DialogTrigger asChild>
                                        <Button><Plus className="mr-2 h-4 w-4" /> New BIA</Button>
                                    </DialogTrigger>
                                    <DialogContent>
                                        <DialogHeader>
                                            <DialogTitle>Create New Business Impact Analysis</DialogTitle>
                                        </DialogHeader>
                                        <div className="space-y-4 py-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="title">Title / Name</Label>
                                                <Input
                                                    id="title"
                                                    placeholder="e.g., Q1 2025 Payroll BIA"
                                                    value={newTitle}
                                                    onChange={(e) => setNewTitle(e.target.value)}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="process">Business Process</Label>
                                                <Select value={selectedProcessId} onValueChange={setSelectedProcessId}>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select a process..." />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {processes?.map((p) => (
                                                            <SelectItem key={p.id} value={p.id.toString()}>
                                                                {p.name}
                                                            </SelectItem>
                                                        ))}
                                                        {processes?.length === 0 && (
                                                            <div className="p-2 text-sm text-muted-foreground text-center">
                                                                No processes found. <Link href={`/clients/${clientId}/business-continuity/processes`} className="text-blue-500 underline">Create one first.</Link>
                                                            </div>
                                                        )}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>
                                        <DialogFooter>
                                            <Button variant="outline" onClick={() => setIsNewOpen(false)}>Cancel</Button>
                                            <Button onClick={handleCreate} disabled={createBIA.isPending}>
                                                {createBIA.isPending ? "Creating..." : "Create BIA"}
                                            </Button>
                                        </DialogFooter>
                                    </DialogContent>
                                </Dialog>
                            </CardHeader>
                            <CardContent>
                                <div className="rounded-xl border border-slate-200 shadow-lg overflow-hidden bg-white">
                                    <Table>
                                        <TableHeader>
                                            <TableRow className="bg-[#1C4D8D] hover:bg-[#1C4D8D] border-none">
                                                <TableHead className="text-white font-semibold py-4">Title</TableHead>
                                                <TableHead className="text-white font-semibold py-4">Process</TableHead>
                                                <TableHead className="text-white font-semibold py-4">Status</TableHead>
                                                <TableHead className="text-white font-semibold py-4">Last Updated</TableHead>
                                                <TableHead className="text-right text-white font-semibold py-4">Actions</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {bias?.length === 0 && (
                                                <TableRow>
                                                    <TableCell colSpan={5} className="text-center py-12 bg-white">
                                                        <div className="flex flex-col items-center justify-center space-y-3">
                                                            <div className="p-3 bg-slate-50 rounded-full">
                                                                <FileText className="h-8 w-8 text-slate-400" />
                                                            </div>
                                                            <div className="max-w-[300px] mx-auto">
                                                                <h3 className="font-semibold text-slate-900">No BIAs Found</h3>
                                                                <p className="text-sm text-slate-500 mt-1">
                                                                    You haven't created any Business Impact Analyses yet.
                                                                    The first step is to ensure you have <Link href={`/clients/${clientId}/business-continuity/processes`} className="text-[#1C4D8D] hover:underline font-medium">Business Processes</Link> defined.
                                                                </p>
                                                            </div>
                                                            <Button onClick={() => setIsNewOpen(true)} className="mt-4 bg-[#1C4D8D]">
                                                                <Plus className="mr-2 h-4 w-4" /> Create First BIA
                                                            </Button>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                            {bias?.map((bia) => (
                                                <TableRow key={bia.id} className="bg-white border-b border-slate-200 transition-all duration-200 hover:bg-slate-50 hover:shadow-sm group">
                                                    <TableCell className="font-medium text-black py-4">{bia.title}</TableCell>
                                                    <TableCell className="text-gray-600 py-4">{bia.processName || "-"}</TableCell>
                                                    <TableCell className="py-4">
                                                        <Badge variant={bia.status === 'approved' ? 'default' : 'secondary'}>
                                                            {bia.status}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="text-gray-500 py-4">{new Date(bia.updatedAt || new Date()).toLocaleDateString()}</TableCell>
                                                    <TableCell className="text-right py-4">
                                                        <Link href={`/clients/${clientId}/business-continuity/bia/${bia.id}`}>
                                                            <Button variant="ghost" size="sm" className="hover:bg-[#1C4D8D]/10 hover:text-[#1C4D8D] transition-colors duration-200">
                                                                Open <ArrowRight className="ml-2 h-4 w-4" />
                                                            </Button>
                                                        </Link>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </DashboardLayout>
    );
}

import React, { useState, useRef, useEffect } from 'react';
import { trpc } from '@/lib/trpc';
import { useParams, Link, useLocation } from "wouter";
import NIST80037Layout from "./NIST80037Layout";
import { useNistSystemId } from "./useNistSystem";

import { Play } from "lucide-react";
import { Users } from "lucide-react";
import { Globe } from "lucide-react";
import { Shield } from "lucide-react";
import { Target } from "lucide-react";
import { CheckCircle2 } from "lucide-react";
import { Plus } from "lucide-react";
import { ExternalLink } from "lucide-react";
import { Zap } from "lucide-react";
import { Scale } from "lucide-react";
import { Building2 } from "lucide-react";
import { Briefcase } from "lucide-react";
import { ArrowRight } from "lucide-react";
import { Save } from "lucide-react";
import { Info } from "lucide-react";
import { FileText, Trash2, X, UserCog, Activity, Edit2, Download, Upload } from "lucide-react";

import { Button } from "@complianceos/ui/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@complianceos/ui/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@complianceos/ui/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@complianceos/ui/ui/select";
import { Avatar, AvatarFallback } from "@complianceos/ui/ui/avatar";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@complianceos/ui/ui/dialog";

import { Input } from "@complianceos/ui/ui/input";
import { Label } from "@complianceos/ui/ui/label";
import { Textarea } from "@complianceos/ui/ui/textarea";
import { Badge } from "@complianceos/ui/ui/badge";
import { ScrollArea } from "@complianceos/ui/ui/scroll-area";
import { Breadcrumb } from "@/components/Breadcrumb";
import { toast } from "sonner";

export default function NIST80037Prepare() {
    const { id } = useParams<{ id: string }>();
    const systemId = useNistSystemId();
    const clientId = parseInt(id || "0");
    const [isSaving, setIsSaving] = useState(false);


    const [uploadedFiles, setUploadedFiles] = useState<{ name: string, url: string, type: string }[]>([]);
    const [uploadedPolicy, setUploadedPolicy] = useState<{ name: string, url: string } | null>(null);
    const [uploadMode, setUploadMode] = useState<'boundary' | 'policy'>('boundary');


    const handleSave = () => {
        setIsSaving(true);
        setTimeout(() => {
            setIsSaving(false);
            toast.success("RMF Preparation Data Saved Successfully", {
                description: "System registration and risk strategy updated.",
            });
        }, 1500);
    };

    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleImportClick = (mode: 'boundary' | 'policy') => {
        setUploadMode(mode);
        setTimeout(() => fileInputRef.current?.click(), 0);
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const newFile = {
                name: file.name,
                url: URL.createObjectURL(file), // In a real app, this would be the S3 URL
                type: file.type
            };

            if (uploadMode === 'policy') {
                setUploadedPolicy(newFile);
                toast.success(`Policy Uploaded: ${file.name}`, {
                    description: "Custom policy document attached."
                });
            } else {
                setUploadedFiles(prev => [...prev, newFile]);
                toast.success(`File attached: ${file.name}`, {
                    description: "Document added to system boundary evidence."
                });
            }
        }
    };

    const removeFile = (index: number) => {
        setUploadedFiles(prev => prev.filter((_, i) => i !== index));
    };

    const trpcContext = trpc.useContext();
    const { data: checklistState } = trpc.checklist.get.useQuery({
        clientId: clientId,
        checklistId: `nist-800-37-prepare-${systemId}`
    });

    const updateChecklistMutation = trpc.checklist.update.useMutation({
        onSuccess: () => {
            trpcContext.checklist.get.invalidate();
        }
    });

    const { data: employees = [] } = trpc.employees.list.useQuery({ clientId });
    const { data: policies = [] } = trpc.clientPolicies.list.useQuery({ clientId });

    const [linkedPolicyId, setLinkedPolicyId] = useState<number | null>(null);
    const [isLinkPolicyOpen, setIsLinkPolicyOpen] = useState(false);
    const [isViewPolicyOpen, setIsViewPolicyOpen] = useState(false);

    // Fetch linked policy content if viewing
    const { data: linkedPolicyData } = trpc.clientPolicies.get.useQuery(
        { id: linkedPolicyId!, clientId },
        { enabled: !!linkedPolicyId && isViewPolicyOpen }
    );

    // Store role assignments in local state for now, synced with checklist items in production

    const { data: orgRoles = [] } = trpc.orgRoles.list.useQuery({ clientId });

    // Dynamic RMF Roles State
    const [rmfRoles, setRmfRoles] = useState<{ id: string, title: string, icon: any, assigneeId: string | number | null }[]>([
        { id: "ao", title: "Authorizing Official (AO)", icon: Building2, assigneeId: null },
        { id: "ciso", title: "Chief Information Security Officer (CISO)", icon: Shield, assigneeId: null },
        { id: "system_owner", title: "System Owner", icon: Briefcase, assigneeId: null },
        { id: "isso", title: "Information System Security Officer (ISSO)", icon: Zap, assigneeId: null }
    ]);

    const [isAddRoleOpen, setIsAddRoleOpen] = useState(false);
    const [newRoleData, setNewRoleData] = useState({ roleTitle: "", employeeId: "" });

    // Stakeholder State
    const [stakeholders, setStakeholders] = useState<{ id: string, name: string, title: string, employeeId?: string }[]>([]);
    const [isAddStakeholderOpen, setIsAddStakeholderOpen] = useState(false);
    const [newStakeholder, setNewStakeholder] = useState({ name: "", title: "", employeeId: "" });

    // Risk Matrix State
    const defaultMatrix = [
        ['low', 'low', 'mod'],    // Row 1 (Low Likelihood): Low Impact, Mod Impact, High Impact
        ['low', 'mod', 'high'],   // Row 2 (Mod Likelihood)
        ['mod', 'high', 'high']   // Row 3 (High Likelihood)
    ];
    const defaultMatrix4 = [
        ['low', 'low', 'mod', 'mod'],
        ['low', 'mod', 'mod', 'high'],
        ['mod', 'mod', 'high', 'critical'],
        ['mod', 'high', 'critical', 'critical']
    ];
    const [riskMatrix, setRiskMatrix] = useState<string[][]>(defaultMatrix);
    const [isMatrixConfigOpen, setIsMatrixConfigOpen] = useState(false);

    // Default Roles Configuration
    const defaultRolesBase = [
        { id: "ao", title: "Authorizing Official (AO)", icon: Building2 },
        { id: "ciso", title: "Chief Information Security Officer (CISO)", icon: Shield },
        { id: "system_owner", title: "System Owner", icon: Briefcase },
        { id: "isso", title: "Information System Security Officer (ISSO)", icon: Zap }
    ];

    // Helper for Risk Colors
    const getRiskStyle = (level: string) => {
        switch (level) {
            case 'low': return "bg-emerald-200 text-emerald-900";
            case 'mod': return "bg-amber-200 text-amber-900";
            case 'high': return "bg-rose-300 text-rose-900";
            case 'critical': return "bg-rose-600 text-white";
            default: return "bg-slate-100 text-slate-500";
        }
    };

    const getRiskLabel = (level: string) => {
        switch (level) {
            case 'low': return "Low";
            case 'mod': return "Mod";
            case 'high': return "High";
            case 'critical': return "Critical";
            default: return level;
        }
    };

    const cycleRiskLevel = (current: string) => {
        const levels = ['low', 'mod', 'high', 'critical'];
        const idx = levels.indexOf(current);
        return levels[(idx + 1) % levels.length];
    };

    const handleMatrixCellClick = (rowIdx: number, colIdx: number) => {
        const newMatrix = [...riskMatrix.map(row => [...row])];
        newMatrix[rowIdx][colIdx] = cycleRiskLevel(newMatrix[rowIdx][colIdx]);
        setRiskMatrix(newMatrix);
    };
    const saveLinkedPolicy = (policyId: number) => {
        const currentR2 = checklistState?.items?.['r2'];
        const r2Data = typeof currentR2 === 'object' ? currentR2 : { checked: false };

        const newItems = {
            ...(checklistState?.items || {}),
            r2: {
                ...r2Data,
                meta_strategy_policy_id: policyId
            }
        };

        updateChecklistMutation.mutate({
            clientId,
            checklistId: `nist-800-37-prepare-${systemId}`,
            items: newItems
        });
        setLinkedPolicyId(policyId);
        setIsLinkPolicyOpen(false);
        toast.success("Strategy Policy Linked");
    };

    const saveMatrixToBackend = () => {
        const currentR2 = checklistState?.items?.['r2'];
        const r2Data = typeof currentR2 === 'object' ? currentR2 : { checked: false };

        const newItems = {
            ...(checklistState?.items || {}),
            r2: {
                ...r2Data,
                meta_risk_matrix: riskMatrix
            }
        };

        updateChecklistMutation.mutate({
            clientId,
            checklistId: `nist-800-37-prepare-${systemId}`,
            items: newItems
        });
        setIsMatrixConfigOpen(false);
        toast.success("Risk Matrix Updated");
    };

    useEffect(() => {
        // Hydrate Roles (R-1)
        const r1Item = checklistState?.items?.['r1'];
        if (typeof r1Item === 'object' && r1Item?.meta_roles) {
            const savedRoles = r1Item.meta_roles as any[];
            const hydratedRoles = savedRoles.map(r => {
                const defaultRole = defaultRolesBase.find(dr => dr.id === r.id);
                return {
                    ...r,
                    icon: defaultRole ? defaultRole.icon : (r.iconName === 'UserCog' ? UserCog : Users)
                };
            });
            setRmfRoles(hydratedRoles);
        } else {
            // Reset to default roles if no data exists for this system context
            setRmfRoles(defaultRolesBase.map(role => ({ ...role, assigneeId: null })));
            setStakeholders([]);
            setRiskMatrix(defaultMatrix);
            setLinkedPolicyId(null);
            setUploadedFiles([]);
            setUploadedPolicy(null);
        }
    }, [checklistState?.items, systemId]);

    const saveStakeholdersToBackend = (newList: typeof stakeholders) => {
        const currentR2 = checklistState?.items?.['r2'];
        const r2Data = typeof currentR2 === 'object' ? currentR2 : { checked: false };

        const newItems = {
            ...(checklistState?.items || {}),
            r2: {
                ...r2Data,
                meta_stakeholders: newList
            }
        };

        updateChecklistMutation.mutate({
            clientId,
            checklistId: `nist-800-37-prepare-${systemId}`,
            items: newItems
        });
    };

    const handleAddStakeholder = () => {
        if (!newStakeholder.name && !newStakeholder.employeeId) return;

        let stakeholderName = newStakeholder.name;
        let stakeholderTitle = newStakeholder.title;

        if (newStakeholder.employeeId) {
            const emp = employees.find((e: any) => e.id.toString() === newStakeholder.employeeId);
            if (emp) {
                stakeholderName = `${emp.firstName} ${emp.lastName}`;
                // Use provided title or fallback to emp title
                if (!stakeholderTitle) stakeholderTitle = emp.jobTitle || "Stakeholder";
            }
        }

        const newItem = {
            id: `sh_${Date.now()}`,
            name: stakeholderName,
            title: stakeholderTitle || "Stakeholder",
            employeeId: newStakeholder.employeeId
        };
        const updated = [...stakeholders, newItem];
        setStakeholders(updated);
        saveStakeholdersToBackend(updated);
        setIsAddStakeholderOpen(false);
        setNewStakeholder({ name: "", title: "", employeeId: "" });
        toast.success("Stakeholder Added");
    };

    const handleDeleteStakeholder = (id: string) => {
        const updated = stakeholders.filter(s => s.id !== id);
        setStakeholders(updated);
        saveStakeholdersToBackend(updated);
        toast.info("Stakeholder Removed");
    };

    const saveRolesToBackend = (roles: typeof rmfRoles) => {
        const rolesToSave = roles.map(r => {
            const { icon, ...rest } = r;
            if (r.id.startsWith('custom_')) {
                return { ...rest, iconName: 'Users' };
            }
            return rest;
        });

        const currentR1 = checklistState?.items?.['r1'];
        const r1Data = typeof currentR1 === 'object' ? currentR1 : { checked: false };

        const newR1 = {
            ...r1Data,
            meta_roles: rolesToSave
        };

        const newItems = {
            ...(checklistState?.items || {}),
            r1: newR1
        };

        updateChecklistMutation.mutate({
            clientId,
            checklistId: `nist-800-37-prepare-${systemId}`,
            items: newItems
        });
    };

    const handleAssignRole = (roleId: string, employeeId: string) => {
        const updatedRoles = rmfRoles.map(r =>
            r.id === roleId ? { ...r, assigneeId: employeeId } : r
        );
        setRmfRoles(updatedRoles);
        saveRolesToBackend(updatedRoles);
        toast.success("Role Assigned", {
            description: `User has been assigned to this role.`
        });
    };

    const handleRemoveAssignment = (roleId: string) => {
        const updatedRoles = rmfRoles.map(r =>
            r.id === roleId ? { ...r, assigneeId: null } : r
        );
        setRmfRoles(updatedRoles);
        saveRolesToBackend(updatedRoles);
        toast.info("Role Unassigned");
    };

    const handleAddRole = () => {
        if (!newRoleData.roleTitle) return;

        const newRole = {
            id: `custom_${Date.now()}`,
            title: newRoleData.roleTitle,
            icon: Users, // Safe icon
            assigneeId: newRoleData.employeeId || null
        };

        const updatedRoles = [...rmfRoles, newRole];
        setRmfRoles(updatedRoles);
        saveRolesToBackend(updatedRoles);

        setIsAddRoleOpen(false);
        setNewRoleData({ roleTitle: "", employeeId: "" });
        toast.success("New RMF Role Added", {
            description: `Added ${newRole.title} to the team.`
        });
    };

    const handleDeleteRole = (roleId: string) => {
        const updatedRoles = rmfRoles.filter(r => r.id !== roleId);
        setRmfRoles(updatedRoles);
        saveRolesToBackend(updatedRoles);
        toast.success("Role Removed from RMF Team");
    };

    const checklistItems = [
        { id: "r1", task: "R-1: Role Assignments" },
        { id: "r2", task: "R-2: Risk Strategy" },
        { id: "r3", task: "R-3: Org Risk Assessment" },
        { id: "s1", task: "S-1: Mission Definition" },
        { id: "s2", task: "S-2: System Boundary" },
        { id: "s3", task: "S-3: Information Types" }
    ];

    const getStatus = (id: string) => {
        const item = checklistState?.items?.[id];
        // If it's a boolean (legacy), true=completed, false=pending
        if (typeof item === 'boolean') return item ? 'completed' : 'pending';
        // If object (new), check 'checked' property or custom 'status' if we add it later
        if (typeof item === 'object') return item.checked ? 'completed' : 'pending';
        return 'pending';
    };

    const toggleStatus = (id: string, currentStatus: string) => {
        const newChecked = currentStatus !== 'completed';
        const currentItem = checklistState?.items?.[id];
        const itemData = typeof currentItem === 'object' ? currentItem : {};

        const newItems = {
            ...(checklistState?.items || {}),
            [id]: { ...itemData, checked: newChecked }
        };

        updateChecklistMutation.mutate({
            clientId,
            checklistId: `nist-800-37-prepare-${systemId}`,
            items: newItems
        });
    };

    return (
        <NIST80037Layout>
            <div className="space-y-8 max-w-5xl pb-20">
                <Breadcrumb
                    items={[
                        { label: "Dashboard", href: `/dashboard` },
                        { label: "NIST Hub", href: `/clients/${clientId}/nist` },
                        { label: "SP 800-37 (RMF)", href: `/clients/${clientId}/nist/rmf` },
                        { label: "Step 0: Prepare" },
                    ]}
                />

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                            <Badge className="bg-emerald-600 text-white font-black px-3">STEP 0</Badge>
                            <Badge variant="outline" className="border-emerald-200 text-emerald-700 font-bold uppercase tracking-widest text-[10px]">Preparation Phase</Badge>
                        </div>
                        <h1 className="text-4xl font-black tracking-tight text-slate-900 flex items-center gap-4">
                            <Play className="w-10 h-10 text-emerald-600" />
                            Organization & System Preparation
                        </h1>
                        <p className="text-slate-500 text-lg font-medium max-w-3xl">
                            Establish context and infrastructure for managing security and privacy risk before beginning the technical RMF steps.
                        </p>
                    </div>
                    <div className="flex gap-4">
                        <Link href={`/clients/${clientId}/federal/ssp`}>
                            <Button
                                variant="outline"
                                className="rounded-2xl h-14 px-6 font-bold border-2 border-slate-100 hover:bg-slate-50 text-slate-600 gap-2"
                            >
                                <FileText className="w-5 h-5 text-indigo-600" /> Manage System Package
                            </Button>
                        </Link>
                        <Button
                            onClick={handleSave}
                            disabled={isSaving}
                            className="bg-emerald-600 hover:bg-emerald-700 rounded-2xl h-14 px-8 shadow-xl shadow-emerald-200/50 font-black text-lg gap-2"
                        >
                            {isSaving ? "Saving..." : <><Save className="w-5 h-5" /> Save RMF Context</>}
                        </Button>
                    </div>
                </div>

                <div className="bg-blue-50 border border-blue-100 rounded-2xl p-6 flex gap-4 items-start mb-8">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center shrink-0 text-blue-600">
                        <Info className="w-6 h-6" />
                    </div>
                    <div className="space-y-1">
                        <h3 className="font-bold text-blue-900 text-lg">Page Guide: Managing Your Progress</h3>
                        <p className="text-blue-700 leading-relaxed font-medium">
                            Use the <strong>Detailed Tabs</strong> on the right (System Identification, Boundary, etc.) to input your system data.
                            The <strong>Prepare Task Checklist</strong> on the left is your personal tracker—manually mark items as "Completed" once you have finished the corresponding work in the tabs.
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                    {/* Progress Card */}
                    <Card className="lg:col-span-1 border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] bg-white/50 backdrop-blur-sm h-fit">
                        <CardHeader>
                            <CardTitle className="text-xs font-black uppercase tracking-widest text-emerald-600">Prepare Task Checklist</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {checklistItems.map((item, i) => {
                                const status = getStatus(item.id);
                                return (
                                    <div key={i} className="flex items-center gap-3 group cursor-pointer" onClick={() => toggleStatus(item.id, status)}>
                                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${status === 'completed' ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-200'}`}>
                                            {status === 'completed' && <CheckCircle2 className="w-4 h-4" />}
                                        </div>
                                        <span className={`text-sm font-bold ${status === 'pending' ? 'text-slate-400 group-hover:text-slate-600' : 'text-slate-700'}`}>{item.task}</span>
                                    </div>
                                )
                            })}
                        </CardContent>
                    </Card>

                    <Card className="lg:col-span-3 border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] bg-white rounded-[2.5rem] overflow-hidden">
                        <Tabs defaultValue="identification" className="w-full">
                            <div className="border-b px-8 bg-slate-50/50">
                                <TabsList className="h-16 bg-transparent gap-8">
                                    <TabsTrigger value="identification" className="data-[state=active]:bg-transparent data-[state=active]:text-emerald-700 data-[state=active]:border-b-2 data-[state=active]:border-emerald-600 data-[state=active]:shadow-none rounded-none font-black text-xs uppercase tracking-widest">
                                        System Identification
                                    </TabsTrigger>
                                    <TabsTrigger value="boundary" className="data-[state=active]:bg-transparent data-[state=active]:text-emerald-700 data-[state=active]:border-b-2 data-[state=active]:border-emerald-600 data-[state=active]:shadow-none rounded-none font-black text-xs uppercase tracking-widest">
                                        Boundary Definition
                                    </TabsTrigger>
                                    <TabsTrigger value="roles" className="data-[state=active]:bg-transparent data-[state=active]:text-emerald-700 data-[state=active]:border-b-2 data-[state=active]:border-emerald-600 data-[state=active]:shadow-none rounded-none font-black text-xs uppercase tracking-widest">
                                        Roles & Stakeholders
                                    </TabsTrigger>
                                    <TabsTrigger value="strategy" className="data-[state=active]:bg-transparent data-[state=active]:text-emerald-700 data-[state=active]:border-b-2 data-[state=active]:border-emerald-600 data-[state=active]:shadow-none rounded-none font-black text-xs uppercase tracking-widest">
                                        Risk Strategy
                                    </TabsTrigger>
                                </TabsList>
                            </div>

                            <ScrollArea className="h-[900px]">
                                <TabsContent value="identification" className="p-10 space-y-8 m-0">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div className="space-y-4 md:col-span-2">
                                            <Label className="text-sm font-black uppercase tracking-widest text-slate-500">System Name & Purpose (S-1)</Label>
                                            <Input placeholder="Enter official system name (e.g., Enterprise Cloud Operations)" className="h-14 rounded-2xl border-slate-200 focus:ring-emerald-500 text-lg font-bold" />
                                            <Textarea
                                                placeholder="Describe the mission or business processes the system supports..."
                                                className="min-h-[120px] rounded-2xl border-slate-200 focus:ring-emerald-500"
                                            />
                                        </div>

                                        <div className="space-y-4">
                                            <Label className="text-sm font-black uppercase tracking-widest text-slate-500">System Descriptor</Label>
                                            <Input placeholder="Unique System ID (e.g., SYS-2026-001)" className="h-12 rounded-xl" />
                                        </div>

                                        <div className="space-y-4">
                                            <Label className="text-sm font-black uppercase tracking-widest text-slate-500">Registration Status (S-4)</Label>
                                            <div className="flex gap-2">
                                                <Badge className="bg-emerald-100 text-emerald-700 py-2 px-4 rounded-xl font-bold cursor-pointer border-emerald-200">Registered</Badge>
                                                <Badge variant="outline" className="py-2 px-4 rounded-xl font-bold cursor-pointer text-slate-400">Pending Review</Badge>
                                            </div>
                                        </div>

                                        <div className="space-y-4 md:col-span-2">
                                            <Label className="text-sm font-black uppercase tracking-widest text-slate-500">Asset Inventory (S-6)</Label>
                                            <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100 flex items-center justify-between group hover:border-indigo-200 transition-colors cursor-pointer">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 bg-indigo-100 rounded-2xl flex items-center justify-center text-indigo-600">
                                                        <Globe className="w-6 h-6" />
                                                    </div>
                                                    <div>
                                                        <h4 className="font-bold text-slate-900">Link Global Asset Inventory</h4>
                                                        <p className="text-xs text-slate-500 font-medium">Auto-import assets for this system boundary</p>
                                                    </div>
                                                </div>
                                                <Plus className="w-6 h-6 text-slate-300 group-hover:text-indigo-600" />
                                            </div>
                                        </div>
                                    </div>
                                </TabsContent>

                                <TabsContent value="boundary" className="p-10 space-y-8 m-0">
                                    <div className="space-y-6">
                                        <div className="flex items-center justify-between">
                                            <div className="space-y-1">
                                                <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Authorization Boundary (S-7)</h3>
                                                <p className="text-sm text-slate-500 font-medium font-serif">Define the set of system components and data flows.</p>
                                            </div>

                                            <Button variant="outline" onClick={() => handleImportClick('boundary')} className="rounded-xl border-dashed border-2 gap-2 h-12">
                                                <ExternalLink className="w-4 h-4" /> Import Diagram
                                            </Button>
                                        </div>

                                        <div className="space-y-4">
                                            {uploadedFiles.length > 0 ? (
                                                <div className="grid grid-cols-1 gap-3">
                                                    {uploadedFiles.map((file, idx) => (
                                                        <div key={idx} className="flex items-center justify-between p-4 bg-white border border-slate-200 rounded-xl hover:shadow-md transition-shadow group">
                                                            <div className="flex items-center gap-4">
                                                                <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center">
                                                                    <FileText className="w-5 h-5" />
                                                                </div>
                                                                <div>
                                                                    <p className="font-bold text-sm text-slate-800">{file.name}</p>
                                                                    <a href={file.url} target="_blank" rel="noreferrer" className="text-xs text-indigo-500 font-medium hover:underline">View Document</a>
                                                                </div>
                                                            </div>
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => removeFile(idx)}
                                                                className="text-slate-400 hover:text-rose-500 hover:bg-rose-50"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </Button>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="p-8 bg-slate-50 rounded-[2rem] border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-center">
                                                    <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center mb-4 text-slate-400">
                                                        <FileText className="w-8 h-8" />
                                                    </div>
                                                    <p className="font-bold text-slate-600">No documents uploaded</p>
                                                    <p className="text-sm text-slate-500 max-w-sm mt-1 mb-4">Upload architecture diagrams, data flow charts, or network topology documents.</p>
                                                    <Button variant="secondary" onClick={() => handleImportClick('boundary')} className="bg-white border hover:bg-slate-50">
                                                        Select Files
                                                    </Button>
                                                </div>
                                            )}
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="space-y-3">
                                                <Label className="text-sm font-black uppercase tracking-widest text-slate-500">Logical Boundary</Label>
                                                <Textarea placeholder="VPCs, Subnets, Identity Providers..." className="rounded-2xl" />
                                            </div>
                                            <div className="space-y-3">
                                                <Label className="text-sm font-black uppercase tracking-widest text-slate-500">Physical Boundary</Label>
                                                <Textarea placeholder="Data Centers, Office Locations, Remote Access Points..." className="rounded-2xl" />
                                            </div>
                                        </div>
                                    </div>
                                </TabsContent>

                                <TabsContent value="roles" className="p-10 space-y-8 m-0">
                                    <div className="space-y-6">
                                        <div className="flex items-center justify-between">
                                            <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Management Role Assignments (R-1)</h3>
                                            <Button onClick={() => setIsAddRoleOpen(true)} className="bg-indigo-600 hover:bg-indigo-700 rounded-xl gap-2">
                                                <Plus className="w-4 h-4" /> Add RMF Role
                                            </Button>
                                        </div>

                                        <div className="grid grid-cols-1 gap-4">
                                            {rmfRoles.map((role) => {
                                                const assignedEmployee = employees.find((e: any) => String(e.id) === String(role.assigneeId));
                                                const isCustom = role.id.startsWith('custom_');

                                                return (
                                                    <div key={role.id} className="p-6 bg-white border rounded-[2rem] flex items-center justify-between hover:shadow-md transition-all text-slate-900 group">
                                                        <div className="flex items-center gap-5">
                                                            <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-500 border border-slate-100 relative">
                                                                <role.icon className="w-7 h-7" />
                                                                {isCustom && (
                                                                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-indigo-500 rounded-full border border-white" />
                                                                )}
                                                            </div>
                                                            <div>
                                                                <p className="text-xs font-black uppercase tracking-widest text-slate-400">{role.title}</p>
                                                                {assignedEmployee ? (
                                                                    <p className="text-lg font-bold text-slate-900">{assignedEmployee.firstName} {assignedEmployee.lastName}</p>
                                                                ) : (
                                                                    <p className="text-lg font-bold text-slate-300 italic">Unassigned</p>
                                                                )}
                                                            </div>
                                                        </div>

                                                        <div className="flex items-center gap-3">
                                                            {assignedEmployee ? (
                                                                <>
                                                                    <Badge className="bg-emerald-50 text-emerald-700 border-emerald-100 font-bold px-3">Assignee Verified</Badge>
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        className="text-slate-400 hover:text-rose-500"
                                                                        onClick={() => handleRemoveAssignment(role.id)}
                                                                        title="Unassign User"
                                                                    >
                                                                        <X className="w-4 h-4" />
                                                                    </Button>
                                                                </>
                                                            ) : (
                                                                <div className="w-64">
                                                                    <Select onValueChange={(val) => handleAssignRole(role.id, val)}>
                                                                        <SelectTrigger className="h-10 rounded-xl border-indigo-200 text-indigo-600 font-bold focus:ring-0">
                                                                            <SelectValue placeholder="Assign Employee..." />
                                                                        </SelectTrigger>
                                                                        <SelectContent>
                                                                            {employees.map((emp: any) => (
                                                                                <SelectItem key={emp.id} value={emp.id.toString()} className="font-medium">
                                                                                    {emp.firstName} {emp.lastName}
                                                                                </SelectItem>
                                                                            ))}
                                                                        </SelectContent>
                                                                    </Select>
                                                                </div>
                                                            )}

                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="text-slate-400 hover:text-rose-500 bg-slate-50 hover:bg-rose-50 border border-slate-200 hover:border-rose-200"
                                                                onClick={() => handleDeleteRole(role.id)}
                                                                title="Delete Role"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </Button>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </TabsContent>

                                <TabsContent value="strategy" className="p-10 space-y-8 m-0">
                                    <div className="space-y-8">
                                        <div className="p-8 bg-indigo-900 rounded-[3rem] text-white relative overflow-hidden">
                                            <div className="relative z-10 space-y-4">
                                                <h3 className="text-2xl font-black tracking-tight">Risk Management Strategy (R-2)</h3>
                                                <p className="text-indigo-200 font-medium leading-relaxed max-w-2xl">
                                                    The broad objective of the RMF is to ensure that enterprise-level strategy guides system-level decisions.
                                                </p>

                                            </div>
                                            <Scale className="absolute -bottom-10 -right-10 w-64 h-64 text-white/5 rotate-12" />
                                        </div>

                                        <div className="space-y-8">
                                            {/* Risk Heatmap & Thresholds - Full Width */}
                                            <div className="p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100 w-full shadow-sm">
                                                <div className="flex flex-col md:flex-row gap-12 items-start">
                                                    {/* Heatmap Visualization */}
                                                    <div className="flex-1 w-full">
                                                        <div className="flex items-center justify-between mb-6">
                                                            <h4 className="font-extrabold text-slate-900 flex items-center gap-2">
                                                                <Activity className="w-5 h-5 text-indigo-600" />
                                                                Risk Assessment Matrix
                                                            </h4>
                                                            <div className="flex gap-2">
                                                                <Badge variant="outline" className="bg-white">Dynamic 3x3</Badge>
                                                                <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => setIsMatrixConfigOpen(true)}>
                                                                    <Edit2 className="w-3 h-3 text-slate-500" />
                                                                </Button>
                                                            </div>
                                                        </div>

                                                        <div className="relative pl-8 pb-8">
                                                            {/* Y-Axis Label */}
                                                            <div className="absolute -left-4 top-1/2 -translate-y-1/2 -rotate-90 text-xs font-black text-slate-400 uppercase tracking-widest text-center w-32 origin-center transform">
                                                                Likelihood
                                                            </div>

                                                            <div className="grid gap-1 mb-1" style={{ display: 'grid', gridTemplateRows: `repeat(${riskMatrix.length}, minmax(0, 1fr))` }}>
                                                                {[...Array(riskMatrix.length)].map((_, i) => i).reverse().map((rowIndex) => (
                                                                    <div key={`row-${rowIndex}`} className="grid gap-1" style={{ display: 'grid', gridTemplateColumns: `repeat(${riskMatrix.length}, minmax(0, 1fr))` }}>
                                                                        {riskMatrix[rowIndex]?.map((val, colIndex) => (
                                                                            <div key={`${rowIndex}-${colIndex}`} className={`h-16 rounded-sm flex items-center justify-center font-bold text-xs ${getRiskStyle(val)}`}>
                                                                                {getRiskLabel(val)}
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                ))}
                                                            </div>

                                                            {/* X-Axis Label */}
                                                            <div className="absolute bottom-0 left-8 right-0 text-center text-xs font-black text-slate-400 uppercase tracking-widest">
                                                                Impact
                                                            </div>
                                                            <div className="grid text-center text-[10px] font-bold text-slate-500 mt-2 ml-1" style={{ gridTemplateColumns: `repeat(${riskMatrix.length}, minmax(0, 1fr))` }}>
                                                                {riskMatrix.length === 3 ? (
                                                                    <>
                                                                        <div>LOW</div>
                                                                        <div>MODERATE</div>
                                                                        <div>HIGH</div>
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        <div>LOW</div>
                                                                        <div>MODERATE</div>
                                                                        <div>HIGH</div>
                                                                        <div>CRITICAL</div>
                                                                    </>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Legend & Definitions */}
                                                    <div className="w-full md:w-80 space-y-6 pt-2 border-l border-slate-200 pl-8 md:block flex flex-col items-start min-h-[250px] justify-center">
                                                        <Label className="text-sm font-black uppercase tracking-widest text-slate-500 mb-4 block">Definition of Terms</Label>

                                                        <div className="space-y-4 w-full">
                                                            <div className="flex justify-between items-center text-sm font-bold text-slate-700 bg-white p-3 rounded-xl border border-slate-100 shadow-sm">
                                                                <span>Low Risk</span>
                                                                <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 font-black">ACCEPTABLE</Badge>
                                                            </div>
                                                            <div className="flex justify-between items-center text-sm font-bold text-slate-700 bg-white p-3 rounded-xl border border-slate-100 shadow-sm">
                                                                <span>Moderate Risk</span>
                                                                <Badge className="bg-amber-100 text-amber-800 border-amber-200 font-black">MITIGATION REQ</Badge>
                                                            </div>
                                                            <div className="flex justify-between items-center text-sm font-bold text-slate-700 bg-white p-3 rounded-xl border border-slate-100 shadow-sm">
                                                                <span>High Risk</span>
                                                                <Badge className="bg-rose-100 text-rose-800 border-rose-200 font-black">AO REVIEW REQ</Badge>
                                                            </div>
                                                            <div className="flex justify-between items-center text-sm font-bold text-slate-700 bg-white p-3 rounded-xl border border-slate-100 shadow-sm">
                                                                <span>Critical Risk</span>
                                                                <Badge className="bg-rose-600 text-white border-rose-700 font-black">IMMEDIATE ACTION</Badge>
                                                            </div>
                                                        </div>

                                                        <div className="bg-blue-50 p-4 rounded-xl text-xs text-blue-800 leading-relaxed">
                                                            <strong>Note:</strong> Risk determinations guides the level of approval required. Critical/High risks must be accepted by the Authorizing Official (AO).
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Stakeholders Section (Reusing previous logic/state) */}
                                            <div className="space-y-4 p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100 flex flex-col">
                                                <div className="flex items-center justify-between mb-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="bg-white p-2 rounded-xl shadow-sm text-indigo-600 border border-indigo-50">
                                                            <Users className="w-6 h-6" />
                                                        </div>
                                                        <div>
                                                            <h4 className="font-extrabold text-slate-900">Stakeholder Identification (S-5)</h4>
                                                            <p className="text-xs text-slate-500 font-medium">Identify key stakeholders for security & privacy results</p>
                                                        </div>
                                                    </div>
                                                    <Button size="sm" variant="ghost" className="bg-indigo-100 text-indigo-700 hover:bg-indigo-200 rounded-lg" onClick={() => setIsAddStakeholderOpen(true)}>
                                                        <Plus className="w-4 h-4" /> Add
                                                    </Button>
                                                </div>

                                                {stakeholders.length === 0 ? (
                                                    <div className="text-center py-8 border-2 border-dashed border-slate-200 rounded-2xl">
                                                        <p className="text-sm text-slate-400 font-medium">No stakeholders identified.</p>
                                                    </div>
                                                ) : (
                                                    <ScrollArea className="h-[200px] pr-4">
                                                        <div className="space-y-3">
                                                            {stakeholders.map(s => (
                                                                <div key={s.id} className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-100 shadow-sm group">
                                                                    <div>
                                                                        <p className="font-bold text-slate-900 text-sm">{s.name}</p>
                                                                        <p className="text-xs text-slate-500 uppercase tracking-wide font-bold">{s.title}</p>
                                                                    </div>
                                                                    <Button size="icon" variant="ghost" className="h-6 w-6 text-slate-300 hover:text-rose-500" onClick={() => handleDeleteStakeholder(s.id)}>
                                                                        <X className="w-4 h-4" />
                                                                    </Button>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </ScrollArea>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between p-6 bg-indigo-50 rounded-[2rem] border border-indigo-100">
                                            <div className="flex items-center gap-4">
                                                <div className="bg-indigo-100 p-3 rounded-xl text-indigo-600">
                                                    <Scale className="w-6 h-6" />
                                                </div>

                                                <div>
                                                    <h4 className="font-bold text-indigo-900">Governance & Strategy Documents</h4>
                                                    <div className="flex flex-col gap-1 mt-1">
                                                        {linkedPolicyId && policies.find((p: any) => p.id === linkedPolicyId) && (
                                                            <p className="text-xs text-indigo-600 font-medium flex items-center gap-1">
                                                                <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                                                                Linked: <span className="font-semibold underline">{policies.find((p: any) => p.id === linkedPolicyId)?.name}</span>
                                                            </p>
                                                        )}
                                                        {uploadedPolicy && (
                                                            <p className="text-xs text-indigo-600 font-medium flex items-center gap-1">
                                                                <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                                                                Uploaded: <span className="font-semibold underline">{uploadedPolicy.name}</span>
                                                            </p>
                                                        )}
                                                        {!linkedPolicyId && !uploadedPolicy && (
                                                            <p className="text-xs text-indigo-600 font-medium">Manage your organization's risk strategy and custom policies.</p>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex gap-3">
                                                <Button
                                                    variant="ghost"
                                                    className="text-indigo-700 hover:text-indigo-900 hover:bg-indigo-100 font-bold"
                                                    onClick={() => linkedPolicyId ? setIsViewPolicyOpen(true) : setIsLinkPolicyOpen(true)}
                                                >
                                                    {linkedPolicyId ? "View Strategy Policy" : "Link Strategy Policy"}
                                                </Button>
                                                <Button
                                                    className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm gap-2 font-bold rounded-xl"
                                                    onClick={() => handleImportClick('policy')}
                                                >
                                                    <Upload className="w-4 h-4" /> Upload Custom Policy
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                </TabsContent>
                            </ScrollArea>
                        </Tabs>
                    </Card>
                </div>
            </div>
            <Dialog open={isAddStakeholderOpen} onOpenChange={setIsAddStakeholderOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Add Stakeholder (S-5)</DialogTitle>
                        <DialogDescription>Identify a key stakeholder for the system.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Select from People Database</Label>
                            <Select
                                value={newStakeholder.employeeId}
                                onValueChange={(val) => setNewStakeholder(prev => ({ ...prev, employeeId: val }))}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a person..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {employees.map((emp: any) => (
                                        <SelectItem key={emp.id} value={emp.id.toString()}>
                                            {emp.firstName} {emp.lastName} {emp.employmentStatus === 'stakeholder' ? '(Ext)' : ''}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <div className="flex justify-end">
                                <Link href={`/clients/${clientId}/people?tab=stakeholders`}>
                                    <Button variant="link" size="sm" className="h-auto p-0 text-indigo-600 text-xs">
                                        + Add new to Registry
                                    </Button>
                                </Link>
                            </div>
                        </div>

                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <span className="w-full border-t border-slate-200" />
                            </div>
                            <div className="relative flex justify-center text-xs uppercase">
                                <span className="bg-white px-2 text-slate-500">Or Manual Entry</span>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Stakeholder Name (Override / Manual)</Label>
                            <Input
                                placeholder="E.g. John Doe..."
                                value={newStakeholder.name}
                                onChange={(e) => setNewStakeholder(prev => ({ ...prev, name: e.target.value }))}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Role / Title in this System</Label>
                            <Input
                                placeholder="E.g. Legal Counsel..."
                                value={newStakeholder.title}
                                onChange={(e) => setNewStakeholder(prev => ({ ...prev, title: e.target.value }))}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsAddStakeholderOpen(false)}>Cancel</Button>
                        <Button onClick={handleAddStakeholder}>Add Stakeholder</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={isAddRoleOpen} onOpenChange={setIsAddRoleOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Add RMF Role</DialogTitle>
                        <DialogDescription>
                            Add a new role to your RMF team composition.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="space-y-2">
                            <Label>Role Title</Label>
                            <div className="flex flex-col gap-2">
                                <Input
                                    placeholder="Enter role title..."
                                    value={newRoleData.roleTitle}
                                    onChange={(e) => setNewRoleData(prev => ({ ...prev, roleTitle: e.target.value }))}
                                />
                                {orgRoles.length > 0 && (
                                    <Select
                                        onValueChange={(val) => setNewRoleData(prev => ({ ...prev, roleTitle: val }))}
                                    >
                                        <SelectTrigger className="h-8 text-xs bg-slate-50">
                                            <SelectValue placeholder="Or select from standard roles..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Privacy Officer">Privacy Officer</SelectItem>
                                            <SelectItem value="System Administrator">System Administrator</SelectItem>
                                            <SelectItem value="Data Steward">Data Steward</SelectItem>
                                            {orgRoles.map((role: any) => (
                                                <SelectItem key={role.id} value={role.title}>{role.title}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                )}
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>Assignee (Optional)</Label>
                            <Select
                                value={newRoleData.employeeId}
                                onValueChange={(val) => setNewRoleData(prev => ({ ...prev, employeeId: val }))}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select employee..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {employees.map((emp: any) => (
                                        <SelectItem key={emp.id} value={emp.id.toString()}>
                                            {emp.firstName} {emp.lastName}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsAddRoleOpen(false)}>Cancel</Button>
                        <Button onClick={handleAddRole}>Add Role</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
            <Dialog open={isMatrixConfigOpen} onOpenChange={setIsMatrixConfigOpen}>
                <DialogContent className="max-w-xl">
                    <DialogHeader>
                        <DialogTitle>Configure Risk Matrix</DialogTitle>
                        <DialogDescription>
                            Adjust the risk levels for each likelihood/impact combination according to your organization's methodology.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-6 py-4">
                        <div className="bg-blue-50 p-4 rounded-lg text-sm text-blue-800 flex items-start gap-3">
                            <Info className="w-5 h-5 shrink-0 mt-0.5" />
                            <div>
                                <p className="font-semibold">Interactive Configuration</p>
                                <p>Click on any cell below to cycle its risk level (Low → Mod → High → Critical).</p>
                            </div>
                        </div>

                        <div className="flex flex-col items-center gap-4">
                            <div className="flex gap-2">
                                <Button
                                    variant={riskMatrix.length === 3 ? "default" : "outline"}
                                    size="sm"
                                    onClick={() => setRiskMatrix(defaultMatrix)}
                                >
                                    3x3 Matrix
                                </Button>
                                <Button
                                    variant={riskMatrix.length === 4 ? "default" : "outline"}
                                    size="sm"
                                    onClick={() => setRiskMatrix(defaultMatrix4)}
                                >
                                    4x4 Matrix
                                </Button>
                            </div>

                            <div className="relative pl-8 pb-8">
                                {/* Y-Axis Label */}
                                <div className="absolute -left-4 top-1/2 -translate-y-1/2 -rotate-90 text-xs font-black text-slate-400 uppercase tracking-widest text-center w-32 origin-center transform">
                                    Likelihood
                                </div>

                                <div className="grid gap-2 mb-2" style={{ display: 'grid', gridTemplateRows: `repeat(${riskMatrix.length}, minmax(0, 1fr))` }}>
                                    {[...Array(riskMatrix.length)].map((_, i) => i).reverse().map((rowIndex) => (
                                        <div key={`edit-row-${rowIndex}`} className="grid gap-2" style={{ display: 'grid', gridTemplateColumns: `repeat(${riskMatrix.length}, minmax(0, 1fr))` }}>
                                            {riskMatrix[rowIndex]?.map((val, colIndex) => (
                                                <div
                                                    key={`edit-${rowIndex}-${colIndex}`}
                                                    onClick={() => handleMatrixCellClick(rowIndex, colIndex)}
                                                    className={`w-16 h-16 rounded-md flex items-center justify-center font-bold text-sm cursor-pointer hover:opacity-80 transition-all shadow-sm active:scale-95 select-none ring-2 ring-transparent hover:ring-indigo-200 ${getRiskStyle(val)}`}
                                                >
                                                    {getRiskLabel(val)}
                                                </div>
                                            ))}
                                        </div>
                                    ))}
                                </div>

                                {/* X-Axis Label */}
                                <div className="absolute bottom-0 left-8 right-0 text-center text-xs font-black text-slate-400 uppercase tracking-widest">
                                    Impact
                                </div>
                                <div className="grid text-center text-[10px] font-bold text-slate-500 mt-2 ml-2" style={{ gridTemplateColumns: `repeat(${riskMatrix.length}, minmax(0, 1fr))` }}>
                                    {riskMatrix.length === 3 ? (
                                        <>
                                            <div>LOW</div>
                                            <div>MODERATE</div>
                                            <div>HIGH</div>
                                        </>
                                    ) : (
                                        <>
                                            <div>LOW</div>
                                            <div>MODERATE</div>
                                            <div>HIGH</div>
                                            <div>CRITICAL</div>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsMatrixConfigOpen(false)}>Cancel</Button>
                        <Button onClick={saveMatrixToBackend}>Save Configuration</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={isLinkPolicyOpen} onOpenChange={setIsLinkPolicyOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Link Strategy Policy</DialogTitle>
                        <DialogDescription>
                            Select an existing policy to serve as the Risk Management Strategy for this system.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        <Label className="mb-2 block">Select Policy</Label>
                        <Select onValueChange={(val) => saveLinkedPolicy(parseInt(val))}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select a policy..." />
                            </SelectTrigger>
                            <SelectContent>
                                {policies.map((p: any) => (
                                    <SelectItem key={p.id} value={p.id.toString()}>
                                        {p.name} ({p.status})
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <div className="mt-4 flex justify-end">
                            <Link href={`/clients/${clientId}/policies`}>
                                <Button variant="link" className="text-indigo-600 text-xs p-0 h-auto">
                                    + Create New Policy
                                </Button>
                            </Link>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            <Dialog open={isViewPolicyOpen} onOpenChange={setIsViewPolicyOpen}>
                <DialogContent className="max-w-4xl h-[80vh] flex flex-col">
                    <DialogHeader>
                        <DialogTitle>Risk Management Strategy</DialogTitle>
                        <DialogDescription>
                            Current active policy for risk strategy.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex-1 overflow-hidden bg-slate-50 rounded-md border border-slate-200 p-4">
                        <ScrollArea className="h-full">
                            {linkedPolicyData ? (
                                <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: linkedPolicyData.clientPolicy?.content || "<p>No content available.</p>" }} />
                            ) : (
                                <div className="flex items-center justify-center h-full text-slate-400">Loading policy content...</div>
                            )}
                        </ScrollArea>
                    </div>
                    <DialogFooter className="flex justify-between sm:justify-between w-full">
                        <Button variant="ghost" className="text-rose-500 hover:text-rose-700 hover:bg-rose-50" onClick={() => {
                            setLinkedPolicyId(null);
                            setIsViewPolicyOpen(false);
                            // Ideally update backend too to unlink
                        }}>
                            Unlink Policy
                        </Button>
                        <Button onClick={() => setIsViewPolicyOpen(false)}>Close</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
                accept=".pdf,.docx,.doc,.xlsx,.xls,.png,.jpg,.jpeg"
            />
        </NIST80037Layout >
    );
}


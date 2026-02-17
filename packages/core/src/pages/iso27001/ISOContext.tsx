
import React, { useState } from "react";
import { useParams } from "wouter";
import { trpc } from "@/lib/trpc";
import { ISOLayout } from "./ISOLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@complianceos/ui/ui/card";
import { Button } from "@complianceos/ui/ui/button";
import { Input } from "@complianceos/ui/ui/input";
import { Textarea } from "@complianceos/ui/ui/textarea";
import { Badge } from "@complianceos/ui/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@complianceos/ui/ui/tabs";
import { Label } from "@complianceos/ui/ui/label";
import { toast } from "sonner";
import {
    Users,
    Globe,
    Building,
    FileText,
    Scale,
    Plus,
    Trash2,
    Save,
    MapPin,
    Server,
    Target
} from "lucide-react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@complianceos/ui/ui/table";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@complianceos/ui/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@complianceos/ui/ui/select";

export default function ISOContext() {
    const { id } = useParams<{ id: string }>();
    const clientId = parseInt(id || "0");
    const [activeTab, setActiveTab] = useState("scope");

    // Local state for Scope - in real app this would submit trpc mutations
    const [scope, setScope] = useState({
        orgUnit: "",
        locations: "",
        technology: "",
        exclusions: ""
    });

    // Local state for Interested Parties
    const [parties, setParties] = useState<any[]>([
        { id: 1, name: "Customers", type: "External", requirements: "SOC 2 Type II Report, Data Privacy", priority: "High" },
        { id: 2, name: "Regulators (GDPR)", type: "External", requirements: "Article 30 Records, DPA", priority: "Critical" },
        { id: 3, name: "Employees", type: "Internal", requirements: "Clear Policies, Security Training", priority: "Medium" },
    ]);

    const [newParty, setNewParty] = useState({ name: "", type: "External", requirements: "", priority: "Medium" });
    const [partyDialogOpen, setPartyDialogOpen] = useState(false);

    // Local state for Issues (Clause 4.1)
    const [issues, setIssues] = useState<any[]>([
        { id: 1, description: "Reliance on legacy on-premise hardware", context: "Internal", category: "Technology", impact: "Negative", priority: "High" },
        { id: 2, description: "Evolving data privacy regulations (AI Act)", context: "External", category: "Legal", impact: "Negative", priority: "High" },
        { id: 3, description: "Strong security culture in engineering team", context: "Internal", category: "Culture", impact: "Positive", priority: "Medium" },
    ]);
    const [newIssue, setNewIssue] = useState({ description: "", context: "External", category: "Legal", impact: "Negative", priority: "Medium" });
    const [issueDialogOpen, setIssueDialogOpen] = useState(false);

    const handleAddParty = () => {
        if (!newParty.name) return;
        setParties([...parties, { id: Date.now(), ...newParty }]);
        setNewParty({ name: "", type: "External", requirements: "", priority: "Medium" });
        setPartyDialogOpen(false);
        toast.success("Interested party added");
    };

    const handleDeleteParty = (id: number) => {
        setParties(parties.filter(p => p.id !== id));
        toast.success("Party removed");
    };

    const handleAddIssue = () => {
        if (!newIssue.description) return;
        setIssues([...issues, { id: Date.now(), ...newIssue }]);
        setNewIssue({ description: "", context: "External", category: "Legal", impact: "Negative", priority: "Medium" });
        setIssueDialogOpen(false);
        toast.success("Issue added to registry");
    };

    const handleDeleteIssue = (id: number) => {
        setIssues(issues.filter(i => i.id !== id));
        toast.success("Issue removed");
    };

    const handleSaveScope = () => {
        toast.success("ISMS Scope updated successfully");
        // Here we would call a mutation
    };

    return (
        <ISOLayout clientId={clientId}>
            <div className="p-8 space-y-8 animate-in fade-in duration-500">

                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="space-y-2">
                        <h1 className="text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-3">
                            <Target className="h-8 w-8 text-indigo-600" />
                            Context of the Organization
                        </h1>
                        <p className="text-lg text-slate-500 max-w-3xl">
                            Define the internal and external issues, interested parties, and the scope of your Information Security Management System (ISMS) as per ISO 27001 Clauses 4.1, 4.2, and 4.3.
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant="outline" className="border-slate-200">
                            <FileText className="mr-2 h-4 w-4" /> Generate Context Report
                        </Button>
                    </div>
                </div>

                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full space-y-6">
                    <TabsList className="bg-white border p-1 h-12 w-full md:w-auto justify-start">
                        <TabsTrigger value="scope" className="data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-700 h-10 px-6">
                            <Globe className="mr-2 h-4 w-4" /> ISMS Scope (4.3)
                        </TabsTrigger>
                        <TabsTrigger value="parties" className="data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-700 h-10 px-6">
                            <Users className="mr-2 h-4 w-4" /> Interested Parties (4.2)
                        </TabsTrigger>
                        <TabsTrigger value="issues" className="data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-700 h-10 px-6">
                            <Scale className="mr-2 h-4 w-4" /> Internal/External Issues (4.1)
                        </TabsTrigger>
                    </TabsList>

                    {/* Scope Tab */}
                    <TabsContent value="scope" className="space-y-6">
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* Main Scope Definition */}
                            <Card className="lg:col-span-2 border-slate-200 shadow-sm">
                                <CardHeader className="bg-slate-50 border-b border-slate-100">
                                    <CardTitle>Scope Statement</CardTitle>
                                    <CardDescription>
                                        Define the boundaries of your ISMS. This statement will appear on your certificate.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="p-6 space-y-6">
                                    <div className="space-y-3">
                                        <Label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                                            <Building className="h-4 w-4 text-slate-400" /> Organizational Unit
                                        </Label>
                                        <Input
                                            placeholder="e.g. The entirety of Acme Corp, including Engineering, Sales, and HR..."
                                            value={scope.orgUnit}
                                            onChange={(e) => setScope({ ...scope, orgUnit: e.target.value })}
                                            className="border-slate-200"
                                        />
                                        <p className="text-xs text-slate-500">The legal entity or department covered by the ISMS.</p>
                                    </div>

                                    <div className="space-y-3">
                                        <Label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                                            <MapPin className="h-4 w-4 text-slate-400" /> Physical Locations
                                        </Label>
                                        <Textarea
                                            placeholder="e.g. HQ at 123 Tech Blvd, San Francisco, CA. Remote employees in USA and EU."
                                            value={scope.locations}
                                            onChange={(e) => setScope({ ...scope, locations: e.target.value })}
                                            className="min-h-[80px] border-slate-200"
                                        />
                                    </div>

                                    <div className="space-y-3">
                                        <Label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                                            <Server className="h-4 w-4 text-slate-400" /> Technology & Interfaces
                                        </Label>
                                        <Textarea
                                            placeholder="e.g. The SaaS platform hosted on AWS, corporate laptops, and Office 365 environment."
                                            value={scope.technology}
                                            onChange={(e) => setScope({ ...scope, technology: e.target.value })}
                                            className="min-h-[80px] border-slate-200"
                                        />
                                    </div>

                                    <div className="space-y-3">
                                        <Label className="text-sm font-bold text-slate-700 text-rose-600 flex items-center gap-2">
                                            <Target className="h-4 w-4 text-rose-500" /> Exclusions
                                        </Label>
                                        <Textarea
                                            placeholder="Describe any legitimate exclusions (must be justified in SoA)..."
                                            value={scope.exclusions}
                                            onChange={(e) => setScope({ ...scope, exclusions: e.target.value })}
                                            className="min-h-[80px] border-slate-200 bg-rose-50/30"
                                        />
                                    </div>

                                    <div className="pt-4 flex justify-end">
                                        <Button onClick={handleSaveScope} className="bg-indigo-600 hover:bg-indigo-700">
                                            <Save className="mr-2 h-4 w-4" /> Save Scope
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Guidance Side Panel */}
                            <Card className="bg-slate-50 border-slate-200 h-fit">
                                <CardHeader>
                                    <CardTitle className="text-sm font-bold text-slate-700">ISO 27001 Guidance (Clause 4.3)</CardTitle>
                                </CardHeader>
                                <CardContent className="text-sm text-slate-600 space-y-4">
                                    <p>
                                        The organization must determine the boundaries and applicability of the information security management system to establish its scope.
                                    </p>
                                    <ul className="list-disc pl-4 space-y-2">
                                        <li>Consider external & internal issues (4.1)</li>
                                        <li>Consider interested parties (4.2)</li>
                                        <li>Consider interfaces and dependencies</li>
                                    </ul>
                                    <div className="p-3 bg-white rounded border border-indigo-100 text-indigo-700 text-xs">
                                        <strong>Tip:</strong> Keep the scope as simple as possible. Complexity increases audit time and cost.
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>

                    {/* Interested Parties Tab */}
                    <TabsContent value="parties" className="space-y-6">
                        <Card className="border-slate-200 shadow-sm">
                            <CardHeader className="bg-slate-50 border-b border-slate-100 flex flex-row items-center justify-between">
                                <div>
                                    <CardTitle>Interested Parties Registry</CardTitle>
                                    <CardDescription>
                                        List stakeholders that are relevant to the ISMS and their requirements.
                                    </CardDescription>
                                </div>
                                <Dialog open={partyDialogOpen} onOpenChange={setPartyDialogOpen}>
                                    <DialogTrigger asChild>
                                        <Button className="bg-indigo-600 hover:bg-indigo-700">
                                            <Plus className="mr-2 h-4 w-4" /> Add Party
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent>
                                        <DialogHeader>
                                            <DialogTitle>Add Interested Party</DialogTitle>
                                            <DialogDescription>Identify a stakeholder and their security requirements.</DialogDescription>
                                        </DialogHeader>
                                        <div className="grid gap-4 py-4">
                                            <div className="grid gap-2">
                                                <Label>Name</Label>
                                                <Input
                                                    placeholder="e.g. Enterprise Customers"
                                                    value={newParty.name}
                                                    onChange={(e) => setNewParty({ ...newParty, name: e.target.value })}
                                                />
                                            </div>
                                            <div className="grid gap-2">
                                                <Label>Type</Label>
                                                <Select
                                                    value={newParty.type}
                                                    onValueChange={(val) => setNewParty({ ...newParty, type: val })}
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="Internal">Internal</SelectItem>
                                                        <SelectItem value="External">External</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="grid gap-2">
                                                <Label>Requirements</Label>
                                                <Textarea
                                                    placeholder="e.g. Confidentiality, SLA availability..."
                                                    value={newParty.requirements}
                                                    onChange={(e) => setNewParty({ ...newParty, requirements: e.target.value })}
                                                />
                                            </div>
                                            <div className="grid gap-2">
                                                <Label>Priority/Influence</Label>
                                                <Select
                                                    value={newParty.priority}
                                                    onValueChange={(val) => setNewParty({ ...newParty, priority: val })}
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="Critical">Critical</SelectItem>
                                                        <SelectItem value="High">High</SelectItem>
                                                        <SelectItem value="Medium">Medium</SelectItem>
                                                        <SelectItem value="Low">Low</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>
                                        <DialogFooter>
                                            <Button onClick={handleAddParty}>Add to Register</Button>
                                        </DialogFooter>
                                    </DialogContent>
                                </Dialog>
                            </CardHeader>
                            <CardContent className="p-0">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="bg-slate-50/50">
                                            <TableHead>Interested Party</TableHead>
                                            <TableHead>Type</TableHead>
                                            <TableHead>Requirements</TableHead>
                                            <TableHead>Priority</TableHead>
                                            <TableHead className="w-[100px]">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {parties.map((party) => (
                                            <TableRow key={party.id} className="group hover:bg-slate-50">
                                                <TableCell className="font-medium text-slate-900">{party.name}</TableCell>
                                                <TableCell>
                                                    <Badge variant="outline" className={
                                                        party.type === 'Internal' ? "text-indigo-600 bg-indigo-50 border-indigo-200" : "text-emerald-600 bg-emerald-50 border-emerald-200"
                                                    }>
                                                        {party.type}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-slate-600 max-w-md">{party.requirements}</TableCell>
                                                <TableCell>
                                                    <span className={
                                                        party.priority === 'Critical' ? "text-rose-600 font-bold text-xs uppercase" :
                                                            party.priority === 'High' ? "text-amber-600 font-bold text-xs uppercase" :
                                                                "text-slate-500 font-bold text-xs uppercase"
                                                    }>
                                                        {party.priority}
                                                    </span>
                                                </TableCell>
                                                <TableCell>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="text-slate-400 hover:text-rose-600"
                                                        onClick={() => handleDeleteParty(party.id)}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Issues Tab */}
                    <TabsContent value="issues" className="space-y-6">
                        <Card className="border-slate-200 shadow-sm">
                            <CardHeader className="bg-slate-50 border-b border-slate-100 flex flex-row items-center justify-between">
                                <div>
                                    <CardTitle>Internal & External Issues Registry (4.1)</CardTitle>
                                    <CardDescription>
                                        Identify external and internal issues that are relevant to the ISMS (e.g., PESTLE, SWOT factors).
                                    </CardDescription>
                                </div>
                                <Dialog open={issueDialogOpen} onOpenChange={setIssueDialogOpen}>
                                    <DialogTrigger asChild>
                                        <Button className="bg-indigo-600 hover:bg-indigo-700">
                                            <Plus className="mr-2 h-4 w-4" /> Add Issue
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent>
                                        <DialogHeader>
                                            <DialogTitle>Add Contextual Issue</DialogTitle>
                                            <DialogDescription>Describe a factor that affects your ability to achieve ISMS outcomes.</DialogDescription>
                                        </DialogHeader>
                                        <div className="grid gap-4 py-4">
                                            <div className="grid gap-2">
                                                <Label>Description</Label>
                                                <Input
                                                    placeholder="e.g. New competitor entering the market..."
                                                    value={newIssue.description}
                                                    onChange={(e) => setNewIssue({ ...newIssue, description: e.target.value })}
                                                />
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="grid gap-2">
                                                    <Label>Context</Label>
                                                    <Select
                                                        value={newIssue.context}
                                                        onValueChange={(val) => setNewIssue({ ...newIssue, context: val })}
                                                    >
                                                        <SelectTrigger>
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="Internal">Internal</SelectItem>
                                                            <SelectItem value="External">External</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                                <div className="grid gap-2">
                                                    <Label>Impact Type</Label>
                                                    <Select
                                                        value={newIssue.impact}
                                                        onValueChange={(val) => setNewIssue({ ...newIssue, impact: val as any })}
                                                    >
                                                        <SelectTrigger>
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="Negative">Negative (Risk)</SelectItem>
                                                            <SelectItem value="Positive">Positive (Opportunity)</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                            </div>
                                            <div className="grid gap-2">
                                                <Label>Category</Label>
                                                <Select
                                                    value={newIssue.category}
                                                    onValueChange={(val) => setNewIssue({ ...newIssue, category: val })}
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="Legal">Legal / Regulatory</SelectItem>
                                                        <SelectItem value="Technology">Technology</SelectItem>
                                                        <SelectItem value="Market">Market / Competitive</SelectItem>
                                                        <SelectItem value="Culture">Organizational Culture</SelectItem>
                                                        <SelectItem value="Resource">Resource Availability</SelectItem>
                                                        <SelectItem value="Other">Other</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="grid gap-2">
                                                <Label>Priority</Label>
                                                <Select
                                                    value={newIssue.priority}
                                                    onValueChange={(val) => setNewIssue({ ...newIssue, priority: val as any })}
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="High">High</SelectItem>
                                                        <SelectItem value="Medium">Medium</SelectItem>
                                                        <SelectItem value="Low">Low</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>
                                        <DialogFooter>
                                            <Button onClick={handleAddIssue}>Add to Register</Button>
                                        </DialogFooter>
                                    </DialogContent>
                                </Dialog>
                            </CardHeader>
                            <CardContent className="p-0">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="bg-slate-50/50">
                                            <TableHead>Issue Description</TableHead>
                                            <TableHead>Context</TableHead>
                                            <TableHead>Category</TableHead>
                                            <TableHead>Impact</TableHead>
                                            <TableHead>Priority</TableHead>
                                            <TableHead className="w-[100px]">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {issues.map((issue) => (
                                            <TableRow key={issue.id} className="group hover:bg-slate-50">
                                                <TableCell className="font-medium text-slate-900">{issue.description}</TableCell>
                                                <TableCell>
                                                    <Badge variant="outline" className={
                                                        issue.context === 'Internal' ? "text-indigo-600 bg-indigo-50 border-indigo-200" : "text-sky-600 bg-sky-50 border-sky-200"
                                                    }>
                                                        {issue.context}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-slate-600">{issue.category}</TableCell>
                                                <TableCell>
                                                    <Badge variant="outline" className={
                                                        issue.impact === 'Negative' ? "text-rose-600 bg-rose-50 border-rose-200" : "text-emerald-600 bg-emerald-50 border-emerald-200"
                                                    }>
                                                        {issue.impact}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <span className={
                                                        issue.priority === 'High' ? "text-slate-900 font-bold text-xs uppercase" :
                                                            "text-slate-500 font-bold text-xs uppercase"
                                                    }>
                                                        {issue.priority}
                                                    </span>
                                                </TableCell>
                                                <TableCell>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="text-slate-400 hover:text-rose-600"
                                                        onClick={() => handleDeleteIssue(issue.id)}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </ISOLayout>
    );
}

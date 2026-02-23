import React, { useState } from "react";
import NIST80037Layout from "./NIST80037Layout";
import { useClientContext } from "@/contexts/ClientContext";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@complianceos/ui/ui/card";
import { Button } from "@complianceos/ui/ui/button";
import { Input } from "@complianceos/ui/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@complianceos/ui/ui/table";
import { Badge } from "@complianceos/ui/ui/badge";
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
import { Label } from "@complianceos/ui/ui/label";
import { Textarea } from "@complianceos/ui/ui/textarea";
import { Server, Plus, Search, ShieldCheck, MoreHorizontal, LayoutGrid } from "lucide-react";
import { toast } from "sonner";
import { useLocation } from "wouter";
import { Breadcrumb } from "@/components/Breadcrumb";

// Real data is now fetched from the backend via trpc.federal.listFismaSystems
// Fallback to MOCK_SYSTEMS if no data is available (for development)

export default function NISTSystemRegistry() {
    const { selectedClientId } = useClientContext();
    const [searchTerm, setSearchTerm] = useState("");
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [location, setLocation] = useLocation();

    // Fetch real systems from backend
    const { data: systems, isLoading, refetch } = trpc.federal.listFismaSystems.useQuery(
        { clientId: selectedClientId || 0 },
        { enabled: !!selectedClientId }
    );

    // Mutation for creating a new system
    const createSystemMutation = trpc.federal.createFismaSystem.useMutation({
        onSuccess: () => {
            toast.success("System registered successfully");
            refetch();
            setIsCreateOpen(false);
        },
        onError: (err) => {
            toast.error(`Failed to create system: ${err.message}`);
        }
    });

    // Form State
    const [newSystem, setNewSystem] = useState({
        name: "",
        acronym: "",
        description: "",
        fips199Overall: "Low",
        owner: ""
    });

    const handleCreate = () => {
        if (!newSystem.name) {
            toast.error("Please provide system name");
            return;
        }

        // Use mutation to create system in backend
        createSystemMutation.mutate({
            clientId: selectedClientId || 0,
            name: newSystem.name,
            acronym: newSystem.acronym || null,
            owner: newSystem.owner || null,
            description: newSystem.description || null,
            fips199Overall: newSystem.fips199Overall
        });
    };

    // Filter systems - handle both array and undefined cases
    const filteredSystems = systems?.filter(s =>
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (s.acronym && s.acronym.toLowerCase().includes(searchTerm.toLowerCase()))
    ) || [];

    return (
        <NIST80037Layout>
            <div className="space-y-6 max-w-5xl">
                <div className="flex flex-col gap-2">
                    <Breadcrumb
                        items={[
                            { label: "NIST Hub", href: `/clients/${selectedClientId}/nist` },
                            { label: "System Registry" },
                        ]}
                    />
                    <div className="flex justify-between items-center">
                        <div>
                            <h1 className="text-3xl font-black tracking-tight text-slate-900 flex items-center gap-3">
                                <LayoutGrid className="w-8 h-8 text-emerald-600" />
                                System Registry
                            </h1>
                            <p className="text-slate-500 mt-1 font-medium">
                                Define and manage your organization's information systems for RMF authorization.
                            </p>
                        </div>
                        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                            <DialogTrigger asChild>
                                <Button className="bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-200/50 font-bold">
                                    <Plus className="w-4 h-4 mr-2" />
                                    Register New System
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[600px]">
                                <DialogHeader>
                                    <DialogTitle>Register New Information System</DialogTitle>
                                    <DialogDescription>
                                        Create a new system boundary for RMF assessment. This will be the container for your controls and assets.
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="grid gap-6 py-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="name">System Name</Label>
                                            <Input
                                                id="name"
                                                placeholder="e.g. Enterprise Cloud Ops"
                                                value={newSystem.name}
                                                onChange={(e) => setNewSystem({ ...newSystem, name: e.target.value })}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="acronym">Acronym</Label>
                                            <Input
                                                id="acronym"
                                                placeholder="e.g. ECO"
                                                value={newSystem.acronym}
                                                onChange={(e) => setNewSystem({ ...newSystem, acronym: e.target.value })}
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="desc">System Description</Label>
                                        <Textarea
                                            id="desc"
                                            placeholder="Describe the system's purpose and scope..."
                                            value={newSystem.description}
                                            onChange={(e) => setNewSystem({ ...newSystem, description: e.target.value })}
                                            className="min-h-[100px]"
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="fips">Estimated FIPS 199 Impact</Label>
                                            <Select
                                                value={newSystem.fips199Overall}
                                                onValueChange={(val) => setNewSystem({ ...newSystem, fips199Overall: val })}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select Impact Level" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="Low">Low Impact</SelectItem>
                                                    <SelectItem value="Moderate">Moderate Impact</SelectItem>
                                                    <SelectItem value="High">High Impact</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="owner">System Owner</Label>
                                            <Input
                                                id="owner"
                                                placeholder="Name of responsible individual"
                                                value={newSystem.owner}
                                                onChange={(e) => setNewSystem({ ...newSystem, owner: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
                                    <Button onClick={handleCreate} className="bg-emerald-600 hover:bg-emerald-700">Create System</Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </div>
                </div>

                <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                    <div className="relative w-96">
                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                        <Input
                            placeholder="Search systems by name or acronym..."
                            className="pl-9 bg-slate-50 border-slate-200 focus-visible:ring-emerald-500"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="flex gap-2">
                        <Select defaultValue="all">
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="Filter by Status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Statuses</SelectItem>
                                <SelectItem value="active">Active Authorization</SelectItem>
                                <SelectItem value="pending">Pending Assessment</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <div className="grid gap-6">
                    {filteredSystems.map((system) => (
                        <Card key={system.id} className="hover:shadow-md transition-shadow cursor-pointer border-slate-200 group relative overflow-hidden"
                            onClick={() => setLocation(`/clients/${selectedClientId}/nist/rmf/prepare?systemId=${system.id}`)}>
                            <div className={`absolute left-0 top-0 bottom-0 w-1 ${system.fips199Overall === 'High' ? 'bg-rose-500' :
                                system.fips199Overall === 'Moderate' ? 'bg-amber-500' : 'bg-blue-500'
                                }`} />
                            <CardContent className="p-6">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-start gap-4">
                                        <div className="w-12 h-12 rounded-lg bg-slate-100 flex items-center justify-center shrink-0 border border-slate-200">
                                            <Server className="w-6 h-6 text-slate-500" />
                                        </div>
                                        <div className="space-y-1">
                                            <h3 className="font-bold text-xl text-slate-900 group-hover:text-emerald-700 transition-colors flex items-center gap-2">
                                                {system.name}
                                                <Badge variant="secondary" className="font-mono text-xs">{system.acronym || 'SYS'}</Badge>
                                            </h3>
                                            <p className="text-slate-500 text-sm max-w-2xl leading-relaxed">
                                                {system.description || 'No description provided.'}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-end gap-2">
                                        <Badge variant="outline" className={`font-bold ${system.status === 'Authorization' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                            'bg-slate-50 text-slate-700 border-slate-200'
                                            }`}>
                                            {system.status || 'Prepare'} Phase
                                        </Badge>
                                        <span className="text-xs text-slate-400 font-medium">Updated just now</span>
                                    </div>
                                </div>

                                <div className="mt-6 pt-6 border-t border-slate-100 flex items-center justify-between text-sm">
                                    <div className="flex items-center gap-6">
                                        <div className="flex flex-col">
                                            <span className="text-slate-400 text-xs uppercase font-bold tracking-wider">FIPS Impact</span>
                                            <span className={`font-bold ${system.fips199Overall === 'High' ? 'text-rose-600' :
                                                system.fips199Overall === 'Moderate' ? 'text-amber-600' : 'text-blue-600'
                                                }`}>{system.fips199Overall || 'Low'}</span>
                                        </div>
                                        <div className="w-px h-8 bg-slate-200" />
                                        <div className="flex flex-col">
                                            <span className="text-slate-400 text-xs uppercase font-bold tracking-wider">Controls</span>
                                            <span className="font-bold text-slate-700">{system.controlsCount || 0} Active</span>
                                        </div>
                                        <div className="w-px h-8 bg-slate-200" />
                                        <div className="flex flex-col">
                                            <span className="text-slate-400 text-xs uppercase font-bold tracking-wider">Assets</span>
                                            <span className="font-bold text-slate-700">{system.assetsCount || 0} Linked</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="flex -space-x-2">
                                            <div className="w-8 h-8 rounded-full bg-slate-200 border-2 border-white flex items-center justify-center text-[10px] font-bold text-slate-600">
                                                {system.owner ? system.owner.split(' ').map((n: string) => n[0]).join('') : 'U'}
                                            </div>
                                        </div>
                                        <span className="text-slate-500 font-medium">Owner: {system.owner || 'Unassigned'}</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        </NIST80037Layout>
    );
}


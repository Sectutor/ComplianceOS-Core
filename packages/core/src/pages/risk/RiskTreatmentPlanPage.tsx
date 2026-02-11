import React, { useState } from 'react';
import { useParams, Link, useLocation } from 'wouter';
import DashboardLayout from '@/components/DashboardLayout';
import { Button } from '@complianceos/ui/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@complianceos/ui/ui/card';
import { Badge } from '@complianceos/ui/ui/badge';
import { Input } from '@complianceos/ui/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@complianceos/ui/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@complianceos/ui/ui/table';
import { trpc } from '@/lib/trpc';
import {
    ArrowLeft, Search, Filter, Calendar, User, Shield, AlertTriangle, CheckCircle, Ban, ArrowRight, DollarSign
} from 'lucide-react';
import { Breadcrumb } from '@/components/Breadcrumb';
import { PageGuide } from '@/components/PageGuide';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

export default function RiskTreatmentPlanPage() {
    const params = useParams<{ id: string }>();
    const clientId = params.id ? parseInt(params.id) : 0;
    const [_, setLocation] = useLocation();

    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [typeFilter, setTypeFilter] = useState('all');

    const { data: treatments, isLoading } = trpc.risks.getAllTreatments.useQuery(
        { clientId },
        { enabled: !!clientId }
    );

    const filteredTreatments = treatments?.filter(t => {
        const matchSearch = t.strategy?.toLowerCase().includes(search.toLowerCase()) ||
            t.riskTitle?.toLowerCase().includes(search.toLowerCase()) ||
            t.owner?.toLowerCase().includes(search.toLowerCase());
        const matchStatus = statusFilter === 'all' || t.status === statusFilter;
        const matchType = typeFilter === 'all' || t.treatmentType === typeFilter;
        return matchSearch && matchStatus && matchType;
    });

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'mitigate': return <Shield className="w-4 h-4 text-blue-600" />;
            case 'transfer': return <AlertTriangle className="w-4 h-4 text-orange-600" />;
            case 'accept': return <CheckCircle className="w-4 h-4 text-green-600" />;
            case 'avoid': return <Ban className="w-4 h-4 text-red-600" />;
            default: return <Shield className="w-4 h-4 text-slate-600" />;
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) { // 'planned', 'in_progress', 'implemented', 'completed'
            case 'completed':
            case 'implemented':
                return <Badge className="bg-green-100 text-green-800 hover:bg-green-100 border-green-200">Implemented</Badge>;
            case 'in_progress':
                return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100 border-blue-200">In Progress</Badge>;
            case 'planned':
            default:
                return <Badge variant="outline" className="text-slate-600">Planned</Badge>;
        }
    };

    const formatCost = (cost: string | null) => {
        if (!cost) return '-';
        return isNaN(Number(cost)) ? cost : `$${Number(cost).toLocaleString()}`;
    };

    return (
        <DashboardLayout>
            <div className="space-y-6">
                {/* Navigation Header */}
                <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4"> {/* Navigation Block */}
                            <Breadcrumb
                                items={[
                                    { label: 'Risk Management', href: `/clients/${clientId}/risks` },
                                    { label: 'Treatment Plan' }
                                ]}
                            />
                        </div>
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                        <Button variant="ghost" size="sm" className="-ml-3 text-muted-foreground hover:text-foreground" onClick={() => setLocation(`/clients/${clientId}/risks`)}>
                            <ArrowLeft className="w-4 h-4 mr-1" /> Back to Risk Dashboard
                        </Button>
                    </div>
                </div>

                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Risk Treatment Plan</h1>
                        <p className="text-muted-foreground mt-1">
                            Track and manage risk mitigation strategies, action plans, and remediation efforts.
                        </p>
                    </div>
                    <PageGuide
                        title="Risk Treatment Plan"
                        description="Manage the actions required to reduce risk to an acceptable level."
                        rationale="Identifying risk is useless without action. This plan tracks who is doing what by when."
                        howToUse={[
                            { step: "Filter by Status", description: "check 'In Progress' or 'Overdue' items during weekly meetings." },
                            { step: "Review Strategy", description: "Ensure high-priority risks are being 'Mitigated' or 'Avoided' rather than just 'Accepted'." },
                            { step: "Track Costs", description: "Use the cost field to budget for security improvements." }
                        ]}
                        integrations={[
                            { name: "Risk Assessments", description: "Treatments are created directly within the Risk Assessment workflow." },
                            { name: "Tasks", description: "Treatment actions can be synced to the main task manager." }
                        ]}
                    />
                </div>
            </div>

            {/* Filters */}
            <div className="flex items-center gap-4 bg-white p-4 rounded-lg border shadow-sm flex-wrap">
                <div className="relative flex-1 min-w-[200px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search treatments, risks, or owners..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-9"
                    />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[180px]">
                        <Filter className="w-4 h-4 mr-2 text-muted-foreground" />
                        <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Statuses</SelectItem>
                        <SelectItem value="planned">Planned</SelectItem>
                        <SelectItem value="in_progress">In Progress</SelectItem>
                        <SelectItem value="implemented">Implemented</SelectItem>
                    </SelectContent>
                </Select>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                    <SelectTrigger className="w-[180px]">
                        <Shield className="w-4 h-4 mr-2 text-muted-foreground" />
                        <SelectValue placeholder="Type" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Types</SelectItem>
                        <SelectItem value="mitigate">Mitigate</SelectItem>
                        <SelectItem value="transfer">Transfer</SelectItem>
                        <SelectItem value="accept">Accept</SelectItem>
                        <SelectItem value="avoid">Avoid</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Treatments Table */}
            <Card>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-slate-50 hover:bg-slate-50">
                                <TableHead className="w-[30%]">Risk & Strategy</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead>Owner</TableHead>
                                <TableHead>Due Date</TableHead>
                                <TableHead>Cost</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Action</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="h-24 text-center">Loading...</TableCell>
                                </TableRow>
                            ) : filteredTreatments?.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                                        No treatments found matching your criteria.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredTreatments?.map((treatment) => (
                                    <TableRow key={treatment.id} className="group">
                                        <TableCell className="align-top py-4">
                                            <div className="space-y-1">
                                                <div className="font-medium text-slate-900 line-clamp-2">{treatment.strategy}</div>
                                                <Link href={`/clients/${clientId}/risks/assessments/${treatment.riskAssessmentId}`}>
                                                    <div className="text-xs text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1 cursor-pointer w-fit">
                                                        Risk: {treatment.riskTitle} ({treatment.riskId})
                                                    </div>
                                                </Link>
                                            </div>
                                        </TableCell>
                                        <TableCell className="align-top py-4">
                                            <div className="flex items-center gap-2 capitalize text-sm font-medium">
                                                {getTypeIcon(treatment.treatmentType || '')}
                                                {treatment.treatmentType}
                                            </div>
                                        </TableCell>
                                        <TableCell className="align-top py-4">
                                            {treatment.owner ? (
                                                <div className="flex items-center gap-2 text-sm">
                                                    <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-xs font-semibold text-slate-600">
                                                        {treatment.owner.charAt(0).toUpperCase()}
                                                    </div>
                                                    {treatment.owner}
                                                </div>
                                            ) : (
                                                <span className="text-muted-foreground text-sm">-</span>
                                            )}
                                        </TableCell>
                                        <TableCell className="align-top py-4">
                                            {treatment.dueDate ? (
                                                <div className={cn(
                                                    "flex items-center gap-2 text-sm",
                                                    new Date(treatment.dueDate) < new Date() && treatment.status !== 'implemented' ? "text-red-600 font-medium" : "text-slate-600"
                                                )}>
                                                    <Calendar className="w-4 h-4" />
                                                    {format(new Date(treatment.dueDate), 'MMM d, yyyy')}
                                                </div>
                                            ) : (
                                                <span className="text-muted-foreground text-sm">-</span>
                                            )}
                                        </TableCell>
                                        <TableCell className="align-top py-4">
                                            <div className="text-sm font-mono text-slate-600">
                                                {formatCost(treatment.estimatedCost)}
                                            </div>
                                        </TableCell>
                                        <TableCell className="align-top py-4">
                                            {getStatusBadge(treatment.status || 'planned')}
                                        </TableCell>
                                        <TableCell className="align-top py-4 text-right">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => setLocation(`/clients/${clientId}/risks/assessments/${treatment.riskAssessmentId}`)}
                                            >
                                                View Risk <ArrowRight className="w-4 h-4 ml-1" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </DashboardLayout>
    );
}

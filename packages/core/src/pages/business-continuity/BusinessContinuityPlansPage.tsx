import React from 'react';
import { useParams, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@complianceos/ui/ui/button";
import { Plus, FileText, Calendar, User, Search, ArrowLeft } from "lucide-react";
import { Breadcrumb } from "@/components/Breadcrumb";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@complianceos/ui/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@complianceos/ui/ui/table";
import { Badge } from "@complianceos/ui/ui/badge";
import { Input } from "@complianceos/ui/ui/input";

export default function BusinessContinuityPlansPage() {
    const params = useParams();
    const [_, setLocation] = useLocation();
    const clientId = parseInt(params.id || "0");

    const { data: plans, isLoading } = trpc.businessContinuity.plans.list.useQuery({ clientId });

    return (
        <DashboardLayout>
            <div className="space-y-6 w-full max-w-full p-6">
                <div className="mb-2">
                    <Breadcrumb
                        items={[
                            { label: "Clients", href: "/clients" },
                            { label: "Business Continuity", href: `/clients/${clientId}/business-continuity` },
                            { label: "Recovery Plans", href: `/clients/${clientId}/business-continuity/plans` },
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
                        <h1 className="text-3xl font-bold tracking-tight">Recovery Plans</h1>
                        <p className="text-muted-foreground mt-2">
                            Manage and version control your business continuity plans.
                        </p>
                    </div>
                    <Button onClick={() => setLocation(`/clients/${clientId}/business-continuity/plans/new`)} className="bg-blue-600 hover:bg-blue-700 text-white">
                        <Plus className="mr-2 h-4 w-4" /> New Plan
                    </Button>
                </div>

                <div className="flex gap-4 items-center bg-card p-4 rounded-xl border shadow-sm">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <Input placeholder="Search plans..." className="pl-9" />
                    </div>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Plan Repository</CardTitle>
                        <CardDescription>All generated recovery plans and their status.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="rounded-xl border border-slate-200 shadow-lg overflow-hidden bg-white">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-[#1C4D8D] hover:bg-[#1C4D8D] border-none">
                                        <TableHead className="text-white font-semibold py-4">Plan Title</TableHead>
                                        <TableHead className="text-white font-semibold py-4">Version</TableHead>
                                        <TableHead className="text-white font-semibold py-4">Status</TableHead>
                                        <TableHead className="text-white font-semibold py-4">Verified</TableHead>
                                        <TableHead className="text-white font-semibold py-4">Last Updated</TableHead>
                                        <TableHead className="text-white font-semibold py-4">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {isLoading && <TableRow><TableCell colSpan={6} className="text-center py-8 bg-white text-gray-500">Loading...</TableCell></TableRow>}
                                    {plans?.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={6} className="text-center py-12 text-gray-500 bg-white">
                                                No plans found. Create one to get started.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                    {plans?.map(plan => (
                                        <TableRow key={plan.id} className="bg-white border-b border-slate-200 transition-all duration-200 hover:bg-slate-50 hover:shadow-sm group">
                                            <TableCell className="font-medium py-4">
                                                <div className="flex items-center gap-2 text-black">
                                                    <FileText className="w-4 h-4 text-blue-500" />
                                                    {plan.title}
                                                </div>
                                            </TableCell>
                                            <TableCell className="py-4">
                                                <Badge variant="outline" className="bg-white border-gray-300 text-gray-700">{plan.version}</Badge>
                                            </TableCell>
                                            <TableCell className="py-4">
                                                <Badge className={plan.status === 'approved' ? 'bg-green-100 text-green-800 border border-green-200' : 'bg-yellow-100 text-yellow-800 border border-yellow-200'}>
                                                    {plan.status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-gray-600 py-4">
                                                {plan.lastTestedDate ? new Date(plan.lastTestedDate).toLocaleDateString() : '-'}
                                            </TableCell>
                                            <TableCell className="text-gray-500 py-4">
                                                {plan.updatedAt ? new Date(plan.updatedAt).toLocaleDateString() : '-'}
                                            </TableCell>
                                            <TableCell className="py-4">
                                                <Button variant="ghost" size="sm" className="hover:bg-[#1C4D8D]/10 hover:text-[#1C4D8D] transition-colors duration-200" onClick={() => setLocation(`/clients/${clientId}/business-continuity/plans/${plan.id}`)}>
                                                    Edit
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    );
}

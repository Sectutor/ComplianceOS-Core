import React from 'react';
import { useParams, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@complianceos/ui/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@complianceos/ui/ui/tabs";
import { Button } from "@complianceos/ui/ui/button";
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
import DashboardLayout from "@/components/DashboardLayout";
import { Phone, Mail, User, Building, ArrowLeft } from "lucide-react";

export default function CallTreeManager() {
    const params = useParams();
    const clientId = parseInt(params.id || "0");
    const [_location, setLocation] = useLocation();

    const { data: contacts, isLoading } = trpc.businessContinuity.callTree.list.useQuery({ clientId });

    return (
        <DashboardLayout>
            <div className="space-y-6 w-full max-w-full p-6">
                <div className="mb-2">
                    <Breadcrumb
                        items={[
                            { label: "Clients", href: "/clients" },
                            { label: "Business Continuity", href: `/clients/${clientId}/business-continuity` },
                            { label: "Call Tree", href: `/clients/${clientId}/business-continuity/call-tree` },
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
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Call Tree & Directories</h1>
                    <p className="text-muted-foreground mt-2">
                        Emergency contact information for internal staff and external partners.
                    </p>
                </div>

                <Tabs defaultValue="internal" className="w-full">
                    <TabsList>
                        <TabsTrigger value="internal">Internal Call Tree</TabsTrigger>
                        <TabsTrigger value="external">External / Vendor Contacts</TabsTrigger>
                    </TabsList>

                    <TabsContent value="internal">
                        <Card>
                            <CardHeader>
                                <CardTitle>Internal Personnel</CardTitle>
                                <CardDescription>Key staff members with access to the BCMS.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="rounded-xl border border-slate-200 shadow-lg overflow-hidden bg-white">
                                    <Table>
                                        <TableHeader>
                                            <TableRow className="bg-[#1C4D8D] hover:bg-[#1C4D8D] border-none">
                                                <TableHead className="text-white font-semibold py-4">Name</TableHead>
                                                <TableHead className="text-white font-semibold py-4">Role</TableHead>
                                                <TableHead className="text-white font-semibold py-4">Contact</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {isLoading && <TableRow><TableCell colSpan={3} className="bg-white text-gray-500">Loading...</TableCell></TableRow>}
                                            {contacts?.internal.map((user: any) => (
                                                <TableRow key={user.id} className="bg-white border-b border-slate-200 transition-all duration-200 hover:bg-slate-50 hover:shadow-sm">
                                                    <TableCell className="font-medium py-4">
                                                        <div className="flex items-center gap-2 text-black">
                                                            <User className="h-4 w-4 text-slate-500" />
                                                            {user.name || "Unknown"}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="py-4">
                                                        <Badge variant="outline" className="bg-white border-gray-300 text-gray-700">{user.role}</Badge>
                                                    </TableCell>
                                                    <TableCell className="py-4">
                                                        <div className="flex items-center gap-2 text-sm text-gray-600">
                                                            <Mail className="h-3 w-3 text-slate-400" />
                                                            {user.email}
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="external">
                        <Card>
                            <CardHeader>
                                <CardTitle>Vendor & Partner Contacts</CardTitle>
                                <CardDescription>Critical contacts for third-party dependencies.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="rounded-xl border border-slate-200 shadow-lg overflow-hidden bg-white">
                                    <Table>
                                        <TableHeader>
                                            <TableRow className="bg-[#1C4D8D] hover:bg-[#1C4D8D] border-none">
                                                <TableHead className="text-white font-semibold py-4">Contact Name</TableHead>
                                                <TableHead className="text-white font-semibold py-4">Role</TableHead>
                                                <TableHead className="text-white font-semibold py-4">Email</TableHead>
                                                <TableHead className="text-white font-semibold py-4">Phone</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {isLoading && <TableRow><TableCell colSpan={4} className="bg-white text-gray-500">Loading...</TableCell></TableRow>}
                                            {contacts?.external.length === 0 && <TableRow><TableCell colSpan={4} className="text-center py-4 text-gray-500 bg-white">No vendor contacts found.</TableCell></TableRow>}
                                            {contacts?.external.map((contact: any) => (
                                                <TableRow key={contact.id} className="bg-white border-b border-slate-200 transition-all duration-200 hover:bg-slate-50 hover:shadow-sm">
                                                    <TableCell className="font-medium text-black py-4">{contact.name}</TableCell>
                                                    <TableCell className="text-gray-600 py-4">{contact.role || '-'}</TableCell>
                                                    <TableCell className="py-4">
                                                        {contact.email && (
                                                            <div className="flex items-center gap-2 text-gray-600">
                                                                <Mail className="h-3 w-3 text-slate-400" />
                                                                {contact.email}
                                                            </div>
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="py-4">
                                                        {contact.phone && (
                                                            <div className="flex items-center gap-2 text-gray-600">
                                                                <Phone className="h-3 w-3 text-slate-400" />
                                                                {contact.phone}
                                                            </div>
                                                        )}
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

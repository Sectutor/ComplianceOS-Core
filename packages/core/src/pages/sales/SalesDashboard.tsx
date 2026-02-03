import React from 'react';
import { SalesKanban } from '@/components/modules/crm/SalesKanban';
import { CreateDealDialog } from '@/components/modules/crm/CreateDealDialog';
import { Button } from '@complianceos/ui/ui/button';
import { Plus, Users } from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@complianceos/ui/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@complianceos/ui/ui/card';
import { DollarSign, TrendingUp, Briefcase, Activity, List, LayoutGrid } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { Badge } from '@complianceos/ui/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@complianceos/ui/ui/table';
import { format } from 'date-fns';

function SalesMetrics({ deals }: { deals: any[] }) {
    const totalValue = deals.reduce((sum, deal) => sum + (deal.value || 0), 0);
    const activeDeals = deals.length;
    const avgDealSize = activeDeals > 0 ? totalValue / activeDeals : 0;

    // Calculate Win Rate
    const wonDeals = deals.filter(d => d.stageId === 5).length;
    const lostDeals = deals.filter(d => d.stageId === 6).length;
    const closedDeals = wonDeals + lostDeals;
    const winRate = closedDeals > 0 ? Math.round((wonDeals / closedDeals) * 100) : 0;

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Pipeline</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">${totalValue.toLocaleString()}</div>
                    <p className="text-xs text-muted-foreground">+20.1% from last month</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Active Deals</CardTitle>
                    <Briefcase className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{activeDeals}</div>
                    <p className="text-xs text-muted-foreground">+180.1% from last month</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Avg. Deal Size</CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">${Math.round(avgDealSize).toLocaleString()}</div>
                    <p className="text-xs text-muted-foreground">+19% from last month</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Win Rate</CardTitle>
                    <Activity className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{winRate}%</div>
                    <p className="text-xs text-muted-foreground">+201 since last hour</p>
                </CardContent>
            </Card>
        </div>
    );
}

function DealsList({ deals }: { deals: any[] }) {
    if (!deals?.length) return <div className="p-8 text-center text-muted-foreground">No deals found.</div>;

    return (
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Deal Title</TableHead>
                        <TableHead>Value</TableHead>
                        <TableHead>Stage</TableHead>
                        <TableHead>Expected Close</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {deals.map((deal) => (
                        <TableRow key={deal.id}>
                            <TableCell className="font-medium">{deal.title}</TableCell>
                            <TableCell>${deal.value?.toLocaleString()}</TableCell>
                            <TableCell>
                                <Badge variant="outline">{deal.stageId}</Badge>
                            </TableCell>
                            <TableCell>
                                {deal.expectedCloseDate ? format(new Date(deal.expectedCloseDate), 'MMM d, yyyy') : '-'}
                            </TableCell>
                            <TableCell className="text-right">
                                <Button variant="ghost" size="sm">Edit</Button>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
}

export default function SalesDashboard() {
    // @ts-ignore
    const { data: deals, isLoading } = trpc.sales.getDeals.useQuery({});

    return (
        <DashboardLayout>
            <div className="h-full flex flex-col space-y-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
                            Sales Pipeline
                            <Badge className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white border-none px-3 py-1 text-[10px] font-bold tracking-widest shadow-lg shadow-indigo-200 uppercase">
                                Premium
                            </Badge>
                        </h1>
                        <p className="text-muted-foreground mt-1">Manage opportunities and track revenue growth.</p>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={() => window.location.href = '/sales/waitlist'}>
                            <Users className="mr-2 h-4 w-4" />
                            Waitlist
                        </Button>
                        <CreateDealDialog />
                    </div>
                </div>

                <SalesMetrics deals={deals || []} />

                <Tabs defaultValue="kanban" className="flex-1 flex flex-col">
                    <div className="flex items-center justify-between mb-4">
                        <TabsList>
                            <TabsTrigger value="kanban" className="flex items-center gap-2">
                                <LayoutGrid className="w-4 h-4" />
                                Kanban
                            </TabsTrigger>
                            <TabsTrigger value="list" className="flex items-center gap-2">
                                <List className="w-4 h-4" />
                                List View
                            </TabsTrigger>
                        </TabsList>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">

                        </div>
                    </div>

                    <TabsContent value="kanban" className="flex-1 h-full min-h-[500px]">
                        <SalesKanban />
                    </TabsContent>

                    <TabsContent value="list">
                        <Card>
                            <CardContent className="pt-6">
                                <DealsList deals={deals || []} />
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </DashboardLayout>
    );
}

import React from 'react';
import { SalesKanban } from '@/components/modules/crm/SalesKanban';
import { CreateDealDialog } from '@/components/modules/crm/CreateDealDialog';
import { Button } from '@complianceos/ui/ui/button';
import { Plus, Users } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@complianceos/ui/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@complianceos/ui/ui/card';
import { DollarSign, TrendingUp, Briefcase, Activity, List, LayoutGrid } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { Badge } from '@complianceos/ui/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@complianceos/ui/ui/table';
import { format } from 'date-fns';
import { PageGuide } from '@/components/PageGuide';

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
        <div className="h-full flex flex-col space-y-6 w-full animate-in fade-in duration-500">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
                        Sales Pipeline
                        <Badge variant="outline" className="border-[#3ABEF9]/20 text-[#3ABEF9] bg-[#3ABEF9]/5 flex items-center gap-1.5 px-3 py-1 text-[10px] font-bold tracking-widest uppercase">
                            Premium
                        </Badge>
                    </h1>
                    <p className="text-muted-foreground mt-1">Manage opportunities and track revenue growth.</p>
                </div>
                <div className="flex gap-2">
                    <PageGuide
                        title="Sales Pipeline"
                        description="Track and manage compliance consulting deals from prospect to close."
                        rationale="For compliance consultancies and MSPs, a structured sales pipeline is critical for visibility into revenue, project capacity, and client acquisition. This module connects your compliance expertise to business growth."
                        howToUse={[
                            {
                                step: "Create Deal",
                                description: "Add a new deal when you engage a prospective client around a compliance project.",
                                targetId: "sales-create-deal-btn"
                            },
                            {
                                step: "Move Through Pipeline",
                                description: "Drag and drop deal cards through the Kanban stages to track progress from Discovery to Closed Won.",
                                targetId: "sales-kanban-view"
                            },
                            {
                                step: "Monitor Metrics",
                                description: "Track your total pipeline value, win rate, and average deal size at the top of the dashboard.",
                                targetId: "sales-metrics-grid"
                            }
                        ]}
                        scenarios={[
                            {
                                title: "NIS2 Compliance Project",
                                example: "A prospect in the energy sector needs NIS2 Article 21 gap analysis and documentation. Create a deal at 'Qualification' stage and track it through proposal and contracting.",
                                auditTip: "Use custom deal fields to document the specific frameworks included in your engagement. This helps forecast regulatory work and staffing needs."
                            },
                            {
                                title: "Forecasting Quarterly Revenue",
                                example: "At the end of Q3, review all deals in 'Proposal Sent' stage to forecast expected Q4 revenue from new compliance engagements.",
                                auditTip: "Monitor your Win Rate metric. A low win rate on compliance deals may indicate pricing misalignment or competitive gaps vs. other GRC platforms."
                            }
                        ]}
                    />
                    <Button variant="outline" onClick={() => window.location.href = '/sales/waitlist'}>
                        <Users className="mr-2 h-4 w-4" />
                        Waitlist
                    </Button>
                    <div id="sales-create-deal-btn">
                        <CreateDealDialog />
                    </div>
                </div>
            </div>

            <div id="sales-metrics-grid">
                <SalesMetrics deals={deals || []} />
            </div>

            <Tabs defaultValue="kanban" className="flex-1 flex flex-col">
                <div className="flex items-center justify-between mb-4">
                    <TabsList className="bg-[#1C4D8D]/10 p-1.5 h-auto flex flex-wrap justify-start gap-2 w-full border border-[#1C4D8D]/20 rounded-xl">
                        <TabsTrigger
                            value="kanban"
                            className="data-[state=active]:bg-[#3ABEF9] data-[state=active]:text-white bg-[#1C4D8D] text-white hover:bg-[#3ABEF9] transition-all font-bold border-none px-4 py-2.5 rounded-lg flex items-center gap-2"
                        >
                            <LayoutGrid className="w-4 h-4" />
                            Kanban
                        </TabsTrigger>
                        <TabsTrigger
                            value="list"
                            className="data-[state=active]:bg-[#3ABEF9] data-[state=active]:text-white bg-[#1C4D8D] text-white hover:bg-[#3ABEF9] transition-all font-bold border-none px-4 py-2.5 rounded-lg flex items-center gap-2"
                        >
                            <List className="w-4 h-4" />
                            List View
                        </TabsTrigger>
                    </TabsList>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">

                    </div>
                </div>

                <TabsContent id="sales-kanban-view" value="kanban" className="flex-1 h-full min-h-[500px]">
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
    );
}

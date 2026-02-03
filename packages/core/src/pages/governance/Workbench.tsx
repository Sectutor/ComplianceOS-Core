import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { trpc } from '@/lib/trpc';
import { Card } from '@complianceos/ui/ui/card';
import { Button } from '@complianceos/ui/ui/button';
import { Badge } from '@complianceos/ui/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@complianceos/ui/ui/tabs';
import {
    AlertCircle,
    CheckCircle2,
    Clock,
    AlertTriangle,
    FileText,
    Shield,
    TrendingUp,
    Users,
    ArrowRight,
    Filter,
    Calendar
} from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@complianceos/ui/ui/select';

type WorkItemType = 'review' | 'approval' | 'evidence_collection' | 'raci_assignment' | 'risk_treatment' | 'vendor_assessment' | 'bcp_approval' | 'policy_review' | 'control_implementation';
type WorkItemStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled' | 'escalated';
type WorkItemPriority = 'low' | 'medium' | 'high' | 'critical';

const priorityColors = {
    low: 'bg-blue-100 text-blue-800',
    medium: 'bg-yellow-100 text-yellow-800',
    high: 'bg-orange-100 text-orange-800',
    critical: 'bg-red-100 text-red-800',
};

const statusColors = {
    pending: 'bg-gray-100 text-gray-800',
    in_progress: 'bg-blue-100 text-blue-800',
    completed: 'bg-green-100 text-green-800',
    cancelled: 'bg-gray-100 text-gray-600',
    escalated: 'bg-red-100 text-red-800',
};

const typeIcons: Record<WorkItemType, React.ReactNode> = {
    review: <FileText className="h-4 w-4" />,
    approval: <CheckCircle2 className="h-4 w-4" />,
    evidence_collection: <Shield className="h-4 w-4" />,
    raci_assignment: <Users className="h-4 w-4" />,
    risk_treatment: <TrendingUp className="h-4 w-4" />,
    vendor_assessment: <FileText className="h-4 w-4" />,
    bcp_approval: <CheckCircle2 className="h-4 w-4" />,
    policy_review: <FileText className="h-4 w-4" />,
    control_implementation: <Shield className="h-4 w-4" />,
};

export default function GovernanceWorkbench() {
    const { id } = useParams<{ id: string }>();
    const clientId = parseInt(id || '0');

    const [selectedTab, setSelectedTab] = useState<'queue' | 'escalations' | 'timeline'>('queue');
    const [statusFilter, setStatusFilter] = useState<WorkItemStatus | 'all'>('all');
    const [typeFilter, setTypeFilter] = useState<WorkItemType | 'all'>('all');
    const [priorityFilter, setPriorityFilter] = useState<WorkItemPriority | 'all'>('all');
    const [assignedToMeOnly, setAssignedToMeOnly] = useState(false);

    // Fetch queue data
    const { data: queueData, refetch: refetchQueue } = trpc.governance.queue.list.useQuery({
        clientId,
        filters: {
            status: statusFilter !== 'all' ? statusFilter : undefined,
            type: typeFilter !== 'all' ? typeFilter : undefined,
            priority: priorityFilter !== 'all' ? priorityFilter : undefined,
            assignedToMe: assignedToMeOnly,
        },
    });

    // Fetch queue stats
    const { data: stats } = trpc.governance.queue.stats.useQuery({ clientId });

    // Fetch escalations
    const { data: escalations, refetch: refetchEscalations } = trpc.governance.escalations.list.useQuery({ clientId });

    // Fetch activity timeline
    const { data: timelineData } = trpc.governance.events.list.useQuery({
        clientId,
        pagination: { limit: 50, offset: 0 },
    });

    // Mutations
    const respondToEscalation = trpc.governance.escalations.respond.useMutation({
        onSuccess: () => {
            refetchEscalations();
            refetchQueue();
        },
    });

    const formatDate = (date: Date | string | null) => {
        if (!date) return 'No due date';
        const d = new Date(date);
        const now = new Date();
        const diffDays = Math.floor((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

        if (diffDays < 0) return `Overdue by ${Math.abs(diffDays)} days`;
        if (diffDays === 0) return 'Due today';
        if (diffDays === 1) return 'Due tomorrow';
        return `Due in ${diffDays} days`;
    };

    const handleAcknowledgeEscalation = (workItemId: number) => {
        respondToEscalation.mutate({
            clientId,
            workItemId,
            action: 'acknowledge',
        });
    };

    const handleResolveEscalation = (workItemId: number) => {
        respondToEscalation.mutate({
            clientId,
            workItemId,
            action: 'resolve',
        });
    };

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-gray-900">Governance Workbench</h1>
                <p className="text-gray-600 mt-1">Centralized queue for all governance actions</p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <Card className="p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600">Pending</p>
                            <p className="text-2xl font-bold">{stats?.byStatus?.pending || 0}</p>
                        </div>
                        <Clock className="h-8 w-8 text-blue-500" />
                    </div>
                </Card>

                <Card className="p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600">Overdue</p>
                            <p className="text-2xl font-bold text-red-600">{stats?.overdue || 0}</p>
                        </div>
                        <AlertCircle className="h-8 w-8 text-red-500" />
                    </div>
                </Card>

                <Card className="p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600">Upcoming (7d)</p>
                            <p className="text-2xl font-bold text-orange-600">{stats?.upcoming || 0}</p>
                        </div>
                        <Calendar className="h-8 w-8 text-orange-500" />
                    </div>
                </Card>

                <Card className="p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600">Escalated</p>
                            <p className="text-2xl font-bold text-red-600">{stats?.escalated || 0}</p>
                        </div>
                        <AlertTriangle className="h-8 w-8 text-red-500" />
                    </div>
                </Card>

                <Card className="p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600">Completed</p>
                            <p className="text-2xl font-bold text-green-600">{stats?.byStatus?.completed || 0}</p>
                        </div>
                        <CheckCircle2 className="h-8 w-8 text-green-500" />
                    </div>
                </Card>
            </div>

            {/* Main Content */}
            <Tabs value={selectedTab} onValueChange={(v) => setSelectedTab(v as any)}>
                <TabsList>
                    <TabsTrigger value="queue">Work Queue</TabsTrigger>
                    <TabsTrigger value="escalations">
                        Escalations
                        {(stats?.escalated || 0) > 0 && (
                            <Badge className="ml-2 bg-red-500">{stats?.escalated}</Badge>
                        )}
                    </TabsTrigger>
                    <TabsTrigger value="timeline">Activity Timeline</TabsTrigger>
                </TabsList>

                {/* Work Queue Tab */}
                <TabsContent value="queue" className="space-y-4">
                    {/* Filters */}
                    <Card className="p-4">
                        <div className="flex items-center gap-4 flex-wrap">
                            <div className="flex items-center gap-2">
                                <Filter className="h-4 w-4 text-gray-500" />
                                <span className="text-sm font-medium">Filters:</span>
                            </div>

                            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)}>
                                <SelectTrigger className="w-[180px]">
                                    <SelectValue placeholder="Status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Statuses</SelectItem>
                                    <SelectItem value="pending">Pending</SelectItem>
                                    <SelectItem value="in_progress">In Progress</SelectItem>
                                    <SelectItem value="completed">Completed</SelectItem>
                                    <SelectItem value="escalated">Escalated</SelectItem>
                                </SelectContent>
                            </Select>

                            <Select value={priorityFilter} onValueChange={(v) => setPriorityFilter(v as any)}>
                                <SelectTrigger className="w-[180px]">
                                    <SelectValue placeholder="Priority" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Priorities</SelectItem>
                                    <SelectItem value="low">Low</SelectItem>
                                    <SelectItem value="medium">Medium</SelectItem>
                                    <SelectItem value="high">High</SelectItem>
                                    <SelectItem value="critical">Critical</SelectItem>
                                </SelectContent>
                            </Select>

                            <Button
                                variant={assignedToMeOnly ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => setAssignedToMeOnly(!assignedToMeOnly)}
                            >
                                Assigned to Me
                            </Button>
                        </div>
                    </Card>

                    {/* Work Items List */}
                    <div className="space-y-3">
                        {queueData?.items && queueData.items.length > 0 ? (
                            queueData.items.map((item: any) => (
                                <Card key={item.id} className="p-4 hover:shadow-md transition-shadow">
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-start gap-3 flex-1">
                                            <div className="mt-1">
                                                {typeIcons[item.type as WorkItemType]}
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <h3 className="font-semibold text-gray-900">{item.title}</h3>
                                                    {item.isEscalated && (
                                                        <Badge className="bg-red-100 text-red-800">
                                                            <AlertTriangle className="h-3 w-3 mr-1" />
                                                            Escalated
                                                        </Badge>
                                                    )}
                                                </div>
                                                {item.description && (
                                                    <p className="text-sm text-gray-600 mb-2">{item.description}</p>
                                                )}
                                                <div className="flex items-center gap-3 text-xs text-gray-500">
                                                    <Badge className={statusColors[item.status as WorkItemStatus]}>
                                                        {item.status.replace('_', ' ')}
                                                    </Badge>
                                                    <Badge className={priorityColors[item.priority as WorkItemPriority]}>
                                                        {item.priority}
                                                    </Badge>
                                                    {item.entityType && (
                                                        <span className="flex items-center gap-1">
                                                            <span className="font-medium">{item.entityType}</span>
                                                            {item.entityId && <span>#{item.entityId}</span>}
                                                        </span>
                                                    )}
                                                    {item.dueDate && (
                                                        <span className={`flex items-center gap-1 ${new Date(item.dueDate) < new Date() ? 'text-red-600 font-medium' : ''
                                                            }`}>
                                                            <Clock className="h-3 w-3" />
                                                            {formatDate(item.dueDate)}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Button size="sm" variant="outline">
                                                View
                                                <ArrowRight className="h-3 w-3 ml-1" />
                                            </Button>
                                        </div>
                                    </div>
                                </Card>
                            ))
                        ) : (
                            <Card className="p-8 text-center">
                                <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-3" />
                                <p className="text-gray-600">No work items match your filters</p>
                            </Card>
                        )}
                    </div>
                </TabsContent>

                {/* Escalations Tab */}
                <TabsContent value="escalations" className="space-y-4">
                    {escalations && escalations.length > 0 ? (
                        escalations.map((item: any) => (
                            <Card key={item.id} className="p-4 border-l-4 border-red-500">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-start gap-3 flex-1">
                                        <AlertTriangle className="h-5 w-5 text-red-500 mt-1" />
                                        <div className="flex-1">
                                            <h3 className="font-semibold text-gray-900 mb-1">{item.title}</h3>
                                            {item.description && (
                                                <p className="text-sm text-gray-600 mb-2">{item.description}</p>
                                            )}
                                            <div className="flex items-center gap-3 text-xs text-gray-500">
                                                <Badge className={priorityColors[item.priority as WorkItemPriority]}>
                                                    {item.priority}
                                                </Badge>
                                                {item.escalatedAt && (
                                                    <span>Escalated {new Date(item.escalatedAt).toLocaleDateString()}</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => handleAcknowledgeEscalation(item.id)}
                                        >
                                            Acknowledge
                                        </Button>
                                        <Button
                                            size="sm"
                                            onClick={() => handleResolveEscalation(item.id)}
                                        >
                                            Resolve
                                        </Button>
                                    </div>
                                </div>
                            </Card>
                        ))
                    ) : (
                        <Card className="p-8 text-center">
                            <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-3" />
                            <p className="text-gray-600">No active escalations</p>
                        </Card>
                    )}
                </TabsContent>

                {/* Activity Timeline Tab */}
                <TabsContent value="timeline" className="space-y-4">
                    {timelineData?.events && timelineData.events.length > 0 ? (
                        <div className="space-y-3">
                            {timelineData.events.map((event: any) => (
                                <Card key={event.id} className="p-4">
                                    <div className="flex items-start gap-3">
                                        <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                                            <FileText className="h-4 w-4 text-blue-600" />
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center justify-between mb-1">
                                                <h4 className="font-medium text-gray-900">{event.entityName}</h4>
                                                <span className="text-xs text-gray-500">
                                                    {new Date(event.createdAt).toLocaleString()}
                                                </span>
                                            </div>
                                            <p className="text-sm text-gray-600">
                                                <span className="font-medium">{event.actorName || 'System'}</span>
                                                {' '}{event.eventType.replace('_', ' ')}
                                                {event.fromState && event.toState && (
                                                    <span> from <Badge variant="outline">{event.fromState}</Badge> to <Badge variant="outline">{event.toState}</Badge></span>
                                                )}
                                            </p>
                                        </div>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    ) : (
                        <Card className="p-8 text-center">
                            <p className="text-gray-600">No activity recorded yet</p>
                        </Card>
                    )}
                </TabsContent>
            </Tabs>
        </div>
    );
}

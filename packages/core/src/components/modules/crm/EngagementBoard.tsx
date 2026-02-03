import React, { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { Button } from '@complianceos/ui/ui/button';
import { Loader2, Plus, Calendar, ArrowRight, ShieldCheck, FileCheck, CheckCircle2, AlertTriangle } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@complianceos/ui/ui/sheet";
import { Label } from '@complianceos/ui/ui/label';
import { Input } from '@complianceos/ui/ui/input';
import { toast } from 'sonner';
import { Badge } from '@complianceos/ui/ui/badge';
import { format } from 'date-fns';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@complianceos/ui/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@complianceos/ui/ui/tabs';
import { ControlChecklist } from './ControlChecklist';
import { ActivityFeed } from './ActivityFeed';
import { ScrollArea } from '@complianceos/ui/ui/scroll-area';
import ControlDetailsDialog from '@/components/ControlDetailsDialog';

interface EngagementBoardProps {
    clientId: number;
}

const STAGES = [
    { id: 'planned', label: 'Planned', color: 'bg-slate-100 border-slate-200' },
    { id: 'gap_analysis', label: 'Gap Analysis', color: 'bg-blue-50 border-blue-200' },
    { id: 'remediation', label: 'Remediation', color: 'bg-amber-50 border-amber-200' },
    { id: 'audit_prep', label: 'Audit Prep', color: 'bg-purple-50 border-purple-200' },
    { id: 'audit_active', label: 'Audit Active', color: 'bg-red-50 border-red-200' },
    { id: 'certified', label: 'Certified', color: 'bg-green-50 border-green-200' },
];

export function EngagementBoard({ clientId }: EngagementBoardProps) {
    const utils = trpc.useUtils();
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [newEngagement, setNewEngagement] = useState({ title: '', framework: '', priority: 'medium' });

    const { data: engagements, isLoading } = trpc.crm.getEngagements.useQuery({ clientId });

    const createMutation = trpc.crm.createEngagement.useMutation({
        onSuccess: () => {
            toast.success('Engagement created');
            utils.crm.getEngagements.invalidate();
            setIsCreateOpen(false);
            setNewEngagement({ title: '', framework: '', priority: 'medium' });
        }
    });

    const updateStageMutation = trpc.crm.updateEngagementStage.useMutation({
        onSuccess: () => utils.crm.getEngagements.invalidate(),
        onError: () => toast.error('Failed to move engagement')
    });


    const [selectedEngagement, setSelectedEngagement] = useState<any | null>(null);

    // ... (keep existing mutations)

    const handleCreate = (e: React.FormEvent) => {
        e.preventDefault();
        createMutation.mutate({ clientId, ...newEngagement });
    };

    const handleMoveStage = (engagementId: number, currentStage: string | null, e: React.MouseEvent) => {
        e.stopPropagation(); // Prevent opening details
        const currentIndex = STAGES.findIndex(s => s.id === currentStage);
        if (currentIndex < STAGES.length - 1) {
            updateStageMutation.mutate({ clientId, engagementId, stage: STAGES[currentIndex + 1].id as any });
        }
    };

    if (isLoading) return <div className="p-4 flex justify-center"><Loader2 className="animate-spin text-muted-foreground" /></div>;

    const engagementsByStage = STAGES.reduce((acc, stage) => {
        acc[stage.id] = engagements?.filter(d => d.stage === stage.id) || [];
        return acc;
    }, {} as Record<string, typeof engagements>);

    return (
        <div className="space-y-4 h-full flex flex-col">
            <div className="flex justify-between items-center mb-4 px-1">
                <div className="flex items-center gap-4">
                    <h3 className="text-lg font-medium flex items-center gap-2">
                        <ShieldCheck className="w-5 h-5 text-purple-600" />
                        Compliance Journey
                    </h3>
                </div>
                <Sheet open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                    <SheetTrigger asChild>
                        <Button size="sm" className="gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-md border-none">
                            <Plus className="w-4 h-4" /> New Project
                        </Button>
                    </SheetTrigger>
                    <SheetContent>
                        <SheetHeader><SheetTitle>Start Compliance Project</SheetTitle></SheetHeader>
                        <form onSubmit={handleCreate} className="space-y-4 mt-4">
                            <div>
                                <Label>Project Title *</Label>
                                <Input required value={newEngagement.title} onChange={e => setNewEngagement({ ...newEngagement, title: e.target.value })} placeholder="e.g. SOC 2 Type II 2024" />
                            </div>
                            <div>
                                <Label>Framework</Label>
                                <Input value={newEngagement.framework} onChange={e => setNewEngagement({ ...newEngagement, framework: e.target.value })} placeholder="e.g. SOC 2, ISO 27001" />
                            </div>
                            <div>
                                <Label>Priority</Label>
                                <Select value={newEngagement.priority} onValueChange={v => setNewEngagement({ ...newEngagement, priority: v })}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="low">Low</SelectItem>
                                        <SelectItem value="medium">Medium</SelectItem>
                                        <SelectItem value="high">High</SelectItem>
                                        <SelectItem value="critical">Critical</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <Button type="submit" disabled={createMutation.isLoading} className="w-full bg-purple-600 hover:bg-purple-700 text-white">
                                {createMutation.isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null} Create Project
                            </Button>
                        </form>
                    </SheetContent>
                </Sheet>
            </div>

            <div className="flex gap-4 overflow-x-auto pb-4 h-full min-h-[500px] scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-800">
                {STAGES.map(stage => {
                    const stageEngagements = engagementsByStage[stage.id] || [];
                    const isCertified = stage.id === 'certified';

                    return (
                        <div key={stage.id} className="min-w-[300px] w-[300px] flex flex-col rounded-xl bg-slate-50/50 dark:bg-slate-900/40 border shadow-sm backdrop-blur-sm">
                            <div className={`p-4 border-b flex justify-between items-start rounded-t-xl ${isCertified ? 'bg-green-50/80 border-green-100 dark:bg-green-900/20 dark:border-green-900/50' :
                                'bg-white/50 dark:bg-slate-800/50'
                                }`}>
                                <div>
                                    <div className={`font-semibold text-sm ${isCertified ? 'text-green-700 dark:text-green-400' :
                                        'text-slate-700 dark:text-slate-200'
                                        }`}>
                                        {stage.label}
                                    </div>
                                    <div className="text-xs text-muted-foreground mt-0.5">
                                        {stageEngagements.length} projects
                                    </div>
                                </div>
                            </div>

                            <div className="p-3 space-y-3 overflow-y-auto flex-1 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-800">
                                {stageEngagements.map(engagement => (
                                    <div
                                        key={engagement.id}
                                        onClick={() => setSelectedEngagement(engagement)}
                                        className={`
                                            bg-white dark:bg-slate-800 border rounded-lg p-3 shadow-sm hover:shadow-md transition-all cursor-pointer group relative hover:border-purple-400
                                            ${isCertified ? 'border-l-4 border-l-green-500' : ''}
                                        `}
                                    >
                                        <div className="font-medium text-sm mb-2 line-clamp-2">{engagement.title}</div>

                                        <div className="flex justify-between items-center text-xs text-muted-foreground mb-2">
                                            {engagement.framework && (
                                                <Badge variant="outline" className="text-[10px] px-1 py-0 h-5 border-slate-300">
                                                    {engagement.framework}
                                                </Badge>
                                            )}
                                            {engagement.targetDate && (
                                                <div className="flex items-center gap-1">
                                                    <Calendar className="w-3 h-3" />
                                                    {format(new Date(engagement.targetDate), 'MMM d, yyyy')}
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex items-center justify-between mt-2">
                                            <Badge variant={engagement.priority === 'critical' ? 'destructive' : engagement.priority === 'high' ? 'destructive' : 'secondary'} className="text-[10px] capitalize">
                                                {engagement.priority} Priority
                                            </Badge>
                                            <div className="w-16 h-1 bg-slate-100 rounded-full overflow-hidden">
                                                <div className="h-full bg-purple-500" style={{ width: `${engagement.progress}%` }}></div>
                                            </div>
                                        </div>

                                        {!isCertified && (
                                            <div className="pt-2 mt-2 border-t flex justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    className="h-6 text-[10px] hover:bg-purple-50 hover:text-purple-700 dark:hover:bg-purple-900/20"
                                                    onClick={(e) => handleMoveStage(engagement.id, engagement.stage, e)}
                                                >
                                                    Next Stage <ArrowRight className="w-3 h-3 ml-1" />
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                ))}
                                {stageEngagements.length === 0 && (
                                    <div className="h-24 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-lg flex items-center justify-center text-xs text-muted-foreground">
                                        No projects
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Details Sheet - Operations Center */}
            <Sheet open={!!selectedEngagement} onOpenChange={(open) => !open && setSelectedEngagement(null)}>
                <SheetContent className="sm:max-w-2xl w-[800px] overflow-hidden flex flex-col p-0">
                    {selectedEngagement && (
                        <EngagementDetailsView clientId={clientId} engagementId={selectedEngagement.id} onClose={() => setSelectedEngagement(null)} />
                    )}
                </SheetContent>
            </Sheet>
        </div>
    );
}

function EngagementDetailsView({ clientId, engagementId, onClose }: { clientId: number, engagementId: number, onClose: () => void }) {
    const { data: details, isLoading, refetch } = trpc.crm.getEngagementDetails.useQuery({ clientId, engagementId });
    const utils = trpc.useUtils();
    const [selectedControlForDetails, setSelectedControlForDetails] = useState<any>(null);

    const updateStatusMutation = trpc.crm.updateClientControlStatus.useMutation({
        onSuccess: () => {
            refetch();
            utils.crm.getStats.invalidate();
        },
        onError: () => toast.error("Failed to update status")
    });

    if (isLoading || !details) return <div className="h-full flex items-center justify-center"><Loader2 className="animate-spin text-muted-foreground w-8 h-8" /></div>;

    const completedControls = details.controls.filter((c: any) => c.status === 'implemented').length;
    const totalControls = details.controls.length;
    const progress = Math.round((completedControls / (totalControls || 1)) * 100);

    return (
        <div className="h-full flex flex-col bg-slate-50 dark:bg-slate-950">
            {selectedControlForDetails && (
                <ControlDetailsDialog
                    open={!!selectedControlForDetails}
                    onOpenChange={(open) => !open && setSelectedControlForDetails(null)}
                    clientId={clientId}
                    clientControl={{
                        id: selectedControlForDetails.controlId, // Note: controlId in checklist item is actually clientControlId usually, but let's verify mapping
                        clientControlId: selectedControlForDetails.controlCode,
                        customDescription: null,
                        owner: selectedControlForDetails.owner,
                        status: selectedControlForDetails.status,
                        notes: null,
                        implementationNotes: null,
                        implementationDate: null,
                        evidenceLocation: null
                    }}
                    control={{
                        name: selectedControlForDetails.name,
                        description: selectedControlForDetails.description,
                        framework: details.framework || 'General',
                        controlId: selectedControlForDetails.controlCode
                    }}
                    onUpdate={() => refetch()}
                />
            )}
            {/* Header */}
            <div className="p-6 bg-white dark:bg-slate-900 border-b">
                <div className="flex items-start justify-between mb-4">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                                {details.framework || 'General'}
                            </Badge>
                            <Badge variant={details.priority === 'critical' ? 'destructive' : 'secondary'} className="capitalize">
                                {details.priority} Priority
                            </Badge>
                        </div>
                        <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">{details.title}</h2>
                    </div>
                    <div className="text-right">
                        <div className="text-sm text-muted-foreground">Target Date</div>
                        <div className="font-medium flex items-center justify-end gap-1 text-slate-900 dark:text-slate-50">
                            <Calendar className="w-4 h-4 text-purple-500" />
                            {details.targetDate ? format(new Date(details.targetDate), 'PPP') : 'Not Set'}
                        </div>
                    </div>
                </div>

                <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                        <span className="font-medium text-slate-600 dark:text-slate-300">Project Progress</span>
                        <span className="font-bold text-purple-600">{progress}%</span>
                    </div>
                    <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 transition-all duration-500" style={{ width: `${progress}%` }} />
                    </div>
                </div>
            </div>

            {/* Workspace */}
            <Tabs defaultValue="controls" className="flex-1 flex flex-col overflow-hidden">
                <div className="px-6 border-b bg-white dark:bg-slate-900">
                    <TabsList className="w-full justify-start h-12 bg-transparent p-0 space-x-6">
                        <TabsTrigger value="controls" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-purple-600 rounded-none px-0 pb-2 pt-2 h-full font-medium">
                            Control Checklist
                            <Badge className="ml-2 bg-slate-100 text-slate-600 hover:bg-slate-200 border-none h-5 px-1.5">{totalControls}</Badge>
                        </TabsTrigger>
                        <TabsTrigger value="activity" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-purple-600 rounded-none px-0 pb-2 pt-2 h-full font-medium">
                            Activity Log
                        </TabsTrigger>
                        <TabsTrigger value="tasks" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-purple-600 rounded-none px-0 pb-2 pt-2 h-full font-medium">
                            Tasks
                        </TabsTrigger>
                    </TabsList>
                </div>

                <div className="flex-1 overflow-hidden relative">
                    <TabsContent value="controls" className="h-full m-0 p-0 absolute inset-0">
                        <ScrollArea className="h-full p-6">
                            <div className="max-w-4xl mx-auto space-y-6">
                                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-900 rounded-lg p-4 flex gap-3 text-sm text-blue-800 dark:text-blue-300">
                                    <FileCheck className="w-5 h-5 shrink-0" />
                                    <div>
                                        <strong>Action Required:</strong> Review the controls below. Mark them as "In Progress" when you start work, and "Implemented" when evidence is ready.
                                    </div>
                                </div>

                                <ControlChecklist
                                    controls={details.controls as any}
                                    isLoading={updateStatusMutation.isLoading}
                                    onStatusChange={(id, status) => updateStatusMutation.mutate({ clientId, clientControlId: id, status: status as any })}
                                    onViewDetails={(control) => setSelectedControlForDetails(control)}
                                />
                            </div>
                        </ScrollArea>
                    </TabsContent>

                    <TabsContent value="risks" className="h-full m-0 p-6 overflow-y-auto">
                        <div className="max-w-4xl mx-auto space-y-4">
                            {(!details.risks || details.risks.length === 0) ? (
                                <div className="flex flex-col items-center justify-center h-64 text-slate-400">
                                    <ShieldCheck className="w-12 h-12 mb-3 opacity-20" />
                                    <p>No risks identified for this client.</p>
                                    <Button variant="link">Go to Risk Assessment</Button>
                                </div>
                            ) : (
                                <div className="grid gap-3">
                                    {details.risks.map((risk: any) => (
                                        <div key={risk.id} className="bg-white dark:bg-slate-800 p-4 rounded-lg border flex justify-between items-start hover:border-purple-300 transition-colors">
                                            <div>
                                                <div className="font-medium flex items-center gap-2 text-slate-900 dark:text-slate-50">
                                                    <AlertTriangle className={`w-4 h-4 ${risk.inherentRiskScore > 10 ? 'text-red-500' : 'text-amber-500'}`} />
                                                    {risk.title}
                                                </div>
                                                <div className="text-sm text-muted-foreground mt-1 line-clamp-2">{risk.description}</div>
                                                <div className="flex gap-2 mt-2">
                                                    <Badge variant="outline" className="text-xs">{risk.status || 'Identified'}</Badge>
                                                    {risk.owner && <Badge variant="secondary" className="text-xs">Owner: {risk.owner}</Badge>}
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-1">Risk Score</div>
                                                <div className={`text-lg font-bold ${risk.inherentRiskScore > 15 ? 'text-red-600' : 'text-amber-600'}`}>{risk.inherentRiskScore || '-'}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </TabsContent>

                    <TabsContent value="activity" className="h-full m-0 p-6 overflow-y-auto">
                        <div className="max-w-2xl mx-auto">
                            <ActivityFeed clientId={clientId} />
                        </div>
                    </TabsContent>

                    <TabsContent value="tasks" className="h-full m-0 p-6 overflow-y-auto">
                        <div className="flex flex-col items-center justify-center h-64 text-slate-400">
                            <CheckCircle2 className="w-12 h-12 mb-3 opacity-20" />
                            <p>No open remediation tasks for this project.</p>
                            <Button variant="link">Create Task</Button>
                        </div>
                    </TabsContent>
                </div>
            </Tabs>
        </div>
    );
}

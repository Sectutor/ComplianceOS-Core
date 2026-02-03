
import React from 'react';
import { Button } from "@complianceos/ui/ui/button";
import { Input } from "@complianceos/ui/ui/input";
import { Label } from "@complianceos/ui/ui/label";
import { ArrowRight, Shield, AlertTriangle, Clock, Users, Loader2 } from "lucide-react";
import { Checkbox } from "@complianceos/ui/ui/checkbox";
import { Badge } from "@complianceos/ui/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@complianceos/ui/ui/table";

// --- Interfaces ---

interface PlanDetailsTabProps {
    formData: any;
    setFormData: (data: any) => void;
    onNext: () => void;
}

interface PlanStrategiesTabProps {
    formData: any;
    toggleStrategy: (id: number) => void;
    toggleScenario: (id: number) => void;
    strategies: any[];
    scenarios: any[];
    onBack: () => void;
    onNext: () => void;
}

interface PlanActivitiesTabProps {
    formData: any;
    toggleBia: (id: number) => void;
    bias: any[];
    onBack: () => void;
    onNext: () => void;
}

interface PlanContactsTabProps {
    formData: any;
    availableUsers: any[];
    addStakeholder: (user: any) => void;
    removeStakeholder: (id: number) => void;
    updateStakeholderRole: (id: number, role: string) => void;
    onBack: () => void;
    onNext: () => void;
}

interface PlanReviewTabProps {
    formData: any;
    strategies: any[];
    criticalActivities: any[];
    isSubmitting: boolean;
    onSubmit: () => void;
    onBack: () => void;
}

// --- Components ---

export function PlanDetailsTab({ formData, setFormData, onNext }: PlanDetailsTabProps) {
    return (
        <div className="space-y-6 mt-0">
            <div className="space-y-4">
                <div className="space-y-2">
                    <Label>Plan Title</Label>
                    <Input
                        value={formData.title}
                        onChange={e => setFormData({ ...formData, title: e.target.value })}
                        placeholder="e.g. IT Disaster Recovery Plan"
                    />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label>Version</Label>
                        <Input
                            value={formData.version}
                            onChange={e => setFormData({ ...formData, version: e.target.value })}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Scope / Department</Label>
                        <Input
                            value={formData.department}
                            onChange={e => setFormData({ ...formData, department: e.target.value })}
                            placeholder="e.g. Finance Dept"
                        />
                    </div>
                </div>
            </div>
            <div className="flex justify-end">
                <Button onClick={onNext} disabled={!formData.title}>Next: Strategies <ArrowRight className="ml-2 h-4 w-4" /></Button>
            </div>
        </div>
    );
}

export function PlanStrategiesTab({
    formData,
    toggleStrategy,
    toggleScenario,
    strategies,
    scenarios,
    onBack,
    onNext
}: PlanStrategiesTabProps) {
    return (
        <div className="space-y-8 mt-0">
            <div className="space-y-4">
                <h3 className="font-semibold flex items-center gap-2">
                    <Shield className="w-5 h-5 text-blue-500" /> Recovery Strategies
                </h3>
                {(!strategies || strategies.length === 0) && <div className="text-muted-foreground italic">No strategies found. Define strategies first.</div>}
                {strategies?.map(strat => (
                    <div key={strat.id} className="p-4 border rounded-lg flex items-start gap-4 hover:bg-slate-50">
                        <Checkbox checked={formData.selectedStrategyIds.includes(strat.id)} onCheckedChange={() => toggleStrategy(strat.id)} />
                        <div>
                            <div className="font-medium">{strat.title}</div>
                            <div className="text-sm text-muted-foreground">{strat.description}</div>
                            <Badge variant="outline" className="mt-1 text-xs">{strat.estimatedCost}</Badge>
                        </div>
                    </div>
                ))}
            </div>

            <div className="space-y-4 pt-4 border-t">
                <h3 className="font-semibold flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-amber-500" /> Disruptive Scenarios
                </h3>
                <p className="text-sm text-muted-foreground">Select relevant scenarios this plan addresses.</p>
                {(!scenarios || scenarios.length === 0) && <div className="text-muted-foreground italic">No scenarios found.</div>}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {scenarios?.map(scen => (
                        <div key={scen.id} className="p-4 border rounded-lg flex items-start gap-3 hover:bg-slate-50 cursor-pointer" onClick={() => toggleScenario(scen.id)}>
                            <Checkbox checked={formData.selectedScenarioIds.includes(scen.id)} onCheckedChange={() => toggleScenario(scen.id)} id={`scen-${scen.id}`} />
                            <div className="flex-1">
                                <div className="font-medium text-sm flex justify-between">
                                    {scen.title}
                                    <Badge variant={scen.likelihood === 'high' ? 'destructive' : 'outline'} className="text-[10px] h-5">{scen.likelihood}</Badge>
                                </div>
                                <div className="text-xs text-muted-foreground mt-1 line-clamp-2">{scen.description}</div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="flex justify-between pt-4">
                <Button variant="ghost" onClick={onBack}>Back</Button>
                <Button onClick={onNext}>Next: Activities <ArrowRight className="ml-2 h-4 w-4" /></Button>
            </div>
        </div>
    );
}

export function PlanActivitiesTab({ formData, toggleBia, bias, onBack, onNext }: PlanActivitiesTabProps) {
    return (
        <div className="space-y-6 mt-0">
            <div className="space-y-4">
                <p className="text-sm text-muted-foreground mb-4">Select approved BIAs to import their Critical Activities and Recovery Objectives (RTO/RPO).</p>
                {(!bias || bias.length === 0) && <div className="text-muted-foreground">No BIAs found.</div>}
                {bias?.map(b => (
                    <div key={b.id} className="p-4 border rounded-lg flex items-start gap-4 hover:bg-slate-50">
                        <Checkbox checked={formData.selectedBiaIds.includes(b.id)} onCheckedChange={() => toggleBia(b.id)} />
                        <div className="flex-1">
                            <div className="flex items-center gap-2">
                                <span className="font-medium">{b.title}</span>
                                <Badge variant={b.status === 'approved' ? 'default' : 'secondary'} className="text-xs">{b.status}</Badge>
                            </div>
                            <div className="text-sm text-muted-foreground">Process: {b.processName || 'N/A'}</div>
                        </div>
                    </div>
                ))}
            </div>
            <div className="flex justify-between">
                <Button variant="ghost" onClick={onBack}>Back</Button>
                <Button onClick={onNext}>Next: Contacts <ArrowRight className="ml-2 h-4 w-4" /></Button>
            </div>
        </div>
    );
}

export function PlanContactsTab({
    formData,
    availableUsers,
    addStakeholder,
    removeStakeholder,
    updateStakeholderRole,
    onBack,
    onNext
}: PlanContactsTabProps) {
    return (
        <div className="space-y-6 mt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                    <Label>Add Stakeholders (Click to Add)</Label>
                    <div className="border rounded-md h-[300px] overflow-y-auto p-2 space-y-2">
                        {availableUsers?.map(u => (
                            <div key={u.id} className="p-2 hover:bg-slate-100 rounded cursor-pointer flex justify-between items-center" onClick={() => addStakeholder(u)}>
                                <div>
                                    <div className="font-medium text-sm">{u.name}</div>
                                    <div className="text-xs text-muted-foreground">{u.email}</div>
                                </div>
                                <Badge variant="outline" className="text-xs">+ Add</Badge>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="space-y-4">
                    <Label>Selected Call List</Label>
                    <div className="space-y-2">
                        {formData.selectedStakeholders.length === 0 && <div className="text-sm text-muted-foreground italic">No contacts selected.</div>}
                        {formData.selectedStakeholders.map((s: any) => (
                            <div key={s.id} className="flex items-center gap-2 p-2 border rounded bg-slate-50">
                                <div className="flex-1">
                                    <div className="font-medium text-sm">{s.name}</div>
                                    <Input
                                        className="h-6 text-xs mt-1 w-32"
                                        value={s.role}
                                        onChange={(e) => updateStakeholderRole(s.id, e.target.value)}
                                    />
                                </div>
                                <Button variant="ghost" size="icon" className="h-6 w-6 text-red-500" onClick={() => removeStakeholder(s.id)}>
                                    <span className="sr-only">Remove</span>
                                    &times;
                                </Button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
            <div className="flex justify-between">
                <Button variant="ghost" onClick={onBack}>Back</Button>
                <Button onClick={onNext}>Next: Review <ArrowRight className="ml-2 h-4 w-4" /></Button>
            </div>
        </div>
    );
}

export function PlanReviewTab({
    formData,
    strategies,
    criticalActivities,
    isSubmitting,
    onSubmit,
    onBack
}: PlanReviewTabProps) {
    return (
        <div className="space-y-8 mt-0">
            <div className="bg-slate-50 p-6 rounded-lg border space-y-6">
                <div className="border-b pb-4">
                    <h2 className="text-2xl font-bold">{formData.title}</h2>
                    <div className="grid grid-cols-2 gap-4 mt-4 text-sm">
                        <div><strong>Version:</strong> {formData.version}</div>
                        <div><strong>Scope:</strong> {formData.department}</div>
                    </div>
                </div>

                <div>
                    <h3 className="font-bold text-lg mb-3 flex items-center gap-2"><Clock className="w-5 h-5" /> Critical Activities</h3>
                    <Table>
                        <TableHeader>
                            <TableRow><TableHead>Activity</TableHead><TableHead>RTO</TableHead><TableHead>Criticality</TableHead></TableRow>
                        </TableHeader>
                        <TableBody>
                            {(!criticalActivities || criticalActivities.length === 0) && <TableRow><TableCell colSpan={3} className="text-muted-foreground italic">No activities found.</TableCell></TableRow>}
                            {criticalActivities?.map(a => (
                                <TableRow key={a.id}>
                                    <TableCell className="font-medium">{a.activity}</TableCell>
                                    <TableCell>{a.rto}</TableCell>
                                    <TableCell><Badge variant={a.criticality === 'Critical' ? 'destructive' : 'secondary'}>{a.criticality}</Badge></TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>

                <div>
                    <h3 className="font-bold text-lg mb-3 flex items-center gap-2"><Shield className="w-5 h-5" /> Strategies</h3>
                    <ul className="list-disc list-inside space-y-1 text-sm pl-2">
                        {strategies?.filter(s => formData.selectedStrategyIds.includes(s.id)).map(s => (
                            <li key={s.id}><strong>{s.title}</strong>: {s.description}</li>
                        ))}
                    </ul>
                </div>

                <div>
                    <h3 className="font-bold text-lg mb-3 flex items-center gap-2"><Users className="w-5 h-5" /> Call List</h3>
                    <div className="grid grid-cols-2 gap-4">
                        {formData.selectedStakeholders.map((s: any) => (
                            <div key={s.id} className="p-3 bg-white border rounded shadow-sm">
                                <div className="font-medium">{s.name}</div>
                                <div className="text-sm text-blue-600">{s.role}</div>
                                <div className="text-xs text-muted-foreground">{s.email}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
            <div className="flex justify-between pt-4 border-t mt-6">
                <Button variant="ghost" onClick={onBack}>Back</Button>
                <Button onClick={onSubmit} disabled={isSubmitting} className="bg-green-600 hover:bg-green-700 text-white">
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Generate Plan
                </Button>
            </div>
        </div>
    );
}

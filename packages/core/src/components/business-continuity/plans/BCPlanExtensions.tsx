
import React, { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@complianceos/ui/ui/button";
import { Input } from "@complianceos/ui/ui/input";
import { Textarea } from "@complianceos/ui/ui/textarea";
import { Label } from "@complianceos/ui/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@complianceos/ui/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@complianceos/ui/ui/table";
import { Save, Plus, Trash2, FileText, Link as LinkIcon, Download } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@complianceos/ui/ui/badge";
import { AIEnhanceButton } from "@complianceos/premium/components/advisor/AIEnhanceButton";

// --- Introduction Editor (Purpose, Scope, Assumptions) ---
export function PlanIntroductionEditor({ planId, clientId }: { planId: number, clientId: number }) {
    const { data: sections, refetch } = trpc.businessContinuity.plans.sections.get.useQuery({ planId, clientId });
    const upsertSection = trpc.businessContinuity.plans.sections.upsert.useMutation({
        onSuccess: () => toast.success("Section saved")
    });

    const [content, setContent] = useState({
        intro: "",
        scope: "",
        assumptions: ""
    });

    useEffect(() => {
        if (sections) {
            setContent({
                intro: sections.find((s: any) => s.sectionKey === 'intro')?.content || "",
                scope: sections.find((s: any) => s.sectionKey === 'scope')?.content || "",
                assumptions: sections.find((s: any) => s.sectionKey === 'assumptions')?.content || ""
            });
        }
    }, [sections]);

    const handleSave = (key: string, value: string) => {
        upsertSection.mutate({ planId, clientId, sectionKey: key, content: value });
    };

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <div className="space-y-1">
                        <CardTitle>Plan Introduction</CardTitle>
                        <CardDescription>Define the purpose and objectives of this recovery plan.</CardDescription>
                    </div>
                    <AIEnhanceButton
                        clientId={clientId}
                        planId={planId}
                        sectionKey="intro"
                        currentContent={content.intro}
                        onApply={(val) => {
                            setContent(prev => ({ ...prev, intro: val }));
                            handleSave('intro', val);
                        }}
                    />
                </CardHeader>
                <CardContent className="space-y-4 pt-4">
                    <div className="space-y-2">
                        <Label>Purpose</Label>
                        <Textarea
                            className="min-h-[100px]"
                            placeholder="Why does this plan exist?"
                            value={content.intro}
                            onChange={e => setContent({ ...content, intro: e.target.value })}
                            onBlur={() => handleSave('intro', content.intro)}
                        />
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <div className="space-y-1">
                        <CardTitle>Scope</CardTitle>
                        <CardDescription>What is covered by this plan, and what is excluded?</CardDescription>
                    </div>
                    <AIEnhanceButton
                        clientId={clientId}
                        planId={planId}
                        sectionKey="scope"
                        currentContent={content.scope}
                        onApply={(val) => {
                            setContent(prev => ({ ...prev, scope: val }));
                            handleSave('scope', val);
                        }}
                    />
                </CardHeader>
                <CardContent className="space-y-4 pt-4">
                    <div className="space-y-2">
                        <Label>Scope Statement</Label>
                        <Textarea
                            className="min-h-[100px]"
                            placeholder="Departments, systems, locations..."
                            value={content.scope}
                            onChange={e => setContent({ ...content, scope: e.target.value })}
                            onBlur={() => handleSave('scope', content.scope)}
                        />
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <div className="space-y-1">
                        <CardTitle>Assumptions & Dependencies</CardTitle>
                        <CardDescription>External factors or conditions assumed to be true.</CardDescription>
                    </div>
                    <AIEnhanceButton
                        clientId={clientId}
                        planId={planId}
                        sectionKey="assumptions"
                        currentContent={content.assumptions}
                        onApply={(val) => {
                            setContent(prev => ({ ...prev, assumptions: val }));
                            handleSave('assumptions', val);
                        }}
                    />
                </CardHeader>
                <CardContent className="space-y-4 pt-4">
                    <div className="space-y-2">
                        <Label>Key Assumptions</Label>
                        <Textarea
                            className="min-h-[100px]"
                            placeholder="e.g. Critical staff are available within 4 hours..."
                            value={content.assumptions}
                            onChange={e => setContent({ ...content, assumptions: e.target.value })}
                            onBlur={() => handleSave('assumptions', content.assumptions)}
                        />
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

// --- Activation Editor (Triggers) ---
export function PlanActivationEditor({ planId, clientId }: { planId: number, clientId: number }) {
    const { data: sections, refetch } = trpc.businessContinuity.plans.sections.get.useQuery({ planId, clientId });
    const upsertSection = trpc.businessContinuity.plans.sections.upsert.useMutation({
        onSuccess: () => toast.success("Activation criteria saved")
    });

    // We reuse sections for 'activation_criteria' and 'escalation_procedures'
    const [criteria, setCriteria] = useState("");
    const [escalation, setEscalation] = useState("");

    useEffect(() => {
        if (sections) {
            setCriteria(sections.find((s: any) => s.sectionKey === 'activation_criteria')?.content || "");
            setEscalation(sections.find((s: any) => s.sectionKey === 'escalation_procedures')?.content || "");
        }
    }, [sections]);

    const handleSave = (key: string, value: string) => {
        upsertSection.mutate({ planId, clientId, sectionKey: key, content: value });
    };

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <div className="space-y-1">
                        <CardTitle>Activation Criteria</CardTitle>
                        <CardDescription>When should this plan be invoked?</CardDescription>
                    </div>
                    <AIEnhanceButton
                        clientId={clientId}
                        planId={planId}
                        sectionKey="activation"
                        currentContent={criteria}
                        onApply={(val) => {
                            setCriteria(val);
                            handleSave('activation_criteria', val);
                        }}
                    />
                </CardHeader>
                <CardContent className="space-y-4 pt-4">
                    <div className="space-y-2">
                        <Label>Triggers</Label>
                        <Textarea
                            className="min-h-[150px]"
                            placeholder="Describe the specific events or thresholds..."
                            value={criteria}
                            onChange={e => setCriteria(e.target.value)}
                            onBlur={() => handleSave('activation_criteria', criteria)}
                        />
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <div className="space-y-1">
                        <CardTitle>Escalation Procedures</CardTitle>
                        <CardDescription>How to escalate an incident to full crisis mode.</CardDescription>
                    </div>
                    <AIEnhanceButton
                        clientId={clientId}
                        planId={planId}
                        sectionKey="activation" // Reusing activation key or could add new one
                        currentContent={escalation}
                        label="AI Assist (Escalation)"
                        onApply={(val) => {
                            setEscalation(val);
                            handleSave('escalation_procedures', val);
                        }}
                    />
                </CardHeader>
                <CardContent className="space-y-4 pt-4">
                    <div className="space-y-2">
                        <Label>Procedures</Label>
                        <Textarea
                            className="min-h-[150px]"
                            placeholder="Steps to contact the CMT (Crisis Management Team)..."
                            value={escalation}
                            onChange={e => setEscalation(e.target.value)}
                            onBlur={() => handleSave('escalation_procedures', escalation)}
                        />
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

// --- Appendices Editor ---
export function PlanAppendicesEditor({ planId, clientId }: { planId: number, clientId: number }) {
    const { data: appendices, refetch } = trpc.businessContinuity.plans.appendices.list.useQuery({ planId, clientId });
    const addAppendix = trpc.businessContinuity.plans.appendices.add.useMutation({
        onSuccess: () => {
            toast.success("Appendix added");
            refetch();
            setNewItem({ title: "", type: "link", fileUrl: "", description: "" });
        }
    });
    const removeAppendix = trpc.businessContinuity.plans.appendices.remove.useMutation({
        onSuccess: () => refetch()
    });

    const [newItem, setNewItem] = useState({ title: "", type: "link", fileUrl: "", description: "" });

    return (
        <Card>
            <CardHeader>
                <CardTitle>Plan Appendices</CardTitle>
                <CardDescription>Supporting documents, contact lists, and external references.</CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Title</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Description</TableHead>
                            <TableHead>Link/Location</TableHead>
                            <TableHead className="w-[50px]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {appendices?.map((apt: any) => (
                            <TableRow key={apt.id}>
                                <TableCell className="font-medium">{apt.title}</TableCell>
                                <TableCell><Badge variant="outline">{apt.type}</Badge></TableCell>
                                <TableCell>{apt.description}</TableCell>
                                <TableCell>
                                    {apt.fileUrl && (
                                        <a href={apt.fileUrl} target="_blank" rel="noopener noreferrer" className="flex items-center text-blue-600 hover:underline">
                                            <LinkIcon className="w-3 h-3 mr-1" /> Open
                                        </a>
                                    )}
                                </TableCell>
                                <TableCell>
                                    <Button variant="ghost" size="sm" onClick={() => removeAppendix.mutate({ id: apt.id, clientId })}>
                                        <Trash2 className="w-4 h-4 text-red-500" />
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                        <TableRow>
                            <TableCell>
                                <Input placeholder="Title" value={newItem.title} onChange={e => setNewItem({ ...newItem, title: e.target.value })} />
                            </TableCell>
                            <TableCell>
                                <select className="h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                                    value={newItem.type} onChange={e => setNewItem({ ...newItem, type: e.target.value })}>
                                    <option value="link">Ext. Link</option>
                                    <option value="file">File Ref</option>
                                    <option value="contact_list">Contact List</option>
                                </select>
                            </TableCell>
                            <TableCell>
                                <Input placeholder="Optional description" value={newItem.description} onChange={e => setNewItem({ ...newItem, description: e.target.value })} />
                            </TableCell>
                            <TableCell>
                                <Input placeholder="https://..." value={newItem.fileUrl} onChange={e => setNewItem({ ...newItem, fileUrl: e.target.value })} />
                            </TableCell>
                            <TableCell>
                                <Button size="sm" onClick={() => {
                                    if (!newItem.title) return;
                                    addAppendix.mutate({ planId, clientId, ...newItem });
                                }}>
                                    <Plus className="w-4 h-4" />
                                </Button>
                            </TableCell>
                        </TableRow>
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}

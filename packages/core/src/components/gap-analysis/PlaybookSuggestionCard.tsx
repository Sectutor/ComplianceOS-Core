import { useState } from "react";
import { Badge } from "@complianceos/ui/ui/badge";
import { Button } from "@complianceos/ui/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@complianceos/ui/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@complianceos/ui/ui/collapsible";
import { trpc } from "@/lib/trpc";
import { BookOpen, ChevronDown, ChevronRight, CheckCircle2, Clock, User, FileText, Sparkles } from "lucide-react";

interface PlaybookSuggestionCardProps {
    controlId: string;
    controlName: string;
    category?: string;
    framework?: string;
}

export function PlaybookSuggestionCard({
    controlId,
    controlName,
    category,
    framework
}: PlaybookSuggestionCardProps) {
    const [expandedPlaybook, setExpandedPlaybook] = useState<number | null>(null);

    const { data: playbooks = [], isLoading } = trpc.remediationPlaybooks.getSuggestions.useQuery(
        { controlId, controlName, category, framework },
        { staleTime: 60000 }
    );

    if (isLoading || playbooks.length === 0) return null;

    const severityColor = (severity: string | null) => {
        switch (severity) {
            case 'critical': return 'bg-red-600';
            case 'high': return 'bg-orange-500';
            case 'medium': return 'bg-yellow-500';
            default: return 'bg-blue-500';
        }
    };

    return (
        <Card className="border-purple-200 bg-purple-50/30">
            <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2 text-purple-700">
                    <BookOpen className="h-4 w-4" />
                    Remediation Playbooks
                </CardTitle>
                <CardDescription className="text-xs">
                    {playbooks.length} playbook{playbooks.length > 1 ? 's' : ''} available for this gap
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
                {playbooks.slice(0, 3).map((playbook: any) => (
                    <Collapsible
                        key={playbook.id}
                        open={expandedPlaybook === playbook.id}
                        onOpenChange={(open) => setExpandedPlaybook(open ? playbook.id : null)}
                    >
                        <CollapsibleTrigger asChild>
                            <div className="flex items-center justify-between p-2 rounded-md bg-white border cursor-pointer hover:bg-muted/50">
                                <div className="flex items-center gap-2">
                                    {expandedPlaybook === playbook.id ? (
                                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                                    ) : (
                                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                    )}
                                    <span className="font-medium text-sm">{playbook.title}</span>
                                    <Badge className={`${severityColor(playbook.severity)} text-white text-[10px]`}>
                                        {playbook.severity}
                                    </Badge>
                                </div>
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                    <Clock className="h-3 w-3" />
                                    {playbook.estimatedEffort}
                                </div>
                            </div>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                            <div className="mt-2 p-3 bg-white rounded-md border space-y-3">
                                {/* Steps */}
                                <div className="space-y-2">
                                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Steps</h4>
                                    {(playbook.steps || []).map((step: any, idx: number) => (
                                        <div key={idx} className="flex items-start gap-2 text-sm">
                                            <div className="flex-shrink-0 w-5 h-5 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center text-xs font-medium">
                                                {step.order}
                                            </div>
                                            <div className="flex-1">
                                                <div className="font-medium">{step.title}</div>
                                                <div className="text-xs text-muted-foreground">{step.description}</div>
                                                {step.owner && (
                                                    <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                                                        <User className="h-3 w-3" /> {step.owner}
                                                    </div>
                                                )}
                                                {step.checklist && step.checklist.length > 0 && (
                                                    <ul className="mt-1 space-y-0.5">
                                                        {step.checklist.map((item: string, i: number) => (
                                                            <li key={i} className="flex items-center gap-1 text-xs text-muted-foreground">
                                                                <CheckCircle2 className="h-3 w-3 text-green-500" /> {item}
                                                            </li>
                                                        ))}
                                                    </ul>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Owner Template */}
                                {playbook.ownerTemplate && (
                                    <div>
                                        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Recommended Owner</h4>
                                        <div className="text-xs bg-muted/50 p-2 rounded flex items-center gap-1.5">
                                            <User className="h-3.5 w-3.5 text-purple-600" />
                                            {playbook.ownerTemplate}
                                        </div>
                                    </div>
                                )}

                                {/* Policy Language */}
                                {playbook.policyLanguage && (
                                    <div>
                                        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Sample Policy Language</h4>
                                        <div className="text-xs bg-blue-50 p-2 rounded border border-blue-100 flex items-start gap-1.5">
                                            <FileText className="h-3.5 w-3.5 text-blue-600 mt-0.5" />
                                            <span className="italic">{playbook.policyLanguage}</span>
                                        </div>
                                    </div>
                                )}

                                {/* Action */}
                                <div className="flex justify-end pt-1">
                                    <Button size="sm" variant="outline" className="text-xs gap-1 text-purple-700 border-purple-200 hover:bg-purple-50">
                                        <Sparkles className="h-3 w-3" />
                                        Start Remediation
                                    </Button>
                                </div>
                            </div>
                        </CollapsibleContent>
                    </Collapsible>
                ))}
            </CardContent>
        </Card>
    );
}

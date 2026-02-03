import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@complianceos/ui/ui/card";
import { Badge } from "@complianceos/ui/ui/badge";
import { Button } from "@complianceos/ui/ui/button";
import {
    Target, Calendar, ArrowRight, CheckCircle2,
    MessageSquare, Sparkles, Trophy
} from "lucide-react";
import { Progress } from "@complianceos/ui/ui/progress";

interface WeeklyFocusWidgetProps {
    weeklyFocus: string | null;
    complianceScore: number;
}

export function WeeklyFocusWidget({ weeklyFocus, complianceScore }: WeeklyFocusWidgetProps) {
    return (
        <Card className="border-indigo-200 shadow-md bg-gradient-to-br from-indigo-50/50 to-white overflow-hidden">
            <div className="h-1.5 w-full bg-indigo-600" />
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-xl font-bold flex items-center gap-2 text-indigo-900">
                        <Target className="h-5 w-5 text-indigo-600" />
                        Guided Journey: Weekly Focus
                    </CardTitle>
                    <Badge className="bg-indigo-100 text-indigo-700 border-indigo-200 hover:bg-indigo-100 uppercase tracking-wider text-[10px] font-bold">
                        Model 2 (Guided)
                    </Badge>
                </div>
                <CardDescription className="text-indigo-600/80 font-medium">
                    Your roadmap to audit readiness, curated by your compliance coach.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {weeklyFocus ? (
                    <div className="bg-white border border-indigo-100 rounded-lg p-4 shadow-sm">
                        <h4 className="font-bold text-slate-900 mb-2 flex items-center gap-2">
                            <Sparkles className="h-4 w-4 text-amber-500" />
                            This Week's Goal
                        </h4>
                        <p className="text-slate-700 leading-relaxed text-sm">
                            {weeklyFocus}
                        </p>
                    </div>
                ) : (
                    <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 text-center">
                        <p className="text-slate-500 text-sm italic">
                            Awaiting weekly focus from your advisor. Check back after your next implementation call!
                        </p>
                    </div>
                )}

                <div className="space-y-2">
                    <div className="flex justify-between text-xs font-bold uppercase tracking-wider text-slate-500">
                        <span>Audit Readiness Progress</span>
                        <span className="text-indigo-600">{complianceScore}%</span>
                    </div>
                    <Progress value={complianceScore} className="h-2 bg-slate-100" />
                </div>

                <div className="pt-2 flex gap-3">
                    <Button className="flex-1 bg-indigo-600 hover:bg-indigo-700 shadow-sm" size="sm">
                        Quick Actions <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" className="border-indigo-200 text-indigo-600 hover:bg-indigo-50">
                        <MessageSquare className="mr-2 h-4 w-4" /> Ask Coach
                    </Button>
                </div>

                <div className="flex items-center gap-4 text-[11px] text-slate-500 pt-2 border-t border-indigo-50">
                    <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" /> Next Call: Friday, 2 PM
                    </div>
                    <div className="flex items-center gap-1">
                        <Trophy className="h-3 w-3 text-amber-500" /> Milestone: ISO 27001 Ph 1
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

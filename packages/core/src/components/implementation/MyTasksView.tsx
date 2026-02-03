
import React from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@complianceos/ui/ui/card";
import { Badge } from "@complianceos/ui/ui/badge";
import { Button } from "@complianceos/ui/ui/button";
import { CheckCircle2, Clock, ArrowRight, LayoutList } from "lucide-react";
import { trpc } from '@/lib/trpc';
import { Link } from 'wouter';
import { ScrollArea } from "@complianceos/ui/ui/scroll-area";

export const MyTasksView = () => {
    const { data: tasks, isLoading } = trpc.implementation.getMyTasks.useQuery();

    if (isLoading) {
        return <div className="text-sm text-slate-500">Loading your tasks...</div>;
    }

    if (!tasks || tasks.length === 0) {
        return (
            <Card className="border-slate-200 bg-white">
                <CardContent className="pt-6 text-center py-12">
                    <div className="mx-auto w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                        <CheckCircle2 className="w-6 h-6 text-slate-400" />
                    </div>
                    <p className="text-slate-600 font-medium">No active tasks assigned to you.</p>
                    <p className="text-xs text-slate-400 mt-1">Enjoy your free time!</p>
                </CardContent>
            </Card>
        );
    }

    // Group by Plan
    const groupedTasks = tasks.reduce((acc: any, t) => {
        const plan = t.planTitle || 'Untitled Plan';
        if (!acc[plan]) acc[plan] = [];
        acc[plan].push(t);
        return acc;
    }, {});

    return (
        <Card className="border-slate-200 bg-white shadow-sm h-full">
            <CardHeader className="border-b pb-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="p-2 bg-blue-50 rounded-lg">
                            <LayoutList className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                            <CardTitle className="text-lg">My Active Tasks</CardTitle>
                            <CardDescription>Tasks assigned to you across all plans</CardDescription>
                        </div>
                    </div>
                    <Badge variant="secondary" className="bg-blue-50 text-blue-700">
                        {tasks.length} Pending
                    </Badge>
                </div>
            </CardHeader>
            <ScrollArea className="h-[400px]">
                <CardContent className="pt-6 space-y-6">
                    {Object.entries(groupedTasks).map(([planTitle, planTasks]: [string, any[]]) => (
                        <div key={planTitle}>
                            <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
                                {planTitle}
                            </h4>
                            <div className="space-y-2">
                                {planTasks.map((task) => (
                                    <div key={task.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 border rounded-lg hover:border-blue-200 transition-colors group">
                                        <div className="flex items-start gap-3">
                                            <div className={`mt-0.5 w-4 h-4 rounded-full border-2 ${task.priority === 'high' ? 'border-red-400' : 'border-slate-300'
                                                }`} />
                                            <div>
                                                <p className="font-medium text-slate-900 text-sm group-hover:text-blue-700">
                                                    {task.title}
                                                </p>
                                                <div className="flex items-center gap-3 mt-1">
                                                    {task.estimatedHours > 0 && (
                                                        <span className="text-xs text-slate-500 flex items-center">
                                                            <Clock className="w-3 h-3 mr-1" />
                                                            {task.estimatedHours}h
                                                        </span>
                                                    )}
                                                    <Badge variant="outline" className="text-[10px] h-5 font-normal">
                                                        {task.status.replace('_', ' ')}
                                                    </Badge>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="mt-3 sm:mt-0 flex justify-end">
                                            <Link href={`/implementation/${task.implementationPlanId}`}>
                                                <Button size="sm" variant="ghost" className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <ArrowRight className="w-4 h-4 text-slate-400" />
                                                </Button>
                                            </Link>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </CardContent>
            </ScrollArea>
        </Card>
    );
}


import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@complianceos/ui/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Label, Tooltip } from 'recharts';
import { Progress } from '@complianceos/ui/ui/progress';
import { ArrowUpRight } from 'lucide-react';

interface ControlsStatsProps {
    assignmentStats: {
        unassigned: number;
        assigned: number;
        needsReassignment: number;
    };
    completionStats: {
        total: number;
        okCount: number;
        testPassed: number;
        testTotal: number;
        documentAttached: number;
        documentTotal: number;
    };
}

export function ControlsStats({ assignmentStats, completionStats }: ControlsStatsProps) {
    const totalAssigned = assignmentStats.unassigned + assignmentStats.assigned + assignmentStats.needsReassignment;
    const assignedPercent = totalAssigned > 0 ? Math.round((assignmentStats.assigned / totalAssigned) * 100) : 0;

    const data = [
        { name: 'Unassigned', value: assignmentStats.unassigned, color: '#E2E8F0' }, // Slate 200
        { name: 'Assigned', value: assignmentStats.assigned, color: '#8B5CF6' }, // Violet 500
        { name: 'Needs reassignment', value: assignmentStats.needsReassignment, color: '#F97316' }, // Orange 500
    ].filter(d => d.value > 0);

    // If all zero, show a placeholder
    if (data.length === 0) {
       data.push({ name: 'No Data', value: 1, color: '#E2E8F0' });
    }

    const okPercent = completionStats.total > 0 ? Math.round((completionStats.okCount / completionStats.total) * 100) : 0;
    const testPercent = completionStats.testTotal > 0 ? Math.round((completionStats.testPassed / completionStats.testTotal) * 100) : 0;
    const docPercent = completionStats.documentTotal > 0 ? Math.round((completionStats.documentAttached / completionStats.documentTotal) * 100) : 0;

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Assignment Card */}
            <Card className="shadow-sm border-slate-200">
                <CardHeader className="pb-2">
                    <CardTitle className="text-lg font-semibold text-slate-800">Assignment</CardTitle>
                </CardHeader>
                <CardContent className="flex items-center gap-8">
                    <div className="relative h-40 w-40 flex-shrink-0">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={data}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={55}
                                    outerRadius={75}
                                    paddingAngle={2}
                                    dataKey="value"
                                    stroke="none"
                                >
                                    {data.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                    <Label
                                        value={`${assignedPercent}%`}
                                        position="center"
                                        className="text-2xl font-bold fill-slate-900"
                                    />
                                    <Label
                                        value="Assigned"
                                        position="center"
                                        dy={20}
                                        className="text-xs fill-slate-500 font-medium"
                                    />
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="flex-1 space-y-3">
                        <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-sm bg-slate-200" />
                                <span className="text-slate-600">Unassigned</span>
                            </div>
                            <span className="font-semibold text-slate-900">{assignmentStats.unassigned}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-sm bg-violet-500" />
                                <span className="text-slate-600">Assigned</span>
                            </div>
                            <span className="font-semibold text-slate-900">{assignmentStats.assigned}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-sm bg-orange-500" />
                                <span className="text-slate-600">Needs reassignment</span>
                            </div>
                            <span className="font-semibold text-slate-900">{assignmentStats.needsReassignment}</span>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Completion Card */}
            <Card className="shadow-sm border-slate-200">
                <CardHeader className="pb-2">
                    <CardTitle className="text-lg font-semibold text-slate-800">Completion</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                   <div className="flex items-end justify-between">
                        <div>
                             <p className="text-sm font-medium text-slate-500">Controls OK</p>
                             <div className="flex items-baseline gap-2">
                                 <h3 className="text-3xl font-bold text-slate-900">{okPercent}%</h3>
                             </div>
                        </div>
                        <div className="text-right">
                            <p className="text-xs text-slate-400 font-medium mb-1">Total Controls</p>
                            <span className="text-lg font-semibold text-slate-900">{completionStats.total} total</span>
                        </div>
                   </div>

                   <Progress value={okPercent} className="h-2 bg-slate-100" indicatorClassName="bg-slate-900" />

                   <div className="grid grid-cols-2 gap-4 pt-2">
                       <div className="bg-slate-50 rounded-lg p-3 border border-slate-100">
                           <div className="flex justify-between items-center mb-2">
                               <span className="text-xs font-semibold text-slate-700">Test</span>
                               <a href="#" className="text-slate-400 hover:text-slate-600"><ArrowUpRight className="h-3 w-3" /></a>
                           </div>
                           <div className="flex justify-between items-end mb-1">
                               <span className="text-xs text-slate-500">{completionStats.testPassed}/{completionStats.testTotal}</span>
                               <span className="text-xs font-bold text-slate-700">{testPercent}%</span>
                           </div>
                           <Progress value={testPercent} className="h-1.5 bg-slate-200" indicatorClassName="bg-green-500" />
                       </div>
                       <div className="bg-slate-50 rounded-lg p-3 border border-slate-100">
                           <div className="flex justify-between items-center mb-2">
                               <span className="text-xs font-semibold text-slate-700">Document</span>
                               <a href="#" className="text-slate-400 hover:text-slate-600"><ArrowUpRight className="h-3 w-3" /></a>
                           </div>
                           <div className="flex justify-between items-end mb-1">
                               <span className="text-xs text-slate-500">{completionStats.documentAttached}/{completionStats.documentTotal}</span>
                               <span className="text-xs font-bold text-slate-700">{docPercent}%</span>
                           </div>
                           <Progress value={docPercent} className="h-1.5 bg-slate-200" indicatorClassName="bg-slate-400" />
                       </div>
                   </div>
                </CardContent>
            </Card>
        </div>
    );
}

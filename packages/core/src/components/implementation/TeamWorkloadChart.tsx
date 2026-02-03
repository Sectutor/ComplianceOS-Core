
import React from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@complianceos/ui/ui/card";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { trpc } from '@/lib/trpc';
import { Users } from 'lucide-react';

interface TeamWorkloadChartProps {
    clientId: number;
}

export const TeamWorkloadChart = ({ clientId }: TeamWorkloadChartProps) => {
    const { data: capacityData, isLoading } = trpc.implementation.getTeamCapacity.useQuery({ clientId });

    if (isLoading) {
        return <div className="text-sm text-slate-500">Loading team capacity...</div>;
    }

    const data = capacityData || [];
    const colors = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];

    return (
        <Card className="border-slate-200 bg-white shadow-sm h-full">
            <CardHeader>
                <div className="flex items-center gap-2">
                    <div className="p-2 bg-purple-50 rounded-lg">
                        <Users className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                        <CardTitle className="text-lg">Team Capacity</CardTitle>
                        <CardDescription>Total estimated hours assigned per team member</CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                {data.length === 0 ? (
                    <div className="h-[200px] flex items-center justify-center text-slate-400">
                        No team assignments yet.
                    </div>
                ) : (
                    <div className="h-[250px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={data} layout="vertical" margin={{ left: 20 }}>
                                <XAxis type="number" hide />
                                <YAxis
                                    dataKey="name"
                                    type="category"
                                    tick={{ fontSize: 12, fill: '#64748b' }}
                                    width={100}
                                />
                                <Tooltip
                                    cursor={{ fill: 'transparent' }}
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                />
                                <Bar dataKey="hours" radius={[0, 4, 4, 0]} barSize={20}>
                                    {data.map((entry: any, index: number) => (
                                        <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                )}
            </CardContent>
        </Card>
    );
};

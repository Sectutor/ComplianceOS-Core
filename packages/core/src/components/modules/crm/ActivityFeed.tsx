import React, { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { Button } from '@complianceos/ui/ui/button';
import { Input } from '@complianceos/ui/ui/input';
import { Label } from '@complianceos/ui/ui/label';
import { Textarea } from '@complianceos/ui/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@complianceos/ui/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@complianceos/ui/ui/card';
import { Mail, Phone, Calendar, CheckSquare, MessageSquare, Clock, Send, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow, format } from 'date-fns';

interface ActivityFeedProps {
    clientId: number;
}

export function ActivityFeed({ clientId }: ActivityFeedProps) {
    const utils = trpc.useUtils();
    const [isLogging, setIsLogging] = useState(false);
    const [formData, setFormData] = useState({
        type: 'note' as const,
        subject: '',
        content: '',
        outcome: ''
    });

    const { data: activities, isLoading } = trpc.crm.getActivities.useQuery({ clientId });
    const logMutation = trpc.crm.logActivity.useMutation({
        onSuccess: () => {
            toast.success('Activity logged');
            utils.crm.getActivities.invalidate();
            setIsLogging(false);
            setFormData({
                type: 'note',
                subject: '',
                content: '',
                outcome: ''
            });
        }
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await logMutation.mutateAsync({
                clientId,
                type: formData.type as any,
                subject: formData.subject,
                content: formData.content,
                outcome: formData.outcome
            });
        } catch (error) {
            toast.error('Failed to log activity');
        }
    };

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'email': return <Mail className="w-4 h-4 text-blue-500" />;
            case 'call': return <Phone className="w-4 h-4 text-green-500" />;
            case 'meeting': return <Calendar className="w-4 h-4 text-purple-500" />;
            case 'task': return <CheckSquare className="w-4 h-4 text-orange-500" />;
            default: return <MessageSquare className="w-4 h-4 text-slate-500" />;
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Activity Timeline</h3>
                <Button
                    variant={isLogging ? "secondary" : "default"}
                    size="sm"
                    onClick={() => setIsLogging(!isLogging)}
                >
                    {isLogging ? 'Cancel' : 'Log Activity'}
                </Button>
            </div>

            {isLogging && (
                <Card className="animate-in slide-in-from-top-4 fade-in duration-300">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base">Log New Interaction</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label>Type</Label>
                                    <Select
                                        value={formData.type}
                                        onValueChange={(val: any) => setFormData({ ...formData, type: val })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="note">Note</SelectItem>
                                            <SelectItem value="call">Call</SelectItem>
                                            <SelectItem value="email">Email</SelectItem>
                                            <SelectItem value="meeting">Meeting</SelectItem>
                                            <SelectItem value="task">Task</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <Label>Subject / Summary</Label>
                                    <Input
                                        placeholder="Brief summary..."
                                        value={formData.subject}
                                        onChange={e => setFormData({ ...formData, subject: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>
                            <div>
                                <Label>Details for Internal Team</Label>
                                <Textarea
                                    placeholder="What happened? What are the next steps?"
                                    value={formData.content}
                                    onChange={e => setFormData({ ...formData, content: e.target.value })}
                                    rows={3}
                                />
                            </div>
                            <div className="flex justify-end pt-2">
                                <Button type="submit" disabled={logMutation.isLoading} className="gap-2 bg-purple-600 hover:bg-purple-700 text-white">
                                    {logMutation.isLoading ? <Loader2 className="animate-spin w-4 h-4" /> : <Send className="w-4 h-4" />}
                                    Log Activity
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            )}

            <div className="relative border-l-2 border-slate-200 dark:border-slate-800 ml-3 space-y-8 pb-4">
                {activities?.map((activity) => (
                    <div key={activity.id} className="relative pl-8 group">
                        {/* Timeline Connector */}
                        <div className="absolute -left-[9px] top-1 bg-background rounded-full border-2 border-indigo-100 dark:border-indigo-900 p-1.5 shadow-sm group-hover:border-indigo-500 transition-colors z-10">
                            {getTypeIcon(activity.type)}
                        </div>

                        <div className="bg-white dark:bg-slate-900 border rounded-xl p-4 shadow-sm hover:shadow-md transition-all group-hover:translate-x-1">
                            <div className="flex justify-between items-start mb-2">
                                <div>
                                    <h4 className="font-semibold text-sm text-foreground">{activity.subject || 'No Subject'}</h4>
                                    <div className="text-xs text-muted-foreground mt-0.5 flex items-center gap-2">
                                        <span className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider">
                                            {activity.type}
                                        </span>
                                        <span>•</span>
                                        <div className="flex items-center gap-1" title={activity.occurredAt ? format(new Date(activity.occurredAt), 'PPpp') : ''}>
                                            <Clock className="w-3 h-3" />
                                            {activity.occurredAt ? formatDistanceToNow(new Date(activity.occurredAt), { addSuffix: true }) : 'Unknown'}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {activity.content && (
                                <p className="text-sm text-slate-600 dark:text-slate-300 mt-2 whitespace-pre-wrap leading-relaxed bg-slate-50 dark:bg-slate-900/50 p-3 rounded-lg border border-transparent group-hover:border-slate-100 dark:group-hover:border-slate-800 transition-colors">
                                    {activity.content}
                                </p>
                            )}

                            {activity.outcome && (
                                <div className="mt-3 flex items-center gap-2">
                                    <span className="text-xs font-medium text-slate-500 uppercase tracking-tighter">Outcome:</span>
                                    <div className="text-xs bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 px-2 py-0.5 rounded-full font-medium border border-green-100 dark:border-green-900/30">
                                        {activity.outcome}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

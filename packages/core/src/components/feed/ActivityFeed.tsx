
import React, { useState } from 'react';
import { trpc } from '../../lib/trpc';
import { Avatar, AvatarFallback } from "@complianceos/ui/ui/avatar";
import { Button } from "@complianceos/ui/ui/button";
import { Textarea } from "@complianceos/ui/ui/textarea";
import { formatDistanceToNow } from 'date-fns';
import { Send, MessageSquare } from 'lucide-react';

interface ActivityFeedProps {
    entityType: 'project_task' | 'remediation' | 'risk_treatment' | 'control' | 'policy';
    entityId: number;
}

export function ActivityFeed({ entityType, entityId }: ActivityFeedProps) {
    const utils = trpc.useContext();
    const [content, setContent] = useState('');

    const { data: comments, isLoading } = trpc.comments.list.useQuery({
        entityType,
        entityId
    });

    const createMutation = trpc.comments.create.useMutation({
        onSuccess: () => {
            setContent('');
            utils.comments.list.invalidate({ entityType, entityId });
        }
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!content.trim()) return;
        createMutation.mutate({ entityType, entityId, content });
    };

    return (
        <div className="flex flex-col h-full bg-slate-50 border-l">
            <div className="p-4 border-b bg-white flex items-center gap-2 text-slate-700 font-semibold">
                <MessageSquare className="h-4 w-4" />
                Comments & Activity
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-6">
                {isLoading ? (
                    <div className="text-center text-sm text-muted-foreground py-8">Loading...</div>
                ) : comments?.length === 0 ? (
                    <div className="text-center text-sm text-slate-400 py-8 italic">
                        No comments yet. Start the conversation!
                    </div>
                ) : (
                    comments?.map((comment) => (
                        <div key={comment.id} className="flex gap-3">
                            <Avatar className="h-8 w-8">
                                <AvatarFallback className="text-xs bg-indigo-100 text-indigo-700">
                                    {comment.user.name?.substring(0, 2).toUpperCase() || 'U'}
                                </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 space-y-1">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-medium text-slate-900">{comment.user.name}</span>
                                    <span className="text-xs text-slate-500">
                                        {formatDistanceToNow(new Date(comment.createdAt || new Date()), { addSuffix: true })}
                                    </span>
                                </div>
                                <div className="text-sm text-slate-700 bg-white p-3 rounded-md border shadow-sm">
                                    {comment.content}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            <div className="p-4 bg-white border-t">
                <form onSubmit={handleSubmit} className="flex gap-2">
                    <Textarea
                        placeholder="Type a message..."
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        className="min-h-[40px] resize-none"
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleSubmit(e);
                            }
                        }}
                    />
                    <Button type="submit" size="icon" disabled={!content.trim() || createMutation.isPending}>
                        <Send className="h-4 w-4" />
                    </Button>
                </form>
            </div>
        </div>
    );
}

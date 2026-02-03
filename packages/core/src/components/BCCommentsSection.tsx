
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@complianceos/ui/ui/button";
import { Textarea } from "@complianceos/ui/ui/textarea";
import { Card, CardHeader, CardTitle, CardContent } from "@complianceos/ui/ui/card";
import { MessageSquare, Trash2, Send } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useAuth } from "@/contexts/AuthContext";
import { useClientContext } from "@/contexts/ClientContext";
import { toast } from "sonner";
import {
    Avatar,
    AvatarFallback,
} from "@complianceos/ui/ui/avatar";

interface BCCommentsSectionProps {
    entityType: 'process' | 'bia' | 'plan' | 'strategy';
    entityId: number;
}

export function BCCommentsSection({ entityType, entityId }: BCCommentsSectionProps) {
    const { user } = useAuth();
    const { selectedClientId } = useClientContext();
    const [newComment, setNewComment] = useState("");

    // Use selectedClientId or user's first client? 
    // BC pages should always have selectedClientId.
    const clientId = selectedClientId;

    const { data: comments, isLoading, refetch } = trpc.businessContinuity.collaboration.getComments.useQuery(
        {
            clientId: clientId as number,
            entityType,
            entityId
        },
        {
            enabled: !!clientId
        }
    );

    const createMutation = trpc.businessContinuity.collaboration.addComment.useMutation({
        onSuccess: () => {
            toast.success("Comment added");
            setNewComment("");
            refetch();
        },
        onError: (err) => {
            toast.error(err.message || "Failed to add comment");
        }
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newComment.trim() || !clientId) return;

        createMutation.mutate({
            clientId,
            entityType,
            entityId,
            content: newComment
        });
    };

    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map(part => part[0])
            .join('')
            .toUpperCase()
            .substring(0, 2);
    };

    if (!clientId) {
        return <div className="text-sm text-red-500">Client context missing for comments</div>;
    }

    return (
        <Card className="mt-6 border shadow-sm">
            <CardHeader className="py-4 bg-muted/20">
                <CardTitle className="flex items-center gap-2 text-base font-medium">
                    <MessageSquare className="h-4 w-4" />
                    Discussion ({comments?.length || 0})
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
                {/* Input Form */}
                <form onSubmit={handleSubmit} className="flex gap-3 items-start mb-6">
                    <Avatar className="h-8 w-8 mt-1">
                        <AvatarFallback>{getInitials(user?.user_metadata?.full_name || user?.email || "?")}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 flex gap-2">
                        <Textarea
                            placeholder="Add a comment..."
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            className="min-h-[40px] flex-1 font-sans text-sm resize-y"
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSubmit(e);
                                }
                            }}
                        />
                        <Button
                            type="submit"
                            disabled={!newComment.trim() || createMutation.isLoading}
                            size="icon"
                            className="h-10 w-10 shrink-0"
                            title="Send Comment"
                        >
                            <Send className="h-4 w-4" />
                        </Button>
                    </div>
                </form>

                {/* Comment List */}
                <div className="space-y-4">
                    {isLoading ? (
                        <div className="text-center text-muted-foreground text-sm py-2">Loading discussion...</div>
                    ) : comments?.length === 0 ? (
                        <div className="text-center text-muted-foreground text-sm py-4 italic">
                            No comments yet. Start the conversation!
                        </div>
                    ) : (
                        comments?.map((item: any) => (
                            <div key={item.id} className="flex gap-3 group">
                                <Avatar className="h-8 w-8">
                                    <AvatarFallback className="text-xs bg-slate-100 text-slate-600">
                                        {getInitials(item.userName || "User")}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="flex-1 bg-muted/10 p-3 rounded-lg border border-transparent hover:border-border transition-colors">
                                    <div className="flex items-center justify-between mb-1">
                                        <div className="flex items-center gap-2">
                                            <span className="font-semibold text-sm text-foreground">{item.userName || "Unknown User"}</span>
                                            <span className="text-xs text-muted-foreground ml-1">
                                                {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
                                            </span>
                                        </div>
                                    </div>
                                    <p className="text-sm text-foreground/90 whitespace-pre-wrap">{item.content}</p>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </CardContent>
        </Card>
    );
}

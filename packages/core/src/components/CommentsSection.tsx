import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@complianceos/ui/ui/button";
import { Textarea } from "@complianceos/ui/ui/textarea";
import { Card, CardHeader, CardTitle, CardContent } from "@complianceos/ui/ui/card";
import { MessageSquare, Trash2, Send, CheckCircle2, Circle, CornerUpLeft, Quote, Target } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import {
    Avatar,
    AvatarFallback,
    AvatarImage
} from "@complianceos/ui/ui/avatar";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@complianceos/ui/ui/alert-dialog";
import { cn } from "@/lib/utils";

interface CommentsSectionProps {
    clientId: number;
    entityType: 'control' | 'policy' | 'evidence';
    entityId: number;
    initialContext?: { quote: string; index: number; length: number };
    onClearContext?: () => void;
    onCommentSelect?: (context: { quote: string; index: number; length: number }) => void;
}

export function CommentsSection({ clientId, entityType, entityId, initialContext, onClearContext, onCommentSelect }: CommentsSectionProps) {
    const { user } = useAuth();
    const [newComment, setNewComment] = useState("");
    const [replyTo, setReplyTo] = useState<number | null>(null);
    const [commentToDelete, setCommentToDelete] = useState<number | null>(null);

    const { data: rawComments, isLoading, refetch } = trpc.comments.list.useQuery({
        clientId,
        entityType,
        entityId
    });

    const createMutation = trpc.comments.create.useMutation({
        onSuccess: () => {
            toast.success("Comment added");
            setNewComment("");
            setReplyTo(null);
            onClearContext?.();
            refetch();
        },
        onError: (err) => {
            toast.error(err.message || "Failed to add comment");
        }
    });

    const resolveMutation = trpc.comments.resolve.useMutation({
        onSuccess: () => {
            toast.success("Status updated");
            refetch();
        },
        onError: (err) => {
            toast.error(err.message || "Failed to update status");
        }
    });

    const deleteMutation = trpc.comments.delete.useMutation({
        onSuccess: () => {
            toast.success("Comment deleted");
            refetch();
        },
        onError: (err) => {
            toast.error(err.message || "Failed to delete comment");
        }
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newComment.trim()) return;

        createMutation.mutate({
            clientId,
            entityType,
            entityId,
            content: newComment,
            parentId: replyTo || undefined,
            context: initialContext
        });
    };

    const handleDelete = (id: number) => {
        setCommentToDelete(id);
    };

    const confirmDelete = () => {
        if (commentToDelete) {
            deleteMutation.mutate({ id: commentToDelete, clientId });
            setCommentToDelete(null);
        }
    };

    const toggleResolve = (id: number, current: boolean) => {
        resolveMutation.mutate({ clientId, id, resolved: !current });
    };

    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map(part => part[0])
            .join('')
            .toUpperCase()
            .substring(0, 2);
    };

    // Organize comments into threads
    const threads = useMemo(() => {
        if (!rawComments) return [];
        const topLevel = rawComments.filter((c: any) => !c.comment.parentId);
        const replies = rawComments.filter((c: any) => c.comment.parentId);

        return topLevel.map((parent: any) => ({
            ...parent,
            replies: replies.filter((r: any) => r.comment.parentId === parent.comment.id).reverse() // Show chronological for replies
        })).sort((a: any, b: any) => new Date(b.comment.createdAt).getTime() - new Date(a.comment.createdAt).getTime()); // Latest first for top level
    }, [rawComments]);

    const renderComment = (item: any, isReply = false) => {
        const { comment, user: commentUser } = item;
        return (
            <div key={comment.id} className={cn("flex gap-3 group", isReply && "ml-11 mt-3")}>
                <Avatar className={cn("h-8 w-8", isReply && "h-6 w-6")}>
                    <AvatarFallback className="text-[10px]">{getInitials(commentUser.name || "User")}</AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <span className="font-medium text-sm">{commentUser.name || "Unknown User"}</span>
                            <span className="text-xs text-muted-foreground">
                                {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                            </span>
                            {comment.isResolved && (
                                <span className="flex items-center gap-1 text-[10px] text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full font-medium">
                                    <CheckCircle2 className="h-2.5 w-2.5" /> Resolved
                                </span>
                            )}
                        </div>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            {!isReply && (
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6"
                                    onClick={() => setReplyTo(replyTo === comment.id ? null : comment.id)}
                                    title="Reply"
                                >
                                    <CornerUpLeft className="h-3 w-3" />
                                </Button>
                            )}
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={() => toggleResolve(comment.id, comment.isResolved)}
                                title={comment.isResolved ? "Unresolve" : "Resolve"}
                            >
                                {comment.isResolved ? <Circle className="h-3 w-3" /> : <CheckCircle2 className="h-3 w-3 text-emerald-600" />}
                            </Button>
                            {(user?.role === 'admin' || user?.role === 'owner' || user?.role === 'super_admin' || user?.id === commentUser.id) && (
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6"
                                    onClick={() => handleDelete(comment.id)}
                                    title="Delete"
                                >
                                    <Trash2 className="h-3 w-3 text-destructive" />
                                </Button>
                            )}
                        </div>
                    </div>

                    {/* Inline Content Context */}
                    {comment.context?.quote && (
                        <div
                            className={cn(
                                "bg-muted/50 border-l-2 border-primary/30 pl-3 py-1.5 my-2 rounded-r-md group/context cursor-pointer hover:bg-muted/80 transition-colors",
                                !onCommentSelect && "cursor-default hover:bg-muted/50"
                            )}
                            onClick={() => onCommentSelect && comment.context && onCommentSelect(comment.context)}
                        >
                            <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-1 uppercase tracking-wider font-semibold">
                                <span className="flex items-center gap-1.5"><Quote className="h-2.5 w-2.5" /> Context</span>
                                {onCommentSelect && <span className="opacity-0 group-hover/context:opacity-100 text-[10px] text-primary transition-opacity flex items-center gap-1">Jump to text <Target className="h-2.5 w-2.5" /></span>}
                            </div>
                            <p className="text-xs italic text-muted-foreground line-clamp-2">"{comment.context.quote}"</p>
                        </div>

                    )}

                    <p className={cn("text-sm leading-relaxed", comment.isResolved && "text-muted-foreground/70 line-through decoration-muted-foreground/30")}>
                        {comment.content}
                    </p>

                    {/* Nested Replies */}
                    {!isReply && item.replies?.map((reply: any) => renderComment(reply, true))}
                </div>
            </div>
        );
    };

    return (
        <Card className="mt-6 overflow-hidden border-primary/10 shadow-sm">
            <CardHeader className="bg-muted/30 pb-4">
                <CardTitle className="flex items-center gap-2 text-lg">
                    <MessageSquare className="h-5 w-5 text-primary" />
                    Collaboration Hub ({rawComments?.length || 0})
                </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
                {/* Comment List */}
                <div className="divide-y divide-muted/50">
                    {isLoading ? (
                        <div className="text-center text-muted-foreground py-12">Loading conversation...</div>
                    ) : rawComments?.length === 0 ? (
                        <div className="text-center text-muted-foreground py-12 bg-muted/5">
                            <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-20" />
                            <p className="text-sm">No feedback yet. Start the sequence!</p>
                        </div>
                    ) : (
                        <div className="max-h-[500px] overflow-y-auto p-6 space-y-6">
                            {threads.map((thread: any) => renderComment(thread))}
                        </div>
                    )}
                </div>

                {/* Input Form */}
                <div className="p-4 bg-muted/20 border-t">
                    {replyTo && (
                        <div className="flex items-center justify-between mb-2 px-3 py-1.5 bg-primary/5 rounded-md text-xs text-primary font-medium animate-in fade-in slide-in-from-bottom-1 border border-primary/10">
                            <span className="flex items-center gap-1.5"><Reply className="h-3 w-3" /> Replying to comment</span>
                            <button
                                className="hover:text-primary/70 font-bold"
                                onClick={() => setReplyTo(null)}
                            >
                                Cancel
                            </button>
                        </div>
                    )}
                    {initialContext && (
                        <div className="flex items-center justify-between mb-2 px-3 py-1.5 bg-blue-50 rounded-md text-xs text-blue-700 font-medium animate-in fade-in slide-in-from-bottom-1 border border-blue-100">
                            <span className="flex items-center gap-1.5 flex-1 min-w-0">
                                <Quote className="h-3 w-3 shrink-0" />
                                <span className="truncate">Context: "{initialContext.quote}"</span>
                            </span>
                            <button
                                className="hover:text-blue-800 font-bold ml-2 shrink-0"
                                onClick={() => onClearContext?.()}
                            >
                                Clear
                            </button>
                        </div>
                    )}
                    <form onSubmit={handleSubmit} className="flex gap-2 items-start">
                        <Textarea
                            placeholder={replyTo ? "Write a reply..." : "Add your feedback or suggest changes..."}
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            className="min-h-[80px] flex-1 font-sans shadow-none focus-visible:ring-primary/20"
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSubmit(e);
                                }
                            }}
                        />
                        <Button
                            type="submit"
                            disabled={!newComment.trim() || createMutation.isPending}
                            size="icon"
                            className="h-[80px] w-12 shrink-0"
                        >
                            <Send className="h-5 w-5" />
                        </Button>
                    </form>
                </div>
            </CardContent>

            <AlertDialog open={!!commentToDelete} onOpenChange={(open) => !open && setCommentToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Feedback?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently remove this comment.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            className="bg-red-600 hover:bg-red-700 text-white"
                            onClick={(e) => {
                                e.preventDefault();
                                confirmDelete();
                            }}
                        >
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </Card >
    );
}

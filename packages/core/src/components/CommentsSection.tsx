import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@complianceos/ui/ui/button";
import { Textarea } from "@complianceos/ui/ui/textarea";
import { Card, CardHeader, CardTitle, CardContent } from "@complianceos/ui/ui/card";
import { MessageSquare, Trash2, Send } from "lucide-react";
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

interface CommentsSectionProps {
    clientId: number;
    entityType: 'control' | 'policy' | 'evidence';
    entityId: number;
}

export function CommentsSection({ clientId, entityType, entityId }: CommentsSectionProps) {
    const { user } = useAuth();
    const [newComment, setNewComment] = useState("");
    const [commentToDelete, setCommentToDelete] = useState<number | null>(null);

    const { data: comments, isLoading, refetch } = trpc.comments.list.useQuery({
        clientId,
        entityType,
        entityId
    });

    const createMutation = trpc.comments.create.useMutation({
        onSuccess: () => {
            toast.success("Comment added");
            setNewComment("");
            refetch();
        },
        onError: (err) => {
            toast.error(err.message || "Failed to add comment");
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
            content: newComment
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

    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map(part => part[0])
            .join('')
            .toUpperCase()
            .substring(0, 2);
    };

    return (
        <Card className="mt-6">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                    <MessageSquare className="h-5 w-5" />
                    Comments ({comments?.length || 0})
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Comment List */}
                <div className="space-y-4">
                    {isLoading ? (
                        <div className="text-center text-muted-foreground py-4">Loading comments...</div>
                    ) : comments?.length === 0 ? (
                        <div className="text-center text-muted-foreground py-4">No comments yet. Start the conversation!</div>
                    ) : (
                        comments?.map((item: any) => (
                            <div key={item.comment.id} className="flex gap-3 group">
                                <Avatar className="h-8 w-8">
                                    <AvatarFallback>{getInitials(item.user.name || "User")}</AvatarFallback>
                                </Avatar>
                                <div className="flex-1 space-y-1">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <span className="font-medium text-sm">{item.user.name || "Unknown User"}</span>
                                            <span className="text-xs text-muted-foreground">
                                                {formatDistanceToNow(new Date(item.comment.createdAt), { addSuffix: true })}
                                            </span>
                                        </div>
                                        {(user?.role === 'admin' || user?.role === 'owner' || user?.role === 'super_admin' || user?.id === item.user.id) && (
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                                                onClick={() => handleDelete(item.comment.id)}
                                            >
                                                <Trash2 className="h-3 w-3 text-destructive" />
                                            </Button>
                                        )}
                                    </div>
                                    <p className="text-sm leading-relaxed">{item.comment.content}</p>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Input Form */}
                <form onSubmit={handleSubmit} className="flex gap-2 items-start mt-4 pt-4 border-t">
                    <Textarea
                        placeholder="Write a comment..."
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        className="min-h-[80px] flex-1 font-sans"
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
                        className="h-[80px] w-12"
                    >
                        <Send className="h-5 w-5" />
                    </Button>
                </form>
            </CardContent>

            <AlertDialog open={!!commentToDelete} onOpenChange={(open) => !open && setCommentToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Comment?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete this comment?
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            className="bg-red-600 hover:bg-red-700"
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

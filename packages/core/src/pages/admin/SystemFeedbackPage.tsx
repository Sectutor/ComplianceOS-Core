import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@complianceos/ui/ui/card";
import { Badge } from "@complianceos/ui/ui/badge";
import { Button } from "@complianceos/ui/ui/button";
import { Textarea } from "@complianceos/ui/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@complianceos/ui/ui/select";
import { Loader2, ExternalLink } from "lucide-react";
import { toast } from "sonner";

export default function SystemFeedbackPage() {
    const { data: feedback, isLoading, refetch } = trpc.feedback.list.useQuery();
    const updateMutation = trpc.feedback.updateStatus.useMutation();

    const [notes, setNotes] = useState<Record<number, string>>({});

    if (isLoading) {
        return (
            <div className="flex items-center justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }

    const handleUpdate = async (id: number, status: string) => {
        try {
            await updateMutation.mutateAsync({
                id,
                status,
                adminNotes: notes[id],
            });
            toast.success("Feedback updated successfully");
            refetch();
        } catch (e: any) {
            toast.error(`Error updating: ${e.message}`);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'new': return 'default';
            case 'evaluated': return 'outline';
            case 'planned': return 'secondary';
            case 'in_progress': return 'primary';
            case 'completed': return 'success';
            case 'rejected': return 'destructive';
            default: return 'outline';
        }
    };

    return (
        <div className="p-6 space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">System Feedback</h1>
                <p className="text-muted-foreground">Manage user bug reports and feature requests.</p>
            </div>

            <div className="grid gap-4">
                {feedback?.map((item) => (
                    <Card key={item.id}>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <div className="space-y-1">
                                <CardTitle className="text-xl flex items-center gap-2">
                                    {item.title}
                                    <Badge variant={getStatusColor(item.status) as any}>{item.status}</Badge>
                                    <Badge variant="outline" className="uppercase">{item.type}</Badge>
                                </CardTitle>
                                <CardDescription>
                                    Reported by: {item.userName || item.userEmail} {item.clientName ? `(${item.clientName})` : ''}
                                    &nbsp;•&nbsp; {format(new Date(item.createdAt), 'PPpp')}
                                </CardDescription>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="bg-muted p-4 rounded-md whitespace-pre-wrap">
                                {item.description}
                            </div>
                            {item.url && (
                                <div>
                                    <a href={item.url} target="_blank" rel="noreferrer" className="text-sm text-blue-500 hover:underline flex items-center gap-1">
                                        <ExternalLink className="h-4 w-4" /> View Origin Page
                                    </a>
                                </div>
                            )}

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t pt-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Status Update</label>
                                    <div className="flex items-center gap-2">
                                        <Select
                                            defaultValue={item.status}
                                            onValueChange={(val) => handleUpdate(item.id, val)}
                                        >
                                            <SelectTrigger className="w-[180px]">
                                                <SelectValue placeholder="Status" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="new">New</SelectItem>
                                                <SelectItem value="evaluated">Evaluated</SelectItem>
                                                <SelectItem value="planned">Planned</SelectItem>
                                                <SelectItem value="in_progress">In Progress</SelectItem>
                                                <SelectItem value="completed">Completed</SelectItem>
                                                <SelectItem value="rejected">Rejected</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Admin Notes</label>
                                    <div className="flex gap-2">
                                        <Textarea
                                            placeholder="Planning details or rejection reason..."
                                            defaultValue={item.adminNotes || ''}
                                            onChange={(e) => setNotes({ ...notes, [item.id]: e.target.value })}
                                        />
                                        <Button
                                            variant="secondary"
                                            onClick={() => handleUpdate(item.id, item.status)}
                                        >
                                            Save Note
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
                {feedback?.length === 0 && (
                    <div className="text-center p-8 text-muted-foreground">
                        No feedback submitted yet.
                    </div>
                )}
            </div>
        </div>
    );
}

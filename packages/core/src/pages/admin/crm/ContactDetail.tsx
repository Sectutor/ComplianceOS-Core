import { useState } from 'react';
import { useParams, useLocation } from 'wouter';
import { trpc } from '@/lib/trpc';
import { Button } from '@complianceos/ui/ui/button';
import { Input } from '@complianceos/ui/ui/input';
import { Textarea } from '@complianceos/ui/ui/textarea';
import { Badge } from '@complianceos/ui/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@complianceos/ui/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@complianceos/ui/ui/tabs';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@complianceos/ui/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@complianceos/ui/ui/select';
import { Label } from '@complianceos/ui/ui/label';
import { toast } from 'sonner';
import {
    ArrowLeft, Phone, Mail, Building2, User, Calendar, Clock, Edit,
    Plus, Trash2, Pin, PhoneCall, Video, MessageSquare, CheckCircle2,
    Tag as TagIcon
} from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@complianceos/ui/ui/dropdown-menu';
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

export default function ContactDetail() {
    const params = useParams<{ id: string }>();
    const [, setLocation] = useLocation();
    const contactId = parseInt(params.id || '0');

    const { data: contact, isLoading, refetch } = trpc.globalCrm.get.useQuery(
        { id: contactId },
        { enabled: contactId > 0 }
    );

    const updateContact = trpc.globalCrm.update.useMutation();
    const addActivity = trpc.globalCrm.addActivity.useMutation();
    const deleteActivity = trpc.globalCrm.deleteActivity.useMutation();
    const completeActivity = trpc.globalCrm.completeActivity.useMutation();
    const addNote = trpc.globalCrm.addNote.useMutation();
    const updateNote = trpc.globalCrm.updateNote.useMutation();
    const deleteNote = trpc.globalCrm.deleteNote.useMutation();

    const addDeal = trpc.globalCrm.addDeal.useMutation();
    const updateDeal = trpc.globalCrm.updateDeal.useMutation();
    const deleteDeal = trpc.globalCrm.deleteDeal.useMutation();
    const addTag = trpc.globalCrm.addTagToContact.useMutation();
    const removeTag = trpc.globalCrm.removeTagFromContact.useMutation();
    const { data: allTags } = trpc.globalCrm.listAllTags.useQuery();

    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isActivityOpen, setIsActivityOpen] = useState(false);
    const [isNoteOpen, setIsNoteOpen] = useState(false);
    const [isDealOpen, setIsDealOpen] = useState(false);

    const [dealForm, setDealForm] = useState({
        name: '',
        value: 0,
        stage: 'discovery' as 'discovery' | 'proposal' | 'negotiation' | 'closed_won' | 'closed_lost',
        probability: 50,
        expectedCloseDate: '',
        description: '',
    });

    const [editingDeal, setEditingDeal] = useState<any>(null);
    const [deleteConfirmation, setDeleteConfirmation] = useState<{ type: 'activity' | 'note' | 'deal', id: number } | null>(null);

    const [editForm, setEditForm] = useState({
        firstName: '',
        lastName: '',
        email: '',
        company: '',
        role: '',
        phone: '',
        status: 'lead',
    });

    const [activityForm, setActivityForm] = useState({
        type: 'call' as 'call' | 'email' | 'meeting' | 'task' | 'other',
        subject: '',
        description: '',
        outcome: '',
    });

    const [noteContent, setNoteContent] = useState('');

    const openEditDialog = () => {
        if (contact) {
            setEditForm({
                firstName: contact.firstName || '',
                lastName: contact.lastName || '',
                email: contact.email || '',
                company: contact.company || '',
                role: contact.role || '',
                phone: contact.phone || '',
                status: contact.status || 'lead',
            });
            setIsEditOpen(true);
        }
    };

    const handleSaveEdit = async () => {
        try {
            await updateContact.mutateAsync({ id: contactId, ...editForm });
            toast.success('Contact updated');
            setIsEditOpen(false);
            refetch();
        } catch (e) {
            toast.error('Failed to update: ' + (e as Error).message);
        }
    };

    const handleAddActivity = async () => {
        try {
            await addActivity.mutateAsync({
                contactId,
                ...activityForm,
            });
            toast.success('Activity logged');
            setIsActivityOpen(false);
            setActivityForm({ type: 'call', subject: '', description: '', outcome: '' });
            refetch();
        } catch (e) {
            toast.error('Failed to add activity: ' + (e as Error).message);
        }
    };

    const confirmDeleteActivity = (id: number) => {
        setDeleteConfirmation({ type: 'activity', id });
    };

    const handleDeleteActivity = async (id: number) => {
        try {
            console.log('Sending delete activity request for id:', id);
            await deleteActivity.mutateAsync({ id });
            toast.success('Activity deleted');
            refetch();
        } catch (e) {
            console.error('Delete activity error:', e);
            toast.error('Failed to delete: ' + (e as Error).message);
        }
    };

    const handleCompleteActivity = async (id: number) => {
        try {
            await completeActivity.mutateAsync({ id });
            toast.success('Task completed');
            refetch();
        } catch (e) {
            toast.error('Failed to complete task');
        }
    };

    const handleAddNote = async () => {
        if (!noteContent.trim()) return;
        try {
            await addNote.mutateAsync({ contactId, content: noteContent });
            toast.success('Note added');
            setIsNoteOpen(false);
            setNoteContent('');
            refetch();
        } catch (e) {
            toast.error('Failed to add note: ' + (e as Error).message);
        }
    };

    const handleTogglePin = async (noteId: number, isPinned: boolean) => {
        try {
            await updateNote.mutateAsync({ id: noteId, isPinned: !isPinned });
            refetch();
        } catch (e) {
            toast.error('Failed to update note');
        }
    };

    const confirmDeleteNote = (id: number) => {
        setDeleteConfirmation({ type: 'note', id });
    };

    const handleDeleteNote = async (id: number) => {
        try {
            console.log('Sending delete note request for id:', id);
            await deleteNote.mutateAsync({ id });
            toast.success('Note deleted');
            refetch();
        } catch (e) {
            console.error('Delete note error:', e);
            toast.error('Failed to delete: ' + (e as Error).message);
        }
    };

    const handleSaveDeal = async () => {
        try {
            if (editingDeal) {
                await updateDeal.mutateAsync({ id: editingDeal.id, ...dealForm });
                toast.success('Deal updated');
            } else {
                await addDeal.mutateAsync({ contactId, ...dealForm });
                toast.success('Deal created');
            }
            setIsDealOpen(false);
            setEditingDeal(null);
            setDealForm({ name: '', value: 0, stage: 'discovery', probability: 50, expectedCloseDate: '', description: '' });
            refetch();
        } catch (e) {
            toast.error('Failed to save deal');
        }
    };

    const confirmDeleteDeal = (id: number) => {
        setDeleteConfirmation({ type: 'deal', id });
    };

    const handleDeleteDeal = async (id: number) => {
        try {
            console.log('Sending delete deal request for id:', id);
            await deleteDeal.mutateAsync({ id });
            toast.success('Deal deleted');
            refetch();
        } catch (e) {
            console.error('Delete deal error:', e);
            toast.error('Failed to delete deal');
        }
    };

    const handleAddTag = async (tagId: number) => {
        try {
            await addTag.mutateAsync({ contactId, tagId });
            refetch();
        } catch (e) {
            toast.error('Failed to add tag');
        }
    };

    const handleRemoveTag = async (tagId: number) => {
        try {
            await removeTag.mutateAsync({ contactId, tagId });
            refetch();
        } catch (e) {
            toast.error('Failed to remove tag');
        }
    };

    const getActivityIcon = (type: string) => {
        switch (type) {
            case 'call': return <PhoneCall className="h-4 w-4 text-green-500" />;
            case 'email': return <Mail className="h-4 w-4 text-blue-500" />;
            case 'meeting': return <Video className="h-4 w-4 text-purple-500" />;
            case 'task': return <CheckCircle2 className="h-4 w-4 text-orange-500" />;
            default: return <MessageSquare className="h-4 w-4 text-gray-500" />;
        }
    };

    const getStatusColor = (status: string | null) => {
        switch (status) {
            case 'lead': return 'bg-primary/20 text-primary border-primary/30';
            case 'prospect': return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
            case 'customer': return 'bg-green-500/20 text-green-400 border-green-500/30';
            case 'churned': return 'bg-red-500/20 text-red-400 border-red-500/30';
            default: return 'bg-gray-500/20 text-gray-400';
        }
    };

    if (isLoading) {
        return (
            <div className="p-6 flex items-center justify-center">
                <div className="animate-pulse text-muted-foreground">Loading contact...</div>
            </div>
        );
    }

    if (!contact) {
        return (
            <div className="p-6">
                <p className="text-muted-foreground">Contact not found</p>
                <Button variant="outline" onClick={() => setLocation('/admin/crm')} className="mt-4">
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back to CRM
                </Button>
            </div>
        );
    }

    const fullName = `${contact.firstName || ''} ${contact.lastName || ''}`.trim() || 'Unnamed Contact';

    const performDelete = () => {
        if (!deleteConfirmation) return;
        if (deleteConfirmation.type === 'activity') {
            handleDeleteActivity(deleteConfirmation.id);
        } else if (deleteConfirmation.type === 'note') {
            handleDeleteNote(deleteConfirmation.id);
        } else if (deleteConfirmation.type === 'deal') {
            handleDeleteDeal(deleteConfirmation.id);
        }
        setDeleteConfirmation(null);
    };

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => setLocation('/admin/crm')}>
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3">
                        <h1 className="text-3xl font-bold truncate">{fullName}</h1>
                        <Badge className={`${getStatusColor(contact.status)} uppercase text-xs`}>
                            {contact.status || 'lead'}
                        </Badge>
                    </div>
                    <div className="flex flex-wrap items-center gap-4 mt-2 text-muted-foreground">
                        <div className="flex items-center gap-1.5">
                            <Building2 className="h-4 w-4" />
                            <span>{contact.company || 'Private'}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <Mail className="h-4 w-4" />
                            <span>{contact.email}</span>
                        </div>
                        {contact.phone && (
                            <div className="flex items-center gap-1.5">
                                <Phone className="h-4 w-4" />
                                <span>{contact.phone}</span>
                            </div>
                        )}
                    </div>

                    {/* Tags Area */}
                    <div className="flex flex-wrap items-center gap-2 mt-4">
                        {contact.tags?.map((t: any) => (
                            <Badge key={t.id} variant="secondary" className="bg-primary/5 text-primary border-primary/20 flex items-center gap-1 px-2 py-0.5">
                                {t.name}
                                <button
                                    onClick={() => handleRemoveTag(t.id)}
                                    className="ml-1 hover:text-destructive transition-colors"
                                >
                                    <Trash2 className="h-3 w-3" />
                                </button>
                            </Badge>
                        ))}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="sm" className="h-7 text-xs gap-1 py-0 px-2 rounded-full border-dashed">
                                    <Plus className="h-3 w-3" /> Add Tag
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="start" className="w-48">
                                <div className="p-2 border-b">
                                    <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Available Tags</p>
                                </div>
                                {allTags?.filter((at: any) => !contact.tags?.some((ct: any) => ct.id === at.id)).map((tag: any) => (
                                    <DropdownMenuItem key={tag.id} onClick={() => handleAddTag(tag.id)}>
                                        <TagIcon className="mr-2 h-3.5 w-3.5" />
                                        {tag.name}
                                    </DropdownMenuItem>
                                ))}
                                {allTags?.length === 0 && (
                                    <p className="p-4 text-center text-xs text-muted-foreground italic">No tags defined</p>
                                )}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>
                <Button variant="outline" onClick={openEditDialog}>
                    <Edit className="mr-2 h-4 w-4" /> Edit
                </Button>
            </div>

            {/* Contact Info Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <Mail className="h-5 w-5 text-muted-foreground" />
                            <div>
                                <p className="text-sm text-muted-foreground">Email</p>
                                <p className="font-medium">{contact.email}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <Phone className="h-5 w-5 text-muted-foreground" />
                            <div>
                                <p className="text-sm text-muted-foreground">Phone</p>
                                <p className="font-medium">{contact.phone || '—'}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <User className="h-5 w-5 text-muted-foreground" />
                            <div>
                                <p className="text-sm text-muted-foreground">Role</p>
                                <p className="font-medium">{contact.role || '—'}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Tabs: Activities, Notes, Deals, Tasks */}
            <Tabs defaultValue="activities" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="activities">
                        Timeline ({contact.activities?.filter((a: any) => !a.scheduledAt || a.completedAt).length || 0})
                    </TabsTrigger>
                    <TabsTrigger value="tasks">
                        Tasks ({contact.activities?.filter((a: any) => a.scheduledAt && !a.completedAt).length || 0})
                    </TabsTrigger>
                    <TabsTrigger value="deals">
                        Deals ({contact.deals?.length || 0})
                    </TabsTrigger>
                    <TabsTrigger value="notes">
                        Notes ({contact.notes?.length || 0})
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="activities" className="space-y-4">
                    <div className="flex justify-between items-center">
                        <h3 className="font-semibold text-lg">Activity History</h3>
                        <Dialog open={isActivityOpen} onOpenChange={setIsActivityOpen}>
                            <DialogTrigger asChild>
                                <Button size="sm">
                                    <Plus className="mr-2 h-4 w-4" /> Log Activity
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Log Activity</DialogTitle>
                                    <DialogDescription>Record an interaction with this contact.</DialogDescription>
                                </DialogHeader>
                                <div className="grid gap-4 py-4">
                                    <div>
                                        <Label>Type</Label>
                                        <Select
                                            value={activityForm.type}
                                            onValueChange={(v: any) => setActivityForm({ ...activityForm, type: v })}
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="call">📞 Call</SelectItem>
                                                <SelectItem value="email">✉️ Email</SelectItem>
                                                <SelectItem value="meeting">🎥 Meeting</SelectItem>
                                                <SelectItem value="task">✅ Task</SelectItem>
                                                <SelectItem value="other">💬 Other</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div>
                                        <Label>Subject</Label>
                                        <Input
                                            value={activityForm.subject}
                                            onChange={(e) => setActivityForm({ ...activityForm, subject: e.target.value })}
                                            placeholder="e.g. Follow-up call"
                                        />
                                    </div>
                                    <div>
                                        <Label>Description</Label>
                                        <Textarea
                                            value={activityForm.description}
                                            onChange={(e) => setActivityForm({ ...activityForm, description: e.target.value })}
                                            rows={3}
                                        />
                                    </div>
                                    <div>
                                        <Label>Outcome</Label>
                                        <Input
                                            value={activityForm.outcome}
                                            onChange={(e) => setActivityForm({ ...activityForm, outcome: e.target.value })}
                                            placeholder="e.g. Left voicemail, Scheduled demo"
                                        />
                                    </div>
                                </div>
                                <div className="flex justify-end gap-2">
                                    <Button variant="outline" onClick={() => setIsActivityOpen(false)}>Cancel</Button>
                                    <Button onClick={handleAddActivity}>Log Activity</Button>
                                </div>
                            </DialogContent>
                        </Dialog>
                    </div>

                    <div className="space-y-4">
                        {contact.activities?.filter((a: any) => !a.scheduledAt || a.completedAt).map((activity: any) => (
                            <div key={activity.id} className="flex gap-4 p-4 border rounded-lg bg-card/50">
                                <div className="mt-1">{getActivityIcon(activity.type)}</div>
                                <div className="flex-1">
                                    <div className="flex justify-between items-start">
                                        <p className="font-medium">{activity.subject || activity.type.toUpperCase()}</p>
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs text-muted-foreground">
                                                {new Date(activity.createdAt).toLocaleDateString()}
                                            </span>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-6 w-6 text-muted-foreground hover:text-destructive"
                                                onClick={() => confirmDeleteActivity(activity.id)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                    <p className="text-sm text-muted-foreground mt-1">{activity.description}</p>
                                    {activity.outcome && (
                                        <Badge variant="outline" className="mt-2 font-normal text-muted-foreground">
                                            Outcome: {activity.outcome}
                                        </Badge>
                                    )}
                                </div>
                            </div>
                        ))}
                        {contact.activities?.filter((a: any) => !a.scheduledAt || a.completedAt).length === 0 && (
                            <p className="text-center py-8 text-muted-foreground italic">No activity history yet.</p>
                        )}
                    </div>
                </TabsContent>

                <TabsContent value="tasks" className="space-y-4">
                    <div className="flex justify-between items-center">
                        <h3 className="font-semibold text-lg">Upcoming Tasks & Reminders</h3>
                        <Button size="sm" onClick={() => setIsActivityOpen(true)}>
                            <Plus className="mr-2 h-4 w-4" /> Add Task
                        </Button>
                    </div>
                    <div className="space-y-4">
                        {contact.activities?.filter((a: any) => a.scheduledAt && !a.completedAt).map((task: any) => (
                            <div key={task.id} className="flex gap-4 p-4 border border-primary/20 bg-primary/5 rounded-lg">
                                <Clock className="h-5 w-5 text-primary mt-1" />
                                <div className="flex-1">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="font-medium">{task.subject || 'Scheduled Task'}</p>
                                            <p className="text-xs text-primary font-medium mt-1">
                                                Due: {new Date(task.scheduledAt).toLocaleString()}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Button variant="outline" size="sm" className="h-8" onClick={() => handleCompleteActivity(task.id)}>
                                                Mark Complete
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-6 w-6 text-muted-foreground"
                                                onClick={() => confirmDeleteActivity(task.id)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                    {task.description && <p className="text-sm text-muted-foreground mt-2">{task.description}</p>}
                                </div>
                            </div>
                        ))}
                        {contact.activities?.filter((a: any) => a.scheduledAt && !a.completedAt).length === 0 && (
                            <div className="text-center py-12 border rounded-lg border-dashed">
                                <Clock className="h-8 w-8 text-muted-foreground mx-auto mb-2 opacity-50" />
                                <p className="text-muted-foreground">No upcoming tasks for this contact.</p>
                                <Button variant="link" onClick={() => setIsActivityOpen(true)}>Schedule follow-up</Button>
                            </div>
                        )}
                    </div>
                </TabsContent>

                <TabsContent value="deals" className="space-y-4">
                    <div className="flex justify-between items-center">
                        <h3 className="font-semibold text-lg">Pipeline Deals</h3>
                        <Button size="sm" onClick={() => { setEditingDeal(null); setIsDealOpen(true); }}>
                            <Plus className="mr-2 h-4 w-4" /> New Deal
                        </Button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {contact.deals?.map((deal: any) => (
                            <Card key={deal.id} className="overflow-hidden border-l-4 border-l-primary">
                                <CardHeader className="pb-2">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <CardTitle className="text-base">{deal.name}</CardTitle>
                                            <CardDescription>${(deal.value / 100).toLocaleString()}</CardDescription>
                                        </div>
                                        <Badge variant="outline" className="capitalize">
                                            {deal.stage.replace('_', ' ')}
                                        </Badge>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex justify-between items-center text-xs text-muted-foreground mb-4">
                                        <span>Probability: {deal.probability}%</span>
                                        <span>Close: {deal.expectedCloseDate ? new Date(deal.expectedCloseDate).toLocaleDateString() : 'TBD'}</span>
                                    </div>
                                    <div className="flex justify-end gap-2">
                                        <Button variant="ghost" size="sm" onClick={() => { setEditingDeal(deal); setDealForm(deal); setIsDealOpen(true); }}>
                                            <Edit className="h-3.5 w-3.5" />
                                        </Button>
                                        <Button variant="ghost" size="sm" onClick={() => confirmDeleteDeal(deal.id)} className="text-destructive">
                                            <Trash2 className="h-3.5 w-3.5" />
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                        {(!contact.deals || contact.deals.length === 0) && (
                            <div className="col-span-full text-center py-12 border rounded-lg border-dashed">
                                <Building2 className="h-8 w-8 text-muted-foreground mx-auto mb-2 opacity-50" />
                                <p className="text-muted-foreground">No active deals found.</p>
                                <Button variant="link" onClick={() => setIsDealOpen(true)}>Create your first deal</Button>
                            </div>
                        )}
                    </div>
                </TabsContent>

                <TabsContent value="notes" className="space-y-4">
                    <div className="flex justify-between items-center">
                        <h3 className="font-semibold text-lg">Internal Notes</h3>
                        <Button size="sm" onClick={() => setIsNoteOpen(true)}>
                            <Plus className="mr-2 h-4 w-4" /> Add Note
                        </Button>
                    </div>

                    <div className="space-y-4">
                        {contact.notes?.map((note: any) => (
                            <div key={note.id} className={`p-4 border rounded-lg bg-card/50 ${note.isPinned ? 'border-primary/50 bg-primary/5' : ''}`}>
                                <div className="flex justify-between items-start gap-4">
                                    <p className="flex-1 whitespace-pre-wrap text-sm">{note.content}</p>
                                    <div className="flex gap-1 shrink-0">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className={`h-8 w-8 ${note.isPinned ? 'text-primary' : 'text-muted-foreground'}`}
                                            onClick={() => handleTogglePin(note.id, note.isPinned)}
                                        >
                                            <Pin className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                            onClick={() => confirmDeleteNote(note.id)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                                <p className="text-[10px] text-muted-foreground mt-2">
                                    {new Date(note.createdAt).toLocaleString()}
                                </p>
                            </div>
                        ))}
                        {contact.notes?.length === 0 && (
                            <p className="text-center py-8 text-muted-foreground italic">No notes for this contact.</p>
                        )}
                    </div>
                </TabsContent>
            </Tabs>

            {/* Deal Dialog */}
            <Dialog open={isDealOpen} onOpenChange={setIsDealOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editingDeal ? 'Edit Deal' : 'New Deal'}</DialogTitle>
                        <DialogDescription>Track a revenue opportunity with this contact.</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div>
                            <Label>Deal Name *</Label>
                            <Input
                                value={dealForm.name}
                                onChange={(e) => setDealForm({ ...dealForm, name: e.target.value })}
                                placeholder="e.g. Q1 Compliance License"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label>Value (USD)</Label>
                                <Input
                                    type="number"
                                    value={dealForm.value / 100}
                                    onChange={(e) => setDealForm({ ...dealForm, value: parseFloat(e.target.value) * 100 })}
                                />
                            </div>
                            <div>
                                <Label>Probability (%)</Label>
                                <Input
                                    type="number"
                                    min="0"
                                    max="100"
                                    value={dealForm.probability}
                                    onChange={(e) => setDealForm({ ...dealForm, probability: parseInt(e.target.value) })}
                                />
                            </div>
                        </div>
                        <div>
                            <Label>Stage</Label>
                            <Select
                                value={dealForm.stage}
                                onValueChange={(v: any) => setDealForm({ ...dealForm, stage: v })}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="discovery">Discovery</SelectItem>
                                    <SelectItem value="proposal">Proposal</SelectItem>
                                    <SelectItem value="negotiation">Negotiation</SelectItem>
                                    <SelectItem value="closed_won">Closed Won</SelectItem>
                                    <SelectItem value="closed_lost">Closed Lost</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label>Expected Close Date</Label>
                            <Input
                                type="date"
                                value={dealForm.expectedCloseDate}
                                onChange={(e) => setDealForm({ ...dealForm, expectedCloseDate: e.target.value })}
                            />
                        </div>
                        <div>
                            <Label>Description</Label>
                            <Textarea
                                value={dealForm.description}
                                onChange={(e) => setDealForm({ ...dealForm, description: e.target.value })}
                                rows={2}
                            />
                        </div>
                    </div>
                    <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => setIsDealOpen(false)}>Cancel</Button>
                        <Button onClick={handleSaveDeal} disabled={!dealForm.name}>
                            {editingDeal ? 'Update Deal' : 'Create Deal'}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Note Dialog */}
            <Dialog open={isNoteOpen} onOpenChange={setIsNoteOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Add Note</DialogTitle>
                        <DialogDescription>Internal notes for the team.</DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        <Textarea
                            value={noteContent}
                            onChange={(e) => setNoteContent(e.target.value)}
                            placeholder="Type your note here..."
                            rows={5}
                        />
                    </div>
                    <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => setIsNoteOpen(false)}>Cancel</Button>
                        <Button onClick={handleAddNote} disabled={!noteContent.trim()}>Save Note</Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Edit Contact Dialog */}
            <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Edit Contact</DialogTitle>
                        <DialogDescription>Update contact information.</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label>First Name</Label>
                                <Input
                                    value={editForm.firstName}
                                    onChange={(e) => setEditForm({ ...editForm, firstName: e.target.value })}
                                />
                            </div>
                            <div>
                                <Label>Last Name</Label>
                                <Input
                                    value={editForm.lastName}
                                    onChange={(e) => setEditForm({ ...editForm, lastName: e.target.value })}
                                />
                            </div>
                        </div>
                        <div>
                            <Label>Email</Label>
                            <Input
                                type="email"
                                value={editForm.email}
                                onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                                required
                            />
                        </div>
                        <div>
                            <Label>Company</Label>
                            <Input
                                value={editForm.company}
                                onChange={(e) => setEditForm({ ...editForm, company: e.target.value })}
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label>Role</Label>
                                <Input
                                    value={editForm.role}
                                    onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                                />
                            </div>
                            <div>
                                <Label>Phone</Label>
                                <Input
                                    value={editForm.phone}
                                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                                />
                            </div>
                        </div>
                        <div>
                            <Label>Status</Label>
                            <Select value={editForm.status} onValueChange={(v) => setEditForm({ ...editForm, status: v })}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="lead">Lead</SelectItem>
                                    <SelectItem value="prospect">Prospect</SelectItem>
                                    <SelectItem value="customer">Customer</SelectItem>
                                    <SelectItem value="churned">Churned</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => setIsEditOpen(false)}>Cancel</Button>
                        <Button onClick={handleSaveEdit} disabled={!editForm.email}>Save Changes</Button>
                    </div>
                </DialogContent>
            </Dialog>

            <AlertDialog open={!!deleteConfirmation} onOpenChange={(open) => !open && setDeleteConfirmation(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete {deleteConfirmation?.type === 'activity' ? 'Activity' : deleteConfirmation?.type === 'note' ? 'Note' : 'Deal'}?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete this {deleteConfirmation?.type}? This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            className="bg-red-600 hover:bg-red-700"
                            onClick={performDelete}
                            disabled={deleteActivity.isPending || deleteNote.isPending || deleteDeal.isPending}
                        >
                            {(deleteActivity.isPending || deleteNote.isPending || deleteDeal.isPending) ? "Deleting..." : "Delete"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}

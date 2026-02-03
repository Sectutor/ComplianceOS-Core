import { useState, useRef } from 'react';
import { useLocation } from 'wouter';
import { trpc } from '@/lib/trpc';
import { Button } from '@complianceos/ui/ui/button';
import { Input } from '@complianceos/ui/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@complianceos/ui/ui/table';
import { Badge } from '@complianceos/ui/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@complianceos/ui/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@complianceos/ui/ui/tabs';
import { toast } from 'sonner';
import { Plus, Trash2, Edit, Search, Download, Upload, LayoutGrid, List, GripVertical, Mail, Phone, Clock, Tag as TagIcon, MoreHorizontal, CheckCircle2 } from 'lucide-react';
import { Checkbox } from '@complianceos/ui/ui/checkbox';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@complianceos/ui/ui/dropdown-menu';
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
import { Textarea } from '@complianceos/ui/ui/textarea';
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

const PIPELINE_STAGES = [
    { key: 'lead', label: 'Leads', color: 'bg-primary' },
    { key: 'prospect', label: 'Prospects', color: 'bg-purple-500' },
    { key: 'customer', label: 'Customers', color: 'bg-green-500' },
    { key: 'churned', label: 'Churned', color: 'bg-red-500' },
];

export default function GlobalCRM() {
    const [, setLocation] = useLocation();
    const { data: contacts, isLoading, refetch } = trpc.globalCrm.list.useQuery();
    const createContact = trpc.globalCrm.create.useMutation();
    const updateContact = trpc.globalCrm.update.useMutation();
    const deleteContact = trpc.globalCrm.remove.useMutation();
    const importCsv = trpc.globalCrm.importCsv.useMutation();

    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [viewMode, setViewMode] = useState<'table' | 'pipeline'>('table');
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [isImportOpen, setIsImportOpen] = useState(false);
    const [editingContact, setEditingContact] = useState<any>(null);
    const [draggedContact, setDraggedContact] = useState<any>(null);
    const [selectedIds, setSelectedIds] = useState<number[]>([]);

    // Deletion State
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [contactToDelete, setContactToDelete] = useState<any>(null);
    const [isBulkDeleteOpen, setIsBulkDeleteOpen] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);

    const bulkUpdateStatus = trpc.globalCrm.bulkUpdateStatus.useMutation();
    const bulkDelete = trpc.globalCrm.bulkDelete.useMutation();
    const { data: allTags } = trpc.globalCrm.listAllTags.useQuery();

    const [tagFilter, setTagFilter] = useState<number | 'all'>('all');

    // Form state
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        company: '',
        role: '',
        phone: '',
        status: 'lead',
        notes: '',
    });

    const resetForm = () => {
        setFormData({
            firstName: '',
            lastName: '',
            email: '',
            company: '',
            role: '',
            phone: '',
            status: 'lead',
            notes: '',
        });
    };

    const handleSubmit = async () => {
        try {
            if (editingContact) {
                await updateContact.mutateAsync({ id: editingContact.id, ...formData });
                toast.success('Contact updated');
            } else {
                await createContact.mutateAsync(formData);
                toast.success('Contact created');
            }
            resetForm();
            setIsAddOpen(false);
            setEditingContact(null);
            refetch();
        } catch (e) {
            toast.error('Failed to save contact: ' + (e as Error).message);
        }
    };

    const handleDelete = (contact: any, e: React.MouseEvent | React.KeyboardEvent) => {
        // Just open the dialog
        e.stopPropagation(); // Stop row click
        setContactToDelete(contact);
        setIsDeleteOpen(true);
    };

    const confirmDelete = async (e: React.MouseEvent) => {
        e.preventDefault(); // Prevent dialog auto-close if we wait
        if (!contactToDelete) return;

        try {
            await deleteContact.mutateAsync({ id: contactToDelete.id });
            toast.success('Contact deleted');
            setIsDeleteOpen(false);
            setContactToDelete(null);
            refetch();
        } catch (e) {
            console.error('Delete error:', e);
            toast.error('Failed to delete: ' + (e as Error).message);
        }
    };

    const handleEdit = (contact: any, e: React.MouseEvent) => {
        e.stopPropagation();
        setEditingContact(contact);
        setFormData({
            firstName: contact.firstName || '',
            lastName: contact.lastName || '',
            email: contact.email || '',
            company: contact.company || '',
            role: contact.role || '',
            phone: contact.phone || '',
            status: contact.status || 'lead',
            notes: contact.notes || '',
        });
        setIsAddOpen(true);
    };

    const handleRowClick = (contactId: number) => {
        setLocation(`/admin/crm/${contactId}`);
    };

    const handleToggleSelect = (id: number) => {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            setSelectedIds(filteredContacts.map(c => c.id));
        } else {
            setSelectedIds([]);
        }
    };

    const handleBulkStatusChange = async (status: string) => {
        if (selectedIds.length === 0) return;
        try {
            await bulkUpdateStatus.mutateAsync({ ids: selectedIds, status });
            toast.success(`Updated ${selectedIds.length} contacts`);
            setSelectedIds([]);
            refetch();
        } catch (e) {
            toast.error('Bulk update failed');
        }
    };

    const handleBulkDelete = () => {
        if (selectedIds.length === 0) return;
        setIsBulkDeleteOpen(true);
    };

    const confirmBulkDelete = async (e: React.MouseEvent) => {
        e.preventDefault();
        try {
            await bulkDelete.mutateAsync({ ids: selectedIds });
            toast.success(`Deleted ${selectedIds.length} contacts`);
            setSelectedIds([]);
            setIsBulkDeleteOpen(false);
            refetch();
        } catch (e) {
            toast.error('Bulk delete failed');
        }
    };

    const handleQuickAction = (contact: any, action: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (action === 'email') {
            window.location.href = `mailto:${contact.email}`;
        } else if (action === 'call') {
            window.location.href = `tel:${contact.phone || ''}`;
        } else if (action === 'task') {
            setLocation(`/admin/crm/${contact.id}?action=add_task`);
        }
    };

    const handleExportCSV = () => {
        if (!contacts?.length) return;
        const headers = ['First Name', 'Last Name', 'Email', 'Company', 'Role', 'Phone', 'Status', 'Source', 'Notes'];
        const rows = contacts.map(c => [
            c.firstName || '',
            c.lastName || '',
            c.email,
            c.company || '',
            c.role || '',
            c.phone || '',
            c.status || '',
            c.source || '',
            c.notes || '',
        ]);
        const csv = [headers, ...rows].map(r => r.map(v => `"${v}"`).join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `global-crm-contacts-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
    };

    const handleImportCSV = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const text = e.target?.result as string;
                const lines = text.split('\n').filter(l => l.trim());
                const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/['"]/g, ''));

                const contacts = lines.slice(1).map(line => {
                    const values = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || [];
                    const cleanValues = values.map(v => v.replace(/^["']|["']$/g, '').trim());

                    const contact: any = {};
                    headers.forEach((h, i) => {
                        const value = cleanValues[i] || '';
                        if (h.includes('first')) contact.firstName = value;
                        else if (h.includes('last')) contact.lastName = value;
                        else if (h.includes('email')) contact.email = value;
                        else if (h.includes('company')) contact.company = value;
                        else if (h.includes('role') || h.includes('title')) contact.role = value;
                        else if (h.includes('phone')) contact.phone = value;
                        else if (h.includes('status')) contact.status = value;
                    });
                    return contact;
                }).filter(c => c.email);

                const result = await importCsv.mutateAsync({ contacts });
                toast.success(`Imported ${result.imported} contacts, skipped ${result.skipped} duplicates`);
                if (result.errors.length > 0) {
                    console.error('Import errors:', result.errors);
                }
                setIsImportOpen(false);
                refetch();
            } catch (e) {
                toast.error('Failed to import: ' + (e as Error).message);
            }
        };
        reader.readAsText(file);
        event.target.value = ''; // Reset file input
    };

    const handleDragStart = (contact: any) => {
        setDraggedContact(contact);
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
    };

    const handleDrop = async (stage: string) => {
        if (!draggedContact || draggedContact.status === stage) return;

        try {
            await updateContact.mutateAsync({ id: draggedContact.id, status: stage });
            toast.success(`Moved to ${stage}`);
            refetch();
        } catch (e) {
            toast.error('Failed to update stage');
        }
        setDraggedContact(null);
    };

    const filteredContacts = contacts?.filter(c => {
        const matchesSearch = searchTerm === '' ||
            c.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (c.firstName?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
            (c.lastName?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
            (c.company?.toLowerCase() || '').includes(searchTerm.toLowerCase());

        const matchesStatus = statusFilter === 'all' || c.status === statusFilter;

        const matchesTag = tagFilter === 'all' || c.tags?.some((t: any) => t.id === tagFilter);

        return matchesSearch && matchesStatus && matchesTag;
    }) || [];

    const getStatusBadge = (status: string | null) => {
        const statusColors: Record<string, string> = {
            lead: 'bg-primary/20 text-primary border-primary/30',
            prospect: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
            customer: 'bg-green-500/20 text-green-400 border-green-500/30',
            churned: 'bg-red-500/20 text-red-400 border-red-500/30',
        };
        return (
            <Badge className={`${statusColors[status || 'lead'] || 'bg-gray-500/20'} uppercase text-xs`}>
                {status || 'lead'}
            </Badge>
        );
    };

    const getSourceBadge = (source: string | null) => {
        if (source === 'waitlist') {
            return <Badge variant="outline" className="text-amber-400 border-amber-400/30">Waitlist</Badge>;
        }
        if (source === 'import') {
            return <Badge variant="outline" className="text-cyan-400 border-cyan-400/30">Import</Badge>;
        }
        return <Badge variant="outline" className="text-gray-400">Manual</Badge>;
    };

    const getContactsByStage = (stage: string) => {
        return filteredContacts.filter(c => (c.status || 'lead') === stage);
    };

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold">Global CRM</h1>
                    <p className="text-muted-foreground">Manage platform-wide contacts and sales leads</p>
                </div>
                <div className="flex gap-2">
                    {/* View Toggle */}
                    <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as 'table' | 'pipeline')}>
                        <TabsList>
                            <TabsTrigger value="table">
                                <List className="h-4 w-4 mr-1" /> Table
                            </TabsTrigger>
                            <TabsTrigger value="pipeline">
                                <LayoutGrid className="h-4 w-4 mr-1" /> Pipeline
                            </TabsTrigger>
                        </TabsList>
                    </Tabs>

                    <Button variant="outline" onClick={() => setIsImportOpen(true)}>
                        <Upload className="mr-2 h-4 w-4" />
                        Import
                    </Button>
                    <Button variant="outline" onClick={handleExportCSV} disabled={!contacts?.length}>
                        <Download className="mr-2 h-4 w-4" />
                        Export
                    </Button>
                    <Dialog open={isAddOpen} onOpenChange={(open) => {
                        setIsAddOpen(open);
                        if (!open) {
                            setEditingContact(null);
                            resetForm();
                        }
                    }}>
                        <DialogTrigger asChild>
                            <Button>
                                <Plus className="mr-2 h-4 w-4" />
                                Add Contact
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-md">
                            <DialogHeader>
                                <DialogTitle>{editingContact ? 'Edit Contact' : 'Add New Contact'}</DialogTitle>
                                <DialogDescription>
                                    {editingContact ? 'Update the contact information below.' : 'Fill in the details to create a new contact.'}
                                </DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Label>First Name</Label>
                                        <Input
                                            value={formData.firstName}
                                            onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <Label>Last Name</Label>
                                        <Input
                                            value={formData.lastName}
                                            onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <Label>Email *</Label>
                                    <Input
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        required
                                    />
                                </div>
                                <div>
                                    <Label>Company</Label>
                                    <Input
                                        value={formData.company}
                                        onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Label>Role</Label>
                                        <Input
                                            value={formData.role}
                                            onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <Label>Phone</Label>
                                        <Input
                                            value={formData.phone}
                                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <Label>Status</Label>
                                    <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v })}>
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
                                <div>
                                    <Label>Notes</Label>
                                    <Textarea
                                        value={formData.notes}
                                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                        rows={3}
                                    />
                                </div>
                            </div>
                            <div className="flex justify-end gap-2">
                                <Button variant="outline" onClick={() => setIsAddOpen(false)}>Cancel</Button>
                                <Button onClick={handleSubmit} disabled={!formData.email}>
                                    {editingContact ? 'Save Changes' : 'Create Contact'}
                                </Button>
                            </div>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            {/* Filters */}
            <div className="flex gap-4 items-center">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search contacts..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                    />
                </div>
                {viewMode === 'table' && (
                    <div className="flex gap-2">
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger className="w-40">
                                <SelectValue placeholder="Filter by status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Statuses</SelectItem>
                                <SelectItem value="lead">Lead</SelectItem>
                                <SelectItem value="prospect">Prospect</SelectItem>
                                <SelectItem value="customer">Customer</SelectItem>
                                <SelectItem value="churned">Churned</SelectItem>
                            </SelectContent>
                        </Select>

                        <Select value={tagFilter.toString()} onValueChange={(v) => setTagFilter(v === 'all' ? 'all' : parseInt(v))}>
                            <SelectTrigger className="w-44">
                                <div className="flex items-center gap-2">
                                    <TagIcon className="h-4 w-4 text-muted-foreground" />
                                    <SelectValue placeholder="Filter by tag" />
                                </div>
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Tags</SelectItem>
                                {allTags?.map((tag: any) => (
                                    <SelectItem key={tag.id} value={tag.id.toString()}>
                                        {tag.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                )}
                <div className="text-sm text-muted-foreground">
                    {filteredContacts.length} contact{filteredContacts.length !== 1 ? 's' : ''}
                </div>
            </div>

            {/* Table View */}
            {viewMode === 'table' && (
                <div className="border rounded-lg">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-10">
                                    <Checkbox
                                        checked={selectedIds.length === filteredContacts.length && filteredContacts.length > 0}
                                        onCheckedChange={(checked) => handleSelectAll(!!checked)}
                                    />
                                </TableHead>
                                <TableHead>Name</TableHead>
                                <TableHead>Email</TableHead>
                                <TableHead>Company</TableHead>
                                <TableHead>Tags</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Date Added</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                                        Loading contacts...
                                    </TableCell>
                                </TableRow>
                            ) : filteredContacts.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                                        {contacts?.length === 0 ? 'No contacts yet. Add one to get started!' : 'No matching contacts found.'}
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredContacts.map((contact) => (
                                    <TableRow
                                        key={contact.id}
                                        className={`cursor-pointer hover:bg-muted/50 ${selectedIds.includes(contact.id) ? 'bg-muted/40' : ''}`}
                                        onClick={() => handleRowClick(contact.id)}
                                    >
                                        <TableCell onClick={(e) => e.stopPropagation()}>
                                            <Checkbox
                                                checked={selectedIds.includes(contact.id)}
                                                onCheckedChange={() => handleToggleSelect(contact.id)}
                                            />
                                        </TableCell>
                                        <TableCell className="font-medium">
                                            {contact.firstName || contact.lastName
                                                ? `${contact.firstName || ''} ${contact.lastName || ''}`.trim()
                                                : '—'}
                                        </TableCell>
                                        <TableCell>{contact.email}</TableCell>
                                        <TableCell>{contact.company || '—'}</TableCell>
                                        <TableCell>
                                            <div className="flex flex-wrap gap-1 max-w-[150px]">
                                                {contact.tags?.map((t: any) => (
                                                    <Badge key={t.id} variant="outline" className="px-1.5 py-0 text-[10px] bg-primary/5 text-primary border-primary/20">
                                                        {t.name}
                                                    </Badge>
                                                ))}
                                                {(!contact.tags || contact.tags.length === 0) && <span className="text-xs text-muted-foreground">—</span>}
                                            </div>
                                        </TableCell>
                                        <TableCell>{getStatusBadge(contact.status)}</TableCell>
                                        <TableCell>
                                            {contact.createdAt ? new Date(contact.createdAt).toLocaleDateString() : '—'}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex gap-1 justify-end">
                                                <Button variant="ghost" size="sm" onClick={(e) => handleQuickAction(contact, 'email', e)} title="Send Email" className="h-8 w-8 p-0">
                                                    <Mail className="h-4 w-4" />
                                                </Button>
                                                <Button variant="ghost" size="sm" onClick={(e) => handleQuickAction(contact, 'call', e)} title="Call" className="h-8 w-8 p-0">
                                                    <Phone className="h-4 w-4" />
                                                </Button>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                                            <MoreHorizontal className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem onClick={(e) => handleEdit(contact, e)}>
                                                            <Edit className="mr-2 h-4 w-4" /> Edit
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={(e) => handleQuickAction(contact, 'task', e)}>
                                                            <Clock className="mr-2 h-4 w-4" /> Log Task
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onSelect={(e) => handleDelete(contact, e as any)} className="text-destructive">
                                                            <Trash2 className="mr-2 h-4 w-4" /> Delete
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            )}

            {/* Pipeline View */}
            {viewMode === 'pipeline' && (
                <div className="grid grid-cols-4 gap-4">
                    {PIPELINE_STAGES.map((stage) => (
                        <div
                            key={stage.key}
                            className="space-y-3"
                            onDragOver={handleDragOver}
                            onDrop={() => handleDrop(stage.key)}
                        >
                            <div className="flex items-center gap-2">
                                <div className={`h-3 w-3 rounded-full ${stage.color}`} />
                                <h3 className="font-semibold">{stage.label}</h3>
                                <Badge variant="secondary" className="ml-auto">
                                    {getContactsByStage(stage.key).length}
                                </Badge>
                            </div>
                            <div className="space-y-2 min-h-[200px] bg-muted/30 rounded-lg p-2">
                                {getContactsByStage(stage.key).map((contact) => (
                                    <Card
                                        key={contact.id}
                                        draggable
                                        onDragStart={() => handleDragStart(contact)}
                                        className="cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow"
                                        onClick={() => handleRowClick(contact.id)}
                                    >
                                        <CardContent className="p-3">
                                            <div className="flex items-start gap-2">
                                                <GripVertical className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                                                <div className="min-w-0 flex-1">
                                                    <p className="font-medium truncate">
                                                        {contact.firstName || contact.lastName
                                                            ? `${contact.firstName || ''} ${contact.lastName || ''}`.trim()
                                                            : contact.email}
                                                    </p>
                                                    {contact.company && (
                                                        <p className="text-sm text-muted-foreground truncate">{contact.company}</p>
                                                    )}
                                                    <p className="text-xs text-muted-foreground truncate mt-1">{contact.email}</p>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                                {getContactsByStage(stage.key).length === 0 && (
                                    <div className="text-center text-muted-foreground text-sm py-8">
                                        No {stage.label.toLowerCase()}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Import Dialog */}
            <Dialog open={isImportOpen} onOpenChange={setIsImportOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Import Contacts from CSV</DialogTitle>
                        <DialogDescription>
                            Upload a CSV file to bulk import contacts into the CRM.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <p className="text-sm text-muted-foreground">
                            Upload a CSV file with columns: First Name, Last Name, Email, Company, Role, Phone, Status
                        </p>
                        <p className="text-sm text-muted-foreground">
                            <strong>Required:</strong> Email column<br />
                            Duplicate emails will be skipped.
                        </p>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".csv"
                            onChange={handleImportCSV}
                            className="hidden"
                        />
                        <Button onClick={() => fileInputRef.current?.click()} className="w-full">
                            <Upload className="mr-2 h-4 w-4" />
                            Select CSV File
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Bulk Action Toolbar */}
            {selectedIds.length > 0 && (
                <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-popover border shadow-2xl rounded-full px-6 py-3 flex items-center gap-6 animate-in slide-in-from-bottom-4 duration-300 z-50">
                    <div className="flex items-center gap-2 border-r pr-6">
                        <span className="bg-primary text-primary-foreground h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold">
                            {selectedIds.length}
                        </span>
                        <span className="text-sm font-medium">Selected</span>
                    </div>

                    <div className="flex items-center gap-4">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-9 px-3 gap-2">
                                    <CheckCircle2 className="h-4 w-4" />
                                    Change Status
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                                <DropdownMenuItem onClick={() => handleBulkStatusChange('lead')}>Lead</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleBulkStatusChange('prospect')}>Prospect</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleBulkStatusChange('customer')}>Customer</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleBulkStatusChange('churned')}>Churned</DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>

                        <Button variant="ghost" size="sm" className="h-9 px-3 gap-2 text-destructive hover:text-destructive" onClick={handleBulkDelete}>
                            <Trash2 className="h-4 w-4" />
                            Delete
                        </Button>

                        <Button variant="ghost" size="sm" className="h-9 px-3" onClick={() => setSelectedIds([])}>
                            Cancel
                        </Button>
                    </div>
                </div>
            )}
            {/* Confirmation Dialogs */}
            <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Contact?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete <strong>{contactToDelete?.firstName} {contactToDelete?.lastName}</strong>? This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={confirmDelete}
                            className="bg-red-600 hover:bg-red-700"
                            disabled={deleteContact.isPending}
                        >
                            {deleteContact.isPending ? 'Deleting...' : 'Delete'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <AlertDialog open={isBulkDeleteOpen} onOpenChange={setIsBulkDeleteOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Multiple Contacts?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete <strong>{selectedIds.length}</strong> contacts? This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={confirmBulkDelete}
                            className="bg-red-600 hover:bg-red-700"
                            disabled={bulkDelete.isPending}
                        >
                            {bulkDelete.isPending ? 'Deleting...' : 'Delete All'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}

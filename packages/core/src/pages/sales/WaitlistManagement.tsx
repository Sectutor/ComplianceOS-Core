import React from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { trpc } from '@/lib/trpc';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from '@complianceos/ui/ui/table';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from '@complianceos/ui/ui/dropdown-menu';
import { Button } from '@complianceos/ui/ui/button';
import { MoreHorizontal, Download, Trash2, UserPlus, Mail } from 'lucide-react';
import { Badge } from '@complianceos/ui/ui/badge';
import { toast } from 'sonner';

export default function WaitlistManagement() {
    const { data: leads, isLoading, refetch } = trpc.waitlist.list.useQuery();
    const { data: clients } = trpc.clients.list.useQuery();
    const updateStatus = trpc.waitlist.updateStatus.useMutation();
    const deleteLead = trpc.waitlist.remove.useMutation();
    const convertToGlobalCrm = trpc.globalCrm.convertFromWaitlist.useMutation();

    const handleStatusChange = async (id: number, status: string) => {
        console.log("Updating status for:", id, "to", status);
        try {
            await updateStatus.mutateAsync({ id, status });
            console.log("Status updated successfully");
            toast.success('Status updated');
            refetch();
        } catch (e) {
            console.error("Status update failed:", e);
            toast.error('Failed to update status');
        }
    };

    const handleDelete = async (id: number) => {
        // Temporarily removed confirm dialog for testing
        try {
            await deleteLead.mutateAsync({ id });
            toast.success('Lead deleted');
            refetch();
        } catch (e) {
            toast.error('Failed to delete lead: ' + (e as Error).message);
        }
    };

    const handleConvertToLead = async (lead: any) => {
        try {
            const result = await convertToGlobalCrm.mutateAsync({
                firstName: lead.firstName || '',
                lastName: lead.lastName || '',
                email: lead.email,
                company: lead.company || '',
                role: lead.role || '',
            });
            await updateStatus.mutateAsync({ id: lead.id, status: 'converted' });

            if (result.alreadyExisted) {
                toast.info('Contact already exists in Global CRM');
            } else {
                toast.success('Converted to Global CRM contact');
            }
            refetch();
        } catch (e) {
            console.error("Conversion failed:", e);
            toast.error('Failed to convert: ' + (e as Error).message);
        }
    };

    const exportCsv = () => {
        if (!leads) return;
        const headers = ['First Name', 'Last Name', 'Email', 'Company', 'Industry', 'Org Size', 'Certification', 'Status', 'Date'];
        const csvContent = [
            headers.join(','),
            ...leads.map((l: any) => [
                l.firstName,
                l.lastName,
                `"${l.email}"`,
                `"${l.company}"`,
                l.industry,
                l.orgSize,
                l.certification,
                l.status,
                new Date(l.createdAt).toLocaleDateString()
            ].join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `waitlist_leads_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <DashboardLayout>
            <div className="flex justify-between items-center mb-6">
                <div>
                    <div className="flex items-center gap-3">
                        <h1 className="text-3xl font-bold tracking-tight">Waitlist Management</h1>
                        <Badge className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white border-none px-3 py-1 text-[10px] font-bold tracking-widest shadow-lg shadow-indigo-200 uppercase">
                            Premium
                        </Badge>
                    </div>
                    <p className="text-muted-foreground">Review and manage early access requests.</p>
                </div>
                <Button onClick={exportCsv} variant="outline" className="gap-2">
                    <Download className="h-4 w-4" />
                    Export CSV
                </Button>
            </div>

            <div className="border rounded-lg bg-card">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Contact</TableHead>
                            <TableHead>Company</TableHead>
                            <TableHead>Details</TableHead>
                            <TableHead>Target Cert</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                                    Loading leads...
                                </TableCell>
                            </TableRow>
                        ) : leads?.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                                    No leads yet.
                                </TableCell>
                            </TableRow>
                        ) : (
                            leads?.map((lead: any) => (
                                <TableRow key={lead.id}>
                                    <TableCell>
                                        <div className="font-medium">{lead.firstName} {lead.lastName}</div>
                                        <div className="text-sm text-muted-foreground flex items-center gap-1">
                                            <Mail className="h-3 w-3" />
                                            {lead.email}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="font-medium">{lead.company || 'N/A'}</div>
                                        <div className="text-xs text-muted-foreground">{lead.industry || lead.orgSize ? `${lead.industry} • ${lead.orgSize}` : ''}</div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="text-xs">
                                            {lead.role && <div>Role: {lead.role}</div>}
                                            {lead.source && <div>Src: {lead.source}</div>}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                                            {lead.certification || 'Any'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <Badge
                                            variant={lead.status === 'converted' ? 'success' : lead.status === 'pending' ? 'secondary' : 'default'}
                                            className={lead.status === 'contacted' ? 'bg-amber-100 text-amber-700 border-amber-200' : ''}
                                        >
                                            {lead.status?.toUpperCase()}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-muted-foreground text-sm">
                                        {new Date(lead.createdAt).toLocaleDateString()}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onClick={() => handleConvertToLead(lead)} disabled={lead.status === 'converted'}>
                                                    <UserPlus className="mr-2 h-4 w-4" />
                                                    Convert to Contact
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => handleStatusChange(lead.id, 'contacted')}>
                                                    Mark as Contacted
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => handleStatusChange(lead.id, 'pending')}>
                                                    Reset to Pending
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => handleDelete(lead.id)} className="text-destructive">
                                                    <Trash2 className="mr-2 h-4 w-4" />
                                                    Delete Lead
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </DashboardLayout>
    );
}

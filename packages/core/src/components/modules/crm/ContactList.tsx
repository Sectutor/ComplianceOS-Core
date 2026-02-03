import React, { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { Button } from '@complianceos/ui/ui/button';
import { Input } from '@complianceos/ui/ui/input';
import { Label } from '@complianceos/ui/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@complianceos/ui/ui/card';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@complianceos/ui/ui/sheet";
import { User, Mail, Phone, Briefcase, Plus, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface ContactListProps {
    clientId: number;
    mini?: boolean;
}

export function ContactList({ clientId, mini = false }: ContactListProps) {
    const utils = trpc.useUtils();
    const [isOpen, setIsOpen] = useState(false);
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        jobTitle: '',
        category: 'general',
        linkedInUrl: '',
        notes: ''
    });

    const { data: contacts, isLoading } = trpc.crm.getContacts.useQuery({ clientId });
    const createMutation = trpc.crm.createContact.useMutation({
        onSuccess: () => {
            toast.success('Contact added');
            utils.crm.getContacts.invalidate();
            setIsOpen(false);
            setFormData({
                firstName: '',
                lastName: '',
                email: '',
                phone: '',
                jobTitle: '',
                category: 'general',
                linkedInUrl: '',
                notes: ''
            });
        }
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await createMutation.mutateAsync({
                clientId,
                ...formData
            });
        } catch (error) {
            toast.error('Failed to create contact');
        }
    };

    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

    if (isLoading) return <div className="p-4 flex justify-center"><Loader2 className="animate-spin text-muted-foreground" /></div>;

    if (mini) {
        return (
            <div className="space-y-4">
                {contacts?.slice(0, 5).map(contact => (
                    <div key={contact.id} className="flex items-center gap-3 p-2 hover:bg-white/50 dark:hover:bg-white/5 rounded-lg transition-colors cursor-pointer group">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-400 to-purple-400 flex items-center justify-center text-white text-xs font-bold shadow-sm">
                            {contact.firstName[0]}{contact.lastName[0]}
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm truncate">{contact.firstName} {contact.lastName}</div>
                            <div className="text-xs text-muted-foreground truncate">{contact.jobTitle || 'No Title'}</div>
                        </div>
                        <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Mail className="w-3 h-3 text-muted-foreground" />
                        </Button>
                    </div>
                ))}
                <Button variant="ghost" size="sm" className="w-full text-xs text-muted-foreground mt-2">View All Contacts</Button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-4">
                    <h3 className="text-lg font-medium">All Contacts ({contacts?.length || 0})</h3>
                    <div className="flex items-center border rounded-md p-1 bg-muted/20">
                        <Button
                            variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                            size="sm"
                            className="h-7 px-2"
                            onClick={() => setViewMode('grid')}
                        >
                            Grid
                        </Button>
                        <Button
                            variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                            size="sm"
                            className="h-7 px-2"
                            onClick={() => setViewMode('list')}
                        >
                            List
                        </Button>
                    </div>
                </div>

                <Sheet open={isOpen} onOpenChange={setIsOpen}>
                    <SheetTrigger asChild>
                        <Button size="sm" className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm">
                            <Plus className="w-4 h-4" /> Add Contact
                        </Button>
                    </SheetTrigger>
                    <SheetContent>
                        <SheetHeader>
                            <SheetTitle>Add New Contact</SheetTitle>
                        </SheetHeader>
                        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <Label>First Name *</Label>
                                    <Input required value={formData.firstName} onChange={e => setFormData({ ...formData, firstName: e.target.value })} />
                                </div>
                                <div>
                                    <Label>Last Name *</Label>
                                    <Input required value={formData.lastName} onChange={e => setFormData({ ...formData, lastName: e.target.value })} />
                                </div>
                            </div>
                            <div>
                                <Label>Email</Label>
                                <Input type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
                            </div>
                            <div>
                                <Label>Phone</Label>
                                <Input value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} />
                            </div>
                            <div>
                                <Label>Job Title</Label>
                                <Input value={formData.jobTitle} onChange={e => setFormData({ ...formData, jobTitle: e.target.value })} />
                            </div>
                            <div>
                                <Label>Category</Label>
                                <select
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                                    value={formData.category}
                                    onChange={e => setFormData({ ...formData, category: e.target.value })}
                                >
                                    <option value="general">General</option>
                                    <option value="billing">Billing</option>
                                    <option value="technical">Technical</option>
                                    <option value="executive">Executive</option>
                                    <option value="champion">Champion</option>
                                </select>
                            </div>
                            <Button type="submit" disabled={createMutation.isLoading} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white">
                                {createMutation.isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                Save Contact
                            </Button>
                        </form>
                    </SheetContent>
                </Sheet>
            </div>

            <div className={`
                ${viewMode === 'grid'
                    ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
                    : "flex flex-col gap-3"
                }
            `}>
                {contacts?.map(contact => (
                    <Card key={contact.id} className={`
                        group relative overflow-hidden transition-all duration-300
                        ${viewMode === 'grid'
                            ? "hover:shadow-lg hover:-translate-y-1 border-transparent/50 bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-800/80"
                            : "flex-row items-center p-3 hover:bg-muted/30"
                        }
                    `}>
                        {/* Decorative top bar for grid view */}
                        {viewMode === 'grid' && (
                            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                        )}

                        <CardContent className={viewMode === 'grid' ? "p-5" : "p-0 flex items-center w-full gap-4"}>
                            <div className="flex items-start justify-between w-full">
                                <div className={`flex ${viewMode === 'grid' ? 'flex-col items-center text-center w-full' : 'items-center gap-4'}`}>
                                    <div className={`
                                        rounded-full bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 
                                        flex items-center justify-center text-slate-600 dark:text-slate-300 font-bold shadow-inner
                                        ${viewMode === 'grid' ? "w-16 h-16 mb-3 text-xl" : "w-10 h-10"}
                                    `}>
                                        {contact.firstName[0]}{contact.lastName[0]}
                                    </div>
                                    <div className={viewMode === 'grid' ? "space-y-1" : "min-w-[200px]"}>
                                        <div className="font-semibold text-foreground">{contact.firstName} {contact.lastName}</div>
                                        <div className="text-xs text-muted-foreground font-medium uppercase tracking-wide">{contact.jobTitle || 'No Title'}</div>
                                    </div>
                                </div>
                                {contact.category && viewMode === 'grid' && (
                                    <span className="absolute top-3 right-3 text-[10px] uppercase font-bold tracking-wider text-indigo-600 bg-indigo-50 dark:bg-indigo-900/30 px-2 py-1 rounded-full border border-indigo-100 dark:border-indigo-800">
                                        {contact.category}
                                    </span>
                                )}
                            </div>

                            <div className={`
                                ${viewMode === 'grid'
                                    ? "mt-6 space-y-3 border-t pt-4 w-full"
                                    : "flex items-center gap-6 ml-auto mr-4 text-sm text-muted-foreground"
                                }
                            `}>
                                {contact.email && (
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground group/link">
                                        <div className="p-1.5 bg-blue-50 dark:bg-blue-900/20 rounded-md text-blue-600 dark:text-blue-400">
                                            <Mail className="w-3.5 h-3.5" />
                                        </div>
                                        <a href={`mailto:${contact.email}`} className="truncate hover:text-blue-600 transition-colors w-full text-left">
                                            {contact.email}
                                        </a>
                                    </div>
                                )}
                                {contact.phone && (
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <div className="p-1.5 bg-green-50 dark:bg-green-900/20 rounded-md text-green-600 dark:text-green-400">
                                            <Phone className="w-3.5 h-3.5" />
                                        </div>
                                        <span>{contact.phone}</span>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                ))}
                {contacts?.length === 0 && (
                    <div className="col-span-full py-12 text-center text-muted-foreground border-2 border-dashed rounded-xl bg-muted/20">
                        <User className="w-12 h-12 mx-auto mb-3 opacity-20" />
                        <h4 className="font-medium mb-1">No contacts yet</h4>
                        <p className="text-sm mb-4 max-w-sm mx-auto">Get started by adding your first contact to tracking interactions and deals.</p>
                        <Button variant="outline" onClick={() => setIsOpen(true)}>Add Contact</Button>
                    </div>
                )}
            </div>
        </div>
    );
}

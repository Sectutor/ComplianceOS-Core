import { useState } from "react";
import { Breadcrumb } from "@/components/Breadcrumb";
import { trpc } from "@/lib/trpc";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@complianceos/ui/ui/table";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@complianceos/ui/ui/card";
import { EnhancedDialog } from "@complianceos/ui/ui/enhanced-dialog";
import { Button } from "@complianceos/ui/ui/button";
import { Input } from "@complianceos/ui/ui/input";
import { Label } from "@complianceos/ui/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@complianceos/ui/ui/select";
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "@complianceos/ui/ui/tabs";
import { Badge } from "@complianceos/ui/ui/badge";
import { Skeleton } from "@complianceos/ui/ui/skeleton";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@complianceos/ui/ui/alert-dialog";
import { UserPlus, User, Mail, Clock, XCircle, Loader2, Trash2, Link as LinkIcon, Copy, Info } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

export default function UserInvitations() {
    const [isInviteOpen, setIsInviteOpen] = useState(false);
    const [email, setEmail] = useState("");
    const [role, setRole] = useState("viewer");

    const { data: invitations, isLoading, refetch } = trpc.users.listInvitations.useQuery();

    const inviteMutation = trpc.users.invite.useMutation({
        onSuccess: () => {
            toast.success("Invitation sent successfully!");
            setIsInviteOpen(false);
            setEmail("");
            setRole("viewer");
            refetch();
        },
        onError: (error) => toast.error(error.message),
    });

    const revokeMutation = trpc.users.revokeInvitation.useMutation({
        onSuccess: () => {
            toast.success("Invitation revoked");
            refetch();
        },
        onError: (error) => toast.error(error.message),
    });

    const deleteMutation = trpc.users.deleteInvitation.useMutation({
        onSuccess: () => {
            toast.success("Invitation deleted");
            refetch();
        },
        onError: (error) => toast.error(error.message),
    });

    const handleInvite = (e: React.FormEvent) => {
        e.preventDefault();
        inviteMutation.mutate({ email, role });
    };

    const getStatusBadge = (status: string, expiresAt: Date | null) => {
        if (status === "revoked") {
            return <Badge variant="destructive">Revoked</Badge>;
        }
        if (status === "accepted") {
            return <Badge variant="default">Accepted</Badge>;
        }
        if (expiresAt && new Date(expiresAt) < new Date()) {
            return <Badge variant="secondary">Expired</Badge>;
        }
        return <Badge variant="outline">Pending</Badge>;
    };

    return (
        <div className="space-y-6">
            <Breadcrumb items={[{ label: "Admin" }, { label: "User Invitations" }]} />

            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">User Invitations</h1>
                    <p className="text-muted-foreground mt-1">
                        Manage user access through direct invites or reusable magic links.
                    </p>
                </div>
            </div>

            <Tabs defaultValue="direct" className="w-full">
                <TabsList className="grid w-full grid-cols-2 max-w-[400px]">
                    <TabsTrigger value="direct">Direct Invites</TabsTrigger>
                    <TabsTrigger value="magic">Magic Links</TabsTrigger>
                </TabsList>

                <TabsContent value="direct" className="space-y-4">
                    <div className="flex justify-end">
                        <EnhancedDialog
                            open={isInviteOpen}
                            onOpenChange={setIsInviteOpen}
                            trigger={
                                <Button className="gap-2">
                                    <UserPlus className="h-4 w-4" />
                                    Invite User
                                </Button>
                            }
                            title="Invite New User"
                            description="Send an email invitation to a new team member."
                            footer={
                                <div className="flex justify-end gap-2 w-full">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => setIsInviteOpen(false)}
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        onClick={(e) => {
                                            const form = document.getElementById('invite-user-form') as HTMLFormElement;
                                            if (form) form.requestSubmit();
                                        }}
                                        disabled={inviteMutation.isPending}
                                    >
                                        {inviteMutation.isPending ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                Sending...
                                            </>
                                        ) : (
                                            <>
                                                <Mail className="mr-2 h-4 w-4" />
                                                Send Invitation
                                            </>
                                        )}
                                    </Button>
                                </div>
                            }
                        >
                            <form id="invite-user-form" onSubmit={handleInvite} className="space-y-4 py-4">
                                <div className="space-y-2">
                                    <Label htmlFor="email">Email Address</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder="user@example.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="role">Role</Label>
                                    <Select value={role} onValueChange={setRole}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select role" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="viewer">Viewer</SelectItem>
                                            <SelectItem value="editor">Editor</SelectItem>
                                            <SelectItem value="admin">Admin</SelectItem>
                                            <SelectItem value="owner">Owner</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </form>
                        </EnhancedDialog>
                    </div>

                    <Card>
                        <CardHeader>
                            <CardTitle>Direct Email Invitations</CardTitle>
                            <CardDescription>
                                Track and manage individual invites sent to specific emails.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {isLoading ? (
                                <div className="space-y-2">
                                    <Skeleton className="h-10 w-full" />
                                    <Skeleton className="h-10 w-full" />
                                    <Skeleton className="h-10 w-full" />
                                </div>
                            ) : (
                                <div className="rounded-xl border border-slate-200 shadow-lg overflow-hidden bg-white">
                                    <Table>
                                        <TableHeader>
                                            <TableRow className="bg-[#1C4D8D] hover:bg-[#1C4D8D] border-none">
                                                <TableHead className="text-white font-semibold py-4">Email</TableHead>
                                                <TableHead className="text-white font-semibold py-4">Role</TableHead>
                                                <TableHead className="text-white font-semibold py-4">Invited By</TableHead>
                                                <TableHead className="text-white font-semibold py-4">Status</TableHead>
                                                <TableHead className="text-white font-semibold py-4">Expires</TableHead>
                                                <TableHead className="text-right text-white font-semibold py-4">Actions</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {invitations && invitations.length > 0 ? (
                                                invitations.map((invitation) => (
                                                    <TableRow key={invitation.id} className="bg-white border-b border-slate-200 transition-all duration-200 hover:bg-slate-50 hover:shadow-sm group">
                                                        <TableCell className="font-medium text-black py-4">
                                                            {invitation.email}
                                                        </TableCell>
                                                        <TableCell className="py-4">
                                                            <Badge variant="outline" className="capitalize bg-white border-gray-300 text-gray-700">
                                                                {invitation.role}
                                                            </Badge>
                                                        </TableCell>
                                                        <TableCell className="py-4">
                                                            <div className="flex flex-col">
                                                                <span className="text-sm text-black">
                                                                    {invitation.inviterName || "Unknown"}
                                                                </span>
                                                                <span className="text-xs text-gray-500">
                                                                    {invitation.inviterEmail}
                                                                </span>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell className="py-4">
                                                            {getStatusBadge(invitation.status, invitation.expiresAt)}
                                                        </TableCell>
                                                        <TableCell className="text-sm text-gray-500 py-4">
                                                            {invitation.expiresAt ? (
                                                                <div className="flex items-center gap-2">
                                                                    <Clock className="h-3 w-3" />
                                                                    {format(new Date(invitation.expiresAt), "MMM d, yyyy")}
                                                                </div>
                                                            ) : (
                                                                "-"
                                                            )}
                                                        </TableCell>
                                                        <TableCell className="text-right py-4">
                                                            {invitation.status === "pending" && (
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    className="text-red-500 hover:text-red-600 hover:bg-red-50 transition-colors duration-200"
                                                                    onClick={() => revokeMutation.mutate({ id: invitation.id })}
                                                                    disabled={revokeMutation.isPending}
                                                                >
                                                                    <XCircle className="h-4 w-4 mr-2" />
                                                                    Revoke
                                                                </Button>
                                                            )}
                                                            {invitation.status === "revoked" && (
                                                                <AlertDialog>
                                                                    <AlertDialogTrigger asChild>
                                                                        <Button
                                                                            variant="ghost"
                                                                            size="sm"
                                                                            className="text-red-500 hover:text-red-600 hover:bg-red-50 transition-colors duration-200"
                                                                            disabled={deleteMutation.isPending}
                                                                        >
                                                                            <Trash2 className="h-4 w-4 mr-2" />
                                                                            Delete
                                                                        </Button>
                                                                    </AlertDialogTrigger>
                                                                    <AlertDialogContent>
                                                                        <AlertDialogHeader>
                                                                            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                                                            <AlertDialogDescription>
                                                                                This will permanently delete the invitation for <span className="font-semibold">{invitation.email}</span>. This action cannot be undone.
                                                                            </AlertDialogDescription>
                                                                        </AlertDialogHeader>
                                                                        <AlertDialogFooter>
                                                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                                            <AlertDialogAction
                                                                                onClick={() => deleteMutation.mutate({ id: invitation.id })}
                                                                                className="bg-red-600 hover:bg-red-700 text-white"
                                                                            >
                                                                                {deleteMutation.isPending ? (
                                                                                    <>
                                                                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                                                        Deleting...
                                                                                    </>
                                                                                ) : (
                                                                                    "Delete Invitation"
                                                                                )}
                                                                            </AlertDialogAction>
                                                                        </AlertDialogFooter>
                                                                    </AlertDialogContent>
                                                                </AlertDialog>
                                                            )}
                                                        </TableCell>
                                                    </TableRow>
                                                ))
                                            ) : (
                                                <TableRow>
                                                    <TableCell colSpan={6} className="h-24 text-center text-gray-500 bg-white">
                                                        No direct invitations found.
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                        </TableBody>
                                    </Table>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="magic" className="space-y-4">
                    <MagicLinksSection />
                </TabsContent>
            </Tabs>
        </div>
    );
}

function MagicLinksSection() {
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [label, setLabel] = useState("");
    const [email, setEmail] = useState("");
    const [role, setRole] = useState("viewer");
    const [planTier, setPlanTier] = useState("free");
    const [maxClients, setMaxClients] = useState(2);
    const [durationType, setDurationType] = useState<"lifetime" | "limited">("lifetime");
    const [durationDays, setDurationDays] = useState(14);
    const [expiresInDays, setExpiresInDays] = useState(7);
    const [usageLimit, setUsageLimit] = useState<number | null>(1);
    const [restrictedDomains, setRestrictedDomains] = useState("");
    const [filterOrigin, setFilterOrigin] = useState<'all' | 'waitlist'>('all');

    const { data: magicLinks, isLoading, refetch } = trpc.magicLinks.list.useQuery();

    const createMutation = trpc.magicLinks.create.useMutation({
        onSuccess: () => {
            toast.success("Magic link created!");
            setIsCreateOpen(false);
            setLabel("");
            setEmail("");
            refetch();
        },
        onError: (error) => toast.error(error.message),
    });

    const revokeMutation = trpc.magicLinks.revoke.useMutation({
        onSuccess: () => {
            toast.success("Link revoked");
            refetch();
        },
        onError: (error) => toast.error(error.message),
    });

    const deleteMutation = trpc.magicLinks.delete.useMutation({
        onSuccess: () => {
            toast.success("Link deleted");
            refetch();
        },
        onError: (error) => toast.error(error.message),
    });

    const handleCreate = (e: React.FormEvent) => {
        e.preventDefault();
        createMutation.mutate({
            label,
            email: email || undefined,
            role,
            planTier,
            maxClients,
            accessDurationType: durationType,
            accessDurationDays: durationType === "limited" ? durationDays : undefined,
            expiresInDays,
            usageLimit: usageLimit === 0 ? null : usageLimit,
            restrictedDomains: restrictedDomains ? restrictedDomains.split(',').map(d => d.trim().toLowerCase()).filter(d => d !== "") : undefined,
        });
    };

    const copyToClipboard = (token: string) => {
        const url = `${window.location.origin}/auth/redeem-link?token=${token}`;
        navigator.clipboard.writeText(url);
        toast.success("Link copied to clipboard!");
    };

    return (
        <div className="space-y-4">
            <MagicLinkStats />
            <div className="flex justify-end">
                <EnhancedDialog
                    open={isCreateOpen}
                    onOpenChange={setIsCreateOpen}
                    trigger={
                        <Button className="gap-2">
                            <LinkIcon className="h-4 w-4" />
                            Create Magic Link
                        </Button>
                    }
                    title="Create Magic Link"
                    description="Generate a reusable link that grants specific access levels upon account creation."
                    footer={
                        <div className="flex justify-end gap-2 w-full">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setIsCreateOpen(false)}
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={() => {
                                    const form = document.getElementById('create-magic-link-form') as HTMLFormElement;
                                    if (form) form.requestSubmit();
                                }}
                                disabled={createMutation.isPending}
                            >
                                {createMutation.isPending ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Generating...
                                    </>
                                ) : (
                                    <>
                                        <LinkIcon className="mr-2 h-4 w-4" />
                                        Generate Link
                                    </>
                                )}
                            </Button>
                        </div>
                    }
                >
                    <form id="create-magic-link-form" onSubmit={handleCreate} className="space-y-4 py-4 max-h-[70vh] overflow-y-auto pr-2">
                        <div className="space-y-2">
                            <Label htmlFor="label">Internal Label</Label>
                            <Input
                                id="label"
                                placeholder="e.g. Early Adopter Pro Link"
                                value={label}
                                onChange={(e) => setLabel(e.target.value)}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="magic-email">Recipient Email (Optional)</Label>
                            <Input
                                id="magic-email"
                                type="email"
                                placeholder="Send directly to..."
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                            <p className="text-xs text-muted-foreground">
                                If provided, an invite email will be sent automatically.
                            </p>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Role</Label>
                                <Select value={role} onValueChange={setRole}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="viewer">Viewer</SelectItem>
                                        <SelectItem value="editor">Editor</SelectItem>
                                        <SelectItem value="user">Org Admin</SelectItem>
                                        <SelectItem value="admin">Global Admin</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Plan Tier</Label>
                                <Select value={planTier} onValueChange={setPlanTier}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="free">Free</SelectItem>
                                        <SelectItem value="pro">Pro</SelectItem>
                                        <SelectItem value="enterprise">Enterprise</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="maxClients">Max Organizations/Clients</Label>
                            <Input
                                id="maxClients"
                                type="number"
                                value={maxClients}
                                onChange={(e) => setMaxClients(parseInt(e.target.value))}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Access Duration</Label>
                            <Select value={durationType} onValueChange={(v: any) => setDurationType(v)}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="lifetime">Lifetime</SelectItem>
                                    <SelectItem value="limited">Limited Time</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        {durationType === "limited" && (
                            <div className="space-y-2">
                                <Label htmlFor="durationDays">Days of Access</Label>
                                <Input
                                    id="durationDays"
                                    type="number"
                                    value={durationDays}
                                    onChange={(e) => setDurationDays(parseInt(e.target.value))}
                                />
                            </div>
                        )}
                        <div className="space-y-2">
                            <Label htmlFor="expiresIn">Link Expiration (Days from now)</Label>
                            <Input
                                id="expiresIn"
                                type="number"
                                value={expiresInDays}
                                onChange={(e) => setExpiresInDays(parseInt(e.target.value))}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="usageLimit">Max Redemptions (1 = Single Use, 0 = Unlimited)</Label>
                            <Input
                                id="usageLimit"
                                type="number"
                                value={usageLimit ?? 0}
                                onChange={(e) => {
                                    const v = parseInt(e.target.value);
                                    setUsageLimit(v === 0 ? null : v);
                                }}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="restrictedDomains">Restricted Domains (comma-separated, optional)</Label>
                            <Input
                                id="restrictedDomains"
                                placeholder="e.g. google.com, acme.org"
                                value={restrictedDomains}
                                onChange={(e) => setRestrictedDomains(e.target.value)}
                            />
                            <p className="text-xs text-muted-foreground">
                                Only users with emails from these domains will be allowed to use this link.
                            </p>
                        </div>
                    </form>
                </EnhancedDialog>
            </div>

            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>Magic Links</CardTitle>
                            <CardDescription>
                                Reusable links for streamlined onboarding and plan upgrades.
                            </CardDescription>
                        </div>
                        <div className="flex gap-2">
                            <Button
                                variant={filterOrigin === 'all' ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => setFilterOrigin('all')}
                            >
                                All
                            </Button>
                            <Button
                                variant={filterOrigin === 'waitlist' ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => setFilterOrigin('waitlist')}
                            >
                                Origin: Waitlist
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="space-y-2">
                            <Skeleton className="h-10 w-full" />
                            <Skeleton className="h-10 w-full" />
                        </div>
                    ) : (
                        <div className="rounded-xl border border-slate-200 shadow-lg overflow-hidden bg-white">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-[#1C4D8D] hover:bg-[#1C4D8D] border-none">
                                        <TableHead className="text-white font-semibold py-4">Label / Token</TableHead>
                                        <TableHead className="text-white font-semibold py-4">Access Level</TableHead>
                                        <TableHead className="text-white font-semibold py-4">Stats</TableHead>
                                        <TableHead className="text-white font-semibold py-4">Status</TableHead>
                                        <TableHead className="text-right text-white font-semibold py-4">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {magicLinks && magicLinks.length > 0 ? (
                                        (filterOrigin === 'waitlist' ? magicLinks.filter((l: any) => !!l.waitlistId) : magicLinks).map((link: any) => (
                                            <TableRow key={link.id} className="bg-white border-b border-slate-200 transition-all duration-200 hover:bg-slate-50 group">
                                                <TableCell className="py-4">
                                                    <div className="flex flex-col gap-1">
                                                        <span className="font-semibold text-black">{link.label}</span>
                                                        {link.waitlistId && (
                                                            <span className="text-[10px] text-slate-500">From Waitlist #{link.waitlistId}</span>
                                                        )}
                                                        <div className="flex items-center gap-2 group/token">
                                                            <code className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-500 font-mono truncate max-w-[120px]">
                                                                {link.token}
                                                            </code>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-6 w-6 opacity-0 group-hover/token:opacity-100"
                                                                onClick={() => copyToClipboard(link.token)}
                                                            >
                                                                <Copy className="h-3 w-3" />
                                                            </Button>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="py-4">
                                                    <div className="flex flex-col gap-1">
                                                        <div className="flex items-center gap-2">
                                                            <Badge variant="outline" className="capitalize">
                                                                {link.role}
                                                            </Badge>
                                                            <Badge className="capitalize bg-blue-50 text-blue-700 border-blue-100">
                                                                {link.planTier}
                                                            </Badge>
                                                        </div>
                                                        <span className="text-xs text-slate-500">
                                                            Max {link.maxClients} orgs • {link.accessDurationType === 'lifetime' ? 'Lifetime' : `${link.accessDurationDays} days`}
                                                        </span>
                                                        {link.restrictedDomains && (link.restrictedDomains as string[]).length > 0 && (
                                                            <div className="flex flex-wrap gap-1 mt-1">
                                                                {(link.restrictedDomains as string[]).map((d: string, idx: number) => (
                                                                    <Badge key={`${d}-${idx}`} variant="secondary" className="text-[9px] h-4 py-0 px-1 bg-slate-100">
                                                                        @{d}
                                                                    </Badge>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="py-4 text-center">
                                                    <div className="flex flex-col items-center gap-1">
                                                        <div className="flex items-center gap-1 text-xs text-slate-600 font-medium">
                                                            <User className="h-3 w-3" />
                                                            {link.useCount || 0} / {link.usageLimit || "∞"}
                                                        </div>
                                                        {link.usedAt && (
                                                            <span className="text-[10px] text-slate-400">
                                                                Last: {format(new Date(link.usedAt), "MMM d")}
                                                            </span>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="py-4">
                                                    {link.status === 'active' ? (
                                                        <Badge variant="default" className="bg-emerald-50 text-emerald-700 border-emerald-100">
                                                            Active
                                                        </Badge>
                                                    ) : (
                                                        <Badge variant="secondary">{link.status}</Badge>
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-right py-4 space-x-2">
                                                    <MagicLinkRedemptionsDialog linkId={link.id} label={link.label} />
                                                    {link.status === 'active' && (
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="text-orange-500 hover:text-orange-600 hover:bg-orange-50"
                                                            onClick={() => revokeMutation.mutate({ id: link.id })}
                                                            disabled={revokeMutation.isPending}
                                                        >
                                                            Revoke
                                                        </Button>
                                                    )}
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="text-red-500 hover:text-red-600 hover:bg-red-50"
                                                        onClick={() => deleteMutation.mutate({ id: link.id })}
                                                        disabled={deleteMutation.isPending}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={5} className="h-24 text-center text-gray-500 bg-white">
                                                No magic links found.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div >
    );
}

function MagicLinkRedemptionsDialog({ linkId, label }: { linkId: number, label: string }) {
    const [isOpen, setIsOpen] = useState(false);
    const { data: redemptions, isLoading } = trpc.magicLinks.getRedemptions.useQuery(
        { magicLinkId: linkId },
        { enabled: isOpen }
    );

    return (
        <EnhancedDialog
            open={isOpen}
            onOpenChange={setIsOpen}
            trigger={
                <Button variant="ghost" size="sm" className="text-blue-500 hover:text-blue-600 hover:bg-blue-50">
                    <Info className="h-4 w-4 mr-2" />
                    Redemptions
                </Button>
            }
            title={`Redemptions: ${label}`}
            description="Users who have claimed an account through this link."
        >
            <div className="py-4 max-h-[60vh] overflow-y-auto pr-2">
                {isLoading ? (
                    <div className="space-y-2">
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                    </div>
                ) : redemptions && redemptions.length > 0 ? (
                    <div className="rounded-xl border border-slate-200 overflow-hidden bg-white">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-slate-50 hover:bg-slate-50">
                                    <TableHead className="font-semibold text-slate-900">User</TableHead>
                                    <TableHead className="font-semibold text-slate-900">Redeemed At</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {redemptions.map((r: any) => (
                                    <TableRow key={r.id}>
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <span className="font-semibold text-black">{r.name || "Unnamed User"}</span>
                                                <span className="text-xs text-slate-500">{r.email}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-slate-500 text-sm whitespace-nowrap">
                                            {r.redeemedAt ? format(new Date(r.redeemedAt), "MMM d, yyyy HH:mm") : "-"}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                ) : (
                    <div className="text-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-300">
                        <User className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                        <p className="text-slate-500 font-medium">No redemptions yet.</p>
                        <p className="text-xs text-slate-400 mt-1">Share the link to start seeing new users here.</p>
                    </div>
                )}
            </div>
        </EnhancedDialog>
    );
}

function MagicLinkStats() {
    const { data: stats, isLoading } = trpc.magicLinks.getStats.useQuery();

    if (isLoading) return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-24 w-full" />)}
        </div>
    );

    if (!stats) return null;

    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Links</CardTitle>
                    <LinkIcon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{stats.total}</div>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Active Invites</CardTitle>
                    <Clock className="h-4 w-4 text-blue-500" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{stats.active}</div>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Redeemed</CardTitle>
                    <UserPlus className="h-4 w-4 text-emerald-500" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{stats.redeemed}</div>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Revoked / Expired</CardTitle>
                    <XCircle className="h-4 w-4 text-red-500" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{stats.revoked}</div>
                </CardContent>
            </Card>
        </div>
    );
}

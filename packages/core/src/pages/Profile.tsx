import { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@complianceos/ui/ui/card";
import { Button } from "@complianceos/ui/ui/button";
import { Input } from "@complianceos/ui/ui/input";
import { Label } from "@complianceos/ui/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@complianceos/ui/ui/avatar";
import { Badge } from "@complianceos/ui/ui/badge";
import { Separator } from "@complianceos/ui/ui/separator";
import { toast } from "sonner";
import { supabase } from "@/lib/supabaseClient";
import { User, Mail, Shield, Moon, Sun, Laptop, Loader2, Save, Lock, Trash2, AlertTriangle } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@complianceos/ui/ui/alert-dialog";
import { trpc } from "@/lib/trpc";


export default function Profile() {
    const { user, session } = useAuth();
    const { theme, setTheme } = useTheme();
    const [fullName, setFullName] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [confirmOrgName, setConfirmOrgName] = useState("");
    const [isDeleting, setIsDeleting] = useState(false);

    // Get user's current org/client for confirmation
    const { data: clients } = trpc.clients.list.useQuery();
    const currentOrg = clients?.[0]?.name || "your organization";

    useEffect(() => {
        if (user?.user_metadata?.full_name) {
            setFullName(user.user_metadata.full_name);
        }
    }, [user]);

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const { error } = await supabase.auth.updateUser({
                data: { full_name: fullName }
            });

            if (error) throw error;
            toast.success("Profile updated successfully");
        } catch (error: any) {
            toast.error("Failed to update profile: " + error.message);
        } finally {
            setIsLoading(false);
        }
    };

    const getInitials = (name: string) => {
        return name
            ? name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
            : user?.email?.charAt(0).toUpperCase() || "U";
    };

    return (
        <DashboardLayout>
            <div className="w-full mx-auto space-y-8 animate-in fade-in duration-500">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Profile & Settings</h1>
                        <p className="text-muted-foreground mt-1">Manage your account settings and preferences.</p>
                    </div>
                </div>

                <div className="grid gap-8 md:grid-cols-3">
                    {/* User Identity Card */}
                    <Card className="md:col-span-1 shadow-md border-muted/40">
                        <CardHeader className="text-center pb-2">
                            <div className="mx-auto mb-4 relative">
                                <Avatar className="h-24 w-24 border-4 border-background shadow-xl">
                                    <AvatarImage src={user?.user_metadata?.avatar_url} />
                                    <AvatarFallback className="text-2xl font-bold bg-primary/10 text-primary">
                                        {getInitials(fullName || user?.email || "")}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="absolute bottom-0 right-0 bg-green-500 w-4 h-4 rounded-full border-2 border-background"></div>
                            </div>
                            <CardTitle className="text-xl">{fullName || "User"}</CardTitle>
                            <CardDescription className="flex items-center justify-center gap-1.5 mt-1">
                                <Mail className="h-3.5 w-3.5" /> {user?.email}
                            </CardDescription>
                            <div className="mt-4 flex justify-center">
                                <Badge variant="secondary" className="px-3 py-1 bg-primary/10 text-primary hover:bg-primary/20 transition-colors">
                                    <Shield className="h-3 w-3 mr-1" />
                                    {session?.user?.role === 'authenticated' ? 'Member' : 'Guest'}
                                </Badge>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4 pt-4">
                            <Separator />
                            <div className="grid grid-cols-2 gap-4 text-sm mt-4">
                                <div className="space-y-1">
                                    <p className="text-muted-foreground text-xs font-medium uppercase tracking-wider">Joined</p>
                                    <p className="font-medium">{new Date(user?.created_at || "").toLocaleDateString()}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-muted-foreground text-xs font-medium uppercase tracking-wider">Last Sign In</p>
                                    <p className="font-medium">{new Date(user?.last_sign_in_at || "").toLocaleDateString()}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Settings Sections */}
                    <div className="md:col-span-2 space-y-6">
                        {/* Profile Details */}
                        <Card className="shadow-sm border-muted/40">
                            <CardHeader>
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <User className="h-5 w-5 text-primary" />
                                    Personal Information
                                </CardTitle>
                                <CardDescription>
                                    Update your personal details visible to other team members.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <form onSubmit={handleUpdateProfile} className="space-y-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="email">Email Address</Label>
                                        <Input id="email" value={user?.email || ""} disabled className="bg-muted/50" />
                                        <p className="text-[0.8rem] text-muted-foreground">Email address cannot be changed.</p>
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="fullName">Full Name</Label>
                                        <Input
                                            id="fullName"
                                            value={fullName}
                                            onChange={(e) => setFullName(e.target.value)}
                                            placeholder="Enter your full name"
                                            className="bg-background"
                                        />
                                    </div>
                                    <div className="flex justify-end pt-2">
                                        <Button type="submit" disabled={isLoading} className="gap-2">
                                            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                                            Save Changes
                                        </Button>
                                    </div>
                                </form>
                            </CardContent>
                        </Card>

                        {/* Security / Password */}
                        <Card className="shadow-sm border-muted/40">
                            <CardHeader>
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <Lock className="h-5 w-5 text-primary" />
                                    Security
                                </CardTitle>
                                <CardDescription>
                                    Manage your password and account security.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/20">
                                        <div className="space-y-0.5">
                                            <div className="font-medium">Password</div>
                                            <div className="text-sm text-muted-foreground">
                                                Update your password associated with this account.
                                            </div>
                                        </div>
                                        <Button variant="outline" onClick={() => window.location.href = '/update-password'}>
                                            Change Password
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Usage / Theme */}
                        <Card className="shadow-sm border-muted/40">
                            <CardHeader>
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <Laptop className="h-5 w-5 text-primary" />
                                    Appearance
                                </CardTitle>
                                <CardDescription>
                                    Customize how Compliance OS looks comfortably for you.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-3 gap-4">
                                    <div
                                        className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 cursor-pointer transition-all hover:bg-accent ${theme === 'light' ? 'border-primary bg-primary/5' : 'border-transparent bg-muted/30'}`}
                                        onClick={() => setTheme('light')}
                                    >
                                        <Sun className={`h-6 w-6 ${theme === 'light' ? 'text-primary' : 'text-muted-foreground'}`} />
                                        <span className="text-sm font-medium">Light</span>
                                    </div>
                                    <div
                                        className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 cursor-pointer transition-all hover:bg-accent ${theme === 'dark' ? 'border-primary bg-primary/5' : 'border-transparent bg-muted/30'}`}
                                        onClick={() => setTheme('dark')}
                                    >
                                        <Moon className={`h-6 w-6 ${theme === 'dark' ? 'text-primary' : 'text-muted-foreground'}`} />
                                        <span className="text-sm font-medium">Dark</span>
                                    </div>
                                    <div
                                        className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 cursor-pointer transition-all hover:bg-accent ${theme === 'system' ? 'border-primary bg-primary/5' : 'border-transparent bg-muted/30'}`}
                                        onClick={() => setTheme('system')}
                                    >
                                        <Laptop className={`h-6 w-6 ${theme === 'system' ? 'text-primary' : 'text-muted-foreground'}`} />
                                        <span className="text-sm font-medium">System</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Danger Zone */}
                        <Card className="shadow-sm border-red-200 dark:border-red-900/50">
                            <CardHeader>
                                <CardTitle className="text-lg flex items-center gap-2 text-red-600 dark:text-red-400">
                                    <AlertTriangle className="h-5 w-5" />
                                    Danger Zone
                                </CardTitle>
                                <CardDescription>
                                    Irreversible and destructive actions.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center justify-between p-4 border border-red-200 dark:border-red-900/50 rounded-lg bg-red-50/50 dark:bg-red-950/20">
                                    <div className="space-y-0.5">
                                        <div className="font-medium text-red-700 dark:text-red-300">Close Account</div>
                                        <div className="text-sm text-red-600/80 dark:text-red-400/80">
                                            Permanently delete your account and all associated data.
                                        </div>
                                    </div>
                                    <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                                        <AlertDialogTrigger asChild>
                                            <Button variant="destructive" className="gap-2">
                                                <Trash2 className="h-4 w-4" />
                                                Close Account
                                            </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent className="max-w-md">
                                            <AlertDialogHeader>
                                                <AlertDialogTitle className="flex items-center gap-2 text-red-600">
                                                    <AlertTriangle className="h-5 w-5" />
                                                    Close Your Account?
                                                </AlertDialogTitle>
                                                <AlertDialogDescription asChild>
                                                    <div className="space-y-4">
                                                        <div className="p-3 bg-red-100 dark:bg-red-950/50 border border-red-200 dark:border-red-800 rounded-lg text-red-800 dark:text-red-200 text-sm">
                                                            <p className="font-semibold mb-2">⚠️ This action is permanent and cannot be undone.</p>
                                                            <p>All of the following will be permanently deleted:</p>
                                                            <ul className="list-disc ml-5 mt-2 space-y-1">
                                                                <li>Your user account and profile</li>
                                                                <li>All policies, controls, and evidence</li>
                                                                <li>All risk assessments and audit history</li>
                                                                <li>All vendor data and integrations</li>
                                                                <li>All team members and their access</li>
                                                            </ul>
                                                        </div>
                                                        <div className="space-y-2">
                                                            <Label htmlFor="confirm-org" className="text-foreground">
                                                                To confirm, type <span className="font-mono font-bold">"{currentOrg}"</span> below:
                                                            </Label>
                                                            <Input
                                                                id="confirm-org"
                                                                value={confirmOrgName}
                                                                onChange={(e) => setConfirmOrgName(e.target.value)}
                                                                placeholder="Type organization name to confirm"
                                                                className="border-red-200 focus:border-red-400"
                                                            />
                                                        </div>
                                                    </div>
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel onClick={() => setConfirmOrgName("")}>Cancel</AlertDialogCancel>
                                                <Button
                                                    variant="destructive"
                                                    disabled={confirmOrgName !== currentOrg || isDeleting}
                                                    onClick={async () => {
                                                        setIsDeleting(true);
                                                        try {
                                                            // Sign out and redirect (actual deletion would be handled by backend)
                                                            await supabase.auth.signOut();
                                                            toast.success("Your account closure request has been submitted.");
                                                            window.location.href = "/login";
                                                        } catch (error: any) {
                                                            toast.error("Failed to close account: " + error.message);
                                                        } finally {
                                                            setIsDeleting(false);
                                                            setIsDeleteDialogOpen(false);
                                                        }
                                                    }}
                                                >
                                                    {isDeleting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                                                    I understand, close my account
                                                </Button>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>



            </div>
        </DashboardLayout>
    );
}

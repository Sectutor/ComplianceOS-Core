import React, { useState } from 'react';
import { useLocation, Link } from 'wouter';
import { trpc } from '@/lib/trpc';
import { Button } from '@complianceos/ui/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@complianceos/ui/ui/card';
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { Label } from '@complianceos/ui/ui/label';
import { Input } from '@complianceos/ui/ui/input';

export default function AcceptInvite() {
    const searchParams = new URLSearchParams(window.location.search);
    const token = searchParams.get('token');
    const [, navigate] = useLocation();

    const { signIn } = useAuth();
    const [formData, setFormData] = useState({ name: '', password: '' });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const acceptMutation = trpc.users.acceptInvitation.useMutation({
        onSuccess: async () => {
            toast.success("Account created successfully! Signing in...");
            try {
                // We don't have the email in the form, so we can't auto-login unless we ask for it or get it back.
                // The mutation returns { success: true }.
                // We should probably ask the user to login or redirect to login.
                // Or we can return the email from the mutation.
                // For now, redirect to login.
                toast.success("Please sign in with your email and new password.");
                navigate('/auth/login');
            } catch (e) {
                navigate('/auth/login');
            }
        },
        onError: (err) => {
            if (err.data?.code === 'CONFLICT') {
                toast.error(err.message, {
                    action: {
                        label: 'Sign In',
                        onClick: () => navigate('/auth/login')
                    },
                    duration: 10000
                });
            } else {
                toast.error(err.message);
            }
            setIsSubmitting(false);
        }
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!token) return;
        setIsSubmitting(true);
        acceptMutation.mutate({
            token,
            name: formData.name,
            password: formData.password
        });
    };

    if (!token) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
                <Card className="max-w-md w-full border-none shadow-xl">
                    <CardHeader className="text-center">
                        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                        <CardTitle className="text-2xl font-bold">Invalid Invitation</CardTitle>
                        <CardDescription>
                            This invitation link is missing a valid security token.
                        </CardDescription>
                    </CardHeader>
                    <CardFooter>
                        <Button asChild className="w-full">
                            <Link to="/auth/login">Go to Login</Link>
                        </Button>
                    </CardFooter>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
            <Card className="max-w-md w-full border-none shadow-xl overflow-hidden">
                <div className="h-2 bg-gradient-to-r from-blue-600 to-indigo-600" />
                <CardHeader className="text-center">
                    <div className="mx-auto bg-blue-50 h-16 w-16 rounded-full flex items-center justify-center mb-4">
                        <CheckCircle2 className="h-10 text-blue-600" />
                    </div>
                    <CardTitle className="text-2xl font-bold text-slate-900">
                        Accept Invitation
                    </CardTitle>
                    <CardDescription>
                        Set up your account to join ComplianceOS.
                    </CardDescription>
                </CardHeader>

                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Full Name</Label>
                            <Input
                                id="name"
                                placeholder="John Doe"
                                value={formData.name}
                                onChange={e => setFormData(d => ({ ...d, name: e.target.value }))}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password">Create Password</Label>
                            <Input
                                id="password"
                                type="password"
                                placeholder="••••••••"
                                value={formData.password}
                                onChange={e => setFormData(d => ({ ...d, password: e.target.value }))}
                                minLength={6}
                                required
                            />
                            <p className="text-xs text-slate-500">
                                Must be at least 6 characters long.
                            </p>
                        </div>

                        {acceptMutation.error?.data?.code === 'CONFLICT' && (
                            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4 flex gap-3">
                                <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                                <div className="space-y-2">
                                    <p className="text-sm font-bold text-amber-900">Account Found</p>
                                    <p className="text-xs text-amber-700 leading-relaxed">
                                        An account with this email already exists. Please sign in to join ComplianceOS.
                                    </p>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        className="w-full border-amber-200 hover:bg-amber-100 text-amber-900 font-bold"
                                        onClick={() => navigate('/auth/login')}
                                    >
                                        Sign In
                                    </Button>
                                </div>
                            </div>
                        )}

                        <Button
                            type="submit"
                            className="w-full h-11 bg-blue-600 hover:bg-blue-700 font-semibold"
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Creating Account...
                                </>
                            ) : "Create Account"}
                        </Button>
                    </form>
                </CardContent>
                <CardFooter className="bg-slate-50 border-t border-slate-100 p-4 justify-center">
                    <Button asChild variant="link" className="text-slate-500 text-xs">
                        <Link to="/auth/login">Already have an account?</Link>
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
}

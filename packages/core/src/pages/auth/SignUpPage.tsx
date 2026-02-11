import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@complianceos/ui/ui/button';
import { Input } from '@complianceos/ui/ui/input';
import { Label } from '@complianceos/ui/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@complianceos/ui/ui/card';
import { toast } from 'sonner';
import { trpc } from '@/lib/trpc';
import { Building2, Loader2 } from 'lucide-react';
import MFAChallengeModal from '@/components/auth/MFAChallengeModal';

export default function SignUpPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [organizationName, setOrganizationName] = useState('');
    const [fullName, setFullName] = useState('');
    const [loading, setLoading] = useState(false);
    const [, setLocation] = useLocation();
    const { user, signIn } = useAuth(); // Use signIn from AuthContext for consistent state
    const [showMFAModal, setShowMFAModal] = useState(false);
    const [factorId, setFactorId] = useState<string | undefined>(undefined);
    const [mfaRequired, setMfaRequired] = useState(false);

    // If already logged in AND we aren't in the middle of a signup process (checking params), redirect
    // But here we want to handle the payment flow, so we might need to be careful not to redirect too early if we just auto-logged in.
    // However, the checkout creation happens largely before we lose control to the protected route redirect if we are fast, 
    // or we might need to rely on the fact that we are awaiting the checkout URL.

    // Actually, simple useEffect for redirect might fight us if we auto-login.
    // Let's remove the auto-redirect effect for now or make it smarter? 
    // The current effect:
    /*
    useEffect(() => {
        if (user) {
            setLocation('/dashboard');
        }
    }, [user, setLocation]);
    */
    // If we auto-login, `user` becomes true, and this effect fires. We need to prevent that if we are intending to go to payment.
    // We can just rely on the checkout mutation.

    const createUserCheckout = trpc.billing.createUserCheckout.useMutation();

    const handleSignUp = async (e: React.FormEvent) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            toast.error("Passwords don't match");
            return;
        }
        if (organizationName.trim().length < 2) {
            toast.error("Please enter a valid organization name");
            return;
        }
        setLoading(true);

        try {
            // Step 1: Create Supabase auth user
            const searchParams = new URLSearchParams(window.location.search);
            const tier = (searchParams.get('tier') || 'startup') as 'startup' | 'pro' | 'guided' | 'enterprise';
            const interval = (searchParams.get('interval') || 'month') as 'month' | 'year';

            const { data: authData, error: authError } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        full_name: fullName,
                        organization_name: organizationName,
                        plan_tier: tier,
                        billing_interval: interval
                    }
                }
            });

            if (authError) throw authError;
            if (!authData.user) throw new Error("Failed to create user account");

            // Step 2: Auto-Login & Payment Redirect
            // If email confirmation is disabled (as requested), we get a session immediately.
            if (!authData.session) {
                // If no session, try explicit sign in (handling race conditions or specific Supabase configs)
                const { error: signInError } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });
                if (signInError) throw signInError;
            }

            const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
            if (aal?.currentLevel !== 'aal2') {
                const { data: lf } = await supabase.auth.mfa.listFactors();
                const totpVerified = lf?.factors?.find((f: any) => f.factor_type === 'totp' && f.status === 'verified');
                const totpAny = totpVerified || lf?.factors?.find((f: any) => f.factor_type === 'totp');
                if (totpAny?.id) {
                    setFactorId(totpAny.id);
                    setShowMFAModal(true);
                    setMfaRequired(true);
                    setLoading(false);
                    toast.message('Enter the 6‑digit code to continue');
                    return;
                }
            }

            if (inviteToken) {
                toast.success("Account created! Redirecting to redeem your invitation...");
                setLocation(`/auth/redeem-link?token=${inviteToken}`);
                return;
            }

            toast.success("Account created! Redirecting to payment...");

            // Step 3: Create Checkout Session
            const { url } = await createUserCheckout.mutateAsync({
                tier,
                interval,
                successUrl: `${window.location.origin}/dashboard?onboarding=true&payment_success=true`,
                cancelUrl: `${window.location.origin}/login`,
            });

            if (url) {
                window.location.href = url;
            } else {
                throw new Error("Failed to generate payment link");
            }

        } catch (error: any) {
            console.error("Signup flow error:", error);

            // Handle "User already registered" specifically
            if (error.message?.includes("User already registered") || error.message?.includes("already registered")) {
                toast.info("User already exists. Attempting to log in...");

                try {
                    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
                        email,
                        password,
                    });

                    if (signInError) throw signInError;
                    if (signInData.session) {
                        const { data: aal2 } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
                        if (aal2?.currentLevel !== 'aal2') {
                            const { data: lf } = await supabase.auth.mfa.listFactors();
                            const totpVerified = lf?.factors?.find((f: any) => f.factor_type === 'totp' && f.status === 'verified');
                            const totpAny = totpVerified || lf?.factors?.find((f: any) => f.factor_type === 'totp');
                            if (totpAny?.id) {
                                setFactorId(totpAny.id);
                                setShowMFAModal(true);
                                setMfaRequired(true);
                                setLoading(false);
                                toast.message('Enter the 6‑digit code to continue');
                                return;
                            }
                        }
                        if (inviteToken) {
                            toast.success("Logged in successfully! Redirecting to redeem your invitation...");
                            setLocation(`/auth/redeem-link?token=${inviteToken}`);
                            return;
                        }

                        toast.success("Logged in successfully! Proceeding to payment...");

                        const { url } = await createUserCheckout.mutateAsync({
                            tier: (searchParams.get('tier') || 'startup') as any,
                            interval: (searchParams.get('interval') || 'month') as any,
                            successUrl: `${window.location.origin}/dashboard?onboarding=true`,
                            cancelUrl: `${window.location.origin}/login`,
                        });

                        if (url) {
                            window.location.href = url;
                            return;
                        }
                    }
                } catch (loginErr: any) {
                    console.error("Auto-login failed:", loginErr);
                    toast.error("Account exists but login failed. Please check your password or Sign In manually.");
                    setLoading(false);
                    return;
                }
            } else {
                toast.error(error.message || 'Failed to complete signup');
            }
            setLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-[#002a40]">
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-20" />

            <Card className="w-full max-w-md relative z-10 bg-[#001e2b] border-slate-700 shadow-2xl">
                <CardHeader className="space-y-1 text-center">
                    <div className="mx-auto h-12 w-12 rounded-xl bg-[#0ea5e9] flex items-center justify-center text-white mb-4">
                        <Building2 className="h-7 w-7 text-white" />
                    </div>
                    <CardTitle className="text-2xl font-bold text-white">Create Account</CardTitle>
                    <CardDescription className="text-slate-400">
                        Start your compliance journey today
                    </CardDescription>
                </CardHeader>
                <form onSubmit={handleSignUp}>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="fullName" className="text-slate-300">Full Name</Label>
                                <Input
                                    id="fullName"
                                    type="text"
                                    placeholder="John Doe"
                                    value={fullName}
                                    onChange={(e) => setFullName(e.target.value)}
                                    required
                                    className="bg-[#002a40] border-slate-600 text-white placeholder:text-slate-500 focus:border-[#0ea5e9] hover:bg-[#003554] transition-colors"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="organizationName" className="text-slate-300">Organization Name</Label>
                                <Input
                                    id="organizationName"
                                    type="text"
                                    placeholder="Acme Inc."
                                    value={organizationName}
                                    onChange={(e) => setOrganizationName(e.target.value)}
                                    required
                                    className="bg-[#002a40] border-slate-600 text-white placeholder:text-slate-500 focus:border-[#0ea5e9] hover:bg-[#003554] transition-colors"
                                />
                                <p className="text-xs text-slate-500">
                                    The name of your compliance workspace
                                </p>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="email" className="text-slate-300">Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="name@company.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    className="bg-[#002a40] border-slate-600 text-white placeholder:text-slate-500 focus:border-[#0ea5e9] hover:bg-[#003554] transition-colors"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="password" className="text-slate-300">Password</Label>
                                <Input
                                    id="password"
                                    type="password"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    minLength={6}
                                    className="bg-[#002a40] border-slate-600 text-white placeholder:text-slate-500 focus:border-[#0ea5e9] hover:bg-[#003554] transition-colors"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="confirmPassword" className="text-slate-300">Confirm Password</Label>
                                <Input
                                    id="confirmPassword"
                                    type="password"
                                    placeholder="••••••••"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    required
                                    minLength={6}
                                    className="bg-[#002a40] border-slate-600 text-white placeholder:text-slate-500 focus:border-[#0ea5e9] hover:bg-[#003554] transition-colors"
                                />
                            </div>
                        </div>
                    </CardContent>
                    <CardFooter className="flex flex-col space-y-4 pb-8">
                        <Button type="submit" className="w-full bg-emerald-500 hover:bg-emerald-600 text-white h-11 font-medium text-lg border-none" disabled={loading}>
                            {loading ? (
                                <span className="flex items-center gap-2">
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Processing...
                                </span>
                            ) : 'Create Account & Pay'}
                        </Button>
                        <div className="text-center text-sm text-slate-400">
                            Already have an account?{' '}
                            <Button
                                variant="link"
                                type="button"
                                className="px-0 font-semibold text-[#0ea5e9] hover:text-[#0284c7]"
                                onClick={() => {
                                    const invite = new URLSearchParams(window.location.search).get('invite');
                                    setLocation(invite ? `/login?invite=${invite}` : '/login');
                                }}
                            >
                                Sign in
                            </Button>
                        </div>
                    </CardFooter>
                </form>
            </Card>
            {showMFAModal && (
                <MFAChallengeModal
                    open={showMFAModal}
                    onOpenChange={async (o) => {
                        setShowMFAModal(o);
                        if (!o) {
                            const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
                            if (aal?.currentLevel === 'aal2') {
                                setMfaRequired(false);
                                setLoading(true);
                                const searchParams = new URLSearchParams(window.location.search);
                                const tier = (searchParams.get('tier') || 'startup') as 'startup' | 'pro' | 'guided' | 'enterprise';
                                const interval = (searchParams.get('interval') || 'month') as 'month' | 'year';
                                const { url } = await createUserCheckout.mutateAsync({
                                    tier,
                                    interval,
                                    successUrl: `${window.location.origin}/dashboard?onboarding=true&payment_success=true`,
                                    cancelUrl: `${window.location.origin}/login`,
                                });
                                if (url) window.location.href = url;
                            }
                        }
                    }}
                    factorId={factorId}
                />
            )}
        </div>
    );
}

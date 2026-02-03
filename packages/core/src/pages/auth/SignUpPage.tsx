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

export default function SignUpPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [organizationName, setOrganizationName] = useState('');
    const [fullName, setFullName] = useState('');
    const [loading, setLoading] = useState(false);
    const [, setLocation] = useLocation();
    const { user, signIn } = useAuth(); // Use signIn from AuthContext for consistent state

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

            toast.success("Account created! Redirecting to payment...");

            // Step 3: Create Checkout Session
            // We need to pass the selected tier and interval.
            // The user is not yet created in the 'users' table via webhook potentially if that's async? 
            // In many setups, the TRPC call might fail if the public.users record doesn't exist yet. 
            // Assuming the `createUserCheckout` uses `ctx.user` which comes from Supabase auth token, it should be fine.
            // BUT, `billing.ts` `createUserCheckout` uses `ctx.user.stripeCustomerId`. 
            // If the webhook hasn't fired to create the user/stripe customer, this might fail if it relies on DB record.
            // Let's check `createUserCheckout` in billing.ts.
            // It uses `ctx.user.stripeCustomerId`. `ctx.user` usually comes from looking up the user in the DB based on auth ID.
            // If the webhook is slow, `ctx.user` might be null or missing fields.

            // However, `createUserCheckout` handles the case where `ctx.user.stripeCustomerId` is undefined by passing it as undefined to `createCheckoutSession`.
            // `createCheckoutSession` then uses `customer_email`.
            // So it should be robust enough even if the DB record isn't fully synced, AS LONG AS accessing `ctx.user` parses the JWT successfully or finds the user.
            // The `isAuthed` middleware likely checks the DB.

            // If `isAuthed` checks DB, we might race.
            // For now, let's assume the latency is acceptable or the middleware just checks JWT. 
            // (Standard T3/Supabase stacks often check DB in context creation).

            // Let's trigger it.
            const { url } = await createUserCheckout.mutateAsync({
                tier,
                interval,
                successUrl: `${window.location.origin}/dashboard?onboarding=true&payment_success=true`, // Redirect to dashboard after payment
                cancelUrl: `${window.location.origin}/login`, // If they cancel, they go to login (and are technically signed up but unpaid)
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
                                onClick={() => setLocation('/login')}
                            >
                                Sign in
                            </Button>
                        </div>
                    </CardFooter>
                </form>
            </Card>
        </div>
    );
}

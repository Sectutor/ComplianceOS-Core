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
import { Loader2 } from 'lucide-react';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [, setLocation] = useLocation();
    const { user, signIn, signOut } = useAuth();

    // Check if user has seen tour
    const { 
        data: userProfile, 
        isLoading: isProfileLoading, 
        isError, 
        error: profileError 
    } = trpc.users.me.useQuery(undefined, {
        enabled: !!user,
        retry: false
    });

    useEffect(() => {
        if (user && !isProfileLoading) {
            if (isError) {
                console.error("Profile fetch failed:", profileError);
                return;
            }

            if (userProfile && !userProfile.hasSeenTour) {
                setLocation('/start-here');
            } else {
                setLocation('/dashboard');
            }
        }
    }, [user, userProfile, isProfileLoading, setLocation, isError, profileError]);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            // Use the signIn method from context to ensure it works with Mock Auth
            await signIn(email, password);

            toast.success('Logged in successfully');
            // Redirect logic handled by useEffect
        } catch (error: any) {
            toast.error(error.message || 'Failed to login');
            setLoading(false);
        }
    };

    if (user && isProfileLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-[#002a40]">
                <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
            </div>
        );
    }

    if (user && isError) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-[#002a40] p-4">
                <Card className="w-full max-w-md bg-[#001e2b] border-red-900/50 shadow-2xl">
                    <CardHeader>
                        <CardTitle className="text-red-500">Authentication Error</CardTitle>
                        <CardDescription className="text-slate-400">
                            We verified your credentials, but could not load your profile.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="p-3 bg-red-950/30 rounded border border-red-900/50 text-red-200 text-sm font-mono break-all">
                            {profileError?.message || 'Unknown error occurred'}
                        </div>
                    </CardContent>
                    <CardFooter>
                        <Button 
                            onClick={() => {
                                signOut();
                                setLoading(false);
                            }} 
                            variant="destructive" 
                            className="w-full"
                        >
                            Sign Out & Try Again
                        </Button>
                    </CardFooter>
                </Card>
            </div>
        );
    }

    return (
        <div className="flex items-center justify-center min-h-screen bg-[#002a40]">
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-20" />

            <Card className="w-full max-w-md relative z-10 bg-[#001e2b] border-slate-700 shadow-2xl">
                <CardHeader className="text-center space-y-1">
                    <div className="mx-auto h-12 w-12 rounded-xl bg-[#0ea5e9] flex items-center justify-center text-white mb-4">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="h-7 w-7"
                        >
                            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                        </svg>
                    </div>
                    <CardTitle className="text-2xl font-bold text-white">Welcome Back</CardTitle>
                    <CardDescription className="text-slate-400">Sign in to your GRCompliance account</CardDescription>
                </CardHeader>
                <form onSubmit={handleLogin}>
                    <CardContent className="space-y-4">
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
                            <div className="flex items-center justify-between">
                                <Label htmlFor="password" className="text-slate-300">Password</Label>
                                <Button variant="link" className="px-0 font-normal h-auto text-[#0ea5e9] hover:text-[#0284c7]" type="button">Forgot password?</Button>
                            </div>
                            <Input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                className="bg-[#002a40] border-slate-600 text-white placeholder:text-slate-500 focus:border-[#0ea5e9] hover:bg-[#003554] transition-colors"
                            />
                        </div>
                    </CardContent>
                    <CardFooter className="flex flex-col space-y-4 pb-8">
                        <Button type="submit" className="w-full bg-emerald-500 hover:bg-emerald-600 text-white h-11 font-medium text-lg border-none" disabled={loading}>
                            {loading ? 'Signing in...' : 'Sign In'}
                        </Button>
                        <div className="text-center text-sm text-slate-400">
                            Don't have an account?{' '}
                            <Button
                                variant="link"
                                type="button"
                                className="px-0 font-semibold text-[#0ea5e9] hover:text-[#0284c7]"
                                onClick={() => setLocation('/signup')}
                            >
                                Sign up
                            </Button>
                        </div>
                    </CardFooter>
                </form>
            </Card>
        </div>
    );
}

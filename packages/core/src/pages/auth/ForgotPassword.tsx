
import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@complianceos/ui/ui/button";
import { Input } from "@complianceos/ui/ui/input";
import { Label } from "@complianceos/ui/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@complianceos/ui/ui/card";
import { CheckCircle2, Loader2, ArrowLeft, Shield } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabaseClient";

export default function ForgotPassword() {
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [, setLocation] = useLocation();

    const handleReset = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            // For localhost, we need to specify result redirect
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/update-password`,
            });

            if (error) throw error;

            setSubmitted(true);
            toast.success("Password reset email sent!");
        } catch (error: any) {
            toast.error(error.message || "Failed to send reset email");
        } finally {
            setLoading(false);
        }
    };

    if (submitted) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-muted/40 p-4">
                <Card className="w-full max-w-md shadow-lg border-muted/60">
                    <CardHeader className="text-center space-y-2">
                        <div className="flex justify-center mb-2">
                            <div className="p-3 bg-green-100 rounded-full">
                                <CheckCircle2 className="h-8 w-8 text-green-600" />
                            </div>
                        </div>
                        <CardTitle className="text-2xl font-bold">Check your email</CardTitle>
                        <CardDescription className="text-base">
                            We've sent a password reset link to <span className="font-semibold text-foreground">{email}</span>
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="text-center text-sm text-muted-foreground">
                        <p>Click the link in the email to set a new password.</p>
                        <p className="mt-2 text-xs">If you don't see it, check your spam folder.</p>
                    </CardContent>
                    <CardFooter className="flex justify-center">
                        <Button variant="outline" onClick={() => setLocation('/login')} className="w-full">
                            Back to Login
                        </Button>
                    </CardFooter>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-muted/40 p-4">
            <div className="mb-8 flex items-center gap-2">
                <Shield className="h-8 w-8 text-primary" />
                <span className="text-2xl font-bold tracking-tight">Compliance OS</span>
            </div>

            <Card className="w-full max-w-md shadow-lg border-muted/60">
                <CardHeader className="space-y-1">
                    <CardTitle className="text-2xl font-bold">Reset Password</CardTitle>
                    <CardDescription>
                        Enter your email address and we'll send you a link to reset your password.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleReset} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="name@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>
                        <Button type="submit" className="w-full" disabled={loading}>
                            {loading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Sending link...
                                </>
                            ) : (
                                "Send Reset Link"
                            )}
                        </Button>
                    </form>
                </CardContent>
                <CardFooter className="flex justify-center">
                    <Link href="/login" className="text-sm text-muted-foreground hover:text-primary flex items-center gap-1 transition-colors">
                        <ArrowLeft className="h-3 w-3" /> Back to Login
                    </Link>
                </CardFooter>
            </Card>
        </div>
    );
}

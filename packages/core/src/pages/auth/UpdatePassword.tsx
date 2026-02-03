
import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@complianceos/ui/ui/button";
import { Input } from "@complianceos/ui/ui/input";
import { Label } from "@complianceos/ui/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@complianceos/ui/ui/card";
import { Loader2, Shield, Lock } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabaseClient";

export default function UpdatePassword() {
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [, setLocation] = useLocation();

    useEffect(() => {
        // Check if we have a session (e.g. from the magic link)
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (!session) {
                // If accessed directly without session (and not a recovery link), redirect
                // Ideally, the recovery link logs them in automatically via Supabase Auth helper
            }
        });
    }, []);

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            toast.error("Passwords do not match");
            return;
        }
        if (password.length < 6) {
            toast.error("Password must be at least 6 characters");
            return;
        }

        setLoading(true);

        try {
            const { error } = await supabase.auth.updateUser({
                password: password
            });

            if (error) throw error;

            toast.success("Password updated successfully!");
            setLocation('/login'); // Redirect to login (or dashboard)
        } catch (error: any) {
            toast.error(error.message || "Failed to update password");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-muted/40 p-4">
            <div className="mb-8 flex items-center gap-2">
                <Shield className="h-8 w-8 text-primary" />
                <span className="text-2xl font-bold tracking-tight">Compliance OS</span>
            </div>

            <Card className="w-full max-w-md shadow-lg border-muted/60">
                <CardHeader className="space-y-1">
                    <CardTitle className="text-2xl font-bold">Set New Password</CardTitle>
                    <CardDescription>
                        Enter your new password below.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleUpdate} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="password">New Password</Label>
                            <Input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                className="pl-8 relative"
                            />
                            {/* Icon placeholder if needed, using CSS ideally */}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="confirmPassword">Confirm Password</Label>
                            <Input
                                id="confirmPassword"
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                            />
                        </div>
                        <Button type="submit" className="w-full" disabled={loading}>
                            {loading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Updating...
                                </>
                            ) : (
                                "Update Password"
                            )}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}

import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { trpc } from "@/lib/trpc";
import { Button } from "@complianceos/ui/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@complianceos/ui/ui/card";
import { Shield, CreditCard, LogOut, Loader2, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { useLocation } from "wouter";

export default function CompleteSubscription() {
    const { user, signOut } = useAuth();
    const [, setLocation] = useLocation();

    // Fetch latest user data from DB to get plan tier
    const { data: dbUser, isLoading } = trpc.users.me.useQuery();

    // Mutation to create checkout
    const createUserCheckout = trpc.billing.createUserCheckout.useMutation();

    const handlePayment = async () => {
        if (!dbUser) return;

        try {
            // Default to monthly if not specified/stored, but ideally we should know.
            // Since we don't store "interval" in the user table (only planTier), 
            // we might have to default to monthly or ask the user.
            // For this 'abandoned cart' recovery, let's assume monthly for now 
            // OR provide a toggle if we wanted to be fancy.
            // Simpler: Just re-use the tier from DB and default interval.

            const interval = "month"; // Defaulting to month for recovery flow
            const tier = dbUser.planTier === 'enterprise' ? 'enterprise' :
                dbUser.planTier === 'pro' ? 'pro' : 'startup';

            toast.loading("Preparing checkout...");

            const { url } = await createUserCheckout.mutateAsync({
                tier,
                interval,
                successUrl: `${window.location.origin}/dashboard?onboarding=true`,
                cancelUrl: `${window.location.origin}/complete-subscription`, // Come back here if they cancel again
            });

            if (url) {
                window.location.href = url;
            } else {
                toast.error("Failed to generate payment link");
            }
        } catch (error: any) {
            toast.error(error.message || "Something went wrong");
        }
    };

    const handleSignOut = async () => {
        await signOut();
        setLocation("/login");
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#0F172A]">
                <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-[#0F172A] text-slate-50 relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
                <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-900/20 rounded-full blur-[100px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-indigo-900/20 rounded-full blur-[100px]" />
            </div>

            <div className="z-10 w-full max-w-md">
                <div className="flex justify-center mb-8">
                    <div className="p-4 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-xl shadow-2xl">
                        <Shield className="h-12 w-12 text-blue-400" />
                    </div>
                </div>

                <Card className="border-white/10 bg-white/5 backdrop-blur-xl shadow-2xl">
                    <CardHeader className="text-center pb-2">
                        <CardTitle className="text-2xl font-bold text-white">Complete Your Subscription</CardTitle>
                        <CardDescription className="text-slate-400 text-base">
                            Your account is created, but your subscription is pending.
                        </CardDescription>
                    </CardHeader>

                    <CardContent className="space-y-6 pt-6">
                        <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 flex items-start gap-3">
                            <CreditCard className="h-5 w-5 text-blue-400 mt-0.5 shrink-0" />
                            <div>
                                <h4 className="font-semibold text-blue-100 text-sm">Payment Required</h4>
                                <p className="text-xs text-blue-200/80 mt-1">
                                    You selected the <span className="font-bold text-white uppercase">{dbUser?.planTier}</span> plan.
                                    Please complete payment to access your dashboard.
                                </p>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Button
                                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold h-11 shadow-lg shadow-blue-900/20"
                                onClick={handlePayment}
                                disabled={createUserCheckout.isPending}
                            >
                                {createUserCheckout.isPending ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Processing...
                                    </>
                                ) : (
                                    <>
                                        Complete Payment <ArrowRight className="ml-2 h-4 w-4" />
                                    </>
                                )}
                            </Button>

                            <Button
                                variant="ghost"
                                className="w-full text-slate-400 hover:text-white hover:bg-white/5"
                                onClick={handleSignOut}
                            >
                                <LogOut className="mr-2 h-4 w-4" />
                                Sign Out
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                <p className="text-center text-xs text-slate-500 mt-8">
                    Need help? Contact support@complianceos.com
                </p>
            </div>
        </div>
    );
}

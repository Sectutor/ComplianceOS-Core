import { useState, useEffect } from "react";
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter
} from "@complianceos/ui/ui/dialog";
import { Button } from "@complianceos/ui/ui/button";
import { Input } from "@complianceos/ui/ui/input";
import { Label } from "@complianceos/ui/ui/label";
import { Card, CardContent } from "@complianceos/ui/ui/card";
import { Checkbox } from "@complianceos/ui/ui/checkbox";
import { Badge } from "@complianceos/ui/ui/badge";
import {
    Shield,
    Sparkles,
    Building2,
    ArrowRight,
    Loader2,
    CheckCircle2,
    Rocket,
    Wand2
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

export function OnboardingWizard() {
    const { user } = useAuth();
    const { data: clients, isLoading: clientsLoading } = trpc.clients.list.useQuery();
    const { data: allFrameworks, isLoading: frameworksLoading } = trpc.frameworks.getOnboardingFrameworks.useQuery();
    const { data: stats } = trpc.dashboard.enhanced.useQuery();
    const [open, setOpen] = useState(false);
    const [step, setStep] = useState(1);
    const [, setLocation] = useLocation();
    const utils = trpc.useUtils();

    const isAdmin = user?.role === 'admin' || user?.role === 'owner' || user?.role === 'super_admin';

    const [formData, setFormData] = useState({
        name: "",
        industry: "Technology",
        frameworks: [],
        generatePolicies: true,
        useSampleData: false
    });

    const setupMutation = trpc.clients.autoSetup.useMutation({
        onSuccess: async (client) => {
            toast.success("Workspace configured successfully!");
            // Ensure queries are invalidated and wait for completion
            await Promise.all([
                utils.clients.list.invalidate(),
                utils.dashboard.enhanced.invalidate()
            ]);
            // Small delay to ensure data is refreshed
            await new Promise(resolve => setTimeout(resolve, 300));
            setOpen(false);
            setLocation(`/clients/${client.id}?onboarding=complete`);
        },
        onError: (error) => {
            toast.error(`Auto-setup failed: ${error.message}`);
        }
    });

    const sampleMutation = trpc.clients.createSampleData.useMutation({
        onSuccess: async (client) => {
            toast.success("Magic Sample Data workspace created!");
            // Ensure queries are invalidated and wait for completion
            await Promise.all([
                utils.clients.list.invalidate(),
                utils.dashboard.enhanced.invalidate()
            ]);
            // Small delay to ensure data is refreshed
            await new Promise(resolve => setTimeout(resolve, 300));
            setOpen(false);
            setLocation(`/clients/${client.id}?onboarding=complete`);
        },
        onError: (error) => {
            toast.error(`Sample data creation failed: ${error.message}`);
        }
    });

    useEffect(() => {
        if (!clientsLoading && clients && clients.length === 0) {
            setOpen(true);
        }
    }, [clients, clientsLoading]);

    const handleFrameworkToggle = (fw: string) => {
        setFormData(prev => ({
            ...prev,
            frameworks: prev.frameworks.includes(fw)
                ? prev.frameworks.filter(f => f !== fw)
                : [...prev.frameworks, fw]
        }));
    };

    const handleNext = () => {
        if (step === 1 && !formData.name) {
            toast.error("Please enter your company name");
            return;
        }
        setStep(prev => prev + 1);
    };

    const handleBack = () => setStep(prev => prev - 1);

    const handleFinish = () => {
        setupMutation.mutate({
            name: formData.name,
            industry: formData.industry,
            frameworks: formData.frameworks,
            generatePolicies: formData.generatePolicies,
            includeSampleData: formData.useSampleData
        });
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden border-none shadow-2xl bg-white">
                <DialogHeader className="sr-only">
                    <DialogTitle>Welcome to GRCompliance</DialogTitle>
                    <DialogDescription>Configure your security foundation and compliance frameworks.</DialogDescription>
                </DialogHeader>

                <div className="bg-gradient-to-br from-blue-600 via-primary to-indigo-800 p-8 text-white relative">
                    <Wand2 className="absolute top-4 right-4 h-24 w-24 text-white/10 rotate-12" />
                    <div className="relative z-10">
                        <Badge variant="secondary" className="bg-white/20 text-white border-none mb-4 backdrop-blur-md">
                            <Sparkles className="h-3 w-3 mr-1 text-yellow-300" />
                            AI Setup Assistant
                        </Badge>
                        <h2 className="text-3xl font-bold tracking-tight">Welcome to GRCompliance</h2>
                        <p className="text-white/70 mt-2">Let's build your security foundation in 60 seconds.</p>
                    </div>
                </div>


                <div className="p-8 space-y-6">
                    {step === 1 && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="name" className="text-base font-semibold">Company Name</Label>
                                    <Input
                                        id="name"
                                        placeholder="e.g. Acme Security Corp"
                                        value={formData.name}
                                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                        className="h-12 border-slate-200 focus:border-primary/50 focus:ring-primary/20"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="industry" className="text-base font-semibold">Industry</Label>
                                    <select
                                        id="industry"
                                        className="flex h-12 w-full rounded-md border border-slate-200 bg-transparent px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary/50 disabled:cursor-not-allowed disabled:opacity-50"
                                        value={formData.industry}
                                        onChange={(e) => setFormData(prev => ({ ...prev, industry: e.target.value }))}
                                    >
                                        <option value="Technology">Technology</option>
                                        <option value="Healthcare">Healthcare</option>
                                        <option value="Finance">Finance</option>
                                        <option value="Retail">Retail</option>
                                        <option value="Manufacturing">Manufacturing</option>
                                        <option value="Education">Education</option>
                                        <option value="Government">Government</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                            <div>
                                <Label className="text-base font-semibold">Which standards are you targeting?</Label>
                                <p className="text-sm text-muted-foreground mt-1">Select all that apply to your organization. (Total: {allFrameworks?.length || 0})</p>
                            </div>
                            <div className="grid gap-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                                {frameworksLoading ? (
                                    <div className="space-y-3">
                                        {[1, 2, 3].map(i => (
                                            <div key={i} className="h-20 w-full bg-slate-50 animate-pulse rounded-xl" />
                                        ))}
                                    </div>
                                ) : (
                                    allFrameworks?.map((fw: any) => (
                                        <Card
                                            key={fw.id}
                                            className={`cursor-pointer transition-all border-2 ${formData.frameworks.includes(fw.shortCode)
                                                ? "border-primary bg-primary/5 shadow-md"
                                                : "border-slate-100 hover:border-slate-300"
                                                }`}
                                            onClick={() => handleFrameworkToggle(fw.shortCode)}
                                        >
                                            <CardContent className="p-4 flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className={`p-2 rounded-lg ${formData.frameworks.includes(fw.shortCode) ? "bg-primary/20 text-primary" : "bg-slate-100 text-slate-500"
                                                        }`}>
                                                        <Shield className="h-5 w-5" />
                                                    </div>
                                                    <div>
                                                        <p className="font-bold">{fw.name}</p>
                                                        <p className="text-xs text-muted-foreground line-clamp-1">{fw.description || fw.shortCode}</p>
                                                    </div>
                                                </div>
                                                <Checkbox checked={formData.frameworks.includes(fw.shortCode)} />
                                            </CardContent>
                                        </Card>
                                    ))
                                )}
                                {!frameworksLoading && (!allFrameworks || allFrameworks.length === 0) && (
                                    <div className="py-8 text-center border-2 border-dashed rounded-xl">
                                        <p className="text-muted-foreground text-sm">No standards found in database.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {step === 3 && (
                        <div className="text-center space-y-6 animate-in fade-in zoom-in duration-500">
                            <div className="mx-auto w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center">
                                <Rocket className="h-10 w-10 text-primary animate-bounce" />
                            </div>
                            <div className="space-y-1">
                                <h3 className="text-2xl font-bold">Ready for Lift-off?</h3>
                                <p className="text-muted-foreground text-sm">
                                    Our AI will now create your workspace for <span className="font-bold text-slate-900">{formData.name}</span>
                                    and a separate <span className="font-bold text-slate-900">{formData.name} DEMO</span> environment populated with sample data.
                                </p>
                            </div>

                            <div className="flex items-center justify-center gap-2 p-3 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium border border-blue-100">
                                <Sparkles className="h-4 w-4 text-blue-600" />
                                Atomic One-click Magic Configuration
                            </div>
                        </div>
                    )}
                </div>

                <DialogFooter className="p-8 bg-slate-50/50 border-t flex flex-row items-center justify-between space-x-2">
                    {step > 1 ? (
                        <Button variant="ghost" onClick={handleBack} disabled={setupMutation.isPending} className="font-medium text-slate-600">
                            Go Back
                        </Button>
                    ) : (
                        <div />
                    )}

                    {step < 3 ? (
                        <Button onClick={handleNext} className="h-12 px-8 font-bold shadow-lg shadow-primary/20 bg-primary rounded-xl">
                            Next Step
                            <ArrowRight className="h-4 w-4 ml-2" />
                        </Button>
                    ) : (
                        <Button
                            onClick={handleFinish}
                            className="h-12 px-8 font-bold shadow-lg rounded-xl transition-all bg-primary hover:bg-primary/90 shadow-primary/20"
                            disabled={setupMutation.isPending || sampleMutation.isPending}
                        >
                            {setupMutation.isPending || sampleMutation.isPending ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Building Workspaces...
                                </>
                            ) : (
                                <>
                                    Launch Workspaces
                                    <Rocket className="h-4 w-4 ml-2" />
                                </>
                            )}
                        </Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

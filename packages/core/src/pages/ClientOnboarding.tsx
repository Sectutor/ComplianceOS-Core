import { useAuth } from "@/contexts/AuthContext";
import { WizardLayout } from "@/components/readiness/WizardLayout";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@complianceos/ui/ui/button";
import { Card, CardContent } from "@complianceos/ui/ui/card";
import { Input } from "@complianceos/ui/ui/input";
import { Label } from "@complianceos/ui/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@complianceos/ui/ui/select";
import { Textarea } from "@complianceos/ui/ui/textarea";
import { Checkbox } from "@complianceos/ui/ui/checkbox";
import { Badge } from "@complianceos/ui/ui/badge";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { useState } from "react";
import { useLocation } from "wouter";
import {
  Building2,
  Shield,
  FileText,
  CheckCircle2,
  Loader2,
  Sparkles,
  Globe,
  Rocket
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ClientFormData {
  name: string;
  industry: string;
  contactName: string;
  contactEmail: string;
  description: string;
  systems: string;
}

interface FrameworkSelection {
  iso27001: boolean;
  soc2: boolean;
}

const ONBOARDING_STEPS = [
  { id: 1, title: "Client Details", description: "Basic Info" },
  { id: 2, title: "Frameworks", description: "Standards" },
  { id: 3, title: "Controls", description: "Selection" },
  { id: 4, title: "Policies", description: "Generation" },
  { id: 5, title: "Complete", description: "Summary" },
];

export default function ClientOnboarding() {
  const { loading: authLoading } = useAuth();
  const [, navigate] = useLocation();
  const utils = trpc.useUtils();

  const [currentStep, setCurrentStep] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [createdClientId, setCreatedClientId] = useState<number | null>(null);

  // Form state
  const [clientData, setClientData] = useState<ClientFormData>({
    name: "",
    industry: "",
    contactName: "",
    contactEmail: "",
    description: "",
    systems: "",
  });

  const [frameworks, setFrameworks] = useState<FrameworkSelection>({
    iso27001: true,
    soc2: false,
  });

  const [assignControls, setAssignControls] = useState(true);
  const [generatePolicies, setGeneratePolicies] = useState(true);

  // Mutations
  const onboard = trpc.clients.onboard.useMutation();

  const handleNext = async () => {
    // Validation Logic
    if (currentStep === 1) {
      if (!clientData.name.trim()) { toast.error("Client name is required"); return; }
      if (!clientData.industry) { toast.error("Please select an industry"); return; }
    }
    if (currentStep === 2) {
      if (!frameworks.iso27001 && !frameworks.soc2) { toast.error("Please select at least one framework"); return; }
    }

    // Final Submission at end of step 4 (moving to 5)
    if (currentStep === 4) {
      setIsProcessing(true);
      try {
        const frameworkList = [];
        if (frameworks.iso27001) frameworkList.push("ISO 27001");
        if (frameworks.soc2) frameworkList.push("SOC 2");

        const result = await onboard.mutateAsync({
          name: clientData.name,
          industry: clientData.industry,
          frameworks: frameworkList,
          companyName: clientData.name,
          generatePolicies: generatePolicies
        });

        setCreatedClientId(result.id);
        toast.success("Client workspace created successfully!");
        utils.clients.list.invalidate();
        setCurrentStep(5);
      } catch (err) {
        toast.error("Failed to create client workspace");
        setIsProcessing(false);
      }
    } else {
      setCurrentStep(prev => prev + 1);
    }
  };

  return (
    <DashboardLayout>
      <WizardLayout
        title="New Client Onboarding"
        currentStep={currentStep}
        totalSteps={ONBOARDING_STEPS.length}
        steps={ONBOARDING_STEPS}
        clientId={0}
        embedded={true}
      >
        <div className="max-w-3xl mx-auto py-8">
          {/* Step 1: Client Details */}
          {currentStep === 1 && (
            <div className="space-y-6 animate-in slide-in-from-right-4 duration-500">
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-indigo-100 text-indigo-600 mb-4">
                  <Building2 className="w-6 h-6" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900">Client Details</h2>
                <p className="text-slate-500 mt-1">Basic information to set up the workspace</p>
              </div>

              <Card className="border-indigo-100 shadow-sm">
                <CardContent className="p-6 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Company Name</Label>
                      <Input
                        placeholder="e.g. Acme Corp"
                        value={clientData.name}
                        onChange={(e) => setClientData({ ...clientData, name: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Industry</Label>
                      <Select
                        value={clientData.industry}
                        onValueChange={(val) => setClientData({ ...clientData, industry: val })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select industry" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="FinTech">FinTech</SelectItem>
                          <SelectItem value="HealthTech">HealthTech</SelectItem>
                          <SelectItem value="SaaS">SaaS</SelectItem>
                          <SelectItem value="E-commerce">E-commerce</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Textarea
                      placeholder="Brief description of the business..."
                      value={clientData.description}
                      onChange={(e) => setClientData({ ...clientData, description: e.target.value })}
                    />
                  </div>
                </CardContent>
              </Card>

              <div className="flex justify-end pt-4">
                <Button
                  onClick={handleNext}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-100"
                >
                  Continue
                  <Sparkles className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>
          )}

          {/* Step 2: Frameworks */}
          {currentStep === 2 && (
            <div className="space-y-6 animate-in slide-in-from-right-4 duration-500">
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-purple-100 text-purple-600 mb-4">
                  <Shield className="w-6 h-6" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900">Select Frameworks</h2>
                <p className="text-slate-500 mt-1">Which standards does this client need to meet?</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div
                  className={cn(
                    "cursor-pointer transition-all duration-200 border-2 rounded-xl p-6 hover:border-indigo-300 hover:bg-slate-50",
                    frameworks.iso27001 ? "border-indigo-600 bg-indigo-50/50 ring-2 ring-indigo-100" : "border-slate-200 bg-white"
                  )}
                  onClick={() => setFrameworks({ ...frameworks, iso27001: !frameworks.iso27001 })}
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="bg-white p-2 rounded-lg border border-slate-100 shadow-sm">
                      <Globe className="w-6 h-6 text-blue-600" />
                    </div>
                    {frameworks.iso27001 && <CheckCircle2 className="w-6 h-6 text-indigo-600" />}
                  </div>
                  <h3 className="font-bold text-slate-900">ISO 27001</h3>
                  <p className="text-sm text-slate-500 mt-1">International standard for information security management systems.</p>
                </div>

                <div
                  className={cn(
                    "cursor-pointer transition-all duration-200 border-2 rounded-xl p-6 hover:border-indigo-300 hover:bg-slate-50",
                    frameworks.soc2 ? "border-indigo-600 bg-indigo-50/50 ring-2 ring-indigo-100" : "border-slate-200 bg-white"
                  )}
                  onClick={() => setFrameworks({ ...frameworks, soc2: !frameworks.soc2 })}
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="bg-white p-2 rounded-lg border border-slate-100 shadow-sm">
                      <FileText className="w-6 h-6 text-emerald-600" />
                    </div>
                    {frameworks.soc2 && <CheckCircle2 className="w-6 h-6 text-indigo-600" />}
                  </div>
                  <h3 className="font-bold text-slate-900">SOC 2 Type II</h3>
                  <p className="text-sm text-slate-500 mt-1">Trust Services Criteria for security, availability, and confidentiality.</p>
                </div>
              </div>

              <div className="flex justify-between pt-8">
                <Button variant="outline" onClick={() => setCurrentStep(1)}>Back</Button>
                <Button onClick={handleNext} className="bg-indigo-600 hover:bg-indigo-700">Continue</Button>
              </div>
            </div>
          )}

          {/* Step 3: Controls */}
          {currentStep === 3 && (
            <div className="space-y-6 animate-in slide-in-from-right-4 duration-500">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-slate-900">Control Implementation</h2>
                <p className="text-slate-500">Configure initial control set</p>
              </div>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="assignControls"
                      checked={assignControls}
                      onCheckedChange={(c) => setAssignControls(c as boolean)}
                    />
                    <Label htmlFor="assignControls">Auto-assign baseline controls based on frameworks</Label>
                  </div>
                </CardContent>
              </Card>
              <div className="flex justify-between pt-8">
                <Button variant="outline" onClick={() => setCurrentStep(2)}>Back</Button>
                <Button onClick={handleNext}>Continue</Button>
              </div>
            </div>
          )}

          {/* Step 4: Policies */}
          {currentStep === 4 && (
            <div className="space-y-6 animate-in slide-in-from-right-4 duration-500">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-slate-900">Policy Generation</h2>
                <p className="text-slate-500">Generate initial policy documents</p>
              </div>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="generatePolicies"
                      checked={generatePolicies}
                      onCheckedChange={(c) => setGeneratePolicies(c as boolean)}
                    />
                    <Label htmlFor="generatePolicies">Generate AI-drafted policies for selected frameworks</Label>
                  </div>
                </CardContent>
              </Card>
              <div className="flex justify-between pt-8">
                <Button variant="outline" onClick={() => setCurrentStep(3)}>Back</Button>
                <Button onClick={handleNext} disabled={isProcessing}>
                  {isProcessing ? <Loader2 className="animate-spin w-4 h-4 mr-2" /> : <Rocket className="w-4 h-4 mr-2" />}
                  Launch Workspace
                </Button>
              </div>
            </div>
          )}

          {/* Step 5: Complete */}
          {currentStep === 5 && (
            <div className="text-center space-y-6 animate-in zoom-in duration-500">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-100 text-green-600 mb-4">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h2 className="text-3xl font-bold text-slate-900">Setup Complete!</h2>
              <p className="text-slate-500">Client workspace has been provisioned successfully.</p>

              <div className="flex justify-center gap-4 pt-8">
                <Button variant="outline" onClick={() => navigate('/dashboard')}>Go to Dashboard</Button>
                <Button onClick={() => navigate(`/clients/${createdClientId}`)}>Enter Workspace</Button>
              </div>
            </div>
          )}
        </div>
      </WizardLayout>
    </DashboardLayout>
  );
}

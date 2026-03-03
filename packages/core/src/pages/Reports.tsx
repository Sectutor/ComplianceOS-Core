import React, { useState } from 'react';
import DashboardLayout from "@/components/DashboardLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@complianceos/ui/ui/tabs";
import { ReportsDashboard } from "@/components/reports/ReportsDashboard";
import { ExecutiveDashboard } from "@/components/reports/ExecutiveDashboard";
import { PremiumSlot } from "@/components/PremiumSlot";
import { useClientContext } from "@/contexts/ClientContext";
import { useParams } from 'wouter';
import {
  FileBarChart,
  Zap,
  History,
  LayoutDashboard,
  Download,
  Sparkles,
  Shield
} from 'lucide-react';
import { Button } from "@complianceos/ui";

export default function Reports() {
  const params = useParams();
  const { selectedClientId, isPremiumStatus } = useClientContext();
  const clientId = params.id ? parseInt(params.id, 10) : selectedClientId;
  const [activeTab, setActiveTab] = useState("dashboard");
  const isPremium = isPremiumStatus;

  if (!clientId) return (
    <DashboardLayout>
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-4">
        <div className="p-4 bg-slate-50 rounded-full">
          <Shield className="w-12 h-12 text-slate-300" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">No Client Workspace Selected</h2>
        <p className="text-slate-500 max-w-sm">Please select a client from the sidebar or the Clients list to view reporting intelligence.</p>
      </div>
    </DashboardLayout>
  );

  return (
    <DashboardLayout>
      <div className="space-y-8 w-full max-w-full animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="outline" className="border-[#3ABEF9]/20 text-[#3ABEF9] bg-[#3ABEF9]/5 flex items-center gap-1.5 px-3">
                <Sparkles className="w-3.5 h-3.5" />
                Premium Analytics
              </Badge>
            </div>
            <h2 className="text-4xl font-extrabold tracking-tight text-[#1C4D8D]">
              Reporting <span className="text-[#3ABEF9]">&</span> Insights
            </h2>
            <p className="text-slate-500 max-w-2xl text-lg">
              Intelligence-led compliance oversight. Monitor posture, identify gaps, and generate executive reports.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" className="h-11 shadow-sm border-slate-200">
              <History className="w-4 h-4 mr-2" />
              Audit Logs
            </Button>
            <Button className="h-11 shadow-lg shadow-[#1C4D8D]/20 bg-[#1C4D8D] hover:bg-[#3ABEF9] text-white">
              <Download className="w-4 h-4 mr-2" />
              Export Posture
            </Button>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="bg-[#1C4D8D]/10 p-1.5 h-auto flex flex-wrap justify-start gap-2 w-full border border-[#1C4D8D]/20 rounded-xl mb-8">
            <TabsTrigger
              value="dashboard"
              className="data-[state=active]:bg-[#3ABEF9] data-[state=active]:text-white bg-[#1C4D8D] text-white hover:bg-[#3ABEF9] transition-all font-bold border-none px-8 py-2.5 rounded-lg flex items-center h-full"
            >
              <LayoutDashboard className="w-4 h-4 mr-2" />
              Executive Dashboard
            </TabsTrigger>
            <TabsTrigger
              value="reports"
              className="data-[state=active]:bg-[#3ABEF9] data-[state=active]:text-white bg-[#1C4D8D] text-white hover:bg-[#3ABEF9] transition-all font-bold border-none px-8 py-2.5 rounded-lg flex items-center h-full"
            >
              <History className="w-4 h-4 mr-2" />
              Report Workshop
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="mt-0 focus-visible:outline-none">
            <PremiumSlot
              featureId="executive_dashboard"
              title="Executive Dashboard"
              description="Advanced analytics and trend reporting for board-level insights."
              isPremiumEnabled={isPremium}
            >
              <ExecutiveDashboard clientId={clientId} onViewFullAnalysis={() => setActiveTab('reports')} />
            </PremiumSlot>
          </TabsContent>

          <TabsContent value="reports" className="mt-0 focus-visible:outline-none">
            <PremiumSlot
              featureId="report_builder"
              title="Advanced Report Builder"
              description="Generate Gap Analysis, One-Click Audit Packs, and custom PDF reports."
              isPremiumEnabled={isPremium}
            >
              <ReportsDashboard clientId={clientId} />
            </PremiumSlot>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}

const Badge = ({ children, variant, className }: any) => (
  <div className={`text-xs font-bold py-1 px-2.5 rounded-full ${variant === 'outline' ? 'border' : 'bg-slate-100'} ${className}`}>
    {children}
  </div>
);

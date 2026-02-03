
import React, { useState } from 'react';
import DashboardLayout from "@/components/DashboardLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@complianceos/ui/ui/tabs";
import { ReportsDashboard } from "@/components/reports/ReportsDashboard";
import { ExecutiveDashboard } from "@/components/reports/ExecutiveDashboard";
import { PremiumSlot } from "@/components/PremiumSlot";
import { useClientContext } from "@/contexts/ClientContext";
import { useParams } from 'wouter';

export default function Reports() {
  const params = useParams();
  const { selectedClientId, planTier } = useClientContext();
  const clientId = params.id ? parseInt(params.id, 10) : selectedClientId;
  const [activeTab, setActiveTab] = useState("dashboard");
  const isPremium = planTier === 'pro' || planTier === 'enterprise';

  if (!clientId) return <div>Data error: No client selected</div>;

  return (
    <DashboardLayout>
      <div className="space-y-8 p-8 animate-in fade-in duration-500 max-w-[1400px] mx-auto">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Reporting & Analytics</h2>
          <p className="text-muted-foreground mt-2">
            Comprehensive insights into compliance posture, risk exposure, and implementation progress.
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="bg-white border text-slate-500 mb-6">
            <TabsTrigger value="dashboard">Executive Dashboard</TabsTrigger>
            <TabsTrigger value="reports">Generated Reports</TabsTrigger>
            {/* Future expansion */}
            <TabsTrigger value="audit-logs">Audit Logs</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="mt-0">
            <PremiumSlot
              featureId="executive_dashboard"
              title="Executive Dashboard"
              description="Advanced analytics and trend reporting for board-level insights."
              isPremiumEnabled={isPremium}
            >
              <ExecutiveDashboard clientId={clientId} />
            </PremiumSlot>
          </TabsContent>

          <TabsContent value="reports" className="mt-0">
            <PremiumSlot
              featureId="report_builder"
              title="Advanced Report Builder"
              description="Generate Gap Analysis, One-Click Audit Packs, and custom PDF reports."
              isPremiumEnabled={isPremium}
            >
              <ReportsDashboard clientId={clientId} />
            </PremiumSlot>
          </TabsContent>

          <TabsContent value="audit-logs" className="mt-0">
            <div className="p-8 text-center bg-slate-50 border border-dashed rounded-lg text-slate-500">
              Audit Logs module coming soon...
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}

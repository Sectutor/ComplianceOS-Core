import React from 'react';
import { ContactList } from '@/components/modules/crm/ContactList';
import { ActivityFeed } from '@/components/modules/crm/ActivityFeed';
import { EngagementBoard } from '@/components/modules/crm/EngagementBoard';
import { CRMDashboard } from '@/components/modules/crm/CRMDashboard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@complianceos/ui/ui/tabs';
import { Users, Activity, BarChart3, LayoutDashboard } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { Loader2 } from 'lucide-react';

interface CRMTabProps {
    clientId: number;
}

export function CRMTab({ clientId }: CRMTabProps) {
    // Optional: Check if module seems enabled via query to avoid flashing if restricted?
    // Actually the server throws FORBIDDEN, so we should handle that gracefully.
    // For now, we rely on the parent checking 'activeModules' before rendering this tab.

    const [activeTab, setActiveTab] = React.useState('dashboard');

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
                        Compliance & Risk Tracker
                    </h2>
                    <p className="text-sm text-muted-foreground mt-1">
                        Manage compliance projects, mitigate risks, and track audit readiness.
                    </p>
                </div>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                <TabsList className="bg-muted/50 p-1 border">
                    <TabsTrigger value="dashboard" className="gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm"><LayoutDashboard className="w-4 h-4" /> Overview</TabsTrigger>
                    <TabsTrigger value="overview" className="gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm"><BarChart3 className="w-4 h-4" /> Projects</TabsTrigger>
                    <TabsTrigger value="activities" className="gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm"><Activity className="w-4 h-4" /> Activity Log</TabsTrigger>
                    <TabsTrigger value="contacts" className="gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm"><Users className="w-4 h-4" /> Stakeholders</TabsTrigger>
                </TabsList>

                <TabsContent value="dashboard" className="h-full focus-visible:outline-none focus-visible:ring-0">
                    <CRMDashboard clientId={clientId} onNavigate={setActiveTab} />
                </TabsContent>

                <TabsContent value="overview" className="h-full focus-visible:outline-none focus-visible:ring-0">
                    <EngagementBoard clientId={clientId} />
                </TabsContent>

                <TabsContent value="activities" className="focus-visible:outline-none focus-visible:ring-0">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="md:col-span-2">
                            <ActivityFeed clientId={clientId} />
                        </div>
                        <div>
                            {/* Mini Contact List for context */}
                            <div className="border rounded-xl p-6 bg-muted/30 shadow-sm sticky top-6">
                                <h4 className="font-semibold text-sm mb-4 flex items-center gap-2 text-primary"><Users className="w-4 h-4" /> Key Contacts</h4>
                                <ContactList clientId={clientId} mini />
                            </div>
                        </div>
                    </div>
                </TabsContent>

                <TabsContent value="contacts" className="focus-visible:outline-none focus-visible:ring-0">
                    <ContactList clientId={clientId} />
                </TabsContent>
            </Tabs>
        </div>
    );
}

import React from 'react';
import { ContactList } from '@/components/modules/crm/ContactList';
import { ActivityFeed } from '@/components/modules/crm/ActivityFeed';
import { DealPipeline } from '@/components/modules/crm/DealPipeline';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@complianceos/ui/ui/tabs';
import { Users, Activity, BarChart3 } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { Loader2 } from 'lucide-react';

interface CRMTabProps {
    clientId: number;
}

export function CRMTab({ clientId }: CRMTabProps) {
    // Optional: Check if module seems enabled via query to avoid flashing if restricted?
    // Actually the server throws FORBIDDEN, so we should handle that gracefully.
    // For now, we rely on the parent checking 'activeModules' before rendering this tab.

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-lg font-semibold tracking-tight">CRM & Pipeline</h2>
                    <p className="text-sm text-muted-foreground">Manage relationships, track interactions, and monitor deals.</p>
                </div>
            </div>

            <Tabs defaultValue="overview" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="overview" className="gap-2"><BarChart3 className="w-4 h-4" /> Pipeline</TabsTrigger>
                    <TabsTrigger value="activities" className="gap-2"><Activity className="w-4 h-4" /> Activities</TabsTrigger>
                    <TabsTrigger value="contacts" className="gap-2"><Users className="w-4 h-4" /> Contacts</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="h-full">
                    <DealPipeline clientId={clientId} />
                </TabsContent>

                <TabsContent value="activities">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="md:col-span-2">
                            <ActivityFeed clientId={clientId} />
                        </div>
                        <div>
                            {/* Mini Contact List for context */}
                            <div className="border rounded-lg p-4 bg-muted/50">
                                <h4 className="font-semibold text-sm mb-4 flex items-center gap-2"><Users className="w-4 h-4" /> Key Contacts</h4>
                                <ContactList clientId={clientId} />
                            </div>
                        </div>
                    </div>
                </TabsContent>

                <TabsContent value="contacts">
                    <ContactList clientId={clientId} />
                </TabsContent>
            </Tabs>
        </div>
    );
}

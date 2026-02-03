import React, { useState, useEffect } from 'react';
import { Loader2, Plus, Search, RefreshCw } from 'lucide-react';
import { Button } from "@complianceos/ui/ui/button";
import { Input } from "@complianceos/ui/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@complianceos/ui/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@complianceos/ui/ui/alert-dialog";
import { AddonList, AddonStats, AddonSettingsDialog } from "@/components/addons/AddonCard";
import AdminLayout from "@/components/layouts/AdminLayout";
import type { AddonInfo } from '@/lib/addons/types';
import { AddonStatus } from '@/lib/addons/types';

export default function AddonManager() {
  const [addons, setAddons] = useState<AddonInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAddon, setSelectedAddon] = useState<AddonInfo | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [activatingId, setActivatingId] = useState<string | null>(null);
  const [uninstallAddonId, setUninstallAddonId] = useState<string | null>(null);

  useEffect(() => {
    loadAddons();
  }, []);

  const loadAddons = async () => {
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      const demoAddons: AddonInfo[] = [
        {
          id: 'jira-integration',
          name: 'Jira Integration',
          version: '1.0.0',
          description: 'Connect ComplianceOS with Jira to sync controls, findings, and remediation tasks',
          author: 'ComplianceOS Team',
          category: 'integration',
          status: 'active',
          icon: '/icons/jira.svg',
          homepage: 'https://complianceos.com/addons/jira',
          tags: ['issue-tracking', 'remediation', 'automation'],
          permissions: ['read:clients', 'write:clients', 'read:evidence', 'write:evidence'],
          configuration: { cloudId: 'demo-cloud', defaultProject: 'COMPLIANCE' },
        },
        {
          id: 'soc2-policy-template',
          name: 'SOC 2 Policy Template',
          version: '1.0.0',
          description: 'Comprehensive SOC 2 compliance policy template covering all Trust Services Criteria',
          author: 'ComplianceOS Team',
          category: 'template',
          status: 'active',
          homepage: 'https://complianceos.com/templates/soc2',
          tags: ['soc2', 'policy', 'security'],
          permissions: ['read:policies', 'write:policies'],
        },
        {
          id: 's3-storage',
          name: 'AWS S3 Storage',
          version: '1.0.0',
          description: 'Store compliance evidence and documents in AWS S3 with encryption and versioning',
          author: 'ComplianceOS Team',
          category: 'storage',
          status: 'inactive',
          homepage: 'https://complianceos.com/addons/s3',
          tags: ['aws', 's3', 'storage', 'evidence'],
          permissions: ['read:evidence', 'write:evidence'],
        },
        {
          id: 'slack-integration',
          name: 'Slack Integration',
          version: '0.9.0',
          description: 'Receive compliance notifications and share reports directly in Slack channels',
          author: 'Community Contributor',
          category: 'notification',
          status: 'pending',
          tags: ['slack', 'notifications', 'chat'],
          permissions: ['read:clients'],
        },
        {
          id: 'azure-storage',
          name: 'Azure Blob Storage',
          version: '1.0.0',
          description: 'Store and manage compliance evidence in Microsoft Azure Blob Storage',
          author: 'ComplianceOS Team',
          category: 'storage',
          status: 'error',
          error: 'Connection timeout. Please check your credentials.',
          tags: ['azure', 'storage', 'blob'],
          permissions: ['read:evidence', 'write:evidence'],
        },
      ];
      setAddons(demoAddons);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfigure = (addon: AddonInfo) => {
    setSelectedAddon(addon);
    setIsSettingsOpen(true);
  };

  const handleActivate = async (addonId: string) => {
    setActivatingId(addonId);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      setAddons(prev => prev.map(a =>
        a.id === addonId ? { ...a, status: 'active' as AddonStatus } : a
      ));
    } finally {
      setActivatingId(null);
    }
  };

  const handleDeactivate = async (addonId: string) => {
    setAddons(prev => prev.map(a =>
      a.id === addonId ? { ...a, status: 'inactive' as AddonStatus } : a
    ));
  };

  const handleUninstall = async (addonId: string) => {
    setUninstallAddonId(addonId);
  };

  const handleSaveConfig = async (addonId: string, config: Record<string, unknown>) => {
    setIsSaving(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      setAddons(prev => prev.map(a =>
        a.id === addonId ? { ...a, configuration: config } : a
      ));
      setIsSettingsOpen(false);
    } finally {
      setIsSaving(false);
    }
  };

  const filteredAddons = addons.filter(addon =>
    addon.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    addon.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    addon.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <AdminLayout>
      <div className="space-y-6 p-6 mx-auto w-full">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Addons Marketplace</h1>
            <p className="text-muted-foreground mt-1">
              Extend ComplianceOS with integrations, templates, and storage providers
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={loadAddons} disabled={isLoading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Browse Addons
            </Button>
          </div>
        </div>

        <AddonStats addons={addons} />

        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Installed Addons</CardTitle>
                <CardDescription>Manage your installed addons and their configurations</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search addons..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8 w-64"
                  />
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <AddonList
              addons={filteredAddons}
              onConfigure={handleConfigure}
              onActivate={handleActivate}
              onDeactivate={handleDeactivate}
              onUninstall={handleUninstall}
              isLoading={isLoading}
            />
          </CardContent>
        </Card>

        <AddonSettingsDialog
          addon={selectedAddon}
          open={isSettingsOpen}
          onOpenChange={setIsSettingsOpen}
          onSave={handleSaveConfig}
          isSaving={isSaving}
        >
          <span />
        </AddonSettingsDialog>

        <AlertDialog open={!!uninstallAddonId} onOpenChange={(open) => !open && setUninstallAddonId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently uninstall this addon. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                onClick={() => {
                  if (uninstallAddonId) {
                    setAddons(prev => prev.filter(a => a.id !== uninstallAddonId));
                    setUninstallAddonId(null);
                  }
                }}
              >
                Uninstall
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AdminLayout>
  );
}

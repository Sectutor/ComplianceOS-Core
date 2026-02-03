import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@complianceos/ui/ui/card";
import { Button } from "@complianceos/ui/ui/button";
import { Badge } from "@complianceos/ui/ui/badge";
import { Input } from "@complianceos/ui/ui/input";
import { Label } from "@complianceos/ui/ui/label";
import { Switch } from "@complianceos/ui/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@complianceos/ui/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@complianceos/ui/ui/dialog";
import { ScrollArea } from "@complianceos/ui/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@complianceos/ui/ui/tooltip";
import { Progress } from "@complianceos/ui/ui/progress";
import { Loader2, Settings, Trash2, ExternalLink, CheckCircle2, XCircle, AlertTriangle, Info, RefreshCw, Download, Zap, Box, Layers, HardDrive, Brain, BarChart, Bell, Shield, Wrench } from "lucide-react";
import type { AddonInfo, AddonCategory } from '../../lib/addons/types';
import { AddonStatus } from '../../lib/addons/types';

interface AddonCardProps {
  addon: AddonInfo;
  onConfigure: (addon: AddonInfo) => void;
  onActivate: (addonId: string) => void;
  onDeactivate: (addonId: string) => void;
  onUninstall: (addonId: string) => void;
  isUpdating?: boolean;
}

const categoryIcons: Record<AddonCategory, React.ReactNode> = {
  integration: <Zap className="h-4 w-4" />,
  template: <Layers className="h-4 w-4" />,
  storage: <HardDrive className="h-4 w-4" />,
  ai: <Brain className="h-4 w-4" />,
  analytics: <BarChart className="h-4 w-4" />,
  notification: <Bell className="h-4 w-4" />,
  compliance: <Shield className="h-4 w-4" />,
  automation: <Wrench className="h-4 w-4" />,
  security: <Shield className="h-4 w-4" />,
  utility: <Box className="h-4 w-4" />,
};

const categoryColors: Record<AddonCategory, string> = {
  integration: 'bg-blue-100 text-blue-700 border-blue-200',
  template: 'bg-purple-100 text-purple-700 border-purple-200',
  storage: 'bg-green-100 text-green-700 border-green-200',
  ai: 'bg-orange-100 text-orange-700 border-orange-200',
  analytics: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  notification: 'bg-pink-100 text-pink-700 border-pink-200',
  compliance: 'bg-indigo-100 text-indigo-700 border-indigo-200',
  automation: 'bg-cyan-100 text-cyan-700 border-cyan-200',
  security: 'bg-red-100 text-red-700 border-red-200',
  utility: 'bg-gray-100 text-gray-700 border-gray-200',
};

const statusConfig: Record<AddonStatus, { icon: React.ReactNode; color: string; label: string }> = {
  pending: { icon: <Info className="h-3 w-3" />, color: 'bg-gray-100 text-gray-700', label: 'Pending' },
  installing: { icon: <Loader2 className="h-3 w-3 animate-spin" />, color: 'bg-blue-100 text-blue-700', label: 'Installing' },
  active: { icon: <CheckCircle2 className="h-3 w-3" />, color: 'bg-green-100 text-green-700', label: 'Active' },
  inactive: { icon: <XCircle className="h-3 w-3" />, color: 'bg-gray-100 text-gray-600', label: 'Inactive' },
  error: { icon: <AlertTriangle className="h-3 w-3" />, color: 'bg-red-100 text-red-700', label: 'Error' },
  updating: { icon: <RefreshCw className="h-3 w-3 animate-spin" />, color: 'bg-yellow-100 text-yellow-700', label: 'Updating' },
  uninstalling: { icon: <Loader2 className="h-3 w-3 animate-spin" />, color: 'bg-orange-100 text-orange-700', label: 'Uninstalling' },
};

export function AddonCard({ addon, onConfigure, onActivate, onDeactivate, onUninstall, isUpdating }: AddonCardProps) {
  const status = statusConfig[addon.status];
  const categoryColor = categoryColors[addon.category];

  return (
    <Card className="group relative overflow-hidden transition-all hover:shadow-lg hover:-translate-y-1">
      <div className={`absolute top-0 left-0 right-0 h-1 ${isUpdating ? 'bg-yellow-500 animate-pulse' : ''}`} />
      
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${categoryColor}`}>
              {categoryIcons[addon.category]}
            </div>
            <div>
              <CardTitle className="text-lg font-semibold">{addon.name}</CardTitle>
              <CardDescription className="text-xs text-muted-foreground">v{addon.version}</CardDescription>
            </div>
          </div>
          <Badge className={`${status.color} flex items-center gap-1`}>
            {status.icon}
            {status.label}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="pb-3">
        <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
          {addon.description}
        </p>
        
        <div className="flex flex-wrap gap-1 mb-3">
          <Badge variant="outline" className="text-xs">
            {categoryIcons[addon.category]}
            <span className="ml-1 capitalize">{addon.category}</span>
          </Badge>
          {addon.tags?.slice(0, 3).map((tag) => (
            <Badge key={tag} variant="secondary" className="text-xs">
              {tag}
            </Badge>
          ))}
        </div>

        {addon.error && (
          <div className="p-2 rounded-md bg-red-50 border border-red-200 text-red-700 text-xs mb-3">
            <div className="flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" />
              <span className="font-medium">Error:</span>
              <span>{addon.error}</span>
            </div>
          </div>
        )}
      </CardContent>

      <CardFooter className="flex justify-between pt-3 border-t">
        <div className="flex items-center gap-2">
          {addon.homepage && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                    <a href={addon.homepage} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>View Documentation</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onConfigure(addon)}
            className="h-8"
          >
            <Settings className="h-3 w-3 mr-1" />
            Configure
          </Button>
          
          {addon.status === 'active' ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onDeactivate(addon.id)}
              className="h-8 text-orange-600 hover:text-orange-700"
              disabled={isUpdating}
            >
              Deactivate
            </Button>
          ) : (
            <Button
              variant="default"
              size="sm"
              onClick={() => onActivate(addon.id)}
              className="h-8"
              disabled={addon.status === 'error' || isUpdating}
            >
              Activate
            </Button>
          )}
        </div>
      </CardFooter>
    </Card>
  );
}

interface AddonSettingsDialogProps {
  addon: AddonInfo | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
  onSave: (addonId: string, config: Record<string, unknown>) => void;
  isSaving?: boolean;
}

export function AddonSettingsDialog({ addon, open, onOpenChange, children, onSave, isSaving }: AddonSettingsDialogProps) {
  const [config, setConfig] = useState<Record<string, unknown>>({});

  React.useEffect(() => {
    if (addon) {
      setConfig(addon.configuration || {});
    }
  }, [addon]);

  const handleSave = () => {
    if (addon) {
      onSave(addon.id, config);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {addon?.name || 'Addon Settings'}
          </DialogTitle>
          <DialogDescription>
            Configure the settings for this addon.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] pr-4">
          <div className="space-y-4 py-4">
            {addon && (
              <>
                <div className="flex items-center gap-2 p-3 rounded-lg bg-muted">
                  {categoryIcons[addon.category]}
                  <span className="text-sm font-medium">{addon.category}</span>
                  <Badge variant="outline" className="ml-auto">v{addon.version}</Badge>
                </div>

                <div className="space-y-4">
                  {Object.entries(config).map(([key, value]) => (
                    <div key={key} className="space-y-2">
                      <Label className="capitalize">{key.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ')}</Label>
                      <Input
                        value={String(value)}
                        onChange={(e) => setConfig(prev => ({ ...prev, [key]: e.target.value }))}
                        disabled={typeof value === 'boolean'}
                      />
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </ScrollArea>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface AddonListProps {
  addons: AddonInfo[];
  onConfigure: (addon: AddonInfo) => void;
  onActivate: (addonId: string) => void;
  onDeactivate: (addonId: string) => void;
  onUninstall: (addonId: string) => void;
  isLoading?: boolean;
}

export function AddonList({ addons, onConfigure, onActivate, onDeactivate, onUninstall, isLoading }: AddonListProps) {
  const categories: AddonCategory[] = ['integration', 'template', 'storage', 'ai', 'analytics', 'notification', 'compliance', 'automation', 'security', 'utility'];
  const [selectedCategory, setSelectedCategory] = useState<AddonCategory | 'all'>('all');

  const filteredAddons = selectedCategory === 'all' 
    ? addons 
    : addons.filter(a => a.category === selectedCategory);

  const getCategoryCount = (category: AddonCategory) => 
    addons.filter(a => a.category === category).length;

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Tabs value={selectedCategory} onValueChange={(v) => setSelectedCategory(v as AddonCategory | 'all')}>
        <ScrollArea className="w-full whitespace-nowrap pb-4">
          <TabsList className="inline-flex h-10 items-center justify-start rounded-md bg-muted p-1 text-muted-foreground">
            <TabsTrigger value="all" className="inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium transition-all">
              All ({addons.length})
            </TabsTrigger>
            {categories.map((category) => (
              <TabsTrigger 
                key={category} 
                value={category}
                className="inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium transition-all capitalize"
              >
                {categoryIcons[category]}
                <span className="ml-1">{category}</span>
                <Badge variant="secondary" className="ml-1.5 text-xs">
                  {getCategoryCount(category)}
                </Badge>
              </TabsTrigger>
            ))}
          </TabsList>
        </ScrollArea>

        <TabsContent value={selectedCategory} className="mt-4">
          {filteredAddons.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Box className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No addons found in this category</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredAddons.map((addon) => (
                <AddonCard
                  key={addon.id}
                  addon={addon}
                  onConfigure={onConfigure}
                  onActivate={onActivate}
                  onDeactivate={onDeactivate}
                  onUninstall={onUninstall}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

interface AddonStatsProps {
  addons: AddonInfo[];
}

export function AddonStats({ addons }: AddonStatsProps) {
  const activeCount = addons.filter(a => a.status === 'active').length;
  const errorCount = addons.filter(a => a.status === 'error').length;
  const inactiveCount = addons.filter(a => a.status === 'inactive').length;

  return (
    <div className="grid grid-cols-4 gap-4">
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Addons</p>
              <p className="text-3xl font-bold">{addons.length}</p>
            </div>
            <Box className="h-10 w-10 text-muted-foreground/50" />
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Active</p>
              <p className="text-3xl font-bold text-green-600">{activeCount}</p>
            </div>
            <CheckCircle2 className="h-10 w-10 text-green-200" />
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Inactive</p>
              <p className="text-3xl font-bold text-gray-600">{inactiveCount}</p>
            </div>
            <XCircle className="h-10 w-10 text-gray-200" />
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Errors</p>
              <p className="text-3xl font-bold text-red-600">{errorCount}</p>
            </div>
            <AlertTriangle className="h-10 w-10 text-red-200" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

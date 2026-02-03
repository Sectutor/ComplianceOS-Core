
import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@complianceos/ui/ui/card';
import { Button } from '@complianceos/ui/ui/button';
import DashboardLayout from "@/components/DashboardLayout";
import { trpc } from "@/lib/trpc";
import { useClientContext } from "@/contexts/ClientContext";
import { useParams, useLocation } from "wouter";
import { toast } from "sonner";
import { Badge } from "@complianceos/ui/ui/badge";
import { Map, CheckCircle2, ArrowRight, LayoutTemplate, PenTool, GitMerge, Settings } from "lucide-react";

export default function ImplementationCreate() {
  const [activeTab, setActiveTab] = useState<'details' | 'template' | 'roadmap'>('details');
  const params = useParams();
  const [, setLocation] = useLocation();
  const clientIdParam = params.id ? parseInt(params.id, 10) : null;
  const { selectedClientId } = useClientContext();
  const clientId = clientIdParam || selectedClientId;

  // Form State for Manual
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    plannedStartDate: '',
    plannedEndDate: '',
    estimatedHours: 0,
    priority: 'medium',
    riskMitigationFocus: [] as string[]
  });

  // Roadmap State
  const [selectedRoadmapId, setSelectedRoadmapId] = useState<number | null>(null);

  // Queries & Mutations
  const { data: roadmaps } = trpc.roadmap.list.useQuery(
    { clientId: clientId! },
    { enabled: !!clientId && activeTab === 'roadmap' }
  );

  const { data: dynamicTemplates } = trpc.implementation.listTemplates.useQuery(
    { clientId: clientId! },
    { enabled: !!clientId && activeTab === 'template' }
  );

  const createFromRoadmapMutation = trpc.implementation.createFromRoadmap.useMutation({
    onSuccess: (data) => {
      toast.success("Plan generated from Roadmap!");
      setLocation(`/clients/${clientId}/implementation/kanban/${data.planId}`);
    },
    onError: (err) => {
      toast.error(`Failed to generate: ${err.message}`);
    }
  });

  const createFromTemplateMutation = trpc.implementation.createFromTemplate.useMutation({
    onSuccess: (data) => {
      toast.success("Plan created from template!");
      setLocation(`/clients/${clientId}/implementation/kanban/${data.planId}`);
    },
    onError: (err) => toast.error(`Failed to create: ${err.message}`)
  });

  const applyTemplate = (template: any) => {
    if (!clientId) return;
    createFromTemplateMutation.mutate({
      templateId: template.id,
      clientId: clientId,
      title: template.title, // Or prompt user? For now use template title
    });
  };

  const handleRoadmapCreate = () => {
    if (!selectedRoadmapId || !clientId) return;
    createFromRoadmapMutation.mutate({
      roadmapId: selectedRoadmapId,
      clientId: clientId
    });
  };

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto p-8 animate-in fade-in duration-500">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Create Implementation Plan</h1>
          <p className="text-muted-foreground mb-6">
            Choose how you want to start your execution journey.
          </p>
        </div>

        <Card className="border-slate-200 shadow-sm">
          <CardHeader>
            <div className="flex space-x-2 border-b border-slate-100 pb-0">
              <TabButton
                active={activeTab === 'details'}
                onClick={() => setActiveTab('details')}
                icon={<PenTool className="w-4 h-4 mr-2" />}
                label="Manual Setup"
              />
              <TabButton
                active={activeTab === 'template'}
                onClick={() => setActiveTab('template')}
                icon={<LayoutTemplate className="w-4 h-4 mr-2" />}
                label="Use Template"
              />
              <TabButton
                active={activeTab === 'roadmap'}
                onClick={() => setActiveTab('roadmap')}
                icon={<GitMerge className="w-4 h-4 mr-2" />}
                label="Import from Roadmap"
                highlight
              />
            </div>
          </CardHeader>

          <CardContent className="pt-6">

            {/* 1. Manual Details Form */}
            {activeTab === 'details' && (
              <div className="space-y-6 max-w-3xl">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="col-span-2">
                    <label className="block text-sm font-medium mb-2 text-slate-700">Plan Title *</label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                      className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      placeholder="e.g., Q1 Security Hardening"
                    />
                  </div>

                  <div className="col-span-2">
                    <label className="block text-sm font-medium mb-2 text-slate-700">Description</label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      className="w-full px-3 py-2 border border-slate-300 rounded-md h-24 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      placeholder="Objectives and scope..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2 text-slate-700">Dates</label>
                    <div className="flex gap-2">
                      <input type="date" className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm" />
                      <span className="self-center text-slate-400">-</span>
                      <input type="date" className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2 text-slate-700">Priority</label>
                    <select
                      value={formData.priority}
                      onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value }))}
                      className="w-full px-3 py-2 border border-slate-300 rounded-md bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="critical">Critical</option>
                    </select>
                  </div>
                </div>

                <div className="pt-4 flex justify-end gap-3">
                  <Button variant="outline" onClick={() => window.history.back()}>Cancel</Button>
                  <Button onClick={() => toast.info("Manual creation not connected in prototype yet.")}>Create Plan</Button>
                </div>
              </div>
            )}

            {/* 2. Template Selection (Dynamic) */}
            {activeTab === 'template' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center bg-slate-50 p-4 rounded-lg border border-slate-200">
                  <p className="text-sm text-slate-600">
                    Standardized templates ensure consistency across your compliance projects.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setLocation(`/clients/${clientId}/implementation/templates`)}
                    className="bg-white"
                  >
                    <Settings className="w-4 h-4 mr-2" />
                    Manage Templates
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {(!dynamicTemplates || dynamicTemplates.length === 0) && (
                    <div className="col-span-2 text-center py-12 text-slate-500 border-2 border-dashed border-slate-100 rounded-xl">
                      <LayoutTemplate className="w-12 h-12 mx-auto text-slate-300 mb-2" />
                      <p>No templates found.</p>
                      <Button
                        variant="link"
                        onClick={() => setLocation(`/clients/${clientId}/implementation/templates`)}
                      >
                        Create your first template
                      </Button>
                    </div>
                  )}
                  {dynamicTemplates?.map((template, index) => (
                    <Card
                      key={index}
                      className="cursor-pointer hover:border-blue-300 hover:shadow-md transition-all group border-slate-200 relative"
                      onClick={() => applyTemplate(template)}
                    >
                      <CardHeader>
                        <CardTitle className="group-hover:text-blue-600 transition-colors flex items-center justify-between text-lg">
                          {template.title}
                          {createFromTemplateMutation.isPending ? (
                            <span className="text-xs text-slate-400">Creating...</span>
                          ) : (
                            <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                          )}
                        </CardTitle>
                        <CardDescription className="mt-2 text-sm line-clamp-2">
                          {template.description || "No description provided."}
                        </CardDescription>
                        {template.isSystem && (
                          <Badge variant="secondary" className="absolute top-4 right-4 bg-slate-100 text-slate-500 text-[10px] pointer-events-none">
                            System
                          </Badge>
                        )}
                      </CardHeader>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* 3. Roadmap Selection */}
            {activeTab === 'roadmap' && (
              <div className="space-y-6 animate-in slide-in-from-bottom-2 duration-300">
                <div className="bg-blue-50 border border-blue-100 p-4 rounded-lg text-blue-800 text-sm">
                  <strong>Strategy to Execution:</strong> Select a roadmap below. We will automatically generate implementation tasks for every initiative, carrying over priorities and dates.
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {roadmaps?.map(roadmap => (
                    <div
                      key={roadmap.id}
                      onClick={() => setSelectedRoadmapId(roadmap.id)}
                      className={`
                                    cursor-pointer p-4 rounded-xl border-2 transition-all relative
                                    ${selectedRoadmapId === roadmap.id
                          ? 'border-blue-500 bg-blue-50/50 ring-2 ring-blue-200'
                          : 'border-slate-200 hover:border-blue-300 hover:bg-slate-50'}
                                `}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <Badge variant="outline" className="bg-white">
                          {roadmap.status}
                        </Badge>
                        {selectedRoadmapId === roadmap.id && (
                          <CheckCircle2 className="w-5 h-5 text-blue-600 absolute top-4 right-4" />
                        )}
                      </div>
                      <h3 className="font-semibold text-slate-900 pr-8">{roadmap.title}</h3>
                      <p className="text-sm text-slate-500 mt-1 line-clamp-2">
                        {roadmap.description || "No description provided."}
                      </p>
                      <div className="mt-4 flex items-center text-xs text-slate-400">
                        <Map className="w-3 h-3 mr-1" />
                        <span>Roadmap #{roadmap.id}</span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex justify-end pt-4 border-t border-slate-100">
                  <Button
                    size="lg"
                    className="bg-blue-600 hover:bg-blue-700"
                    disabled={!selectedRoadmapId || createFromRoadmapMutation.isLoading}
                    onClick={handleRoadmapCreate}
                  >
                    {createFromRoadmapMutation.isLoading ? "Generating..." : "Generate Implementation Plan"}
                    {!createFromRoadmapMutation.isLoading && <ArrowRight className="ml-2 w-4 h-4" />}
                  </Button>
                </div>
              </div>
            )}

          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

function TabButton({ active, onClick, label, icon, highlight }: any) {
  return (
    <button
      onClick={onClick}
      className={`
                flex items-center px-6 py-3 font-medium text-sm transition-all border-b-2
                ${active
          ? 'border-blue-500 text-blue-600 bg-blue-50/50'
          : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50'}
                ${highlight && !active ? 'text-blue-600' : ''}
            `}
    >
      {icon}
      {label}
    </button>
  );
}
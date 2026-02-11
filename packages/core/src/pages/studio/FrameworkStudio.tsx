// Refresh
import { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Breadcrumb } from "@/components/Breadcrumb";
import { StudioProvider, useStudio } from "./StudioContext";
import { Button } from "@complianceos/ui/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@complianceos/ui/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@complianceos/ui/ui/tabs";
import { ArrowLeft, ArrowRight, Save, LayoutGrid, List, FileJson, CheckCircle2 } from "lucide-react";
import { Input } from "@complianceos/ui/ui/input";
import { Label } from "@complianceos/ui/ui/label";
import { Textarea } from "@complianceos/ui/ui/textarea";
import { Switch } from "@complianceos/ui/ui/switch";

// Commenting out sub-components to isolate the error
import { RequirementsGrid } from "./RequirementsGrid";
import { ExportStep } from "./ExportStep";
import { PhaseEditor } from "./PhaseEditor";




const MetadataEditor = () => {
    const { state, dispatch } = useStudio();
    return (
        <div className="space-y-4 max-w-2xl">
            <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/20">
                <div className="space-y-0.5">
                    <Label className="text-base">Simple Mode</Label>
                    <div className="text-sm text-muted-foreground">
                        Hide phases for a simpler one-step framework management.
                    </div>
                </div>
                <Switch
                    checked={state.simpleMode}
                    onCheckedChange={(checked) => dispatch({ type: 'TOGGLE_SIMPLE_MODE', enabled: checked })}
                />
            </div>

            <div className="grid gap-4">
                <div className="space-y-2">
                    <Label>Framework Name</Label>
                    <Input
                        value={state.metadata.name}
                        onChange={(e) => dispatch({ type: 'UPDATE_METADATA', field: 'name', value: e.target.value })}
                        placeholder="e.g. ISO 27001:2022"
                    />
                </div>
                <div className="space-y-2">
                    <Label>Slug (Permanent ID)</Label>
                    <Input
                        value={state.metadata.slug}
                        onChange={(e) => dispatch({ type: 'UPDATE_METADATA', field: 'slug', value: e.target.value })}
                        placeholder="e.g. iso-27001-2022"
                    />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label>Version</Label>
                        <Input
                            value={state.metadata.version}
                            onChange={(e) => dispatch({ type: 'UPDATE_METADATA', field: 'version', value: e.target.value })}
                            placeholder="e.g. 1.0.0"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Icon (Lucide name)</Label>
                        <Input
                            value={state.metadata.icon}
                            onChange={(e) => dispatch({ type: 'UPDATE_METADATA', field: 'icon', value: e.target.value })}
                            placeholder="e.g. Shield"
                        />
                    </div>
                </div>
                <div className="space-y-2">
                    <Label>Description</Label>
                    <Textarea
                        value={state.metadata.description}
                        onChange={(e) => dispatch({ type: 'UPDATE_METADATA', field: 'description', value: e.target.value })}
                        placeholder="A brief overview of the framework..."
                        className="h-32"
                    />
                </div>
            </div>
        </div>
    );
};

function FrameworkStudioContent() {
    const { state, dispatch } = useStudio();

    return (
        <div className="p-8 max-w-[1200px] mx-auto">
            <Breadcrumb
                items={[
                    { label: "Marketplace", href: "/marketplace" },
                    { label: "Framework Studio" },
                ]}
            />

            <div className="flex justify-between items-start mb-8">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Framework Studio</h1>
                    <p className="text-muted-foreground mt-2">
                        Build and customize your own security frameworks using our AI assisted studio.
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline">
                        Cancel
                    </Button>
                    <Button>
                        <Save className="mr-2 h-4 w-4" />
                        Save Draft
                    </Button>
                </div>
            </div>

            <Tabs value={state.activeStep} onValueChange={(v: any) => dispatch({ type: 'SET_STEP', step: v })} className="space-y-4">
                <TabsList className="grid w-full grid-cols-4 max-w-4xl">
                    <TabsTrigger value="basics" className="gap-2">
                        <LayoutGrid className="h-4 w-4" /> 1. Basics
                    </TabsTrigger>
                    {!state.simpleMode && (
                        <TabsTrigger value="phases" className="gap-2">
                            <List className="h-4 w-4" /> 2. Phases
                        </TabsTrigger>
                    )}
                    <TabsTrigger value="requirements" className="gap-2">
                        <CheckCircle2 className="h-4 w-4" /> 3. Requirements
                    </TabsTrigger>
                    <TabsTrigger value="export" className="gap-2">
                        <FileJson className="h-4 w-4" /> 4. Export
                    </TabsTrigger>
                </TabsList>

                <div className="mt-8">
                    <TabsContent value="basics" className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>Framework Identity</CardTitle>
                                <CardDescription>
                                    Define the core metadata for your new compliance standard.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <MetadataEditor />
                            </CardContent>
                        </Card>
                        <div className="flex justify-end">
                            <Button onClick={() => dispatch({ type: 'SET_STEP', step: state.simpleMode ? 'requirements' : 'phases' })}>
                                Next Step <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                        </div>
                    </TabsContent>

                    {!state.simpleMode && (
                        <TabsContent value="phases" className="space-y-4">
                            <Card>
                                <CardHeader>
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <CardTitle>Phases & Milestones</CardTitle>
                                            <CardDescription>
                                                Break down the implementation into logical steps (e.g. Scoping, Implementation, Audit).
                                            </CardDescription>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <PhaseEditor />
                                </CardContent>
                            </Card>
                            <div className="flex justify-between">
                                <Button variant="outline" onClick={() => dispatch({ type: 'SET_STEP', step: 'basics' })}>
                                    <ArrowLeft className="mr-2 h-4 w-4" /> Back
                                </Button>
                                <Button onClick={() => dispatch({ type: 'SET_STEP', step: 'requirements' })}>
                                    Next Step <ArrowRight className="ml-2 h-4 w-4" />
                                </Button>
                            </div>
                        </TabsContent>
                    )}

                    <TabsContent value="requirements" className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>Requirements & Controls</CardTitle>
                                <CardDescription>
                                    Add the individual items that users must comply with.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <RequirementsGrid />
                            </CardContent>
                        </Card>
                        <div className="flex justify-between">
                            <Button variant="outline" onClick={() => dispatch({ type: 'SET_STEP', step: state.simpleMode ? 'basics' : 'phases' })}>
                                <ArrowLeft className="mr-2 h-4 w-4" /> Back
                            </Button>
                            <Button onClick={() => dispatch({ type: 'SET_STEP', step: 'export' })}>
                                Review & Export <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                        </div>
                    </TabsContent>

                    <TabsContent value="export" className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>Preview & Export</CardTitle>
                                <CardDescription>
                                    Review your framework JSON and download it for the marketplace.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <ExportStep />
                            </CardContent>
                        </Card>
                        <div className="flex justify-start">
                            <Button variant="outline" onClick={() => dispatch({ type: 'SET_STEP', step: 'requirements' })}>
                                <ArrowLeft className="mr-2 h-4 w-4" /> Back
                            </Button>
                        </div>
                    </TabsContent>
                </div>
            </Tabs>
        </div>
    );
}

export default function FrameworkStudio() {
    return (
        <DashboardLayout>
            <StudioProvider>
                <FrameworkStudioContent />
            </StudioProvider>
        </DashboardLayout>
    );
}

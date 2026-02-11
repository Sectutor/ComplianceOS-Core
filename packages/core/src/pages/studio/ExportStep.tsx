import { useStudio } from "./StudioContext";
import { Button } from "@complianceos/ui/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@complianceos/ui/ui/card";
import { CheckCircle2, Download, AlertCircle, FileJson, ShieldCheck } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@complianceos/ui/ui/alert";
import { useState } from "react";

export const ExportStep = () => {
    const { state } = useStudio();
    const [copied, setCopied] = useState(false);

    // 1. Validation Logic
    const errors: string[] = [];
    if (!state.metadata.name) errors.push("Framework Name is required");
    if (!state.metadata.slug) errors.push("Framework Slug is required");
    if (state.requirements.length === 0) errors.push("At least one requirement is required");

    const missingDescriptions = state.requirements.filter(r => !r.description).length;
    if (missingDescriptions > 0) errors.push(`${missingDescriptions} requirements are missing descriptions`);

    const hasErrors = errors.length > 0;

    // 2. Format JSON to the PluginPackageSchema format
    const generatePluginJson = () => {
        const pluginData = {
            manifest: {
                id: state.metadata.slug, // Use slug as ID for new plugins
                slug: state.metadata.slug,
                name: state.metadata.name,
                version: state.metadata.version,
                author: state.metadata.author || "Framework Studio",
                description: state.metadata.description,
                type: "Security", // Default to Security for now
                tags: [],
                icon: state.metadata.icon
            },
            content: {
                phases: state.phases.map(p => ({
                    name: p.name,
                    description: p.description,
                    order: p.order
                })),
                requirements: state.requirements.map(r => {
                    const phase = state.phases.find(p => p.id === r.phaseId);
                    return {
                        identifier: r.title,
                        title: r.title,
                        description: r.description,
                        phaseName: phase?.name
                    };
                })
            }
        };

        return JSON.stringify(pluginData, null, 2);
    };

    const handleDownload = () => {
        const json = generatePluginJson();
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${state.metadata.slug || 'framework'}-v${state.metadata.version}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const handleCopy = () => {
        const json = generatePluginJson();
        navigator.clipboard.writeText(json);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className={hasErrors ? "border-amber-200 bg-amber-50/30" : "border-green-200 bg-green-50/30"}>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            {hasErrors ? <AlertCircle className="h-5 w-5 text-amber-500" /> : <CheckCircle2 className="h-5 w-5 text-green-500" />}
                            Validation Status
                        </CardTitle>
                        <CardDescription>
                            We check your framework for common errors before exporting.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {hasErrors ? (
                            <div className="space-y-2">
                                {errors.map((err, i) => (
                                    <div key={i} className="flex items-center gap-2 text-sm text-amber-700">
                                        <div className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                                        {err}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div className="text-sm text-green-700 font-medium">
                                    Everything looks good! Your framework is ready for export.
                                </div>
                                <div className="grid grid-cols-2 gap-4 text-xs text-muted-foreground">
                                    <div className="bg-white/50 p-2 rounded">
                                        <div className="font-semibold text-foreground">{state.phases.length}</div>
                                        Phases
                                    </div>
                                    <div className="bg-white/50 p-2 rounded">
                                        <div className="font-semibold text-foreground">{state.requirements.length}</div>
                                        Requirements
                                    </div>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Download className="h-5 w-5 text-primary" /> Export Options
                        </CardTitle>
                        <CardDescription>
                            Download your framework as a plugin file.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <Button
                            className="w-full gap-2 h-12 text-lg"
                            disabled={hasErrors}
                            onClick={handleDownload}
                        >
                            <Download className="h-5 w-5" /> Download JSON Plugin
                        </Button>
                        <Button
                            variant="outline"
                            className="w-full gap-2"
                            disabled={hasErrors}
                            onClick={handleCopy}
                        >
                            {copied ? (
                                <><CheckCircle2 className="h-4 w-4 text-green-500" /> Copied!</>
                            ) : (
                                <><FileJson className="h-4 w-4" /> Copy to Clipboard</>
                            )}
                        </Button>
                    </CardContent>
                </Card>
            </div>

            {!hasErrors && (
                <Alert className="bg-primary/5 border-primary/20">
                    <ShieldCheck className="h-4 w-4 text-primary" />
                    <AlertTitle>Ready for Registry</AlertTitle>
                    <AlertDescription>
                        This file can be uploaded to the **Marketplace** or included in the ComplianceOS core registry to make it available for all your clients.
                    </AlertDescription>
                </Alert>
            )}

            <div className="space-y-2">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider px-1">JSON Preview</h3>
                <pre className="bg-slate-950 text-slate-50 p-6 rounded-lg overflow-auto max-h-[400px] text-xs font-mono border shadow-inner">
                    {generatePluginJson()}
                </pre>
            </div>
        </div>
    );
};

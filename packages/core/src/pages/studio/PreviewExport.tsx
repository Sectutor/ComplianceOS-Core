import { useStudio } from "./StudioContext";
import { Button } from "@complianceos/ui/ui/button";
import { Card } from "@complianceos/ui/ui/card";
import { Download, Copy, Check } from "lucide-react";
import { useState } from "react";

export const PreviewExport = () => {
    const { state } = useStudio();
    const [copied, setCopied] = useState(false);

    // Construct the final JSON
    const finalPlugin = {
        manifest: {
            slug: state.metadata.slug,
            name: state.metadata.name,
            version: state.metadata.version,
            description: state.metadata.description,
            publisher: {
                name: state.metadata.author,
                url: "" // Optional
            },
            type: "standard",
            tags: ["custom"] // Could be expanded
        },
        content: {
            phases: state.phases.map(p => ({
                name: p.name,
                description: p.description,
                order: p.order
            })),
            requirements: state.requirements.map(req => {
                const phase = state.phases.find(p => p.id === req.phaseId);
                return {
                    identifier: req.title,
                    description: req.description,
                    phaseName: phase ? phase.name : "Unknown Phase"
                };
            })
        }
    };

    const jsonString = JSON.stringify(finalPlugin, null, 2);

    const handleCopy = () => {
        navigator.clipboard.writeText(jsonString);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleDownload = () => {
        const blob = new Blob([jsonString], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${state.metadata.slug || "framework"}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    return (
        <div className="grid grid-cols-3 gap-6">
            <div className="col-span-2 space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium">JSON Preview</h3>
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={handleCopy}>
                            {copied ? <Check className="mr-2 h-3 w-3" /> : <Copy className="mr-2 h-3 w-3" />}
                            {copied ? "Copied" : "Copy JSON"}
                        </Button>
                        <Button size="sm" onClick={handleDownload}>
                            <Download className="mr-2 h-3 w-3" />
                            Download Plugin
                        </Button>
                    </div>
                </div>
                <div className="relative rounded-md border bg-muted/50 p-4 font-mono text-xs overflow-auto max-h-[500px]">
                    <pre>{jsonString}</pre>
                </div>
            </div>

            <div className="col-span-1 space-y-4">
                <h3 className="text-sm font-medium">Validation Status</h3>

                <Card className="p-4 bg-green-50 border-green-200">
                    <div className="flex items-start gap-3">
                        <Check className="h-5 w-5 text-green-600 mt-0.5" />
                        <div>
                            <h4 className="text-sm font-medium text-green-800">Ready to Export</h4>
                            <p className="text-xs text-green-700 mt-1">
                                Your framework looks good! It contains {state.requirements.length} requirements across {state.phases.length} phases.
                            </p>
                        </div>
                    </div>
                </Card>

                <div className="text-xs text-muted-foreground p-4 border rounded-md">
                    <h4 className="font-medium mb-2">Next Steps</h4>
                    <ul className="list-disc list-inside space-y-1">
                        <li>Download the JSON file.</li>
                        <li>Place it in the <code>data/registry/plugins/</code> directory (if developing locally) or submit it via PR.</li>
                        <li>Register it in <code>index.json</code>.</li>
                    </ul>
                </div>
            </div>
        </div>
    );
};

import { useState, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@complianceos/ui/ui/dialog";
import { Button } from "@complianceos/ui/ui/button";
import { Label } from "@complianceos/ui/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@complianceos/ui/ui/select";
import { toast } from "sonner";
import { Loader2, Upload, AlertTriangle, FileSpreadsheet } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@complianceos/ui/ui/alert";

interface FrameworkImportDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    clientId: number;
    onSuccess?: () => void;
}

export function FrameworkImportDialog({ open, onOpenChange, clientId, onSuccess }: FrameworkImportDialogProps) {
    const [frameworkType, setFrameworkType] = useState<"pci_dss_v4" | "cis_v8" | "ccm_v4" | "hitrust" | "fedramp" | "fedramp_low" | "fedramp_high" | "cyber_essentials" | "nist_ai_rmf" | "iso27001" | "soc2" | "cis_v8_system">("pci_dss_v4");
    const [file, setFile] = useState<File | null>(null);
    const [isConfirmed, setIsConfirmed] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const importMutation = trpc.frameworks.importCustom.useMutation({
        onSuccess: (data: any) => {
            toast.success(`Successfully imported ${data.count} controls!`);
            onOpenChange(false);
            onSuccess?.();
            setFile(null);
            setIsConfirmed(false);
        },
        onError: (err) => {
            toast.error(`Import failed: ${err.message}`);
        }
    });

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
        }
    };

    const isSystemFramework = frameworkType.startsWith("hitrust") ||
        frameworkType.startsWith("fedramp") ||
        frameworkType === "cyber_essentials" ||
        frameworkType === "nist_ai_rmf" ||
        frameworkType === "iso27001" ||
        frameworkType === "soc2" ||
        frameworkType === "cis_v8_system";

    // Dynamic Description Text
    const getFrameworkDescription = () => {
        if (frameworkType === "hitrust") {
            return (
                <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-4 text-sm">
                    <p className="font-bold text-blue-700 mb-1">HITRUST CSF (Aligned/Representative)</p>
                    <p className="text-blue-600 mb-2">
                        Common Security Framework for healthcare. Levels depend on risk profile:
                    </p>
                    <ul className="list-disc list-inside space-y-1 text-blue-800">
                        <li><strong>e1 (Essentials):</strong> Entry-level cybersecurity hygiene (44 controls).</li>
                        <li><strong>i1 (Implemented):</strong> Leading practice baseline (119 controls).</li>
                        <li><strong>r2 (Risk-based):</strong> Comprehensive, high-assurance for highest risk (200-800+ controls).</li>
                    </ul>
                    <p className="mt-2 text-xs text-blue-500 italic">
                        Note: This import loads a representative control set compatible with all levels for readiness/gap analysis.
                        It is not the official licensed CSF text.
                    </p>
                </div>
            );
        }
        if (frameworkType === "fedramp" || frameworkType === "fedramp_low" || frameworkType === "fedramp_high") {
            return (
                <div className="bg-indigo-50 border-l-4 border-indigo-500 p-4 mb-4 text-sm">
                    <p className="font-bold text-indigo-700 mb-1">FedRAMP Baselines (NIST 800-53)</p>
                    <p className="text-indigo-600 mb-2">
                        Required for CSPs selling to the US Federal Government.
                    </p>
                    <ul className="list-disc list-inside space-y-1 text-indigo-800">
                        <li><strong>Low (LiSaaS):</strong> Systems where loss of data has limited impact (e.g. public websites).</li>
                        <li><strong>Moderate (Standard):</strong> The industry standard (~80% of all auths). For Controlled Unclassified Information (CUI).</li>
                        <li><strong>High:</strong> For systems where loss would have catastrophic impact (e.g. law enforcement, healthcare).</li>
                    </ul>
                </div>
            );
        }
        if (frameworkType === "cyber_essentials") {
            return (
                <div className="bg-emerald-50 border-l-4 border-emerald-500 p-4 mb-4 text-sm">
                    <p className="font-bold text-emerald-700 mb-1">Cyber Essentials / Plus</p>
                    <p className="text-emerald-600 mb-2">
                        UK Government-backed scheme focusing on 5 key technical control themes:
                    </p>
                    <ul className="list-disc list-inside space-y-1 text-emerald-800">
                        <li>Firewalls</li>
                        <li>Secure Configuration</li>
                        <li>User Access Control</li>
                        <li>Malware Protection</li>
                        <li>Security Update Management</li>
                    </ul>
                </div>
            );
        }
        if (frameworkType === "nist_ai_rmf") {
            return (
                <div className="bg-purple-50 border-l-4 border-purple-500 p-4 mb-4 text-sm">
                    <p className="font-bold text-purple-700 mb-1">NIST AI Risk Management Framework (AI RMF 1.0)</p>
                    <p className="text-purple-600 mb-2">
                        A voluntary framework to help organizations better manage the potential risks to individuals, organizations, and society associated with artificial intelligence (AI).
                    </p>
                    <ul className="list-disc list-inside space-y-1 text-purple-800">
                        <li>GOVERN: Culture of risk management</li>
                        <li>MAP: Context is recognized and risks identified</li>
                        <li>MEASURE: Assessed, analyzed, and tracked</li>
                        <li>MANAGE: Risks prioritized and acted upon</li>
                    </ul>
                </div>
            );
        }
        if (frameworkType === "iso27001") {
            return (
                <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-4 text-sm">
                    <p className="font-bold text-blue-700 mb-1">ISO/IEC 27001:2022 (Information Security)</p>
                    <p className="text-blue-600 mb-2">
                        The international standard for information security management systems (ISMS). Includes 93 controls across 4 domains:
                    </p>
                    <ul className="list-disc list-inside space-y-1 text-blue-800">
                        <li>Organizational Controls</li>
                        <li>People Controls</li>
                        <li>Physical Controls</li>
                        <li>Technological Controls</li>
                    </ul>
                </div>
            );
        }
        if (frameworkType === "soc2") {
            return (
                <div className="bg-orange-50 border-l-4 border-orange-500 p-4 mb-4 text-sm">
                    <p className="font-bold text-orange-700 mb-1">SOC 2 Type II (Trust Services Criteria)</p>
                    <p className="text-orange-600 mb-2">
                        Standardized controls for Security, Availability, and Confidentiality. Required for SaaS companies handling customer data.
                    </p>
                    <ul className="list-disc list-inside space-y-1 text-orange-800">
                        <li>Common Criteria (COSO principles)</li>
                        <li>Infrastructure and Software Security</li>
                        <li>Change and Incident Management</li>
                    </ul>
                </div>
            );
        }
        if (frameworkType === "cis_v8_system") {
            return (
                <div className="bg-slate-50 border-l-4 border-slate-500 p-4 mb-4 text-sm">
                    <p className="font-bold text-slate-700 mb-1">CIS Critical Security Controls v8.1</p>
                    <p className="text-slate-600 mb-2">
                        A prioritized set of 18 critical security controls to defend against modern cyber attacks. Built-in version loads the standard safeguard baseline.
                    </p>
                </div>
            );
        }
        return null;
    };

    const handleImport = async () => {
        if (!file && !isSystemFramework) {
            toast.error("Please select a file");
            return;
        }

        const reader = new FileReader();
        reader.onload = () => {
            const base64String = (reader.result as string).split(',')[1];
            importMutation.mutate({
                clientId,
                type: frameworkType,
                fileContent: base64String
            });
        };

        if (file) {
            reader.readAsDataURL(file);
        } else if (isSystemFramework) {
            // Determine operation based on type
            importMutation.mutate({
                clientId,
                type: frameworkType,
                fileContent: "" // No file content for system frameworks
            });
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Import Control Framework</DialogTitle>
                    <DialogDescription>
                        Upload the official Excel file to import specific control frameworks.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    <div className="space-y-2">
                        <Label>Framework Type</Label>
                        <Select value={frameworkType} onValueChange={(val: any) => setFrameworkType(val)}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="pci_dss_v4">PCI DSS v4.0 (Custom File)</SelectItem>
                                <SelectItem value="cis_v8">CIS Controls v8 (Custom File)</SelectItem>
                                <SelectItem value="ccm_v4">CSA CCM v4 (Custom File)</SelectItem>
                                <SelectItem value="iso27001">ISO 27001:2022 (Built-in)</SelectItem>
                                <SelectItem value="soc2">SOC 2 Type II (Built-in)</SelectItem>
                                <SelectItem value="cis_v8_system">CIS Controls v8 (Built-in)</SelectItem>
                                <SelectItem value="hitrust">HITRUST CSF (Representative)</SelectItem>
                                <SelectItem value="fedramp_low">FedRAMP Low</SelectItem>
                                <SelectItem value="fedramp">FedRAMP Moderate (Recommended)</SelectItem>
                                <SelectItem value="fedramp_high">FedRAMP High</SelectItem>
                                <SelectItem value="cyber_essentials">Cyber Essentials / Plus</SelectItem>
                                <SelectItem value="nist_ai_rmf">NIST AI RMF 1.0</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {getFrameworkDescription()}

                    <div className="space-y-2">
                        <Label>Official Source File (.xlsx)</Label>
                        {!isSystemFramework && (
                            <Alert className="bg-amber-50 border-amber-200 mb-2">
                                <AlertTriangle className="h-4 w-4 text-amber-600" />
                                <AlertTitle className="text-amber-800">License Source Requirement</AlertTitle>
                                <AlertDescription className="text-amber-700 text-xs">
                                    You must download the official file directly from the provider (CIS or CSA) using your own license/account. Do not upload modified files.
                                </AlertDescription>
                            </Alert>
                        )}

                        <div
                            className="border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer hover:bg-muted/50 transition-colors"
                            onClick={() => !isSystemFramework && fileInputRef.current?.click()}
                            style={{ opacity: isSystemFramework ? 0.5 : 1, pointerEvents: isSystemFramework ? 'none' : 'auto' }}
                        >
                            {isSystemFramework ? (
                                <div className="text-center">
                                    <div className="h-10 w-10 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-2">
                                        <Loader2 className="h-6 w-6" />
                                    </div>
                                    <p className="font-medium">System Framework</p>
                                    <p className="text-sm text-muted-foreground">Standard controls will be loaded automatically.</p>
                                </div>
                            ) : file ? (
                                <div className="text-center">
                                    <FileSpreadsheet className="h-10 w-10 text-green-600 mx-auto mb-2" />
                                    <p className="font-medium">{file.name}</p>
                                    <p className="text-sm text-muted-foreground">{(file.size / 1024).toFixed(1)} KB</p>
                                </div>
                            ) : (
                                <div className="text-center">
                                    <Upload className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
                                    <p className="font-medium">Click to upload spreadsheet</p>
                                    <p className="text-sm text-muted-foreground">Supported format: .xlsx</p>
                                </div>
                            )}
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept=".xlsx"
                                className="hidden"
                                onChange={handleFileChange}
                                disabled={isSystemFramework}
                            />
                        </div>
                    </div>

                    {!isSystemFramework && (
                        <div className="flex items-start gap-2">
                            <input
                                type="checkbox"
                                id="confirm-license"
                                checked={isConfirmed}
                                onChange={(e) => setIsConfirmed(e.target.checked)}
                                className="mt-1"
                            />
                            <Label htmlFor="confirm-license" className="text-sm font-normal cursor-pointer">
                                I certify that I have obtained this file legally from the official source and I have the right to use it for internal compliance purposes.
                            </Label>
                        </div>
                    )}
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button
                        onClick={handleImport}
                        disabled={(!file && !isSystemFramework) || (!isConfirmed && !isSystemFramework) || importMutation.isPending}
                    >
                        {importMutation.isPending ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Importing...
                            </>
                        ) : (
                            "Import Framework"
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

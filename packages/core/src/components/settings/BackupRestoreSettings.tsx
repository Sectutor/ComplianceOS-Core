
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@complianceos/ui/ui/card";
import { Button } from "@complianceos/ui/ui/button";
import { Download, Upload, Loader2, Database, AlertTriangle, FileJson, Table } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { SpreadsheetMapper } from "./SpreadsheetMapper";

interface BackupRestoreSettingsProps {
    clientId: number;
}

export function BackupRestoreSettings({ clientId }: BackupRestoreSettingsProps) {
    const [isExporting, setIsExporting] = useState(false);
    const [isImporting, setIsImporting] = useState(false);
    const [showSpreadsheetMapper, setShowSpreadsheetMapper] = useState(false);
    const [spreadsheetData, setSpreadsheetData] = useState<any[]>([]);
    const [spreadsheetHeaders, setSpreadsheetHeaders] = useState<string[]>([]);

    const exportMutation = trpc.backupRestore.exportOrgBackup.useMutation();
    const importMutation = trpc.backupRestore.importOrgBackup.useMutation();

    const handleExport = async () => {
        setIsExporting(true);
        try {
            const result = await exportMutation.mutateAsync({ clientId });
            if (result.success && result.backup) {
                const blob = new Blob([JSON.stringify(result.backup, null, 2)], { type: "application/json" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `complianceos_backup_${clientId}_${new Date().toISOString().split('T')[0]}.json`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
                toast.success("Backup exported successfully");
            }
        } catch (error: any) {
            toast.error("Export failed: " + error.message);
        } finally {
            setIsExporting(false);
        }
    };

    const handleJsonImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setIsImporting(true);
        try {
            const reader = new FileReader();
            reader.onload = async (e) => {
                try {
                    const content = e.target?.result as string;
                    const backup = JSON.parse(content);
                    
                    await importMutation.mutateAsync({
                        clientId,
                        backup
                    });
                    
                    toast.success("Backup imported and merged successfully");
                } catch (err: any) {
                    toast.error("Invalid backup file: " + err.message);
                } finally {
                    setIsImporting(false);
                }
            };
            reader.readAsText(file);
        } catch (error: any) {
            toast.error("Import failed: " + error.message);
            setIsImporting(false);
        }
    };

    const handleSpreadsheetUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        // Task 4: Spreadsheet parsing with PapaParse
        const { default: Papa } = await import("papaparse");
        
        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => {
                if (results.data && results.data.length > 0) {
                    setSpreadsheetData(results.data);
                    setSpreadsheetHeaders(Object.keys(results.data[0] as object));
                    setShowSpreadsheetMapper(true);
                    toast.success("Spreadsheet parsed successfully");
                } else {
                    toast.error("No data found in spreadsheet");
                }
            },
            error: (error) => {
                toast.error("Failed to parse spreadsheet: " + error.message);
            }
        });
    };

    if (showSpreadsheetMapper) {
        return (
            <SpreadsheetMapper 
                clientId={clientId}
                headers={spreadsheetHeaders}
                data={spreadsheetData}
                onCancel={() => setShowSpreadsheetMapper(false)}
                onSuccess={() => {
                    setShowSpreadsheetMapper(false);
                    toast.success("Data imported successfully!");
                }}
            />
        );
    }

    return (
        <div className="space-y-6">
            <Card className="border-primary/20 bg-primary/5">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Database className="h-5 w-5 text-primary" />
                        Premium Backup & Restore
                    </CardTitle>
                    <CardDescription>
                        Complete organizational data export and restoration. This allows you to migrate data between systems or keep local archives.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-4 border rounded-lg bg-card space-y-3">
                            <div className="flex items-center gap-2 font-semibold">
                                <Download className="h-5 w-5 text-blue-500" />
                                Export Archive
                            </div>
                            <p className="text-sm text-muted-foreground">
                                Download a high-fidelity JSON archive containing all Frameworks, Controls, Policies, Risks, and Assets.
                            </p>
                            <Button 
                                onClick={handleExport} 
                                disabled={isExporting}
                                className="w-full"
                            >
                                {isExporting ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <FileJson className="mr-2 h-4 w-4" />}
                                Download JSON Backup
                            </Button>
                        </div>

                        <div className="p-4 border rounded-lg bg-card space-y-3">
                            <div className="flex items-center gap-2 font-semibold">
                                <Upload className="h-5 w-5 text-green-500" />
                                Restore & Merge
                            </div>
                            <p className="text-sm text-muted-foreground">
                                Upload a previously exported archive. Data will be merged/upserted with existing records.
                            </p>
                            <div className="relative">
                                <Button 
                                    variant="outline" 
                                    className="w-full"
                                    disabled={isImporting}
                                    onClick={() => document.getElementById("json-restore")?.click()}
                                >
                                    {isImporting ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <Upload className="mr-2 h-4 w-4" />}
                                    Upload JSON Backup
                                </Button>
                                <input 
                                    id="json-restore"
                                    type="file" 
                                    accept=".json"
                                    className="hidden" 
                                    onChange={handleJsonImport}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
                        <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
                        <div className="text-sm text-amber-800">
                            <strong>Note on IDs:</strong> Restoring backups creates new internal IDs or matches by unique identifiers (titles/names). 
                            Restoring will <strong>update</strong> existing items with matching names/titles and <strong>create</strong> new ones if no match is found.
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Table className="h-5 w-5 text-indigo-500" />
                        Spreadsheet Importer
                    </CardTitle>
                    <CardDescription>
                        Import data from CSV files. Map your spreadsheet columns to database fields using our visual tool.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-lg bg-slate-50">
                        <Table className="h-12 w-12 text-slate-400 mb-4" />
                        <h3 className="text-lg font-medium mb-1">Upload Spreadsheet</h3>
                        <p className="text-sm text-muted-foreground mb-4 text-center max-w-sm">
                            Supported: CSV. You can map columns for Controls, Risks, Assets, or Policies in the next step.
                        </p>
                        <Button 
                            variant="secondary"
                            onClick={() => document.getElementById("csv-import")?.click()}
                        >
                            Select CSV File
                        </Button>
                        <input 
                            id="csv-import"
                            type="file" 
                            accept=".csv"
                            className="hidden" 
                            onChange={handleSpreadsheetUpload}
                        />
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

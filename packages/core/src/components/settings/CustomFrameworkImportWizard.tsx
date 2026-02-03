
import { useState, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@complianceos/ui/ui/dialog";
import { Button } from "@complianceos/ui/ui/button";
import { Label } from "@complianceos/ui/ui/label";
import { Input } from "@complianceos/ui/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@complianceos/ui/ui/select";
import { toast } from "sonner";
import { Loader2, Upload, FileSpreadsheet, ArrowRight, Check } from "lucide-react";
import * as XLSX from 'xlsx';

interface CustomFrameworkImportWizardProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    clientId: number;
    onSuccess?: () => void;
}

export function CustomFrameworkImportWizard({ open, onOpenChange, clientId, onSuccess }: CustomFrameworkImportWizardProps) {
    const [step, setStep] = useState(1);
    const [file, setFile] = useState<File | null>(null);
    const [workbook, setWorkbook] = useState<XLSX.WorkBook | null>(null);
    const [sheetName, setSheetName] = useState<string>("");
    const [headerRow, setHeaderRow] = useState<number>(1);
    const [headers, setHeaders] = useState<string[]>([]);

    // Framework Details
    const [frameworkName, setFrameworkName] = useState("");
    const [frameworkVersion, setFrameworkVersion] = useState("1.0");

    // Mappings
    const [mappings, setMappings] = useState<Record<string, string>>({
        controlCode: "",
        title: "",
        description: "",
        grouping: "",
        status: ""
    });

    const fileInputRef = useRef<HTMLInputElement>(null);

    const importMutation = trpc.frameworkImport.importCustomFramework.useMutation({
        onSuccess: (data: any) => {
            toast.success(`Successfully imported ${data.count} controls to the library!`);
            onOpenChange(false);
            onSuccess?.();
            resetState();
        },
        onError: (err) => {
            toast.error(`Import failed: ${err.message}`);
        }
    });

    const resetState = () => {
        setStep(1);
        setFile(null);
        setWorkbook(null);
        setSheetName("");
        setHeaderRow(1);
        setHeaders([]);
        setFrameworkName("");
        setFrameworkVersion("1.0");
        setMappings({ controlCode: "", title: "", description: "", grouping: "", status: "" });
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const f = e.target.files[0];
            setFile(f);

            // Auto-fill name if empty
            if (!frameworkName) {
                setFrameworkName(f.name.replace(/\.[^/.]+$/, ""));
            }

            const reader = new FileReader();
            reader.onload = (evt) => {
                const bstr = evt.target?.result;
                const wb = XLSX.read(bstr, { type: 'binary' });
                setWorkbook(wb);
                if (wb.SheetNames.length > 0) {
                    setSheetName(wb.SheetNames[0]);
                }
            };
            reader.readAsBinaryString(f);
        }
    };

    const handleAnalyzeSheet = () => {
        if (!workbook || !sheetName) return;
        const sheet = workbook.Sheets[sheetName];

        // Convert to JSON to inspect headers properly based on row index
        const range = XLSX.utils.decode_range(sheet['!ref'] || "A1:Z100");
        const json = XLSX.utils.sheet_to_json(sheet, { header: 1, range: 0 }); // Read strictly by rows

        // Get the specific row (0-indexed)
        const rowIdx = headerRow - 1;
        if (json[rowIdx] && Array.isArray(json[rowIdx])) {
            const rowData = json[rowIdx] as any[];
            // Create nice unique headers
            const detectedHeaders = rowData.map((cell, idx) => {
                const val = cell ? String(cell).trim() : `Column ${idx + 1}`;
                return val;
            });
            setHeaders(detectedHeaders);
            setStep(2);
        } else {
            toast.error(`Row ${headerRow} appears to be empty.`);
        }
    };

    const handleImport = async () => {
        if (!file) return;

        const reader = new FileReader();
        reader.onload = () => {
            const base64String = (reader.result as string).split(',')[1];

            // Construct mapping: Excel Column Header -> DB Field
            // The API expects Record<ExcelColumnName, DBFieldName>
            // But my state is Record<DBFieldName, ExcelColumnName>
            // I need to invert it for the API.

            const apiMappings: Record<string, string> = {};
            Object.entries(mappings).forEach(([dbField, excelCol]) => {
                if (excelCol) {
                    apiMappings[excelCol] = dbField;
                }
            });

            importMutation.mutate({
                clientId,
                frameworkName,
                frameworkVersion,
                fileContent: base64String,
                sheetName,
                headerRow,
                columnMappings: apiMappings
            });
        };
        reader.readAsDataURL(file);
    };

    return (
        <Dialog open={open} onOpenChange={(v) => { if (!v) resetState(); onOpenChange(v); }}>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle>Import Custom Framework</DialogTitle>
                    <DialogDescription>
                        Upload any Excel sheet and map its columns to create a new framework in your library.
                    </DialogDescription>
                </DialogHeader>

                {step === 1 && (
                    <div className="space-y-6 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Framework Name</Label>
                                <Input value={frameworkName} onChange={e => setFrameworkName(e.target.value)} placeholder="e.g. My Custom Standard" />
                            </div>
                            <div className="space-y-2">
                                <Label>Version</Label>
                                <Input value={frameworkVersion} onChange={e => setFrameworkVersion(e.target.value)} placeholder="1.0" />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Upload Excel File</Label>
                            <div
                                className="border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer hover:bg-muted/50 transition-colors"
                                onClick={() => fileInputRef.current?.click()}
                            >
                                {file ? (
                                    <div className="text-center">
                                        <FileSpreadsheet className="h-10 w-10 text-green-600 mx-auto mb-2" />
                                        <p className="font-medium">{file.name}</p>
                                        <p className="text-sm text-muted-foreground">{(file.size / 1024).toFixed(1)} KB</p>
                                    </div>
                                ) : (
                                    <div className="text-center">
                                        <Upload className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
                                        <p className="font-medium">Click to upload .xlsx</p>
                                    </div>
                                )}
                                <input ref={fileInputRef} type="file" accept=".xlsx" className="hidden" onChange={handleFileChange} />
                            </div>
                        </div>

                        {workbook && (
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Select Sheet</Label>
                                    <Select value={sheetName} onValueChange={setSheetName}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            {workbook.SheetNames.map(name => (
                                                <SelectItem key={name} value={name}>{name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Header Row Number</Label>
                                    <Input
                                        type="number"
                                        min={1}
                                        value={headerRow}
                                        onChange={e => setHeaderRow(parseInt(e.target.value) || 1)}
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {step === 2 && (
                    <div className="space-y-6 py-4">
                        <div className="bg-slate-50 p-3 rounded-md border text-sm">
                            <p className="font-medium text-slate-700">Instructions:</p>
                            <p className="text-slate-600">Map the columns from your Excel file to the required system fields.</p>
                        </div>

                        <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                            <div className="grid grid-cols-12 gap-4 items-center">
                                <Label className="col-span-4">Control ID / Code <span className="text-red-500">*</span></Label>
                                <div className="col-span-8">
                                    <Select value={mappings.controlCode} onValueChange={v => setMappings({ ...mappings, controlCode: v })}>
                                        <SelectTrigger><SelectValue placeholder="Select Excel Column" /></SelectTrigger>
                                        <SelectContent>
                                            {headers.map(h => <SelectItem key={h} value={h}>{h}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="grid grid-cols-12 gap-4 items-center">
                                <Label className="col-span-4">Title <span className="text-red-500">*</span></Label>
                                <div className="col-span-8">
                                    <Select value={mappings.title} onValueChange={v => setMappings({ ...mappings, title: v })}>
                                        <SelectTrigger><SelectValue placeholder="Select Excel Column" /></SelectTrigger>
                                        <SelectContent>
                                            {headers.map(h => <SelectItem key={h} value={h}>{h}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="grid grid-cols-12 gap-4 items-center">
                                <Label className="col-span-4">Description</Label>
                                <div className="col-span-8">
                                    <Select value={mappings.description} onValueChange={v => setMappings({ ...mappings, description: v })}>
                                        <SelectTrigger><SelectValue placeholder="(Optional)" /></SelectTrigger>
                                        <SelectContent>
                                            {headers.map(h => <SelectItem key={h} value={h}>{h}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="grid grid-cols-12 gap-4 items-center">
                                <Label className="col-span-4">Grouping / Domain</Label>
                                <div className="col-span-8">
                                    <Select value={mappings.grouping} onValueChange={v => setMappings({ ...mappings, grouping: v })}>
                                        <SelectTrigger><SelectValue placeholder="(Optional)" /></SelectTrigger>
                                        <SelectContent>
                                            {headers.map(h => <SelectItem key={h} value={h}>{h}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                <DialogFooter>
                    {step === 1 ? (
                        <Button onClick={handleAnalyzeSheet} disabled={!file}>
                            Next <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                    ) : (
                        <div className="flex gap-2">
                            <Button variant="outline" onClick={() => setStep(1)}>Back</Button>
                            <Button
                                onClick={handleImport}
                                disabled={!mappings.controlCode || !mappings.title || importMutation.isPending}
                            >
                                {importMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}
                                Import Framework
                            </Button>
                        </div>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

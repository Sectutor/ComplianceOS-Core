
import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@complianceos/ui/ui/card";
import { Button } from "@complianceos/ui/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@complianceos/ui/ui/select";
import { Loader2, ArrowRight, CheckCircle2, ChevronLeft, Table as TableIcon, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@complianceos/ui/ui/table";

interface SpreadsheetMapperProps {
    clientId: number;
    headers: string[];
    data: any[];
    onCancel: () => void;
    onSuccess: () => void;
}

type ImportType = "controls" | "risks" | "assets" | "policies";

const FIELD_DEFINITIONS: Record<ImportType, { label: string; key: string; required?: boolean }[]> = {
    controls: [
        { label: "Control ID / Code", key: "controlCode", required: true },
        { label: "Title", key: "title", required: true },
        { label: "Description", key: "description" },
        { label: "Grouping / Category", key: "grouping" },
    ],
    risks: [
        { label: "Risk Title", key: "title", required: true },
        { label: "Description", key: "description" },
        { label: "Likelihood (1-5)", key: "likelihood" },
        { label: "Impact (1-5)", key: "impact" },
        { label: "Status", key: "status" },
    ],
    assets: [
        { label: "Asset Name", key: "name", required: true },
        { label: "Type", key: "type", required: true },
        { label: "Owner", key: "owner" },
        { label: "Criticality", key: "criticality" },
    ],
    policies: [
        { label: "Policy Name", key: "name", required: true },
        { label: "Content", key: "content" },
        { label: "Status", key: "status" },
    ]
};

export function SpreadsheetMapper({ clientId, headers, data, onCancel, onSuccess }: SpreadsheetMapperProps) {
    const [step, setStep] = useState(1);
    const [importType, setImportType] = useState<ImportType | null>(null);
    const [mapping, setMapping] = useState<Record<string, string>>({});
    const [isImporting, setIsImporting] = useState(false);

    // Mock mutation for now - we'll implement it next
    const importMutation = trpc.backupRestore.importSpreadsheetData.useMutation();

    const currentFields = importType ? FIELD_DEFINITIONS[importType] : [];

    const autoMap = (type: ImportType) => {
        const newMapping: Record<string, string> = {};
        const fields = FIELD_DEFINITIONS[type];
        
        fields.forEach(field => {
            const match = headers.find(h => 
                h.toLowerCase() === field.key.toLowerCase() || 
                h.toLowerCase() === field.label.toLowerCase() ||
                h.toLowerCase().includes(field.key.toLowerCase())
            );
            if (match) newMapping[field.key] = match;
        });
        
        setMapping(newMapping);
    };

    const handleTypeSelect = (type: ImportType) => {
        setImportType(type);
        setStep(2);
        autoMap(type);
    };

    const handleMappingChange = (fieldKey: string, header: string) => {
        setMapping(prev => ({ ...prev, [fieldKey]: header }));
    };

    const mappedDataPreview = useMemo(() => {
        if (!importType) return [];
        return data.slice(0, 5).map(row => {
            const mappedRow: any = {};
            currentFields.forEach(field => {
                const header = mapping[field.key];
                mappedRow[field.key] = header ? row[header] : "";
            });
            return mappedRow;
        });
    }, [data, mapping, currentFields, importType]);

    const isMappingValid = () => {
        return currentFields.filter(f => f.required).every(f => mapping[f.key]);
    };

    const handleImport = async () => {
        if (!importType) return;
        setIsImporting(true);
        try {
            // Prepare the data by mapping all rows
            const mappedRows = data.map(row => {
                const mappedRow: any = {};
                currentFields.forEach(field => {
                    const header = mapping[field.key];
                    mappedRow[field.key] = header ? row[header] : null;
                });
                return mappedRow;
            });

            await importMutation.mutateAsync({
                clientId,
                type: importType,
                data: mappedRows
            });

            toast.success(`${importType.charAt(0).toUpperCase() + importType.slice(1)} imported successfully`);
            onSuccess();
        } catch (error: any) {
            toast.error("Import failed: " + error.message);
        } finally {
            setIsImporting(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <Button variant="ghost" onClick={onCancel} className="gap-2">
                    <ChevronLeft className="h-4 w-4" />
                    Cancel Import
                </Button>
                <div className="flex gap-2">
                    {[1, 2, 3].map(i => (
                        <div 
                            key={i} 
                            className={`h-2 w-12 rounded-full ${i <= step ? "bg-primary" : "bg-muted"}`}
                        />
                    ))}
                </div>
            </div>

            <AnimatePresence mode="wait">
                {step === 1 && (
                    <motion.div
                        key="step1"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="space-y-6"
                    >
                        <div className="text-center space-y-2">
                            <h2 className="text-2xl font-bold">What are you importing?</h2>
                            <p className="text-muted-foreground text-sm">Select the type of data in your spreadsheet.</p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {(Object.keys(FIELD_DEFINITIONS) as ImportType[]).map((type) => (
                                <Card 
                                    key={type}
                                    className="cursor-pointer hover:border-primary transition-all hover:shadow-md"
                                    onClick={() => handleTypeSelect(type)}
                                >
                                    <CardHeader className="flex flex-row items-center gap-4">
                                        <div className="h-10 w-10 rounded-md bg-primary/10 flex items-center justify-center text-primary">
                                            <TableIcon className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <CardTitle className="capitalize">{type}</CardTitle>
                                            <CardDescription>Import your {type} list.</CardDescription>
                                        </div>
                                    </CardHeader>
                                </Card>
                            ))}
                        </div>
                    </motion.div>
                )}

                {step === 2 && importType && (
                    <motion.div
                        key="step2"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="space-y-6"
                    >
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 capitalize">
                                    Map {importType} Columns
                                </CardTitle>
                                <CardDescription>
                                    Match your spreadsheet columns to ComplianceOS fields.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-2 gap-4 font-semibold text-sm border-b pb-2">
                                    <span>Database Field</span>
                                    <span>Spreadsheet Column</span>
                                </div>
                                {currentFields.map((field) => (
                                    <div key={field.key} className="grid grid-cols-2 gap-4 items-center">
                                        <div className="flex flex-col">
                                            <span className="text-sm font-medium">
                                                {field.label}
                                                {field.required && <span className="text-destructive ml-1">*</span>}
                                            </span>
                                            <span className="text-xs text-muted-foreground">Internal Key: {field.key}</span>
                                        </div>
                                        <Select 
                                            value={mapping[field.key] || "skip"} 
                                            onValueChange={(val) => handleMappingChange(field.key, val)}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Skip field" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="skip">-- Skip --</SelectItem>
                                                {headers.map(h => (
                                                    <SelectItem key={h} value={h}>{h}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                ))}
                            </CardContent>
                            <CardFooter className="flex justify-between">
                                <Button variant="outline" onClick={() => setStep(1)}>Back</Button>
                                <Button 
                                    onClick={() => setStep(3)} 
                                    disabled={!isMappingValid()}
                                    className="gap-2"
                                >
                                    Review Data <ArrowRight className="h-4 w-4" />
                                </Button>
                            </CardFooter>
                        </Card>
                    </motion.div>
                )}

                {step === 3 && importType && (
                    <motion.div
                        key="step3"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="space-y-6"
                    >
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    Review & Data Preview
                                </CardTitle>
                                <CardDescription>
                                    Check the first few rows to ensure the mapping is correct.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="border rounded-md overflow-hidden">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                {currentFields.map(f => mapping[f.key] && (
                                                    <TableHead key={f.key}>{f.label}</TableHead>
                                                ))}
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {mappedDataPreview.map((row, i) => (
                                                <TableRow key={i}>
                                                    {currentFields.map(f => mapping[f.key] && (
                                                        <TableCell key={f.key} className="text-xs truncate max-w-[200px]">
                                                            {String(row[f.key] || "-")}
                                                        </TableCell>
                                                    ))}
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>

                                <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg flex gap-3">
                                    <CheckCircle2 className="h-5 w-5 text-blue-600 shrink-0" />
                                    <div className="text-sm text-blue-800">
                                        Ready to import <strong>{data.length}</strong> records. 
                                        Existing records with the same identifier will be updated, new ones will be created.
                                    </div>
                                </div>
                            </CardContent>
                            <CardFooter className="flex justify-between">
                                <Button variant="outline" onClick={() => setStep(2)}>Back</Button>
                                <Button 
                                    onClick={handleImport} 
                                    disabled={isImporting}
                                    className="gap-2 bg-green-600 hover:bg-green-700"
                                >
                                    {isImporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                                    Start Import
                                </Button>
                            </CardFooter>
                        </Card>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

/**
 * Google Drive File Browser Component
 * 
 * Allows users to browse their Google Drive and import files directly into Evidence.
 */

import { useState } from "react";
import { Button } from "@complianceos/ui/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@complianceos/ui/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@complianceos/ui/ui/dialog";
import { Input } from "@complianceos/ui/ui/input";
import { ScrollArea } from "@complianceos/ui/ui/scroll-area";
import { Badge } from "@complianceos/ui/ui/badge";
import {
    Folder,
    File,
    FileText,
    Image,
    FileSpreadsheet,
    Search,
    Download,
    Loader2,
    CheckCircle2,
    X,
    RefreshCw,
    FolderOpen,
    ChevronRight
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

interface GoogleDriveFileBrowserProps {
    evidenceId: number;
    clientId: number;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onImportComplete?: () => void;
}

interface DriveFile {
    id: string;
    name: string;
    mimeType: string;
    webViewLink?: string;
    modifiedTime?: string;
    size?: string;
}

export function GoogleDriveFileBrowser({
    evidenceId,
    clientId,
    open,
    onOpenChange,
    onImportComplete
}: GoogleDriveFileBrowserProps) {
    const [searchQuery, setSearchQuery] = useState("");
    const [currentFolderId, setCurrentFolderId] = useState<string | undefined>(undefined);
    const [selectedFiles, setSelectedFiles] = useState<DriveFile[]>([]);
    const [importingFiles, setImportingFiles] = useState<Set<string>>(new Set());
    const [importedFiles, setImportedFiles] = useState<Set<string>>(new Set());
    const [breadcrumb, setBreadcrumb] = useState<{ id?: string; name: string }[]>([
        { name: "My Drive" }
    ]);

    // Query for listing Google Drive files
    const { data: filesData, isLoading, refetch } = trpc.integrations.listGoogleDriveFiles.useQuery(
        { clientId, folderId: currentFolderId, query: searchQuery || undefined },
        {
            enabled: open && !!searchQuery,
        }
    );

    // Query for root folder files (when no search)
    const { data: rootFilesData, isLoading: isLoadingRoot, refetch: refetchRoot } = trpc.integrations.listGoogleDriveFiles.useQuery(
        { clientId, folderId: undefined, query: undefined },
        {
            enabled: open && !searchQuery && !currentFolderId,
        }
    );

    // Import mutation
    const importMutation = trpc.integrations.importFromGoogleDrive.useMutation({
        onSuccess: (data) => {
            setImportedFiles(prev => new Set(prev).add(data.filename));
            toast.success(`Imported: ${data.filename}`);
        },
        onError: (error) => {
            toast.error(`Import failed: ${error.message}`);
        }
    });

    const files = searchQuery ? (filesData?.files || []) : (rootFilesData?.files || []);
    const isLoadingFiles = searchQuery ? isLoading : isLoadingRoot;

    const handleFileSelect = (file: DriveFile) => {
        if (importedFiles.has(file.name)) return;

        setSelectedFiles(prev => {
            const isSelected = prev.some(f => f.id === file.id);
            if (isSelected) {
                return prev.filter(f => f.id !== file.id);
            }
            return [...prev, file];
        });
    };

    const handleImportSelected = async () => {
        setImportingFiles(new Set(selectedFiles.map(f => f.id)));

        for (const file of selectedFiles) {
            if (!importingFiles.has(file.id)) {
                await importMutation.mutateAsync({
                    clientId,
                    evidenceId,
                    fileId: file.id,
                    fileName: file.name,
                    mimeType: file.mimeType
                });
            }
        }

        setImportingFiles(new Set());
        setSelectedFiles([]);

        if (onImportComplete) {
            onImportComplete();
        }
    };

    const handleFolderClick = (folderId: string, folderName: string) => {
        setCurrentFolderId(folderId);
        setSearchQuery("");
        setBreadcrumb(prev => [...prev, { id: folderId, name: folderName }]);
    };

    const handleBreadcrumbClick = (index: number) => {
        const newBreadcrumb = breadcrumb.slice(0, index + 1);
        setBreadcrumb(newBreadcrumb);
        setCurrentFolderId(newBreadcrumb[newBreadcrumb.length - 1].id || undefined);
        setSearchQuery("");
    };

    const getFileIcon = (mimeType: string) => {
        if (mimeType.includes("folder")) return <Folder className="h-5 w-5 text-amber-500" />;
        if (mimeType.includes("image")) return <Image className="h-5 w-5 text-purple-500" />;
        if (mimeType.includes("spreadsheet") || mimeType.includes("excel")) return <FileSpreadsheet className="h-5 w-5 text-emerald-500" />;
        if (mimeType.includes("document") || mimeType.includes("word")) return <FileText className="h-5 w-5 text-blue-500" />;
        if (mimeType.includes("pdf")) return <FileText className="h-5 w-5 text-red-500" />;
        return <File className="h-5 w-5 text-slate-500" />;
    };

    const formatFileSize = (bytes: string) => {
        const size = parseInt(bytes, 10);
        if (isNaN(size)) return "";
        if (size < 1024) return `${size} B`;
        if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
        return `${(size / (1024 * 1024)).toFixed(1)} MB`;
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString();
    };

    const filteredFiles = files.filter(f => !f.mimeType.includes("folder"));

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[700px] max-h-[80vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <span className="text-2xl">📁</span>
                        Import from Google Drive
                    </DialogTitle>
                    <DialogDescription>
                        Select files from your Google Drive to import as evidence
                    </DialogDescription>
                </DialogHeader>

                {/* Search and Breadcrumb */}
                <div className="space-y-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search files in Google Drive..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9"
                        />
                    </div>

                    {/* Breadcrumb */}
                    {!searchQuery && (
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            {breadcrumb.map((item, index) => (
                                <div key={index} className="flex items-center gap-1">
                                    {index > 0 && <ChevronRight className="h-4 w-4" />}
                                    <button
                                        onClick={() => handleBreadcrumbClick(index)}
                                        className={`hover:text-primary ${index === breadcrumb.length - 1 ? "font-medium text-primary" : ""}`}
                                    >
                                        {item.name}
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* File List */}
                <ScrollArea className="flex-1 min-h-[300px] border rounded-md">
                    {isLoadingFiles ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="h-6 w-6 animate-spin text-primary" />
                            <span className="ml-2 text-muted-foreground">Loading files...</span>
                        </div>
                    ) : filteredFiles.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground">
                            <FolderOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
                            <p>No files found</p>
                            <p className="text-sm">Try a different search or browse your folders</p>
                        </div>
                    ) : (
                        <div className="p-2">
                            {/* Show folders first */}
                            {files.filter(f => f.mimeType.includes("folder")).map((folder) => (
                                <div
                                    key={folder.id}
                                    onClick={() => handleFolderClick(folder.id, folder.name)}
                                    className="flex items-center gap-3 p-3 hover:bg-muted rounded-lg cursor-pointer"
                                >
                                    <Folder className="h-6 w-6 text-amber-500" />
                                    <div className="flex-1">
                                        <p className="font-medium">{folder.name}</p>
                                    </div>
                                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                </div>
                            ))}

                            {/* Show files */}
                            {filteredFiles.map((file) => {
                                const isSelected = selectedFiles.some(f => f.id === file.id);
                                const isImporting = importingFiles.has(file.id);
                                const isImported = importedFiles.has(file.name);

                                return (
                                    <div
                                        key={file.id}
                                        onClick={() => handleFileSelect(file)}
                                        className={`flex items-center gap-3 p-3 hover:bg-muted rounded-lg cursor-pointer transition-colors ${isSelected ? "bg-primary/10 border border-primary" : ""
                                            } ${isImported ? "opacity-50" : ""}`}
                                    >
                                        {getFileIcon(file.mimeType)}
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium truncate">{file.name}</p>
                                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                {file.size && <span>{formatFileSize(file.size)}</span>}
                                                {file.modifiedTime && (
                                                    <>
                                                        <span>•</span>
                                                        <span>{formatDate(file.modifiedTime)}</span>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                        {isImporting && (
                                            <Loader2 className="h-4 w-4 animate-spin text-primary" />
                                        )}
                                        {isImported && (
                                            <Badge variant="secondary" className="bg-green-100 text-green-700">
                                                <CheckCircle2 className="h-3 w-3 mr-1" />
                                                Imported
                                            </Badge>
                                        )}
                                        {isSelected && !isImporting && !isImported && (
                                            <div className="h-5 w-5 rounded-full bg-primary flex items-center justify-center">
                                                <CheckCircle2 className="h-3 w-3 text-primary-foreground" />
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </ScrollArea>

                {/* Actions */}
                <div className="flex items-center justify-between pt-4 border-t">
                    <div className="text-sm text-muted-foreground">
                        {selectedFiles.length > 0 ? (
                            <span>{selectedFiles.length} file(s) selected</span>
                        ) : (
                            <span>Select files to import</span>
                        )}
                    </div>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            onClick={() => {
                                if (searchQuery || currentFolderId) {
                                    refetch();
                                    refetchRoot();
                                }
                            }}
                        >
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Refresh
                        </Button>
                        <Button
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                        >
                            <X className="h-4 w-4 mr-2" />
                            Cancel
                        </Button>
                        <Button
                            onClick={handleImportSelected}
                            disabled={selectedFiles.length === 0 || importingFiles.size > 0}
                        >
                            <Download className="h-4 w-4 mr-2" />
                            Import {selectedFiles.length > 0 ? `(${selectedFiles.length})` : ""}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}

export default GoogleDriveFileBrowser;

import { Button } from "@complianceos/ui/ui/button";
import { Card, CardContent } from "@complianceos/ui/ui/card";
import { trpc } from "@/lib/trpc";
import { Upload, File, Trash2, Download, Loader2, AlertCircle, CheckCircle2, X, Search } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@complianceos/ui/ui/dialog";
import { Input } from "@complianceos/ui/ui/input";
import { ScrollArea } from "@complianceos/ui/ui/scroll-area";
import { useState, useRef } from "react";
import { toast } from "sonner";

// Force HMR update

interface EvidenceFileUploadProps {
  evidenceId: number;
  clientId: number;
}

interface UploadingFile {
  id: string;
  name: string;
  size: number;
  progress: number;
  status: 'uploading' | 'success' | 'error';
  error?: string;
}

const ALLOWED_TYPES = [
  'image/png', 'image/jpeg', 'image/gif', 'image/webp',
  'application/pdf',
  'text/plain', 'text/csv',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/json',
  'application/zip',
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_TOTAL_SIZE = 100 * 1024 * 1024; // 100MB for bulk upload

export default function EvidenceFileUpload({ evidenceId, clientId }: EvidenceFileUploadProps) {
  /* Defensive check for props */
  if (!evidenceId || !clientId) {
    console.warn("EvidenceFileUpload: Missing props", { evidenceId, clientId });
    return <div className="p-4 text-red-500 text-sm">Error: Unable to load file uploader. Missing context.</div>;
  }

  console.log("EvidenceFileUpload mounted with:", { evidenceId, clientId });

  const [isDragActive, setIsDragActive] = useState(false);
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [linkingFileId, setLinkingFileId] = useState<number | null>(null);
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: files, refetch } = trpc.evidenceFiles.list.useQuery({ evidenceId });

  // Library query
  const { data: libraryFiles } = trpc.evidenceFiles.listAll.useQuery(
    { clientId, search: searchQuery },
    { enabled: libraryOpen }
  );

  const linkMutation = trpc.evidenceFiles.linkExisting.useMutation({
    onSuccess: () => {
      toast.success("File linked successfully");
      setLinkingFileId(null);
      setLibraryOpen(false);
      refetch();
    },
    onError: (error) => {
      toast.error(error.message);
      setLinkingFileId(null);
    }
  });

  const handleLinkFile = (file: any) => {
    setLinkingFileId(file.id);
    linkMutation.mutate({
      targetEvidenceId: evidenceId,
      sourceFileId: file.id
    });
  };



  const createFileMutation = trpc.evidenceFiles.create.useMutation({
    onSuccess: () => {
      refetch();
    },
    onError: (error) => toast.error(error.message),
  });

  const deleteFileMutation = trpc.evidenceFiles.delete.useMutation({
    onSuccess: () => {
      toast.success("File deleted");
      refetch();
    },
    onError: (error) => toast.error(error.message),
  });

  const validateFiles = (filesToValidate: File[]): { valid: File[], errors: string[] } => {
    const errors: string[] = [];
    const valid: File[] = [];
    let totalSize = 0;

    for (const file of filesToValidate) {
      // Check file type
      if (!ALLOWED_TYPES.includes(file.type)) {
        errors.push(`${file.name}: File type not allowed`);
        continue;
      }

      // Check individual file size
      if (file.size > MAX_FILE_SIZE) {
        errors.push(`${file.name}: File too large (max 10MB)`);
        continue;
      }

      totalSize += file.size;
      valid.push(file);
    }

    // Check total size for bulk upload
    if (totalSize > MAX_TOTAL_SIZE) {
      errors.push(`Total file size exceeds 100MB limit`);
      return { valid: [], errors };
    }

    return { valid, errors };
  };

  const uploadFiles = async (filesToUpload: File[]) => {
    const { valid, errors } = validateFiles(filesToUpload);

    // Show validation errors
    if (errors.length > 0) {
      errors.forEach(error => toast.error(error));
      if (valid.length === 0) return;
    }

    // Initialize uploading files state
    const uploadingStates: UploadingFile[] = valid.map((file, idx) => ({
      id: `${Date.now()}-${idx}`,
      name: file.name,
      size: file.size,
      progress: 0,
      status: 'uploading' as const,
    }));

    setUploadingFiles(uploadingStates);

    // Upload each file
    for (let i = 0; i < valid.length; i++) {
      const file = valid[i];
      const uploadingFile = uploadingStates[i];

      try {
        // Read file as base64
        const reader = new FileReader();

        const uploadPromise = new Promise<void>((resolve, reject) => {
          reader.onload = async () => {
            try {
              const base64 = reader.result as string;
              const base64Data = base64.split(',')[1];

              // Generate unique filename
              const timestamp = Date.now();
              const randomSuffix = Math.random().toString(36).substring(2, 8);
              const extension = file.name.split('.').pop() || '';
              const filename = `evidence-${evidenceId}-${timestamp}-${randomSuffix}.${extension}`;

              // Update progress
              setUploadingFiles(prev =>
                prev.map(f => f.id === uploadingFile.id ? { ...f, progress: 30 } : f)
              );

              // Upload to server side storage via proxy
              const response = await fetch('/api/upload', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  filename,
                  data: base64Data,
                  contentType: file.type,
                  folder: 'evidence'
                }),
              });

              if (!response.ok) {
                throw new Error('Upload failed');
              }

              const { key, url } = await response.json();

              // Update progress
              setUploadingFiles(prev =>
                prev.map(f => f.id === uploadingFile.id ? { ...f, progress: 70 } : f)
              );

              // Save file record to database
              await new Promise<void>((dbResolve, dbReject) => {
                createFileMutation.mutate(
                  {
                    evidenceId,
                    filename,
                    originalFilename: file.name,
                    mimeType: file.type,
                    size: file.size,
                    fileKey: key,
                    url,
                  },
                  {
                    onSuccess: () => {
                      setUploadingFiles(prev =>
                        prev.map(f => f.id === uploadingFile.id ? { ...f, progress: 100, status: 'success' } : f)
                      );
                      dbResolve();
                    },
                    onError: (error) => {
                      setUploadingFiles(prev =>
                        prev.map(f => f.id === uploadingFile.id ? { ...f, status: 'error', error: error.message } : f)
                      );
                      dbReject(error);
                    },
                  }
                );
              });

              resolve();
            } catch (error) {
              const errorMsg = error instanceof Error ? error.message : 'Upload failed';
              setUploadingFiles(prev =>
                prev.map(f => f.id === uploadingFile.id ? { ...f, status: 'error', error: errorMsg } : f)
              );
              reject(error);
            }
          };

          reader.onerror = () => {
            const errorMsg = 'Failed to read file';
            setUploadingFiles(prev =>
              prev.map(f => f.id === uploadingFile.id ? { ...f, status: 'error', error: errorMsg } : f)
            );
            reject(new Error(errorMsg));
          };

          reader.readAsDataURL(file);
        });

        await uploadPromise;
      } catch (error) {
        // Error already handled in the promise
      }
    }

    // Clear uploading files after a delay
    setTimeout(() => {
      setUploadingFiles(prev => prev.filter(f => f.status !== 'success'));
    }, 2000);

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    if (selectedFiles.length === 0) return;
    await uploadFiles(selectedFiles);
  };

  const handleDrag = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragActive(true);
    } else if (e.type === "dragleave") {
      setIsDragActive(false);
    }
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    const droppedFiles = Array.from(e.dataTransfer.files || []);
    if (droppedFiles.length === 0) return;

    await uploadFiles(droppedFiles);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return '🖼️';
    if (mimeType === 'application/pdf') return '📄';
    if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) return '📊';
    if (mimeType.includes('word') || mimeType.includes('document')) return '📝';
    return '📎';
  };

  const hasUploadingFiles = uploadingFiles.length > 0;
  const successCount = uploadingFiles.filter(f => f.status === 'success').length;
  const errorCount = uploadingFiles.filter(f => f.status === 'error').length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between hidden">
        <h4 className="text-sm font-medium">Attached Files</h4>
        <div>
          <input
            id="evidence-upload-input"
            ref={fileInputRef}
            type="file"
            className="hidden"
            onChange={handleFileSelect}
            accept={ALLOWED_TYPES.join(',')}
            multiple
          />
        </div>
      </div>

      <Dialog open={libraryOpen} onOpenChange={setLibraryOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Select from Evidence Library</DialogTitle>
            <DialogDescription>
              Choose an existing file to link to this request.
            </DialogDescription>
          </DialogHeader>

          <div className="py-2">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search files..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>

          <ScrollArea className="flex-1 min-h-[300px] border rounded-md p-2">
            <div className="space-y-2">
              {libraryFiles?.map((file: any) => (
                <div
                  key={file.id}
                  className="flex items-center justify-between p-2 hover:bg-muted rounded-lg cursor-pointer border border-transparent hover:border-border transition-colors group"
                  onClick={() => handleLinkFile(file)}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-xl">{getFileIcon(file.contentType || 'application/octet-stream')}</span>
                    <div className="min-w-0 text-left">
                      <p className="text-sm font-medium truncate">{file.filename}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {formatFileSize(file.fileSize || 0)} • {file.evidenceTitle || 'Uncategorized'} • {new Date(file.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  {linkMutation.isLoading && linkingFileId === file.id ? (
                    <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                  ) : (
                    <Button size="sm" variant="ghost" className="opacity-0 group-hover:opacity-100">
                      Select
                    </Button>
                  )}
                </div>
              ))}
              {libraryFiles?.length === 0 && (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  No files found matching your search.
                </div>
              )}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Drag and Drop Area */}
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${isDragActive
          ? 'border-primary bg-primary/5'
          : 'border-muted-foreground/25 hover:border-muted-foreground/50'
          }`}
        onClick={() => fileInputRef.current?.click()}
      >
        <Upload className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm font-medium">Drag and drop files here</p>
        <p className="text-xs text-muted-foreground mt-1">
          or click to select files (max 10MB each, 100MB total)
        </p>
        <p className="text-xs text-muted-foreground mt-2">
          Supported: Images, PDFs, Documents, Spreadsheets, Logs, JSON, ZIP
        </p>
      </div>

      {/* Uploading Files Progress */}
      {hasUploadingFiles && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">
                  Uploading {uploadingFiles.filter(f => f.status === 'uploading').length} file(s)
                  {successCount > 0 && <span className="text-green-600"> • {successCount} complete</span>}
                  {errorCount > 0 && <span className="text-red-600"> • {errorCount} failed</span>}
                </p>
              </div>

              {uploadingFiles.map((file) => (
                <div key={file.id} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2 min-w-0">
                      {file.status === 'uploading' && (
                        <Loader2 className="h-4 w-4 animate-spin text-blue-600 flex-shrink-0" />
                      )}
                      {file.status === 'success' && (
                        <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
                      )}
                      {file.status === 'error' && (
                        <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0" />
                      )}
                      <span className="truncate">{file.name}</span>
                    </div>
                    <span className="text-xs text-muted-foreground flex-shrink-0">
                      {formatFileSize(file.size)}
                    </span>
                  </div>

                  {file.status === 'uploading' && (
                    <div className="w-full bg-gray-200 rounded-full h-1.5">
                      <div
                        className="bg-blue-600 h-1.5 rounded-full transition-all"
                        style={{ width: `${file.progress}%` }}
                      />
                    </div>
                  )}

                  {file.status === 'error' && file.error && (
                    <p className="text-xs text-red-600">{file.error}</p>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Uploaded Files List */}
      {files && files.length > 0 ? (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground font-medium">
            {files.length} file{files.length !== 1 ? 's' : ''} uploaded
          </p>
          {files.map((file) => (
            <Card key={file.id} className="bg-muted/50">
              <CardContent className="p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-xl">{getFileIcon(file.contentType || 'application/octet-stream')}</span>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{file.filename}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatFileSize(file.size)} • {new Date(file.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => window.open(file.fileUrl, '_blank')}
                      title="Download file"
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive"
                      onClick={() => deleteFileMutation.mutate({ id: file.id })}
                      title="Delete file"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : !hasUploadingFiles ? (
        <div className="text-center py-6 text-muted-foreground text-sm border border-dashed rounded-lg">
          <File className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p>No files attached</p>
          <p className="text-xs">Upload screenshots, logs, or documents to support this evidence</p>
        </div>
      ) : null}
    </div>
  );
}

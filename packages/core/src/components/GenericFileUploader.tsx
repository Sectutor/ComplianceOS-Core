import { Button } from "@complianceos/ui/ui/button";
import { Card, CardContent } from "@complianceos/ui/ui/card";
import { Upload, Loader2, AlertCircle, CheckCircle2, X } from "lucide-react";
import { useState, useRef } from "react";
import { toast } from "sonner";

interface GenericFileUploaderProps {
    onUploadComplete: (file: { name: string; url: string; key: string }) => void;
    folder?: string;
    accept?: string[];
    maxSizeMB?: number;
    multiple?: boolean;
}

interface UploadingFile {
    id: string;
    name: string;
    size: number;
    progress: number;
    status: 'uploading' | 'success' | 'error';
    error?: string;
}

const DEFAULT_ALLOWED_TYPES = [
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

export default function GenericFileUploader({
    onUploadComplete,
    folder = 'uploads',
    accept = DEFAULT_ALLOWED_TYPES,
    maxSizeMB = 10,
    multiple = false
}: GenericFileUploaderProps) {
    const [isDragActive, setIsDragActive] = useState(false);
    const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const validateFiles = (filesToValidate: File[]): { valid: File[], errors: string[] } => {
        const errors: string[] = [];
        const valid: File[] = [];

        for (const file of filesToValidate) {
            if (!accept.includes(file.type)) {
                errors.push(`${file.name}: File type not allowed`);
                continue;
            }

            if (file.size > maxSizeMB * 1024 * 1024) {
                errors.push(`${file.name}: File too large (max ${maxSizeMB}MB)`);
                continue;
            }

            valid.push(file);
        }

        return { valid, errors };
    };

    const uploadFiles = async (filesToUpload: File[]) => {
        if (!multiple && filesToUpload.length > 1) {
            toast.error("Only one file allowed");
            filesToUpload = [filesToUpload[0]];
        }

        const { valid, errors } = validateFiles(filesToUpload);

        if (errors.length > 0) {
            errors.forEach(error => toast.error(error));
            if (valid.length === 0) return;
        }

        const uploadingStates: UploadingFile[] = valid.map((file, idx) => ({
            id: `${Date.now()}-${idx}`,
            name: file.name,
            size: file.size,
            progress: 0,
            status: 'uploading' as const,
        }));

        setUploadingFiles(prev => [...prev, ...uploadingStates]);

        for (let i = 0; i < valid.length; i++) {
            const file = valid[i];
            const uploadingFile = uploadingStates[i];

            try {
                const reader = new FileReader();

                const uploadPromise = new Promise<void>((resolve, reject) => {
                    reader.onload = async () => {
                        try {
                            const base64 = reader.result as string;
                            const base64Data = base64.split(',')[1];

                            setUploadingFiles(prev => prev.map(f => f.id === uploadingFile.id ? { ...f, progress: 30 } : f));

                            const response = await fetch('/api/upload', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                    filename: file.name,
                                    data: base64Data,
                                    contentType: file.type,
                                    folder
                                }),
                            });

                            if (!response.ok) throw new Error('Upload failed');

                            const { url, key } = await response.json();

                            setUploadingFiles(prev => prev.map(f => f.id === uploadingFile.id ? { ...f, progress: 100, status: 'success' } : f));

                            onUploadComplete({ name: file.name, url, key });
                            resolve();

                        } catch (error) {
                            const msg = error instanceof Error ? error.message : 'Unknown error';
                            setUploadingFiles(prev => prev.map(f => f.id === uploadingFile.id ? { ...f, status: 'error', error: msg } : f));
                            reject(error);
                        }
                    };
                    reader.onerror = () => reject(new Error('Failed to read file'));
                    reader.readAsDataURL(file);
                });

                await uploadPromise;
            } catch (e) {
                // Already handled in promise
            }
        }

        // Cleanup success items after 3s
        setTimeout(() => {
            setUploadingFiles(prev => prev.filter(f => f.status !== 'success'));
        }, 3000);

        if (fileInputRef.current) fileInputRef.current.value = '';
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

    const hasUploadingFiles = uploadingFiles.length > 0;

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                {/* Optional Header could go here */}
            </div>

            <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer ${isDragActive
                        ? 'border-primary bg-primary/5'
                        : 'border-muted-foreground/25 hover:border-muted-foreground/50'
                    }`}
                onClick={() => fileInputRef.current?.click()}
            >
                <Upload className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm font-medium">Click or Drag files here to upload</p>
                <p className="text-xs text-muted-foreground mt-1">
                    Max {maxSizeMB}MB
                </p>
                <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    onChange={handleFileSelect}
                    accept={accept.join(',')}
                    multiple={multiple}
                />
            </div>

            {/* Uploading Files Progress */}
            {hasUploadingFiles && (
                <Card className="border-blue-200 bg-blue-50">
                    <CardContent className="p-4">
                        <div className="space-y-3">
                            {uploadingFiles.map((file) => (
                                <div key={file.id} className="space-y-1">
                                    <div className="flex items-center justify-between text-sm">
                                        <div className="flex items-center gap-2 min-w-0">
                                            {file.status === 'uploading' && <Loader2 className="h-4 w-4 animate-spin text-blue-600 flex-shrink-0" />}
                                            {file.status === 'success' && <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />}
                                            {file.status === 'error' && <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0" />}
                                            <span className="truncate">{file.name}</span>
                                        </div>
                                        <span className="text-xs text-muted-foreground flex-shrink-0">{formatFileSize(file.size)}</span>
                                    </div>
                                    {file.status === 'uploading' && (
                                        <div className="w-full bg-gray-200 rounded-full h-1.5">
                                            <div className="bg-blue-600 h-1.5 rounded-full transition-all" style={{ width: `${file.progress}%` }} />
                                        </div>
                                    )}
                                    {file.status === 'error' && file.error && <p className="text-xs text-red-600">{file.error}</p>}
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}

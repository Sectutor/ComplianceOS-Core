import { Button } from "@complianceos/ui/ui/button";
import { trpc } from "@/lib/trpc";
import { Loader2, Search } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@complianceos/ui/ui/dialog";
import { Input } from "@complianceos/ui/ui/input";
import { ScrollArea } from "@complianceos/ui/ui/scroll-area";
import { useState, useRef } from "react";
import { toast } from "sonner";
import { authedFetch } from "@/lib/authedFetch";

interface FileLibraryPickerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientId: number;
  onSelect: (file: { id: number; fileUrl: string; fileKey: string; filename: string }) => void;
}

export function FileLibraryPicker({ open, onOpenChange, clientId, onSelect }: FileLibraryPickerProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectingId, setSelectingId] = useState<number | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: libraryFiles, isLoading, refetch } = trpc.evidenceFiles.listAll.useQuery(
    { clientId, search: searchQuery },
    { enabled: open }
  );

  const registerUpload = trpc.evidenceFiles.registerQuickUpload.useMutation();

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType?.startsWith('image/')) return '🖼️';
    if (mimeType === 'application/pdf') return '📄';
    if (mimeType?.includes('spreadsheet') || mimeType?.includes('excel')) return '📊';
    if (mimeType?.includes('word') || mimeType?.includes('document')) return '📝';
    return '📎';
  };

  const handleSelect = (file: any) => {
    setSelectingId(file.id);
    onSelect({ id: file.id, fileUrl: file.fileUrl, fileKey: file.fileKey, filename: file.filename });
    setSelectingId(null);
    onOpenChange(false);
  };

  const [uploadTitle, setUploadTitle] = useState("");

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Default title to filename if not provided
    const finalTitle = uploadTitle.trim() || file.name;

    setIsUploading(true);
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64Data = (reader.result as string).split(',')[1];

        const res = await authedFetch('/api/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            filename: file.name,
            data: base64Data,
            contentType: file.type,
            folder: `evidence/${clientId}`
          })
        });

        const json = await res.json();
        if (json.success) {
          // Register the upload in the database
          const registeredFile = await registerUpload.mutateAsync({
            clientId,
            title: finalTitle,
            filename: file.name,
            fileKey: json.key,
            url: json.url,
            contentType: file.type,
            size: file.size
          });

          onSelect({
            id: registeredFile.id,
            fileUrl: registeredFile.fileUrl,
            fileKey: registeredFile.fileKey,
            filename: registeredFile.filename
          });

          await refetch();
          onOpenChange(false);
          setUploadTitle(""); // Reset title
          toast.success("File uploaded and added to library");
        } else {
          toast.error("Upload failed: " + json.error);
        }
        setIsUploading(false);
      };
      reader.onerror = () => {
        toast.error("Failed to read file");
        setIsUploading(false);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error(err);
      toast.error("An error occurred during upload");
      setIsUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Select Stored Evidence</DialogTitle>
          <DialogDescription>Choose a previously uploaded file to link here.</DialogDescription>
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
            {isLoading && (
              <div className="flex items-center justify-center py-8 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading library...
              </div>
            )}
            {libraryFiles?.map((file: any) => {
              return (
                <div
                  key={file.id}
                  className="flex items-center justify-between p-2 rounded-lg hover:bg-muted cursor-pointer group"
                  onClick={() => handleSelect(file)}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-xl">{getFileIcon(file.contentType || 'application/octet-stream')}</span>
                    <div className="min-w-0 text-left">
                      <p className="text-sm font-medium truncate">{file.evidenceTitle || file.filename}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {file.filename} • {formatFileSize(file.size || 0)} • {new Date(file.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  {selectingId === file.id ? (
                    <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                  ) : (
                    <Button size="sm" variant="ghost" className="opacity-0 group-hover:opacity-100">Select</Button>
                  )}
                </div>
              );
            })}

            {!isLoading && (
              <div className="mt-4 pt-4 border-t border-slate-100">
                {libraryFiles?.length === 0 && (
                  <div className="text-center text-muted-foreground mb-4 text-sm">No files found matching your search.</div>
                )}

                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Add New Evidence</h4>
                  <div className="space-y-3">
                    <Input
                      placeholder="Evidence Title (e.g. 2024 Audit Report)"
                      value={uploadTitle}
                      onChange={(e) => setUploadTitle(e.target.value)}
                      className="bg-white"
                    />
                    <div className="flex flex-col sm:flex-row gap-3 items-center">
                      <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        onChange={handleFileUpload}
                      />
                      <Button
                        variant="outline"
                        className="w-full sm:w-auto"
                        onClick={() => {
                          if (!uploadTitle.trim()) {
                            toast.error("Please enter a title first");
                            return;
                          }
                          fileInputRef.current?.click();
                        }}
                        disabled={isUploading}
                      >
                        {isUploading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                        {isUploading ? "Uploading..." : "Upload File"}
                      </Button>
                      <div className="hidden sm:block text-slate-300 text-xs">OR</div>
                      <AddUrlInline onConfirm={(url) => {
                        if (!uploadTitle.trim()) {
                          toast.error("Please enter a title first");
                          return;
                        }
                        const filename = url.split('/').pop() || url;
                        // For URL, we fake the upload registration
                        registerUpload.mutateAsync({
                          clientId,
                          title: uploadTitle,
                          filename: filename,
                          fileKey: url,
                          url: url,
                          contentType: 'application/internet-shortcut',
                          size: 0
                        }).then((registeredFile) => {
                          onSelect({ id: registeredFile.id, fileUrl: registeredFile.fileUrl, fileKey: registeredFile.fileKey, filename: registeredFile.filename });
                          setUploadTitle("");
                          onOpenChange(false);
                        });
                      }} />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

function AddUrlInline({ onConfirm }: { onConfirm: (url: string) => void }) {
  const [url, setUrl] = useState("");
  const valid = /^https?:\/\//i.test(url);
  return (
    <div className="flex items-center gap-2 w-full sm:w-auto flex-1">
      <Input
        placeholder="Or paste URL..."
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        className="flex-1 w-full bg-white"
      />
      <Button
        size="sm"
        disabled={!valid}
        className="bg-blue-600 text-white hover:bg-blue-700 shrink-0"
        onClick={() => {
          if (!valid) return;
          onConfirm(url);
        }}
      >
        Add URL
      </Button>
    </div>
  );
}

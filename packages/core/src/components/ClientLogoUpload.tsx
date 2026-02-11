import { useState, useRef } from "react";
import { Button } from "@complianceos/ui/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@complianceos/ui/ui/card";
import { trpc } from "@/lib/trpc";
import { Upload, X, Building2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@complianceos/ui/ui/alert-dialog";

interface ClientLogoUploadProps {
  clientId: number;
  currentLogoUrl?: string | null;
  clientName: string;
}

export default function ClientLogoUpload({ clientId, currentLogoUrl, clientName }: ClientLogoUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentLogoUrl || null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const utils = trpc.useUtils();

  const uploadLogoMutation = trpc.clients.uploadLogo.useMutation({
    onSuccess: () => {
      toast.success("Logo uploaded successfully");
      utils.clients.get.invalidate({ id: clientId });
    },
    onError: (error) => {
      toast.error(error.message || "Failed to upload logo");
    },
  });

  const removeLogoMutation = trpc.clients.removeLogo.useMutation({
    onSuccess: () => {
      setPreviewUrl(null);
      setShowDeleteDialog(false);
      toast.success("Logo removed");
      utils.clients.get.invalidate({ id: clientId });
    },
    onError: (error) => {
      toast.error(error.message || "Failed to remove logo");
    },
  });

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Image must be less than 2MB");
      return;
    }

    setIsUploading(true);

    try {
      // Convert to base64
      const reader = new FileReader();

      reader.onload = async () => {
        try {
          const base64 = reader.result as string;
          const base64Data = base64.split(",")[1];

          // Upload to server using the correct endpoint
          const response = await fetch("/api/upload", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              // filename logic updated to be cleaner
              filename: `logo-${clientId}-${Date.now()}.${file.name.split(".").pop()}`,
              data: base64Data,
              contentType: file.type,
              folder: "branding" // Organized storage
            }),
          });

          if (!response.ok) {
            const errorText = await response.text().catch(() => "Unknown error");
            throw new Error(`Upload failed: ${response.status} ${response.statusText}`);
          }

          const { url } = await response.json();

          // Update client with logo URL
          await uploadLogoMutation.mutateAsync({ clientId, logoUrl: url });

          setPreviewUrl(url);
          // Success toast is handled by mutation onSuccess
        } catch (error: any) {
          console.error("Logo upload error:", error);
          toast.error(error.message || "Failed to upload logo");
        } finally {
          setIsUploading(false);
          // Reset input so same file can be selected again if needed
          if (fileInputRef.current) {
            fileInputRef.current.value = "";
          }
        }
      };

      reader.onerror = () => {
        toast.error("Failed to read file");
        setIsUploading(false);
      };

      reader.readAsDataURL(file);
    } catch (error) {
      toast.error("Failed to initiate upload");
      setIsUploading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Company Logo</CardTitle>
        <CardDescription>
          Upload your company logo to appear on exported policy documents
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-6">
          {/* Logo Preview */}
          <div className="relative">
            <div className="w-32 h-32 rounded-lg border-2 border-dashed border-muted-foreground/25 flex items-center justify-center bg-muted/50 overflow-hidden">
              {previewUrl ? (
                <img
                  src={previewUrl}
                  alt={`${clientName} logo`}
                  className="w-full h-full object-contain p-2"
                />
              ) : (
                <Building2 className="w-12 h-12 text-muted-foreground/50" />
              )}
            </div>
            {previewUrl && (
              <Button
                variant="destructive"
                size="icon"
                className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
                onClick={() => setShowDeleteDialog(true)}
                disabled={removeLogoMutation.isPending}
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>

          {/* Upload Controls */}
          <div className="flex-1 space-y-3">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />
            <Button
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="w-full"
            >
              {isUploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  {previewUrl ? "Replace Logo" : "Upload Logo"}
                </>
              )}
            </Button>
            <p className="text-xs text-muted-foreground">
              Recommended: Square image, PNG or JPG, max 2MB
            </p>
          </div>
        </div>
      </CardContent>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Logo?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove the company logo? This will affect all generated documents.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={() => removeLogoMutation.mutate({ clientId })}
              disabled={removeLogoMutation.isPending}
            >
              {removeLogoMutation.isPending ? "Removing..." : "Remove"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}

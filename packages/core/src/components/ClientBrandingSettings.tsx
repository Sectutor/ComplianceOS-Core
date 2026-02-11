
import { useState, useEffect } from "react";
import { Button } from "@complianceos/ui/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@complianceos/ui/ui/card";
import { Input } from "@complianceos/ui/ui/input";
import { Label } from "@complianceos/ui/ui/label";
import { trpc } from "@/lib/trpc";
import { Save, Loader2, Palette, LayoutTemplate } from "lucide-react";
import { toast } from "sonner";
import ClientLogoUpload from "@/components/ClientLogoUpload";

interface ClientBrandingSettingsProps {
    clientId: number;
    clientName: string;
    initialData: {
        logoUrl?: string | null;
        brandPrimaryColor?: string | null;
        brandSecondaryColor?: string | null;
        portalTitle?: string | null;
    };
    onUpdate?: () => void;
}

export default function ClientBrandingSettings({ clientId, clientName, initialData, onUpdate }: ClientBrandingSettingsProps) {
    const [brandPrimaryColor, setBrandPrimaryColor] = useState(initialData.brandPrimaryColor || "#2563eb"); // Default blue-600
    const [brandSecondaryColor, setBrandSecondaryColor] = useState(initialData.brandSecondaryColor || "#0f172a"); // Default slate-900
    const [portalTitle, setPortalTitle] = useState(initialData.portalTitle || clientName);
    const [hasChanges, setHasChanges] = useState(false);

    const utils = trpc.useUtils();

    // Check for changes
    useEffect(() => {
        const hasChanged =
            brandPrimaryColor !== (initialData.brandPrimaryColor || "#2563eb") ||
            brandSecondaryColor !== (initialData.brandSecondaryColor || "#0f172a") ||
            portalTitle !== (initialData.portalTitle || clientName);

        setHasChanges(hasChanged);
    }, [brandPrimaryColor, brandSecondaryColor, portalTitle, initialData, clientName]);

    const updateClientMutation = trpc.clients.update.useMutation({
        onSuccess: () => {
            toast.success("Branding settings saved successfully");
            utils.clients.get.invalidate({ id: clientId });
            if (onUpdate) onUpdate();
            setHasChanges(false);

            // Force reload to apply new branding if needed, or we can use a context later
            // window.location.reload(); 
        },
        onError: (error) => {
            toast.error(error.message || "Failed to save branding settings");
        },
    });

    const handleSave = () => {
        updateClientMutation.mutate({
            id: clientId,
            brandPrimaryColor,
            brandSecondaryColor,
            portalTitle,
        });
    };

    return (
        <div className="space-y-6">
            {/* Logo Section */}
            <ClientLogoUpload
                clientId={clientId}
                currentLogoUrl={initialData.logoUrl}
                clientName={clientName}
            />

            {/* Colors & Identity */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Palette className="h-5 w-5 text-indigo-500" />
                        Color Theme
                    </CardTitle>
                    <CardDescription>
                        Customize the look and feel of your client portal.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="grid gap-6 md:grid-cols-2">
                        {/* Primary Color */}
                        <div className="space-y-3">
                            <Label htmlFor="primaryColor">Primary Brand Color</Label>
                            <div className="flex items-center gap-3">
                                <div className="relative h-10 w-10 rounded-lg overflow-hidden border border-slate-200 shadow-sm cursor-pointer group">
                                    <input
                                        type="color"
                                        id="primaryColor"
                                        value={brandPrimaryColor}
                                        onChange={(e) => setBrandPrimaryColor(e.target.value)}
                                        className="absolute -top-2 -left-2 w-16 h-16 cursor-pointer p-0 border-0 bg-transparent"
                                    />
                                </div>
                                <div className="flex-1">
                                    <Input
                                        value={brandPrimaryColor}
                                        onChange={(e) => setBrandPrimaryColor(e.target.value)}
                                        placeholder="#000000"
                                        className="font-mono"
                                    />
                                </div>
                            </div>
                            <p className="text-xs text-muted-foreground">Used for buttons, links, and active states.</p>
                        </div>

                        {/* Secondary Color */}
                        <div className="space-y-3">
                            <Label htmlFor="secondaryColor">Secondary Brand Color</Label>
                            <div className="flex items-center gap-3">
                                <div className="relative h-10 w-10 rounded-lg overflow-hidden border border-slate-200 shadow-sm cursor-pointer group">
                                    <input
                                        type="color"
                                        id="secondaryColor"
                                        value={brandSecondaryColor}
                                        onChange={(e) => setBrandSecondaryColor(e.target.value)}
                                        className="absolute -top-2 -left-2 w-16 h-16 cursor-pointer p-0 border-0 bg-transparent"
                                    />
                                </div>
                                <div className="flex-1">
                                    <Input
                                        value={brandSecondaryColor}
                                        onChange={(e) => setBrandSecondaryColor(e.target.value)}
                                        placeholder="#000000"
                                        className="font-mono"
                                    />
                                </div>
                            </div>
                            <p className="text-xs text-muted-foreground">Used for navigation bars, sidebars, and headers.</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Portal Settings */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                        <LayoutTemplate className="h-5 w-5 text-blue-500" />
                        Portal Identity
                    </CardTitle>
                    <CardDescription>
                        Configure how the application appears in the browser.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="space-y-3">
                        <Label htmlFor="portalTitle">Portal Title</Label>
                        <Input
                            id="portalTitle"
                            value={portalTitle}
                            onChange={(e) => setPortalTitle(e.target.value)}
                            placeholder={`${clientName} Compliance Portal`}
                        />
                        <p className="text-xs text-muted-foreground">This title appears in the browser tab and search results.</p>
                    </div>

                    {/* Preview Box */}
                    <div className="mt-6 p-4 border border-slate-200 rounded-lg bg-slate-50/50">
                        <Label className="mb-3 block text-xs uppercase tracking-wider text-slate-500 font-semibold">Live Preview</Label>
                        <div className="flex flex-col gap-4">
                            {/* Browser Tab Preview */}
                            <div className="bg-[#dee1e6] p-2 rounded-t-lg w-full max-w-md mx-auto shadow-sm">
                                <div className="bg-white rounded-md py-1.5 px-3 flex items-center gap-2 text-xs text-slate-700 max-w-[200px] shadow-sm border border-slate-200">
                                    {initialData.logoUrl ? (
                                        <img src={initialData.logoUrl} className="w-3 h-3 object-contain" alt="" />
                                    ) : (
                                        <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                                    )}
                                    <span className="truncate">{portalTitle}</span>
                                </div>
                            </div>

                            {/* UI Preview */}
                            <div className="w-full max-w-md mx-auto bg-white rounded-lg shadow-md overflow-hidden border border-slate-200">
                                <div className="h-12 flex items-center px-4 justify-between" style={{ backgroundColor: brandSecondaryColor }}>
                                    <div className="flex items-center gap-2">
                                        <span className="text-white font-medium text-sm">{clientName}</span>
                                    </div>
                                    <div className="flex gap-2">
                                        <div className="w-2 h-2 rounded-full bg-white/20"></div>
                                        <div className="w-2 h-2 rounded-full bg-white/20"></div>
                                    </div>
                                </div>
                                <div className="p-4 space-y-3">
                                    <div className="h-2 w-2/3 bg-slate-100 rounded"></div>
                                    <div className="h-2 w-1/2 bg-slate-100 rounded"></div>
                                    <div className="mt-4">
                                        <button
                                            className="px-3 py-1.5 rounded text-xs font-medium text-white transition-opacity hover:opacity-90"
                                            style={{ backgroundColor: brandPrimaryColor }}
                                        >
                                            Primary Action
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end pt-4">
                        <Button
                            onClick={handleSave}
                            disabled={!hasChanges || updateClientMutation.isPending}
                        >
                            {updateClientMutation.isPending ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <Save className="mr-2 h-4 w-4" />
                                    Save Changes
                                </>
                            )}
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

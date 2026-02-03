
import { useState, useEffect } from "react";
import { Button } from "@complianceos/ui/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@complianceos/ui/ui/card";
import { Input } from "@complianceos/ui/ui/input";
import { Label } from "@complianceos/ui/ui/label";
import { Textarea } from "@complianceos/ui/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@complianceos/ui/ui/select";
import { trpc } from "@/lib/trpc";
import { Building2, Save, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface ClientGeneralSettingsProps {
    clientId: number;
    initialData: {
        name: string;
        description?: string | null;
        industry?: string | null;
        size?: string | null;
        cisoName?: string | null;
        dpoName?: string | null;
        headquarters?: string | null;
        mainServiceRegion?: string | null;
    };
}

export default function ClientGeneralSettings({ clientId, initialData }: ClientGeneralSettingsProps) {
    const [name, setName] = useState(initialData.name);
    const [description, setDescription] = useState(initialData.description || "");
    const [industry, setIndustry] = useState(initialData.industry || "");
    const [size, setSize] = useState(initialData.size || "");
    const [cisoName, setCisoName] = useState(initialData.cisoName || "");
    const [dpoName, setDpoName] = useState(initialData.dpoName || "");
    const [headquarters, setHeadquarters] = useState(initialData.headquarters || "");
    const [mainServiceRegion, setMainServiceRegion] = useState(initialData.mainServiceRegion || "");
    const [hasChanges, setHasChanges] = useState(false);

    const utils = trpc.useUtils();

    useEffect(() => {
        const changed =
            name !== initialData.name ||
            description !== (initialData.description || "") ||
            industry !== (initialData.industry || "") ||
            size !== (initialData.size || "") ||
            cisoName !== (initialData.cisoName || "") ||
            dpoName !== (initialData.dpoName || "") ||
            headquarters !== (initialData.headquarters || "") ||
            mainServiceRegion !== (initialData.mainServiceRegion || "");
        setHasChanges(changed);
    }, [name, description, industry, size, cisoName, dpoName, headquarters, mainServiceRegion, initialData]);

    const updateClientMutation = trpc.clients.update.useMutation({
        onSuccess: () => {
            toast.success("Client settings updated successfully");
            utils.clients.get.invalidate({ id: clientId });
            setHasChanges(false);
        },
        onError: (error) => {
            toast.error(error.message || "Failed to update client settings");
        },
    });

    const handleSave = () => {
        if (!name.trim()) {
            toast.error("Client name is required");
            return;
        }

        updateClientMutation.mutate({
            id: clientId,
            name,
            description,
            industry,
            size,
            cisoName,
            dpoName,
            headquarters,
            mainServiceRegion,
        });
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-lg">General Information</CardTitle>
                <CardDescription>
                    Basic information about the client organization
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                    {/* Company Name */}
                    <div className="space-y-2">
                        <Label htmlFor="clientName" className="flex items-center gap-2">
                            <Building2 className="h-4 w-4 text-muted-foreground" />
                            Company Name
                        </Label>
                        <Input
                            id="clientName"
                            placeholder="Acme Corp"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                        />
                    </div>

                    {/* Industry */}
                    <div className="space-y-2">
                        <Label htmlFor="industry">Industry</Label>
                        <Input
                            id="industry"
                            placeholder="Technology, Healthcare, etc."
                            value={industry}
                            onChange={(e) => setIndustry(e.target.value)}
                        />
                    </div>

                    {/* Company Size */}
                    <div className="space-y-2">
                        <Label htmlFor="size">Company Size</Label>
                        <Select value={size} onValueChange={setSize}>
                            <SelectTrigger id="size">
                                <SelectValue placeholder="Select size" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="1-10">1-10 employees</SelectItem>
                                <SelectItem value="11-50">11-50 employees</SelectItem>
                                <SelectItem value="51-200">51-200 employees</SelectItem>
                                <SelectItem value="201-500">201-500 employees</SelectItem>
                                <SelectItem value="500+">500+ employees</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                    {/* CISO Name */}
                    <div className="space-y-2">
                        <Label htmlFor="cisoName">CISO Name</Label>
                        <Input
                            id="cisoName"
                            placeholder="John Doe"
                            value={cisoName}
                            onChange={(e) => setCisoName(e.target.value)}
                        />
                    </div>
                    {/* DPO Name */}
                    <div className="space-y-2">
                        <Label htmlFor="dpoName">DPO Name (Data Protection Officer)</Label>
                        <Input
                            id="dpoName"
                            placeholder="Jane Smith"
                            value={dpoName}
                            onChange={(e) => setDpoName(e.target.value)}
                        />
                    </div>
                    {/* Headquarters */}
                    <div className="space-y-2">
                        <Label htmlFor="headquarters">Headquarters Location</Label>
                        <Input
                            id="headquarters"
                            placeholder="San Francisco, CA"
                            value={headquarters}
                            onChange={(e) => setHeadquarters(e.target.value)}
                        />
                    </div>
                    {/* Service Region */}
                    <div className="space-y-2">
                        <Label htmlFor="mainServiceRegion">Main Service Region</Label>
                        <Input
                            id="mainServiceRegion"
                            placeholder="USA, EU, Global"
                            value={mainServiceRegion}
                            onChange={(e) => setMainServiceRegion(e.target.value)}
                        />
                    </div>
                </div>

                {/* Description */}
                <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                        id="description"
                        placeholder="Brief description of the client..."
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        rows={3}
                    />
                </div>

                {/* Save Button */}
                <div className="flex justify-end pt-2">
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
    );
}

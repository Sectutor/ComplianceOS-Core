
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@complianceos/ui/ui/card";
import { Button } from "@complianceos/ui/ui/button";
import { Input } from "@complianceos/ui/ui/input";
import { Label } from "@complianceos/ui/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@complianceos/ui/ui/select";
import { Globe, Save, Loader2, Shield } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

const LANGUAGES = [
    { code: "en", name: "English", flag: "🇬🇧" },
    { code: "de", name: "German (Deutsch)", flag: "🇩🇪" },
    { code: "fr", name: "French (Français)", flag: "🇫🇷" },
    { code: "es", name: "Spanish (Español)", flag: "🇪🇸" },
    { code: "it", name: "Italian (Italiano)", flag: "🇮🇹" },
    { code: "pt", name: "Portuguese (Português)", flag: "🇵🇹" },
    { code: "nl", name: "Dutch (Nederlands)", flag: "🇳🇱" },
    { code: "pl", name: "Polish (Polski)", flag: "🇵🇱" },
    { code: "sv", name: "Swedish (Svenska)", flag: "🇸🇪" },
    { code: "da", name: "Danish (Dansk)", flag: "🇩🇰" },
    { code: "fi", name: "Finnish (Suomi)", flag: "🇫🇮" },
    { code: "no", name: "Norwegian (Norsk)", flag: "🇳🇴" },
    { code: "cs", name: "Czech (Čeština)", flag: "🇨🇿" },
    { code: "hu", name: "Hungarian (Magyar)", flag: "🇭🇺" },
    { code: "ro", name: "Romanian (Română)", flag: "🇷🇴" },
    { code: "bg", name: "Bulgarian (Български)", flag: "🇧🇬" },
    { code: "el", name: "Greek (Ελληνικά)", flag: "🇬🇷" },
    { code: "ja", name: "Japanese (日本語)", flag: "🇯🇵" },
    { code: "zh", name: "Chinese (中文)", flag: "🇨🇳" },
    { code: "ko", name: "Korean (한국어)", flag: "🇰🇷" },
    { code: "ar", name: "Arabic (العربية)", flag: "🇸🇦" },
    { code: "he", name: "Hebrew (עברית)", flag: "🇮🇱" },
    { code: "tr", name: "Turkish (Türkçe)", flag: "🇹🇷" },
    { code: "ru", name: "Russian (Русский)", flag: "🇷🇺" },
    { code: "uk", name: "Ukrainian (Українська)", flag: "🇺🇦" },
];

const DOCUMENT_CLASSIFICATIONS = [
    { value: "public", label: "Public" },
    { value: "internal", label: "Internal" },
    { value: "confidential", label: "Confidential" },
    { value: "restricted", label: "Restricted" },
];

const JURISDICTIONS = [
    { value: "EU", label: "European Union" },
    { value: "US", label: "United States" },
    { value: "UK", label: "United Kingdom" },
    { value: "CH", label: "Switzerland" },
    { value: "APAC", label: "Asia Pacific" },
    { value: "MENA", label: "Middle East & North Africa" },
    { value: "LATAM", label: "Latin America" },
];

interface PolicySettingsTabProps {
    clientId: number;
    client: any; // Using any for simplicity as schema import might be complex, but ideally inferred type
    onUpdate?: () => void;
}

export function PolicySettingsTab({ clientId, client, onUpdate }: PolicySettingsTabProps) {
    const [policyLanguage, setPolicyLanguage] = useState("en");
    const [legalEntityName, setLegalEntityName] = useState("");
    const [defaultClassification, setDefaultClassification] = useState("internal");
    const [selectedJurisdictions, setSelectedJurisdictions] = useState<string[]>([]);

    const updateMutation = trpc.clients.update.useMutation({
        onSuccess: () => {
            toast.success("Settings saved successfully");
            if (onUpdate) onUpdate();
        },
        onError: (err) => toast.error(err.message),
    });

    useEffect(() => {
        if (client) {
            setPolicyLanguage(client.policyLanguage || "en");
            setLegalEntityName(client.legalEntityName || client.name || "");
            setDefaultClassification(client.defaultDocumentClassification || "internal");
            try {
                const jurisdictions = client.regulatoryJurisdictions as string[] | null;
                setSelectedJurisdictions(jurisdictions || []);
            } catch {
                setSelectedJurisdictions([]);
            }
        }
    }, [client]);

    const handleSavePolicySettings = () => {
        updateMutation.mutate({
            id: clientId,
            policyLanguage,
            legalEntityName,
            defaultDocumentClassification: defaultClassification,
            regulatoryJurisdictions: selectedJurisdictions,
        });
    };

    const toggleJurisdiction = (value: string) => {
        setSelectedJurisdictions(prev =>
            prev.includes(value)
                ? prev.filter(j => j !== value)
                : [...prev, value]
        );
    };

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Globe className="h-5 w-5 text-primary" />
                        Policy Generation Preferences
                    </CardTitle>
                    <CardDescription>
                        Configure how policies are generated for this organization. These settings apply to all AI-generated policy content.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Language Selection */}
                    <div className="grid gap-3">
                        <Label className="flex items-center gap-2">
                            <Globe className="h-4 w-4" />
                            Policy Language
                        </Label>
                        <Select value={policyLanguage} onValueChange={setPolicyLanguage}>
                            <SelectTrigger className="w-full max-w-md">
                                <SelectValue placeholder="Select language" />
                            </SelectTrigger>
                            <SelectContent>
                                {LANGUAGES.map((lang) => (
                                    <SelectItem key={lang.code} value={lang.code}>
                                        <span className="flex items-center gap-2">
                                            <span>{lang.flag}</span>
                                            <span>{lang.name}</span>
                                        </span>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <p className="text-sm text-muted-foreground">
                            All AI-generated policy content will be written in this language.
                        </p>
                    </div>

                    {/* Legal Entity Name */}
                    <div className="grid gap-3">
                        <Label>Legal Entity Name</Label>
                        <Input
                            value={legalEntityName}
                            onChange={(e) => setLegalEntityName(e.target.value)}
                            placeholder="e.g. Acme Corporation Ltd."
                            className="max-w-md"
                        />
                        <p className="text-sm text-muted-foreground">
                            This name will appear in policy headers and official documents.
                        </p>
                    </div>

                    {/* Document Classification */}
                    <div className="grid gap-3">
                        <Label>Default Document Classification</Label>
                        <Select value={defaultClassification} onValueChange={setDefaultClassification}>
                            <SelectTrigger className="w-full max-w-md">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {DOCUMENT_CLASSIFICATIONS.map((cls) => (
                                    <SelectItem key={cls.value} value={cls.value}>
                                        {cls.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <p className="text-sm text-muted-foreground">
                            Default classification level for new policies.
                        </p>
                    </div>

                    <div className="flex justify-end pt-4">
                        <Button onClick={handleSavePolicySettings} disabled={updateMutation.isPending}>
                            {updateMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                            Save Policy Settings
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Regulatory Jurisdictions */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Shield className="h-5 w-5 text-primary" />
                        Regulatory Jurisdictions
                    </CardTitle>
                    <CardDescription>
                        Select the regions where your organization operates. Policies will be tailored to meet requirements in these jurisdictions.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-wrap gap-2">
                        {JURISDICTIONS.map((j) => (
                            <Button
                                key={j.value}
                                variant={selectedJurisdictions.includes(j.value) ? "default" : "outline"}
                                size="sm"
                                onClick={() => toggleJurisdiction(j.value)}
                                className="transition-all"
                            >
                                {j.label}
                            </Button>
                        ))}
                    </div>
                    {selectedJurisdictions.length > 0 && (
                        <p className="mt-4 text-sm text-muted-foreground">
                            Selected: {selectedJurisdictions.join(", ")}
                        </p>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

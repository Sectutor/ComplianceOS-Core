
import React, { useState, useEffect } from "react";
import { trpc } from "../../lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@complianceos/ui/ui/card";
import { Label } from "@complianceos/ui/ui/label";
import { Input } from "@complianceos/ui/ui/input";
import { Button } from "@complianceos/ui/ui/button";
import { Switch } from "@complianceos/ui/ui/switch";
import { AlertCircle, CheckCircle, Mail, RotateCw, Save } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@complianceos/ui/ui/alert";
import { toast } from "sonner"; // Changed from use-toast

interface SmtpSettingsProps {
    clientId: number;
}

export function SmtpSettings({ clientId }: SmtpSettingsProps) {
    // const { toast } = useToast(); // Removed hook
    const [isEnabled, setIsEnabled] = useState(true);
    const [host, setHost] = useState("");
    const [port, setPort] = useState(587);
    const [user, setUser] = useState("");
    const [pass, setPass] = useState("");
    const [fromName, setFromName] = useState("");
    const [fromEmail, setFromEmail] = useState("");
    const [testEmail, setTestEmail] = useState("");

    const utils = trpc.useContext();

    const { data: integration, isLoading } = trpc.integrations.get.useQuery({
        clientId,
        provider: 'smtp'
    });

    const updateMutation = trpc.integrations.update.useMutation({
        onSuccess: () => {
            toast.success("Settings Saved", { description: "SMTP configuration updated." });
            utils.integrations.get.invalidate({ clientId });
        },
        onError: (err) => {
            toast.error("Save Failed", { description: err.message });
        }
    });

    const testMutation = trpc.integrations.testConnection.useMutation({
        onSuccess: () => {
            toast.success("Success!", { description: "Test email sent successfully." });
        },
        onError: (err) => {
            toast.error("Test Failed", { description: err.message });
        }
    });

    useEffect(() => {
        if (integration) {
            if (integration.settings) {
                const s = integration.settings as any;
                setHost(s.host || "");
                setPort(Number(s.port) || 587);
                setUser(s.user || "");
                setPass(s.pass || "");
                setFromName(s.fromName || "");
                setFromEmail(s.fromEmail || "");
            }
            setIsEnabled(integration.isEnabled || false);
        }
    }, [integration]);

    const handleSave = () => {
        updateMutation.mutate({
            clientId,
            provider: 'smtp',
            isEnabled,
            settings: {
                host,
                port: Number(port),
                user,
                pass,
                fromName,
                fromEmail
            }
        });
    };

    const handleTest = () => {
        if (!testEmail) {
            toast.error("Email Required", { description: "Please enter a test recipient email." });
            return;
        }
        testMutation.mutate({
            clientId,
            email: testEmail,
            provider: 'smtp'
        });
    };

    if (isLoading) return <div className="p-4 flex justify-center"><RotateCw className="animate-spin text-gray-400" /></div>;

    return (
        <Card className="w-full border-l-4 border-l-indigo-500 shadow-sm">
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div className="space-y-1">
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Mail className="h-5 w-5 text-indigo-600" />
                            Custom SMTP Settings
                        </CardTitle>
                        <CardDescription>
                            Connect your own email provider to send emails from your domain.
                        </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                        <Label htmlFor="smtp-enable" className="text-sm font-medium text-gray-600">
                            {isEnabled ? "Enabled" : "Disabled"}
                        </Label>
                        <Switch id="smtp-enable" checked={isEnabled} onCheckedChange={setIsEnabled} />
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-6">
                {!isEnabled && (
                    <Alert className="bg-gray-50 text-gray-600 border-gray-200">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>System Default Active</AlertTitle>
                        <AlertDescription>
                            Emails are currently being sent via the default System Mailer. Enable this integration to override it.
                        </AlertDescription>
                    </Alert>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label>SMTP Host</Label>
                        <Input placeholder="smtp.gmail.com" value={host} onChange={e => setHost(e.target.value)} disabled={!isEnabled} />
                    </div>
                    <div className="space-y-2">
                        <Label>Port</Label>
                        <Input type="number" placeholder="587" value={port} onChange={e => setPort(Number(e.target.value))} disabled={!isEnabled} />
                    </div>
                    <div className="space-y-2">
                        <Label>Username</Label>
                        <Input placeholder="user@example.com" value={user} onChange={e => setUser(e.target.value)} disabled={!isEnabled} />
                    </div>
                    <div className="space-y-2">
                        <Label>Password</Label>
                        <Input type="password" placeholder="••••••••" value={pass} onChange={e => setPass(e.target.value)} disabled={!isEnabled} />
                        <p className="text-xs text-muted-foreground">Stored securely.</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
                    <div className="space-y-2">
                        <Label>Send As (Name)</Label>
                        <Input placeholder="Acme Compliance Team" value={fromName} onChange={e => setFromName(e.target.value)} disabled={!isEnabled} />
                    </div>
                    <div className="space-y-2">
                        <Label>Send As (Email)</Label>
                        <Input placeholder="compliance@acme.com" value={fromEmail} onChange={e => setFromEmail(e.target.value)} disabled={!isEnabled} />
                        <p className="text-xs text-muted-foreground">Must match your SMTP user or be allowed by your provider.</p>
                    </div>
                </div>

            </CardContent>
            <CardFooter className="bg-gray-50 flex justify-between items-center py-4 rounded-b-lg">
                <div className="flex gap-2 items-center w-full max-w-sm">
                    <Input
                        placeholder="test@example.com"
                        value={testEmail}
                        onChange={e => setTestEmail(e.target.value)}
                        className="h-9 bg-white"
                    />
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleTest}
                        disabled={!isEnabled || testMutation.isLoading}
                    >
                        {testMutation.isLoading ? <RotateCw className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle className="h-4 w-4 mr-2 text-green-600" />}
                        Test
                    </Button>
                </div>

                <Button onClick={handleSave} disabled={updateMutation.isLoading} className="bg-indigo-600 hover:bg-indigo-700 text-white">
                    {updateMutation.isLoading ? <RotateCw className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                    Save Configuration
                </Button>
            </CardFooter>
        </Card>
    );
}

import { useState } from "react";
import { EnhancedDialog } from "@complianceos/ui/ui/enhanced-dialog";
import { Button } from "@complianceos/ui/ui/button";
import { Input } from "@complianceos/ui/ui/input";
import { Textarea } from "@complianceos/ui/ui/textarea";
import { Label } from "@complianceos/ui/ui/label";
import { Badge } from "@complianceos/ui/ui/badge";
import { trpc } from "@/lib/trpc";
import { Mail, Send, Loader2, Copy, CheckCircle2, ExternalLink } from "lucide-react";
import { toast } from "sonner";

interface EmailQuestionsDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    assessmentId: number;
    selectedControlIds: number[];
    controls: Array<{ id: number; controlId: string; name: string }>;
}

export function EmailQuestionsDialog({
    open,
    onOpenChange,
    assessmentId,
    selectedControlIds,
    controls,
}: EmailQuestionsDialogProps) {
    const [email, setEmail] = useState("");
    const [name, setName] = useState("");
    const [message, setMessage] = useState("");
    const [responseUrl, setResponseUrl] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);

    const createMutation = trpc.gapQuestionnaire.create.useMutation();
    const sendMutation = trpc.gapQuestionnaire.sendEmail.useMutation();

    const selectedControls = controls.filter(c => selectedControlIds.includes(c.id));

    const handleSend = async () => {
        if (!email) {
            toast.error("Please enter a recipient email");
            return;
        }
        if (selectedControlIds.length === 0) {
            toast.error("Please select at least one control");
            return;
        }

        try {
            // Create the request
            const response = await createMutation.mutateAsync({
                assessmentId,
                recipientEmail: email,
                recipientName: name || undefined,
                controlIds: selectedControlIds,
                message: message || undefined,
            });

            // Send the email
            await sendMutation.mutateAsync({
                email: email,
                link: response.link,
                message: message || undefined
            });

            setResponseUrl(response.link);
            toast.success(`Questionnaire created! Share the link with ${email}`);
        } catch (error: any) {
            toast.error(error.message);
        }
    };

    const handleCopy = () => {
        if (responseUrl) {
            navigator.clipboard.writeText(window.location.origin + responseUrl);
            setCopied(true);
            toast.success("Link copied to clipboard!");
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const handleReset = () => {
        setEmail("");
        setName("");
        setMessage("");
        setResponseUrl(null);
        setCopied(false);
    };

    return (
        <EnhancedDialog
            open={open}
            onOpenChange={(open) => {
                if (!open) handleReset();
                onOpenChange(open);
            }}
            title={responseUrl ? "Questionnaire Ready!" : "Email Questions"}
            description={
                responseUrl
                    ? "Share this link with the recipient"
                    : `Send ${selectedControlIds.length} question(s) to a stakeholder for input`
            }
            size="lg"
        >
            {responseUrl ? (
                <div className="space-y-4 py-4">
                    <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg border border-green-200">
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                        <span className="text-green-700 font-medium">Questionnaire created successfully!</span>
                    </div>

                    <div className="space-y-2">
                        <Label>Response Link</Label>
                        <div className="flex gap-2">
                            <Input
                                value={window.location.origin + responseUrl}
                                readOnly
                                className="font-mono text-sm"
                            />
                            <Button variant="outline" onClick={handleCopy}>
                                {copied ? <CheckCircle2 className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                            </Button>
                            <Button variant="outline" asChild>
                                <a href={responseUrl} target="_blank" rel="noopener noreferrer">
                                    <ExternalLink className="h-4 w-4" />
                                </a>
                            </Button>
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Send this link to {email}. The link expires in 7 days.
                        </p>
                    </div>

                    <div className="flex justify-end gap-2 pt-4">
                        <Button variant="outline" onClick={handleReset}>
                            Send Another
                        </Button>
                        <Button onClick={() => onOpenChange(false)}>
                            Done
                        </Button>
                    </div>
                </div>
            ) : (
                <div className="space-y-4 py-4">
                    {/* Selected Controls Preview */}
                    <div className="space-y-2">
                        <Label>Controls to Include ({selectedControls.length})</Label>
                        <div className="max-h-32 overflow-y-auto border rounded-md p-2 space-y-1">
                            {selectedControls.length === 0 ? (
                                <p className="text-sm text-muted-foreground">No controls selected</p>
                            ) : (
                                selectedControls.map(c => (
                                    <div key={c.id} className="flex items-center gap-2 text-sm">
                                        <Badge variant="outline" className="font-mono text-xs">{c.controlId}</Badge>
                                        <span className="truncate">{c.name}</span>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Recipient Info */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="email">Recipient Email *</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="stakeholder@company.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="name">Recipient Name</Label>
                            <Input
                                id="name"
                                placeholder="John Doe"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Message */}
                    <div className="space-y-2">
                        <Label htmlFor="message">Custom Message (Optional)</Label>
                        <Textarea
                            id="message"
                            placeholder="Hi, please provide your input on these controls for our compliance assessment..."
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            className="min-h-[80px]"
                        />
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end gap-2 pt-4">
                        <Button variant="outline" onClick={() => onOpenChange(false)}>
                            Cancel
                        </Button>
                        <Button
                            onClick={handleSend}
                            disabled={createMutation.isPending || sendMutation.isPending}
                            className="gap-2"
                        >
                            {(createMutation.isPending || sendMutation.isPending) ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <Send className="h-4 w-4" />
                            )}
                            Create & Get Link
                        </Button>
                    </div>
                </div>
            )}
        </EnhancedDialog>
    );
}

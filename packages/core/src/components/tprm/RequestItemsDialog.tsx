import React, { useState } from "react";
import { 
    X, Plus, Mail, Copy, Eye, Shield, FileText, 
    Check, ChevronDown, Search, Info
} from "lucide-react";
import { 
    Dialog, DialogContent, DialogHeader, 
    DialogTitle, DialogDescription 
} from "@complianceos/ui/ui/dialog";
import { Button } from "@complianceos/ui/ui/button";
import { Input } from "@complianceos/ui/ui/input";
import { Label } from "@complianceos/ui/ui/label";
import { Badge } from "@complianceos/ui/ui/badge";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { 
    DropdownMenu, DropdownMenuContent, 
    DropdownMenuItem, DropdownMenuTrigger 
} from "@complianceos/ui/ui/dropdown-menu";

interface RequestItemsDialogProps {
    isOpen: boolean;
    onClose: () => void;
    vendorName: string;
    onSend: (data: any) => void;
    templates: any[];
}

export function RequestItemsDialog({ isOpen, onClose, vendorName, onSend, templates = [] }: RequestItemsDialogProps) {
    const [selectedItems, setSelectedItems] = useState<any[]>([
        { type: 'document', name: 'SOC 2 Report' },
        { type: 'document', name: 'Penetration Test Report' }
    ]);
    const [recipientEmail, setRecipientEmail] = useState("");
    
    // Standard suggestions
    const suggestions = [
        { type: 'document', name: 'ISO 27001 Certificate' },
        { type: 'document', name: 'Privacy Policy' },
        { type: 'document', name: 'Business Continuity Plan' },
        { type: 'document', name: 'Data Processing Agreement (DPA)' }
    ];

    const removeItem = (index: number) => {
        setSelectedItems(selectedItems.filter((_, i) => i !== index));
    };

    const addItem = (item: any) => {
        if (selectedItems.find(i => i.name === item.name)) return;
        setSelectedItems([...selectedItems, item]);
    };

    const handleSend = () => {
        if (!recipientEmail) return toast.error("Recipient email is required");
        if (selectedItems.length === 0) return toast.error("Please select at least one item to request");
        
        onSend({
            recipientEmail,
            items: selectedItems
        });
    };

    const copyLink = () => {
        navigator.clipboard.writeText(`https://app.grcompliance.com/portal/request/mock-token`);
        toast.success("Link copied to clipboard");
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-2xl w-[95vw] p-0 overflow-hidden rounded-2xl border-none shadow-2xl">
                <div className="bg-gradient-to-br from-slate-900 to-indigo-950 p-8 text-white text-left relative">
                    <DialogHeader className="text-left pr-8">
                        <DialogTitle className="text-2xl font-bold flex items-center gap-3 text-white flex-wrap">
                            <Shield className="w-7 h-7 text-indigo-400 shrink-0" />
                            <span>Request documents from {vendorName}</span>
                        </DialogTitle>
                        <DialogDescription className="text-slate-300 text-sm mt-2 leading-relaxed max-w-lg">
                            Create a secure portal for your vendor to upload compliance evidence and fill questionnaires.
                        </DialogDescription>
                    </DialogHeader>
                </div>

                <div className="p-8 space-y-8 bg-white text-left">
                    {/* Items Section */}
                    <div className="space-y-3">
                        <Label className="text-sm font-semibold text-slate-700">Specify the required documents</Label>
                        <div className="min-h-[100px] p-2 border-2 border-slate-100 rounded-xl focus-within:border-indigo-500 transition-all bg-slate-50/50 flex flex-wrap gap-2 items-start content-start">
                            {selectedItems.map((item, index) => (
                                <Badge 
                                    key={index}
                                    variant="secondary"
                                    className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 shadow-sm text-slate-700 font-medium flex items-center gap-2"
                                >
                                    {item.type === 'questionnaire' ? <FileText className="w-3 h-3 text-indigo-500" /> : <Shield className="w-3 h-3 text-emerald-500" />}
                                    {item.name}
                                    <button onClick={() => removeItem(index)} className="hover:text-red-500 transition-colors ml-1">
                                        <X className="w-3 h-3" />
                                    </button>
                                </Badge>
                            ))}
                            
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="sm" className="h-9 px-3 rounded-lg border border-dashed border-slate-300 text-slate-500 hover:border-slate-400">
                                        <Plus className="w-4 h-4 mr-2" />
                                        Add item
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="start" className="w-64 p-2 rounded-xl shadow-xl">
                                    <div className="px-2 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Questionnaires</div>
                                    {templates.map(t => (
                                        <DropdownMenuItem key={t.id} onClick={() => addItem({ type: 'questionnaire', id: t.id, name: t.name })} className="rounded-lg cursor-pointer">
                                            <FileText className="w-4 h-4 mr-3 text-indigo-500" />
                                            {t.name}
                                        </DropdownMenuItem>
                                    ))}
                                    <div className="px-2 py-1 mt-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Common Documents</div>
                                    {suggestions.map(s => (
                                        <DropdownMenuItem key={s.name} onClick={() => addItem(s)} className="rounded-lg cursor-pointer">
                                            <Shield className="w-4 h-4 mr-3 text-emerald-500" />
                                            {s.name}
                                        </DropdownMenuItem>
                                    ))}
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                        <p className="text-[11px] text-slate-400 italic">
                            Items are auto-populated based on your default vendor requirements.
                        </p>
                    </div>

                    {/* Sharing Section */}
                    <div className="space-y-6">
                        <div className="space-y-3">
                            <Label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                                <Mail className="w-4 h-4 text-slate-400" />
                                Send email invite
                            </Label>
                            <Input 
                                placeholder="vendor-contact@example.com"
                                value={recipientEmail}
                                onChange={(e) => setRecipientEmail(e.target.value)}
                                className="rounded-xl border-slate-200 h-12 focus:ring-4 focus:ring-indigo-100"
                            />
                        </div>

                        <div className="space-y-3">
                            <Label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                                <Copy className="w-4 h-4 text-slate-400" />
                                Or, copy the link below
                            </Label>
                            <div className="flex flex-col sm:flex-row gap-2">
                                <div className="flex-1 bg-slate-50 px-4 py-3 rounded-xl border border-slate-200 text-slate-500 text-xs truncate leading-6 font-mono min-w-0">
                                    https://app.grcompliance.com/portal/request/secure_link_here
                                </div>
                                <Button variant="outline" size="sm" onClick={copyLink} className="h-12 px-6 rounded-xl border-slate-200 hover:bg-slate-50 shrink-0">
                                    <Copy className="w-4 h-4 mr-2" />
                                    Copy Link
                                </Button>
                            </div>
                            <div className="flex items-start gap-2 text-[11px] text-amber-600 bg-amber-50 p-3 rounded-lg border border-amber-100">
                                <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                                <span>Anyone with the link can upload files and complete assessments.</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="p-6 bg-slate-50 flex flex-col sm:flex-row items-center justify-between border-t border-slate-100 gap-4">
                    <Button variant="ghost" className="text-slate-600 hover:bg-slate-200 rounded-xl w-full sm:w-auto justify-start sm:justify-center">
                        <Eye className="w-4 h-4 mr-2" />
                        Send me a preview
                    </Button>
                    <div className="flex gap-3 w-full sm:w-auto">
                        <Button variant="ghost" onClick={onClose} className="rounded-xl px-6 flex-1 sm:flex-none">Cancel</Button>
                        <Button 
                            onClick={handleSend}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl px-8 py-5 h-auto font-semibold shadow-lg shadow-indigo-200 transition-all hover:translate-y-[-1px] flex-1 sm:flex-none"
                        >
                            Send email
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}

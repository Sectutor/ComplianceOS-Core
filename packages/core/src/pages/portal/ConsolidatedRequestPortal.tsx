import React, { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useParams } from "wouter";
import { 
    CheckCircle, AlertCircle, Shield, FileText, 
    Upload, Download, ExternalLink, Lock, Clock, Check
} from "lucide-react";
import { Button } from "@complianceos/ui/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@complianceos/ui/ui/card";
import { Badge } from "@complianceos/ui/ui/badge";
import { toast } from "sonner";
import { Progress } from "@complianceos/ui/ui/progress";
import { cn } from "@/lib/utils";

export default function ConsolidatedRequestPortal() {
    const { token } = useParams<{ token: string }>();
    const utils = trpc.useContext();

    const { data, isLoading, error } = trpc.vendorAssessments.getConsolidatedRequest.useQuery(
        { token: token || "" },
        { enabled: !!token, retry: false }
    );

    const uploadMutation = trpc.vendorAssessments.submitConsolidatedDocument.useMutation({
        onSuccess: () => {
            toast.success("Document uploaded successfully");
            utils.vendorAssessments.getConsolidatedRequest.invalidate({ token });
        },
        onError: (err) => toast.error("Upload failed: " + err.message)
    });

    if (isLoading) return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 gap-4">
            <Shield className="w-12 h-12 text-indigo-600 animate-pulse" />
            <p className="text-slate-500 font-medium animate-pulse">Loading secure portal...</p>
        </div>
    );

    if (error || !data) return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
            <Card className="max-w-md w-full border-red-100 shadow-xl">
                <CardContent className="pt-8 text-center space-y-4">
                    <div className="mx-auto w-16 h-16 bg-red-50 rounded-full flex items-center justify-center">
                        <AlertCircle className="w-8 h-8 text-red-500" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-slate-900">Access Denied</h2>
                        <p className="text-slate-500 mt-1">This link is invalid, expired, or has already been used.</p>
                    </div>
                    <Button variant="outline" className="w-full" onClick={() => window.location.reload()}>Retry</Button>
                </CardContent>
            </Card>
        </div>
    );

    const { request, vendorName } = data;
    const completedCount = request.items.filter((i: any) => i.status === 'completed').length;
    const progress = (completedCount / request.items.length) * 100;

    const handleFileUpload = (itemName: string) => {
        // Mock file upload for demo - in production this would use Supabase Storage
        const mockUrl = `https://storage.grcompliance.com/files/${Math.random().toString(36).substring(7)}.pdf`;
        uploadMutation.mutate({
            token: token!,
            itemName,
            fileUrl: mockUrl
        });
    };

    return (
        <div className="min-h-screen bg-slate-50/50 selection:bg-indigo-100 selection:text-indigo-900">
            {/* Header */}
            <header className="bg-white border-b border-slate-200 sticky top-0 z-10 backdrop-blur-md bg-white/80">
                <div className="max-w-5xl mx-auto px-6 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-200">
                            <Shield className="text-white w-6 h-6" />
                        </div>
                        <div>
                            <span className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-600">ComplianceOS</span>
                            <span className="ml-2 px-2 py-0.5 bg-slate-100 text-slate-500 text-[10px] uppercase font-bold tracking-widest rounded-md">Secure Portal</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="text-right hidden sm:block">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Recipient</p>
                            <p className="text-sm font-semibold text-slate-700">{request.recipientEmail}</p>
                        </div>
                        <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center">
                            <Lock className="w-4 h-4 text-slate-400" />
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-5xl mx-auto px-6 py-12">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column: Context */}
                    <div className="lg:col-span-1 space-y-6">
                        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4 text-left">
                            <div>
                                <h1 className="text-2xl font-bold text-slate-900">Data Request</h1>
                                <p className="text-slate-500 mt-1">From the compliance team at Your Organization</p>
                            </div>
                            
                            <div className="pt-4 border-t border-slate-100 space-y-4">
                                <div className="flex items-center gap-3 text-sm text-slate-600">
                                    <Clock className="w-4 h-4 text-indigo-500" />
                                    <span>Due: {request.expiresAt ? new Date(request.expiresAt).toLocaleDateString() : 'No deadline'}</span>
                                </div>
                                <div className="flex items-center gap-3 text-sm text-slate-600">
                                    <Shield className="w-4 h-4 text-indigo-500" />
                                    <span>Vendor: {vendorName}</span>
                                </div>
                            </div>

                            {request.message && (
                                <div className="mt-4 p-4 bg-indigo-50 rounded-xl border border-indigo-100 italic text-sm text-indigo-700 leading-relaxed">
                                    "{request.message}"
                                </div>
                            )}
                        </div>

                        <Card className="rounded-2xl border-indigo-100 bg-gradient-to-br from-white to-indigo-50/30 overflow-hidden text-left">
                            <CardHeader className="p-6 pb-2">
                                <CardTitle className="text-sm font-bold uppercase tracking-wider text-slate-400">Total Completion</CardTitle>
                            </CardHeader>
                            <CardContent className="p-6 pt-0 space-y-4">
                                <div className="flex items-end justify-between">
                                    <span className="text-4xl font-extrabold text-indigo-600">{Math.round(progress)}%</span>
                                    <span className="text-sm font-semibold text-slate-500 mb-1">{completedCount} of {request.items.length} items</span>
                                </div>
                                <Progress value={progress} className="h-3 bg-indigo-100 rounded-full overflow-hidden" />
                            </CardContent>
                        </Card>
                    </div>

                    {/* Right Column: Items Checklist */}
                    <div className="lg:col-span-2 space-y-4 text-left">
                        <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-4 px-2">
                            <CheckCircle className="w-5 h-5 text-emerald-500" />
                            Required Items ({request.items.length})
                        </h2>

                        {request.items.map((item: any, idx: number) => (
                            <div 
                                key={idx}
                                className={cn(
                                    "group relative bg-white p-6 rounded-2xl border transition-all duration-300 hover:shadow-lg hover:shadow-slate-200/50",
                                    item.status === 'completed' ? "border-emerald-100 bg-emerald-50/10" : "border-slate-200"
                                )}
                            >
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex gap-4">
                                        <div className={cn(
                                            "w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-110",
                                            item.status === 'completed' ? "bg-emerald-100" : "bg-slate-100"
                                        )}>
                                            {item.type === 'questionnaire' ? (
                                                <FileText className={cn("w-6 h-6", item.status === 'completed' ? "text-emerald-600" : "text-slate-500")} />
                                            ) : (
                                                <Upload className={cn("w-6 h-6", item.status === 'completed' ? "text-emerald-600" : "text-slate-500")} />
                                            )}
                                        </div>
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2">
                                                <h3 className="font-bold text-slate-900">{item.name}</h3>
                                                {item.status === 'completed' && <Badge className="bg-emerald-500 text-white border-none text-[10px]">Submitted</Badge>}
                                            </div>
                                            <p className="text-sm text-slate-500">
                                                {item.type === 'questionnaire' 
                                                    ? "Complete the online security assessment form." 
                                                    : "Upload a PDF or document version of this evidence."}
                                            </p>
                                        </div>
                                    </div>

                                    {item.status === 'completed' ? (
                                        <div className="bg-emerald-100 text-emerald-600 p-2 rounded-full">
                                            <Check className="w-5 h-5" />
                                        </div>
                                    ) : (
                                        item.type === 'questionnaire' ? (
                                            <Button 
                                                onClick={() => window.open(`/portal/assessment/${item.token || ''}`, '_blank')}
                                                className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-lg shadow-indigo-100"
                                            >
                                                Start <ExternalLink className="w-4 h-4 ml-2" />
                                            </Button>
                                        ) : (
                                            <Button 
                                                variant="outline"
                                                onClick={() => handleFileUpload(item.name)}
                                                className="rounded-xl border-slate-200 hover:border-indigo-500 hover:bg-indigo-50 hover:text-indigo-600"
                                            >
                                                Upload <Upload className="w-4 h-4 ml-2" />
                                            </Button>
                                        )
                                    )}
                                </div>
                                {item.fileUrl && (
                                    <div className="mt-4 flex items-center gap-2 text-xs text-slate-400 bg-slate-50 p-2 rounded-lg">
                                        <FileText className="w-3 h-3" />
                                        Uploaded: {item.fileUrl.split('/').pop()}
                                    </div>
                                )}
                            </div>
                        ))}

                        {progress === 100 && (
                            <div className="mt-8 p-12 bg-white rounded-3xl border-2 border-dashed border-emerald-200 flex flex-col items-center justify-center text-center space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
                                <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center">
                                    <CheckCircle className="w-10 h-10 text-emerald-600" />
                                </div>
                                <div className="max-w-xs">
                                    <h3 className="text-xl font-bold text-slate-900">All Done!</h3>
                                    <p className="text-slate-500 mt-2 text-sm leading-relaxed">
                                        Thank you for providing the requested information. The compliance team has been notified.
                                    </p>
                                </div>
                                <Button className="bg-slate-900 text-white rounded-xl px-8" onClick={() => window.close()}>Close Portal</Button>
                            </div>
                        )}
                    </div>
                </div>
            </main>

            <footer className="mt-20 border-t border-slate-200 pt-8 pb-12 text-center text-slate-400 text-xs">
                &copy; {new Date().getFullYear()} ComplianceOS Security. All rights reserved. <br/>
                Secure end-to-end encryption active.
            </footer>
        </div>
    );
}


import React from 'react';
import { format } from 'date-fns';
import { Trash2, Reply, CornerUpRight, ArrowLeft, Archive, Inbox, AlertTriangle } from 'lucide-react';
import { Button } from "@complianceos/ui/ui/button";
import { trpc } from '../../lib/trpc';
import DOMPurify from 'dompurify';

interface EmailViewProps {
    emailId: number;
    clientId: number;
    onBack: () => void;
    onDelete: () => void;
}

export function EmailView({ emailId, clientId, onBack, onDelete }: EmailViewProps) {
    const { data: email, isLoading } = trpc.email.get.useQuery({ clientId, id: emailId });

    // Mutations
    const moveMutation = trpc.email.move.useMutation({ onSuccess: onDelete });
    const permanentDeleteMutation = trpc.email.permanentDelete.useMutation({ onSuccess: onDelete });
    const restoreMutation = trpc.email.restore.useMutation({ onSuccess: onDelete });

    if (isLoading) return <div className="h-full flex items-center justify-center text-gray-400">Loading...</div>;
    if (!email) return <div className="h-full flex items-center justify-center text-gray-500">Select an email to read</div>;

    const handleArchive = () => moveMutation.mutate({ clientId, id: emailId, folder: 'archive' });
    const handleMoveToInbox = () => moveMutation.mutate({ clientId, id: emailId, folder: 'inbox' });
    const handleTrash = () => moveMutation.mutate({ clientId, id: emailId, folder: 'trash' });
    const handlePermanentDelete = () => {
        if (confirm("Are you sure you want to permanently delete this email? This cannot be undone.")) {
            permanentDeleteMutation.mutate({ clientId, id: emailId });
        }
    };

    return (
        <div className="flex flex-col h-full w-full bg-[#f5f5f7]">
            {/* Header Toolbar */}
            <div className="px-6 py-3 border-b border-gray-200/50 flex justify-between items-center bg-[#f5f5f7] sticky top-0 z-10 backdrop-blur-sm">
                <div className="flex items-center gap-3">
                    <Button variant="ghost" size="icon" className="md:hidden" onClick={onBack}>
                        <ArrowLeft size={18} />
                    </Button>
                    <div className="flex gap-2">
                        {email.folder === 'trash' ? (
                            <>
                                <Button variant="outline" size="sm" onClick={() => restoreMutation.mutate({ clientId, id: emailId })} className="gap-2">
                                    <Inbox size={16} /> Restore
                                </Button>
                                <Button variant="ghost" size="sm" onClick={handlePermanentDelete} className="gap-2 text-red-600 hover:bg-red-50 hover:text-red-700">
                                    <Trash2 size={16} /> Delete Forever
                                </Button>
                            </>
                        ) : email.folder === 'archive' ? (
                            <>
                                <Button variant="outline" size="sm" onClick={handleMoveToInbox} className="gap-2">
                                    <Inbox size={16} /> Move to Inbox
                                </Button>
                                <Button variant="ghost" size="icon" title="Trash" onClick={handleTrash} className="hover:bg-white/60 hover:text-red-600">
                                    <Trash2 size={18} />
                                </Button>
                            </>
                        ) : (
                            // Inbox, Sent, Drafts
                            <>
                                <Button variant="ghost" size="sm" className="gap-2 hover:bg-white/60">
                                    <Reply size={16} /> Reply
                                </Button>
                                <Button variant="ghost" size="icon" title="Archive" onClick={handleArchive} className="hover:bg-white/60">
                                    <Archive size={18} />
                                </Button>
                                <Button variant="ghost" size="icon" title="Delete" onClick={handleTrash} className="hover:bg-white/60 hover:text-red-600">
                                    <Trash2 size={18} />
                                </Button>
                            </>
                        )}
                    </div>
                </div>
                <div className="text-sm text-gray-500 font-medium">
                    {email.createdAt ? format(new Date(email.createdAt), "MMM d, h:mm a") : ''}
                </div>
            </div>

            {/* Scrollable Content Area */}
            <div className="flex-1 overflow-y-auto p-4 md:p-8 flex justify-center">

                {/* The "Letter" Card */}
                <div className="w-full max-w-4xl bg-white rounded-xl shadow-sm border border-gray-100 min-h-[500px] flex flex-col relative overflow-hidden">

                    {/* Top Stripe (optional visual flair) */}
                    <div className="h-1 bg-gradient-to-r from-blue-500 to-indigo-500 w-full" />

                    <div className="p-8 md:p-10">
                        {/* Subject */}
                        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8 leading-tight tracking-tight">
                            {email.subject}
                        </h1>

                        {/* Sender/Recipient Metadata */}
                        <div className="flex items-center gap-4 mb-10">
                            <div className="w-12 h-12 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-lg shadow-sm">
                                {(email.from || '?')[0].toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-baseline justify-between">
                                    <div className="font-semibold text-gray-900 text-lg">
                                        {email.from}
                                    </div>
                                </div>
                                <div className="text-sm text-gray-500 truncate">
                                    To: <span className="text-gray-700">{(email.to as string[] || []).join(', ')}</span>
                                </div>
                            </div>
                        </div>

                        {/* Divider */}
                        <div className="h-px bg-gray-100 w-full mb-10" />

                        {/* Email Body */}
                        <div
                            className="prose prose-gray max-w-none text-gray-800 leading-relaxed"
                            dangerouslySetInnerHTML={{ __html: email.body || '' }}
                        />
                    </div>

                    {/* Bottom fade/padding */}
                    <div className="mt-auto p-8 text-center">
                        <div className="inline-flex items-center gap-2 text-xs text-gray-400 bg-gray-50 px-3 py-1 rounded-full">
                            <CornerUpRight size={12} />
                            End of message
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

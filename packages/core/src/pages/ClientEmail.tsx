
import React, { useState } from 'react';
import { useRoute } from 'wouter';
import { EmailLayout } from '../components/email/EmailLayout';
import { EmailList } from '../components/email/EmailList';
import { EmailView } from '../components/email/EmailView';
import { ComposeDialog } from '../components/email/ComposeDialog';
import { useQuery } from '@tanstack/react-query';
import { trpc } from '../lib/trpc';
import DashboardLayout from '../components/DashboardLayout';

export function ClientEmail({ clientId: propClientId }: { clientId?: number }) {
    const [match, params] = useRoute("/clients/:id/communication");
    const clientId = propClientId || parseInt(params?.id || "0");

    const [currentFolder, setCurrentFolder] = useState<'inbox' | 'sent' | 'drafts' | 'archive' | 'trash'>('inbox');
    const [selectedEmailId, setSelectedEmailId] = useState<number | null>(null);
    const [isComposeOpen, setIsComposeOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");

    const { data: emails, refetch } = trpc.email.list.useQuery({
        clientId,
        folder: currentFolder,
        search: searchQuery
    });

    const moveMutation = trpc.email.move.useMutation({
        onSuccess: () => {
            refetch();
            // Don't deselect if we moved it, unless it moved out of current view? 
            // Usually safe to deselect or keep. If it disappears from list, selection might break.
            // Let's deselect for safety if it's the selected one.
        }
    });

    const handleDropEmail = (emailId: string, targetFolder: string) => {
        // Optimistic UI could be nice, but simple mutation is fine for now
        moveMutation.mutate({
            clientId,
            id: parseInt(emailId),
            folder: targetFolder as any
        });

        // If we moved the selected email out of view, deselect it
        if (selectedEmailId && selectedEmailId.toString() === emailId && targetFolder !== currentFolder) {
            setSelectedEmailId(null);
        }
    };

    return (
        <DashboardLayout>
            <div className="h-[calc(100vh-4rem)] flex flex-col relative">
                {/* Debug Indicator - Remove after verification */}
                {/* <div className="absolute top-0 right-0 bg-red-500 text-white text-xs p-1 z-50">Debug: Client {clientId}</div> */}

                <div className="flex-1 overflow-hidden">
                    <EmailLayout
                        currentFolder={currentFolder}
                        categories={[
                            { id: 'inbox', label: 'Inbox', icon: 'inbox' },
                            { id: 'sent', label: 'Sent', icon: 'send' },
                            { id: 'drafts', label: 'Drafts', icon: 'file' },
                            { id: 'archive', label: 'Archive', icon: 'archive' },
                            { id: 'trash', label: 'Trash', icon: 'trash' },
                        ]}
                        onFolderChange={(folder: any) => {
                            setCurrentFolder(folder);
                            setSelectedEmailId(null);
                        }}
                        onCompose={() => setIsComposeOpen(true)}
                        onDropEmail={handleDropEmail}
                    >
                        <div className="flex h-full">
                            {/* Email List - Width 350px or 40% */}
                            <div className={`${selectedEmailId ? 'hidden md:block w-80 lg:w-96' : 'w-full'} flex-shrink-0 border-r border-gray-200 h-full bg-white`}>
                                <EmailList
                                    emails={emails || []}
                                    selectedId={selectedEmailId}
                                    onSelect={setSelectedEmailId}
                                    onSearch={setSearchQuery}
                                />
                            </div>

                            {/* Email View - Rest logic */}
                            <div className={`${!selectedEmailId ? 'hidden md:flex items-center justify-center' : 'flex'} flex-1 h-full bg-white`}>
                                {selectedEmailId ? (
                                    <EmailView
                                        emailId={selectedEmailId}
                                        clientId={clientId}
                                        onBack={() => setSelectedEmailId(null)}
                                        onDelete={() => {
                                            refetch();
                                            setSelectedEmailId(null);
                                        }}
                                    />
                                ) : (
                                    <div className="text-gray-400 text-center">
                                        <span className="block text-4xl mb-4">✉️</span>
                                        <p>Select an email to read</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </EmailLayout>
                </div>

                {isComposeOpen && (
                    <ComposeDialog
                        clientId={clientId}
                        isOpen={isComposeOpen}
                        onClose={() => {
                            setIsComposeOpen(false);
                            refetch();
                        }}
                    />
                )}
            </div>
        </DashboardLayout>
    );
}

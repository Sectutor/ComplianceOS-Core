
import React from 'react';
import { Button } from "@complianceos/ui/ui/button";
import {
    Inbox,
    Send,
    FileText,
    Archive,
    Trash2,
    Plus,
    Mail,
    Star
} from 'lucide-react';
import { cn } from '../../lib/utils';

interface Category {
    id: string;
    label: string;
    icon: string;
}

interface EmailLayoutProps {
    currentFolder: string;
    categories: Category[];
    onFolderChange: (folder: string) => void;
    onCompose: () => void;
    children: React.ReactNode;
    onDropEmail?: (emailId: string, folderId: string) => void;
}

const IconMap: Record<string, any> = {
    inbox: Inbox,
    send: Send,
    file: FileText,
    archive: Archive,
    trash: Trash2
};

export function EmailLayout({ currentFolder, categories, onFolderChange, onCompose, children, onDropEmail }: EmailLayoutProps) {
    const [dragOverFolder, setDragOverFolder] = React.useState<string | null>(null);

    return (
        <div className="flex h-full bg-[#f5f5f7]"> {/* macOS-like background */}
            {/* Sidebar - Fixed width 240px */}
            <div className="w-60 flex-shrink-0 bg-[#f5f5f7] flex flex-col h-full pt-3">
                <div className="px-4 mb-6">
                    <Button
                        onClick={onCompose}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white gap-2 shadow-sm rounded-lg"
                    >
                        <Plus size={18} />
                        New Email
                    </Button>
                </div>

                <nav className="flex-1 px-3 space-y-6 overflow-y-auto">
                    {/* Mailboxes Group */}
                    <div>
                        <h3 className="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Mailboxes</h3>
                        <div className="space-y-0.5">
                            {categories.map((cat) => {
                                const Icon = IconMap[cat.icon] || Mail;
                                const isActive = currentFolder === cat.id;
                                const isDragTarget = dragOverFolder === cat.id;

                                return (
                                    <button
                                        key={cat.id}
                                        onClick={() => onFolderChange(cat.id)}
                                        onDragOver={(e) => {
                                            e.preventDefault(); // allow drop
                                            e.dataTransfer.dropEffect = 'move';
                                            if (dragOverFolder !== cat.id) setDragOverFolder(cat.id);
                                        }}
                                        onDragLeave={() => setDragOverFolder(null)}
                                        onDrop={(e) => {
                                            e.preventDefault();
                                            setDragOverFolder(null);
                                            const emailId = e.dataTransfer.getData('text/plain');
                                            if (emailId && onDropEmail) {
                                                onDropEmail(emailId, cat.id);
                                            }
                                        }}
                                        className={cn(
                                            "w-full flex items-center justify-between px-3 py-1.5 text-sm font-medium rounded-md transition-all duration-200",
                                            isActive
                                                ? "bg-gray-200/60 text-gray-900"
                                                : "text-gray-600 hover:bg-gray-200/40",
                                            isDragTarget && "bg-blue-100 ring-2 ring-blue-500 ring-inset z-10 scale-[1.02]"
                                        )}
                                    >
                                        <div className="flex items-center gap-3">
                                            <Icon size={16} className={cn(isActive ? "text-blue-600" : "text-gray-500")} />
                                            {cat.label}
                                        </div>
                                        {/* Optional: Add badge count here later */}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Favorites Section (Visual Mockup for now) */}
                    <div>
                        <h3 className="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Favorites</h3>
                        <div className="space-y-0.5 opacity-60">
                            <div className="px-3 py-1.5 text-sm text-gray-600 flex items-center gap-3 cursor-not-allowed">
                                <Star size={16} /> VIPs
                            </div>
                            <div className="px-3 py-1.5 text-sm text-gray-600 flex items-center gap-3 cursor-not-allowed">
                                <FileText size={16} /> Flagged
                            </div>
                        </div>
                    </div>
                </nav>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
                {children}
            </div>
        </div>
    );
}


import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Star, Search } from 'lucide-react';
import { Input } from "@complianceos/ui/ui/input";
import { trpc } from '../../lib/trpc';
import { cn } from '../../lib/utils';

interface EmailListProps {
    emails: any[];
    selectedId: number | null;
    onSelect: (id: number) => void;
    onSearch: (query: string) => void;
}

export function EmailList({ emails, selectedId, onSelect, onSearch }: EmailListProps) {
    const utils = trpc.useUtils();
    const toggleStar = trpc.email.toggleStar.useMutation({
        onSuccess: () => utils.email.list.invalidate()
    });

    return (
        <div className="flex flex-col h-full bg-white">
            {/* Search Bar */}
            <div className="p-4 border-b border-gray-200">
                <div className="relative">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                    <Input
                        placeholder="Search emails..."
                        className="pl-9 bg-gray-50 border-gray-200 focus:bg-white transition-colors"
                        onChange={(e) => onSearch(e.target.value)}
                    />
                </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto px-2 py-2 space-y-1">
                {emails.length === 0 ? (
                    <div className="p-8 text-center text-gray-500 text-sm">
                        No emails found
                    </div>
                ) : (
                    emails.map((email) => {
                        const isSelected = selectedId === email.id;
                        const isUnread = !email.isRead;
                        const initials = (email.from || '?').slice(0, 2).toUpperCase();

                        return (
                            <div
                                key={email.id}
                                draggable
                                onDragStart={(e) => {
                                    e.dataTransfer.setData('text/plain', email.id.toString());
                                    e.dataTransfer.effectAllowed = 'move';
                                    // Optional: Set a custom drag image if we wanted
                                }}
                                onClick={() => onSelect(email.id)}
                                className={cn(
                                    "relative group cursor-pointer p-3 rounded-lg transition-all duration-200 border border-transparent select-none", // select-none prevents text selection while dragging
                                    isSelected
                                        ? "bg-blue-600 shadow-md text-white border-blue-500/50"
                                        : "bg-white hover:bg-gray-50 border-gray-100 hover:border-gray-200 hover:shadow-sm text-gray-900 active:scale-[0.99] transition-transform" // Added active scale for feel
                                )}
                            >
                                <div className="flex items-start gap-3">
                                    {/* Avatar */}
                                    <div className={cn(
                                        "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold",
                                        isSelected
                                            ? "bg-white/20 text-white"
                                            : "bg-gray-100 text-gray-600"
                                    )}>
                                        {initials}
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-start mb-0.5">
                                            <span className={cn(
                                                "text-sm truncate pr-2",
                                                isSelected ? "font-semibold text-white" : (isUnread ? "font-bold text-gray-900" : "font-medium text-gray-900")
                                            )}>
                                                {email.from || '(No Sender)'}
                                            </span>
                                            <span className={cn(
                                                "text-[10px] whitespace-nowrap",
                                                isSelected ? "text-blue-100" : "text-gray-400"
                                            )}>
                                                {email.createdAt ? formatDistanceToNow(new Date(email.createdAt), { addSuffix: true }) : ''}
                                            </span>
                                        </div>

                                        <div className={cn(
                                            "text-xs mb-1 truncate",
                                            isSelected ? "text-blue-50 font-medium" : (isUnread ? "font-semibold text-gray-800" : "text-gray-600")
                                        )}>
                                            {email.subject || '(No Subject)'}
                                        </div>

                                        <div className="flex justify-between items-center">
                                            <p className={cn(
                                                "text-xs truncate max-w-[90%]",
                                                isSelected ? "text-blue-100" : "text-gray-400"
                                            )}>
                                                {email.snippet || 'No preview available'}
                                            </p>
                                            {/* Star hidden on hover to keep clean, or always visible? Let's keep distinct */}
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    toggleStar.mutate({ clientId: email.clientId, id: email.id });
                                                }}
                                                className={cn(
                                                    "transition-colors",
                                                    email.isStarred ? "text-yellow-400" : (isSelected ? "text-blue-400 hover:text-white" : "text-gray-200 hover:text-yellow-400")
                                                )}
                                            >
                                                <Star size={14} fill={email.isStarred ? "currentColor" : "none"} />
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* Unread Dot (if not selected, to keep clean) */}
                                {isUnread && !isSelected && (
                                    <div className="absolute left-2 top-1/2 -ml-3 w-1.5 h-1.5 bg-blue-600 rounded-full" />
                                )}
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}

import React, { useState } from 'react';
import { Badge } from '@complianceos/ui/ui/badge';
import { Button } from '@complianceos/ui/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@complianceos/ui/ui/avatar';
import { Edit, History, Trash2, CheckCircle, Clock, MoreHorizontal, Wrench } from 'lucide-react';
import { RemediationDialog } from './RemediationDialog';
import { EquivalentsBadge } from './EquivalentsBadge';
import { cn } from '@/lib/utils';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@complianceos/ui/ui/dropdown-menu";

export interface ControlCardProps {
    control: {
        id: number;
        controlId: string;
        name: string;
        description: string | null;
        owner?: string | null;
        status?: string | null; // e.g., 'active', 'draft' or 'Implemented'
        framework?: string | null;
    };
    onEdit: () => void;
    onHistory: () => void;
    onDelete: () => void;
}

export function ControlCard({ control, onEdit, onHistory, onDelete }: ControlCardProps) {
    const [isRemediationOpen, setIsRemediationOpen] = useState(false);
    // Infer status color
    const statusColor = control.status === 'Implemented' || control.status === 'active' ? 'text-emerald-600 bg-emerald-50 border-emerald-200'
        : control.status === 'In Progress' ? 'text-blue-600 bg-blue-50 border-blue-200'
            : 'text-slate-500 bg-slate-100 border-slate-200';

    // Format status text
    const statusText = control.status ? control.status.charAt(0).toUpperCase() + control.status.slice(1) : 'Unknown';

    return (
        <div
            className="group relative flex items-center gap-4 p-4 rounded-xl border border-slate-200 bg-white transition-all duration-200 hover:shadow-md hover:border-blue-500/30 hover:-translate-y-0.5"
        >
            {/* Left: ID & Info */}
            <div className="flex-shrink-0 w-16 text-center">
                <Badge variant="outline" className="bg-slate-50 font-mono text-xs border-slate-300 text-slate-700">
                    {control.controlId}
                </Badge>
            </div>

            {/* Middle: Content */}
            <div className="flex-grow min-w-0 grid gap-1">
                <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-slate-900 truncate">{control.name}</h3>
                    <EquivalentsBadge controlId={control.id} />
                </div>
                <p className="text-sm text-slate-500 truncate pr-4">
                    {control.description || 'No description provided.'}
                </p>
            </div>

            {/* Right: Meta & Actions */}
            <div className="flex-shrink-0 flex items-center gap-4">
                {/* Status Badge (if exists) */}
                {control.status && (
                    <span className={cn("text-xs px-2 py-1 rounded-full border font-medium", statusColor)}>
                        {statusText}
                    </span>
                )}

                {/* Owner Avatar */}
                <div className="flex items-center gap-2" title={`Owner: ${control.owner || 'Unassigned'}`}>
                    <Avatar className="h-8 w-8 border-2 border-white shadow-sm">
                        <AvatarFallback className="bg-indigo-100 text-indigo-700 text-xs">
                            {control.owner ? control.owner.substring(0, 2).toUpperCase() : 'UN'}
                        </AvatarFallback>
                    </Avatar>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 px-2 border-l border-slate-100 pl-4">
                    <Button size="icon" variant="ghost" className="h-8 w-8 text-slate-400 hover:text-amber-600 hover:bg-amber-50" title="Remediation Playbooks" onClick={(e) => { e.stopPropagation(); setIsRemediationOpen(true); }}>
                        <Wrench className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-8 w-8 text-slate-400 hover:text-blue-600 hover:bg-blue-50" onClick={(e) => { e.stopPropagation(); onEdit(); }}>
                        <Edit className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-8 w-8 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50" onClick={(e) => { e.stopPropagation(); onHistory(); }}>
                        <History className="h-4 w-4" />
                    </Button>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button size="icon" variant="ghost" className="h-8 w-8 text-slate-400 hover:text-slate-700">
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem className="text-red-600 focus:text-red-600" onClick={(e) => { e.stopPropagation(); onDelete(); }}>
                                <Trash2 className="h-4 w-4 mr-2" /> Delete
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            <RemediationDialog
                open={isRemediationOpen}
                onOpenChange={(open) => {
                    // Prevent propagation when closing logic might trigger card click
                    setIsRemediationOpen(open);
                }}
                controlId={control.controlId}
                controlName={control.name}
                framework={control.framework || undefined}
                numericControlId={control.id}
            />
        </div>
    );
}

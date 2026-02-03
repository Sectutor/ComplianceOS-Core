
import React from 'react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@complianceos/ui/ui/table";
import { Checkbox } from "@complianceos/ui/ui/checkbox";
import { Badge } from "@complianceos/ui/ui/badge";
import { Button } from "@complianceos/ui/ui/button";
import { 
    MoreHorizontal, 
    Shield, 
    FileText, 
    User, 
    Activity 
} from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@complianceos/ui/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@complianceos/ui/ui/avatar";

interface Control {
    id: number;
    controlId: string;
    name: string;
    description: string | null;
    framework: string;
    owner: string | null;
    status: string | null;
    evidenceType: string | null;
    mappedFrameworks?: string[];
}

interface ControlTableProps {
    controls: Control[];
    selectedIds: number[];
    onSelectChange: (ids: number[]) => void;
    onEdit: (control: Control) => void;
    onDelete: (id: number) => void;
    onViewDetails: (control: Control) => void;
}

export function ControlTable({
    controls,
    selectedIds,
    onSelectChange,
    onEdit,
    onDelete,
    onViewDetails
}: ControlTableProps) {
    const toggleSelectAll = () => {
        if (selectedIds.length === controls.length) {
            onSelectChange([]);
        } else {
            onSelectChange(controls.map(c => c.id));
        }
    };

    const toggleSelectOne = (id: number) => {
        if (selectedIds.includes(id)) {
            onSelectChange(selectedIds.filter(sid => sid !== id));
        } else {
            onSelectChange([...selectedIds, id]);
        }
    };

    return (
        <div className="rounded-md border border-slate-200">
            <Table>
                <TableHeader className="bg-slate-50">
                    <TableRow>
                        <TableHead className="w-[50px]">
                            <Checkbox 
                                checked={controls.length > 0 && selectedIds.length === controls.length}
                                onCheckedChange={toggleSelectAll}
                            />
                        </TableHead>
                        {/* Frameworks column removed */}
                        <TableHead className="min-w-[400px]">Control</TableHead>
                        <TableHead className="w-[150px]">Owner</TableHead>
                        <TableHead className="w-[120px]">Source</TableHead>
                        <TableHead className="w-[100px]">Tests</TableHead>
                        <TableHead className="w-[100px]">ID</TableHead>
                        <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {controls.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                                No controls found.
                            </TableCell>
                        </TableRow>
                    ) : (
                        controls.map((control) => (
                            <TableRow 
                                key={control.id} 
                                className="group hover:bg-slate-50/50 cursor-pointer"
                                onClick={(e) => {
                                    // Prevent triggering detailed view when clicking checkbox or menu
                                    if ((e.target as HTMLElement).closest('.no-click-propagate')) return;
                                    onViewDetails(control);
                                }}
                            >
                                <TableCell className="no-click-propagate">
                                    <Checkbox 
                                        checked={selectedIds.includes(control.id)}
                                        onCheckedChange={() => toggleSelectOne(control.id)}
                                    />
                                </TableCell>
                                <TableCell>
                                    <div className="flex flex-col gap-1 py-1">
                                        <div className="flex items-center gap-2">
                                            <span className="font-semibold text-slate-900 group-hover:text-primary transition-colors">
                                                 {control.controlId} {control.name}
                                            </span>
                                        </div>
                                        <span className="text-sm text-slate-500 line-clamp-2">
                                            {control.description}
                                        </span>
                                        <div className="flex flex-wrap gap-1.5 mt-1">
                                            {(control.mappedFrameworks || [control.framework]).map(fw => (
                                                <Badge 
                                                    key={fw} 
                                                    variant="secondary" 
                                                    className="bg-sky-100 text-sky-700 hover:bg-sky-200 border-sky-200 text-[10px] font-semibold px-1.5 py-0 rounded-sm uppercase tracking-wide"
                                                >
                                                    {fw}
                                                </Badge>
                                            ))}
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-2">
                                        <Avatar className="h-6 w-6">
                                            <AvatarFallback className="text-[10px] bg-slate-100 text-slate-600">
                                                {(control.owner || "U").substring(0, 2).toUpperCase()}
                                            </AvatarFallback>
                                        </Avatar>
                                        <span className={`text-sm ${control.owner ? 'text-slate-700' : 'text-slate-400 italic'}`}>
                                            {control.owner || "Unassigned"}
                                        </span>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-2">
                                        <div className="bg-slate-900 text-white p-1 rounded-sm">
                                            <Shield className="h-3 w-3" />
                                        </div>
                                        <span className="text-sm font-medium text-slate-700">OS</span>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-2 text-slate-500">
                                        <Activity className="h-4 w-4" />
                                        <span className="text-sm">0/1</span>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <span className="text-xs font-mono text-slate-500 bg-slate-100 px-2 py-1 rounded">
                                        {control.controlId}
                                    </span>
                                </TableCell>
                                <TableCell className="no-click-propagate">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                            <DropdownMenuItem onClick={() => onViewDetails(control)}>
                                                View Details
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => onEdit(control)}>
                                                Edit Control
                                            </DropdownMenuItem>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem className="text-red-600" onClick={() => onDelete(control.id)}>
                                                Delete
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </TableCell>
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>
        </div>
    );
}

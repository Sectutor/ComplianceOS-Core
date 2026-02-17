import React, { useState } from 'react';
import { useClientContext } from "@/contexts/ClientContext";
import { Button } from "@complianceos/ui/ui/button";
import { Database, Plus, Search, Loader2, AlertTriangle } from "lucide-react";
import { trpc } from '@/lib/trpc';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@complianceos/ui/ui/table";
import { Badge } from "@complianceos/ui/ui/badge";
import { Input } from "@complianceos/ui/ui/input";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function DataInventory() {
    const { selectedClientId } = useClientContext();
    const clientId = selectedClientId || 0;
    const [searchTerm, setSearchTerm] = useState("");

    const { data: inventory, isLoading } = trpc.privacy.getInventory.useQuery({ clientId }, { enabled: !!clientId });

    const filteredInventory = inventory?.filter(asset =>
        asset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (asset.type && asset.type.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900">Data Inventory</h1>
                    <p className="text-slate-500 text-lg">Catalog and manage personal data assets and processing activities.</p>
                </div>
                <Button
                    variant="outline"
                    className="border-slate-200 hover:bg-slate-50 font-bold h-11 px-6 rounded-xl transition-all"
                    onClick={() => toast.info("Asset mapping wizard coming soon.")}
                >
                    <Plus className="mr-2 h-5 w-5" /> Map New Asset
                </Button>
            </div>

            <div className="flex items-center py-6 px-6 bg-white border border-slate-200 rounded-2xl shadow-sm">
                <div className="relative w-full max-w-md">
                    <Search className="absolute left-3 top-3.5 h-5 w-5 text-slate-400" />
                    <Input
                        placeholder="Search assets by name or type..."
                        className="pl-10 h-12 rounded-xl border-slate-200 focus:border-[#3ABEF9] focus:ring-[#3ABEF9]/20"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {isLoading ? (
                <div className="flex flex-col items-center justify-center p-24 space-y-4">
                    <Loader2 className="h-12 w-12 animate-spin text-[#3ABEF9]" />
                    <p className="text-slate-400 font-medium animate-pulse">Scanning data inventory...</p>
                </div>
            ) : (
                <div className="rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-200/50 overflow-hidden">
                    <Table>
                        <TableHeader className="bg-slate-50/50">
                            <TableRow className="hover:bg-transparent border-0">
                                <TableHead className="font-bold text-slate-700 h-14">Asset Name</TableHead>
                                <TableHead className="font-bold text-slate-700 h-14">Type</TableHead>
                                <TableHead className="font-bold text-slate-700 h-14">Sensitivity</TableHead>
                                <TableHead className="font-bold text-slate-700 h-14">Format</TableHead>
                                <TableHead className="font-bold text-slate-700 h-14">Owner</TableHead>
                                <TableHead className="font-bold text-slate-700 h-14 px-6">Last Updated</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredInventory && filteredInventory.length > 0 ? (
                                filteredInventory.map((asset, idx: number) => (
                                    <TableRow
                                        key={asset.id}
                                        className="hover:bg-slate-50/80 transition-colors group border-b border-slate-100 last:border-0"
                                        style={{ animationDelay: `${idx * 50}ms` }}
                                    >
                                        <TableCell className="py-5">
                                            <div className="flex items-center">
                                                <div className="h-10 w-10 bg-sky-50 rounded-xl flex items-center justify-center text-[#3ABEF9] mr-4 shadow-sm">
                                                    <Database className="h-5 w-5" />
                                                </div>
                                                <div>
                                                    <div className="font-bold text-slate-900">{asset.name}</div>
                                                    <div className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">UID: {asset.id.split('-')[0]}</div>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="py-5">
                                            <Badge className="bg-slate-100 text-slate-600 border-none font-bold uppercase text-[10px] tracking-wider px-2.5 py-1">
                                                {asset.type}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="py-5">
                                            <Badge className={cn(
                                                "border-none font-bold uppercase text-[10px] tracking-wider px-2.5 py-1",
                                                asset.dataSensitivity === 'High'
                                                    ? "bg-rose-100 text-rose-700"
                                                    : asset.dataSensitivity === 'Medium'
                                                        ? "bg-amber-100 text-amber-700"
                                                        : "bg-green-100 text-green-700"
                                            )}>
                                                {asset.dataSensitivity || 'Unclassified'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="py-5 text-slate-500 font-medium">{asset.dataFormat || '-'}</TableCell>
                                        <TableCell className="py-5">
                                            <div className="flex items-center gap-2">
                                                <div className="h-7 w-7 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-500 uppercase">
                                                    {asset.dataOwner ? asset.dataOwner.charAt(0) : '?'}
                                                </div>
                                                <span className="text-slate-700 font-medium">{asset.dataOwner || <span className="text-slate-300 italic">Unassigned</span>}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="py-5 px-6 text-slate-500 tabular-nums">
                                            {new Date(asset.updatedAt).toLocaleDateString()}
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-72 text-center text-slate-400">
                                        <div className="flex flex-col items-center justify-center space-y-4">
                                            <div className="p-6 bg-slate-50 rounded-2xl">
                                                <Database className="h-12 w-12 text-slate-300" />
                                            </div>
                                            <div className="space-y-1">
                                                <p className="font-bold text-slate-900 text-lg">No assets found</p>
                                                <p className="max-w-xs mx-auto">Start cataloging your personal data assets to build a compliant inventory.</p>
                                            </div>
                                            <Button
                                                variant="outline"
                                                onClick={() => toast.info("Asset mapping wizard coming soon.")}
                                                className="border-slate-200 hover:bg-slate-50 font-bold rounded-xl"
                                            >
                                                Initialize Inventory
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            )}
        </div>
    );
}

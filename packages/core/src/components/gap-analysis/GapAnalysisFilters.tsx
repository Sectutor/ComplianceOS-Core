
import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@complianceos/ui/ui/select";
import { Input } from "@complianceos/ui/ui/input";
import { Filter } from "lucide-react";

interface GapAnalysisFiltersProps {
    filterDomain: string;
    setFilterDomain: (value: string) => void;
    searchTerm: string;
    setSearchTerm: (value: string) => void;
    domains: string[];
    totalCount: number;
}

export function GapAnalysisFilters({
    filterDomain,
    setFilterDomain,
    searchTerm,
    setSearchTerm,
    domains,
    totalCount
}: GapAnalysisFiltersProps) {
    return (
        <div className="flex flex-col md:flex-row items-center gap-4 bg-white/50 p-4 rounded-xl border shadow-sm backdrop-blur-sm">
            <div className="flex items-center gap-3 flex-1 w-full">
                <div className="bg-slate-100 p-2 rounded-lg">
                    <Filter className="w-4 h-4 text-slate-600" />
                </div>
                <Select value={filterDomain} onValueChange={setFilterDomain}>
                    <SelectTrigger className="w-full md:w-[220px] bg-white">
                        <SelectValue placeholder="All Domains" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="All">All Domains</SelectItem>
                        {domains.map(d => (
                            <SelectItem key={d} value={d}>{d}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <div className="relative flex-1 max-w-sm">
                    <Input
                        placeholder="Search controls or descriptions..."
                        className="bg-white pl-3 text-sm"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>
            <div className="text-sm font-medium text-slate-500 bg-slate-100 px-3 py-1.5 rounded-full border border-slate-200">
                Found <span className="text-slate-900 font-bold">{totalCount}</span> controls
            </div>
        </div>
    );
}

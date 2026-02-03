
import React from 'react';
import { Search, ChevronDown, SlidersHorizontal, X } from 'lucide-react';
import { Input } from '@complianceos/ui/ui/input';
import { Button } from '@complianceos/ui/ui/button';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@complianceos/ui/ui/dropdown-menu"
import { Badge } from '@complianceos/ui/ui/badge';

interface ControlFilterBarProps {
    searchQuery: string;
    onSearchChange: (value: string) => void;
    filters: {
        framework: string[];
        owner: string[];
        status: string[];
        risk: string[];
    };
    onFilterChange: (type: keyof ControlFilterBarProps['filters'], value: string[]) => void;
    availableFrameworks: string[];
    availableOwners: string[];
}

export function ControlFilterBar({
    searchQuery,
    onSearchChange,
    filters,
    onFilterChange,
    availableFrameworks,
    availableOwners
}: ControlFilterBarProps) {

    const toggleFilter = (type: keyof ControlFilterBarProps['filters'], value: string) => {
        const current = filters[type];
        const newValues = current.includes(value)
            ? current.filter(v => v !== value)
            : [...current, value];
        onFilterChange(type, newValues);
    };

    const clearFilters = () => {
        onFilterChange('framework', []);
        onFilterChange('owner', []);
        onFilterChange('status', []);
        onFilterChange('risk', []);
    };

    const hasActiveFilters = Object.values(filters).some(f => f.length > 0);

    return (
        <div className="flex flex-col space-y-4 mb-6">
            <div className="flex flex-wrap items-center gap-2 w-full">
                <div className="relative flex-1 min-w-[200px] max-w-sm">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                        value={searchQuery}
                        onChange={(e) => onSearchChange(e.target.value)}
                        placeholder="Search controls"
                        className="pl-9 bg-white border-slate-200"
                    />
                </div>

                <FilterDropdown
                    label="Framework"
                    count={filters.framework.length}
                    items={availableFrameworks}
                    selected={filters.framework}
                    onToggle={(val) => toggleFilter('framework', val)}
                />

                <FilterDropdown
                    label="Owner"
                    count={filters.owner.length}
                    items={availableOwners}
                    selected={filters.owner}
                    onToggle={(val) => toggleFilter('owner', val)}
                />
                 {/* Placeholders for other filters mentioned in design but maybe not fully backed by data yet */}
                <Button variant="ghost" size="sm" className="text-slate-600 gap-1 font-normal">
                    Domain <ChevronDown className="h-3 w-3 opacity-50" />
                </Button>
                 <Button variant="ghost" size="sm" className="text-slate-600 gap-1 font-normal">
                    Source <ChevronDown className="h-3 w-3 opacity-50" />
                </Button>
                <Button variant="ghost" size="sm" className="text-slate-600 gap-1 font-normal">
                    Status <ChevronDown className="h-3 w-3 opacity-50" />
                </Button>
                 <Button variant="ghost" size="sm" className="text-slate-600 gap-1 font-normal">
                    Risk <ChevronDown className="h-3 w-3 opacity-50" />
                </Button>

                {hasActiveFilters && (
                    <Button
                        variant="ghost"
                        size="sm"
                         onClick={clearFilters}
                        className="text-primary hover:text-primary/80 ml-auto font-medium"
                    >
                        Clear
                    </Button>
                )}

                 <Button variant="outline" size="icon" className="ml-auto bg-white">
                    <SlidersHorizontal className="h-4 w-4 text-slate-600" />
                </Button>
            </div>
            
            {hasActiveFilters && (
                 <div className="flex flex-wrap gap-2">
                    {filters.framework.map(f => (
                         <Badge key={`fw-${f}`} variant="secondary" className="gap-1 bg-violet-50 text-violet-700 border-violet-100 hover:bg-violet-100">
                            {f} <X className="h-3 w-3 cursor-pointer" onClick={() => toggleFilter('framework', f)} />
                         </Badge>
                    ))}
                     {filters.owner.map(o => (
                         <Badge key={`ow-${o}`} variant="secondary" className="gap-1 bg-slate-100 text-slate-700 hover:bg-slate-200">
                            Owner: {o} <X className="h-3 w-3 cursor-pointer" onClick={() => toggleFilter('owner', o)} />
                         </Badge>
                    ))}
                 </div>
            )}
        </div>
    );
}

function FilterDropdown({ label, count, items, selected, onToggle }: { label: string, count: number, items: string[], selected: string[], onToggle: (val: string) => void }) {
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant={count > 0 ? "secondary" : "ghost"} size="sm" className={`gap-1 font-normal ${count > 0 ? 'bg-violet-50 text-violet-700 hover:bg-violet-100 border border-dashed border-violet-300' : 'text-slate-600'}`}>
                    {label} {count > 0 && <span className="ml-1 bg-violet-200 text-violet-800 text-[10px] px-1.5 py-0.5 rounded-full">{count}</span>}
                    <ChevronDown className="h-3 w-3 opacity-50" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56">
                <DropdownMenuLabel>Filter by {label}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {items.length === 0 ? (
                    <div className="p-2 text-xs text-muted-foreground text-center">No options available</div>
                ) : (
                    items.map(item => (
                        <DropdownMenuCheckboxItem
                            key={item}
                            checked={selected.includes(item)}
                            onCheckedChange={() => onToggle(item)}
                            onSelect={(e) => e.preventDefault()}
                            className={`cursor-pointer ${selected.includes(item) ? "bg-violet-50 text-violet-900 font-medium focus:bg-violet-100" : ""}`}
                        >
                            {item}
                        </DropdownMenuCheckboxItem>
                    ))
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    )
}

import { Button } from "@complianceos/ui/ui/button";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@complianceos/ui/ui/command";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@complianceos/ui/ui/select";
import { trpc } from "@/lib/trpc";
import { 
  Search, 
  Shield, 
  FileText, 
  ClipboardCheck, 
  Building2,
  Loader2,
  X,
  Filter
} from "lucide-react";
import { useEffect, useState, useCallback } from "react";
import { useLocation } from "wouter";
import { useDebounce } from "@/hooks/useDebounce";

type SearchType = 'control' | 'policy' | 'evidence' | 'client' | undefined;
type Framework = 'ISO 27001' | 'SOC 2' | undefined;

export function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [, setLocation] = useLocation();
  
  // Filter states
  const [typeFilter, setTypeFilter] = useState<SearchType>(undefined);
  const [frameworkFilter, setFrameworkFilter] = useState<Framework>(undefined);
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);
  const [clientFilter, setClientFilter] = useState<number | undefined>(undefined);
  
  const debouncedQuery = useDebounce(query, 300);
  
  // Fetch clients for filter dropdown
  const { data: clientsData } = trpc.clients.list.useQuery();
  
  const { data: results, isLoading } = trpc.search.global.useQuery(
    { 
      query: debouncedQuery, 
      limit: 20,
      type: typeFilter,
      framework: frameworkFilter,
      status: statusFilter,
      clientId: clientFilter,
    },
    { enabled: debouncedQuery.length > 0 }
  );

  // Keyboard shortcut (Cmd+K or Ctrl+K)
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const handleSelect = useCallback((url: string) => {
    setOpen(false);
    setQuery("");
    clearFilters();
    setLocation(url);
  }, [setLocation]);

  const clearFilters = () => {
    setTypeFilter(undefined);
    setFrameworkFilter(undefined);
    setStatusFilter(undefined);
    setClientFilter(undefined);
  };

  const hasActiveFilters = typeFilter || frameworkFilter || statusFilter || clientFilter;

  const getIcon = (type: string) => {
    switch (type) {
      case 'control':
        return <Shield className="h-4 w-4 text-blue-500" />;
      case 'policy':
        return <FileText className="h-4 w-4 text-green-500" />;
      case 'evidence':
        return <ClipboardCheck className="h-4 w-4 text-purple-500" />;
      case 'client':
        return <Building2 className="h-4 w-4 text-orange-500" />;
      default:
        return <Search className="h-4 w-4" />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'control':
        return 'Control';
      case 'policy':
        return 'Policy';
      case 'evidence':
        return 'Evidence';
      case 'client':
        return 'Client';
      default:
        return type;
    }
  };

  // Group results by type
  const groupedResults = results?.reduce((acc, result) => {
    if (!acc[result.type]) {
      acc[result.type] = [];
    }
    acc[result.type].push(result);
    return acc;
  }, {} as Record<string, typeof results>);

  return (
    <>
      <Button
        variant="outline"
        className="relative h-9 w-full justify-start rounded-md bg-muted/50 text-sm font-normal text-muted-foreground shadow-none sm:pr-12 md:w-40 lg:w-64"
        onClick={() => setOpen(true)}
      >
        <Search className="mr-2 h-4 w-4" />
        <span className="hidden lg:inline-flex">Search...</span>
        <span className="inline-flex lg:hidden">Search</span>
        <kbd className="pointer-events-none absolute right-1.5 top-1.5 hidden h-6 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
          <span className="text-xs">⌘</span>K
        </kbd>
      </Button>
      <CommandDialog open={open} onOpenChange={setOpen}>
        <div className="flex flex-col">
          <CommandInput 
            placeholder="Search controls, policies, evidence, clients..." 
            value={query}
            onValueChange={setQuery}
          />
          
          {/* Filter Toggle */}
          <div className="flex items-center justify-between px-3 py-2 border-b">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="h-3 w-3 mr-1" />
              Filters
              {hasActiveFilters && (
                <span className="ml-1 bg-primary text-primary-foreground rounded-full px-1.5 text-[10px]">
                  {[typeFilter, frameworkFilter, statusFilter, clientFilter].filter(Boolean).length}
                </span>
              )}
            </Button>
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs text-muted-foreground"
                onClick={clearFilters}
              >
                <X className="h-3 w-3 mr-1" />
                Clear
              </Button>
            )}
          </div>
          
          {/* Filter Dropdowns */}
          {showFilters && (
            <div className="grid grid-cols-2 gap-2 p-3 border-b bg-muted/30">
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Type</label>
                <Select 
                  value={typeFilter || "all"} 
                  onValueChange={(v) => setTypeFilter(v === "all" ? undefined : v as SearchType)}
                >
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder="All types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All types</SelectItem>
                    <SelectItem value="control">Controls</SelectItem>
                    <SelectItem value="policy">Policies</SelectItem>
                    <SelectItem value="evidence">Evidence</SelectItem>
                    <SelectItem value="client">Clients</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Framework</label>
                <Select 
                  value={frameworkFilter || "all"} 
                  onValueChange={(v) => setFrameworkFilter(v === "all" ? undefined : v as Framework)}
                >
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder="All frameworks" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All frameworks</SelectItem>
                    <SelectItem value="ISO 27001">ISO 27001</SelectItem>
                    <SelectItem value="SOC 2">SOC 2</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Status</label>
                <Select 
                  value={statusFilter || "all"} 
                  onValueChange={(v) => setStatusFilter(v === "all" ? undefined : v)}
                >
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder="All statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All statuses</SelectItem>
                    <SelectItem value="not_started">Not Started</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="implemented">Implemented</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="review">Review</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="verified">Verified</SelectItem>
                    <SelectItem value="expired">Expired</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Client</label>
                <Select 
                  value={clientFilter?.toString() || "all"} 
                  onValueChange={(v) => setClientFilter(v === "all" ? undefined : parseInt(v))}
                >
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder="All clients" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All clients</SelectItem>
                    {clientsData?.map((client) => (
                      <SelectItem key={client.id} value={client.id.toString()}>
                        {client.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </div>
        
        <CommandList>
          {isLoading && debouncedQuery.length > 0 && (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          )}
          {!isLoading && debouncedQuery.length > 0 && (!results || results.length === 0) && (
            <CommandEmpty>No results found.</CommandEmpty>
          )}
          {!isLoading && debouncedQuery.length === 0 && (
            <CommandEmpty>Start typing to search...</CommandEmpty>
          )}
          {groupedResults && Object.entries(groupedResults).map(([type, items]) => (
            <CommandGroup key={type} heading={`${getTypeLabel(type)}s`}>
              {items?.map((result) => (
                <CommandItem
                  key={`${result.type}-${result.id}`}
                  value={`${result.type}-${result.id}-${result.title}`}
                  onSelect={() => handleSelect(result.url)}
                  className="flex items-center gap-3 cursor-pointer"
                >
                  {getIcon(result.type)}
                  <div className="flex flex-col flex-1 min-w-0">
                    <span className="font-medium truncate">{result.title}</span>
                    <span className="text-xs text-muted-foreground truncate">
                      {result.description}
                      {result.clientName && ` • ${result.clientName}`}
                    </span>
                  </div>
                  {result.framework && (
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                      {result.framework}
                    </span>
                  )}
                  {result.status && (
                    <span className={`text-xs px-2 py-0.5 rounded ${
                      result.status === 'implemented' || result.status === 'approved' || result.status === 'verified'
                        ? 'bg-green-100 text-green-700'
                        : result.status === 'in_progress' || result.status === 'review'
                        ? 'bg-yellow-100 text-yellow-700'
                        : 'bg-gray-100 text-gray-700'
                    }`}>
                      {result.status.replace('_', ' ')}
                    </span>
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
          ))}
        </CommandList>
      </CommandDialog>
    </>
  );
}

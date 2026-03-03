import { Button } from "@complianceos/ui/ui/button";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@complianceos/ui/ui/command";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@complianceos/ui/ui/select";
import { Badge } from "@complianceos/ui/ui/badge";
import { trpc } from "@/lib/trpc";
import {
  Search,
  Shield,
  FileText,
  ClipboardCheck,
  Building2,
  Loader2,
  X,
  Filter,
  Clock,
  Bookmark,
  Sparkles,
  Users,
  Target,
  Scale,
  FolderOpen,
  Plus,
  TrendingUp,
  ArrowRight
} from "lucide-react";
import { useEffect, useState, useCallback, useMemo } from "react";
import { useLocation } from "wouter";
import { useDebounce } from "@/hooks/useDebounce";

type SearchType = 'control' | 'policy' | 'evidence' | 'client' | 'task' | 'person' | 'framework' | 'risk' | undefined;
type Framework = 'ISO 27001' | 'SOC 2' | 'GDPR' | 'HIPAA' | 'NIST' | undefined;

// Type for the API - only includes supported types
type ApiSearchType = 'control' | 'policy' | 'evidence' | 'client' | undefined;

// Extended search result type to include all supported types
interface SearchResult {
  id: number;
  type: string;
  title: string;
  description?: string;
  url: string;
  clientName?: string;
  framework?: string;
  status?: string;
  icon?: string;
}

// Recent search item stored in localStorage
interface RecentSearch {
  query: string;
  timestamp: number;
  type?: SearchType;
}

const STORAGE_KEY = 'complianceos-recent-searches';
const SAVED_SEARCHES_KEY = 'complianceos-saved-searches';

// Popular search suggestions for each category
const POPULAR_SEARCHES: Record<string, string[]> = {
  control: ['access control', 'encryption', 'audit logging', 'incident response'],
  policy: ['data retention', 'acceptable use', 'password policy', 'remote work'],
  evidence: ['screenshot', 'certificate', 'policy document', 'configuration'],
  client: ['acme corp', 'tech startup', 'healthcare', 'financial'],
  framework: ['ISO 27001', 'SOC 2', 'GDPR', 'HIPAA', 'NIST CSF'],
};

export function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [activeTab, setActiveTab] = useState<'search' | 'recent' | 'saved'>('recent');
  const [, setLocation] = useLocation();

  // Filter states
  const [typeFilter, setTypeFilter] = useState<SearchType>(undefined);
  const [frameworkFilter, setFrameworkFilter] = useState<Framework>(undefined);
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);
  const [clientFilter, setClientFilter] = useState<number | undefined>(undefined);

  // Recent and saved searches state
  const [recentSearches, setRecentSearches] = useState<RecentSearch[]>([]);
  const [savedSearches, setSavedSearches] = useState<RecentSearch[]>([]);

  const debouncedQuery = useDebounce(query, 300);

  // Load recent and saved searches from localStorage on mount
  useEffect(() => {
    try {
      const storedRecent = localStorage.getItem(STORAGE_KEY);
      const storedSaved = localStorage.getItem(SAVED_SEARCHES_KEY);
      if (storedRecent) {
        setRecentSearches(JSON.parse(storedRecent));
      }
      if (storedSaved) {
        setSavedSearches(JSON.parse(storedSaved));
      }
    } catch (e) {
      console.error('Failed to load searches from storage:', e);
    }
  }, []);

  // Save search to recent searches
  const saveToRecent = useCallback((searchQuery: string, searchType?: SearchType) => {
    if (!searchQuery.trim()) return;

    const newSearch: RecentSearch = {
      query: searchQuery,
      timestamp: Date.now(),
      type: searchType
    };

    setRecentSearches(prev => {
      // Remove duplicate if exists
      const filtered = prev.filter(s => s.query.toLowerCase() !== searchQuery.toLowerCase());
      // Keep only last 10 searches
      const updated = [newSearch, ...filtered].slice(0, 10);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch (e) {
        console.error('Failed to save recent search:', e);
      }
      return updated;
    });
  }, []);

  // Save search to favorites
  const saveSearch = useCallback((searchQuery: string, searchType?: SearchType) => {
    if (!searchQuery.trim()) return;

    const newSearch: RecentSearch = {
      query: searchQuery,
      timestamp: Date.now(),
      type: searchType
    };

    setSavedSearches(prev => {
      // Check if already saved
      if (prev.some(s => s.query.toLowerCase() === searchQuery.toLowerCase())) {
        return prev;
      }
      const updated = [newSearch, ...prev].slice(0, 10);
      try {
        localStorage.setItem(SAVED_SEARCHES_KEY, JSON.stringify(updated));
      } catch (e) {
        console.error('Failed to save search:', e);
      }
      return updated;
    });
  }, []);

  // Remove from saved searches
  const removeSavedSearch = useCallback((searchQuery: string) => {
    setSavedSearches(prev => {
      const updated = prev.filter(s => s.query.toLowerCase() !== searchQuery.toLowerCase());
      try {
        localStorage.setItem(SAVED_SEARCHES_KEY, JSON.stringify(updated));
      } catch (e) {
        console.error('Failed to remove saved search:', e);
      }
      return updated;
    });
  }, []);

  // Fetch clients for filter dropdown - use empty object as per API
  const { data: clientsData } = trpc.clients.list.useQuery({});

  // Build filters object for the API - only use types supported by backend
  const apiTypeFilter = typeFilter as ApiSearchType;
  const searchFilters = useMemo(() => ({
    type: apiTypeFilter,
    framework: frameworkFilter,
    status: statusFilter,
    clientId: clientFilter,
  }), [apiTypeFilter, frameworkFilter, statusFilter, clientFilter]);

  const { data: results, isLoading } = trpc.search.global.useQuery(
    {
      query: debouncedQuery,
      filters: searchFilters,
      limit: 20,
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

  const handleSelect = useCallback((url: string, saveQuery?: string) => {
    setOpen(false);
    if (saveQuery) {
      saveToRecent(saveQuery, typeFilter);
    } else if (query) {
      saveToRecent(query, typeFilter);
    }
    setQuery("");
    clearFilters();
    setLocation(url);
  }, [setLocation, query, typeFilter, saveToRecent]);

  const handleQuickSearch = useCallback((searchQuery: string, searchType?: SearchType) => {
    setTypeFilter(searchType);
    setQuery(searchQuery);
    setActiveTab('search');
  }, []);

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
      case 'task':
        return 'Task';
      case 'person':
        return 'Person';
      case 'framework':
        return 'Framework';
      case 'risk':
        return 'Risk';
      default:
        return type;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'control':
        return <Shield className="h-4 w-4 text-blue-500" />;
      case 'policy':
        return <FileText className="h-4 w-4 text-green-500" />;
      case 'evidence':
        return <ClipboardCheck className="h-4 w-4 text-purple-500" />;
      case 'client':
        return <Building2 className="h-4 w-4 text-orange-500" />;
      case 'task':
        return <Target className="h-4 w-4 text-red-500" />;
      case 'person':
        return <Users className="h-4 w-4 text-cyan-500" />;
      case 'framework':
        return <Scale className="h-4 w-4 text-indigo-500" />;
      case 'risk':
        return <TrendingUp className="h-4 w-4 text-amber-500" />;
      default:
        return <Search className="h-4 w-4" />;
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

          {/* Tab Navigation */}
          <div className="flex items-center justify-between px-3 py-2 border-b">
            <div className="flex items-center gap-1">
              <Button
                variant={activeTab === 'recent' ? 'secondary' : 'ghost'}
                size="sm"
                className="h-7 text-xs"
                onClick={() => setActiveTab('recent')}
              >
                <Clock className="h-3 w-3 mr-1" />
                Recent
              </Button>
              <Button
                variant={activeTab === 'saved' ? 'secondary' : 'ghost'}
                size="sm"
                className="h-7 text-xs"
                onClick={() => setActiveTab('saved')}
              >
                <Bookmark className="h-3 w-3 mr-1" />
                Saved
              </Button>
              <Button
                variant={activeTab === 'search' ? 'secondary' : 'ghost'}
                size="sm"
                className="h-7 text-xs"
                onClick={() => setActiveTab('search')}
              >
                <Search className="h-3 w-3 mr-1" />
                Search
              </Button>
            </div>
            <div className="flex items-center gap-1">
              {/* Active Filter Chips */}
              {hasActiveFilters && (
                <div className="flex items-center gap-1 mr-2">
                  {typeFilter && (
                    <Badge variant="secondary" className="text-xs h-5 gap-1">
                      {getTypeLabel(typeFilter)}
                      <X className="h-3 w-3 cursor-pointer" onClick={() => setTypeFilter(undefined)} />
                    </Badge>
                  )}
                  {frameworkFilter && (
                    <Badge variant="secondary" className="text-xs h-5 gap-1">
                      {frameworkFilter}
                      <X className="h-3 w-3 cursor-pointer" onClick={() => setFrameworkFilter(undefined)} />
                    </Badge>
                  )}
                  {clientFilter && (
                    <Badge variant="secondary" className="text-xs h-5 gap-1">
                      Client
                      <X className="h-3 w-3 cursor-pointer" onClick={() => setClientFilter(undefined)} />
                    </Badge>
                  )}
                </div>
              )}
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
                    {clientsData?.map((client: { id: number; name: string }) => (
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
          {/* Show content based on active tab */}
          {activeTab === 'recent' && (
            <>
              {recentSearches.length === 0 ? (
                <CommandEmpty>No recent searches yet.</CommandEmpty>
              ) : (
                <CommandGroup heading="Recent Searches">
                  {recentSearches.map((search, index) => (
                    <CommandItem
                      key={`${search.query}-${index}`}
                      value={`recent-${search.query}`}
                      onSelect={() => handleQuickSearch(search.query, search.type)}
                      className="flex items-center gap-3 cursor-pointer"
                    >
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <div className="flex flex-col flex-1 min-w-0">
                        <span className="font-medium truncate">{search.query}</span>
                        {search.type && (
                          <span className="text-xs text-muted-foreground">
                            {getTypeLabel(search.type)}
                          </span>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          saveSearch(search.query, search.type);
                        }}
                      >
                        <Bookmark className="h-3 w-3" />
                      </Button>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
              {/* Popular searches when no recent */}
              {recentSearches.length > 0 && (
                <CommandGroup heading="Popular">
                  {Object.entries(POPULAR_SEARCHES).slice(0, 3).map(([type, searches]) => (
                    searches.slice(0, 2).map((search) => (
                      <CommandItem
                        key={`popular-${type}-${search}`}
                        value={`popular-${search}`}
                        onSelect={() => handleQuickSearch(search, type as SearchType)}
                        className="flex items-center gap-3 cursor-pointer"
                      >
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{search}</span>
                        <Badge variant="outline" className="text-xs ml-auto">
                          {type}
                        </Badge>
                      </CommandItem>
                    ))
                  ))}
                </CommandGroup>
              )}
            </>
          )}

          {activeTab === 'saved' && (
            <>
              {savedSearches.length === 0 ? (
                <CommandEmpty>
                  <div className="flex flex-col items-center py-4">
                    <Bookmark className="h-8 w-8 text-muted-foreground mb-2" />
                    <p>No saved searches yet.</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Save searches from the Recent tab to access them quickly.
                    </p>
                  </div>
                </CommandEmpty>
              ) : (
                <CommandGroup heading="Saved Searches">
                  {savedSearches.map((search, index) => (
                    <CommandItem
                      key={`saved-${search.query}-${index}`}
                      value={`saved-${search.query}`}
                      onSelect={() => handleQuickSearch(search.query, search.type)}
                      className="flex items-center gap-3 cursor-pointer"
                    >
                      <Bookmark className="h-4 w-4 text-amber-500" />
                      <div className="flex flex-col flex-1 min-w-0">
                        <span className="font-medium truncate">{search.query}</span>
                        {search.type && (
                          <span className="text-xs text-muted-foreground">
                            {getTypeLabel(search.type)}
                          </span>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeSavedSearch(search.query);
                        }}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
            </>
          )}

          {(activeTab === 'search' || debouncedQuery.length > 0) && (
            <>
              {isLoading && debouncedQuery.length > 0 && (
                <div className="flex items-center justify-center py-6">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              )}
              {!isLoading && debouncedQuery.length > 0 && (!results || results.length === 0) && (
                <CommandEmpty>
                  <div className="flex flex-col items-center py-4">
                    <Search className="h-8 w-8 text-muted-foreground mb-2" />
                    <p>No results found for "{debouncedQuery}"</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Try different keywords or check your filters.
                    </p>
                  </div>
                </CommandEmpty>
              )}
              {!isLoading && debouncedQuery.length === 0 && (
                <CommandEmpty>
                  <div className="flex flex-col items-center py-4">
                    <Sparkles className="h-8 w-8 text-muted-foreground mb-2" />
                    <p>Start typing to search...</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Search across controls, policies, evidence, and more.
                    </p>
                  </div>
                </CommandEmpty>
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
                      {getTypeIcon(result.type)}
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
                        <span className={`text-xs px-2 py-0.5 rounded ${result.status === 'implemented' || result.status === 'approved' || result.status === 'verified'
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
            </>
          )}
        </CommandList>
      </CommandDialog >
    </>
  );
}

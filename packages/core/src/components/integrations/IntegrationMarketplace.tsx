import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@complianceos/ui/ui/card";
import { Alert } from "@complianceos/ui/ui/alert";
import { Button } from "@complianceos/ui/ui/button";
import { Badge } from "@complianceos/ui/ui/badge";
import { Input } from "@complianceos/ui/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@complianceos/ui/ui/dialog";
import { Search, Download, CheckCircle2, Loader2, AlertCircle, ExternalLink, Github, Globe, Key, Lock, ShieldCheck, ShieldAlert, Shield, Activity, Bug, Info } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { useClientContext } from "../../contexts/ClientContext";

const CATEGORY_ICONS: Record<string, string> = {
    'source-control': '🐙',
    'communication': '💬',
    'storage': '📦',
    'security': '🔒',
    'ai': '🤖',
    'compliance': '📋',
    'vendor': '🏢',
    'notification': '🔔',
    'scanner': '🔍',
    'risk': '⚠️',
    'governance': '👔',
    'utility': '🔧'
};

interface MarketplaceIntegration {
    slug: string;
    name: string;
    description: string;
    category: string;
    icon: string;
    authType: string;
    requiresCredentials?: boolean;
    actions: { id: string; name: string }[];
}

interface IntegrationMarketplaceProps {
    onConnectionCreated?: () => void;
}

export function IntegrationMarketplace({ onConnectionCreated }: IntegrationMarketplaceProps) {
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [configModalOpen, setConfigModalOpen] = useState(false);
    const [selectedIntegration, setSelectedIntegration] = useState<MarketplaceIntegration | null>(null);

    // Form state for credentials
    const [creds, setCreds] = useState({
        clientId: "",
        clientSecret: "",
        redirectUri: ""
    });

    const { selectedClientId } = useClientContext();
    const clientId = selectedClientId || 1; // Fallback to 1 if no context (though context should exist)

    // Fetch marketplace from tRPC
    const { data: marketplace, isLoading, error } = trpc.integrations.getMarketplace.useQuery();

    // Check if credentials exist for selected integration
    const { data: existingCreds, refetch: refetchCreds } = trpc.integrations.getProviderCredentials.useQuery(
        { provider: selectedIntegration?.slug || "", clientId: clientId },
        { enabled: !!selectedIntegration }
    );

    // Fetch active connections to highlight already connected services
    const { data: activeConnections = [] } = trpc.integrations.getConnections.useQuery({
        clientId
    });

    // Get providers that have credentials saved (but may not have active connection)
    const configuredProviders = new Set(
        (activeConnections as any[])
            ?.filter((c: any) => c.hasCredentials || c.isApiKey)
            .map((c: any) => c.provider) || []
    );

    // Save credentials mutation
    const saveCredsMutation = trpc.integrations.saveProviderCredentials.useMutation({
        onSuccess: () => {
            toast.success("Credentials saved successfully");
            setConfigModalOpen(false);
            if (selectedIntegration) {
                handleConnect(selectedIntegration);
            }
        },
        onError: (err) => {
            toast.error(err.message);
        }
    });

    // OAuth mutation
    const oauthMutation = trpc.integrations.getOAuthUrl.useMutation({
        onSuccess: (data) => {
            console.log("[Integrations] Received OAuth URL:", data.url);
            // API Key integrations don't need OAuth redirect - credentials were validated
            if (!data.url) {
                toast.success(data.message || "Integration connected successfully");
                refetchCreds();
                setConfigModalOpen(false);
                // Notify parent that connection was created
                if (onConnectionCreated) {
                    onConnectionCreated();
                }
                return;
            }
            window.location.href = data.url;
        },
        onError: (err) => {
            console.error("[Integrations] OAuth Mutation Error:", err);
            // If creds are missing, open the modal
            if (err.message.includes("credentials") || err.message.includes("configured")) {
                setConfigModalOpen(true);
            } else {
                toast.error(err.message);
            }
        }
    });

    const handleConnect = (integration: MarketplaceIntegration) => {
        setSelectedIntegration(integration);

        // Generate CSRF protection state and store in sessionStorage
        const state = crypto.randomUUID();
        sessionStorage.setItem(`${integration.slug}_oauth_state`, state);

        // If it requires credentials, we first check if they exist or just try the OAuth which will fail and trigger the modal
        oauthMutation.mutate({ provider: integration.slug, clientId: clientId, state });
    };

    const handleSaveCreds = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedIntegration) return;

        saveCredsMutation.mutate({
            provider: selectedIntegration.slug,
            clientId: clientId,
            credentials: {
                clientId: creds.clientId,
                clientSecret: creds.clientSecret,
                redirectUri: creds.redirectUri || undefined
            }
        });
    };

    // Filter integrations
    const integrations: MarketplaceIntegration[] = marketplace || [];

    const filteredIntegrations = integrations.filter(item => {
        const matchesSearch = !searchQuery ||
            item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.description.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesCategory = !selectedCategory || item.category === selectedCategory;

        return matchesSearch && matchesCategory;
    });

    // Get unique categories
    const categories = Array.from(new Set(integrations.map(i => i.category)));

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (error) {
        return (
            <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <span>Error loading marketplace: {error.message}</span>
            </Alert>
        );
    }

    return (
        <div className="space-y-8 mt-4">
            {/* Ambient Glows specific to this view */}
            <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
                <div className="absolute top-[10%] right-[5%] w-[40%] h-[40%] rounded-full bg-blue-500/5 blur-[100px]" />
                <div className="absolute bottom-[10%] left-[5%] w-[40%] h-[40%] rounded-full bg-purple-500/5 blur-[100px]" />
            </div>

            {/* Search and Filters Header */}
            <div className="relative z-10 flex flex-col lg:flex-row gap-6 items-center justify-between bg-white/40 backdrop-blur-md border border-slate-200 rounded-3xl p-6 shadow-sm">
                <div className="relative flex-1 w-full max-w-xl">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                    <Input
                        placeholder="Search integration database..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-12 h-12 bg-white/60 border-slate-200 rounded-2xl focus:ring-blue-500/20 text-lg font-medium"
                    />
                </div>

                <div className="flex gap-2 flex-wrap justify-center">
                    <button
                        onClick={() => setSelectedCategory(null)}
                        className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${selectedCategory === null
                            ? "bg-slate-900 text-white shadow-lg shadow-slate-900/20"
                            : "bg-white/60 text-slate-500 hover:bg-white border border-slate-200"
                            }`}
                    >
                        All Protocols
                    </button>
                    {categories.map(category => (
                        <button
                            key={category}
                            onClick={() => setSelectedCategory(category)}
                            className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${selectedCategory === category
                                ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20"
                                : "bg-white/60 text-slate-500 hover:bg-white border border-slate-200"
                                }`}
                        >
                            {CATEGORY_ICONS[category] || '📦'} {category}
                        </button>
                    ))}
                </div>
            </div>

            {/* Integration Grid */}
            <div className="relative z-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {filteredIntegrations.map((integration, index) => {
                    const isConnected = activeConnections.some(conn => conn.provider === integration.slug);
                    const isConfigured = configuredProviders.has(integration.slug);

                    return (
                        <motion.div
                            key={integration.slug}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.4, delay: index * 0.05 }}
                            className={(isConnected || isConfigured) ? "grayscale opacity-80 pointer-events-none filter blur-[0.5px]" : ""}
                        >
                            <Card className={`bg-white/60 backdrop-blur-xl relative overflow-hidden group/metric rounded-3xl hover:-translate-y-1 transition-all duration-300 shadow-sm border-slate-200 h-full flex flex-col ${(isConnected || isConfigured) ? 'border-emerald-500/30' : ''}`}>
                                <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${(isConnected || isConfigured) ? 'from-emerald-500 to-teal-600' : 'from-blue-500 to-indigo-600'}`} />
                                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-indigo-500/5 opacity-0 group-hover/metric:opacity-100 transition-opacity duration-500 pointer-events-none" />

                                <CardHeader className="pt-8 pb-4 relative z-10">
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className="p-3 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 text-slate-900 shadow-lg group-hover/metric:scale-110 transition-transform duration-300 flex items-center justify-center text-2xl">
                                                {integration.icon || CATEGORY_ICONS[integration.category] || '📦'}
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <CardTitle className="text-xl font-black text-slate-900 tracking-tight">{integration.name}</CardTitle>
                                                    {(isConnected || isConfigured) && (
                                                        <div className="flex items-center gap-1 text-[10px] font-black text-emerald-600 uppercase tracking-tighter bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                                                            <CheckCircle2 className="w-3 h-3" />
                                                            {isConnected ? 'Active' : 'Configured'}
                                                        </div>
                                                    )}
                                                </div>
                                                <Badge variant="outline" className="mt-1 border-slate-200 text-slate-500 text-[10px] font-bold uppercase tracking-tighter bg-slate-50">
                                                    {integration.authType}
                                                </Badge>
                                            </div>
                                        </div>
                                    </div>
                                </CardHeader>

                                <CardContent className="space-y-6 relative z-10 flex-1 flex flex-col pt-2">
                                    <p className="text-slate-600 text-sm leading-relaxed font-medium line-clamp-3">
                                        {integration.description}
                                    </p>

                                    <div className="flex flex-wrap gap-1.5">
                                        {integration.actions.slice(0, 3).map(action => (
                                            <span key={action.id} className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200/50">
                                                {action.name}
                                            </span>
                                        ))}
                                        {integration.actions.length > 3 && (
                                            <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-300 bg-slate-50 px-2 py-1 rounded-lg">
                                                +{integration.actions.length - 3}
                                            </span>
                                        )}
                                    </div>

                                    <div className="pt-4 mt-auto">
                                        {integration.slug === 'vulnerability-scanner' ? (
                                            <Button
                                                onClick={() => window.location.href = `/clients/${clientId}/risk/vulnerability-scanner`}
                                                className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-bold shadow-xl transition-all duration-300"
                                            >
                                                <div className="flex items-center gap-2">
                                                    <ShieldAlert className="h-5 w-5" />
                                                    {(isConnected || isConfigured) ? 'View Vulnerabilities' : 'Open Scanner'}
                                                </div>
                                            </Button>
                                        ) : integration.slug === 'siem' ? (
                                            <Button
                                                onClick={() => window.location.href = `/clients/${clientId}/risk/siem`}
                                                className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold shadow-xl transition-all duration-300"
                                            >
                                                <div className="flex items-center gap-2">
                                                    <Shield className="h-5 w-5" />
                                                    {(isConnected || isConfigured) ? 'View Alerts' : 'Open SIEM'}
                                                </div>
                                            </Button>
                                        ) : integration.slug === 'soar' ? (
                                            <Button
                                                onClick={() => window.location.href = `/clients/${clientId}/risk/soar`}
                                                className="w-full h-12 bg-purple-600 hover:bg-purple-700 text-white rounded-2xl font-bold shadow-xl transition-all duration-300"
                                            >
                                                <div className="flex items-center gap-2">
                                                    <Activity className="h-5 w-5" />
                                                    {(isConnected || isConfigured) ? 'View Cases' : 'Open SOAR'}
                                                </div>
                                            </Button>
                                        ) : integration.slug === 'threat-intel' ? (
                                            <Button
                                                onClick={() => window.location.href = `/clients/${clientId}/risk/threat-intel`}
                                                className="w-full h-12 bg-orange-600 hover:bg-orange-700 text-white rounded-2xl font-bold shadow-xl transition-all duration-300"
                                            >
                                                <div className="flex items-center gap-2">
                                                    <Bug className="h-5 w-5" />
                                                    {(isConnected || isConfigured) ? 'View IOCs' : 'Open Threat Intel'}
                                                </div>
                                            </Button>
                                        ) : (
                                            <Button
                                                onClick={() => handleConnect(integration)}
                                                disabled={oauthMutation.isPending}
                                                className="w-full h-12 bg-slate-900 hover:bg-blue-600 text-white rounded-2xl font-bold shadow-xl transition-all duration-300 group-hover/metric:shadow-blue-500/20"
                                            >
                                                {oauthMutation.isPending ? (
                                                    <Loader2 className="h-5 w-5 animate-spin" />
                                                ) : (isConnected || isConfigured) ? (
                                                    <div className="flex items-center gap-2">
                                                        <CheckCircle2 className="h-5 w-5" />
                                                        {(isConnected || isConfigured) ? 'Active' : 'Infrastructure Active'}
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center gap-2">
                                                        <Download className="h-5 w-5 mr-2" />
                                                        Deploy Connection
                                                    </div>
                                                )}
                                            </Button>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>
                    )
                })}
            </div>

            {/* Credentials Modal */}
            <Dialog open={configModalOpen} onOpenChange={setConfigModalOpen}>
                <DialogContent className="sm:max-w-[550px] bg-white/95 backdrop-blur-2xl border-slate-200 rounded-[2rem] shadow-2xl p-0 overflow-hidden">
                    <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-600" />

                    <DialogHeader className="p-8 pb-0">
                        <div className="flex items-center gap-4 mb-2">
                            <div className="p-3 rounded-2xl bg-blue-50 text-blue-600">
                                {selectedIntegration?.icon ? (
                                    <span className="text-2xl">{selectedIntegration.icon}</span>
                                ) : (
                                    <ShieldCheck className="h-6 w-6" />
                                )}
                            </div>
                            <div>
                                <DialogTitle className="text-2xl font-black text-slate-900 tracking-tight">
                                    Configure {selectedIntegration?.name}
                                </DialogTitle>
                                <DialogDescription className="text-slate-500 font-medium">
                                    Provide your organization's OAuth credentials to enable this junction.
                                </DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>

                    <form onSubmit={handleSaveCreds} className="p-8 pt-6 space-y-6">
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1">
                                    OAuth Client ID
                                </label>
                                <div className="relative">
                                    <Key className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                    <Input
                                        required
                                        placeholder={`Enter your ${selectedIntegration?.name} Client ID`}
                                        value={creds.clientId}
                                        onChange={(e) => setCreds({ ...creds, clientId: e.target.value })}
                                        className="h-12 pl-12 bg-slate-50 border-slate-200 rounded-xl focus:ring-blue-500/20 font-mono text-sm"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1">
                                    OAuth Client Secret
                                </label>
                                <div className="relative">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                    <Input
                                        required
                                        type="password"
                                        placeholder={`Enter your ${selectedIntegration?.name} Client Secret`}
                                        value={creds.clientSecret}
                                        onChange={(e) => setCreds({ ...creds, clientSecret: e.target.value })}
                                        className="h-12 pl-12 bg-slate-50 border-slate-200 rounded-xl focus:ring-blue-500/20 font-mono text-sm"
                                    />
                                </div>
                            </div>

                            <div className="p-4 rounded-2xl bg-blue-50/50 border border-blue-100 flex gap-3">
                                <Info className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
                                <div className="text-xs text-blue-700 leading-relaxed font-medium">
                                    To use your own GitHub App, set the Authorization callback URL to:
                                    <code className="block mt-2 p-2 bg-white rounded-lg border border-blue-200 text-blue-900 font-bold overflow-x-auto whitespace-nowrap">
                                        {window.location.origin}/api/oauth/github/callback
                                    </code>
                                </div>
                            </div>
                        </div>

                        <DialogFooter className="flex-col sm:flex-row gap-3 pt-4">
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={() => setConfigModalOpen(false)}
                                className="h-12 rounded-xl font-bold text-slate-500 hover:text-slate-900"
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={saveCredsMutation.isPending}
                                className="h-12 px-8 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-extrabold shadow-lg shadow-blue-600/20 flex-1"
                            >
                                {saveCredsMutation.isPending ? (
                                    <Loader2 className="h-5 w-5 animate-spin" />
                                ) : (
                                    "Save & Authorize"
                                )}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Popular / Infrastructure Sections */}
            <div className="relative z-10 mt-16 pt-12 border-t border-slate-200">
                <div className="flex items-center gap-4 mb-8">
                    <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600">
                        <Globe className="h-6 w-6" />
                    </div>
                    <div>
                        <h3 className="text-2xl font-black text-slate-900 tracking-tight">Essential Infrastructure</h3>
                        <p className="text-slate-500 font-medium">Core nodes for security and compliance monitoring.</p>
                    </div>
                </div>

                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                    <InfrastructureCard
                        icon="🐙"
                        name="GitHub"
                        description="Sync repositories and security alerts."
                        status="PRE-VALIDATED"
                    />
                    <InfrastructureCard
                        icon="💬"
                        name="Slack"
                        description="Incident alerts and notifications."
                        status="READY"
                    />
                    <InfrastructureCard
                        icon="📋"
                        name="Jira"
                        description="Workflow and task synchronization."
                        status="READY"
                    />
                    <InfrastructureCard
                        icon="☁️"
                        name="Cloud Hub"
                        description="AWS/Azure/GCP identity and config."
                        status="BETA"
                    />
                </div>
            </div>
        </div>
    );
}

function InfrastructureCard({ icon, name, description, status }: { icon: string, name: string, description: string, status: string }) {
    return (
        <Card className="bg-white/40 backdrop-blur-md border border-slate-200 rounded-3xl p-6 hover:shadow-lg transition-all border-dashed group">
            <div className="text-center space-y-4">
                <div className="text-4xl group-hover:scale-110 transition-transform duration-300">{icon}</div>
                <div>
                    <h4 className="font-extrabold text-slate-900 tracking-tight">{name}</h4>
                    <p className="text-xs text-slate-500 mt-1 font-medium">{description}</p>
                </div>
                <Badge variant="outline" className="bg-slate-50 text-slate-400 border-slate-200 text-[10px] font-bold uppercase tracking-widest">
                    {status}
                </Badge>
            </div>
        </Card>
    );
}

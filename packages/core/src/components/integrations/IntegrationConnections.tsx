import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@complianceos/ui/ui/card";
import { Button } from "@complianceos/ui/ui/button";
import { Badge } from "@complianceos/ui/ui/badge";
import { Input } from "@complianceos/ui/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@complianceos/ui/ui/dialog";
import { Search, Plus, Settings, Trash2, RefreshCw, CheckCircle2, XCircle, AlertCircle, Clock, Database, Globe, Shield } from "lucide-react";
import { toast } from "sonner";
import { getBuiltInIntegrations } from "@/lib/integrations";
import type { IntegrationManifest, IntegrationConnection } from "@/lib/integrations/types";
import { motion } from "framer-motion";
import { trpc } from "@/lib/trpc";
import { useClientContext } from "@/contexts/ClientContext";

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

const CATEGORY_COLORS: Record<string, string> = {
    'source-control': 'from-slate-700 to-slate-900',
    'communication': 'from-blue-500 to-indigo-600',
    'storage': 'from-amber-400 to-orange-500',
    'security': 'from-purple-500 to-fuchsia-600',
    'ai': 'from-emerald-400 to-teal-500',
};

export function IntegrationConnections() {
    const { selectedClientId } = useClientContext();
    const clientId = selectedClientId || 1;
    const [searchQuery, setSearchQuery] = useState("");
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [editingConnection, setEditingConnection] = useState<any>(null);
    const [isSettingsDialogOpen, setIsSettingsDialogOpen] = useState(false);

    const { data: connections = [], refetch } = trpc.integrations.getConnections.useQuery({
        clientId
    });

    const disconnectMutation = trpc.integrations.disconnectIntegration.useMutation({
        onSuccess: () => {
            toast.success("Integration disconnected");
            refetch();
        },
        onError: (err) => {
            toast.error(`Failed to disconnect: ${err.message}`);
        }
    });

    const builtInIntegrations = getBuiltInIntegrations();

    const filteredConnections = connections.filter(conn => {
        const integration = builtInIntegrations.find(i => i.slug === conn.provider);
        const name = integration?.name || conn.provider;
        return !searchQuery || name.toLowerCase().includes(searchQuery.toLowerCase());
    });

    const handleDisconnect = (connectionId: number, provider?: string) => {
        disconnectMutation.mutate({ id: connectionId, clientId, provider });
    };

    const handleSync = (connectionId: number) => {
        toast.info("Syncing integration data...");
        // In production, this would trigger a sync
        setTimeout(() => {
            toast.success("Sync completed");
            refetch();
        }, 1500);
    };

    const getStatusIndicator = (status: IntegrationConnection['status']) => {
        const colors = {
            connected: 'bg-emerald-500',
            error: 'bg-rose-500',
            disconnected: 'bg-slate-400',
        };
        const color = colors[status as keyof typeof colors] || colors.disconnected;

        return (
            <div className="flex items-center gap-2">
                <span className="flex h-2 w-2 relative">
                    <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${color}`}></span>
                    <span className={`relative inline-flex rounded-full h-2 w-2 ${color}`}></span>
                </span>
                <span className={`text-[10px] font-bold uppercase tracking-widest ${color.replace('bg-', 'text-')}`}>
                    {status}
                </span>
            </div>
        );
    };

    return (
        <div className="space-y-8 mt-4">
            {/* Header / Actions */}
            <div className="flex flex-col lg:flex-row gap-6 items-center justify-between bg-white/40 backdrop-blur-md border border-slate-200 rounded-3xl p-6 shadow-sm">
                <div className="relative flex-1 w-full max-w-xl">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                    <Input
                        placeholder="Search your connected nodes..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-12 h-12 bg-white/60 border-slate-200 rounded-2xl focus:ring-blue-500/20 text-lg font-medium"
                    />
                </div>
                <Button
                    onClick={() => setIsAddDialogOpen(true)}
                    className="h-12 px-6 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold shadow-xl transition-all hover:scale-105 active:scale-95"
                >
                    <Plus className="h-5 w-5 mr-2" />
                    Provision New Node
                </Button>
            </div>

            {/* Connections List */}
            {filteredConnections.length === 0 ? (
                <div className="text-center py-24 bg-white/40 backdrop-blur-md border border-slate-200 border-dashed rounded-[3rem]">
                    <div className="p-6 rounded-full bg-slate-100 inline-block mb-6">
                        <Globe className="h-12 w-12 text-slate-300" />
                    </div>
                    <h3 className="text-2xl font-black text-slate-900 tracking-tight mb-2">No active connections</h3>
                    <p className="text-slate-500 font-medium max-w-sm mx-auto mb-8">
                        Your workspace is currently isolated. Connect to an external service to begin automated monitoring.
                    </p>
                    <Button
                        onClick={() => setIsAddDialogOpen(true)}
                        variant="outline"
                        className="h-11 px-8 rounded-xl font-bold border-slate-200 hover:bg-slate-50"
                    >
                        Browse Marketplace
                    </Button>
                </div>
            ) : (
                <div className="grid gap-6">
                    {filteredConnections.map((connection, index) => {
                        const integration = builtInIntegrations.find(i => i.slug === connection.integrationSlug);

                        return (
                            <motion.div
                                key={connection.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.4, delay: index * 0.1 }}
                            >
                                <Card className="bg-white/60 backdrop-blur-xl relative overflow-hidden group/item rounded-3xl shadow-sm border-slate-200">
                                    <div className={`absolute inset-y-0 left-0 w-1 bg-gradient-to-b ${CATEGORY_COLORS[integration?.category || ''] || 'from-slate-400 to-slate-600'}`} />

                                    <CardContent className="p-6 relative z-10">
                                        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                                            <div className="flex items-center gap-6 flex-1 w-full">
                                                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${CATEGORY_COLORS[integration?.category || ''] || 'from-slate-100 to-slate-200'} text-white shadow-lg flex items-center justify-center text-3xl group-hover/item:scale-110 transition-transform duration-300`}>
                                                    {integration?.icon || CATEGORY_ICONS[integration?.category || ''] || '📦'}
                                                </div>
                                                <div>
                                                    <h4 className="text-xl font-black text-slate-900 tracking-tight">{integration?.name || connection.provider}</h4>
                                                    <div className="flex items-center gap-3 mt-1">
                                                        <span className="text-xs font-bold text-slate-500 uppercase tracking-widest bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200/50">
                                                            {integration?.name || connection.provider}
                                                        </span>
                                                        <div className="h-1 w-1 rounded-full bg-slate-300" />
                                                        <span className="text-xs font-medium text-slate-400 flex items-center gap-1.5">
                                                            <Clock className="w-3.5 h-3.5" />
                                                            Last Sync: {new Date(connection.updatedAt || connection.createdAt || '').toLocaleDateString()}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex flex-col sm:flex-row items-center gap-6 w-full md:w-auto">
                                                <div className="px-4 py-2 bg-slate-50 rounded-2xl border border-slate-200/50">
                                                    {getStatusIndicator('connected')}
                                                </div>

                                                <div className="flex gap-2">
                                                    <Button
                                                        variant="outline"
                                                        size="icon"
                                                        className="w-11 h-11 rounded-xl border-slate-200 hover:bg-blue-50 hover:text-blue-600 transition-all shadow-sm"
                                                        onClick={() => handleSync(connection.id)}
                                                    >
                                                        <RefreshCw className="h-5 w-5" />
                                                    </Button>
                                                    <Button
                                                        variant="outline"
                                                        size="icon"
                                                        className="w-11 h-11 rounded-xl border-slate-200 hover:bg-slate-50 transition-all shadow-sm"
                                                        onClick={() => {
                                                            setEditingConnection(connection);
                                                            setIsSettingsDialogOpen(true);
                                                        }}
                                                    >
                                                        <Settings className="h-5 w-5 text-slate-600" />
                                                    </Button>
                                                    <Button
                                                        variant="outline"
                                                        size="icon"
                                                        className="w-11 h-11 rounded-xl border-slate-200 hover:bg-rose-50 hover:text-rose-600 transition-all shadow-sm group/del"
                                                        onClick={() => handleDisconnect(connection.id, connection.provider)}
                                                    >
                                                        <Trash2 className="h-5 w-5" />
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>

                                        {connection.errorMessage && (
                                            <div className="mt-6 p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-start gap-3">
                                                <AlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
                                                <p className="text-sm text-rose-600 font-medium leading-relaxed">{connection.errorMessage}</p>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            </motion.div>
                        );
                    })}
                </div>
            )}

            {/* Simple Add Portal */}
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogContent className="sm:max-w-[600px] border-none bg-white/80 backdrop-blur-2xl rounded-[2.5rem] shadow-2xl p-0 overflow-hidden">
                    <div className="p-8 space-y-8">
                        <div>
                            <h2 className="text-3xl font-black text-slate-900 tracking-tight">Provision Infrastructure</h2>
                            <p className="text-slate-500 font-medium mt-1">Select a core node to instantiate in your secure environment.</p>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            {builtInIntegrations.slice(0, 4).map(integration => (
                                <Card
                                    key={integration.slug}
                                    className="cursor-pointer bg-white border-slate-200 hover:border-blue-500/50 hover:shadow-xl hover:shadow-blue-500/5 transition-all rounded-3xl group"
                                    onClick={() => {
                                        setIsAddDialogOpen(false);
                                        toast.success(`Provisioning ${integration.name} environment...`);
                                    }}
                                >
                                    <CardContent className="p-6 flex flex-col items-center text-center">
                                        <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center text-3xl mb-4 group-hover:scale-110 transition-transform">
                                            {integration.icon || CATEGORY_ICONS[integration.category] || '📦'}
                                        </div>
                                        <span className="font-extrabold text-slate-900 tracking-tight">{integration.name}</span>
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Secure Protocol</span>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>

                        <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                            <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">More options in Marketplace</p>
                            <Button variant="ghost" className="text-blue-600 font-bold" onClick={() => setIsAddDialogOpen(false)}>
                                Close Portal
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Connection Settings Dialog */}
            <Dialog open={isSettingsDialogOpen} onOpenChange={setIsSettingsDialogOpen}>
                <DialogContent className="sm:max-w-[500px] bg-white/95 backdrop-blur-2xl border-slate-200 rounded-[2rem] shadow-2xl p-0 overflow-hidden">
                    <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-600" />
                    <DialogHeader className="p-8 pb-4">
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-2xl bg-blue-50 text-blue-600">
                                <Settings className="h-6 w-6" />
                            </div>
                            <div>
                                <DialogTitle className="text-2xl font-black text-slate-900 tracking-tight">
                                    {editingConnection?.provider ? editingConnection.provider.charAt(0).toUpperCase() + editingConnection.provider.slice(1).replace('-', ' ') : 'Integration'} Settings
                                </DialogTitle>
                                <DialogDescription className="text-slate-500 font-medium">
                                    Configure connection options and sync settings
                                </DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>

                    <div className="px-8 pb-8 space-y-6">
                        {/* Connection Info */}
                        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                            <div className="grid gap-3">
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-500 font-medium">Status</span>
                                    <span className="font-bold text-emerald-600 flex items-center gap-1">
                                        <CheckCircle2 className="h-4 w-4" />
                                        Connected
                                    </span>
                                </div>
                                {editingConnection?.externalAccountId && (
                                    <div className="flex justify-between text-sm">
                                        <span className="text-slate-500 font-medium">Account ID</span>
                                        <span className="font-mono text-xs">{editingConnection.externalAccountId}</span>
                                    </div>
                                )}
                                {editingConnection?.metadata?.email && (
                                    <div className="flex justify-between text-sm">
                                        <span className="text-slate-500 font-medium">Email</span>
                                        <span className="text-xs">{editingConnection.metadata.email}</span>
                                    </div>
                                )}
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-500 font-medium">Connected</span>
                                    <span className="text-xs">
                                        {editingConnection?.createdAt ? new Date(editingConnection.createdAt).toLocaleDateString() : 'N/A'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="space-y-3">
                            <Button
                                variant="outline"
                                className="w-full h-12 justify-start gap-3"
                                onClick={() => {
                                    // Re-authenticate / reconnect
                                    toast.info("Please use Marketplace to reconnect");
                                    setIsSettingsDialogOpen(false);
                                }}
                            >
                                <RefreshCw className="h-4 w-4" />
                                Re-authenticate
                            </Button>

                            <Button
                                variant="outline"
                                className="w-full h-12 justify-start gap-3 text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                                onClick={() => {
                                    if (editingConnection?.id) {
                                        disconnectMutation.mutate({ id: editingConnection.id, clientId, provider: editingConnection.provider });
                                        setIsSettingsDialogOpen(false);
                                    }
                                }}
                            >
                                <Trash2 className="h-4 w-4" />
                                Disconnect
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}

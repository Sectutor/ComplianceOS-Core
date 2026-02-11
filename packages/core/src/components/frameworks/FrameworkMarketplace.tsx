import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@complianceos/ui/ui/card";
import { Button } from "@complianceos/ui/ui/button";
import { Badge } from "@complianceos/ui/ui/badge";
import { Shield, Download, Search, CheckCircle2, Loader2, AlertCircle } from "lucide-react";
import { Input } from "@complianceos/ui/ui/input";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { Alert, AlertDescription, AlertTitle } from "@complianceos/ui/ui/alert";

export function FrameworkMarketplace() {
    const [searchQuery, setSearchQuery] = useState("");
    const [installingId, setInstallingId] = useState<string | null>(null);

    const { data: registry, isLoading, error } = trpc.frameworkPlugins.listRegistry.useQuery();

    const utils = trpc.useContext();

    const installMutation = trpc.frameworkPlugins.installPlugin.useMutation({
        onSuccess: (data) => {
            toast.success(`Successfully installed framework`);
            setInstallingId(null);
            utils.frameworks.list.invalidate(); // Refresh active frameworks
        },
        onError: (err) => {
            toast.error(`Installation failed: ${err.message}`);
            setInstallingId(null);
        }
    });

    const handleInstall = (pluginId: string) => {
        setInstallingId(pluginId);
        installMutation.mutate({ pluginId });
    };

    const filteredPlugins = registry?.plugins.filter((p: any) =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.tags.some((t: string) => t.toLowerCase().includes(searchQuery.toLowerCase()))
    ) || [];

    if (error) {
        return (
            <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error loading marketplace</AlertTitle>
                <AlertDescription>{error.message}</AlertDescription>
            </Alert>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-medium">Framework Marketplace</h3>
                    <p className="text-sm text-muted-foreground">
                        Browse and install official and community-contributed compliance frameworks.
                    </p>
                </div>
                <div className="relative w-72">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search frameworks..."
                        className="pl-8"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>

            {isLoading ? (
                <div className="flex justify-center p-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            ) : filteredPlugins.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed rounded-lg">
                    <p className="text-muted-foreground">No frameworks found matching your search.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredPlugins.map((plugin: any) => (
                        <Card key={plugin.id} className="flex flex-col h-full hover:shadow-md transition-shadow">
                            <CardHeader>
                                <div className="flex justify-between items-start">
                                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                                        <Shield className="h-6 w-6" />
                                    </div>
                                    <Badge variant="secondary">{plugin.version}</Badge>
                                </div>
                                <CardTitle className="mt-4">{plugin.name}</CardTitle>
                                <CardDescription className="line-clamp-2 min-h-[40px]">
                                    {plugin.description}
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="flex-1 flex flex-col justify-end">
                                <div className="flex flex-wrap gap-2 mb-4">
                                    {plugin.tags.slice(0, 3).map((tag: string) => (
                                        <Badge key={tag} variant="outline" className="text-xs">
                                            {tag}
                                        </Badge>
                                    ))}
                                    {plugin.tags.length > 3 && (
                                        <Badge variant="outline" className="text-xs">+{plugin.tags.length - 3}</Badge>
                                    )}
                                </div>
                                <Button
                                    className="w-full"
                                    onClick={() => handleInstall(plugin.id)}
                                    disabled={installingId === plugin.id}
                                >
                                    {installingId === plugin.id ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Installing...
                                        </>
                                    ) : (
                                        <>
                                            <Download className="mr-2 h-4 w-4" />
                                            Install Framework
                                        </>
                                    )}
                                </Button>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}

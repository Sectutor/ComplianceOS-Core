import { useState } from 'react';
import {
    Shield,
    AlertTriangle,
    Server,
    Laptop,
    Cloud,
    Database,
    Globe,
    Cpu,
    ChevronRight,
    Loader2,
    X,
    Link2,
    Unlink
} from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { Button } from '@complianceos/ui/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@complianceos/ui/ui/card';
import { Badge } from '@complianceos/ui/ui/badge';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@complianceos/ui/ui/table";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@complianceos/ui/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@complianceos/ui/ui/select";
import { Input } from '@complianceos/ui/ui/input';
import { Label } from '@complianceos/ui/ui/label';

interface AffectedAssetsWidgetProps {
    clientId: number;
}

const assetTypeIcons: Record<string, any> = {
    'Hardware': Server,
    'Software': Database,
    'Cloud': Cloud,
    'Network': Globe,
    'Server': Server,
    'Workstation': Laptop,
    'default': Cpu,
};

const impactColors: Record<string, string> = {
    'critical': 'bg-red-100 text-red-800 border-red-200',
    'high': 'bg-orange-100 text-orange-800 border-orange-200',
    'medium': 'bg-yellow-100 text-yellow-800 border-yellow-200',
    'low': 'bg-green-100 text-green-800 border-green-200',
};

export function AffectedAssetsWidget({ clientId }: AffectedAssetsWidgetProps) {
    const [isLinkDialogOpen, setIsLinkDialogOpen] = useState(false);
    const [selectedThreatId, setSelectedThreatId] = useState<string>('');
    const [selectedAssetId, setSelectedAssetId] = useState<string>('');
    const [impactLevel, setImpactLevel] = useState<string>('medium');

    const { data: summary, isLoading: isLoadingSummary, refetch } = trpc.threatIntel.getAffectedAssetsSummary.useQuery(
        { clientId },
        { enabled: !!clientId }
    );

    const { data: threats } = trpc.risks.getThreats.useQuery(
        { clientId },
        { enabled: !!clientId }
    );

    const { data: assets } = trpc.assets.getAll.useQuery(
        { clientId },
        { enabled: !!clientId }
    );

    const linkMutation = trpc.threatIntel.linkAssetToThreat.useMutation({
        onSuccess: () => {
            refetch();
            setIsLinkDialogOpen(false);
            setSelectedThreatId('');
            setSelectedAssetId('');
            setImpactLevel('medium');
        }
    });

    const unlinkMutation = trpc.threatIntel.unlinkAssetFromThreat.useMutation({
        onSuccess: () => refetch()
    });

    const handleLinkAsset = () => {
        if (!selectedThreatId || !selectedAssetId) return;

        linkMutation.mutate({
            clientId,
            threatId: parseInt(selectedThreatId),
            assetId: parseInt(selectedAssetId),
            impactLevel: impactLevel as 'low' | 'medium' | 'high' | 'critical'
        });
    };

    const handleUnlink = (mappingId: number) => {
        if (confirm('Are you sure you want to remove this threat-asset mapping?')) {
            unlinkMutation.mutate({ mappingId });
        }
    };

    const getAssetIcon = (type: string) => {
        const Icon = assetTypeIcons[type] || assetTypeIcons.default;
        return <Icon className="h-4 w-4" />;
    };

    if (isLoadingSummary) {
        return (
            <Card className="col-span-2">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Shield className="h-5 w-5 text-indigo-600" />
                        Affected Assets
                    </CardTitle>
                    <CardDescription>Assets impacted by current threats</CardDescription>
                </CardHeader>
                <CardContent className="flex items-center justify-center h-40">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </CardContent>
            </Card>
        );
    }

    const { affectedAssetsCount = 0, activeThreatsCount = 0, byImpactLevel = [], recentMappings = [] } = summary || {};

    return (
        <Card className="col-span-2">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div>
                    <CardTitle className="flex items-center gap-2 text-lg">
                        <Shield className="h-5 w-5 text-indigo-600" />
                        Affected Assets
                    </CardTitle>
                    <CardDescription>Assets impacted by current threats</CardDescription>
                </div>
                <Dialog open={isLinkDialogOpen} onOpenChange={setIsLinkDialogOpen}>
                    <DialogTrigger asChild>
                        <Button size="sm" className="gap-1">
                            <Link2 className="h-4 w-4" />
                            Link Asset
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Link Asset to Threat</DialogTitle>
                            <DialogDescription>
                                Associate an asset with a threat to track which assets are at risk.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label>Select Threat</Label>
                                <Select value={selectedThreatId} onValueChange={setSelectedThreatId}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select a threat" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {threats?.map((threat: any) => (
                                            <SelectItem key={threat.id} value={threat.id.toString()}>
                                                {threat.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid gap-2">
                                <Label>Select Asset</Label>
                                <Select value={selectedAssetId} onValueChange={setSelectedAssetId}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select an asset" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {assets?.map((asset: any) => (
                                            <SelectItem key={asset.id} value={asset.id.toString()}>
                                                {asset.name} ({asset.type})
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid gap-2">
                                <Label>Impact Level</Label>
                                <Select value={impactLevel} onValueChange={setImpactLevel}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="low">Low</SelectItem>
                                        <SelectItem value="medium">Medium</SelectItem>
                                        <SelectItem value="high">High</SelectItem>
                                        <SelectItem value="critical">Critical</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsLinkDialogOpen(false)}>
                                Cancel
                            </Button>
                            <Button
                                onClick={handleLinkAsset}
                                disabled={!selectedThreatId || !selectedAssetId || linkMutation.isPending}
                            >
                                {linkMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Link Asset
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </CardHeader>
            <CardContent>
                {/* Summary Stats */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="bg-muted/50 rounded-lg p-3">
                        <div className="text-2xl font-bold">{affectedAssetsCount}</div>
                        <div className="text-xs text-muted-foreground">Affected Assets</div>
                    </div>
                    <div className="bg-muted/50 rounded-lg p-3">
                        <div className="text-2xl font-bold">{activeThreatsCount}</div>
                        <div className="text-xs text-muted-foreground">Active Threats</div>
                    </div>
                </div>

                {/* Impact Level Summary */}
                {byImpactLevel.length > 0 && (
                    <div className="flex gap-2 mb-4">
                        {byImpactLevel.map((item: any) => (
                            <Badge
                                key={item.impactLevel}
                                variant="outline"
                                className={impactColors[item.impactLevel] || 'bg-gray-100'}
                            >
                                {item.impactLevel}: {item.count}
                            </Badge>
                        ))}
                    </div>
                )}

                {/* Recent Mappings Table */}
                {recentMappings.length > 0 ? (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Threat</TableHead>
                                <TableHead>Asset</TableHead>
                                <TableHead>Impact</TableHead>
                                <TableHead className="w-10"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {recentMappings.slice(0, 5).map((mapping: any) => (
                                <TableRow key={mapping.mappingId}>
                                    <TableCell className="font-medium">
                                        <div className="flex items-center gap-2">
                                            <AlertTriangle className="h-4 w-4 text-amber-500" />
                                            {mapping.threatName}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            {getAssetIcon(mapping.assetName)}
                                            {mapping.assetName}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge
                                            variant="outline"
                                            className={impactColors[mapping.impactLevel] || 'bg-gray-100'}
                                        >
                                            {mapping.impactLevel}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8"
                                            onClick={() => handleUnlink(mapping.mappingId)}
                                        >
                                            <Unlink className="h-4 w-4" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                ) : (
                    <div className="text-center py-8 text-muted-foreground">
                        <Shield className="h-12 w-12 mx-auto mb-2 opacity-50" />
                        <p>No assets linked to threats yet</p>
                        <p className="text-sm">Link assets to threats to see affected assets here</p>
                    </div>
                )}

                {recentMappings.length > 5 && (
                    <Button variant="ghost" size="sm" className="w-full mt-2">
                        View All <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                )}
            </CardContent>
        </Card>
    );
}

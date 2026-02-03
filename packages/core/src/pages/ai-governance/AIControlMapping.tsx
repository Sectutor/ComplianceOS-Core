
import React, { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@complianceos/ui/ui/card';
import { Button } from '@complianceos/ui/ui/button';
import { Badge } from '@complianceos/ui/ui/badge';
import { Search, Link, Unlink, CheckCircle2 } from 'lucide-react';
import { Input } from '@complianceos/ui/ui/input';
import { toast } from 'sonner';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@complianceos/ui/ui/select';

interface AIControlMappingProps {
    aiSystemId: number;
    clientId: number;
}

export const AIControlMapping = ({ aiSystemId, clientId }: AIControlMappingProps) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedFramework, setSelectedFramework] = useState("NIST AI RMF");

    const { data: availableFrameworks } = trpc.controls.getAvailableFrameworks.useQuery({ clientId });

    // Fetch controls for selected framework
    const { data: frameworkControls, isLoading: loadingControls } = trpc.controls.list.useQuery({
        framework: selectedFramework,
        clientId: clientId
    });

    const { data: mappedControls, refetch: refetchMapped } = trpc.ai.systems.getMappedControls.useQuery({
        aiSystemId
    });

    const mapControl = trpc.ai.systems.mapControl.useMutation({
        onSuccess: () => {
            toast.success("Control mapped successfully");
            refetchMapped();
        }
    });

    const unmapControl = trpc.ai.systems.unmapControl.useMutation({
        onSuccess: () => {
            toast.success("Control unmapped");
            refetchMapped();
        }
    });

    const updateControlStatus = trpc.ai.systems.updateControlStatus.useMutation({
        onSuccess: () => {
            toast.success("Control status updated");
            refetchMapped();
        }
    });

    const isMapped = (controlId: number) => {
        return mappedControls?.find(m => m.controlId === controlId);
    };

    const filteredControls = frameworkControls?.filter(c =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.controlId.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder={`Search ${selectedFramework} controls...`}
                        className="pl-10"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="w-[200px]">
                    <Select value={selectedFramework} onValueChange={setSelectedFramework}>
                        <SelectTrigger>
                            <SelectValue placeholder="Select Framework" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="NIST AI RMF">NIST AI RMF</SelectItem>
                            {availableFrameworks?.filter((f: string) => f !== "NIST AI RMF").map((fw: string) => (
                                <SelectItem key={fw} value={fw}>{fw}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-primary/5 rounded-lg border border-primary/20">
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium">{mappedControls?.length || 0} Controls Mapped</span>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-4 overflow-y-auto max-h-[600px] pr-2 custom-scrollbar">
                {filteredControls?.map((control) => {
                    const mapping = isMapped(control.id);
                    const isMappedBool = !!mapping;

                    return (
                        <Card key={control.id} className={`transition-all ${isMappedBool ? 'border-primary/50 bg-primary/5 shadow-sm' : 'border-muted/40 opacity-90 hover:opacity-100'}`}>
                            <CardHeader className="p-4 flex flex-col gap-4">
                                <div className="flex flex-row items-start justify-between">
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                            <Badge variant="outline" className="font-mono bg-background">{control.controlId}</Badge>
                                            <CardTitle className="text-base">{control.name}</CardTitle>
                                        </div>
                                        <CardDescription className="line-clamp-2 text-xs md:text-sm max-w-2xl">
                                            {control.description}
                                        </CardDescription>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {isMappedBool ? (
                                            <>
                                                <Select
                                                    value={mapping?.status || 'mapped'}
                                                    onValueChange={(val) => updateControlStatus.mutate({
                                                        aiSystemId,
                                                        controlId: control.id,
                                                        status: val
                                                    })}
                                                >
                                                    <SelectTrigger className="w-[140px] h-8 text-xs bg-background">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="mapped">Mapped</SelectItem>
                                                        <SelectItem value="implemented">Implemented</SelectItem>
                                                        <SelectItem value="verified">Verified</SelectItem>
                                                        <SelectItem value="not_applicable">Not Applicable</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                                    onClick={() => unmapControl.mutate({ aiSystemId, controlId: control.id })}
                                                    disabled={unmapControl.isPending}
                                                >
                                                    <Unlink className="h-4 w-4" />
                                                </Button>
                                            </>
                                        ) : (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => mapControl.mutate({ aiSystemId, controlId: control.id })}
                                                disabled={mapControl.isPending}
                                                className="gap-2"
                                            >
                                                <Link className="h-3 w-3" /> Map Control
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </CardHeader>
                        </Card>
                    );
                })}

                {filteredControls?.length === 0 && (
                    <div className="text-center py-10 text-muted-foreground">
                        No controls found matching your search.
                    </div>
                )}
            </div>
        </div>
    );
};

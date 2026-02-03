import React, { useState } from 'react';
import { Button } from '@complianceos/ui/ui/button';
import { EnhancedDialog } from '@complianceos/ui/ui/enhanced-dialog';
import { Label } from '@complianceos/ui/ui/label';
import { Input } from '@complianceos/ui/ui/input';
import { Textarea } from '@complianceos/ui/ui/textarea';
import { trpc } from '@/lib/trpc';
import { Shield, Search, Check } from 'lucide-react';

interface RiskTreatmentDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    riskId: number;
    clientId: number;
    onSuccess: () => void;
}

export function RiskTreatmentDialog({ open, onOpenChange, riskId, clientId, onSuccess }: RiskTreatmentDialogProps) {
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedControlIds, setSelectedControlIds] = useState<number[]>([]);
    const [justification, setJustification] = useState('');

    // Fetch available controls (simple list for now, ideally paginated search)
    const { data: controls } = trpc.clientControls.list.useQuery({ clientId }, { enabled: open });

    React.useEffect(() => {
        if (open) {
            setSelectedControlIds([]);
            setJustification('');
            setSearchTerm('');
        }
    }, [open]);

    // Filter controls locally for this prototype
    const filteredControls = controls?.filter(c =>
        c.control?.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.control?.name?.toLowerCase().includes(searchTerm.toLowerCase())
    ).slice(0, 5); // Limit resultss

    const createTreatmentMutation = trpc.risks.createRiskTreatment.useMutation();
    const linkControlMutation = trpc.risks.linkControl.useMutation();

    const handleSubmit = async () => {
        if (selectedControlIds.length === 0) return;

        setLoading(true);
        try {
            // Find selected control details for the strategy description
            const selectedControls = controls?.filter(c => selectedControlIds.includes(c.clientControl.id)) || [];
            const strategyName = `Implement controls: ${selectedControls.map(c => c.control?.controlId).join(', ')}`;

            const treatment = await createTreatmentMutation.mutateAsync({
                clientId,
                riskAssessmentId: riskId, // Supporting both ID types for now in backend or need careful routing
                riskScenarioId: riskId,
                treatmentType: 'mitigate',
                strategy: strategyName,
                justification
            } as any);

            // Link all selected controls
            await Promise.all(selectedControlIds.map(controlId =>
                linkControlMutation.mutateAsync({
                    clientId,
                    treatmentId: treatment.id,
                    controlId: controlId
                })
            ));

            onSuccess();
            onOpenChange(false);
            setSelectedControlIds([]);
            setJustification('');
            setSearchTerm('');
        } catch (error) {
            console.error("Failed to link control", error);
        } finally {
            setLoading(false);
        }
    };

    const toggleSelection = (id: number) => {
        setSelectedControlIds(prev =>
            prev.includes(id) ? prev.filter(existingId => existingId !== id) : [...prev, id]
        );
    };

    return (
        <EnhancedDialog
            open={open}
            onOpenChange={onOpenChange}
            title="Treat Risk with Controls"
            description="Select controls to mitigate this risk."
            size="md"
            footer={
                <>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button onClick={handleSubmit} disabled={loading || selectedControlIds.length === 0}>
                        {loading ? 'Linking...' : 'Apply Treatment'}
                    </Button>
                </>
            }
        >
            <div className="space-y-6 py-4">

                {/* Control Search */}
                <div className="space-y-3">
                    <Label>Select Controls</Label>
                    <div className="relative">
                        <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <Input
                            placeholder="Search controls (e.g., Access, Backup)..."
                            className="pl-9"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <div className="border rounded-md divide-y max-h-[200px] overflow-y-auto bg-gray-50">
                        {filteredControls?.length === 0 && (
                            <div className="p-4 text-center text-gray-500 text-sm">No controls found matching "{searchTerm}"</div>
                        )}
                        {filteredControls?.map(cc => {
                            const isSelected = selectedControlIds.includes(cc.clientControl.id);
                            return (
                                <div
                                    key={cc.clientControl.id}
                                    onClick={() => toggleSelection(cc.clientControl.id)}
                                    className={`p-3 cursor-pointer flex items-start gap-3 hover:bg-blue-50 transition-colors ${isSelected ? 'bg-blue-50 border-l-4 border-blue-500' : ''}`}
                                >
                                    <div className={`p-1.5 rounded bg-white border ${isSelected ? 'border-blue-200 text-blue-600' : 'border-gray-200 text-gray-500'}`}>
                                        <Shield className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <div className="font-medium text-sm text-gray-900">{cc.control?.code} - {cc.control?.name}</div>
                                        <div className="text-xs text-gray-500 line-clamp-1">{cc.control?.description}</div>
                                    </div>
                                    {isSelected && <Check className="w-4 h-4 text-blue-600 ml-auto mt-1" />}
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className="space-y-2">
                    <Label>Justification / Implementation Notes</Label>
                    <Textarea
                        placeholder="Explain how this control modifies the risk likelihood or impact..."
                        value={justification}
                        onChange={e => setJustification(e.target.value)}
                    />
                </div>

            </div>
        </EnhancedDialog>
    );
}

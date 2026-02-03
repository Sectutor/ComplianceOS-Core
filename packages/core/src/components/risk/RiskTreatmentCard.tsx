import React from 'react';
import { Shield, AlertTriangle, CheckCircle, Ban, Trash2, Edit, Calendar, User, DollarSign, Clock } from 'lucide-react';
import { Button } from '@complianceos/ui/ui/button';
import { Badge } from '@complianceos/ui/ui/badge';

interface RiskTreatmentCardProps {
    treatment: any;
    onEdit?: (treatment: any) => void;
    onDelete?: (id: number) => void;
}

export function RiskTreatmentCard({ treatment, onEdit, onDelete }: RiskTreatmentCardProps) {
    const getTreatmentIcon = (type: string) => {
        switch (type) {
            case 'mitigate': return Shield;
            case 'transfer': return AlertTriangle;
            case 'accept': return CheckCircle;
            case 'avoid': return Ban;
            default: return Shield;
        }
    };

    const getTreatmentColor = (type: string) => {
        switch (type) {
            case 'mitigate': return 'text-blue-600 bg-blue-100 dark:bg-blue-900/30';
            case ' transfer': return 'text-orange-600 bg-orange-100 dark:bg-orange-900/30';
            case 'accept': return 'text-green-600 bg-green-100 dark:bg-green-900/30';
            case 'avoid': return 'text-red-600 bg-red-100 dark:bg-red-900/30';
            default: return 'text-gray-600 bg-gray-100 dark:bg-gray-900/30';
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'verified': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
            case 'implemented': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
            case 'in_progress': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
            case 'planned': return 'bg-secondary';
            default: return 'bg-secondary';
        }
    };

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'critical': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
            case 'high': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400';
            case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
            case 'low': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
            default: return 'bg-secondary';
        }
    };

    const Icon = getTreatmentIcon(treatment.treatmentType);

    return (
        <div className="bg-card border rounded-lg p-4 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 flex-1">
                    {/* Treatment Type Icon */}
                    <div className={`p-2 rounded-lg ${getTreatmentColor(treatment.treatmentType)}`}>
                        <Icon className="w-5 h-5" />
                    </div>

                    {/* Content */}
                    <div className="flex-1 space-y-2">
                        {/* Header */}
                        <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="font-medium capitalize">{treatment.treatmentType}</h4>
                            <Badge variant="outline" className={getStatusColor(treatment.status)}>
                                {treatment.status?.replace('_', ' ')}
                            </Badge>
                            {treatment.priority && (
                                <Badge variant="outline" className={getPriorityColor(treatment.priority)}>
                                    {treatment.priority}
                                </Badge>
                            )}
                        </div>

                        {/* Strategy */}
                        {treatment.strategy && (
                            <p className="text-sm text-muted-foreground">{treatment.strategy}</p>
                        )}

                        {/* Justification (for Accept type) */}
                        {treatment.justification && (
                            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-900 rounded p-2">
                                <p className="text-xs font-medium text-yellow-800 dark:text-yellow-400">Justification:</p>
                                <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-1">{treatment.justification}</p>
                            </div>
                        )}

                        {/* Linked Controls */}
                        {treatment.linkedControls && treatment.linkedControls.length > 0 && (
                            <div className="space-y-1">
                                <p className="text-xs font-medium text-muted-foreground">Linked Controls:</p>
                                <div className="flex flex-wrap gap-1">
                                    {treatment.linkedControls.map((lc: any) => (
                                        <Badge key={lc.id} variant="outline" className="text-xs">
                                            {lc.controlCode}: {lc.controlTitle}
                                        </Badge>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Meta Info */}
                        <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                            {treatment.owner && (
                                <div className="flex items-center gap-1">
                                    <User className="w-3 h-3" />
                                    <span>{treatment.owner}</span>
                                </div>
                            )}
                            {treatment.dueDate && (
                                <div className="flex items-center gap-1">
                                    <Calendar className="w-3 h-3" />
                                    <span>{new Date(treatment.dueDate).toLocaleDateString()}</span>
                                </div>
                            )}
                            {treatment.estimatedCost && (
                                <div className="flex items-center gap-1">
                                    <DollarSign className="w-3 h-3" />
                                    <span>{treatment.estimatedCost}</span>
                                </div>
                            )}
                            {treatment.implementationDate && (
                                <div className="flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    <span>Implemented: {new Date(treatment.implementationDate).toLocaleDateString()}</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex gap-1">
                    {onEdit && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onEdit(treatment)}
                            className="h-8 w-8 p-0"
                        >
                            <Edit className="w-4 h-4" />
                        </Button>
                    )}
                    {onDelete && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onDelete(treatment.id)}
                            className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-100 dark:hover:bg-red-900/30"
                        >
                            <Trash2 className="w-4 h-4" />
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
}

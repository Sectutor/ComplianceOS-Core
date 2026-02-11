import { useStudio, generateId } from "./StudioContext";
import { Button } from "@complianceos/ui/ui/button";
import { Input } from "@complianceos/ui/ui/input";
import { Label } from "@complianceos/ui/ui/label";
import { Card } from "@complianceos/ui/ui/card";
import { Trash2, GripVertical, Plus } from "lucide-react";
// Reorder will be used for drag and drop later


export const PhaseEditor = () => {
    const { state, dispatch } = useStudio();

    const addPhase = () => {
        dispatch({
            type: 'ADD_PHASE',
            phase: {
                id: generateId(),
                name: `Phase ${state.phases.length + 1}`,
                description: '',
                order: state.phases.length + 1
            }
        });
    };

    const updatePhase = (id: string, field: 'name' | 'description', value: string) => {
        dispatch({ type: 'UPDATE_PHASE', id, field, value });
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-end">
                <Button onClick={addPhase} size="sm">
                    <Plus className="mr-2 h-4 w-4" /> Add Phase
                </Button>
            </div>

            <div className="space-y-4">
                {state.phases.map((phase, index) => (
                    <Card key={phase.id} className="p-4 flex gap-4 items-start group">
                        <div className="mt-8 text-muted-foreground cursor-grab active:cursor-grabbing">
                            <GripVertical className="h-5 w-5" />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1">
                            <div className="space-y-2">
                                <Label>Phase Name</Label>
                                <Input
                                    value={phase.name}
                                    onChange={(e) => updatePhase(phase.id, 'name', e.target.value)}
                                    placeholder="e.g. Foundation"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Description</Label>
                                <Input
                                    value={phase.description}
                                    onChange={(e) => updatePhase(phase.id, 'description', e.target.value)}
                                    placeholder="e.g. Initial policy setup"
                                />
                            </div>
                        </div>
                        <div className="mt-8">
                            <Button
                                variant="ghost"
                                size="icon"
                                className="text-muted-foreground hover:text-destructive"
                                onClick={() => dispatch({ type: 'DELETE_PHASE', id: phase.id })}
                                disabled={state.phases.length <= 1}
                            >
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>
                    </Card>
                ))}
            </div>

            {state.phases.length === 0 && (
                <div className="text-center p-8 border-2 border-dashed rounded-lg text-muted-foreground">
                    No phases defined. Click "Add Phase" to start.
                </div>
            )}
        </div>
    );
};

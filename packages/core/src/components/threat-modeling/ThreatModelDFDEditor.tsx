import React, { useState, useRef, useEffect } from "react";
import { useDraggable, useDroppable, DndContext, DragOverlay, useSensors, useSensor, PointerSensor, DragStartEvent, DragEndEvent } from "@dnd-kit/core";
import { Button } from "@complianceos/ui/ui/button";
import { Card } from "@complianceos/ui/ui/card";
import { Database, Globe, Server, User, ArrowRight, X, Trash2, ShieldAlert } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

/**
 * Types & Interfaces
 */
type ComponentType = "Process" | "Store" | "Actor" | "External Entity";

interface ThreatComponent {
    id: number;
    name: string;
    type: string;
    x: number;
    y: number;
}

interface DataFlow {
    id: number;
    sourceId: number;
    targetId: number;
    protocol: string;
    description?: string;
}

const COMPONENT_ICONS: Record<string, any> = {
    "Process": Server,
    "Store": Database,
    "Actor": User,
    "External Entity": Globe
};

const COMPONENT_COLORS: Record<string, string> = {
    "Process": "bg-blue-100 border-blue-300 text-blue-700",
    "Store": "bg-amber-100 border-amber-300 text-amber-700",
    "Actor": "bg-green-100 border-green-300 text-green-700",
    "External Entity": "bg-purple-100 border-purple-300 text-purple-700"
};

/**
 * Draggable Palette Item
 */
function PaletteItem({ type }: { type: ComponentType }) {
    const { attributes, listeners, setNodeRef } = useDraggable({
        id: `palette-${type}`,
        data: { type, isPalette: true }
    });
    const Icon = COMPONENT_ICONS[type];

    return (
        <div
            ref={setNodeRef}
            {...listeners}
            {...attributes}
            className="flex items-center gap-2 p-3 bg-white border rounded cursor-grab hover:bg-slate-50 transition-colors shadow-sm mb-2"
        >
            <div className={`p-1.5 rounded ${COMPONENT_COLORS[type]}`}>
                <Icon size={16} />
            </div>
            <span className="text-sm font-medium">{type}</span>
        </div>
    );
}

/**
 * Draggable Canvas Node
 */
function CanvasNode({ component, isSelected, onClick, onDelete }: { component: ThreatComponent; isSelected: boolean; onClick: () => void; onDelete: (e: React.MouseEvent) => void }) {
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
        id: `node-${component.id}`,
        data: { component }
    });

    const style = transform ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
    } : undefined;

    const Icon = COMPONENT_ICONS[component.type] || Server;

    return (
        <div
            ref={setNodeRef}
            style={{
                ...style,
                left: component.x,
                top: component.y,
                position: 'absolute'
            }}
            {...listeners}
            {...attributes}
            onClick={onClick}
            className={cn(
                "w-40 p-3 bg-white border-2 rounded-lg shadow-md cursor-grab z-10 group relative",
                isSelected ? "border-primary ring-2 ring-primary/20" : "border-slate-200",
                COMPONENT_COLORS[component.type].replace('bg-', 'hover:bg-'),
                isDragging ? "opacity-50" : ""
            )}
        >
            {/* Delete Handle */}
            <button
                onClick={onDelete}
                className="absolute -top-2 -right-2 p-1 bg-red-100 text-red-600 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-200"
            >
                <X size={12} />
            </button>

            <div className="flex flex-col items-center text-center pointer-events-none">
                <div className={`p-2 rounded-full mb-2 ${COMPONENT_COLORS[component.type]}`}>
                    <Icon size={20} />
                </div>
                <span className="text-xs font-semibold truncate w-full">{component.name}</span>
                <span className="text-[10px] text-slate-500 uppercase tracking-wider">{component.type}</span>
            </div>

            {/* Connection Ports (Visual Only) */}
            <div className="absolute top-1/2 -left-1 w-2 h-2 bg-slate-300 rounded-full" />
            <div className="absolute top-1/2 -right-1 w-2 h-2 bg-slate-300 rounded-full" />
            <div className="absolute -top-1 left-1/2 w-2 h-2 bg-slate-300 rounded-full" />
            <div className="absolute -bottom-1 left-1/2 w-2 h-2 bg-slate-300 rounded-full" />
        </div>
    );
}

/**
 * Main Editor Component
 */
export function ThreatModelDFDEditor({ threatModelId, clientId }: { threatModelId: number, clientId: number }) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [selectedNode, setSelectedNode] = useState<number | null>(null);
    const [linkMode, setLinkMode] = useState<{ source: number | null }>({ source: null });

    // TRPC Hooks
    const utils = trpc.useContext();
    const { data: modelData, isLoading } = trpc.threatModels.get.useQuery({ id: threatModelId, clientId });

    // Mutations
    const addComponentMutation = trpc.threatModels.addComponent.useMutation({
        onSuccess: () => utils.threatModels.get.invalidate({ id: threatModelId })
    });

    const updatePositionMutation = trpc.threatModels.updateComponentPosition.useMutation();

    const removeComponentMutation = trpc.threatModels.removeComponent.useMutation({
        onSuccess: () => utils.threatModels.get.invalidate({ id: threatModelId })
    });

    const addFlowMutation = trpc.threatModels.saveFlow.useMutation({
        onSuccess: () => {
            utils.threatModels.get.invalidate({ id: threatModelId });
            toast.success("Flow connected");
        }
    });

    const removeFlowMutation = trpc.threatModels.removeFlow.useMutation({
        onSuccess: () => utils.threatModels.get.invalidate({ id: threatModelId })
    });

    // Dnd Setup
    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: { distance: 8 }
        })
    );

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over, delta } = event;

        // Handling Palette Drops
        if (String(active.id).startsWith("palette-") && over?.id === "canvas") {
            const type = active.data.current?.type as string;
            // Calculate drop position relative to canvas
            const dropRect = over.rect;
            // This is simplified; accurate math requires checking the event client coordinates vs canvas rect
            // Using a default center placement if complex math fails or just adding offset

            // We need client coordinates to place it accurately. 
            // Using a random position if accurate drop not calculated for simplicity in this version
            const newX = Math.max(0, 400 + delta.x); // Rough estimate relative to start
            const newY = Math.max(0, 100 + delta.y);

            await addComponentMutation.mutateAsync({
                threatModelId,
                name: `New ${type}`,
                type,
                description: "Created via DFD Editor"
            });
            toast.success(`Added ${type}`);
            return;
        }

        // Handling Node Moves
        if (String(active.id).startsWith("node-")) {
            const component = active.data.current?.component as ThreatComponent;
            const newX = Math.max(0, component.x + delta.x);
            const newY = Math.max(0, component.y + delta.y);

            // Optimistic update could go here
            await updatePositionMutation.mutateAsync({
                id: component.id,
                x: newX,
                y: newY
            });
        }
    };

    // Flow Rendering Logic
    const renderFlows = () => {
        if (!modelData?.flows) return null;

        return (
            <svg className="absolute top-0 left-0 w-full h-full pointer-events-none z-0 overflow-visible">
                <defs>
                    <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="28" refY="3.5" orient="auto">
                        <polygon points="0 0, 10 3.5, 0 7" fill="#94a3b8" />
                    </marker>
                </defs>
                {modelData.flows.map((flow: any) => {
                    const source = modelData.components.find((c: any) => c.id === flow.sourceComponentId);
                    const target = modelData.components.find((c: any) => c.id === flow.targetComponentId);

                    if (!source || !target) return null;

                    // Calculate center points
                    const x1 = source.x + 80; // Width/2
                    const y1 = source.y + 40; // Height/2
                    const x2 = target.x + 80;
                    const y2 = target.y + 40;

                    const midX = (x1 + x2) / 2;
                    const midY = (y1 + y2) / 2;

                    return (
                        <g key={flow.id} className="group pointer-events-auto cursor-pointer" onClick={() => {
                            if (confirm("Delete this data flow?")) {
                                removeFlowMutation.mutate({ id: flow.id });
                            }
                        }}>
                            <path
                                d={`M ${x1} ${y1} Q ${midX} ${midY} ${x2} ${y2}`}
                                stroke="#cbd5e1"
                                strokeWidth="6"
                                fill="none"
                                className="group-hover:stroke-red-200 transition-colors"
                            />
                            <path
                                d={`M ${x1} ${y1} Q ${midX} ${midY} ${x2} ${y2}`}
                                stroke="#94a3b8"
                                strokeWidth="2"
                                fill="none"
                                markerEnd="url(#arrowhead)"
                            />
                            <circle cx={midX} cy={midY} r="12" fill="white" stroke="#cbd5e1" strokeWidth="1" />
                            <text x={midX} y={midY} textAnchor="middle" dy=".3em" fontSize="10" fill="#64748b">
                                {flow.protocol || "?"}
                            </text>
                        </g>
                    );
                })}
                {/* Temporary Link Line */}
                {linkMode.source && (
                    // We would render a line following cursor here if we had cursor tracking hook
                    // For now, simpler to just show indicator
                    null
                )}
            </svg>
        );
    };

    const handleNodeClick = (id: number) => {
        if (linkMode.source) {
            if (linkMode.source === id) {
                setLinkMode({ source: null }); // Cancel
            } else {
                // Create Link
                addFlowMutation.mutate({
                    threatModelId,
                    sourceComponentId: linkMode.source,
                    targetComponentId: id,
                    protocol: "HTTPS", // Default
                    description: "Data Flow",
                    isEncrypted: true
                });
                setLinkMode({ source: null });
            }
        } else {
            setSelectedNode(id);
        }
    };

    if (isLoading) return <div>Loading Diagram...</div>;

    return (
        <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
            <div className="flex h-[700px] border rounded-lg bg-slate-50 overflow-hidden relative">

                {/* Palette Sidebar */}
                <div className="w-48 bg-white border-r p-4 z-20 shadow-sm flex flex-col">
                    <h3 className="font-semibold text-sm mb-4 text-slate-700">Components</h3>
                    <PaletteItem type="Process" />
                    <PaletteItem type="Store" />
                    <PaletteItem type="Actor" />
                    <PaletteItem type="External Entity" />

                    <div className="mt-8 border-t pt-4">
                        <h3 className="font-semibold text-sm mb-2 text-slate-700">Instructions</h3>
                        <p className="text-xs text-slate-500 mb-2">1. Drag components onto canvas.</p>
                        <p className="text-xs text-slate-500 mb-2">2. Click "Link Mode" to connect nodes.</p>
                        <p className="text-xs text-slate-500">3. Click line to delete.</p>
                    </div>

                    <div className="mt-auto">
                        <Button
                            variant={linkMode.source ? "destructive" : "outline"}
                            className="w-full"
                            onClick={() => setLinkMode(prev => prev.source ? { source: null } : { source: -1 })} // -1 indicates ready to pick source
                            disabled={!selectedNode && !linkMode.source}
                        >
                            {linkMode.source ? "Cancel Link" : "Link Selected"}
                        </Button>
                        {linkMode.source && (
                            <div className="text-xs text-center mt-2 text-blue-600 animate-pulse font-medium">
                                {linkMode.source === -1 ? `Select SOURCE node` : `Select TARGET node`}
                            </div>
                        )}
                        {/* If Link Selected clicked with selected node, start from there */}
                        {/* Logic refinement needed: User selects node A, clicks Link, then clicks Node B */}
                        {/* Currently: Click "Link Selected" triggers mode. If selectedNode exists, it becomes source. */}
                    </div>
                </div>

                {/* Canvas Area */}
                <div
                    id="canvas"
                    ref={containerRef} // Make draggable later if panning needed
                    className="flex-1 relative overflow-auto bg-slate-50" // Dot pattern css could go here
                >
                    <useDroppable id="canvas">
                        {({ setNodeRef }) => (
                            <div ref={setNodeRef} className="w-full h-full min-w-[1000px] min-h-[1000px] relative">
                                {/* Grid Background */}
                                <div className="absolute inset-0 z-0 opacity-10 pointer-events-none" style={{
                                    backgroundImage: "radial-gradient(#64748b 1px, transparent 1px)",
                                    backgroundSize: "20px 20px"
                                }}></div>

                                {/* Flows Layer */}
                                {renderFlows()}

                                {/* Components Layer */}
                                {modelData?.components.map((comp: any) => (
                                    <CanvasNode
                                        key={comp.id}
                                        component={comp}
                                        isSelected={selectedNode === comp.id || linkMode.source === comp.id}
                                        onClick={() => {
                                            if (linkMode.source === -1) {
                                                // Picking source
                                                setLinkMode({ source: comp.id });
                                                toast.info("Source selected. Click target node.");
                                            } else {
                                                handleNodeClick(comp.id);
                                            }
                                        }}
                                        onDelete={(e) => {
                                            e.stopPropagation();
                                            if (confirm(`Delete ${comp.name}?`)) {
                                                removeComponentMutation.mutate({ id: comp.id });
                                            }
                                        }}
                                    />
                                ))}
                            </div>
                        )}
                    </useDroppable>
                </div>

                <DragOverlay>
                    {/* Simplified drag preview */}
                    <div className="opacity-50">
                        <div className="w-32 h-16 bg-blue-500 rounded-lg shadow-xl"></div>
                    </div>
                </DragOverlay>
            </div>
        </DndContext>
    );
}

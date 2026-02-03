import { trpc } from "@/lib/trpc";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@complianceos/ui/ui/table";
import { Mail, MapPin, CheckSquare, Badge } from "lucide-react";

interface PlanPrintViewProps {
    plan: any;
    isCrisisMode?: boolean;
}

export function PlanPrintView({ plan, isCrisisMode = false }: PlanPrintViewProps) {
    const { data: comms } = trpc.businessContinuity.plans.communications.list.useQuery({ planId: plan.id }, { enabled: !!plan.id });
    const { data: logistics } = trpc.businessContinuity.plans.logistics.list.useQuery({ planId: plan.id }, { enabled: !!plan.id });

    const stakeholders = (plan.content as any)?.callList || [];
    // ... existing logic

    // [RENDERING LOGIC FOR COMMS AND LOGISTICS]
    // ...

    const containerClass = isCrisisMode
        ? "bg-red-50 text-slate-900 font-sans p-8 max-w-[210mm] mx-auto min-h-screen"
        : "bg-white text-slate-900 font-sans p-8 max-w-[210mm] mx-auto min-h-screen";

    return (
        <div className={containerClass} id="plan-print-view">
            {/* ... Header and Contact List ... */}

            {/* Section 2: Communications Matrix */}
            <section className="space-y-4 break-inside-avoid mt-8">
                <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
                    <Mail className="h-6 w-6 text-slate-900" />
                    <h3 className="text-xl font-bold uppercase tracking-wider text-slate-900">2. Communications Matrix</h3>
                </div>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="font-bold text-slate-900">Audience</TableHead>
                            <TableHead className="font-bold text-slate-900">Channel</TableHead>
                            <TableHead className="font-bold text-slate-900">Responsibility</TableHead>
                            <TableHead className="font-bold text-slate-900">Message / Frequency</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {comms && comms.length > 0 ? comms.map((c: any) => (
                            <TableRow key={c.id}>
                                <TableCell className="font-bold">{c.audience}</TableCell>
                                <TableCell>{c.channel}</TableCell>
                                <TableCell>{c.responsibleRole}</TableCell>
                                <TableCell className="text-sm">
                                    <div className="font-medium">{c.frequency}</div>
                                    <div className="italic text-slate-600">{c.messageTemplate}</div>
                                </TableCell>
                            </TableRow>
                        )) : (
                            <TableRow><TableCell colSpan={4} className="text-center italic text-muted-foreground">No communication channels defined.</TableCell></TableRow>
                        )}
                    </TableBody>
                </Table>
            </section>

            {/* Section 3: Logistics & Locations */}
            <section className="space-y-4 break-inside-avoid mt-8">
                <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
                    <MapPin className="h-6 w-6 text-slate-900" />
                    <h3 className="text-xl font-bold uppercase tracking-wider text-slate-900">3. Logistics & Sites</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {logistics && logistics.map((loc: any) => (
                        <div key={loc.id} className="border border-slate-200 rounded p-4 shadow-sm bg-slate-50">
                            <div className="flex justify-between items-start mb-2">
                                <h4 className="font-bold text-lg">{loc.locationName}</h4>
                                <Badge variant="outline" className="uppercase text-xs">{loc.type.replace('_', ' ')}</Badge>
                            </div>
                            <p className="text-sm text-slate-700 mb-1"><strong>Address:</strong> {loc.address || 'N/A'}</p>
                            <p className="text-sm text-slate-700 mb-1"><strong>Capacity:</strong> {loc.capacity || '?'} people</p>
                            {loc.notes && <div className="mt-2 text-xs bg-white p-2 rounded border text-slate-600">{loc.notes}</div>}
                            {isCrisisMode && (
                                <div className="mt-3">
                                    <a href={`https://maps.google.com/?q=${encodeURIComponent(loc.address || loc.locationName)}`} target="_blank" rel="noreferrer" className="text-blue-600 text-xs hover:underline flex items-center gap-1">
                                        <MapPin className="w-3 h-3" /> Get Directions
                                    </a>
                                </div>
                            )}
                        </div>
                    ))}
                    {(!logistics || logistics.length === 0) && <div className="text-muted-foreground italic col-span-2 text-center p-4">No logistics sites defined.</div>}
                </div>
            </section>

            {/* Section 4: Activation Scenarios (Existing) */}
            <section className="space-y-4 break-inside-avoid mt-8">
                <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
                    <CheckSquare className="h-6 w-6 text-slate-900" />
                    <h3 className="text-xl font-bold uppercase tracking-wider text-slate-900">4. Activation Scenarios & Strategies</h3>
                </div>
                <div className="grid grid-cols-1 gap-4">
                    {plan.scenarios?.map((scenario: any) => (
                        <div key={scenario.id} className="border p-4 rounded-md bg-slate-50">
                            <h4 className="font-bold text-lg text-slate-800 mb-1">{scenario.title}</h4>
                            <p className="text-slate-600 text-sm mb-2">{scenario.description}</p>
                            {/* ... */}
                        </div>
                    ))}
                </div>
            </section>

            {/* Section 5: Recovery Strategies */}
            <section className="space-y-4 break-inside-avoid mt-8">
                <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
                    <CheckSquare className="h-6 w-6 text-slate-900" />
                    <h3 className="text-xl font-bold uppercase tracking-wider text-slate-900">5. Recovery Procedures</h3>
                </div>
                {plan.strategies?.map((strategy: any, idx: number) => (
                    <div key={strategy.id} className="mb-8 break-inside-avoid shadow-sm border rounded-lg overflow-hidden">
                        <div className="bg-slate-100 p-4 border-b border-slate-200 flex justify-between items-center">
                            <h4 className="font-bold text-lg">5.{idx + 1} {strategy.title}</h4>
                            <Badge variant="outline" className="bg-white">{strategy.type}</Badge>
                        </div>
                        <div className="p-4 bg-white">
                            <p className="mb-4 text-slate-700">{strategy.description}</p>
                            <div className="space-y-2">
                                <div className="font-semibold text-sm uppercase text-slate-500 mb-2">Action Steps</div>
                                {(strategy.contentStepByStep || "").split('\n').filter((l: string) => l.trim().length > 0).map((line: string, i: number) => (
                                    <div key={i} className="flex items-start gap-3 py-1">
                                        {isCrisisMode ? (
                                            <input type="checkbox" className="w-5 h-5 mt-0.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                                        ) : (
                                            <div className="w-5 h-5 border border-slate-300 rounded flex-shrink-0 mt-0.5" />
                                        )}
                                        <span className={line.startsWith('-') || line.startsWith('*') ? "pl-2" : "font-medium"}>
                                            {line.replace(/^[-*]\s/, '')}
                                        </span>
                                    </div>
                                ))}
                                {(!strategy.contentStepByStep) && (
                                    <p className="text-sm text-muted-foreground italic">No detailed steps provided.</p>
                                )}
                            </div>
                            <div className="mt-6 flex gap-4 text-sm text-slate-600 border-t pt-4">
                                <div>
                                    <span className="font-semibold">RTO:</span> {strategy.rto || "N/A"}
                                </div>
                                <div>
                                    <span className="font-semibold">RPO:</span> {strategy.rpo || "N/A"}
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
                {(!plan.strategies || plan.strategies.length === 0) && (
                    <p className="text-muted-foreground italic">No recovery strategies defined.</p>
                )}
            </section>

            <div className="mt-8 text-center text-xs text-slate-300">
                End of Document
            </div>
        </div>
    );
}

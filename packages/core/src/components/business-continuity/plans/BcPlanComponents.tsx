
import React, { useState } from 'react';
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@complianceos/ui/ui/card";
import { Button } from "@complianceos/ui/ui/button";
import { Input } from "@complianceos/ui/ui/input";
import { Textarea } from "@complianceos/ui/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@complianceos/ui/ui/table";
import { Plus, Trash2, Phone, MapPin } from "lucide-react";
import { toast } from "sonner";

export function BcPlanCommunications({ planId, clientId }: { planId: number, clientId: number }) {
    const { data: channels, refetch } = trpc.businessContinuity.plans.communications.list.useQuery({ planId, clientId });
    const createChannel = trpc.businessContinuity.plans.communications.create.useMutation({
        onSuccess: () => {
            toast.success("Channel added");
            refetch();
            setNewChannel({ audience: "", channel: "", responsibleRole: "", messageTemplate: "", frequency: "Initial" });
        }
    });
    const deleteChannel = trpc.businessContinuity.plans.communications.delete.useMutation({
        onSuccess: () => {
            toast.success("Channel removed");
            refetch();
        }
    });

    const [newChannel, setNewChannel] = useState({ audience: "", channel: "", responsibleRole: "", messageTemplate: "", frequency: "Initial" });

    const handleAdd = () => {
        if (!newChannel.audience) return;
        createChannel.mutate({ planId, clientId, ...newChannel });
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Phone className="w-5 h-5" />
                    Communication Matrix
                </CardTitle>
                <CardDescription>
                    Who needs to be contacted, how, and by whom during a disruption.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Audience</TableHead>
                            <TableHead>Channel/Method</TableHead>
                            <TableHead>Responsible Role</TableHead>
                            <TableHead>Message Template / Key Info</TableHead>
                            <TableHead>Frequency</TableHead>
                            <TableHead className="w-[50px]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {channels?.map((c: any) => (
                            <TableRow key={c.id}>
                                <TableCell className="font-medium">{c.audience}</TableCell>
                                <TableCell>{c.channel}</TableCell>
                                <TableCell>{c.responsibleRole}</TableCell>
                                <TableCell className="max-w-[200px] truncate" title={c.messageTemplate}>{c.messageTemplate}</TableCell>
                                <TableCell>{c.frequency}</TableCell>
                                <TableCell>
                                    <Button variant="ghost" size="sm" onClick={() => deleteChannel.mutate({ id: c.id, clientId })}>
                                        <Trash2 className="w-4 h-4 text-red-500" />
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                        <TableRow>
                            <TableCell>
                                <Input placeholder="e.g. Employees" value={newChannel.audience} onChange={e => setNewChannel({ ...newChannel, audience: e.target.value })} />
                            </TableCell>
                            <TableCell>
                                <Input placeholder="SMS / Email" value={newChannel.channel} onChange={e => setNewChannel({ ...newChannel, channel: e.target.value })} />
                            </TableCell>
                            <TableCell>
                                <Input placeholder="HR Manager" value={newChannel.responsibleRole} onChange={e => setNewChannel({ ...newChannel, responsibleRole: e.target.value })} />
                            </TableCell>
                            <TableCell>
                                <Input placeholder="Message content..." value={newChannel.messageTemplate} onChange={e => setNewChannel({ ...newChannel, messageTemplate: e.target.value })} />
                            </TableCell>
                            <TableCell>
                                <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                    value={newChannel.frequency} onChange={e => setNewChannel({ ...newChannel, frequency: e.target.value })}>
                                    <option value="Initial">Initial Notification</option>
                                    <option value="Hourly">Hourly Updates</option>
                                    <option value="Daily">Daily Updates</option>
                                    <option value="Resolution">Resolution Only</option>
                                </select>
                            </TableCell>
                            <TableCell>
                                <Button size="sm" onClick={handleAdd} disabled={!newChannel.audience}>
                                    <Plus className="w-4 h-4" />
                                </Button>
                            </TableCell>
                        </TableRow>
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}

export function BcPlanLogistics({ planId, clientId }: { planId: number, clientId: number }) {
    const { data: logistics, refetch } = trpc.businessContinuity.plans.logistics.list.useQuery({ planId, clientId });
    const createLogistic = trpc.businessContinuity.plans.logistics.create.useMutation({
        onSuccess: () => {
            toast.success("Location added");
            refetch();
            setNewLoc({ type: "assembly_point", locationName: "", address: "", capacity: 0, notes: "" });
        }
    });
    const deleteLogistic = trpc.businessContinuity.plans.logistics.delete.useMutation({
        onSuccess: () => {
            toast.success("Location removed");
            refetch();
        }
    });

    const [newLoc, setNewLoc] = useState({ type: "assembly_point", locationName: "", address: "", capacity: 0, notes: "" });

    const handleAdd = () => {
        if (!newLoc.locationName) return;
        createLogistic.mutate({ planId, clientId, ...newLoc });
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <MapPin className="w-5 h-5" />
                    Logistics & Recovery Sites
                </CardTitle>
                <CardDescription>
                    Physical locations for assembly, alternate work, or command centers.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Type</TableHead>
                            <TableHead>Location Name</TableHead>
                            <TableHead>Address</TableHead>
                            <TableHead>Capacity</TableHead>
                            <TableHead>Notes</TableHead>
                            <TableHead className="w-[50px]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {logistics?.map((loc: any) => (
                            <TableRow key={loc.id}>
                                <TableCell className="capitalize">{loc.type.replace('_', ' ')}</TableCell>
                                <TableCell className="font-medium">{loc.locationName}</TableCell>
                                <TableCell>{loc.address}</TableCell>
                                <TableCell>{loc.capacity}</TableCell>
                                <TableCell className="max-w-[200px] truncate">{loc.notes}</TableCell>
                                <TableCell>
                                    <Button variant="ghost" size="sm" onClick={() => deleteLogistic.mutate({ id: loc.id, clientId })}>
                                        <Trash2 className="w-4 h-4 text-red-500" />
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                        <TableRow>
                            <TableCell>
                                <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                    value={newLoc.type} onChange={e => setNewLoc({ ...newLoc, type: e.target.value })}>
                                    <option value="assembly_point">Assembly Point</option>
                                    <option value="alternate_site">Alternate Work Site</option>
                                    <option value="war_room">Command Center (War Room)</option>
                                    <option value="shelter">Shelter-in-Place</option>
                                </select>
                            </TableCell>
                            <TableCell>
                                <Input placeholder="e.g. Parking Lot B" value={newLoc.locationName} onChange={e => setNewLoc({ ...newLoc, locationName: e.target.value })} />
                            </TableCell>
                            <TableCell>
                                <Input placeholder="123 Main St" value={newLoc.address} onChange={e => setNewLoc({ ...newLoc, address: e.target.value })} />
                            </TableCell>
                            <TableCell>
                                <Input type="number" placeholder="50" value={newLoc.capacity || ''} onChange={e => setNewLoc({ ...newLoc, capacity: parseInt(e.target.value) || 0 })} />
                            </TableCell>
                            <TableCell>
                                <Input placeholder="Access codes etc." value={newLoc.notes} onChange={e => setNewLoc({ ...newLoc, notes: e.target.value })} />
                            </TableCell>
                            <TableCell>
                                <Button size="sm" onClick={handleAdd} disabled={!newLoc.locationName}>
                                    <Plus className="w-4 h-4" />
                                </Button>
                            </TableCell>
                        </TableRow>
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}

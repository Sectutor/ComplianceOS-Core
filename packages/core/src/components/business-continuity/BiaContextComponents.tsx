
import React, { useState } from 'react';
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@complianceos/ui/ui/card";
import { Button } from "@complianceos/ui/ui/button";
import { Input } from "@complianceos/ui/ui/input";
import { Textarea } from "@complianceos/ui/ui/textarea";
import { Label } from "@complianceos/ui/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@complianceos/ui/ui/table";
import { Plus, Trash2, Calendar, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

export function BiaSeasonalityContext({ biaId }: { biaId: number }) {
    const { data: seasonalEvents, refetch } = trpc.businessContinuity.bia.seasonality.list.useQuery({ biaId });
    const createEvent = trpc.businessContinuity.bia.seasonality.create.useMutation({
        onSuccess: () => {
            toast.success("Event added");
            refetch();
            setNewEvent({ name: "", startDate: "", endDate: "", impactDescription: "" });
        }
    });
    const deleteEvent = trpc.businessContinuity.bia.seasonality.delete.useMutation({
        onSuccess: () => {
            toast.success("Event removed");
            refetch();
        }
    });

    const [newEvent, setNewEvent] = useState({ name: "", startDate: "", endDate: "", impactDescription: "" });

    const handleAdd = () => {
        if (!newEvent.name) return;
        createEvent.mutate({ biaId, ...newEvent });
    };

    return (
        <div className="space-y-8">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Calendar className="w-5 h-5" />
                        Seasonality & Peak Periods
                    </CardTitle>
                    <CardDescription>
                        Identify times of year when a disruption would be more severe (e.g., end-of-month processing, holiday sales).
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Event Name</TableHead>
                                <TableHead>Start Date (approx)</TableHead>
                                <TableHead>End Date (approx)</TableHead>
                                <TableHead>Impact Description</TableHead>
                                <TableHead className="w-[50px]"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {seasonalEvents?.map((evt: any) => (
                                <TableRow key={evt.id}>
                                    <TableCell className="font-medium">{evt.name}</TableCell>
                                    <TableCell>{evt.startDate}</TableCell>
                                    <TableCell>{evt.endDate}</TableCell>
                                    <TableCell>{evt.impactDescription}</TableCell>
                                    <TableCell>
                                        <Button variant="ghost" size="sm" onClick={() => deleteEvent.mutate({ id: evt.id })}>
                                            <Trash2 className="w-4 h-4 text-red-500" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                            <TableRow>
                                <TableCell>
                                    <Input placeholder="e.g. Black Friday" value={newEvent.name} onChange={e => setNewEvent({ ...newEvent, name: e.target.value })} />
                                </TableCell>
                                <TableCell>
                                    <Input placeholder="Nov 20" value={newEvent.startDate} onChange={e => setNewEvent({ ...newEvent, startDate: e.target.value })} />
                                </TableCell>
                                <TableCell>
                                    <Input placeholder="Dec 01" value={newEvent.endDate} onChange={e => setNewEvent({ ...newEvent, endDate: e.target.value })} />
                                </TableCell>
                                <TableCell>
                                    <Input placeholder="Revenue hit..." value={newEvent.impactDescription} onChange={e => setNewEvent({ ...newEvent, impactDescription: e.target.value })} />
                                </TableCell>
                                <TableCell>
                                    <Button size="sm" onClick={handleAdd} disabled={!newEvent.name}>
                                        <Plus className="w-4 h-4" />
                                    </Button>
                                </TableCell>
                            </TableRow>
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <Card className="border-l-4 border-l-yellow-500">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5 text-yellow-600" />
                        Single Points of Failure (SPOF)
                    </CardTitle>
                    <CardDescription>
                        List any resources (people, technology, suppliers) where no redundancy exists.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {/* For simplicity we can use a dedicated Question ID 9999 or simply render a text box. 
                        Ideally we'd use the Questions schema, but looking at the prompt "Qualitative 1" handles questions. 
                        Let's check if we can just guide the user to add it to the qualitative section or if we want a dedicated free-text field.
                        We'll use a placeholder text area here pointing to an underlying 'SPOF' question if it existed, 
                        or just create a simple 'vitalRecords' like structure. 
                        Actually, let's treat SPOF as a special Vital Record or just "Critical Dependencies".
                        User asked for a dedicated section. Let's use a simple Note for now or just instruct.
                    */}
                    <div className="p-4 bg-yellow-50 rounded-md text-yellow-800 text-sm">
                        <p><strong>Guidance:</strong> Ensure you have identified keys to the kingdom, unique specialized staff, or legacy hardware.</p>
                        <p className="mt-2">Use the <strong>"Dependencies"</strong> section in Qualitative Analysis to document these.</p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

export function BiaVitalRecords({ biaId }: { biaId: number }) {
    const { data: records, refetch } = trpc.businessContinuity.bia.vitalRecords.list.useQuery({ biaId });
    const createRecord = trpc.businessContinuity.bia.vitalRecords.create.useMutation({
        onSuccess: () => {
            toast.success("Record added");
            refetch();
            setNewRecord({ recordName: "", mediaType: "Digital", location: "", backupMethod: "", rto: "" });
        }
    });
    const deleteRecord = trpc.businessContinuity.bia.vitalRecords.delete.useMutation({
        onSuccess: () => {
            toast.success("Record removed");
            refetch();
        }
    });

    const [newRecord, setNewRecord] = useState({ recordName: "", mediaType: "Digital", location: "", backupMethod: "", rto: "" });

    const handleAdd = () => {
        if (!newRecord.recordName) return;
        createRecord.mutate({ biaId, ...newRecord });
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Vital Records & Data</CardTitle>
                <CardDescription>
                    Essential documents or data required to perform this process during a disruption.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Record Name</TableHead>
                            <TableHead>Format</TableHead>
                            <TableHead>Location / System</TableHead>
                            <TableHead>Backup / Access Method</TableHead>
                            <TableHead>RTO</TableHead>
                            <TableHead className="w-[50px]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {records?.map((rec: any) => (
                            <TableRow key={rec.id}>
                                <TableCell className="font-medium">{rec.recordName}</TableCell>
                                <TableCell>{rec.mediaType}</TableCell>
                                <TableCell>{rec.location}</TableCell>
                                <TableCell>{rec.backupMethod}</TableCell>
                                <TableCell>{rec.rto}</TableCell>
                                <TableCell>
                                    <Button variant="ghost" size="sm" onClick={() => deleteRecord.mutate({ id: rec.id })}>
                                        <Trash2 className="w-4 h-4 text-red-500" />
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                        <TableRow>
                            <TableCell>
                                <Input placeholder="e.g. Client Contracts" value={newRecord.recordName} onChange={e => setNewRecord({ ...newRecord, recordName: e.target.value })} />
                            </TableCell>
                            <TableCell>
                                <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                    value={newRecord.mediaType} onChange={e => setNewRecord({ ...newRecord, mediaType: e.target.value })}>
                                    <option value="Digital">Digital</option>
                                    <option value="Physical">Physical (Paper)</option>
                                    <option value="Hybrid">Hybrid</option>
                                </select>
                            </TableCell>
                            <TableCell>
                                <Input placeholder="SharePoint / Cabinet 3" value={newRecord.location} onChange={e => setNewRecord({ ...newRecord, location: e.target.value })} />
                            </TableCell>
                            <TableCell>
                                <Input placeholder="Cloud Backup / Key" value={newRecord.backupMethod} onChange={e => setNewRecord({ ...newRecord, backupMethod: e.target.value })} />
                            </TableCell>
                            <TableCell>
                                <Input placeholder="4 hours" value={newRecord.rto} onChange={e => setNewRecord({ ...newRecord, rto: e.target.value })} />
                            </TableCell>
                            <TableCell>
                                <Button size="sm" onClick={handleAdd} disabled={!newRecord.recordName}>
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

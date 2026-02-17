import React, { useState } from "react";
import { ISOLayout } from "./ISOLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@complianceos/ui/ui/card";
import { Button } from "@complianceos/ui/ui/button";
import { Badge } from "@complianceos/ui/ui/badge";
import {
    CalendarDays,
    CheckCircle2,
    Clock,
    FileText,
    Plus,
    MoreHorizontal,
    Search,
    Users,
    ClipboardList,
    ArrowRight
} from "lucide-react";
import { Input } from "@complianceos/ui/ui/input";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@complianceos/ui/ui/table";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@complianceos/ui/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@complianceos/ui/ui/tabs";
import { useLocation, useParams } from "wouter";

interface ReviewMeeting {
    id: string;
    title: string;
    date: string;
    status: "planned" | "minutes_drafted" | "completed" | "overdue";
    attendees: string[];
    actions: number;
}

const MEETINGS: ReviewMeeting[] = [
    {
        id: "MR-2025-Q1",
        title: "Q1 2025 ISMS Management Review",
        date: "2025-03-30",
        status: "planned",
        attendees: ["CISO", "CTO", "CEO", "VP HR"],
        actions: 0
    },
    {
        id: "MR-2024-Q4",
        title: "Q4 2024 Annual ISMS Review",
        date: "2024-12-15",
        status: "completed",
        attendees: ["CISO", "CTO", "CEO", "CFO", "Legal Counsel"],
        actions: 5
    },
    {
        id: "MR-2024-Q3",
        title: "Q3 2024 Interim Review",
        date: "2024-09-20",
        status: "completed",
        attendees: ["CISO", "CTO", "VP Eng"],
        actions: 2
    }
];

export default function ISOManagementReview() {
    const params = useParams<{ id: string }>();
    const clientId = parseInt(params.id || "0");
    const [activeTab, setActiveTab] = useState("meetings");
    const [searchQuery, setSearchQuery] = useState("");

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "completed":
                return <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200">Completed</Badge>;
            case "minutes_drafted":
                return <Badge className="bg-blue-50 text-blue-700 border-blue-200">Minutes Drafted</Badge>;
            case "planned":
                return <Badge variant="outline" className="text-slate-500 border-slate-200 bg-slate-50">Planned</Badge>;
            case "overdue":
                return <Badge className="bg-rose-50 text-rose-700 border-rose-200">Overdue</Badge>;
            default:
                return null;
        }
    };

    const filteredMeetings = MEETINGS.filter(m =>
        m.title.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <ISOLayout clientId={clientId}>
            <div className="p-8 space-y-8 animate-in fade-in duration-500">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="space-y-2">
                        <h1 className="text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-3">
                            <Users className="h-8 w-8 text-indigo-600" />
                            Management Review (9.3)
                        </h1>
                        <p className="text-lg text-slate-500 max-w-3xl">
                            Formalize leadership oversight of the ISMS to ensure its continuing suitability, adequacy, and effectiveness.
                        </p>
                    </div>
                    <Button className="bg-indigo-600 hover:bg-indigo-700 shadow-sm">
                        <Plus className="mr-2 h-4 w-4" /> Schedule Review
                    </Button>
                </div>

                {/* KPI Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card className="border-none shadow-sm bg-white">
                        <CardContent className="p-6">
                            <p className="text-slate-500 font-medium text-sm uppercase tracking-wider">Next Review</p>
                            <div className="mt-2 flex items-baseline gap-2">
                                <span className="text-2xl font-bold text-slate-900">
                                    {new Date(MEETINGS[0].date).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}
                                </span>
                            </div>
                            <div className="mt-2 text-xs text-indigo-600 font-medium bg-indigo-50 inline-block px-2 py-1 rounded">
                                Planned
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="border-none shadow-sm bg-white">
                        <CardContent className="p-6">
                            <p className="text-slate-500 font-medium text-sm uppercase tracking-wider">Open Actions</p>
                            <div className="mt-2 flex items-baseline gap-2">
                                <span className="text-4xl font-bold text-slate-900">7</span>
                                <span className="text-sm text-slate-500">from past reviews</span>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="border-none shadow-sm bg-white">
                        <CardContent className="p-6">
                            <p className="text-slate-500 font-medium text-sm uppercase tracking-wider">Review Frequency</p>
                            <div className="mt-2 flex items-baseline gap-2">
                                <span className="text-4xl font-bold text-slate-900">Quarterly</span>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="bg-white border p-1 h-12 w-full md:w-auto justify-start mb-6">
                        <TabsTrigger value="meetings" className="data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-700 h-10 px-6">
                            <CalendarDays className="mr-2 h-4 w-4" /> Review Meetings
                        </TabsTrigger>
                        <TabsTrigger value="inputs" className="data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-700 h-10 px-6">
                            <ClipboardList className="mr-2 h-4 w-4" /> Standard Inputs (9.3.2)
                        </TabsTrigger>
                        <TabsTrigger value="outputs" className="data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-700 h-10 px-6">
                            <CheckCircle2 className="mr-2 h-4 w-4" /> Decisions & Actions (9.3.3)
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="meetings" className="space-y-6">
                        <Card className="bg-white border-slate-200 shadow-sm overflow-hidden">
                            <CardHeader className="border-b border-slate-100 bg-slate-50/50 p-6">
                                <div className="flex items-center justify-between">
                                    <div className="space-y-1">
                                        <CardTitle className="text-lg">Review History</CardTitle>
                                        <CardDescription>
                                            Track agendas, minutes, and sign-offs for all management reviews.
                                        </CardDescription>
                                    </div>
                                    <div className="relative max-w-sm w-full">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                        <Input
                                            placeholder="Search reviews..."
                                            className="pl-10 bg-white"
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                        />
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="p-0">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="bg-slate-50/50">
                                            <TableHead className="w-[120px]">ID</TableHead>
                                            <TableHead>Title</TableHead>
                                            <TableHead>Date</TableHead>
                                            <TableHead>Attendees</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead className="text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filteredMeetings.map((meeting) => (
                                            <TableRow key={meeting.id} className="group hover:bg-slate-50/50 cursor-pointer">
                                                <TableCell className="font-mono text-xs font-medium text-slate-500">
                                                    {meeting.id}
                                                </TableCell>
                                                <TableCell className="font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors">
                                                    {meeting.title}
                                                </TableCell>
                                                <TableCell className="text-slate-600">
                                                    {new Date(meeting.date).toLocaleDateString()}
                                                </TableCell>
                                                <TableCell className="text-sm text-slate-600">
                                                    <div className="flex -space-x-2">
                                                        {meeting.attendees.map((attendee, i) => (
                                                            <div key={i} className="h-8 w-8 rounded-full bg-slate-200 border-2 border-white flex items-center justify-center text-[10px] font-bold text-slate-600" title={attendee}>
                                                                {attendee.charAt(0)}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </TableCell>
                                                <TableCell>{getStatusBadge(meeting.status)}</TableCell>
                                                <TableCell className="text-right">
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                                                <MoreHorizontal className="h-4 w-4 text-slate-400" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end">
                                                            <DropdownMenuItem>
                                                                <FileText className="mr-2 h-4 w-4" /> View Minutes
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem>
                                                                <CheckCircle2 className="mr-2 h-4 w-4" /> Track Actions
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="inputs">
                        <Card>
                            <CardContent className="py-12 flex flex-col items-center text-center">
                                <ClipboardList className="h-12 w-12 text-slate-300 mb-4" />
                                <h3 className="text-lg font-semibold text-slate-900">Standard Review Inputs</h3>
                                <p className="text-slate-500 max-w-md mt-2">
                                    This section will aggregate data from ComplianceOS modules (Status of actions, External/internal issues change, Audit results, Feedback, Risk Assessment results) to automatically populate your meeting agenda.
                                </p>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="outputs">
                        <Card>
                            <CardContent className="py-12 flex flex-col items-center text-center">
                                <CheckCircle2 className="h-12 w-12 text-slate-300 mb-4" />
                                <h3 className="text-lg font-semibold text-slate-900">Decisions & Opportunities</h3>
                                <p className="text-slate-500 max-w-md mt-2">
                                    Track standard outputs required by ISO 27001:2022 Clause 9.3.3, including continual improvement opportunities and changes to the ISMS.
                                </p>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </ISOLayout>
    );
}

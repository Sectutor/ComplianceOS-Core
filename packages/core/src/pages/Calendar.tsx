import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/DashboardLayout";
import { Breadcrumb } from "@/components/Breadcrumb";
import { useLocation } from "wouter";
import { Button } from "@complianceos/ui/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@complianceos/ui/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@complianceos/ui/ui/select";
import { Badge } from "@complianceos/ui/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@complianceos/ui/ui/tabs";
import { trpc } from "@/lib/trpc";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  Clock,
  FileText,
  Shield,
  CheckCircle,
  List,
  LayoutGrid
} from "lucide-react";
import { useState, useMemo, useEffect } from "react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, isToday } from "date-fns";

interface CalendarEvent {
  id: string;
  type: 'control_review' | 'policy_renewal' | 'evidence_expiration' | 'project_task' | 'remediation' | 'poam' | 'risk_review' | 'treatment_due';
  title: string;
  description: string;
  date: string;
  clientId: number;
  clientName: string;
  status: string;
  entityId?: number;
  priority: 'high' | 'medium' | 'low' | 'critical';
}

export default function Calendar() {
  const { user, loading: authLoading } = useAuth();
  const [location] = useLocation();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedClient, setSelectedClient] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"calendar" | "list">("calendar");
  const [selectedEventType, setSelectedEventType] = useState<string>("all");
  const [clientName, setClientName] = useState<string>("");

  // Extract client ID from URL if present
  const clientIdMatch = location.match(/\/clients\/(\d+)/);
  const activeClientId = clientIdMatch ? parseInt(clientIdMatch[1], 10) : null;

  const { data: clients } = trpc.clients.list.useQuery();

  // Get client name for breadcrumb
  useEffect(() => {
    if (activeClientId && clients) {
      const client = clients.find(c => c.id === activeClientId);
      setClientName(client?.name || "");
    }
  }, [activeClientId, clients]);

  // Get calendar events for the current month
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);

  // If in client context, use that client ID, otherwise use selected client
  const effectiveClientId = activeClientId || (selectedClient !== "all" ? parseInt(selectedClient) : undefined);

  const { data: events, isLoading: eventsLoading } = trpc.calendar.events.useQuery({
    startDate: monthStart.toISOString(),
    endDate: monthEnd.toISOString(),
    clientId: effectiveClientId,
  }, {
    enabled: activeClientId ? true : selectedClient !== "all",
  });

  const { data: upcomingEvents } = trpc.calendar.upcoming.useQuery({
    clientId: effectiveClientId,
    days: 30,
  }, {
    enabled: activeClientId ? true : selectedClient !== "all",
  });

  const { data: overdueEvents } = trpc.calendar.overdue.useQuery({
    clientId: effectiveClientId,
  }, {
    enabled: activeClientId ? true : selectedClient !== "all",
  });

  // Filter events by type
  const filteredEvents = useMemo(() => {
    if (!events) return [];
    if (selectedEventType === "all") return events;
    return events.filter(e => e.type === selectedEventType);
  }, [events, selectedEventType]);

  // Get days in current month
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Get events for a specific day
  const getEventsForDay = (day: Date) => {
    return filteredEvents.filter(event =>
      isSameDay(new Date(event.date), day)
    );
  };

  // Navigation
  const goToPreviousMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const goToNextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const goToToday = () => setCurrentDate(new Date());

  // Get event type icon
  const getEventIcon = (type: string) => {
    switch (type) {
      case 'control_review':
        return <Shield className="h-3 w-3" />;
      case 'policy_renewal':
        return <FileText className="h-3 w-3" />;
      case 'evidence_expiration':
        return <CheckCircle className="h-3 w-3" />;
      case 'project_task':
        return <CheckCircle className="h-3 w-3" />;
      case 'remediation':
        return <AlertTriangle className="h-3 w-3" />;
      case 'poam':
        return <Shield className="h-3 w-3" />;
      default:
        return <CalendarIcon className="h-3 w-3" />;
    }
  };

  // Get priority color
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Get event type color
  const getEventTypeColor = (type: string) => {
    switch (type) {
      case 'control_review':
        return 'bg-primary';
      case 'policy_renewal':
        return 'bg-purple-500';
      case 'evidence_expiration':
        return 'bg-orange-500';
      case 'project_task':
        return 'bg-emerald-500';
      case 'remediation':
        return 'bg-amber-500';
      case 'poam':
        return 'bg-rose-600';
      default:
        return 'bg-gray-500';
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Breadcrumb Navigation */}
        {activeClientId && clientName && (
          <Breadcrumb items={[
            { label: 'Clients', href: '/clients' },
            { label: clientName, href: `/clients/${activeClientId}` },
            { label: 'Calendar' }
          ]} />
        )}

        {/* Header with filters */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold">Compliance Calendar</h1>
            <p className="text-muted-foreground">Track upcoming reviews, renewals, and expirations</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Select value={selectedClient} onValueChange={setSelectedClient}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All Clients" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Clients</SelectItem>
                {clients?.map(client => (
                  <SelectItem key={client.id} value={String(client.id)}>
                    {client.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedEventType} onValueChange={setSelectedEventType}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="control_review">Control Reviews</SelectItem>
                <SelectItem value="policy_renewal">Policy Renewals</SelectItem>
                <SelectItem value="evidence_expiration">Evidence Expirations</SelectItem>
                <SelectItem value="project_task">Project Tasks</SelectItem>
                <SelectItem value="remediation">Remediation Items</SelectItem>
                <SelectItem value="poam">POA&M Items</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex border rounded-md">
              <Button
                variant={viewMode === "calendar" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("calendar")}
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === "list" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("list")}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border-red-200 bg-red-50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2 text-red-800">
                <AlertTriangle className="h-4 w-4" />
                Overdue Items
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-900">{overdueEvents?.length || 0}</div>
              <p className="text-xs text-red-700">Require immediate attention</p>
            </CardContent>
          </Card>

          <Card className="border-yellow-200 bg-yellow-50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2 text-yellow-800">
                <Clock className="h-4 w-4" />
                Due This Week
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-900">
                {upcomingEvents?.filter(e => {
                  const dueDate = new Date(e.date);
                  const weekFromNow = new Date();
                  weekFromNow.setDate(weekFromNow.getDate() + 7);
                  return dueDate <= weekFromNow;
                }).length || 0}
              </div>
              <p className="text-xs text-yellow-700">Items due within 7 days</p>
            </CardContent>
          </Card>

          <Card className="border-blue-200 bg-blue-50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2 text-blue-800">
                <CalendarIcon className="h-4 w-4" />
                This Month
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-900">{filteredEvents?.length || 0}</div>
              <p className="text-xs text-blue-700">Total events in {format(currentDate, 'MMMM')}</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="calendar" className="space-y-4">
          <TabsList>
            <TabsTrigger value="calendar">Calendar View</TabsTrigger>
            <TabsTrigger value="upcoming">Upcoming ({upcomingEvents?.length || 0})</TabsTrigger>
            <TabsTrigger value="overdue" className="text-red-600">
              Overdue ({overdueEvents?.length || 0})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="calendar">
            <Card className="border-blue-100 shadow-sm">
              <CardHeader className="pb-4 border-b border-blue-100 bg-blue-50/50">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl text-blue-900 flex items-center gap-2">
                    <CalendarIcon className="h-5 w-5 text-blue-600" />
                    {format(currentDate, 'MMMM yyyy')}
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={goToToday} className="border-blue-200 hover:bg-blue-50 text-blue-700">
                      Today
                    </Button>
                    <Button variant="outline" size="icon" onClick={goToPreviousMonth} className="border-blue-200 hover:bg-blue-50 text-blue-700">
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="icon" onClick={goToNextMonth} className="border-blue-200 hover:bg-blue-50 text-blue-700">
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                {/* Calendar Grid */}
                <div className="grid grid-cols-7 gap-px bg-blue-200 rounded-lg overflow-hidden border border-blue-200">
                  {/* Day Headers */}
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                    <div key={day} className="bg-blue-600 p-3 text-center text-sm font-semibold text-white uppercase tracking-wider">
                      {day}
                    </div>
                  ))}

                  {/* Empty cells for days before month starts */}
                  {Array.from({ length: monthStart.getDay() }).map((_, i) => (
                    <div key={`empty-start-${i}`} className="bg-background p-2 min-h-[100px]" />
                  ))}

                  {/* Days of the month */}
                  {daysInMonth.map(day => {
                    const dayEvents = getEventsForDay(day);
                    const isCurrentDay = isToday(day);

                    return (
                      <div
                        key={day.toISOString()}
                        className={`bg-background p-2 min-h-[100px] ${isCurrentDay ? 'ring-2 ring-primary ring-inset' : ''}`}
                      >
                        <div className={`text-sm font-medium mb-1 ${isCurrentDay ? 'text-primary' : ''}`}>
                          {format(day, 'd')}
                        </div>
                        <div className="space-y-1">
                          {dayEvents.slice(0, 3).map(event => (
                            <div
                              key={event.id}
                              className={`text-xs p-1 rounded truncate flex items-center gap-1 ${getEventTypeColor(event.type)} text-white`}
                              title={`${event.title} - ${event.clientName}`}
                            >
                              {getEventIcon(event.type)}
                              <span className="truncate">{event.title}</span>
                            </div>
                          ))}
                          {dayEvents.length > 3 && (
                            <div className="text-xs text-muted-foreground">
                              +{dayEvents.length - 3} more
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}

                  {/* Empty cells for days after month ends */}
                  {Array.from({ length: 6 - monthEnd.getDay() }).map((_, i) => (
                    <div key={`empty-end-${i}`} className="bg-background p-2 min-h-[100px]" />
                  ))}
                </div>

                {/* Legend */}
                <div className="flex items-center gap-4 mt-4 text-sm flex-wrap">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded bg-primary"></div>
                    <span>Control Reviews</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded bg-purple-500"></div>
                    <span>Policy Renewals</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded bg-orange-500"></div>
                    <span>Evidence Expirations</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded bg-emerald-500"></div>
                    <span>Project Tasks</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded bg-amber-500"></div>
                    <span>Remediation</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded bg-rose-600"></div>
                    <span>POA&M</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="upcoming">
            <Card>
              <CardHeader>
                <CardTitle>Upcoming Deadlines (Next 30 Days)</CardTitle>
                <CardDescription>Items requiring attention soon</CardDescription>
              </CardHeader>
              <CardContent>
                {upcomingEvents && upcomingEvents.length > 0 ? (
                  <div className="space-y-3">
                    {upcomingEvents.map(event => (
                      <div
                        key={event.id}
                        className={`p-4 rounded-lg border ${getPriorityColor(event.priority)}`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3">
                            <div className={`p-2 rounded-full ${getEventTypeColor(event.type)} text-white`}>
                              {getEventIcon(event.type)}
                            </div>
                            <div>
                              <h4 className="font-medium">{event.title}</h4>
                              <p className="text-sm text-muted-foreground">{event.description}</p>
                              <p className="text-sm mt-1">
                                <span className="font-medium">Client:</span> {event.clientName}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <Badge variant={event.priority === 'high' ? 'destructive' : event.priority === 'medium' ? 'default' : 'secondary'}>
                              {event.priority}
                            </Badge>
                            <p className="text-sm mt-1 font-medium">
                              {format(new Date(event.date), 'MMM d, yyyy')}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <CalendarIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No upcoming deadlines in the next 30 days</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="overdue">
            <Card className="border-red-200">
              <CardHeader>
                <CardTitle className="text-red-800">Overdue Items</CardTitle>
                <CardDescription>Items that have passed their due date</CardDescription>
              </CardHeader>
              <CardContent>
                {overdueEvents && overdueEvents.length > 0 ? (
                  <div className="space-y-3">
                    {overdueEvents.map(event => (
                      <div
                        key={event.id}
                        className="p-4 rounded-lg border border-red-200 bg-red-50"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3">
                            <div className="p-2 rounded-full bg-red-500 text-white">
                              <AlertTriangle className="h-4 w-4" />
                            </div>
                            <div>
                              <h4 className="font-medium text-red-900">{event.title}</h4>
                              <p className="text-sm text-red-700">{event.description}</p>
                              <p className="text-sm mt-1 text-red-800">
                                <span className="font-medium">Client:</span> {event.clientName}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <Badge variant="destructive">OVERDUE</Badge>
                            <p className="text-sm mt-1 font-medium text-red-800">
                              Was due: {format(new Date(event.date), 'MMM d, yyyy')}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-green-600">
                    <CheckCircle className="h-12 w-12 mx-auto mb-4" />
                    <p className="font-medium">No overdue items!</p>
                    <p className="text-sm text-muted-foreground">All compliance items are up to date</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}

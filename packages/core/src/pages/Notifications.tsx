import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/DashboardLayout";
import { Breadcrumb } from "@/components/Breadcrumb";
import { useLocation } from "wouter";
import { Button } from "@complianceos/ui/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@complianceos/ui/ui/card";
import { Switch } from "@complianceos/ui/ui/switch";
import { Label } from "@complianceos/ui/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@complianceos/ui/ui/select";
import { Separator } from "@complianceos/ui/ui/separator";
import { Badge } from "@complianceos/ui/ui/badge";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  Bell,
  Mail,
  Clock,
  AlertTriangle,
  Calendar,
  Shield,
  FileText,
  CheckCircle,
  Send,
  History
} from "lucide-react";
import { useState, useEffect } from "react";
import { format } from "date-fns";

export default function Notifications() {
  const { user, loading: authLoading } = useAuth();
  const [location] = useLocation();
  const [clientName, setClientName] = useState<string>("");
  const utils = trpc.useUtils();

  // Extract client ID from URL if present
  const clientIdMatch = location.match(/\/clients\/(\d+)/);
  const activeClientId = clientIdMatch ? parseInt(clientIdMatch[1], 10) : null;

  const { data: client } = trpc.clients.get.useQuery(
    { id: activeClientId as number },
    { enabled: !!activeClientId, staleTime: 60_000 }
  );

  // Get client name for breadcrumb
  useEffect(() => {
    if (client?.name) setClientName(client.name);
  }, [client]);

  const { data: settings, isLoading: settingsLoading } = trpc.notifications.getSettings.useQuery(
    { clientId: activeClientId as number },
    { enabled: !!activeClientId, staleTime: 60_000, keepPreviousData: true }
  );
  const { data: logs, isLoading: logsLoading } = trpc.notifications.getLogs.useQuery(
    { clientId: activeClientId as number, limit: 20 },
    { enabled: !!activeClientId, staleTime: 60_000, keepPreviousData: true }
  );

  const updateSettings = trpc.notifications.updateSettings.useMutation({
    onSuccess: () => {
      utils.notifications.getSettings.invalidate({ clientId: activeClientId as number });
      toast.success("Notification settings updated");
    },
    onError: (error) => {
      toast.error(`Failed to update settings: ${error.message}`);
    },
  });

  const sendOverdueAlert = trpc.notifications.sendOverdueAlert.useMutation({
    onSuccess: (result) => {
      if (result.itemCount > 0) {
        toast.success(`Sent overdue alert for ${result.itemCount} items`);
      } else {
        toast.info("No overdue items to notify about");
      }
    },
    onError: (error) => {
      toast.error(`Failed to send alert: ${error.message}`);
    },
  });

  const sendUpcomingAlert = trpc.notifications.sendUpcomingAlert.useMutation({
    onSuccess: (result) => {
      if (result.itemCount > 0) {
        toast.success(`Sent upcoming alert for ${result.itemCount} items`);
      } else {
        toast.info("No upcoming items to notify about");
      }
    },
    onError: (error) => {
      toast.error(`Failed to send alert: ${error.message}`);
    },
  });

  const sendDailyDigest = trpc.notifications.sendDailyDigest.useMutation({
    onSuccess: (result) => {
      toast.success(`Daily digest sent: ${result.overdueCount} overdue, ${result.upcomingCount} upcoming`);
    },
    onError: (error) => {
      toast.error(`Failed to send digest: ${error.message}`);
    },
  });

  const sendWeeklyDigest = trpc.notifications.sendWeeklyDigest.useMutation({
    onSuccess: (result) => {
      toast.success(`Weekly digest sent: ${result.overdueCount} overdue, ${result.upcomingCount} upcoming`);
    },
    onError: (error) => {
      toast.error(`Failed to send digest: ${error.message}`);
    },
  });

  // Local state for form
  const [formState, setFormState] = useState({
    emailEnabled: true,
    upcomingReviewDays: 7,
    overdueEnabled: true,
    dailyDigestEnabled: false,
    weeklyDigestEnabled: true,
    notifyControlReviews: true,
    notifyPolicyRenewals: true,
    notifyEvidenceExpiration: true,
    notifyRiskReviews: true,
  });

  // Update form state when settings load
  useEffect(() => {
    if (settings) {
      setFormState({
        emailEnabled: !!settings.emailEnabled,
        upcomingReviewDays: settings.upcomingReviewDays || 7,
        overdueEnabled: !!settings.overdueEnabled,
        dailyDigestEnabled: !!settings.dailyDigestEnabled,
        weeklyDigestEnabled: !!settings.weeklyDigestEnabled,
        notifyControlReviews: !!settings.notifyControlReviews,
        notifyPolicyRenewals: !!settings.notifyPolicyRenewals,
        notifyEvidenceExpiration: !!settings.notifyEvidenceExpiration,
        notifyRiskReviews: !!settings.notifyRiskReviews,
      });
    }
  }, [settings]);

  const handleToggle = (key: keyof typeof formState) => {
    const newValue = !formState[key];
    setFormState(prev => ({ ...prev, [key]: newValue }));
    if (activeClientId) {
      updateSettings.mutate({ clientId: activeClientId, [key]: newValue });
    }
  };

  const handleDaysChange = (value: string) => {
    const days = parseInt(value);
    setFormState(prev => ({ ...prev, upcomingReviewDays: days }));
    if (activeClientId) {
      updateSettings.mutate({ clientId: activeClientId, upcomingReviewDays: days });
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const isAdmin = user?.role === 'admin';

  const formDisabled = !settings || updateSettings.isPending;
  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Breadcrumb Navigation */}
        {activeClientId && clientName && (
          <Breadcrumb items={[
            { label: 'Clients', href: '/clients' },
            { label: clientName, href: `/clients/${activeClientId}` },
            { label: 'Notifications' }
          ]} />
        )}
        <div>
          <h1 className="text-2xl font-bold">Notification Settings</h1>
          <p className="text-muted-foreground">Configure how you receive compliance alerts and reminders</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* General Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                General Settings
              </CardTitle>
              <CardDescription>Enable or disable notifications</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="emailEnabled">Email Notifications</Label>
                  <p className="text-sm text-muted-foreground">Receive notifications via email</p>
                </div>
                <Switch
                  id="emailEnabled"
                  checked={formState.emailEnabled}
                  onCheckedChange={() => handleToggle('emailEnabled')}
                  disabled={formDisabled}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="overdueEnabled">Overdue Alerts</Label>
                  <p className="text-sm text-muted-foreground">Get notified about overdue items</p>
                </div>
                <Switch
                  id="overdueEnabled"
                  checked={formState.overdueEnabled}
                  onCheckedChange={() => handleToggle('overdueEnabled')}
                  disabled={formDisabled || !formState.emailEnabled}
                />
              </div>

              <div className="space-y-2">
                <Label>Advance Notice Period</Label>
                <p className="text-sm text-muted-foreground">How many days before due date to notify</p>
                <Select
                  value={String(formState.upcomingReviewDays)}
                  onValueChange={handleDaysChange}
                  disabled={formDisabled || !formState.emailEnabled}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="3">3 days</SelectItem>
                    <SelectItem value="5">5 days</SelectItem>
                    <SelectItem value="7">7 days (recommended)</SelectItem>
                    <SelectItem value="14">14 days</SelectItem>
                    <SelectItem value="30">30 days</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Digest Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Digest Emails
              </CardTitle>
              <CardDescription>Summary emails of compliance status</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="dailyDigest">Daily Digest</Label>
                  <p className="text-sm text-muted-foreground">Receive a daily summary</p>
                </div>
                <Switch
                  id="dailyDigest"
                  checked={formState.dailyDigestEnabled}
                  onCheckedChange={() => handleToggle('dailyDigestEnabled')}
                  disabled={formDisabled || !formState.emailEnabled}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="weeklyDigest">Weekly Digest</Label>
                  <p className="text-sm text-muted-foreground">Receive a weekly summary</p>
                </div>
                <Switch
                  id="weeklyDigest"
                  checked={formState.weeklyDigestEnabled}
                  onCheckedChange={() => handleToggle('weeklyDigestEnabled')}
                  disabled={formDisabled || !formState.emailEnabled}
                />
              </div>
            </CardContent>
          </Card>

          {/* Event Types */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Event Types
              </CardTitle>
              <CardDescription>Choose which events trigger notifications</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-blue-500" />
                  <div className="space-y-0.5">
                    <Label htmlFor="controlReviews">Control Reviews</Label>
                    <p className="text-sm text-muted-foreground">Control review deadlines</p>
                  </div>
                </div>
                <Switch
                  id="controlReviews"
                  checked={formState.notifyControlReviews}
                  onCheckedChange={() => handleToggle('notifyControlReviews')}
                  disabled={formDisabled || !formState.emailEnabled}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-purple-500" />
                  <div className="space-y-0.5">
                    <Label htmlFor="policyRenewals">Policy Renewals</Label>
                    <p className="text-sm text-muted-foreground">Policy renewal deadlines</p>
                  </div>
                </div>
                <Switch
                  id="policyRenewals"
                  checked={formState.notifyPolicyRenewals}
                  onCheckedChange={() => handleToggle('notifyPolicyRenewals')}
                  disabled={formDisabled || !formState.emailEnabled}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-orange-500" />
                  <div className="space-y-0.5">
                    <Label htmlFor="evidenceExpiration">Evidence Expiration</Label>
                    <p className="text-sm text-muted-foreground">Evidence expiration dates</p>
                  </div>
                </div>
                <Switch
                  id="evidenceExpiration"
                  checked={formState.notifyEvidenceExpiration}
                  onCheckedChange={() => handleToggle('notifyEvidenceExpiration')}
                  disabled={formDisabled || !formState.emailEnabled}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-red-500" />
                  <div className="space-y-0.5">
                    <Label htmlFor="riskReviews">Risk Reviews</Label>
                    <p className="text-sm text-muted-foreground">Risk assessment and treatment deadlines</p>
                  </div>
                </div>
                <Switch
                  id="riskReviews"
                  checked={formState.notifyRiskReviews}
                  onCheckedChange={() => handleToggle('notifyRiskReviews')}
                  disabled={formDisabled || !formState.emailEnabled}
                />
              </div>
            </CardContent>
          </Card>

          {/* Manual Send (Admin Only) */}
          {isAdmin && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Send className="h-5 w-5" />
                  Send Notifications
                </CardTitle>
                <CardDescription>Manually trigger notification emails (Admin only)</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => sendOverdueAlert.mutate()}
                  disabled={sendOverdueAlert.isPending}
                >
                  <AlertTriangle className="h-4 w-4 mr-2 text-red-500" />
                  {sendOverdueAlert.isPending ? "Sending..." : "Send Overdue Alert"}
                </Button>

                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => sendUpcomingAlert.mutate({ days: 7 })}
                  disabled={sendUpcomingAlert.isPending}
                >
                  <Clock className="h-4 w-4 mr-2 text-yellow-500" />
                  {sendUpcomingAlert.isPending ? "Sending..." : "Send Upcoming Alert (7 days)"}
                </Button>

                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => sendDailyDigest.mutate()}
                  disabled={sendDailyDigest.isPending}
                >
                  <Calendar className="h-4 w-4 mr-2 text-blue-500" />
                  {sendDailyDigest.isPending ? "Sending..." : "Send Daily Digest"}
                </Button>

                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => sendWeeklyDigest.mutate()}
                  disabled={sendWeeklyDigest.isPending}
                >
                  <Mail className="h-4 w-4 mr-2 text-green-500" />
                  {sendWeeklyDigest.isPending ? "Sending..." : "Send Weekly Digest"}
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Notification History */}
        {logsLoading ? (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5" />
                Recent Notifications
              </CardTitle>
              <CardDescription>History of sent notifications</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-16 w-full bg-muted rounded" />
                ))}
              </div>
            </CardContent>
          </Card>
        ) : logs && logs.length > 0 ? (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5" />
                Recent Notifications
              </CardTitle>
              <CardDescription>History of sent notifications</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {logs.map((log) => (
                  <div key={log.id} className="flex items-start justify-between p-3 border rounded-lg">
                    <div className="space-y-1">
                      <p className="font-medium">{log.title}</p>
                      <p className="text-sm text-muted-foreground line-clamp-2">{log.message}</p>
                    </div>
                    <div className="text-right">
                      <Badge variant={log.status === 'sent' ? 'default' : log.status === 'failed' ? 'destructive' : 'secondary'}>
                        {log.status}
                      </Badge>
                      <p className="text-xs text-muted-foreground mt-1">
                        {format(new Date(log.sentAt), 'MMM d, h:mm a')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ) : null}
      </div>
    </DashboardLayout>
  );
}

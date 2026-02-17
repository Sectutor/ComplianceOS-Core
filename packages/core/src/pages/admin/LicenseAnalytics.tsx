/**
 * License Analytics Dashboard
 * 
 * Admin dashboard for license analytics, usage tracking, and renewal management
 */

import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@complianceos/ui/ui/card";
import { trpc } from "@/lib/trpc";
import { Button } from "@complianceos/ui/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@complianceos/ui/ui/tabs";
import { Badge } from "@complianceos/ui/ui/badge";
import { Separator } from "@complianceos/ui/ui/separator";
import { 
  BarChart3, 
  Calendar, 
  CheckCircle, 
  Clock, 
  CreditCard, 
  Download, 
  Filter, 
  LineChart, 
  PieChart, 
  RefreshCw, 
  Shield, 
  TrendingUp, 
  Users,
  AlertTriangle,
  Zap,
  DollarSign,
  FileText
} from "lucide-react";
import { useState } from "react";
import { format, subDays, startOfMonth, endOfMonth } from "date-fns";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart as RechartsPieChart,
  Pie,
  Cell
} from "recharts";

export default function LicenseAnalyticsPage() {
  const [activeTab, setActiveTab] = useState("overview");
  const [dateRange, setDateRange] = useState<{ start: Date; end: Date }>({
    start: startOfMonth(new Date()),
    end: endOfMonth(new Date()),
  });
  
  // Fetch analytics data
  const { data: analyticsData, refetch: refetchAnalytics, isLoading: analyticsLoading } = 
    trpc.gumroad.getLicenseAnalytics.useQuery({
      startDate: dateRange.start.toISOString(),
      endDate: dateRange.end.toISOString(),
    });
  
  // Fetch expiring licenses
  const { data: expiringData, refetch: refetchExpiring, isLoading: expiringLoading } = 
    trpc.gumroad.getExpiringLicenses.useQuery({ days: 30 });
  
  // Fetch expired licenses
  const { data: expiredData, refetch: refetchExpired, isLoading: expiredLoading } = 
    trpc.gumroad.getExpiredLicenses.useQuery();
  
  // Handle date range change
  const handleDateRangeChange = (days: number) => {
    const end = new Date();
    const start = subDays(end, days);
    setDateRange({ start, end });
  };
  
  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };
  
  // Prepare chart data
  const activationTrendData = analyticsData?.analytics?.activationTrend?.map(item => ({
    date: format(new Date(item.date), 'MMM dd'),
    count: item.count,
  })) || [];
  
  const licenseTypeData = analyticsData?.analytics?.licenseTypes?.map(item => ({
    name: item.type.charAt(0).toUpperCase() + item.type.slice(1),
    value: item.count,
  })) || [];
  
  const revenueData = analyticsData?.analytics?.revenueByType?.map(item => ({
    name: item.type.charAt(0).toUpperCase() + item.type.slice(1),
    revenue: item.revenue,
  })) || [];
  
  // Colors for charts
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];
  
  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">License Analytics</h1>
            <p className="text-muted-foreground mt-1">
              Monitor license usage, revenue, and renewal status
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => refetchAnalytics()}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>
        
        {/* Date Range Filter */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                <span className="text-sm font-medium">Date Range</span>
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleDateRangeChange(7)}
                >
                  7 Days
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleDateRangeChange(30)}
                >
                  30 Days
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleDateRangeChange(90)}
                >
                  90 Days
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    setDateRange({
                      start: startOfMonth(new Date()),
                      end: endOfMonth(new Date()),
                    });
                  }}
                >
                  This Month
                </Button>
              </div>
            </div>
            <div className="mt-2 text-sm text-muted-foreground">
              {format(dateRange.start, 'MMM dd, yyyy')} - {format(dateRange.end, 'MMM dd, yyyy')}
            </div>
          </CardContent>
        </Card>
        
        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="usage">Usage Analytics</TabsTrigger>
            <TabsTrigger value="renewals">Renewal Management</TabsTrigger>
            <TabsTrigger value="revenue">Revenue Analytics</TabsTrigger>
          </TabsList>
          
          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Key Metrics */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    Total Licenses
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {analyticsLoading ? "..." : analyticsData?.analytics?.totalLicenses || 0}
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">
                    Across all clients
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <CheckCircle className="h-4 w-4" />
                    Active Licenses
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {analyticsLoading ? "..." : analyticsData?.analytics?.activeLicenses || 0}
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">
                    Currently active
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4" />
                    Expiring Soon
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {expiringLoading ? "..." : expiringData?.count || 0}
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">
                    Within 30 days
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    Monthly Revenue
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {analyticsLoading ? "..." : formatCurrency(
                      analyticsData?.analytics?.revenueByType?.reduce((sum, item) => sum + item.revenue, 0) || 0
                    )}
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">
                    Estimated monthly
                  </div>
                </CardContent>
              </Card>
            </div>
            
            {/* Charts */}
            <div className="grid gap-6 md:grid-cols-2">
              {/* Activation Trend */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Activation Trend
                  </CardTitle>
                  <CardDescription>
                    New license activations over time
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={activationTrendData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line 
                          type="monotone" 
                          dataKey="count" 
                          stroke="#8884d8" 
                          name="Activations"
                          strokeWidth={2}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
              
              {/* License Types */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <PieChart className="h-5 w-5" />
                    License Distribution
                  </CardTitle>
                  <CardDescription>
                    Breakdown by license type
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsPieChart>
                        <Pie
                          data={licenseTypeData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {licenseTypeData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </RechartsPieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            {/* Renewal Alerts */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Renewal Management
                </CardTitle>
                <CardDescription>
                  Licenses requiring attention
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Expiring Licenses */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        Expiring Soon ({expiringData?.count || 0})
                      </h3>
                      <Badge variant="outline" className="border-amber-200 text-amber-800">
                        Action Required
                      </Badge>
                    </div>
                    {expiringLoading ? (
                      <div className="text-center py-4">Loading...</div>
                    ) : expiringData?.licenses && expiringData.licenses.length > 0 ? (
                      <div className="space-y-2">
                        {expiringData.licenses.slice(0, 3).map((license) => (
                          <div key={license.id} className="flex items-center justify-between p-3 border rounded-lg">
                            <div>
                              <div className="font-medium">{license.customerName || 'Unknown Customer'}</div>
                              <div className="text-sm text-muted-foreground">
                                {license.licenseType} • Expires {license.expiresAt ? format(new Date(license.expiresAt), 'MMM dd, yyyy') : 'Never'}
                              </div>
                            </div>
                            <Button size="sm" variant="outline">
                              Send Reminder
                            </Button>
                          </div>
                        ))}
                        {expiringData.licenses.length > 3 && (
                          <div className="text-center text-sm text-muted-foreground">
                            + {expiringData.licenses.length - 3} more licenses expiring soon
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-4 text-muted-foreground">
                        No licenses expiring soon
                      </div>
                    )}
                  </div>
                  
                  <Separator />
                  
                  {/* Expired Licenses */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4" />
                        Expired Licenses ({expiredData?.count || 0})
                      </h3>
                      <Badge variant="outline" className="border-red-200 text-red-800">
                        Critical
                      </Badge>
                    </div>
                    {expiredLoading ? (
                      <div className="text-center py-4">Loading...</div>
                    ) : expiredData?.licenses && expiredData.licenses.length > 0 ? (
                      <div className="space-y-2">
                        {expiredData.licenses.slice(0, 3).map((license) => (
                          <div key={license.id} className="flex items-center justify-between p-3 border rounded-lg bg-red-50">
                            <div>
                              <div className="font-medium">{license.customerName || 'Unknown Customer'}</div>
                              <div className="text-sm text-muted-foreground">
                                {license.licenseType} • Expired {license.expiresAt ? format(new Date(license.expiresAt), 'MMM dd, yyyy') : 'Unknown'}
                              </div>
                            </div>
                            <Button size="sm" variant="destructive">
                              Contact
                            </Button>
                          </div>
                        ))}
                        {expiredData.licenses.length > 3 && (
                          <div className="text-center text-sm text-muted-foreground">
                            + {expiredData.licenses.length - 3} more expired licenses
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-4 text-muted-foreground">
                        No expired licenses
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Usage Analytics Tab */}
          <TabsContent value="usage" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Feature Usage Analytics
                </CardTitle>
                <CardDescription>
                  Track how clients are using licensed features
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Usage Statistics */}
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="space-y-2">
                      <div className="text-sm font-medium">Total Feature Usage</div>
                      <div className="text-2xl font-bold">1,247</div>
                      <div className="text-sm text-muted-foreground">Last 30 days</div>
                    </div>
                    <div className="space-y-2">
                      <div className="text-sm font-medium">Unique Features Used</div>
                      <div className="text-2xl font-bold">24</div>
                      <div className="text-sm text-muted-foreground">Out of 40 available</div>
                    </div>
                    <div className="space-y-2">
                      <div className="text-sm font-medium">Avg. Usage per Client</div>
                      <div className="text-2xl font-bold">8.3</div>
                      <div className="text-sm text-muted-foreground">Features per day</div>
                    </div>
                  </div>
                  
                  {/* Top Features Chart */}
                  <div>
                    <h3 className="font-medium mb-4">Top Used Features</h3>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={[
                            { name: 'AI Analysis', usage: 342 },
                            { name: 'Reports', usage: 287 },
                            { name: 'Export', usage: 198 },
                            { name: 'Templates', usage: 156 },
                            { name: 'API Access', usage: 124 },
                            { name: 'Audit Trail', usage: 98 },
                            { name: 'Custom Fields', usage: 76 },
                          ]}
                          layout="vertical"
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis type="number" />
                          <YAxis type="category" dataKey="name" width={100} />
                          <Tooltip />
                          <Bar dataKey="usage" fill="#8884d8" name="Usage Count" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                  
                  {/* Usage by License Type */}
                  <div>
                    <h3 className="font-medium mb-4">Usage by License Type</h3>
                    <div className="grid gap-4 md:grid-cols-3">
                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm">Enterprise</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold">892</div>
                          <div className="text-sm text-muted-foreground">71% of total usage</div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm">Trial</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold">312</div>
                          <div className="text-sm text-muted-foreground">25% of total usage</div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm">Community</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold">43</div>
                          <div className="text-sm text-muted-foreground">3% of total usage</div>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Renewal Management Tab */}
          <TabsContent value="renewals" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Renewal Management
                </CardTitle>
                <CardDescription>
                  Manage license renewals and send reminders
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Renewal Settings */}
                  <div>
                    <h3 className="font-medium mb-4">Renewal Settings</h3>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">First Reminder</label>
                        <div className="flex items-center gap-2">
                          <input 
                            type="number" 
                            className="w-20 border rounded px-2 py-1"
                            defaultValue={30}
                          />
                          <span className="text-sm">days before expiry</span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Second Reminder</label>
                        <div className="flex items-center gap-2">
                          <input 
                            type="number" 
                            className="w-20 border rounded px-2 py-1"
                            defaultValue={7}
                          />
                          <span className="text-sm">days before expiry</span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Final Reminder</label>
                        <div className="flex items-center gap-2">
                          <input 
                            type="number" 
                            className="w-20 border rounded px-2 py-1"
                            defaultValue={1}
                          />
                          <span className="text-sm">day before expiry</span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Expiry Follow-up</label>
                        <div className="flex items-center gap-2">
                          <input 
                            type="number" 
                            className="w-20 border rounded px-2 py-1"
                            defaultValue={7}
                          />
                          <span className="text-sm">days after expiry</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  {/* Automated Renewal Actions */}
                  <div>
                    <h3 className="font-medium mb-4">Automated Actions</h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-blue-100 rounded">
                            <FileText className="h-4 w-4 text-blue-600" />
                          </div>
                          <div>
                            <div className="font-medium">Email Reminders</div>
                            <div className="text-sm text-muted-foreground">
                              Send automated renewal reminders via email
                            </div>
                          </div>
                        </div>
                        <Button size="sm">Configure</Button>
                      </div>
                      
                      <div className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-green-100 rounded">
                            <CreditCard className="h-4 w-4 text-green-600" />
                          </div>
                          <div>
                            <div className="font-medium">Auto-renewal</div>
                            <div className="text-sm text-muted-foreground">
                              Process automatic renewals for recurring licenses
                            </div>
                          </div>
                        </div>
                        <Button size="sm" variant="outline">Enable</Button>
                      </div>
                      
                      <div className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-amber-100 rounded">
                            <AlertTriangle className="h-4 w-4 text-amber-600" />
                          </div>
                          <div>
                            <div className="font-medium">Expiry Notifications</div>
                            <div className="text-sm text-muted-foreground">
                              Notify admins when licenses expire
                            </div>
                          </div>
                        </div>
                        <Button size="sm" variant="outline">Configure</Button>
                      </div>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  {/* Manual Renewal Actions */}
                  <div>
                    <h3 className="font-medium mb-4">Manual Actions</h3>
                    <div className="flex gap-2">
                      <Button>
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Send All Renewal Reminders
                      </Button>
                      <Button variant="outline">
                        <Download className="h-4 w-4 mr-2" />
                        Export Renewal Report
                      </Button>
                      <Button variant="outline">
                        <Calendar className="h-4 w-4 mr-2" />
                        View Renewal Calendar
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Revenue Analytics Tab */}
          <TabsContent value="revenue" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Revenue Analytics
                </CardTitle>
                <CardDescription>
                  Track license revenue and financial metrics
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Revenue Metrics */}
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="space-y-2">
                      <div className="text-sm font-medium">Monthly Recurring Revenue</div>
                      <div className="text-2xl font-bold">
                        {formatCurrency(analyticsData?.analytics?.revenueByType?.reduce((sum, item) => sum + item.revenue, 0) || 0)}
                      </div>
                      <div className="text-sm text-green-600">+12% from last month</div>
                    </div>
                    <div className="space-y-2">
                      <div className="text-sm font-medium">Annual Run Rate</div>
                      <div className="text-2xl font-bold">
                        {formatCurrency((analyticsData?.analytics?.revenueByType?.reduce((sum, item) => sum + item.revenue, 0) || 0) * 12)}
                      </div>
                      <div className="text-sm text-green-600">+15% growth</div>
                    </div>
                    <div className="space-y-2">
                      <div className="text-sm font-medium">Average Revenue per License</div>
                      <div className="text-2xl font-bold">$87.50</div>
                      <div className="text-sm text-green-600">+8% increase</div>
                    </div>
                  </div>
                  
                  {/* Revenue by License Type */}
                  <div>
                    <h3 className="font-medium mb-4">Revenue by License Type</h3>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={revenueData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis />
                          <Tooltip formatter={(value) => [formatCurrency(Number(value)), 'Revenue']} />
                          <Legend />
                          <Bar dataKey="revenue" fill="#82ca9d" name="Monthly Revenue" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                  
                  {/* Revenue Forecast */}
                  <div>
                    <h3 className="font-medium mb-4">Revenue Forecast</h3>
                    <div className="grid gap-4 md:grid-cols-3">
                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm">Next Month</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold">
                            {formatCurrency(
                              (analyticsData?.analytics?.revenueByType?.reduce((sum, item) => sum + item.revenue, 0) || 0) * 1.12
                            )}
                          </div>
                          <div className="text-sm text-green-600">+12% projected</div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm">Next Quarter</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold">
                            {formatCurrency(
                              (analyticsData?.analytics?.revenueByType?.reduce((sum, item) => sum + item.revenue, 0) || 0) * 3 * 1.15
                            )}
                          </div>
                          <div className="text-sm text-green-600">+15% projected</div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm">Next Year</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold">
                            {formatCurrency(
                              (analyticsData?.analytics?.revenueByType?.reduce((sum, item) => sum + item.revenue, 0) || 0) * 12 * 1.18
                            )}
                          </div>
                          <div className="text-sm text-green-600">+18% projected</div>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
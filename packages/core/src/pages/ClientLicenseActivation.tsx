/**
 * Client License Activation Page
 * 
 * Allows clients to activate their ComplianceOS license keys
 */

import { useState } from "react";
import { useParams, useLocation } from "wouter";
import DashboardLayout from "@/components/DashboardLayout";
import { Breadcrumb } from "@/components/Breadcrumb";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@complianceos/ui/ui/card";
import { Button } from "@complianceos/ui/ui/button";
import { Input } from "@complianceos/ui/ui/input";
import { Label } from "@complianceos/ui/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@complianceos/ui/ui/alert";
import { Separator } from "@complianceos/ui/ui/separator";
import { Badge } from "@complianceos/ui/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@complianceos/ui/ui/tabs";
import { 
  CheckCircle, 
  Key, 
  AlertCircle, 
  Clock, 
  Zap, 
  Shield, 
  CreditCard, 
  Building2,
  RefreshCw,
  ExternalLink,
  ArrowRight,
  Info
} from "lucide-react";
import { useToast } from "@complianceos/ui/ui/use-toast";

export default function ClientLicenseActivation() {
  const params = useParams();
  const clientId = Number(params.id);
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  const [licenseKey, setLicenseKey] = useState("");
  const [activeTab, setActiveTab] = useState("activate");
  
  // Fetch client details
  const { data: client, isLoading: clientLoading } = trpc.clients.get.useQuery({ id: clientId });
  
  // Fetch current license status
  const { data: licenseStatus, refetch: refetchLicenseStatus } = trpc.gumroad.getLicenseStatus.useQuery(
    { clientId },
    { enabled: !!clientId }
  );
  
  // License activation mutation
  const activateLicenseMutation = trpc.gumroad.activateLicense.useMutation({
    onSuccess: (data) => {
      toast({
        title: "License Activated",
        description: "Your license has been successfully activated.",
        variant: "default",
      });
      refetchLicenseStatus();
      setLicenseKey("");
    },
    onError: (error) => {
      toast({
        title: "Activation Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // License deactivation mutation
  const deactivateLicenseMutation = trpc.gumroad.deactivateLicense.useMutation({
    onSuccess: () => {
      toast({
        title: "License Deactivated",
        description: "Your license has been deactivated.",
        variant: "default",
      });
      refetchLicenseStatus();
    },
    onError: (error) => {
      toast({
        title: "Deactivation Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Handle license activation
  const handleActivateLicense = () => {
    if (!licenseKey.trim()) {
      toast({
        title: "License Key Required",
        description: "Please enter a valid license key.",
        variant: "destructive",
      });
      return;
    }
    
    activateLicenseMutation.mutate({
      clientId,
      licenseKey: licenseKey.trim(),
      productPermalink: "complianceos-enterprise",
    });
  };
  
  // Handle license deactivation
  const handleDeactivateLicense = () => {
    if (!licenseStatus?.licenseKey) {
      toast({
        title: "No Active License",
        description: "There is no active license to deactivate.",
        variant: "destructive",
      });
      return;
    }
    
    deactivateLicenseMutation.mutate({
      clientId,
      licenseKey: licenseStatus.licenseKey,
    });
  };
  
  // Format date
  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };
  
  // Get status badge
  const getStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case "active":
      case "valid":
        return <Badge variant="default" className="bg-green-100 text-green-800 hover:bg-green-100">Active</Badge>;
      case "expired":
        return <Badge variant="outline" className="border-amber-200 text-amber-800">Expired</Badge>;
      case "suspended":
      case "revoked":
        return <Badge variant="outline" className="border-red-200 text-red-800">Suspended</Badge>;
      case "pending":
        return <Badge variant="outline" className="border-blue-200 text-blue-800">Pending</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };
  
  // Get license type badge
  const getLicenseTypeBadge = (type: string) => {
    switch (type?.toLowerCase()) {
      case "enterprise":
        return <Badge variant="default" className="bg-purple-100 text-purple-800 hover:bg-purple-100">Enterprise</Badge>;
      case "trial":
        return <Badge variant="outline" className="border-blue-200 text-blue-800">Trial</Badge>;
      case "community":
        return <Badge variant="outline" className="border-gray-200 text-gray-800">Community</Badge>;
      default:
        return <Badge variant="outline">{type || "Unknown"}</Badge>;
    }
  };
  
  if (clientLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
            <p className="mt-2 text-muted-foreground">Loading client information...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }
  
  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Breadcrumb */}
        <Breadcrumb
          items={[
            { label: "Dashboard", href: "/" },
            { label: client?.name || "Client", href: `/clients/${clientId}` },
            { label: "License Activation", href: `/clients/${clientId}/license` },
          ]}
        />
        
        {/* Header */}
        <div>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">License Activation</h1>
              <p className="text-muted-foreground mt-1">
                Activate your ComplianceOS license for {client?.name || "this client"}
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => setLocation(`/clients/${clientId}/settings`)}
            >
              <ArrowRight className="h-4 w-4 mr-2" />
              Back to Settings
            </Button>
          </div>
        </div>
        
        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList>
            <TabsTrigger value="activate">Activate License</TabsTrigger>
            <TabsTrigger value="status">License Status</TabsTrigger>
            <TabsTrigger value="features">Available Features</TabsTrigger>
            <TabsTrigger value="help">Help & Support</TabsTrigger>
          </TabsList>
          
          {/* Activate License Tab */}
          <TabsContent value="activate" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              {/* Activation Form */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Key className="h-5 w-5" />
                    Activate License
                  </CardTitle>
                  <CardDescription>
                    Enter your Gumroad license key to activate premium features
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="licenseKey">License Key</Label>
                    <Input
                      id="licenseKey"
                      placeholder="Enter your Gumroad license key"
                      value={licenseKey}
                      onChange={(e) => setLicenseKey(e.target.value)}
                      className="font-mono"
                    />
                    <p className="text-sm text-muted-foreground">
                      You can find your license key in your Gumroad purchase confirmation email
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Product</Label>
                    <div className="p-3 border rounded-md bg-muted/50">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">ComplianceOS Enterprise</div>
                          <div className="text-sm text-muted-foreground">complianceos-enterprise</div>
                        </div>
                        <Badge variant="outline">Recommended</Badge>
                      </div>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div className="space-y-3">
                    <Button
                      onClick={handleActivateLicense}
                      disabled={activateLicenseMutation.isPending || !licenseKey.trim()}
                      className="w-full"
                    >
                      {activateLicenseMutation.isPending ? (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                          Activating...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Activate License
                        </>
                      )}
                    </Button>
                    
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => window.open("https://gumroad.com/l/complianceos-enterprise", "_blank")}
                    >
                      <CreditCard className="h-4 w-4 mr-2" />
                      Purchase License
                    </Button>
                  </div>
                </CardContent>
              </Card>
              
              {/* Current Status */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Current Status
                  </CardTitle>
                  <CardDescription>
                    Your current license status and features
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {licenseStatus ? (
                    <>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">Status</span>
                          {getStatusBadge(licenseStatus.status)}
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">License Type</span>
                          {getLicenseTypeBadge(licenseStatus.type)}
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">Issued To</span>
                          <span className="text-sm font-medium">{licenseStatus.issuedTo || "N/A"}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">Activated</span>
                          <span className="text-sm font-medium">{formatDate(licenseStatus.activatedAt)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">Expires</span>
                          <span className="text-sm font-medium">
                            {licenseStatus.expiresAt ? formatDate(licenseStatus.expiresAt) : "Never"}
                          </span>
                        </div>
                      </div>
                      
                      <Separator />
                      
                      <div>
                        <h4 className="font-medium mb-2">Enabled Features</h4>
                        <div className="space-y-1">
                          {licenseStatus.features && licenseStatus.features.length > 0 ? (
                            licenseStatus.features.slice(0, 5).map((feature: string) => (
                              <div key={feature} className="flex items-center gap-2 text-sm">
                                <CheckCircle className="h-4 w-4 text-green-500" />
                                <span className="truncate">{feature}</span>
                              </div>
                            ))
                          ) : (
                            <div className="text-sm text-muted-foreground">No premium features enabled</div>
                          )}
                          {licenseStatus.features && licenseStatus.features.length > 5 && (
                            <div className="text-sm text-muted-foreground">
                              + {licenseStatus.features.length - 5} more features...
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {licenseStatus.status === "active" && (
                        <>
                          <Separator />
                          <Button
                            variant="outline"
                            onClick={handleDeactivateLicense}
                            disabled={deactivateLicenseMutation.isPending}
                            className="w-full"
                          >
                            {deactivateLicenseMutation.isPending ? (
                              <>
                                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                                Deactivating...
                              </>
                            ) : (
                              <>
                                <AlertCircle className="h-4 w-4 mr-2" />
                                Deactivate License
                              </>
                            )}
                          </Button>
                        </>
                      )}
                    </>
                  ) : (
                    <div className="text-center py-8">
                      <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                      <h3 className="font-medium">No Active License</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        Activate a license to unlock premium features
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
            
            {/* Information Alert */}
            <Alert>
              <Info className="h-4 w-4" />
              <AlertTitle>License Information</AlertTitle>
              <AlertDescription>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li>License keys are tied to your Gumroad account and purchase</li>
                  <li>Enterprise licenses include all premium features and priority support</li>
                  <li>Trial licenses are valid for 30 days with limited features</li>
                  <li>Community edition is free under AGPLv3 with basic features</li>
                </ul>
              </AlertDescription>
            </Alert>
          </TabsContent>
          
          {/* License Status Tab */}
          <TabsContent value="status" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  License Details
                </CardTitle>
                <CardDescription>
                  Detailed information about your current license
                </CardDescription>
              </CardHeader>
              <CardContent>
                {licenseStatus ? (
                  <div className="space-y-6">
                    {/* License Summary */}
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                      <div className="space-y-1">
                        <div className="text-sm text-muted-foreground">License Type</div>
                        <div className="font-medium">{licenseStatus.type || "Community"}</div>
                      </div>
                      <div className="space-y-1">
                        <div className="text-sm text-muted-foreground">Status</div>
                        <div>{getStatusBadge(licenseStatus.status)}</div>
                      </div>
                      <div className="space-y-1">
                        <div className="text-sm text-muted-foreground">Activated</div>
                        <div className="font-medium">{formatDate(licenseStatus.activatedAt)}</div>
                      </div>
                      <div className="space-y-1">
                        <div className="text-sm text-muted-foreground">Expires</div>
                        <div className="font-medium">
                          {licenseStatus.expiresAt ? formatDate(licenseStatus.expiresAt) : "Never"}
                        </div>
                      </div>
                    </div>
                    
                    <Separator />
                    
                    {/* Customer Information */}
                    <div>
                      <h3 className="font-medium mb-3">Customer Information</h3>
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-1">
                          <div className="text-sm text-muted-foreground">Issued To</div>
                          <div className="font-medium">{licenseStatus.issuedTo || "N/A"}</div>
                        </div>
                        <div className="space-y-1">
                          <div className="text-sm text-muted-foreground">Email</div>
                          <div className="font-medium">{licenseStatus.email || "N/A"}</div>
                        </div>
                        <div className="space-y-1">
                          <div className="text-sm text-muted-foreground">License Key</div>
                          <div className="font-mono text-sm bg-muted p-2 rounded truncate">
                            {licenseStatus.licenseKey || "N/A"}
                          </div>
                        </div>
                        <div className="space-y-1">
                          <div className="text-sm text-muted-foreground">Product</div>
                          <div className="font-medium">{licenseStatus.productName || "ComplianceOS"}</div>
                        </div>
                      </div>
                    </div>
                    
                    <Separator />
                    
                    {/* Limits */}
                    <div>
                      <h3 className="font-medium mb-3">License Limits</h3>
                      <div className="grid gap-4 md:grid-cols-3">
                        <div className="space-y-1">
                          <div className="text-sm text-muted-foreground">Max Users</div>
                          <div className="font-medium">{licenseStatus.maxUsers || "Unlimited"}</div>
                        </div>
                        <div className="space-y-1">
                          <div className="text-sm text-muted-foreground">Max Clients</div>
                          <div className="font-medium">{licenseStatus.maxClients || "Unlimited"}</div>
                        </div>
                        <div className="space-y-1">
                          <div className="text-sm text-muted-foreground">Features</div>
                          <div className="font-medium">{licenseStatus.features?.length || 0} enabled</div>
                        </div>
                      </div>
                    </div>
                    
                    <Separator />
                    
                    {/* Actions */}
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        onClick={() => setActiveTab("activate")}
                      >
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Change License
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => window.open("https://app.gumroad.com/library", "_blank")}
                      >
                        <ExternalLink className="h-4 w-4 mr-2" />
                        View in Gumroad
                      </Button>
                      {licenseStatus.status === "active" && (
                        <Button
                          variant="destructive"
                          onClick={handleDeactivateLicense}
                          disabled={deactivateLicenseMutation.isPending}
                        >
                          {deactivateLicenseMutation.isPending ? (
                            <>
                              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                              Deactivating...
                            </>
                          ) : (
                            <>
                              <AlertCircle className="h-4 w-4 mr-2" />
                              Deactivate License
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Clock className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium">No License Active</h3>
                    <p className="text-muted-foreground mt-1 mb-4">
                      Activate a license to view detailed status information
                    </p>
                    <Button onClick={() => setActiveTab("activate")}>
                      <Key className="h-4 w-4 mr-2" />
                      Activate License
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
            
            {/* Validation History */}
            <Card>
              <CardHeader>
                <CardTitle>Validation History</CardTitle>
                <CardDescription>
                  Recent license validation attempts
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center text-muted-foreground py-8">
                  <Clock className="h-8 w-8 mx-auto mb-2" />
                  <p>Validation history will appear here once validations are performed.</p>
                  <p className="text-sm">This feature requires database integration.</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Available Features Tab */}
          <TabsContent value="features" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  Feature Comparison
                </CardTitle>
                <CardDescription>
                  Compare features across different license types
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 font-medium">Feature</th>
                        <th className="text-center py-3 font-medium">Community</th>
                        <th className="text-center py-3 font-medium">Trial</th>
                        <th className="text-center py-3 font-medium">Enterprise</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b">
                        <td className="py-3 font-medium">Basic Dashboard</td>
                        <td className="text-center py-3">
                          <CheckCircle className="h-4 w-4 text-green-500 mx-auto" />
                        </td>
                        <td className="text-center py-3">
                          <CheckCircle className="h-4 w-4 text-green-500 mx-auto" />
                        </td>
                        <td className="text-center py-3">
                          <CheckCircle className="h-4 w-4 text-green-500 mx-auto" />
                        </td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-3 font-medium">Simple Reports</td>
                        <td className="text-center py-3">
                          <CheckCircle className="h-4 w-4 text-green-500 mx-auto" />
                        </td>
                        <td className="text-center py-3">
                          <CheckCircle className="h-4 w-4 text-green-500 mx-auto" />
                        </td>
                        <td className="text-center py-3">
                          <CheckCircle className="h-4 w-4 text-green-500 mx-auto" />
                        </td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-3 font-medium">AI Evidence Analysis</td>
                        <td className="text-center py-3">
                          <XCircle className="h-4 w-4 text-red-500 mx-auto" />
                        </td>
                        <td className="text-center py-3">
                          <CheckCircle className="h-4 w-4 text-green-500 mx-auto" />
                        </td>
                        <td className="text-center py-3">
                          <CheckCircle className="h-4 w-4 text-green-500 mx-auto" />
                        </td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-3 font-medium">Advisor Workbench</td>
                        <td className="text-center py-3">
                          <XCircle className="h-4 w-4 text-red-500 mx-auto" />
                        </td>
                        <td className="text-center py-3">
                          <CheckCircle className="h-4 w-4 text-green-500 mx-auto" />
                        </td>
                        <td className="text-center py-3">
                          <CheckCircle className="h-4 w-4 text-green-500 mx-auto" />
                        </td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-3 font-medium">Enterprise Scalability</td>
                        <td className="text-center py-3">
                          <XCircle className="h-4 w-4 text-red-500 mx-auto" />
                        </td>
                        <td className="text-center py-3">
                          <XCircle className="h-4 w-4 text-red-500 mx-auto" />
                        </td>
                        <td className="text-center py-3">
                          <CheckCircle className="h-4 w-4 text-green-500 mx-auto" />
                        </td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-3 font-medium">On-Premises Deployment</td>
                        <td className="text-center py-3">
                          <XCircle className="h-4 w-4 text-red-500 mx-auto" />
                        </td>
                        <td className="text-center py-3">
                          <XCircle className="h-4 w-4 text-red-500 mx-auto" />
                        </td>
                        <td className="text-center py-3">
                          <CheckCircle className="h-4 w-4 text-green-500 mx-auto" />
                        </td>
                      </tr>
                      <tr>
                        <td className="py-3 font-medium">Priority Support</td>
                        <td className="text-center py-3">
                          <XCircle className="h-4 w-4 text-red-500 mx-auto" />
                        </td>
                        <td className="text-center py-3">
                          <XCircle className="h-4 w-4 text-red-500 mx-auto" />
                        </td>
                        <td className="text-center py-3">
                          <CheckCircle className="h-4 w-4 text-green-500 mx-auto" />
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                
                <div className="mt-6 grid gap-4 md:grid-cols-3">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm">Community</CardTitle>
                      <CardDescription>Free, Open Source</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">$0</div>
                      <p className="text-sm text-muted-foreground mt-1">AGPLv3 License</p>
                      <Button variant="outline" className="w-full mt-4" disabled>
                        Current Edition
                      </Button>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm">Trial</CardTitle>
                      <CardDescription>30-Day Evaluation</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">$0</div>
                      <p className="text-sm text-muted-foreground mt-1">Limited Features</p>
                      <Button variant="outline" className="w-full mt-4">
                        Start Trial
                      </Button>
                    </CardContent>
                  </Card>
                  
                  <Card className="border-primary">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm">Enterprise</CardTitle>
                      <CardDescription>Full Access</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">$99<span className="text-sm font-normal text-muted-foreground">/month</span></div>
                      <p className="text-sm text-muted-foreground mt-1">All Features Included</p>
                      <Button className="w-full mt-4">
                        <CreditCard className="h-4 w-4 mr-2" />
                        Purchase Now
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
            
            {/* Current Features */}
            {licenseStatus?.features && licenseStatus.features.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Your Enabled Features</CardTitle>
                  <CardDescription>
                    Features available with your current license
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
                    {licenseStatus.features.map((feature: string) => (
                      <div key={feature} className="flex items-center gap-2 p-2 border rounded">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span className="text-sm">{feature}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
          
          {/* Help & Support Tab */}
          <TabsContent value="help" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Help & Support
                </CardTitle>
                <CardDescription>
                  Get help with license activation and troubleshooting
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <h3 className="font-medium">Frequently Asked Questions</h3>
                  
                  <div className="space-y-3">
                    <div>
                      <h4 className="font-medium text-sm">Where do I find my license key?</h4>
                      <p className="text-sm text-muted-foreground">
                        Your license key is included in the purchase confirmation email from Gumroad. 
                        You can also find it in your Gumroad library at{" "}
                        <a href="https://app.gumroad.com/library" className="text-primary hover:underline">
                          app.gumroad.com/library
                        </a>.
                      </p>
                    </div>
                    
                    <div>
                      <h4 className="font-medium text-sm">What happens when my trial expires?</h4>
                      <p className="text-sm text-muted-foreground">
                        When your trial expires, you'll revert to the Community edition with basic features. 
                        You can purchase an Enterprise license to continue using premium features.
                      </p>
                    </div>
                    
                    <div>
                      <h4 className="font-medium text-sm">Can I transfer my license to another client?</h4>
                      <p className="text-sm text-muted-foreground">
                        Yes, you can deactivate the license from the current client and activate it on another client. 
                        However, the license can only be active on one client at a time.
                      </p>
                    </div>
                    
                    <div>
                      <h4 className="font-medium text-sm">What's the difference between Community and Enterprise?</h4>
                      <p className="text-sm text-muted-foreground">
                        Community edition is free and open source (AGPLv3) with basic features. 
                        Enterprise edition includes all premium features, priority support, and commercial licensing.
                      </p>
                    </div>
                  </div>
                </div>
                
                <Separator />
                
                <div className="space-y-4">
                  <h3 className="font-medium">Support Resources</h3>
                  
                  <div className="grid gap-3">
                    <Button variant="outline" className="justify-start">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Gumroad Help Center
                    </Button>
                    <Button variant="outline" className="justify-start">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      ComplianceOS Documentation
                    </Button>
                    <Button variant="outline" className="justify-start">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Contact Support
                    </Button>
                  </div>
                </div>
                
                <Separator />
                
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertTitle>Need Help?</AlertTitle>
                  <AlertDescription>
                    If you're experiencing issues with license activation, please contact our support team 
                    with your license key and client information for assistance.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
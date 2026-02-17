/**
 * License Management Admin Page
 * 
 * Admin interface for managing ComplianceOS licenses:
 * - View license activations
 * - Validate licenses
 * - Manage Gumroad integration
 * - View webhook events
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@complianceos/ui/ui/card";
import { trpc } from "@/lib/trpc";
import { Button } from "@complianceos/ui/ui/button";
import { Input } from "@complianceos/ui/ui/input";
import { Label } from "@complianceos/ui/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@complianceos/ui/ui/tabs";
import { Badge } from "@complianceos/ui/ui/badge";
import {
  AlertCircle,
  CheckCircle,
  Clock,
  CreditCard,
  Key,
  RefreshCw,
  Server,
  Shield,
  XCircle,
  Zap,
  ExternalLink
} from "lucide-react";
import { useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@complianceos/ui/ui/alert";
import { Separator } from "@complianceos/ui/ui/separator";
import { getBuildInfo } from "@/lib/features";

export default function LicenseManagementPage() {
  const [licenseKey, setLicenseKey] = useState("");
  const [validationResult, setValidationResult] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("overview");

  // Get build information
  const buildInfo = getBuildInfo();

  // TRPC queries
  const { data: gumroadConfig, refetch: refetchConfig } = trpc.gumroad.getGumroadConfig.useQuery();
  const { data: gumroadStatus, refetch: refetchStatus } = trpc.gumroad.testGumroadConnection.useQuery(undefined, {
    enabled: false, // Don't run automatically
  });
  const { data: gumroadProducts, refetch: refetchProducts } = trpc.gumroad.getProducts.useQuery(undefined, {
    enabled: false, // Don't run automatically
  });

  // Mutations
  const validateLicenseMutation = trpc.gumroad.validateLicense.useMutation({
    onSuccess: (data) => {
      setValidationResult(data);
    },
    onError: (error) => {
      setValidationResult({
        success: false,
        error: error.message,
      });
    },
  });

  const testConnectionMutation = trpc.gumroad.testGumroadConnection.useMutation({
    onSuccess: (data) => {
      refetchStatus();
    },
  });

  // Handle license validation
  const handleValidateLicense = () => {
    if (!licenseKey.trim()) {
      setValidationResult({
        success: false,
        error: "Please enter a license key",
      });
      return;
    }

    validateLicenseMutation.mutate({
      licenseKey: licenseKey.trim(),
      productPermalink: "complianceos-enterprise",
    });
  };

  // Handle connection test
  const handleTestConnection = () => {
    testConnectionMutation.mutate();
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

  return (
    <div className="space-y-6 w-full animate-in fade-in duration-500">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">License Management</h1>
        <p className="text-muted-foreground mt-1">
          Manage ComplianceOS licenses and Gumroad integration
        </p>

        {/* Build Info Banner */}
        <Alert className="mt-4">
          <Shield className="h-4 w-4" />
          <AlertTitle>Build Information</AlertTitle>
          <AlertDescription className="flex items-center gap-4">
            <span>
              <strong>Edition:</strong> {buildInfo.isCommunity ? "AGPLv3 Community" : buildInfo.isTrial ? "Commercial Trial" : "Commercial Enterprise"}
            </span>
            <span>
              <strong>Features:</strong> {buildInfo.featureCount} available
            </span>
            <span>
              <strong>Build Type:</strong> {buildInfo.buildType}
            </span>
          </AlertDescription>
        </Alert>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-[#1C4D8D]/10 p-1.5 h-auto flex flex-wrap justify-start gap-2 w-full border border-[#1C4D8D]/20 rounded-xl">
          <TabsTrigger
            value="overview"
            className="data-[state=active]:bg-[#3ABEF9] data-[state=active]:text-white bg-[#1C4D8D] text-white hover:bg-[#3ABEF9] transition-all font-bold border-none px-4 py-2.5 rounded-lg"
          >
            Overview
          </TabsTrigger>
          <TabsTrigger
            value="validation"
            className="data-[state=active]:bg-[#3ABEF9] data-[state=active]:text-white bg-[#1C4D8D] text-white hover:bg-[#3ABEF9] transition-all font-bold border-none px-4 py-2.5 rounded-lg"
          >
            License Validation
          </TabsTrigger>
          <TabsTrigger
            value="gumroad"
            className="data-[state=active]:bg-[#3ABEF9] data-[state=active]:text-white bg-[#1C4D8D] text-white hover:bg-[#3ABEF9] transition-all font-bold border-none px-4 py-2.5 rounded-lg"
          >
            Gumroad Integration
          </TabsTrigger>
          <TabsTrigger
            value="webhooks"
            className="data-[state=active]:bg-[#3ABEF9] data-[state=active]:text-white bg-[#1C4D8D] text-white hover:bg-[#3ABEF9] transition-all font-bold border-none px-4 py-2.5 rounded-lg"
          >
            Webhooks
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {/* Build Info Card */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Server className="h-4 w-4" />
                  Build Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Edition</span>
                    <span className="text-sm font-medium">
                      {buildInfo.isCommunity ? "Community" : buildInfo.isTrial ? "Trial" : "Enterprise"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">License</span>
                    <span className="text-sm font-medium">
                      {buildInfo.isCommunity ? "AGPLv3" : "Commercial"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Features</span>
                    <span className="text-sm font-medium">
                      {buildInfo.featureCount}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Gumroad Status Card */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <CreditCard className="h-4 w-4" />
                  Gumroad Integration
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Status</span>
                    <span>
                      {gumroadConfig?.isConfigured ? (
                        <Badge variant="default" className="bg-green-100 text-green-800 hover:bg-green-100">
                          Configured
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="border-amber-200 text-amber-800">
                          Not Configured
                        </Badge>
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Access Token</span>
                    <span className="text-sm font-medium">
                      {gumroadConfig?.hasAccessToken ? "✓ Set" : "✗ Missing"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Webhook Secret</span>
                    <span className="text-sm font-medium">
                      {gumroadConfig?.hasWebhookSecret ? "✓ Set" : "✗ Missing"}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions Card */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Zap className="h-4 w-4" />
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => setActiveTab("validation")}
                  >
                    <Key className="h-4 w-4 mr-2" />
                    Validate License
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={handleTestConnection}
                    disabled={testConnectionMutation.isPending}
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Test Gumroad Connection
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => window.open("https://app.gumroad.com/dashboard", "_blank")}
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Open Gumroad Dashboard
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Feature Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Available Features</CardTitle>
              <CardDescription>
                Features available in the current build ({buildInfo.featureCount} total)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
                {buildInfo.features.slice(0, 12).map((feature) => (
                  <div key={feature} className="flex items-center gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="truncate">{feature}</span>
                  </div>
                ))}
                {buildInfo.features.length > 12 && (
                  <div className="text-sm text-muted-foreground">
                    + {buildInfo.features.length - 12} more features...
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* License Validation Tab */}
        <TabsContent value="validation" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>License Validation</CardTitle>
              <CardDescription>
                Validate a Gumroad license key to check its status and features
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="licenseKey">License Key</Label>
                <div className="flex gap-2">
                  <Input
                    id="licenseKey"
                    placeholder="Enter Gumroad license key"
                    value={licenseKey}
                    onChange={(e) => setLicenseKey(e.target.value)}
                    className="flex-1"
                  />
                  <Button
                    onClick={handleValidateLicense}
                    disabled={validateLicenseMutation.isPending}
                  >
                    {validateLicenseMutation.isPending ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Validating...
                      </>
                    ) : (
                      <>
                        <Key className="h-4 w-4 mr-2" />
                        Validate
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {validationResult && (
                <div className="space-y-4">
                  <Separator />

                  <div className="space-y-2">
                    <h3 className="font-medium">Validation Result</h3>

                    {validationResult.success ? (
                      <Alert className="bg-green-50 border-green-200">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <AlertTitle className="text-green-800">License Valid</AlertTitle>
                        <AlertDescription className="text-green-700">
                          <div className="space-y-2">
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <span className="text-sm text-muted-foreground">Type:</span>
                                <div className="font-medium">{validationResult.license?.type || "N/A"}</div>
                              </div>
                              <div>
                                <span className="text-sm text-muted-foreground">Status:</span>
                                <div>{getStatusBadge(validationResult.license?.status)}</div>
                              </div>
                              <div>
                                <span className="text-sm text-muted-foreground">Issued To:</span>
                                <div className="font-medium">{validationResult.license?.issuedTo || "N/A"}</div>
                              </div>
                              <div>
                                <span className="text-sm text-muted-foreground">Expires:</span>
                                <div className="font-medium">
                                  {validationResult.license?.expiresAt
                                    ? formatDate(validationResult.license.expiresAt)
                                    : "Never"}
                                </div>
                              </div>
                            </div>

                            {validationResult.license?.features && (
                              <div>
                                <div className="text-sm text-muted-foreground mb-1">Features:</div>
                                <div className="flex flex-wrap gap-1">
                                  {validationResult.license.features.slice(0, 5).map((feature: string) => (
                                    <Badge key={feature} variant="secondary" className="text-xs">
                                      {feature}
                                    </Badge>
                                  ))}
                                  {validationResult.license.features.length > 5 && (
                                    <Badge variant="outline" className="text-xs">
                                      +{validationResult.license.features.length - 5} more
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        </AlertDescription>
                      </Alert>
                    ) : (
                      <Alert variant="destructive">
                        <XCircle className="h-4 w-4" />
                        <AlertTitle>Validation Failed</AlertTitle>
                        <AlertDescription>
                          {validationResult.error || "Unknown error occurred"}
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Validation History */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Validations</CardTitle>
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

        {/* Gumroad Integration Tab */}
        <TabsContent value="gumroad" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Gumroad Configuration</CardTitle>
              <CardDescription>
                Configure Gumroad API integration for license management
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Connection Status</Label>
                <div className="flex items-center gap-2">
                  {gumroadStatus?.connected ? (
                    <>
                      <CheckCircle className="h-5 w-5 text-green-500" />
                      <span className="font-medium">Connected</span>
                      <Badge variant="outline" className="ml-2">
                        {gumroadStatus.productCount} products
                      </Badge>
                    </>
                  ) : gumroadStatus ? (
                    <>
                      <XCircle className="h-5 w-5 text-red-500" />
                      <span className="font-medium">Not Connected</span>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="h-5 w-5 text-amber-500" />
                      <span className="font-medium">Not Tested</span>
                    </>
                  )}
                </div>

                {gumroadStatus?.message && (
                  <p className="text-sm text-muted-foreground">{gumroadStatus.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Configuration Status</Label>
                <div className="grid gap-2 md:grid-cols-2">
                  <div className="flex items-center gap-2">
                    {gumroadConfig?.hasAccessToken ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-500" />
                    )}
                    <span>Access Token</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {gumroadConfig?.hasWebhookSecret ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-500" />
                    )}
                    <span>Webhook Secret</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {gumroadConfig?.hasProductPermalink ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-amber-500" />
                    )}
                    <span>Product Permalink</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {gumroadConfig?.isConfigured ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-500" />
                    )}
                    <span>Fully Configured</span>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Configuration Instructions</h4>
                  <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
                    <li>Obtain Gumroad access token from your Gumroad account settings</li>
                    <li>Set up webhooks in Gumroad to point to your webhook endpoint</li>
                    <li>Configure environment variables in your deployment</li>
                    <li>Test the connection using the button below</li>
                  </ol>
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={handleTestConnection}
                    disabled={testConnectionMutation.isPending}
                  >
                    {testConnectionMutation.isPending ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Testing...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Test Connection
                      </>
                    )}
                  </Button>

                  <Button
                    variant="outline"
                    onClick={() => refetchProducts()}
                  >
                    List Products
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Gumroad Products */}
          {gumroadProducts && gumroadProducts.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Gumroad Products</CardTitle>
                <CardDescription>
                  Products available in your Gumroad account
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {gumroadProducts.map((product) => (
                    <div key={product.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <div className="font-medium">{product.name}</div>
                        <div className="text-sm text-muted-foreground">{product.permalink}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">${(product.price_cents / 100).toFixed(2)}</div>
                        <div className="text-sm text-muted-foreground">
                          {product.recurrence === "monthly" ? "Monthly" :
                            product.recurrence === "yearly" ? "Yearly" : "One-time"}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Webhooks Tab */}
        <TabsContent value="webhooks" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Webhook Configuration</CardTitle>
              <CardDescription>
                Configure Gumroad webhooks for real-time license updates
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Webhook Endpoint</Label>
                <div className="p-3 bg-muted rounded-md font-mono text-sm">
                  {typeof window !== 'undefined'
                    ? `${window.location.origin}/api/webhooks/gumroad`
                    : "/api/webhooks/gumroad"}
                </div>
                <p className="text-sm text-muted-foreground">
                  Configure this URL in your Gumroad dashboard under Webhooks
                </p>
              </div>

              <div className="space-y-2">
                <Label>Supported Events</Label>
                <div className="grid gap-2 md:grid-cols-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>License Validation</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>Subscription Cancelled</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>Refund</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>Chargeback</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>Sale</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>Subscription Activated</span>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label>Webhook Status</Label>
                <div className="text-center text-muted-foreground py-4">
                  <Server className="h-8 w-8 mx-auto mb-2" />
                  <p>Webhook status monitoring will appear here once webhooks are received.</p>
                  <p className="text-sm">Visit /api/webhooks/gumroad/status for current status.</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Webhook Test */}
          <Card>
            <CardHeader>
              <CardTitle>Test Webhook</CardTitle>
              <CardDescription>
                Test webhook processing with sample data
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Use this to test webhook processing without actual Gumroad events.
                </p>

                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1">
                    Test License Validation
                  </Button>
                  <Button variant="outline" className="flex-1">
                    Test Sale Event
                  </Button>
                </div>

                <div className="text-sm text-muted-foreground">
                  <p>Visit <code>/api/webhooks/gumroad/test</code> to send test webhooks programmatically.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
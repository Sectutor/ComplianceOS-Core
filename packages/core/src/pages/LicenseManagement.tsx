/**
 * License Management Page
 * 
 * Allows users to view their current license, upgrade, and manage license settings.
 */

import React, { useState, useEffect } from 'react';
import { useLicense, FEATURES } from '@/lib/license/index';
import { getMockLicenseServerClient } from '@/lib/license/server';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@complianceos/ui';
import { 
  Button, 
  Input, 
  Label, 
  Separator, 
  Badge,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Alert,
  AlertDescription,
  AlertTitle
} from '@complianceos/ui';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  Zap, 
  Users, 
  Shield, 
  BarChart, 
  Cloud, 
  Key, 
  RefreshCw,
  Download,
  Copy,
  ExternalLink
} from 'lucide-react';
import { toast } from 'sonner';

const LicenseManagement: React.FC = () => {
  const { 
    getLicenseInfo, 
    getLicenseType, 
    isCommunityEdition, 
    isEnterpriseEdition, 
    isTrialEdition,
    validateFeature 
  } = useLicense();
  
  const [licenseInfo, setLicenseInfo] = useState(getLicenseInfo());
  const [licenseKey, setLicenseKey] = useState('');
  const [isActivating, setIsActivating] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  
  const licenseType = getLicenseType();
  const isCommunity = isCommunityEdition();
  const isEnterprise = isEnterpriseEdition();
  const isTrial = isTrialEdition();
  
  // Mock license server client (replace with real one in production)
  const licenseServer = getMockLicenseServerClient();
  
  const handleActivateLicense = async () => {
    if (!licenseKey.trim()) {
      toast.error('Please enter a license key');
      return;
    }
    
    setIsActivating(true);
    
    try {
      const result = await licenseServer.activateLicense({
        licenseKey: licenseKey.trim(),
        userId: 'current-user-id', // Replace with actual user ID
        domain: window.location.hostname
      });
      
      if (result.success && result.license) {
        // In a real implementation, you would update the license validator
        // with the new license information
        toast.success('License activated successfully!');
        setLicenseInfo(result.license);
        setLicenseKey('');
        
        // Reload page to apply new license (in real app, update state)
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      } else {
        toast.error(result.error || 'Failed to activate license');
      }
    } catch (error) {
      toast.error('Error activating license');
      console.error('License activation error:', error);
    } finally {
      setIsActivating(false);
    }
  };
  
  const handleValidateLicense = async () => {
    if (!licenseInfo) {
      toast.error('No license to validate');
      return;
    }
    
    setIsValidating(true);
    
    try {
      // In a real implementation, you would have the activation ID stored
      const result = await licenseServer.validateLicense({
        licenseKey: 'mock-license-key', // Replace with actual license key
        domain: window.location.hostname
      });
      
      if (result.success) {
        if (result.valid) {
          toast.success('License is valid');
        } else {
          toast.error(`License is invalid: ${result.error}`);
        }
        
        if (result.license) {
          setLicenseInfo(result.license);
        }
      } else {
        toast.error(result.error || 'Failed to validate license');
      }
    } catch (error) {
      toast.error('Error validating license');
      console.error('License validation error:', error);
    } finally {
      setIsValidating(false);
    }
  };
  
  const handleCopyLicenseInfo = () => {
    if (!licenseInfo) return;
    
    const licenseText = JSON.stringify(licenseInfo, null, 2);
    navigator.clipboard.writeText(licenseText)
      .then(() => toast.success('License info copied to clipboard'))
      .catch(() => toast.error('Failed to copy license info'));
  };
  
  const handleDownloadLicenseInfo = () => {
    if (!licenseInfo) return;
    
    const licenseText = JSON.stringify(licenseInfo, null, 2);
    const blob = new Blob([licenseText], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `complianceos-license-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success('License info downloaded');
  };
  
  const getLicenseBadge = () => {
    switch (licenseType) {
      case 'community':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Community Edition</Badge>;
      case 'enterprise':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Enterprise Edition</Badge>;
      case 'trial':
        return <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">Trial Edition</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };
  
  const getLicenseStatusBadge = () => {
    if (!licenseInfo) return null;
    
    switch (licenseInfo.status) {
      case 'valid':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Valid</Badge>;
      case 'expired':
        return <Badge variant="destructive">Expired</Badge>;
      case 'invalid':
        return <Badge variant="destructive">Invalid</Badge>;
      case 'suspended':
        return <Badge variant="destructive">Suspended</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };
  
  const getFeatureIcon = (featureId: string) => {
    if (featureId.includes('ai.')) return <Zap className="w-4 h-4" />;
    if (featureId.includes('advisor.')) return <Users className="w-4 h-4" />;
    if (featureId.includes('enterprise.')) return <BarChart className="w-4 h-4" />;
    if (featureId.includes('security.')) return <Shield className="w-4 h-4" />;
    if (featureId.includes('reporting.')) return <BarChart className="w-4 h-4" />;
    if (featureId.includes('integration.')) return <Cloud className="w-4 h-4" />;
    if (featureId.includes('deployment.')) return <Cloud className="w-4 h-4" />;
    return <Key className="w-4 h-4" />;
  };
  
  const getFeatureCategory = (featureId: string) => {
    if (featureId.includes('ai.')) return 'AI Intelligence';
    if (featureId.includes('advisor.')) return 'Advisor Tools';
    if (featureId.includes('enterprise.')) return 'Enterprise Scale';
    if (featureId.includes('security.')) return 'Security & Compliance';
    if (featureId.includes('reporting.')) return 'Professional Reporting';
    if (featureId.includes('integration.')) return 'Integration Ecosystem';
    if (featureId.includes('deployment.')) return 'Deployment Options';
    return 'Other Features';
  };
  
  // Group features by category
  const groupedFeatures = Object.values(FEATURES).reduce((acc, feature) => {
    const category = getFeatureCategory(feature);
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(feature);
    return acc;
  }, {} as Record<string, string[]>);
  
  return (
    <div className="container mx-auto py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">License Management</h1>
        <p className="text-muted-foreground">
          View and manage your ComplianceOS license
        </p>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid grid-cols-3 w-full max-w-md">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="features">Features</TabsTrigger>
          <TabsTrigger value="management">Management</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>License Type</span>
                  {getLicenseBadge()}
                </CardTitle>
                <CardDescription>
                  Your current edition
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Status</span>
                    {getLicenseStatusBadge()}
                  </div>
                  
                  {licenseInfo?.issuedTo && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Issued To</span>
                      <span className="text-sm text-muted-foreground">{licenseInfo.issuedTo}</span>
                    </div>
                  )}
                  
                  {licenseInfo?.issuedAt && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Issued Date</span>
                      <span className="text-sm text-muted-foreground">
                        {new Date(licenseInfo.issuedAt).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                  
                  {licenseInfo?.expiresAt && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Expires</span>
                      <span className="text-sm text-muted-foreground">
                        {new Date(licenseInfo.expiresAt).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
              <CardFooter className="flex flex-col gap-2">
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={handleValidateLicense}
                  disabled={isValidating || isCommunity}
                >
                  <RefreshCw className={`w-4 h-4 mr-2 ${isValidating ? 'animate-spin' : ''}`} />
                  {isValidating ? 'Validating...' : 'Validate License'}
                </Button>
                <p className="text-xs text-center text-muted-foreground">
                  {isCommunity ? 'Community edition doesn\'t require validation' : 'Check license validity with server'}
                </p>
              </CardFooter>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Usage Limits</CardTitle>
                <CardDescription>
                  Your current usage and limits
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {licenseInfo?.maxUsers && (
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium">Users</span>
                        <span className="text-sm text-muted-foreground">
                          {/* In real app, show actual usage */}
                          5 / {licenseInfo.maxUsers}
                        </span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-primary rounded-full" 
                          style={{ width: `${(5 / licenseInfo.maxUsers) * 100}%` }}
                        />
                      </div>
                    </div>
                  )}
                  
                  {licenseInfo?.maxClients && (
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium">Clients</span>
                        <span className="text-sm text-muted-foreground">
                          {/* In real app, show actual usage */}
                          2 / {licenseInfo.maxClients}
                        </span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-primary rounded-full" 
                          style={{ width: `${(2 / licenseInfo.maxClients) * 100}%` }}
                        />
                      </div>
                    </div>
                  )}
                  
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium">Features</span>
                      <span className="text-sm text-muted-foreground">
                        {licenseInfo?.features?.length || 0} available
                      </span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-primary rounded-full" 
                        style={{ width: `${((licenseInfo?.features?.length || 0) / Object.values(FEATURES).length) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => setActiveTab('features')}
                >
                  View All Features
                </Button>
              </CardFooter>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Actions</CardTitle>
                <CardDescription>
                  Manage your license
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button 
                  className="w-full"
                  onClick={handleCopyLicenseInfo}
                  disabled={!licenseInfo}
                >
                  <Copy className="w-4 h-4 mr-2" />
                  Copy License Info
                </Button>
                
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={handleDownloadLicenseInfo}
                  disabled={!licenseInfo}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download License
                </Button>
                
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => window.open('/pricing', '_blank')}
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  View Pricing
                </Button>
              </CardContent>
              <CardFooter>
                <p className="text-xs text-center text-muted-foreground w-full">
                  Need help? <a href="/support" className="text-primary hover:underline">Contact support</a>
                </p>
              </CardFooter>
            </Card>
          </div>
          
          {isCommunity && (
            <Alert>
              <Shield className="h-4 w-4" />
              <AlertTitle>Community Edition</AlertTitle>
              <AlertDescription>
                You're using the free Community Edition (AGPLv3). Upgrade to Enterprise for AI features, 
                white-labeling, enterprise scalability, and professional support.
              </AlertDescription>
            </Alert>
          )}
          
          {isTrial && (
            <Alert className="bg-amber-50 border-amber-200">
              <Clock className="h-4 w-4 text-amber-600" />
              <AlertTitle className="text-amber-800">Trial Edition</AlertTitle>
              <AlertDescription className="text-amber-700">
                You're using a trial license. Some features may be limited. 
                Upgrade to Enterprise for full access before your trial expires.
              </AlertDescription>
            </Alert>
          )}
        </TabsContent>
        
        <TabsContent value="features" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Available Features</CardTitle>
              <CardDescription>
                Features available in your current license
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {Object.entries(groupedFeatures).map(([category, features]) => (
                  <div key={category} className="space-y-3">
                    <div className="flex items-center gap-2">
                      {getFeatureIcon(features[0])}
                      <h3 className="font-semibold">{category}</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {features.map((feature) => {
                        const validation = validateFeature(feature);
                        const isAvailable = validation.isValid;
                        
                        return (
                          <div 
                            key={feature} 
                            className={`p-3 rounded-lg border ${isAvailable ? 'bg-green-50 border-green-200' : 'bg-muted/50 border-muted'}`}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-medium">
                                {feature.split('.').pop()?.replace('_', ' ')}
                              </span>
                              {isAvailable ? (
                                <CheckCircle className="w-4 h-4 text-green-500" />
                              ) : (
                                <XCircle className="w-4 h-4 text-red-500" />
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {isAvailable ? 'Available in your plan' : 'Upgrade required'}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="management" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Activate New License</CardTitle>
              <CardDescription>
                Enter a new license key to upgrade or change your edition
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="license-key">License Key</Label>
                <Input
                  id="license-key"
                  placeholder="Enter your license key (e.g., ENT-XXXX-XXXX-XXXX)"
                  value={licenseKey}
                  onChange={(e) => setLicenseKey(e.target.value)}
                  disabled={isActivating}
                />
                <p className="text-xs text-muted-foreground">
                  You can find your license key in your purchase confirmation email
                </p>
              </div>
              
              <div className="space-y-2">
                <Label>Current Domain</Label>
                <Input
                  value={window.location.hostname}
                  readOnly
                  className="bg-muted"
                />
                <p className="text-xs text-muted-foreground">
                  Licenses are typically bound to a specific domain
                </p>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-4">
              <Button 
                className="w-full"
                onClick={handleActivateLicense}
                disabled={isActivating || !licenseKey.trim()}
              >
                {isActivating ? 'Activating...' : 'Activate License'}
              </Button>
              
              <Separator />
              
              <div className="text-center space-y-2">
                <p className="text-sm text-muted-foreground">
                  Don't have a license key?
                </p>
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => window.open('/pricing', '_blank')}
                >
                  View Pricing & Purchase
                </Button>
              </div>
            </CardFooter>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="text-destructive">Danger Zone</CardTitle>
              <CardDescription>
                Advanced license management actions
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 border border-destructive/20 rounded-lg bg-destructive/5">
                <h4 className="font-medium text-destructive mb-2">Deactivate License</h4>
                <p className="text-sm text-muted-foreground mb-4">
                  Deactivating your license will remove it from this installation. 
                  You can reactivate it later if needed.
                </p>
                <Button 
                  variant="destructive" 
                  size="sm"
                  disabled={isCommunity}
                >
                  Deactivate License
                </Button>
              </div>
              
              <div className="p-4 border border-amber-200 rounded-lg bg-amber-50">
                <h4 className="font-medium text-amber-800 mb-2">Reset License Cache</h4>
                <p className="text-sm text-amber-700 mb-4">
                  Clear the local license cache and revalidate with the license server.
                </p>
                <Button 
                  variant="outline" 
                  size="sm"
                  className="border-amber-300 text-amber-700 hover:bg-amber-100"
                >
                  Reset Cache
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default LicenseManagement;
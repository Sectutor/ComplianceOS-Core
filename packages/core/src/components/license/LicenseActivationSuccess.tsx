/**
 * License Activation Success Component
 * 
 * Displays a success message when a license is activated
 */

import { CheckCircle, ExternalLink, Zap } from "lucide-react";
import { Button } from "@complianceos/ui/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@complianceos/ui/ui/card";
import { Badge } from "@complianceos/ui/ui/badge";
import { Separator } from "@complianceos/ui/ui/separator";

interface LicenseActivationSuccessProps {
  license: {
    type: string;
    status: string;
    issuedTo: string;
    expiresAt?: string;
    features: string[];
    activationId?: string;
  };
  onViewFeatures?: () => void;
  onManageLicense?: () => void;
}

export function LicenseActivationSuccess({ 
  license, 
  onViewFeatures, 
  onManageLicense 
}: LicenseActivationSuccessProps) {
  const formatDate = (dateString?: string) => {
    if (!dateString) return "Never";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

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

  return (
    <Card className="border-green-200 bg-green-50">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="rounded-full bg-green-100 p-2">
            <CheckCircle className="h-6 w-6 text-green-600" />
          </div>
          <div>
            <CardTitle className="text-green-800">License Activated Successfully!</CardTitle>
            <CardDescription className="text-green-700">
              Your license has been activated and premium features are now available.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* License Summary */}
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <div className="text-sm font-medium text-green-800">License Details</div>
            <div className="space-y-1">
              <div className="flex justify-between">
                <span className="text-sm text-green-700">Type</span>
                <span>{getLicenseTypeBadge(license.type)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-green-700">Issued To</span>
                <span className="text-sm font-medium">{license.issuedTo}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-green-700">Expires</span>
                <span className="text-sm font-medium">{formatDate(license.expiresAt)}</span>
              </div>
              {license.activationId && (
                <div className="flex justify-between">
                  <span className="text-sm text-green-700">Activation ID</span>
                  <span className="text-sm font-mono">{license.activationId.substring(0, 12)}...</span>
                </div>
              )}
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="text-sm font-medium text-green-800">Enabled Features</div>
            <div className="space-y-1">
              {license.features.slice(0, 3).map((feature) => (
                <div key={feature} className="flex items-center gap-2">
                  <Zap className="h-3 w-3 text-green-600" />
                  <span className="text-sm text-green-700 truncate">{feature}</span>
                </div>
              ))}
              {license.features.length > 3 && (
                <div className="text-sm text-green-700">
                  + {license.features.length - 3} more features enabled
                </div>
              )}
            </div>
          </div>
        </div>
        
        <Separator className="bg-green-200" />
        
        {/* Actions */}
        <div className="flex gap-2">
          {onViewFeatures && (
            <Button 
              variant="outline" 
              className="border-green-300 text-green-800 hover:bg-green-100"
              onClick={onViewFeatures}
            >
              <Zap className="h-4 w-4 mr-2" />
              View All Features
            </Button>
          )}
          
          {onManageLicense && (
            <Button 
              variant="outline" 
              className="border-green-300 text-green-800 hover:bg-green-100"
              onClick={onManageLicense}
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Manage License
            </Button>
          )}
          
          <Button 
            className="bg-green-600 hover:bg-green-700 text-white"
            onClick={() => window.open("https://app.gumroad.com/library", "_blank")}
          >
            View in Gumroad
          </Button>
        </div>
        
        {/* Next Steps */}
        <div className="rounded-lg bg-green-100 p-3">
          <div className="text-sm font-medium text-green-800 mb-1">Next Steps</div>
          <ul className="text-sm text-green-700 space-y-1 list-disc list-inside">
            <li>Premium features are now available in your dashboard</li>
            <li>Save your license key for future reference</li>
            <li>Contact support if you need assistance</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
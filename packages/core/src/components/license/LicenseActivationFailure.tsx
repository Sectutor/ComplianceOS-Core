/**
 * License Activation Failure Component
 * 
 * Displays an error message when license activation fails
 */

import { AlertCircle, RefreshCw, HelpCircle, ExternalLink } from "lucide-react";
import { Button } from "@complianceos/ui/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@complianceos/ui/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@complianceos/ui/ui/alert";
import { Separator } from "@complianceos/ui/ui/separator";

interface LicenseActivationFailureProps {
  error: string;
  licenseKey?: string;
  onRetry?: () => void;
  onContactSupport?: () => void;
  onPurchaseLicense?: () => void;
}

export function LicenseActivationFailure({ 
  error, 
  licenseKey,
  onRetry, 
  onContactSupport,
  onPurchaseLicense 
}: LicenseActivationFailureProps) {
  // Common error messages and their solutions
  const getErrorDetails = (errorMessage: string) => {
    const lowerError = errorMessage.toLowerCase();
    
    if (lowerError.includes("invalid") || lowerError.includes("not found")) {
      return {
        title: "Invalid License Key",
        description: "The license key you entered could not be found or is invalid.",
        solutions: [
          "Check for typos in your license key",
          "Verify the license key in your Gumroad library",
          "Ensure you're using the correct product license key"
        ]
      };
    }
    
    if (lowerError.includes("expired")) {
      return {
        title: "License Expired",
        description: "This license has expired and is no longer valid.",
        solutions: [
          "Renew your license in Gumroad",
          "Purchase a new license if renewal is not available",
          "Contact support for assistance with expired licenses"
        ]
      };
    }
    
    if (lowerError.includes("already in use") || lowerError.includes("activated")) {
      return {
        title: "License Already Active",
        description: "This license is already activated on another client or system.",
        solutions: [
          "Deactivate the license from the other client first",
          "Purchase additional licenses for multiple clients",
          "Contact support to transfer the license"
        ]
      };
    }
    
    if (lowerError.includes("network") || lowerError.includes("connection")) {
      return {
        title: "Connection Error",
        description: "Unable to connect to the license validation service.",
        solutions: [
          "Check your internet connection",
          "Try again in a few minutes",
          "Contact your system administrator if the issue persists"
        ]
      };
    }
    
    // Default error
    return {
      title: "Activation Failed",
      description: errorMessage,
      solutions: [
        "Verify your license key is correct",
        "Check if your license is still valid",
        "Contact support for further assistance"
      ]
    };
  };
  
  const errorDetails = getErrorDetails(error);
  
  return (
    <Card className="border-red-200 bg-red-50">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="rounded-full bg-red-100 p-2">
            <AlertCircle className="h-6 w-6 text-red-600" />
          </div>
          <div>
            <CardTitle className="text-red-800">{errorDetails.title}</CardTitle>
            <CardDescription className="text-red-700">
              {errorDetails.description}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Error Details */}
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error Details</AlertTitle>
          <AlertDescription className="font-mono text-sm">
            {error}
          </AlertDescription>
        </Alert>
        
        {/* License Key Info */}
        {licenseKey && (
          <div className="rounded-lg bg-red-100 p-3">
            <div className="text-sm font-medium text-red-800 mb-1">License Key Used</div>
            <div className="font-mono text-sm text-red-700 bg-red-200 p-2 rounded truncate">
              {licenseKey}
            </div>
          </div>
        )}
        
        <Separator className="bg-red-200" />
        
        {/* Suggested Solutions */}
        <div>
          <div className="text-sm font-medium text-red-800 mb-2">Suggested Solutions</div>
          <ul className="space-y-2">
            {errorDetails.solutions.map((solution, index) => (
              <li key={index} className="flex items-start gap-2">
                <div className="rounded-full bg-red-200 p-1 mt-0.5">
                  <HelpCircle className="h-3 w-3 text-red-600" />
                </div>
                <span className="text-sm text-red-700">{solution}</span>
              </li>
            ))}
          </ul>
        </div>
        
        <Separator className="bg-red-200" />
        
        {/* Actions */}
        <div className="flex flex-wrap gap-2">
          {onRetry && (
            <Button 
              variant="outline" 
              className="border-red-300 text-red-800 hover:bg-red-100"
              onClick={onRetry}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          )}
          
          {onContactSupport && (
            <Button 
              variant="outline" 
              className="border-red-300 text-red-800 hover:bg-red-100"
              onClick={onContactSupport}
            >
              <HelpCircle className="h-4 w-4 mr-2" />
              Contact Support
            </Button>
          )}
          
          {onPurchaseLicense && (
            <Button 
              variant="outline" 
              className="border-red-300 text-red-800 hover:bg-red-100"
              onClick={onPurchaseLicense}
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Purchase License
            </Button>
          )}
          
          <Button 
            variant="default"
            className="bg-red-600 hover:bg-red-700 text-white"
            onClick={() => window.open("https://app.gumroad.com/library", "_blank")}
          >
            View in Gumroad
          </Button>
        </div>
        
        {/* Additional Help */}
        <div className="rounded-lg bg-red-100 p-3">
          <div className="text-sm font-medium text-red-800 mb-1">Need More Help?</div>
          <div className="text-sm text-red-700 space-y-1">
            <p>If you continue to experience issues, please:</p>
            <ul className="list-disc list-inside ml-2">
              <li>Contact support with your license key and error message</li>
              <li>Check the Gumroad help center for common issues</li>
              <li>Verify your purchase is still active in your Gumroad account</li>
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
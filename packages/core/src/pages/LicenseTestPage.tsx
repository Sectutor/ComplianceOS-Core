/**
 * License Test Page
 * 
 * Simple page to test the license validation system
 */

import React from 'react';
import { LicenseTest } from '@/components/license/LicenseTest';

const LicenseTestPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">License Validation Test</h1>
          <p className="text-muted-foreground">
            Test page for the ComplianceOS license validation system
          </p>
        </div>
        
        <LicenseTest />
        
        <div className="mt-8 p-6 border rounded-lg bg-muted/50">
          <h2 className="text-xl font-semibold mb-4">Testing Instructions</h2>
          <div className="space-y-3">
            <div>
              <h3 className="font-medium">Community Edition (Default)</h3>
              <p className="text-sm text-muted-foreground">
                Set <code className="bg-muted px-1 rounded">VITE_ENABLE_PREMIUM=false</code> or don't set it
              </p>
            </div>
            <div>
              <h3 className="font-medium">Enterprise Edition</h3>
              <p className="text-sm text-muted-foreground">
                Set <code className="bg-muted px-1 rounded">VITE_ENABLE_PREMIUM=true</code> and <code className="bg-muted px-1 rounded">VITE_LICENSE_KEY=ENT-123456-7890-ABCD</code>
              </p>
            </div>
            <div>
              <h3 className="font-medium">Trial Edition</h3>
              <p className="text-sm text-muted-foreground">
                Set <code className="bg-muted px-1 rounded">VITE_ENABLE_PREMIUM=true</code> without a license key
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LicenseTestPage;
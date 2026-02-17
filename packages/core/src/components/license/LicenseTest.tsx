/**
 * Test component to verify license validation system works
 */

import React from 'react';
import { useLicense, FEATURES } from '@/lib/license/index';
import { PremiumSlotEnhanced } from '../PremiumSlotEnhanced';
import { LicenseProtectedButton } from './LicenseProtectedButton';
import { UpgradePrompt } from './UpgradePrompt';

export const LicenseTest: React.FC = () => {
  const { 
    hasFeature, 
    getLicenseType, 
    isCommunityEdition, 
    isEnterpriseEdition, 
    isTrialEdition 
  } = useLicense();
  
  const licenseType = getLicenseType();
  const isCommunity = isCommunityEdition();
  const isEnterprise = isEnterpriseEdition();
  const isTrial = isTrialEdition();
  
  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      <div className="bg-card border rounded-lg p-6">
        <h2 className="text-2xl font-bold mb-4">License Validation System Test</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className={`p-4 rounded-lg ${isCommunity ? 'bg-blue-50 border-blue-200' : 'bg-muted'}`}>
            <h3 className="font-semibold mb-2">Community Edition</h3>
            <p className="text-sm">AGPLv3, Free & Open Source</p>
            <div className="mt-2 text-xs font-medium">
              Status: {isCommunity ? '✓ Active' : '✗ Inactive'}
            </div>
          </div>
          
          <div className={`p-4 rounded-lg ${isEnterprise ? 'bg-green-50 border-green-200' : 'bg-muted'}`}>
            <h3 className="font-semibold mb-2">Enterprise Edition</h3>
            <p className="text-sm">Commercial License</p>
            <div className="mt-2 text-xs font-medium">
              Status: {isEnterprise ? '✓ Active' : '✗ Inactive'}
            </div>
          </div>
          
          <div className={`p-4 rounded-lg ${isTrial ? 'bg-amber-50 border-amber-200' : 'bg-muted'}`}>
            <h3 className="font-semibold mb-2">Trial Edition</h3>
            <p className="text-sm">Limited-time Trial</p>
            <div className="mt-2 text-xs font-medium">
              Status: {isTrial ? '✓ Active' : '✗ Inactive'}
            </div>
          </div>
        </div>
        
        <div className="space-y-4">
          <div className="p-4 border rounded-lg">
            <h3 className="font-semibold mb-2">Feature Checks</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              <div className={`p-2 rounded text-sm ${hasFeature(FEATURES.AI_EVIDENCE_ANALYSIS) ? 'bg-green-100' : 'bg-red-100'}`}>
                AI Evidence Analysis: {hasFeature(FEATURES.AI_EVIDENCE_ANALYSIS) ? '✓' : '✗'}
              </div>
              <div className={`p-2 rounded text-sm ${hasFeature(FEATURES.AI_RISK_TRIAGE) ? 'bg-green-100' : 'bg-red-100'}`}>
                AI Risk Triage: {hasFeature(FEATURES.AI_RISK_TRIAGE) ? '✓' : '✗'}
              </div>
              <div className={`p-2 rounded text-sm ${hasFeature(FEATURES.WHITE_LABEL_BRANDING) ? 'bg-green-100' : 'bg-red-100'}`}>
                White-label: {hasFeature(FEATURES.WHITE_LABEL_BRANDING) ? '✓' : '✗'}
              </div>
              <div className={`p-2 rounded text-sm ${hasFeature(FEATURES.ENTERPRISE_SCALABILITY) ? 'bg-green-100' : 'bg-red-100'}`}>
                Enterprise Scale: {hasFeature(FEATURES.ENTERPRISE_SCALABILITY) ? '✓' : '✗'}
              </div>
            </div>
          </div>
          
          <div className="p-4 border rounded-lg">
            <h3 className="font-semibold mb-2">PremiumSlotEnhanced Test</h3>
            <PremiumSlotEnhanced
              featureId="ai.evidence_analysis"
              title="AI Evidence Analysis"
              description="Test of the enhanced premium slot component"
              requiredFeatures={FEATURES.AI_EVIDENCE_ANALYSIS}
            >
              <div className="p-4 bg-green-50 border border-green-200 rounded">
                <p className="text-green-800">This content would show if you had the AI Evidence Analysis feature.</p>
              </div>
            </PremiumSlotEnhanced>
          </div>
          
          <div className="p-4 border rounded-lg">
            <h3 className="font-semibold mb-2">LicenseProtectedButton Test</h3>
            <div className="space-x-4">
              <LicenseProtectedButton
                feature={FEATURES.AI_EVIDENCE_ANALYSIS}
                onClick={() => alert('AI Analysis clicked!')}
              >
                Analyze with AI
              </LicenseProtectedButton>
              
              <LicenseProtectedButton
                feature={FEATURES.WHITE_LABEL_BRANDING}
                variant="outline"
                onClick={() => alert('White-label clicked!')}
              >
                Customize Branding
              </LicenseProtectedButton>
            </div>
          </div>
          
          <div className="p-4 border rounded-lg">
            <h3 className="font-semibold mb-2">UpgradePrompt Test</h3>
            <UpgradePrompt
              trigger={
                <button className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90">
                  Test Upgrade Prompt
                </button>
              }
              featureId="ai.evidence_analysis"
              featureName="AI Evidence Analysis"
              featureDescription="Test description of the AI feature"
            />
          </div>
        </div>
        
        <div className="mt-6 p-4 bg-muted rounded-lg">
          <h3 className="font-semibold mb-2">Environment Variables</h3>
          <div className="text-sm font-mono space-y-1">
            <div>VITE_ENABLE_PREMIUM: {import.meta.env.VITE_ENABLE_PREMIUM || 'not set'}</div>
            <div>VITE_LICENSE_KEY: {import.meta.env.VITE_LICENSE_KEY ? '*** set ***' : 'not set'}</div>
            <div>License Type: {licenseType}</div>
          </div>
        </div>
      </div>
    </div>
  );
};
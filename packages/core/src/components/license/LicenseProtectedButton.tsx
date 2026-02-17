/**
 * Example: License-protected button component
 * 
 * Shows how to integrate license validation with existing premium components
 */

import React from 'react';
import { Button, ButtonProps } from '@complianceos/ui';
import { Lock, Zap } from 'lucide-react';
import { useLicense, FEATURES } from '@/lib/license/index';
import { PremiumSlotEnhanced } from '../PremiumSlotEnhanced';

interface LicenseProtectedButtonProps extends ButtonProps {
  feature: string | string[];
  children: React.ReactNode;
  showLockIcon?: boolean;
  showUpgradeOnClick?: boolean;
  upgradeMessage?: string;
}

/**
 * Button that's disabled or shows upgrade prompt based on license
 */
export const LicenseProtectedButton: React.FC<LicenseProtectedButtonProps> = ({
  feature,
  children,
  showLockIcon = true,
  showUpgradeOnClick = true,
  upgradeMessage = 'Upgrade to access this feature',
  onClick,
  disabled,
  ...props
}) => {
  const { hasFeature } = useLicense();
  const hasAccess = hasFeature(feature);
  
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!hasAccess && showUpgradeOnClick) {
      e.preventDefault();
      e.stopPropagation();
      // Show upgrade modal or redirect
      window.open('/settings/billing', '_blank');
      return;
    }
    
    if (onClick) {
      onClick(e);
    }
  };
  
  if (!hasAccess) {
    return (
      <Button
        {...props}
        onClick={handleClick}
        disabled={disabled || !hasAccess}
        variant={props.variant || 'outline'}
        className={`relative ${props.className || ''}`}
      >
        {showLockIcon && <Lock className="w-3 h-3 mr-2" />}
        {children}
        <span className="absolute -top-2 -right-2">
          <span className="bg-amber-100 text-amber-800 text-xs px-1.5 py-0.5 rounded-full">
            Premium
          </span>
        </span>
      </Button>
    );
  }
  
  return (
    <Button
      {...props}
      onClick={handleClick}
      disabled={disabled}
    >
      {children}
    </Button>
  );
};

/**
 * AI-specific protected button
 */
export const AIProtectedButton: React.FC<Omit<LicenseProtectedButtonProps, 'feature'>> = (props) => {
  return (
    <LicenseProtectedButton
      feature={FEATURES.AI_EVIDENCE_ANALYSIS}
      showLockIcon={false}
      {...props}
    >
      <Zap className="w-4 h-4 mr-2" />
      {props.children}
    </LicenseProtectedButton>
  );
};

/**
 * Advisor-specific protected button
 */
export const AdvisorProtectedButton: React.FC<Omit<LicenseProtectedButtonProps, 'feature'>> = (props) => {
  return (
    <LicenseProtectedButton
      feature={FEATURES.ADVISOR_WORKBENCH}
      showLockIcon={false}
      {...props}
    >
      {props.children}
    </LicenseProtectedButton>
  );
};

/**
 * Example: Updated EvidenceAnalysisButton with license protection
 */
export const LicenseProtectedEvidenceAnalysisButton: React.FC<any> = (props) => {
  const { hasFeature } = useLicense();
  
  if (!hasFeature(FEATURES.AI_EVIDENCE_ANALYSIS)) {
    return (
      <PremiumSlotEnhanced
        featureId="ai.evidence_analysis"
        title="AI Evidence Analysis"
        description="Use AI to automatically analyze evidence for compliance"
        upgradeButtonText="Upgrade for AI Analysis"
      >
        {/* This won't render because feature is not available */}
        <div />
      </PremiumSlotEnhanced>
    );
  }
  
  // Import and render the actual component
  const EvidenceAnalysisButton = require('../EvidenceAnalysisButton').default;
  return <EvidenceAnalysisButton {...props} />;
};

/**
 * HOC to wrap any component with license protection
 */
export function withLicenseProtection<T>(
  WrappedComponent: React.ComponentType<T>,
  requiredFeature: string | string[]
): React.ComponentType<T> {
  return (props: T) => {
    const { hasFeature } = useLicense();
    
    if (!hasFeature(requiredFeature)) {
      const featureId = Array.isArray(requiredFeature) ? requiredFeature[0] : requiredFeature;
      const featureName = featureId.split('.').pop()?.replace('_', ' ') || 'Premium Feature';
      
      return (
        <PremiumSlotEnhanced
          featureId={featureId}
          title={`${featureName} Required`}
          description={`This feature requires an enterprise license`}
          requiredFeatures={requiredFeature}
        >
          {/* Empty children since feature is not available */}
          <div />
        </PremiumSlotEnhanced>
      );
    }
    
    return <WrappedComponent {...props} />;
  };
}

/**
 * Utility hook for license-protected actions
 */
export function useLicenseProtectedAction(feature: string | string[]) {
  const { hasFeature } = useLicense();
  
  const checkLicense = (): boolean => {
    if (!hasFeature(feature)) {
      // Show upgrade prompt
      const upgradeModal = document.createElement('div');
      upgradeModal.innerHTML = `
        <div style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 9999;">
          <div style="background: white; padding: 24px; border-radius: 8px; max-width: 400px;">
            <h3 style="margin: 0 0 16px 0;">Upgrade Required</h3>
            <p style="margin: 0 0 24px 0;">This feature requires an enterprise license.</p>
            <button onclick="window.open('/settings/billing', '_blank'); this.parentElement.parentElement.remove()" style="background: #3b82f6; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer;">
              Upgrade Now
            </button>
            <button onclick="this.parentElement.parentElement.remove()" style="background: transparent; border: 1px solid #d1d5db; padding: 8px 16px; border-radius: 4px; cursor: pointer; margin-left: 8px;">
              Cancel
            </button>
          </div>
        </div>
      `;
      document.body.appendChild(upgradeModal);
      return false;
    }
    
    return true;
  };
  
  return { checkLicense, hasAccess: hasFeature(feature) };
}
/**
 * Enhanced PremiumSlot component with license validation integration
 * 
 * This component replaces the existing PremiumSlot with more sophisticated
 * license checking and upgrade prompts.
 */

import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@complianceos/ui';
import { Button } from '@complianceos/ui';
import { Lock, Zap, Shield, Users, BarChart, Cloud, CheckCircle, XCircle, Clock } from 'lucide-react';
import { useLicense, FEATURES, Feature } from '@/lib/license/index';

interface PremiumSlotEnhancedProps {
  featureId: string;
  title: string;
  description: string;
  requiredFeatures?: Feature | Feature[];
  children?: React.ReactNode;
  showTrialInfo?: boolean;
  upgradeButtonText?: string;
  upgradeButtonVariant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  className?: string;
}

/**
 * Get feature category icon
 */
const getFeatureIcon = (featureId: string) => {
  if (featureId.includes('ai.')) return <Zap className="w-5 h-5" />;
  if (featureId.includes('advisor.')) return <Users className="w-5 h-5" />;
  if (featureId.includes('enterprise.')) return <BarChart className="w-5 h-5" />;
  if (featureId.includes('security.')) return <Shield className="w-5 h-5" />;
  if (featureId.includes('reporting.')) return <BarChart className="w-5 h-5" />;
  if (featureId.includes('integration.')) return <Cloud className="w-5 h-5" />;
  if (featureId.includes('deployment.')) return <Cloud className="w-5 h-5" />;
  return <Lock className="w-5 h-5" />;
};

/**
 * Get feature category name
 */
const getFeatureCategory = (featureId: string) => {
  if (featureId.includes('ai.')) return 'AI Intelligence';
  if (featureId.includes('advisor.')) return 'Advisor Tools';
  if (featureId.includes('enterprise.')) return 'Enterprise Scale';
  if (featureId.includes('security.')) return 'Security & Compliance';
  if (featureId.includes('reporting.')) return 'Professional Reporting';
  if (featureId.includes('integration.')) return 'Integration Ecosystem';
  if (featureId.includes('deployment.')) return 'Deployment Options';
  return 'Premium Feature';
};

/**
 * Get upgrade URL based on feature category
 */
const getUpgradeUrl = (featureId: string) => {
  if (featureId.includes('ai.')) return '/settings/billing?feature=ai';
  if (featureId.includes('advisor.')) return '/settings/billing?feature=advisor';
  if (featureId.includes('enterprise.')) return '/settings/billing?feature=enterprise';
  if (featureId.includes('security.')) return '/settings/billing?feature=security';
  if (featureId.includes('reporting.')) return '/settings/billing?feature=reporting';
  if (featureId.includes('integration.')) return '/settings/billing?feature=integration';
  if (featureId.includes('deployment.')) return '/settings/billing?feature=deployment';
  return '/settings/billing';
};

export const PremiumSlotEnhanced: React.FC<PremiumSlotEnhancedProps> = ({
  featureId,
  title,
  description,
  requiredFeatures = featureId,
  children,
  showTrialInfo = true,
  upgradeButtonText,
  upgradeButtonVariant = 'default',
  className = '',
}) => {
  const { hasFeature, validateFeature, getLicenseType, isTrialEdition } = useLicense();
  
  // Check if all required features are available
  const validationResult = validateFeature(requiredFeatures);
  const hasRequiredFeatures = validationResult.isValid;
  const licenseType = getLicenseType();
  const isTrial = isTrialEdition();
  
  // If features are available, render the children
  if (hasRequiredFeatures && children) {
    return <>{children}</>;
  }
  
  // Get missing features for display
  const missingFeatures = validationResult.missingFeatures || [];
  const featureIcon = getFeatureIcon(featureId);
  const featureCategory = getFeatureCategory(featureId);
  const upgradeUrl = getUpgradeUrl(featureId);
  
  // Determine button text
  const buttonText = upgradeButtonText || 
    (isTrial ? 'Upgrade to Enterprise' : 'Upgrade to Premium');
  
  // Determine card variant based on license type
  const cardVariant = isTrial ? 'trial' : 'locked';
  
  return (
    <Card className={`border-dashed border-2 ${isTrial ? 'border-amber-200 bg-amber-50' : 'border-muted bg-muted/50'} ${className}`}>
      <CardHeader className="text-center">
        <div className={`mx-auto p-3 rounded-full w-fit mb-4 ${isTrial ? 'bg-amber-100' : 'bg-primary/10'}`}>
          <div className={`${isTrial ? 'text-amber-600' : 'text-primary'}`}>
            {featureIcon}
          </div>
        </div>
        <CardTitle className="flex items-center justify-center gap-2">
          {title}
          {isTrial && (
            <span className="text-xs bg-amber-100 text-amber-800 px-2 py-1 rounded-full">
              Trial
            </span>
          )}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
        
        {missingFeatures.length > 0 && (
          <div className="mt-4 text-sm text-left">
            <p className="font-medium mb-2">Required features:</p>
            <ul className="space-y-1">
              {missingFeatures.map((feature, index) => (
                <li key={index} className="flex items-center gap-2">
                  <XCircle className="w-4 h-4 text-red-500" />
                  <span className="text-muted-foreground">
                    {getFeatureCategory(feature)}: {feature.split('.').pop()?.replace('_', ' ')}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardHeader>
      
      <CardContent className="space-y-4">
        {showTrialInfo && isTrial && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Clock className="w-5 h-5 text-amber-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-amber-800">Trial Mode Active</h4>
                <p className="text-sm text-amber-700 mt-1">
                  You're currently using a trial license. Some features may be limited.
                  Upgrade to enterprise for full access.
                </p>
              </div>
            </div>
          </div>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <h4 className="font-medium text-sm">Community Edition</h4>
            <ul className="space-y-1 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span>Free & Open Source</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span>Self-hosted</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span>Basic GRC Features</span>
              </li>
              <li className="flex items-center gap-2">
                <XCircle className="w-4 h-4 text-red-500" />
                <span>No AI Features</span>
              </li>
              <li className="flex items-center gap-2">
                <XCircle className="w-4 h-4 text-red-500" />
                <span>No White-labeling</span>
              </li>
            </ul>
          </div>
          
          <div className="space-y-2">
            <h4 className="font-medium text-sm">Enterprise Edition</h4>
            <ul className="space-y-1 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span>AI-Powered Intelligence</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span>White-label Branding</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span>Enterprise Scalability</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span>Professional Support</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span>Commercial License</span>
              </li>
            </ul>
          </div>
        </div>
      </CardContent>
      
      <CardFooter className="flex flex-col gap-4">
        <Button 
          onClick={() => window.open(upgradeUrl, '_blank')}
          variant={upgradeButtonVariant}
          className="w-full"
          size="lg"
        >
          {buttonText}
        </Button>
        
        <div className="text-xs text-center text-muted-foreground">
          {licenseType === 'community' ? (
            <p>This feature requires an Enterprise license. <a href="/pricing" className="text-primary hover:underline">View pricing</a></p>
          ) : licenseType === 'trial' ? (
            <p>Your trial license doesn't include this feature. <a href="/pricing" className="text-primary hover:underline">Upgrade now</a></p>
          ) : (
            <p>Your current license doesn't include this feature. <a href="/settings/billing" className="text-primary hover:underline">Manage subscription</a></p>
          )}
        </div>
        
        {featureCategory && (
          <div className="text-xs text-center">
            <span className="inline-block bg-muted px-2 py-1 rounded">
              Category: {featureCategory}
            </span>
          </div>
        )}
      </CardFooter>
    </Card>
  );
};

/**
 * Feature-specific premium slot components
 */

interface AIPremiumSlotProps extends Omit<PremiumSlotEnhancedProps, 'requiredFeatures' | 'featureId'> {
  aiFeature?: 'evidence_analysis' | 'risk_triage' | 'policy_drafting' | 'control_guidance' | 'gap_analysis' | 'multi_llm';
}

export const AIPremiumSlot: React.FC<AIPremiumSlotProps> = ({
  aiFeature = 'evidence_analysis',
  ...props
}) => {
  const featureMap = {
    evidence_analysis: FEATURES.AI_EVIDENCE_ANALYSIS,
    risk_triage: FEATURES.AI_RISK_TRIAGE,
    policy_drafting: FEATURES.AI_POLICY_DRAFTING,
    control_guidance: FEATURES.AI_CONTROL_GUIDANCE,
    gap_analysis: FEATURES.AI_GAP_ANALYSIS,
    multi_llm: FEATURES.AI_MULTI_LLM,
  };
  
  return (
    <PremiumSlotEnhanced
      featureId={`ai.${aiFeature}`}
      requiredFeatures={featureMap[aiFeature]}
      {...props}
    />
  );
};

interface AdvisorPremiumSlotProps extends Omit<PremiumSlotEnhancedProps, 'requiredFeatures' | 'featureId'> {
  advisorFeature?: 'workbench' | 'white_label' | 'multi_tenant' | 'template_deployment';
}

export const AdvisorPremiumSlot: React.FC<AdvisorPremiumSlotProps> = ({
  advisorFeature = 'workbench',
  ...props
}) => {
  const featureMap = {
    workbench: FEATURES.ADVISOR_WORKBENCH,
    white_label: FEATURES.WHITE_LABEL_BRANDING,
    multi_tenant: FEATURES.MULTI_TENANT_MGMT,
    template_deployment: FEATURES.TEMPLATE_DEPLOYMENT,
  };
  
  return (
    <PremiumSlotEnhanced
      featureId={`advisor.${advisorFeature}`}
      requiredFeatures={featureMap[advisorFeature]}
      {...props}
    />
  );
};

interface EnterprisePremiumSlotProps extends Omit<PremiumSlotEnhancedProps, 'requiredFeatures' | 'featureId'> {
  enterpriseFeature?: 'scalability' | 'redis' | 'connection_pooling' | 'read_replica';
}

export const EnterprisePremiumSlot: React.FC<EnterprisePremiumSlotProps> = ({
  enterpriseFeature = 'scalability',
  ...props
}) => {
  const featureMap = {
    scalability: FEATURES.ENTERPRISE_SCALABILITY,
    redis: FEATURES.REDIS_CACHING,
    connection_pooling: FEATURES.CONNECTION_POOLING,
    read_replica: FEATURES.READ_REPLICA_SUPPORT,
  };
  
  return (
    <PremiumSlotEnhanced
      featureId={`enterprise.${enterpriseFeature}`}
      requiredFeatures={featureMap[enterpriseFeature]}
      {...props}
    />
  );
};

/**
 * Utility component to conditionally render based on license
 */
export const WithLicense: React.FC<{
  feature: Feature | Feature[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
}> = ({ feature, children, fallback }) => {
  const { hasFeature } = useLicense();
  
  if (hasFeature(feature)) {
    return <>{children}</>;
  }
  
  return <>{fallback || null}</>;
};

/**
 * HOC for license-protected components
 */
export function withLicense<T>(
  feature: Feature | Feature[],
  Component: React.ComponentType<T>,
  FallbackComponent?: React.ComponentType<T>
): React.ComponentType<T> {
  return (props: T) => {
    const { hasFeature } = useLicense();
    
    if (hasFeature(feature)) {
      return <Component {...props} />;
    }
    
    if (FallbackComponent) {
      return <FallbackComponent {...props} />;
    }
    
    return null;
  };
}
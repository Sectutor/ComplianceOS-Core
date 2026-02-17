/**
 * Upgrade Prompt Components
 * 
 * Various ways to prompt users to upgrade from Community to Enterprise edition
 */

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@complianceos/ui';
import { Button } from '@complianceos/ui';
import { Badge } from '@complianceos/ui';
import {
  Zap,
  Users,
  Shield,
  BarChart,
  Cloud,
  CheckCircle,
  XCircle,
  Lock,
  ArrowRight,
  Sparkles,
  Crown,
  Rocket,
} from 'lucide-react';
import { useLicense } from '@/lib/license/index';

interface UpgradePromptProps {
  trigger?: React.ReactNode;
  featureId?: string;
  featureName?: string;
  featureDescription?: string;
  showTrialOption?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

/**
 * Main upgrade prompt modal
 */
export const UpgradePrompt: React.FC<UpgradePromptProps> = ({
  trigger,
  featureId = 'premium.feature',
  featureName = 'Premium Feature',
  featureDescription = 'This feature requires an Enterprise license',
  showTrialOption = true,
  size = 'md',
}) => {
  const [open, setOpen] = useState(false);
  const { isCommunityEdition, isTrialEdition } = useLicense();

  const isCommunity = isCommunityEdition();
  const isTrial = isTrialEdition();

  const getFeatureIcon = () => {
    if (featureId.includes('ai.')) return <Zap className="w-6 h-6" />;
    if (featureId.includes('advisor.')) return <Users className="w-6 h-6" />;
    if (featureId.includes('enterprise.')) return <BarChart className="w-6 h-6" />;
    if (featureId.includes('security.')) return <Shield className="w-6 h-6" />;
    if (featureId.includes('reporting.')) return <BarChart className="w-6 h-6" />;
    if (featureId.includes('integration.')) return <Cloud className="w-6 h-6" />;
    return <Lock className="w-6 h-6" />;
  };

  const getDialogSize = () => {
    switch (size) {
      case 'sm': return 'max-w-md';
      case 'lg': return 'max-w-2xl';
      default: return 'max-w-lg';
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}

      <DialogContent className={`${getDialogSize()} max-h-[90vh] overflow-y-auto`}>
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-primary/10 rounded-lg">
              {getFeatureIcon()}
            </div>
            <div>
              <DialogTitle className="flex items-center gap-2">
                {featureName}
                {isTrial && (
                  <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                    Trial
                  </Badge>
                )}
              </DialogTitle>
              <DialogDescription>
                {featureDescription}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Feature highlight */}
          <div className="bg-muted/50 p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-4 h-4 text-primary" />
              <h4 className="font-medium">What you get with Enterprise:</h4>
            </div>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span>AI-Powered Intelligence Suite</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span>White-label Branding & Customization</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span>Enterprise Scalability (10,000+ users)</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span>Professional Support & SLA</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span>Commercial Use Rights</span>
              </li>
            </ul>
          </div>

          {/* Edition comparison */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="border rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full" />
                <h4 className="font-medium">Community Edition</h4>
              </div>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>Free & Open Source (AGPLv3)</span>
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

            <div className="border border-primary/20 rounded-lg p-4 bg-primary/5">
              <div className="flex items-center gap-2 mb-3">
                <Crown className="w-4 h-4 text-primary" />
                <h4 className="font-medium">Enterprise Edition</h4>
              </div>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>Federal Compliance (FedRAMP, CMMC)</span>
                </li>
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

          {/* Pricing info */}
          <div className="bg-muted/30 p-4 rounded-lg">
            <h4 className="font-medium mb-2">Pricing</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-3 border rounded-lg">
                <div className="font-bold text-2xl">$199<span className="text-sm font-normal text-muted-foreground">/mo</span></div>
                <div className="text-sm font-medium mt-1">Per Advisor</div>
                <div className="text-xs text-muted-foreground mt-1">For consultants & MSPs</div>
              </div>
              <div className="text-center p-3 border rounded-lg bg-primary/5 border-primary/20">
                <div className="font-bold text-2xl">$999<span className="text-sm font-normal text-muted-foreground">/mo</span></div>
                <div className="text-sm font-medium mt-1">Enterprise</div>
                <div className="text-xs text-muted-foreground mt-1">Unlimited users & clients</div>
              </div>
              <div className="text-center p-3 border rounded-lg">
                <div className="font-bold text-2xl">Custom</div>
                <div className="text-sm font-medium mt-1">On-Premises</div>
                <div className="text-xs text-muted-foreground mt-1">Air-gapped deployments</div>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="flex flex-col sm:flex-row gap-3">
          {showTrialOption && !isTrial && (
            <Button
              variant="outline"
              className="sm:flex-1"
              onClick={() => {
                setOpen(false);
                window.open('/start-trial', '_blank');
              }}
            >
              <Rocket className="w-4 h-4 mr-2" />
              Start 30-Day Trial
            </Button>
          )}

          <Button
            className="sm:flex-1"
            onClick={() => {
              setOpen(false);
              window.open('/pricing', '_blank');
            }}
          >
            View Pricing & Upgrade
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>

          <Button
            variant="ghost"
            onClick={() => setOpen(false)}
          >
            Maybe Later
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog >
  );
};

/**
 * Inline upgrade prompt (small banner)
 */
export const InlineUpgradePrompt: React.FC<{
  featureName?: string;
  compact?: boolean;
}> = ({ featureName = 'this feature', compact = false }) => {
  const { isCommunityEdition } = useLicense();

  if (!isCommunityEdition()) return null;

  if (compact) {
    return (
      <div className="inline-flex items-center gap-1 text-xs bg-amber-50 text-amber-800 px-2 py-1 rounded">
        <Lock className="w-3 h-3" />
        <span>Upgrade for {featureName}</span>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between p-3 bg-gradient-to-r from-amber-50 to-amber-100 border border-amber-200 rounded-lg">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-amber-100 rounded-lg">
          <Crown className="w-5 h-5 text-amber-600" />
        </div>
        <div>
          <h4 className="font-medium text-amber-900">Upgrade to Enterprise</h4>
          <p className="text-sm text-amber-700">
            Unlock {featureName} and all premium features
          </p>
        </div>
      </div>
      <Button
        size="sm"
        variant="outline"
        className="border-amber-300 text-amber-700 hover:bg-amber-100"
        onClick={() => window.open('/pricing', '_blank')}
      >
        Upgrade Now
      </Button>
    </div>
  );
};

/**
 * Floating upgrade button (for persistent prompts)
 */
export const FloatingUpgradeButton: React.FC = () => {
  const { isCommunityEdition } = useLicense();

  if (!isCommunityEdition()) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <UpgradePrompt
        trigger={
          <Button className="rounded-full shadow-lg h-12 w-12 p-0">
            <Crown className="w-5 h-5" />
          </Button>
        }
        size="lg"
      />
    </div>
  );
};

/**
 * Feature teaser component (shows feature but requires upgrade to use)
 */
export const FeatureTeaser: React.FC<{
  title: string;
  description: string;
  icon: React.ReactNode;
  actionText?: string;
}> = ({ title, description, icon, actionText = 'Upgrade to Use' }) => {
  return (
    <div className="relative group">
      <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-primary/10 rounded-lg blur-sm group-hover:blur-md transition-all duration-300" />
      <div className="relative bg-background border border-primary/20 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            {icon}
          </div>
          <div className="flex-1">
            <h4 className="font-medium">{title}</h4>
            <p className="text-sm text-muted-foreground mt-1">{description}</p>
          </div>
          <UpgradePrompt
            trigger={
              <Button size="sm" variant="outline">
                {actionText}
              </Button>
            }
            featureName={title}
            featureDescription={description}
          />
        </div>
      </div>
    </div>
  );
};

/**
 * Usage: Example of how to use these components
 * 
 * 1. For a button that requires upgrade:
 *    <UpgradePrompt
 *      trigger={<Button>Analyze with AI</Button>}
 *      featureId="ai.evidence_analysis"
 *      featureName="AI Evidence Analysis"
 *    />
 * 
 * 2. For inline upgrade notice:
 *    <InlineUpgradePrompt featureName="AI analysis" />
 * 
 * 3. For feature teaser:
 *    <FeatureTeaser
 *      title="AI Risk Triage"
 *      description="Automatically triage risks with AI"
 *      icon={<Zap className="w-6 h-6" />}
 *    />
 */